-- teams テーブルに google_group_email カラムを追加
ALTER TABLE teams ADD COLUMN IF NOT EXISTS google_group_email text;
