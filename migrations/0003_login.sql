-- 2026-11-11 ステップアップ表：ID とパスワードのログイン、設定、自己研修。
-- アプリ側（src/step.js の ensureSchema）でも同じものを作るので、この SQL は手で流さなくても動く。
ALTER TABLE learners ADD COLUMN mentor_user_id TEXT;
CREATE TABLE IF NOT EXISTS nurseries (id TEXT PRIMARY KEY, name TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, login_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL, nursery TEXT, learner_id TEXT,
  pw_hash TEXT NOT NULL, pw_salt TEXT NOT NULL, pw_iter INTEGER NOT NULL, must_change INTEGER NOT NULL DEFAULT 1,
  disabled_at TEXT, created_at TEXT NOT NULL, last_login_at TEXT);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, csrf TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_failures (login_id TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS study_items (
  id TEXT PRIMARY KEY, scope TEXT NOT NULL, nursery TEXT, kind TEXT NOT NULL, category TEXT NOT NULL,
  url TEXT NOT NULL, video_id TEXT, title TEXT NOT NULL, note TEXT, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS study_progress (learner_id TEXT NOT NULL, item_key TEXT NOT NULL, done_at TEXT, memo TEXT, PRIMARY KEY (learner_id, item_key));
CREATE INDEX IF NOT EXISTS idx_users_nursery ON users (nursery);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_failures_login ON login_failures (login_id, at);
