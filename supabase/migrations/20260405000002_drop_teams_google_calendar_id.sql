-- teams.google_calendar_id カラムを削除
-- カテゴリごとの google_calendar_id (event_types.google_calendar_id) に移行済みのため不要

ALTER TABLE teams
  DROP COLUMN IF EXISTS google_calendar_id;
