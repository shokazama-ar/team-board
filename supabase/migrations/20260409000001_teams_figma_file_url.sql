-- Figma連携用カラム追加
-- チームのFigmaファイルURLを保存する（将来的なFigma API連携への拡張ポイント）

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS figma_file_url text;
