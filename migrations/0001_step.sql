-- 中途採用者のステップアップ（/step/）用の D1 スキーマ。
-- 適用: npx wrangler d1 migrations apply trio_step --local（手元）／--remote（本番）
-- 職員の名前・入社日・メモは D1 にだけ入れる。リポジトリには入れない。

CREATE TABLE learners (
  id TEXT PRIMARY KEY,                    -- ランダム ID
  nursery TEXT NOT NULL,                  -- 'komazawa' | 'umegaoka'
  display_name TEXT NOT NULL,
  employment TEXT NOT NULL,               -- 'fulltime' | 'parttime'
  start_date TEXT NOT NULL,               -- YYYY-MM-DD（日本時間）
  mentor_name TEXT,
  checklist_version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- active | completed | left
  left_date TEXT, left_stage TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX learners_nursery ON learners (nursery, status);

CREATE TABLE tokens (
  token_hash TEXT PRIMARY KEY,            -- SHA-256(hex)。トークンそのものは保存しない
  kind TEXT NOT NULL,                     -- 'self' | 'mentor' | 'nursery'
  learner_id TEXT, nursery TEXT,
  revoked_at TEXT, created_at TEXT NOT NULL
);
CREATE INDEX tokens_learner ON tokens (learner_id, kind);
CREATE INDEX tokens_nursery ON tokens (nursery, kind);

CREATE TABLE checks (
  learner_id TEXT NOT NULL, item_id TEXT NOT NULL,
  self_at TEXT, mentor_at TEXT,
  PRIMARY KEY (learner_id, item_id)
);

CREATE TABLE check_log (                  -- 取り消しを含む履歴
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id TEXT, item_id TEXT, actor TEXT, action TEXT, at TEXT
);
CREATE INDEX check_log_learner ON check_log (learner_id);

CREATE TABLE reviews (
  learner_id TEXT NOT NULL, stage_id TEXT NOT NULL,
  met_on TEXT, self_note TEXT, mentor_note TEXT,
  PRIMARY KEY (learner_id, stage_id)
);

CREATE TABLE moods (
  learner_id TEXT NOT NULL, week TEXT NOT NULL,   -- その週の月曜日
  level INTEGER NOT NULL,                         -- 1 順調 / 2 ちょっと大変 / 3 つらい
  PRIMARY KEY (learner_id, week)
);

CREATE TABLE checklists (version INTEGER PRIMARY KEY, json TEXT NOT NULL, created_at TEXT NOT NULL);

-- リンク（トークン）ごとのレート制限。key はトークンの SHA-256。
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL);
