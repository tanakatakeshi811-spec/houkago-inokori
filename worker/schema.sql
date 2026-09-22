-- 放課後の居残り: ランキング機能のテーブル定義
-- players: プレイヤーごとの集計値（ランキング表示はこのテーブルだけを読む）
CREATE TABLE IF NOT EXISTS players (
  player_id       TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '名無し',
  icon            TEXT NOT NULL DEFAULT '👤',
  matches         INTEGER NOT NULL DEFAULT 0,
  wins            INTEGER NOT NULL DEFAULT 0,
  teacher_matches INTEGER NOT NULL DEFAULT 0,
  teacher_wins    INTEGER NOT NULL DEFAULT 0,
  student_matches INTEGER NOT NULL DEFAULT 0,
  student_escapes INTEGER NOT NULL DEFAULT 0,
  points          INTEGER NOT NULL DEFAULT 0,
  updated_at      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_players_points ON players(points DESC);

-- match_results: 生の試合ログ（履歴・不正調査用に日時つきで残す。ランキング表示自体には使わない）
CREATE TABLE IF NOT EXISTS match_results (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id   TEXT NOT NULL,
  player_name TEXT NOT NULL,
  role        TEXT NOT NULL CHECK(role IN ('teacher','student')),
  mode        TEXT NOT NULL CHECK(mode IN ('classic','classic2','event')),
  won         INTEGER NOT NULL CHECK(won IN (0,1)),
  escaped     INTEGER NOT NULL CHECK(escaped IN (0,1)),
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_match_results_player ON match_results(player_id);

-- 2026-09-22 掲示板機能で追加
-- board_posts: 全体掲示板の投稿。作成から1時間経ったものはlist取得APIの
-- 呼び出しのたびに間引き削除される（Cron Triggerは使わず、アクセスのたびの
-- 簡易クリーンアップ方式。name/iconはplayersテーブルの投稿時点の値を
-- そのままコピーして持つ＝あとでプロフィール名を変えても過去の投稿の
-- 表示名は変わらない、match_resultsと同じ「非正規化して残す」方針）
CREATE TABLE IF NOT EXISTS board_posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id   TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '名無し',
  icon        TEXT NOT NULL DEFAULT '👤',
  text        TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_board_posts_player_created ON board_posts(player_id, created_at);

-- board_saves: 「保存」した投稿のコピー。元のboard_postsの行が1時間で
-- 消えても、保存した本人だけはここから独立していつでも読める・消せる。
CREATE TABLE IF NOT EXISTS board_saves (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_player_id TEXT NOT NULL,
  source_post_id  INTEGER,
  name            TEXT NOT NULL,
  icon            TEXT NOT NULL,
  text            TEXT NOT NULL,
  posted_at       INTEGER NOT NULL,
  saved_at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_board_saves_owner ON board_saves(owner_player_id, saved_at DESC);

-- 2026-09-22 掲示板の連携方式を「6桁コード」方式に変更したため追加
-- link_codes: ゲーム本体のタイトル画面で発行するワンタイムの6桁コード。
-- 別端末・別ブラウザでも公式サイトの掲示板にこのコードを入力するだけで
-- そのplayer_idと連携できる(旧方式=同一オリジンのlocalStorage共有だと
-- 同じブラウザでしか連携できなかった問題への対応)。有効期限10分・
-- 1回使ったらused_atを立てて再利用不可にする。
CREATE TABLE IF NOT EXISTS link_codes (
  code        TEXT PRIMARY KEY,
  player_id   TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  used_at     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_link_codes_expires ON link_codes(expires_at);
