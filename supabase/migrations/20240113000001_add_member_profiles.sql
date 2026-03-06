-- Migration: Add member_profiles table
-- Refactors team_members and attendances from user-based to profile-based.
-- One auth user can have multiple member_profiles (e.g. a coach + player children).

-- ── 1. Create member_profiles table ──────────────────────────────────────────

create table public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null default 'player' check (kind in ('coach', 'player')),
  name text,
  avatar_url text,
  number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;

create trigger member_profiles_updated_at
  before update on public.member_profiles
  for each row execute function public.update_updated_at();

-- ── 2. Migrate existing data ──────────────────────────────────────────────────
-- Each unique user in team_members gets one coach member_profile.

insert into public.member_profiles (user_id, kind, name, avatar_url)
select distinct on (tm.user_id)
  tm.user_id,
  'coach',
  p.name,
  p.avatar_url
from public.team_members tm
join public.profiles p on p.id = tm.user_id;

-- ── 3. Update team_members: replace user_id with member_profile_id ────────────

alter table public.team_members
  add column member_profile_id uuid references public.member_profiles(id) on delete cascade;

-- Populate member_profile_id using the migrated profiles
update public.team_members tm
set member_profile_id = mp.id
from public.member_profiles mp
where mp.user_id = tm.user_id;

alter table public.team_members alter column member_profile_id set not null;

-- Drop dependent policies before dropping user_id column
drop policy if exists "Team admins can upload team icons" on storage.objects;
drop policy if exists "Team admins can update team icons" on storage.objects;
drop policy if exists "Team admins can delete team icons" on storage.objects;
drop policy if exists "Team members can view event_event_types" on public.event_event_types;
drop policy if exists "Team members can insert event_event_types" on public.event_event_types;
drop policy if exists "Team members can delete event_event_types" on public.event_event_types;

-- Drop old column (also drops team_members_team_id_user_id_key constraint)
alter table public.team_members drop column user_id;

-- New unique constraint
alter table public.team_members
  add constraint team_members_team_id_member_profile_id_key unique (team_id, member_profile_id);

-- ── 4. Update attendances: replace user_id with member_profile_id ─────────────

alter table public.attendances
  add column member_profile_id uuid references public.member_profiles(id) on delete cascade;

-- Populate member_profile_id (existing attendance user → their coach profile)
update public.attendances a
set member_profile_id = mp.id
from public.member_profiles mp
where mp.user_id = a.user_id;

-- Only set NOT NULL if all rows were populated (safe for empty table too)
alter table public.attendances alter column member_profile_id set not null;

-- Drop old column (also drops attendances_event_id_user_id_key constraint)
alter table public.attendances drop column user_id;

-- New unique constraint
alter table public.attendances
  add constraint attendances_event_id_member_profile_id_key unique (event_id, member_profile_id);

-- ── 5. Update helper functions ────────────────────────────────────────────────

-- Checks if current auth user is in a team (via any of their member_profiles)
create or replace function public.is_member_of_team(tid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members tm
    join public.member_profiles mp on mp.id = tm.member_profile_id
    where tm.team_id = tid and mp.user_id = auth.uid()
  );
$$;

-- Checks if current auth user is an admin of a team
create or replace function public.is_admin_of_team(tid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members tm
    join public.member_profiles mp on mp.id = tm.member_profile_id
    where tm.team_id = tid and mp.user_id = auth.uid() and tm.role = 'admin'
  );
$$;

-- Checks if current auth user owns a given member_profile
create or replace function public.owns_member_profile(profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.member_profiles
    where id = profile_id and user_id = auth.uid()
  );
$$;

-- Returns a team_id for the current user (used in middleware)
create or replace function public.get_my_team_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select tm.team_id
  from public.team_members tm
  join public.member_profiles mp on mp.id = tm.member_profile_id
  where mp.user_id = auth.uid()
  limit 1;
$$;

-- ── 6. Update team_members RLS policies ──────────────────────────────────────

drop policy if exists "Users can view own membership" on public.team_members;
drop policy if exists "Team members can view teammates" on public.team_members;
drop policy if exists "Authenticated users can join a team" on public.team_members;
drop policy if exists "Team admins can update members" on public.team_members;
drop policy if exists "Team admins can remove members" on public.team_members;

create policy "Users can view own membership"
  on public.team_members for select to authenticated
  using (public.owns_member_profile(member_profile_id));

create policy "Team members can view teammates"
  on public.team_members for select to authenticated
  using (public.is_member_of_team(team_id));

create policy "Users can join team with own profile"
  on public.team_members for insert to authenticated
  with check (public.owns_member_profile(member_profile_id));

create policy "Team admins can update members"
  on public.team_members for update to authenticated
  using (public.is_admin_of_team(team_id));

create policy "Team admins can remove members"
  on public.team_members for delete to authenticated
  using (public.is_admin_of_team(team_id));

-- ── 7. Update teams RLS policies ─────────────────────────────────────────────

drop policy if exists "Team members can view their team" on public.teams;
drop policy if exists "Team admins can update their team" on public.teams;
drop policy if exists "Team admins can delete their team" on public.teams;

create policy "Team members can view their team"
  on public.teams for select to authenticated
  using (public.is_member_of_team(id));

create policy "Team admins can update their team"
  on public.teams for update to authenticated
  using (public.is_admin_of_team(id));

create policy "Team admins can delete their team"
  on public.teams for delete to authenticated
  using (public.is_admin_of_team(id));

-- ── 8. Update events RLS policies ────────────────────────────────────────────

drop policy if exists "Team members can view events" on public.events;
drop policy if exists "Team members can create events" on public.events;
drop policy if exists "Admins and creators can update events" on public.events;
drop policy if exists "Admins and creators can delete events" on public.events;

create policy "Team members can view events"
  on public.events for select to authenticated
  using (public.is_member_of_team(team_id));

create policy "Team members can create events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and public.is_member_of_team(team_id)
  );

create policy "Admins and creators can update events"
  on public.events for update to authenticated
  using (
    public.is_admin_of_team(team_id)
    or (public.is_member_of_team(team_id) and created_by = auth.uid())
  );

create policy "Admins and creators can delete events"
  on public.events for delete to authenticated
  using (
    public.is_admin_of_team(team_id)
    or (public.is_member_of_team(team_id) and created_by = auth.uid())
  );

-- ── 9. Update announcements RLS policies ─────────────────────────────────────

drop policy if exists "Team members can view announcements" on public.announcements;
drop policy if exists "Team admins can create announcements" on public.announcements;
drop policy if exists "Team admins can update announcements" on public.announcements;
drop policy if exists "Team admins can delete announcements" on public.announcements;

create policy "Team members can view announcements"
  on public.announcements for select to authenticated
  using (public.is_member_of_team(team_id));

create policy "Team admins can create announcements"
  on public.announcements for insert to authenticated
  with check (
    auth.uid() = author_id
    and public.is_admin_of_team(team_id)
  );

create policy "Team admins can update announcements"
  on public.announcements for update to authenticated
  using (public.is_admin_of_team(team_id));

create policy "Team admins can delete announcements"
  on public.announcements for delete to authenticated
  using (public.is_admin_of_team(team_id));

-- ── 10. Update event_types RLS policies ──────────────────────────────────────

drop policy if exists "Team members can view event types" on public.event_types;
drop policy if exists "Admins can insert event types" on public.event_types;
drop policy if exists "Admins can update event types" on public.event_types;
drop policy if exists "Admins can delete event types" on public.event_types;

create policy "Team members can view event types"
  on public.event_types for select to authenticated
  using (public.is_member_of_team(team_id));

create policy "Admins can insert event types"
  on public.event_types for insert to authenticated
  with check (public.is_admin_of_team(team_id));

create policy "Admins can update event types"
  on public.event_types for update to authenticated
  using (public.is_admin_of_team(team_id));

create policy "Admins can delete event types"
  on public.event_types for delete to authenticated
  using (public.is_admin_of_team(team_id));

-- ── 11. Update attendances RLS policies ──────────────────────────────────────

drop policy if exists "Team members can view attendances" on public.attendances;
drop policy if exists "Users can insert own attendance" on public.attendances;
drop policy if exists "Users can update own attendance" on public.attendances;
drop policy if exists "Users can delete own attendance" on public.attendances;

create policy "Team members can view attendances"
  on public.attendances for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = attendances.event_id
        and public.is_member_of_team(e.team_id)
    )
  );

create policy "Users can insert own attendance"
  on public.attendances for insert to authenticated
  with check (
    public.owns_member_profile(member_profile_id)
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_member_of_team(e.team_id)
    )
  );

create policy "Users can update own attendance"
  on public.attendances for update to authenticated
  using (public.owns_member_profile(member_profile_id))
  with check (public.owns_member_profile(member_profile_id));

create policy "Users can delete own attendance"
  on public.attendances for delete to authenticated
  using (public.owns_member_profile(member_profile_id));

-- ── 12. member_profiles RLS policies ─────────────────────────────────────────

create policy "Users can view member profiles in shared teams"
  on public.member_profiles for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.team_members tm
      where tm.member_profile_id = member_profiles.id
        and public.is_member_of_team(tm.team_id)
    )
  );

create policy "Users can insert own member profiles"
  on public.member_profiles for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own member profiles"
  on public.member_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own member profiles"
  on public.member_profiles for delete to authenticated
  using (user_id = auth.uid());

-- ── 13. Update create_team_with_member function ───────────────────────────────

create or replace function public.create_team_with_member(
  team_name text,
  profile_name text default null,
  profile_kind text default 'coach'
)
returns uuid as $$
declare
  new_team_id uuid;
  new_profile_id uuid;
  resolved_name text;
begin
  if trim(team_name) = '' then
    raise exception 'Team name cannot be empty';
  end if;

  if profile_name is not null and trim(profile_name) != '' then
    resolved_name := trim(profile_name);
  else
    select name into resolved_name from public.profiles where id = auth.uid();
  end if;

  insert into public.teams (name, created_by)
  values (trim(team_name), auth.uid())
  returning id into new_team_id;

  insert into public.member_profiles (user_id, kind, name)
  values (auth.uid(), profile_kind, resolved_name)
  returning id into new_profile_id;

  insert into public.team_members (team_id, member_profile_id, role)
  values (new_team_id, new_profile_id, 'admin');

  return new_team_id;
end;
$$ language plpgsql security definer;

-- ── 14. New: join_team_with_profile function ──────────────────────────────────

create or replace function public.join_team_with_profile(
  code text,
  profile_name text,
  profile_kind text default 'player'
)
returns uuid as $$
declare
  found_team_id uuid;
  new_profile_id uuid;
begin
  select id into found_team_id
  from public.teams
  where invite_code = code;

  if found_team_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.member_profiles (user_id, kind, name)
  values (auth.uid(), profile_kind, profile_name)
  returning id into new_profile_id;

  insert into public.team_members (team_id, member_profile_id, role)
  values (found_team_id, new_profile_id, 'member');

  return found_team_id;
end;
$$ language plpgsql security definer;

-- ── 15. New: add_profile_to_team function ────────────────────────────────────

create or replace function public.add_profile_to_team(
  target_team_id uuid,
  profile_name text,
  profile_kind text default 'player'
)
returns uuid as $$
declare
  new_profile_id uuid;
begin
  if not public.is_member_of_team(target_team_id) then
    raise exception 'Not a member of this team';
  end if;

  insert into public.member_profiles (user_id, kind, name)
  values (auth.uid(), profile_kind, profile_name)
  returning id into new_profile_id;

  insert into public.team_members (team_id, member_profile_id, role)
  values (target_team_id, new_profile_id, 'member');

  return new_profile_id;
end;
$$ language plpgsql security definer;

-- ── 16. Update regenerate_invite_code function ───────────────────────────────

create or replace function public.regenerate_invite_code(target_team_id uuid)
returns text as $$
declare
  new_code text;
begin
  if not public.is_admin_of_team(target_team_id) then
    raise exception 'Only admins can regenerate invite codes';
  end if;

  new_code := left(replace(gen_random_uuid()::text, '-', ''), 8);

  update public.teams
  set invite_code = new_code
  where id = target_team_id;

  return new_code;
end;
$$ language plpgsql security definer;

-- ── 17. Recreate storage and event_event_types policies ───────────────────────
-- (These were cascade-dropped when team_members.user_id was removed)

create policy "Team admins can upload team icons"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'team-icons'
    and public.is_admin_of_team((storage.foldername(name))[1]::uuid)
  );

create policy "Team admins can update team icons"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'team-icons'
    and public.is_admin_of_team((storage.foldername(name))[1]::uuid)
  );

create policy "Team admins can delete team icons"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'team-icons'
    and public.is_admin_of_team((storage.foldername(name))[1]::uuid)
  );

create policy "Team members can view event_event_types"
  on public.event_event_types for select
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_event_types.event_id
        and public.is_member_of_team(e.team_id)
    )
  );

create policy "Team members can insert event_event_types"
  on public.event_event_types for insert
  to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_event_types.event_id
        and public.is_member_of_team(e.team_id)
    )
  );

create policy "Team members can delete event_event_types"
  on public.event_event_types for delete
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_event_types.event_id
        and public.is_member_of_team(e.team_id)
    )
  );
