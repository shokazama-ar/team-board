-- 既存の read ステータスを pending に移行
UPDATE inquiries SET status = 'pending' WHERE status = 'read';

-- CHECK 制約を read なしで再作成
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
  CHECK (status IN ('new', 'replied', 'done', 'pending'));

COMMENT ON COLUMN inquiries.status IS
  'new=未読, replied=返信済み, done=完了, pending=要確認';
