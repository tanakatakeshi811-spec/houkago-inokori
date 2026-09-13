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
