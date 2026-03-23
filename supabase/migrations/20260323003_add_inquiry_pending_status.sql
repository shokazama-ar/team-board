-- inquiries.status の CHECK 制約に 'pending' を追加
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
  CHECK (status IN ('new', 'read', 'replied', 'done', 'pending'));

COMMENT ON COLUMN inquiries.status IS
  'new=未読, read=対応中, replied=返信済み, done=完了, pending=要確認（インバウンド受信）';
