CREATE TABLE inquiry_reply_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title      text NOT NULL,
  body       text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiry_reply_templates_team ON inquiry_reply_templates(team_id, sort_order);

ALTER TABLE inquiry_reply_templates ENABLE ROW LEVEL SECURITY;

-- 閲覧: チームメンバー全員
CREATE POLICY "team members can read templates"
  ON inquiry_reply_templates FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- 作成・更新・削除: 管理者のみ
CREATE POLICY "admins can manage templates"
  ON inquiry_reply_templates FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
