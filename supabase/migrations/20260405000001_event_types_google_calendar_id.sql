-- event_types テーブルに google_calendar_id カラムを追加
-- カテゴリごとに独立したGoogleカレンダーを紐付けるため

ALTER TABLE event_types
  ADD COLUMN IF NOT EXISTS google_calendar_id text;
