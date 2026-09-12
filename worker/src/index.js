/* ===== 放課後の居残り: 部屋登録・検索・クイックプレイ用リレー(Cloudflare Worker) =====
   このWorkerは「試合の中身」は一切計算しない。今まで通りホストのブラウザが
   審判役(ホスト権威)で、実際のゲームデータ・音声はPeerJS(WebRTC)のP2Pのまま。
   ここが受け持つのはあくまで「部屋コードの管理」「公開部屋の検索」
   「クイックプレイの待ち合わせ」という、今まで固定peer ID(LOBBY_ID)の
   自己申告制だった不安定な部分の置き換え。

   ルーティング:
     /ws         … Lobby DO への WebSocket (部屋の登録・検索)
     /quickplay  … MatchQueue DO への WebSocket (世界中の人との自動マッチング)
     /list       … 公開部屋一覧のHTTP版(デバッグ・保険用、GET)
     /health, /  … 生存確認
*/

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

/* ---- Lobby: 部屋の登録・在籍確認・公開検索 ----
   1インスタンス(idFromName('global'))が全部屋のコードを管理する。
   部屋コードとPeerJSのpeer IDを完全に切り離す(今までは
   「houkago-inokori-」+部屋コード をそのままpeer IDにしていたため、
   世界中の誰かと衝突しうる/PeerJSの公開ブローカーの気まぐれに
   全面依存していた)。ここでは部屋コードの「所有権」をDurable Object側で
   排他的に管理し、実際の接続先peer IDは登録時にホストから預かって
   参加者からの問い合わせに答えるだけにする。 */
export class Lobby {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    /** @type {Map<string, {peerId:string, profile:any, isPublic:boolean, count:number, max:number, stage:string, ts:number, ws:WebSocket}>} */
    this.rooms = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') !== 'websocket') {
      if (url.pathname.endsWith('/list')) {
        return new Response(JSON.stringify({ rooms: this.listPublic() }), {
          headers: { ...CORS, 'content-type': 'application/json' },
        });
      }
      return new Response('lobby ok', { headers: CORS });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.attach(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  purgeStale() {
    const now = Date.now();
    for (const [code, r] of this.rooms) {
      if (now - r.ts > 20000) this.rooms.delete(code);
    }
  }

  attach(ws) {
    let ownedCode = null;
    ws.addEventListener('message', (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch (e) { return; }
      if (!msg || !msg.t) return;
      this.purgeStale();

      if (msg.t === 'host_register') {
        const code = String(msg.code || '').toUpperCase().slice(0, 4);
        if (!code || this.rooms.has(code)) { this.send(ws, { t: 'code_taken', code }); return; }
        if (ownedCode) this.rooms.delete(ownedCode);
        ownedCode = code;
        this.rooms.set(code, {
          peerId: String(msg.peerId || ''),
          profile: msg.profile || {},
          isPublic: !!msg.isPublic,
          count: msg.count || 1,
          max: msg.max || 5,
          stage: msg.stage || '',
          ts: Date.now(),
          ws,
        });
        this.send(ws, { t: 'host_registered', code });

      } else if (msg.t === 'host_update') {
        if (!ownedCode) return;
        const r = this.rooms.get(ownedCode);
        if (!r) return;
        if (msg.isPublic !== undefined) r.isPublic = !!msg.isPublic;
        if (msg.count !== undefined) r.count = msg.count;
        if (msg.max !== undefined) r.max = msg.max;
        if (msg.stage !== undefined) r.stage = msg.stage;
        if (msg.profile) r.profile = msg.profile;
        r.ts = Date.now();

      } else if (msg.t === 'host_unregister') {
        if (ownedCode) { this.rooms.delete(ownedCode); ownedCode = null; }

      } else if (msg.t === 'join_lookup') {
        const code = String(msg.code || '').toUpperCase().slice(0, 4);
        const r = this.rooms.get(code);
        if (r) this.send(ws, { t: 'join_result', found: true, code, peerId: r.peerId, hostProfile: r.profile });
        else this.send(ws, { t: 'join_result', found: false, code });

      } else if (msg.t === 'list_public') {
        this.send(ws, { t: 'public_rooms', rooms: this.listPublic() });

      } else if (msg.t === 'ping') {
        this.send(ws, { t: 'pong' });
      }
    });

    const cleanup = () => {
      if (ownedCode) {
        const r = this.rooms.get(ownedCode);
        if (r && r.ws === ws) this.rooms.delete(ownedCode);
        ownedCode = null;
      }
    };
    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }

  listPublic() {
    this.purgeStale();
    const out = [];
    for (const [code, r] of this.rooms) {
      if (!r.isPublic) continue;
      out.push({ code, name: r.profile.name, icon: r.profile.icon, count: r.count, max: r.max, stage: r.stage });
    }
    return out;
  }

  send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (e) {} }
}

/* ---- MatchQueue: クイックプレイ(世界中の初対面プレイヤーとの自動マッチング) ----
   1インスタンス(idFromName('global'))が待合列を管理する。今回は「通常モード
   (先生1vs生徒4=最大5人)」だけを対象にした最小実装。
   最初にキューへ入った人が先生役(ホスト)になる。5人集まるか、20秒経ったら
   その時点のメンバーで確定(先生役のクライアントが実際に部屋を作り、
   Lobbyへ登録できたコードをここへ知らせて、残りのメンバーへ配る)。
   人数が足りない分は今まで通りクライアント側のAI(BOT)が埋める。 */
export class MatchQueue {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.waiting = [];          // WebSocket[]
    this.meta = new Map();      // ws -> {profile, group}
    this.timer = null;
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('queue ok', { headers: CORS });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.attach(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  attach(ws) {
    this.meta.set(ws, { profile: null, group: null });
    ws.addEventListener('message', (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch (e) { return; }
      if (!msg || !msg.t) return;
      if (msg.t === 'queue_join') this.enqueue(ws, msg.profile || {});
      else if (msg.t === 'quickplay_ready') this.relayReady(ws, msg.code);
      else if (msg.t === 'queue_leave') this.dequeue(ws);
    });
    const cleanup = () => { this.dequeue(ws); this.meta.delete(ws); };
    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }

  enqueue(ws, profile) {
    const m = this.meta.get(ws);
    if (!m || m.group) return;
    m.profile = profile;
    if (this.waiting.indexOf(ws) < 0) this.waiting.push(ws);
    this.send(ws, { t: 'queue_wait', pos: this.waiting.length });
    if (this.waiting.length === 1 && !this.timer) {
      this.timer = setTimeout(() => { this.timer = null; this.finalize(); }, 20000);
    }
    /* 5人(先生1+生徒4)集まったら待ち時間を待たずすぐ確定する */
    if (this.waiting.length >= 5) this.finalize();
  }

  dequeue(ws) {
    const i = this.waiting.indexOf(ws);
    if (i >= 0) this.waiting.splice(i, 1);
    if (!this.waiting.length && this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  finalize() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (!this.waiting.length) return;
    const group = this.waiting.splice(0, 5);
    group.forEach((sock) => { const m = this.meta.get(sock); if (m) m.group = group; });
    const host = group[0];
    this.send(host, { t: 'quickplay_host', size: group.length });
    group.slice(1).forEach((sock) => this.send(sock, { t: 'quickplay_wait_host' }));
    /* まだ列に残っている人がいれば、次のグループとして続けて待たせる */
    if (this.waiting.length && !this.timer) {
      this.timer = setTimeout(() => { this.timer = null; this.finalize(); }, 20000);
    }
  }

  relayReady(ws, code) {
    const m = this.meta.get(ws);
    if (!m || !m.group) return;
    m.group.forEach((sock) => { if (sock !== ws) this.send(sock, { t: 'quickplay_join', code }); });
  }

  send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (e) {} }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('houkago-inokori relay: ok', { headers: CORS });
    }
    if (url.pathname === '/ws' || url.pathname === '/list') {
      const id = env.LOBBY.idFromName('global');
      return env.LOBBY.get(id).fetch(request);
    }
    if (url.pathname === '/quickplay') {
      const id = env.QUEUE.idFromName('global');
      return env.QUEUE.get(id).fetch(request);
    }
    return new Response('not found', { status: 404, headers: CORS });
  },
};
