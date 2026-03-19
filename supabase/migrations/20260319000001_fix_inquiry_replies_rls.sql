-- 既存ポリシーを削除して再作成（nested subquery → is_admin_of_team 直接使用）
DROP POLICY IF EXISTS "team members can read replies" ON inquiry_replies;

CREATE POLICY "admins can read replies"
  ON inquiry_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inquiries
      WHERE inquiries.id = inquiry_replies.inquiry_id
        AND public.is_admin_of_team(inquiries.team_id)
    )
  );
