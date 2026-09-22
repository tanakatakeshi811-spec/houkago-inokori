/* ===== 放課後の居残り: 部屋登録・検索・クイックプレイ用リレー(Cloudflare Worker) =====
   このWorkerは「試合の中身」は一切計算しない。今まで通りホストのブラウザが
   審判役(ホスト権威)で、実際のゲームデータ・音声はPeerJS(WebRTC)のP2Pのまま。
   ここが受け持つのはあくまで「部屋コードの管理」「公開部屋の検索」
   「クイックプレイの待ち合わせ」「ランキング(D1)」という、今まで固定peer ID
   (LOBBY_ID)の自己申告制だった不安定な部分の置き換え、及び試合結果の集計。

   ルーティング:
     /ws                 … Lobby DO への WebSocket (部屋の登録・検索)
     /quickplay          … MatchQueue DO への WebSocket (世界中の人との自動マッチング)
     /list               … 公開部屋一覧のHTTP版(デバッグ・保険用、GET)
     /api/match-result   … 試合結果の送信(POST、D1に記録)
     /api/leaderboard    … ランキング一覧の取得(GET、D1から集計値を読むだけ)
     /api/profile/update … 名前・アイコンの更新(POST、公式サイト掲示板からのプロフィール編集用)
     /api/board/post      … 掲示板への投稿(POST、3秒連投防止をサーバー側で強制)
     /api/board/list       … 直近1時間の投稿一覧取得(GET、呼ばれるたび1時間より古い行も間引き削除)
     /api/board/save       … 投稿を自分専用に保存(POST、元の投稿が消えても残るコピー)
     /api/board/saved      … 自分が保存した投稿一覧の取得(GET)
     /api/board/unsave     … 保存した投稿の削除(POST、本人のものだけ)
     /api/link/create      … 掲示板連携用の6桁コード発行(POST、ゲーム本体のタイトル画面から)
     /api/link/redeem      … 6桁コードをplayer_idに交換(POST、掲示板側での連携完了、1回で失効)
     /api/admin/*          … 管理者用モデレーションAPI(2026-09-22追加、詳細は下の管理者セクション参照)
     /api/admin/board/posts … 管理者専用の投稿一覧(IP込み、2026-09-22追加。/api/board/listと違いIPを含む。一般公開してはいけない)
     /health, /          … 生存確認

   ランキングについて: クライアント(ブラウザ)が試合結果を自己申告する方式なので
   技術的には偽装が可能。今回のスコープでは「試合進行そのものをサーバー側で
   検証する」ような本格的な不正対策は行わず、明らかに異常な値(1リクエストで
   複数勝利を主張する等)だけを弾く簡易バリデーションに留める。

   掲示板の「連携」について: ゲーム本体(houkago-inokori)と公式サイト
   (houkago-inokori-web)はどちらもGitHub Pagesのユーザーサイト
   (tanakatakeshi811-spec.github.io)配下のプロジェクトページであり、
   パスが違うだけで同一オリジンのためlocalStorageを共有する。よって
   ゲーム側が起動時に発行するhi_pid_v1は、公式サイト側のJSからも
   そのままlocalStorage.getItem('hi_pid_v1')で読める。つまりplayer_id
   (=PID)の所持そのものがランキングの自己申告方式と同じ強度の「本人性」
   でしかなく、なりすまし対策としては弱い(誰でもゲームを1回読み込めば
   新しいPIDを無限に取得できる)。連投防止・1時間リセットはあくまで
   「荒れた内容が残り続けない」ための構造的対策であり、悪意ある大量投稿
   そのものを完全には防げない点に注意。 */

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-admin-token',
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

/* ---- ランキング: D1(SQLite)への記録・集計読み出し ----
   players テーブルはプレイヤー1人1行の集計値のみを持ち、ランキング表示は
   ここだけを読む(GROUP BYの重い集計をリクエストのたびにやらない設計)。
   match_results は生の試合ログ(日時つき、履歴・調査用、ランキング表示自体には未使用)。 */
const VALID_ROLES = ['teacher', 'student'];
const VALID_MODES = ['classic', 'classic2', 'event'];

function jsonRes(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

async function handleMatchResult(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  if (!body) return jsonRes({ ok: false, error: 'invalid body' }, 400);

  const playerId = String(body.playerId || '').trim().slice(0, 32);
  const role = String(body.role || '');
  const mode = String(body.mode || '');
  /* 簡易バリデーション：1試合＝1勝/1脱出までしか送れない形に強制することで
     「1試合で1000勝」のような明らかな異常値をそもそも表現できないようにする */
  const won = (body.won === true || body.won === 1) ? 1 : 0;
  const escaped = (role === 'student' && (body.escaped === true || body.escaped === 1)) ? 1 : 0;
  const name = String(body.name || '名無し').trim().slice(0, 20) || '名無し';
  const icon = String(body.icon || '👤').trim().slice(0, 8) || '👤';

  if (!playerId || !/^[0-9]{4,32}$/.test(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  if (VALID_ROLES.indexOf(role) < 0) return jsonRes({ ok: false, error: 'invalid role' }, 400);
  if (VALID_MODES.indexOf(mode) < 0) return jsonRes({ ok: false, error: 'invalid mode' }, 400);

  const now = Date.now();
  const isTeacher = role === 'teacher' ? 1 : 0;
  const isStudent = role === 'student' ? 1 : 0;
  const points = won + escaped;

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO match_results (player_id, player_name, role, mode, won, escaped, created_at) VALUES (?,?,?,?,?,?,?)'
    ).bind(playerId, name, role, mode, won, escaped, now),
    env.DB.prepare(
      `INSERT INTO players (player_id, name, icon, matches, wins, teacher_matches, teacher_wins, student_matches, student_escapes, points, updated_at)
       VALUES (?,?,?,1,?,?,?,?,?,?,?)
       ON CONFLICT(player_id) DO UPDATE SET
         name=excluded.name, icon=excluded.icon,
         matches=matches+1, wins=wins+excluded.wins,
         teacher_matches=teacher_matches+excluded.teacher_matches,
         teacher_wins=teacher_wins+excluded.teacher_wins,
         student_matches=student_matches+excluded.student_matches,
         student_escapes=student_escapes+excluded.student_escapes,
         points=points+excluded.points, updated_at=excluded.updated_at`
    ).bind(playerId, name, icon, won, isTeacher, isTeacher * won, isStudent, isStudent * escaped, points, now),
  ]);

  return jsonRes({ ok: true });
}

async function handleLeaderboard(request, env) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  const rs = await env.DB.prepare(
    `SELECT player_id as playerId, name, icon, matches, wins, teacher_matches as teacherMatches,
            teacher_wins as teacherWins, student_matches as studentMatches,
            student_escapes as studentEscapes, points
     FROM players ORDER BY points DESC, wins DESC LIMIT ?`
  ).bind(limit).all();
  return jsonRes({ ok: true, players: rs.results || [] });
}

/* ---- プロフィール更新: 公式サイト(掲示板)側から名前・アイコンを編集できるようにする ----
   playersテーブルに集計値と同じ行で持たせる(試合を1回もしていない新規player_idでも
   ここでレコードを作る＝掲示板に初めて来た人でも名前を設定できる)。
   ランキングのplayer.nameも自動的にこの値を参照する形になる。 */
function isValidPid(s) { return typeof s === 'string' && /^[0-9]{4,32}$/.test(s); }

async function handleProfileUpdate(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const playerId = String((body && body.playerId) || '').trim().slice(0, 32);
  if (!isValidPid(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  const name = String((body && body.name) || '').trim().slice(0, 20) || '名無し';
  const icon = String((body && body.icon) || '').trim().slice(0, 8) || '👤';
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO players (player_id, name, icon, updated_at) VALUES (?,?,?,?)
     ON CONFLICT(player_id) DO UPDATE SET name=excluded.name, icon=excluded.icon, updated_at=excluded.updated_at`
  ).bind(playerId, name, icon, now).run();
  return jsonRes({ ok: true, name, icon });
}

/* ---- 掲示板 ----
   スレッドなし・全員が同じ場所に時系列で書き込む1本の掲示板。
   荒らし対策として ①同一player_idは直前の投稿から3秒間は次を投稿できない
   (この関数内でサーバー側に強制、クライアント側の制御だけに頼らない)、
   ②投稿から1時間経つとlistが返さなくなる＋アクセスの都度、実際にD1からも
   間引き削除する(Cron Triggerは使わず「呼ばれた時についでに掃除する」方式)。
   名前・アイコンは投稿の瞬間のplayersテーブルの値をそのままコピーして残す
   (後でプロフィール名を変えても過去の投稿の表示名は変わらない)。 */
const BOARD_WINDOW_MS = 60 * 60 * 1000;   // 1時間
const BOARD_COOLDOWN_MS = 3000;           // 連投防止3秒
const BOARD_TEXT_MAX = 200;
const BOARD_SAVE_LIMIT = 300;             // 1人あたりの保存上限(D1肥大化・荒らし対策)

async function cleanupOldPosts(env, now) {
  try { await env.DB.prepare('DELETE FROM board_posts WHERE created_at < ?').bind(now - BOARD_WINDOW_MS).run(); }
  catch (e) { /* 掃除の失敗で投稿・閲覧自体は止めない */ }
}

async function handleBoardPost(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const playerId = String((body && body.playerId) || '').trim().slice(0, 32);
  if (!isValidPid(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  const text = String((body && body.text) || '').trim().slice(0, BOARD_TEXT_MAX);
  if (!text) return jsonRes({ ok: false, error: 'empty text' }, 400);
  const now = Date.now();

  /* 投稿禁止(荒らし対策、2026-09-22追加): board_bansに有効な行があれば拒否。
     当初は管理者がD1へ直接INSERT/UPDATEする緊急運用だったが、同日中に
     下の管理者APIエリアへ専用の管理UIを追加し、以後はそちら経由で行われる。 */
  const ban = await env.DB.prepare('SELECT until, permanent, reason FROM board_bans WHERE player_id=?').bind(playerId).first();
  if (ban && (ban.permanent || ban.until > now)) {
    return jsonRes({ ok: false, error: 'banned', untilMs: ban.permanent ? null : ban.until, permanent: !!ban.permanent, reason: ban.reason || '' }, 403);
  }

  /* IP BAN(2026-09-22追加): player_idはlocalStorageを消せば無限に再発行できて
     しまうため、player_id単位のBANだけでは同じ人が新しいIDで戻ってくるのを
     防げない。接続元IP(Cloudflareが検証済みで付与するcf-connecting-ip、
     クライアントからは偽装できない)単位でも拒否できるようにする。 */
  const clientIp = request.headers.get('cf-connecting-ip') || '';
  if (clientIp) {
    const ipBan = await env.DB.prepare('SELECT until, permanent, reason FROM ip_bans WHERE ip=?').bind(clientIp).first();
    if (ipBan && (ipBan.permanent || ipBan.until > now)) {
      return jsonRes({ ok: false, error: 'ip_banned', untilMs: ipBan.permanent ? null : ipBan.until, permanent: !!ipBan.permanent, reason: ipBan.reason || '' }, 403);
    }
  }

  /* 連投防止(サーバー側で強制): この人の一番新しい投稿からまだ3秒経ってなければ弾く */
  const last = await env.DB.prepare(
    'SELECT created_at FROM board_posts WHERE player_id=? ORDER BY created_at DESC LIMIT 1'
  ).bind(playerId).first();
  if (last && now - last.created_at < BOARD_COOLDOWN_MS) {
    return jsonRes({ ok: false, error: 'too_fast', waitMs: BOARD_COOLDOWN_MS - (now - last.created_at) }, 429);
  }

  /* 表示名・アイコンはplayersテーブル(プロフィール)の値を正とする。
     まだ一度もプロフィールを設定していない新規player_idなら、リクエストに
     入っている値(無ければデフォルト)で新規に作ってしまう */
  let prof = await env.DB.prepare('SELECT name, icon FROM players WHERE player_id=?').bind(playerId).first();
  let name, icon;
  if (prof) {
    name = prof.name; icon = prof.icon;
  } else {
    name = String((body && body.name) || '').trim().slice(0, 20) || ('生徒' + playerId.slice(-4));
    icon = String((body && body.icon) || '').trim().slice(0, 8) || '👤';
    await env.DB.prepare(
      `INSERT INTO players (player_id, name, icon, updated_at) VALUES (?,?,?,?) ON CONFLICT(player_id) DO NOTHING`
    ).bind(playerId, name, icon, now).run();
  }

  await env.DB.prepare(
    'INSERT INTO board_posts (player_id, name, icon, text, ip, created_at) VALUES (?,?,?,?,?,?)'
  ).bind(playerId, name, icon, text, clientIp || null, now).run();

  await cleanupOldPosts(env, now);
  return jsonRes({ ok: true });
}

async function handleBoardList(request, env) {
  const now = Date.now();
  await cleanupOldPosts(env, now);
  const rs = await env.DB.prepare(
    `SELECT id, player_id as playerId, name, icon, text, created_at as createdAt
     FROM board_posts WHERE created_at >= ? ORDER BY created_at DESC LIMIT 200`
  ).bind(now - BOARD_WINDOW_MS).all();
  return jsonRes({ ok: true, posts: rs.results || [], now, windowMs: BOARD_WINDOW_MS });
}

async function handleBoardSave(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const playerId = String((body && body.playerId) || '').trim().slice(0, 32);
  if (!isValidPid(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  const text = String((body && body.text) || '').trim().slice(0, BOARD_TEXT_MAX);
  if (!text) return jsonRes({ ok: false, error: 'empty text' }, 400);
  const name = String((body && body.name) || '名無し').trim().slice(0, 20) || '名無し';
  const icon = String((body && body.icon) || '👤').trim().slice(0, 8) || '👤';
  const sourcePostId = Number.isFinite(body && body.sourcePostId) ? body.sourcePostId : null;
  const postedAt = Number.isFinite(body && body.postedAt) ? body.postedAt : Date.now();
  const now = Date.now();

  const countRow = await env.DB.prepare('SELECT COUNT(*) as c FROM board_saves WHERE owner_player_id=?').bind(playerId).first();
  if (countRow && countRow.c >= BOARD_SAVE_LIMIT) {
    return jsonRes({ ok: false, error: 'save_limit', limit: BOARD_SAVE_LIMIT }, 400);
  }

  const res = await env.DB.prepare(
    `INSERT INTO board_saves (owner_player_id, source_post_id, name, icon, text, posted_at, saved_at)
     VALUES (?,?,?,?,?,?,?)`
  ).bind(playerId, sourcePostId, name, icon, text, postedAt, now).run();
  return jsonRes({ ok: true, id: res.meta && res.meta.last_row_id });
}

async function handleBoardSavedList(request, env) {
  const url = new URL(request.url);
  const playerId = String(url.searchParams.get('playerId') || '').trim().slice(0, 32);
  if (!isValidPid(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  const rs = await env.DB.prepare(
    `SELECT id, source_post_id as sourcePostId, name, icon, text, posted_at as postedAt, saved_at as savedAt
     FROM board_saves WHERE owner_player_id=? ORDER BY saved_at DESC LIMIT 300`
  ).bind(playerId).all();
  return jsonRes({ ok: true, saves: rs.results || [] });
}

async function handleBoardUnsave(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const playerId = String((body && body.playerId) || '').trim().slice(0, 32);
  if (!isValidPid(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  const saveId = parseInt((body && body.saveId), 10);
  if (!Number.isFinite(saveId)) return jsonRes({ ok: false, error: 'invalid saveId' }, 400);
  const res = await env.DB.prepare(
    'DELETE FROM board_saves WHERE id=? AND owner_player_id=?'
  ).bind(saveId, playerId).run();
  const changed = (res.meta && res.meta.changes) || 0;
  return jsonRes({ ok: changed > 0 });
}

/* ---- 掲示板の連携(6桁コード方式) ----
   2026-09-22: 従来の「ゲーム本体と公式サイトが同一オリジンなのでlocalStorage
   (hi_pid_v1)をそのまま読む」自動連携は、同じブラウザでしか成立しないという
   制約があった。しゅんりさんの要望で「ゲームのタイトル画面でコードを発行→
   掲示板側でそのコードを入力」という、別端末・別ブラウザでも連携できる方式に
   変更する。コードは10分間だけ有効なワンタイムトークンで、使ったら即失効。 */
const LINK_CODE_TTL_MS = 10 * 60 * 1000; // 10分
const LINK_CODE_MAX_TRIES = 8;

async function cleanupExpiredLinkCodes(env, now) {
  try { await env.DB.prepare('DELETE FROM link_codes WHERE expires_at < ?').bind(now).run(); }
  catch (e) { /* 掃除の失敗で発行・照合自体は止めない */ }
}

function genLinkCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 100000〜999999の6桁
}

async function handleLinkCreate(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const playerId = String((body && body.playerId) || '').trim().slice(0, 32);
  if (!isValidPid(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  const now = Date.now();
  await cleanupExpiredLinkCodes(env, now);

  let code = null;
  for (let i = 0; i < LINK_CODE_MAX_TRIES; i++) {
    const candidate = genLinkCode();
    const exists = await env.DB.prepare(
      'SELECT code FROM link_codes WHERE code=? AND used_at IS NULL AND expires_at > ?'
    ).bind(candidate, now).first();
    if (!exists) { code = candidate; break; }
  }
  if (!code) return jsonRes({ ok: false, error: 'could not generate code' }, 500);

  const expiresAt = now + LINK_CODE_TTL_MS;
  await env.DB.prepare(
    'INSERT INTO link_codes (code, player_id, created_at, expires_at) VALUES (?,?,?,?) ON CONFLICT(code) DO UPDATE SET player_id=excluded.player_id, created_at=excluded.created_at, expires_at=excluded.expires_at, used_at=NULL'
  ).bind(code, playerId, now, expiresAt).run();

  return jsonRes({ ok: true, code, expiresAt });
}

async function handleLinkRedeem(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const code = String((body && body.code) || '').trim().slice(0, 6);
  if (!/^[0-9]{6}$/.test(code)) return jsonRes({ ok: false, error: 'invalid code' }, 400);
  const now = Date.now();

  const row = await env.DB.prepare(
    'SELECT player_id as playerId, expires_at as expiresAt, used_at as usedAt FROM link_codes WHERE code=?'
  ).bind(code).first();
  if (!row || row.usedAt || row.expiresAt < now) {
    return jsonRes({ ok: false, error: 'invalid_or_expired' }, 400);
  }
  await env.DB.prepare('UPDATE link_codes SET used_at=? WHERE code=?').bind(now, code).run();
  await cleanupExpiredLinkCodes(env, now);

  return jsonRes({ ok: true, playerId: row.playerId });
}

/* ---- 管理者用モデレーションAPI(2026-09-22追加) ----
   背景: 掲示板荒らし(1人が名前を変えながら暴言を連投)が実際に発生し、
   コーディネーターがD1へ直接SQLを打つ緊急対応(board_bansへの手動INSERT・
   board_postsのtext書き換え)をした。今回はそれを「しゅんりさんが自分で
   ボタン操作でできる」管理画面に置き換える。

   認証について(最重要): 管理UI自体はゲーム本体の「隠し管理者(デバッグ)
   モード」と違い、公式サイト側にページ(admin.html)を新設する形にした。
   ただしそのUIはBAN・アカウント削除という「他人のデータに影響する操作」
   を行うため、UIの存在(パスワード入力欄が出るかどうか)だけを根拠に
   実行を許可するのは危険。よって実際に操作を実行するのは必ずこの
   Worker側であり、リクエストのヘッダー(x-admin-token)に載った値を
   env.ADMIN_TOKEN(wrangler secretで設定する秘密値、ソースコードには
   一切書かない)と比較してから実行する。トークン未設定・不一致は
   401で即拒否し、DBには一切触れない。 */
function checkAdminToken(request, env) {
  const token = request.headers.get('x-admin-token') || '';
  return !!(env.ADMIN_TOKEN && token && token === env.ADMIN_TOKEN);
}

function adminAuthFail() {
  return jsonRes({ ok: false, error: 'unauthorized' }, 401);
}

const PERMANENT_UNTIL = 9999999999999; // 表示・判定用の便宜上の遠い未来値(実際の可否はpermanentフラグで見る)
const DELETED_TEXT = 'このコメントは管理者により消されました'; // 2026-09-22の手動対応と表記を統一

function computeUntil(body) {
  if (body && body.permanent) return { until: PERMANENT_UNTIL, permanent: 1 };
  const minutes = Math.max(1, Math.min(60 * 24 * 365, parseInt((body && body.minutes), 10) || 60));
  return { until: Date.now() + minutes * 60000, permanent: 0 };
}

async function handleAdminBoardBan(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const playerId = String((body && body.playerId) || '').trim().slice(0, 32);
  if (!isValidPid(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  const reason = String((body && body.reason) || '').trim().slice(0, 200);
  const { until, permanent } = computeUntil(body);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO board_bans (player_id, until, permanent, reason, created_at) VALUES (?,?,?,?,?)
     ON CONFLICT(player_id) DO UPDATE SET until=excluded.until, permanent=excluded.permanent, reason=excluded.reason, created_at=excluded.created_at`
  ).bind(playerId, until, permanent, reason, now).run();
  return jsonRes({ ok: true, playerId, until: permanent ? null : until, permanent: !!permanent });
}

async function handleAdminBoardBanIp(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const ip = String((body && body.ip) || '').trim().slice(0, 64);
  if (!ip) return jsonRes({ ok: false, error: 'invalid ip' }, 400);
  const reason = String((body && body.reason) || '').trim().slice(0, 200);
  const { until, permanent } = computeUntil(body);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO ip_bans (ip, until, permanent, reason, created_at) VALUES (?,?,?,?,?)
     ON CONFLICT(ip) DO UPDATE SET until=excluded.until, permanent=excluded.permanent, reason=excluded.reason, created_at=excluded.created_at`
  ).bind(ip, until, permanent, reason, now).run();
  return jsonRes({ ok: true, ip, until: permanent ? null : until, permanent: !!permanent });
}

async function handleAdminBoardUnban(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const playerId = String((body && body.playerId) || '').trim().slice(0, 32);
  const ip = String((body && body.ip) || '').trim().slice(0, 64);
  if (!playerId && !ip) return jsonRes({ ok: false, error: 'playerId or ip required' }, 400);
  if (playerId) await env.DB.prepare('DELETE FROM board_bans WHERE player_id=?').bind(playerId).run();
  if (ip) await env.DB.prepare('DELETE FROM ip_bans WHERE ip=?').bind(ip).run();
  return jsonRes({ ok: true });
}

async function handleAdminBoardBansList(request, env) {
  const now = Date.now();
  const playerBans = await env.DB.prepare(
    'SELECT player_id as playerId, until, permanent, reason, created_at as createdAt FROM board_bans ORDER BY created_at DESC LIMIT 200'
  ).all();
  const ipBans = await env.DB.prepare(
    'SELECT ip, until, permanent, reason, created_at as createdAt FROM ip_bans ORDER BY created_at DESC LIMIT 200'
  ).all();
  return jsonRes({
    ok: true,
    now,
    playerBans: (playerBans.results || []).filter((b) => b.permanent || b.until > now),
    ipBans: (ipBans.results || []).filter((b) => b.permanent || b.until > now),
  });
}

/* 管理者専用の投稿一覧(IP込み、2026-09-22追加): 一般公開の/api/board/listは
   誰でも呼べるためIPを絶対に含めない(プライバシー上重要)。管理者が
   「誰のIPが何なのか」を見てワンクリックでIP BANできるように、x-admin-token
   で保護された別エンドポイントとしてここだけIPを返す。過去(ipカラム追加より
   前)の投稿はip=NULLのまま返るので、管理画面側で「IP不明」表示にする。 */
async function handleAdminBoardPosts(request, env) {
  const now = Date.now();
  await cleanupOldPosts(env, now);
  const rs = await env.DB.prepare(
    `SELECT id, player_id as playerId, name, icon, text, ip, created_at as createdAt
     FROM board_posts WHERE created_at >= ? ORDER BY created_at DESC LIMIT 200`
  ).bind(now - BOARD_WINDOW_MS).all();
  return jsonRes({ ok: true, posts: rs.results || [], now, windowMs: BOARD_WINDOW_MS });
}

async function handleAdminBoardDeletePost(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const id = parseInt((body && body.id), 10);
  if (!Number.isFinite(id)) return jsonRes({ ok: false, error: 'invalid id' }, 400);
  const res = await env.DB.prepare('UPDATE board_posts SET text=? WHERE id=?').bind(DELETED_TEXT, id).run();
  const changed = (res.meta && res.meta.changes) || 0;
  return jsonRes({ ok: changed > 0 });
}

/* アカウント削除の範囲(判断内容): players行(ランキング集計値・プロフィール)は
   完全に削除。board_posts(掲示板投稿)は「消されました」表記に置き換え
   (投稿削除と同じ表記に統一、行自体は残す＝一覧の並びやIDがズレない)。
   board_saves(本人専用の保存リスト)は本人しか見られない個人データなので
   丸ごと削除。match_results(試合の生ログ)は履歴・不正調査用のログという
   位置づけで元から個人が閲覧するUIが存在しないため、監査目的で残す
   (ランキング表示自体はplayers行の削除により即座に消える)。 */
async function handleAdminAccountDelete(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonRes({ ok: false, error: 'invalid json' }, 400); }
  const playerId = String((body && body.playerId) || '').trim().slice(0, 32);
  if (!isValidPid(playerId)) return jsonRes({ ok: false, error: 'invalid playerId' }, 400);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM players WHERE player_id=?').bind(playerId),
    env.DB.prepare('UPDATE board_posts SET text=? WHERE player_id=? AND text<>?').bind(DELETED_TEXT, playerId, DELETED_TEXT),
    env.DB.prepare('DELETE FROM board_saves WHERE owner_player_id=?').bind(playerId),
  ]);
  return jsonRes({ ok: true });
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
    if (url.pathname === '/api/match-result' && request.method === 'POST') {
      try { return await handleMatchResult(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      try { return await handleLeaderboard(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/profile/update' && request.method === 'POST') {
      try { return await handleProfileUpdate(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/board/post' && request.method === 'POST') {
      try { return await handleBoardPost(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/board/list' && request.method === 'GET') {
      try { return await handleBoardList(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/board/save' && request.method === 'POST') {
      try { return await handleBoardSave(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/board/saved' && request.method === 'GET') {
      try { return await handleBoardSavedList(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/board/unsave' && request.method === 'POST') {
      try { return await handleBoardUnsave(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/link/create' && request.method === 'POST') {
      try { return await handleLinkCreate(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname === '/api/link/redeem' && request.method === 'POST') {
      try { return await handleLinkRedeem(request, env); }
      catch (e) { return jsonRes({ ok: false, error: 'server error' }, 500); }
    }
    if (url.pathname.startsWith('/api/admin/')) {
      if (!checkAdminToken(request, env)) return adminAuthFail();
      try {
        if (url.pathname === '/api/admin/board/posts' && request.method === 'GET') return await handleAdminBoardPosts(request, env);
        if (url.pathname === '/api/admin/board/ban' && request.method === 'POST') return await handleAdminBoardBan(request, env);
        if (url.pathname === '/api/admin/board/ban-ip' && request.method === 'POST') return await handleAdminBoardBanIp(request, env);
        if (url.pathname === '/api/admin/board/unban' && request.method === 'POST') return await handleAdminBoardUnban(request, env);
        if (url.pathname === '/api/admin/board/bans' && request.method === 'GET') return await handleAdminBoardBansList(request, env);
        if (url.pathname === '/api/admin/board/delete-post' && request.method === 'POST') return await handleAdminBoardDeletePost(request, env);
        if (url.pathname === '/api/admin/account/delete' && request.method === 'POST') return await handleAdminAccountDelete(request, env);
      } catch (e) {
        return jsonRes({ ok: false, error: 'server error' }, 500);
      }
      return new Response('not found', { status: 404, headers: CORS });
    }
    return new Response('not found', { status: 404, headers: CORS });
  },
};
