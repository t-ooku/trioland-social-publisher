-- 中途採用者のステップアップ表（src/step.js の SCHEMA と同じ。Worker も初回に CREATE TABLE IF NOT EXISTS で作る）
CREATE TABLE IF NOT EXISTS learners ( id TEXT PRIMARY KEY, nursery TEXT NOT NULL, display_name TEXT NOT NULL, employment TEXT NOT NULL, start_date TEXT NOT NULL, mentor_name TEXT, checklist_version INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active', left_date TEXT, left_stage TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tokens ( token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, learner_id TEXT, nursery TEXT, revoked_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS checks ( learner_id TEXT NOT NULL, item_id TEXT NOT NULL, self_at TEXT, mentor_at TEXT, PRIMARY KEY (learner_id, item_id));
CREATE TABLE IF NOT EXISTS check_log ( id INTEGER PRIMARY KEY AUTOINCREMENT, learner_id TEXT, item_id TEXT, actor TEXT, action TEXT, at TEXT);
CREATE TABLE IF NOT EXISTS reviews ( learner_id TEXT NOT NULL, stage_id TEXT NOT NULL, met_on TEXT, self_note TEXT, mentor_note TEXT, PRIMARY KEY (learner_id, stage_id));
CREATE TABLE IF NOT EXISTS moods ( learner_id TEXT NOT NULL, week TEXT NOT NULL, level INTEGER NOT NULL, PRIMARY KEY (learner_id, week));
CREATE TABLE IF NOT EXISTS checklists (version INTEGER PRIMARY KEY, json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_learners_nursery ON learners (nursery);
CREATE INDEX IF NOT EXISTS idx_tokens_learner ON tokens (learner_id);
