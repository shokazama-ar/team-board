-- Fix infinite recursion between announcements and announcement_categories RLS policies.
--
-- The cycle:
--   announcements SELECT policy  → queries announcement_categories
--   announcement_categories SELECT policy → queries announcements  ← loop!
--
-- Fix: replace the announcement_categories SELECT policy with one that uses
-- a SECURITY DEFINER function to fetch team_id from announcements,
-- bypassing RLS on that table and breaking the cycle.

create or replace function public.get_announcement_team_id(p_announcement_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select team_id from public.announcements where id = p_announcement_id;
$$;

-- Recreate the SELECT policy without referencing the announcements table directly
drop policy if exists "Team members can view announcement_categories" on public.announcement_categories;

create policy "Team members can view announcement_categories"
  on public.announcement_categories for select to authenticated
  using (
    public.is_member_of_team(
      public.get_announcement_team_id(announcement_categories.announcement_id)
    )
  );
