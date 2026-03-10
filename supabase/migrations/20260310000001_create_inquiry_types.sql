-- update_updated_at_column 関数が存在しない場合は作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TABLE inquiry_types (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  message_template text,
  sort_order     integer     NOT NULL DEFAULT 0,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX inquiry_types_team_id_idx ON inquiry_types(team_id);

-- RLS
ALTER TABLE inquiry_types ENABLE ROW LEVEL SECURITY;

-- 誰でも参照可（問い合わせフォームから team_id 指定で取得するため）
CREATE POLICY "inquiry_types_select_all"
  ON inquiry_types FOR SELECT
  USING (true);

-- admin のみ INSERT/UPDATE/DELETE
CREATE POLICY "inquiry_types_admin_insert"
  ON inquiry_types FOR INSERT
  WITH CHECK (is_admin_of_team(team_id));

CREATE POLICY "inquiry_types_admin_update"
  ON inquiry_types FOR UPDATE
  USING (is_admin_of_team(team_id));

CREATE POLICY "inquiry_types_admin_delete"
  ON inquiry_types FOR DELETE
  USING (is_admin_of_team(team_id));

-- updated_at 自動更新トリガー
CREATE TRIGGER inquiry_types_updated_at
  BEFORE UPDATE ON inquiry_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
