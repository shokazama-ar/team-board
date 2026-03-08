-- Migration: Allow users to self-manage their own profile categories
-- Coach profiles can now have category assignments (担当カテゴリ),
-- in addition to the existing admin-controlled player category assignments.

-- Users can insert categories for their own profiles
create policy "Users can insert own member_profile_categories"
  on public.member_profile_categories for insert to authenticated
  with check (
    public.owns_member_profile(member_profile_id)
    and public.is_member_of_team(team_id)
  );

-- Users can delete categories for their own profiles
create policy "Users can delete own member_profile_categories"
  on public.member_profile_categories for delete to authenticated
  using (public.owns_member_profile(member_profile_id));
