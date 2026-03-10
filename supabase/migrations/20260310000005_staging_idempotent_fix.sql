-- ============================================================
-- task-036: ステージング環境 問い合わせ種別登録バグ 修正用 SQL
-- 冪等に適用できる（何度実行しても安全）
-- Supabase Dashboard > SQL Editor に貼り付けて実行してください
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. update_updated_at_column 関数
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 2. inquiry_types テーブル
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiry_types (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  message_template text,
  sort_order       integer     NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- インデックス（既存の場合はスキップ）
CREATE INDEX IF NOT EXISTS inquiry_types_team_id_idx ON inquiry_types(team_id);

-- RLS 有効化
ALTER TABLE inquiry_types ENABLE ROW LEVEL SECURITY;

-- RLS ポリシーを DROP して再作成（冪等化）
DROP POLICY IF EXISTS "inquiry_types_select_all"    ON inquiry_types;
DROP POLICY IF EXISTS "inquiry_types_admin_insert"  ON inquiry_types;
DROP POLICY IF EXISTS "inquiry_types_admin_update"  ON inquiry_types;
DROP POLICY IF EXISTS "inquiry_types_admin_delete"  ON inquiry_types;

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

-- updated_at 自動更新トリガー（既存のトリガーを DROP して再作成）
DROP TRIGGER IF EXISTS inquiry_types_updated_at ON inquiry_types;
CREATE TRIGGER inquiry_types_updated_at
  BEFORE UPDATE ON inquiry_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 3. inquiry_form_fields テーブル
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiry_form_fields (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type_id uuid        NOT NULL REFERENCES inquiry_types(id) ON DELETE CASCADE,
  field_label     text        NOT NULL,
  field_type      text        NOT NULL DEFAULT 'text'
                              CHECK (field_type IN ('text','textarea','tel','email','select','checkbox','radio')),
  placeholder     text,
  options         jsonb,
  is_required     boolean     NOT NULL DEFAULT false,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS inquiry_form_fields_type_id_idx ON inquiry_form_fields(inquiry_type_id);

-- RLS 有効化
ALTER TABLE inquiry_form_fields ENABLE ROW LEVEL SECURITY;

-- RLS ポリシーを DROP して再作成
DROP POLICY IF EXISTS "inquiry_form_fields_select_all"   ON inquiry_form_fields;
DROP POLICY IF EXISTS "inquiry_form_fields_admin_write"  ON inquiry_form_fields;

CREATE POLICY "inquiry_form_fields_select_all"
  ON inquiry_form_fields FOR SELECT
  USING (true);

CREATE POLICY "inquiry_form_fields_admin_write"
  ON inquiry_form_fields FOR ALL
  USING (EXISTS (
    SELECT 1 FROM inquiry_types it
    WHERE it.id = inquiry_form_fields.inquiry_type_id
      AND is_admin_of_team(it.team_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM inquiry_types it
    WHERE it.id = inquiry_form_fields.inquiry_type_id
      AND is_admin_of_team(it.team_id)
  ));

-- ────────────────────────────────────────────────────────────
-- 4. inquiries テーブルへの列追加
-- ────────────────────────────────────────────────────────────
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS inquiry_type_id uuid REFERENCES inquiry_types(id) ON DELETE SET NULL;

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS custom_fields jsonb;

-- インデックス
CREATE INDEX IF NOT EXISTS inquiries_inquiry_type_id_idx ON inquiries(inquiry_type_id);

-- ────────────────────────────────────────────────────────────
-- 5. get_team_name 関数
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_team_name(tid uuid)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  SELECT name INTO result
  FROM public.teams
  WHERE id = tid;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_team_name(uuid) TO anon;

-- ────────────────────────────────────────────────────────────
-- 6. inquiries INSERT ポリシー（anon が問い合わせ送信できるよう設定）
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON inquiries;
CREATE POLICY "Anyone can submit inquiry"
  ON inquiries FOR INSERT
  WITH CHECK (true);
