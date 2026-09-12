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

/* ---- MatchQueue: クイックプレイの「動的ロビー」 ----
   DBD(Dead by Daylight)や第五人格の「押した瞬間にロビーへ入り、人がどんどん
   集まってくるのが見える、役割/キャラ/特性を選べる、準備OKか制限時間で開始」
   という仕組み(見た目・固有名詞は一切参考にせず、この"待ち合わせの流れ"だけを
   参考にした独自実装)。今回は「通常モード(先生1vs生徒4=最大5人)」だけが対象。

   1インスタンス(idFromName('global'))が複数の同時ロビーを管理する
   (this.lobbies)。人が来るたびに空いているロビーへ即座に合流させ、
   ロビーの中身が変わるたびに全員へ最新のロビー状態(lobby_state)を
   ブロードキャストする。全員が準備OKになるか、ロビー開始から60秒経ったら
   finalize()して、その時点のメンバーで先生役(ホスト)を1人選び、
   従来通りLobby DO経由の部屋登録・参加へ引き継ぐ(quickplay_host/
   quickplay_wait_host/quickplay_join のメッセージ名・流れは変更していない)。
   人数が足りない分・先生役を誰も希望しなかった場合は今まで通りクライアント
   側のAI(BOT)が埋める。 */
const LOBBY_MAX = 5;
const LOBBY_TIMEOUT_MS = 60000;
export class MatchQueue {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.lobbies = [];      // {id, members:Map<ws,{profile,role,ready,charIdx,perkIdx,joinedAt}>, endsAt, timer, locked}
    this.groupOf = new Map();   // ws -> WebSocket[] (finalize後、コード配布のためだけに残す)
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
    let myLobby = null;
    ws.addEventListener('message', (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch (e) { return; }
      if (!msg || !msg.t) return;
      if (msg.t === 'queue_join') { myLobby = this.joinLobby(ws, msg.profile || {}); }
      else if (msg.t === 'lobby_set') { if (myLobby) this.updateMember(myLobby, ws, msg); }
      else if (msg.t === 'quickplay_ready') { this.relayReady(ws, msg.code); }
      else if (msg.t === 'queue_leave') { if (myLobby) { this.leaveLobby(myLobby, ws); myLobby = null; } }
    });
    const cleanup = () => { if (myLobby) this.leaveLobby(myLobby, ws); this.groupOf.delete(ws); };
    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }

  findOpenLobby() {
    return this.lobbies.find((l) => !l.locked && l.members.size < LOBBY_MAX);
  }

  joinLobby(ws, profile) {
    let lobby = this.findOpenLobby();
    if (!lobby) {
      lobby = { id: Math.random().toString(36).slice(2, 8), members: new Map(), locked: false, timer: null, endsAt: 0 };
      lobby.endsAt = Date.now() + LOBBY_TIMEOUT_MS;
      lobby.timer = setTimeout(() => this.finalize(lobby), LOBBY_TIMEOUT_MS);
      this.lobbies.push(lobby);
    }
    lobby.members.set(ws, { profile, role: 'student', ready: false, charIdx: 0, perkIdx: [], joinedAt: Date.now() });
    this.broadcastLobby(lobby);
    return lobby;
  }

  updateMember(lobby, ws, msg) {
    const m = lobby.members.get(ws);
    if (!m || lobby.locked) return;
    if (msg.role === 'teacher' || msg.role === 'student') m.role = msg.role;
    if (typeof msg.charIdx === 'number') m.charIdx = msg.charIdx;
    if (Array.isArray(msg.perkIdx)) m.perkIdx = msg.perkIdx.slice(0, 4);
    if (typeof msg.ready === 'boolean') m.ready = msg.ready;
    this.broadcastLobby(lobby);
    /* 全員が準備OKになったら60秒を待たずすぐ確定する */
    if ([...lobby.members.values()].every((x) => x.ready)) this.finalize(lobby);
  }

  leaveLobby(lobby, ws) {
    if (!lobby.members.has(ws)) return;
    lobby.members.delete(ws);
    if (!lobby.members.size) {
      if (lobby.timer) clearTimeout(lobby.timer);
      this.lobbies = this.lobbies.filter((l) => l !== lobby);
      return;
    }
    this.broadcastLobby(lobby);
  }

  broadcastLobby(lobby) {
    const list = [...lobby.members.values()].map((m) => ({
      profile: m.profile, role: m.role, ready: m.ready, charIdx: m.charIdx, perkIdx: m.perkIdx,
    }));
    lobby.members.forEach((m, sock) => {
      this.send(sock, { t: 'lobby_state', members: list, endsAt: lobby.endsAt });
    });
  }

  finalize(lobby) {
    if (lobby.locked) return;
    lobby.locked = true;
    if (lobby.timer) { clearTimeout(lobby.timer); lobby.timer = null; }
    this.lobbies = this.lobbies.filter((l) => l !== lobby);
    if (!lobby.members.size) return;
    const entries = [...lobby.members.entries()].sort((a, b) => a[1].joinedAt - b[1].joinedAt);
    /* 先生役を希望した人の中で一番早く参加した人がホスト。誰も希望しなければ
       一番最初にロビーへ来た人がホスト(その場合ホストは生徒役のまま部屋を
       開き、先生はAIになる。従来の「ホストは必ず先生役」という強制はやめた) */
    const hostEntry = entries.find(([, m]) => m.role === 'teacher') || entries[0];
    const group = entries.map(([sock]) => sock);
    group.forEach((sock) => this.groupOf.set(sock, group));
    this.send(hostEntry[0], { t: 'quickplay_host', size: entries.length });
    entries.forEach(([sock]) => { if (sock !== hostEntry[0]) this.send(sock, { t: 'quickplay_wait_host' }); });
  }

  relayReady(ws, code) {
    const group = this.groupOf.get(ws);
    if (!group) return;
    group.forEach((sock) => { if (sock !== ws) this.send(sock, { t: 'quickplay_join', code }); });
    this.groupOf.delete(ws);
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
