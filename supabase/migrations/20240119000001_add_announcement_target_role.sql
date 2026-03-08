-- announcements テーブルに target_role カラムを追加
ALTER TABLE announcements
  ADD COLUMN target_role text CHECK (target_role IN ('admin', 'member') OR target_role IS NULL)
  DEFAULT NULL;

COMMENT ON COLUMN announcements.target_role IS
  'NULL=全メンバー向け, admin=管理者のみ, member=一般メンバーのみ';

-- 既存の SELECT ポリシーを DROP して再作成
DROP POLICY IF EXISTS "Team members can view announcements" ON announcements;

CREATE POLICY "Team members can view announcements" ON announcements
  FOR SELECT TO authenticated USING (
    public.is_member_of_team(team_id)
    AND (
      -- target_role フィルタ: admin のみの投稿は管理者にのみ表示
      target_role IS NULL
      OR target_role = 'member'
      OR (target_role = 'admin' AND public.is_admin_of_team(team_id))
    )
    AND (
      -- Admins always see everything (category filter bypass)
      public.is_admin_of_team(team_id)
      -- No categories set → visible to all members
      OR NOT EXISTS (
        SELECT 1 FROM public.announcement_categories ac
        WHERE ac.announcement_id = announcements.id
      )
      -- User has at least one player belonging to one of the announcement's categories
      OR EXISTS (
        SELECT 1
        FROM public.announcement_categories ac
        JOIN public.member_profile_categories mpc ON mpc.event_type_id = ac.event_type_id
        JOIN public.member_profiles mp ON mp.id = mpc.member_profile_id
        JOIN public.team_members tm ON tm.member_profile_id = mp.id
        WHERE ac.announcement_id = announcements.id
          AND mp.user_id = auth.uid()
          AND tm.team_id = announcements.team_id
      )
    )
  );
