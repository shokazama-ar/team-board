-- Googleカレンダー連携用カラム追加

-- teams テーブルに追加
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS google_calendar_id text,
  ADD COLUMN IF NOT EXISTS google_refresh_token text,
  ADD COLUMN IF NOT EXISTS google_sync_enabled bool DEFAULT false;

-- event_types テーブルに追加
ALTER TABLE event_types
  ADD COLUMN IF NOT EXISTS google_sync_enabled bool DEFAULT true;

-- events テーブルに追加
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS google_event_id text;
