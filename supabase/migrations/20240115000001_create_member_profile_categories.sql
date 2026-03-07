-- Migration: Create member_profile_categories table
-- Stores which categories (event_types.kind='category') each player belongs to.
-- Used to control visibility of events and announcements per player.

create table public.member_profile_categories (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  event_type_id uuid not null references public.event_types(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_profile_id, event_type_id)
);

alter table public.member_profile_categories enable row level security;

-- SELECT: all team members can view
create policy "Team members can view member_profile_categories"
  on public.member_profile_categories for select to authenticated
  using (public.is_member_of_team(team_id));

-- INSERT: admins only
create policy "Admins can insert member_profile_categories"
  on public.member_profile_categories for insert to authenticated
  with check (public.is_admin_of_team(team_id));

-- DELETE: admins only
create policy "Admins can delete member_profile_categories"
  on public.member_profile_categories for delete to authenticated
  using (public.is_admin_of_team(team_id));
