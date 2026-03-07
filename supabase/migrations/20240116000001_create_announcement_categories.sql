-- Migration: announcement_categories
-- Links announcements to event_types (kind='category').
-- No rows = announcement is visible to all team members.
-- With rows = visible only to admins + users who have a player in one of the categories.

-- ── 1. Create table ───────────────────────────────────────────────────────────

create table public.announcement_categories (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  event_type_id uuid not null references public.event_types(id) on delete cascade,
  unique (announcement_id, event_type_id)
);

alter table public.announcement_categories enable row level security;

create policy "Team members can view announcement_categories"
  on public.announcement_categories for select to authenticated
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_categories.announcement_id
        and public.is_member_of_team(a.team_id)
    )
  );

create policy "Admins can insert announcement_categories"
  on public.announcement_categories for insert to authenticated
  with check (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_categories.announcement_id
        and public.is_admin_of_team(a.team_id)
    )
  );

create policy "Admins can delete announcement_categories"
  on public.announcement_categories for delete to authenticated
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_categories.announcement_id
        and public.is_admin_of_team(a.team_id)
    )
  );

-- ── 2. Update announcements SELECT policy ─────────────────────────────────────
-- Replace the existing policy with one that filters by category.

drop policy if exists "Team members can view announcements" on public.announcements;

create policy "Team members can view announcements"
  on public.announcements for select to authenticated
  using (
    public.is_member_of_team(team_id)
    and (
      -- Admins always see everything
      public.is_admin_of_team(team_id)
      -- No categories set → visible to all members
      or not exists (
        select 1 from public.announcement_categories ac
        where ac.announcement_id = announcements.id
      )
      -- User has at least one player belonging to one of the announcement's categories
      or exists (
        select 1
        from public.announcement_categories ac
        join public.member_profile_categories mpc on mpc.event_type_id = ac.event_type_id
        join public.member_profiles mp on mp.id = mpc.member_profile_id
        join public.team_members tm on tm.member_profile_id = mp.id
        where ac.announcement_id = announcements.id
          and mp.user_id = auth.uid()
          and tm.team_id = announcements.team_id
      )
    )
  );
