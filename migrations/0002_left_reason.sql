-- 退職理由（2026-11-11）。Worker の ensureSchema も、列がなければ同じ ALTER を実行する。
ALTER TABLE learners ADD COLUMN left_reason TEXT;
ALTER TABLE learners ADD COLUMN left_note TEXT;
