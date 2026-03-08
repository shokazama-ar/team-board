CREATE TABLE inquiries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN ('trial', 'join', 'leave', 'other')),
  name       text        NOT NULL,
  email      text,
  phone      text,
  message    text,
  status     text        NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN inquiries.type IS
  'trial=体験・見学希望, join=入会依頼, leave=退会依頼, other=その他';
COMMENT ON COLUMN inquiries.status IS
  'new=未読, read=既読, replied=返信済み';

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 誰でも送信可能（公開フォームからの INSERT）
CREATE POLICY "Anyone can submit inquiry" ON inquiries
  FOR INSERT WITH CHECK (true);

-- 対象チームの管理者のみ参照可能
CREATE POLICY "Admins can view inquiries" ON inquiries
  FOR SELECT USING (public.is_admin_of_team(team_id));

-- 対象チームの管理者のみステータス更新可能
CREATE POLICY "Admins can update inquiry status" ON inquiries
  FOR UPDATE USING (public.is_admin_of_team(team_id))
  WITH CHECK (public.is_admin_of_team(team_id));
