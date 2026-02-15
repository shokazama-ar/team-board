-- Create teams table
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default encode(gen_random_bytes(4), 'hex'),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create team_members table
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now() not null,
  unique(team_id, user_id)
);

-- Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Teams RLS policies
create policy "Team members can view their team"
  on public.teams for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team creators can view their own team"
  on public.teams for select
  to authenticated
  using (auth.uid() = created_by);

create policy "Authenticated users can create teams"
  on public.teams for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Team admins can update their team"
  on public.teams for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

create policy "Team admins can delete their team"
  on public.teams for delete
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

-- Team members RLS policies
create policy "Team members can view members of their team"
  on public.team_members for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members as my_membership
      where my_membership.team_id = team_members.team_id
      and my_membership.user_id = auth.uid()
    )
  );

create policy "Authenticated users can join a team"
  on public.team_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Team admins can update members"
  on public.team_members for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members as admin_check
      where admin_check.team_id = team_members.team_id
      and admin_check.user_id = auth.uid()
      and admin_check.role = 'admin'
    )
  );

create policy "Team admins can remove members"
  on public.team_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.team_members as admin_check
      where admin_check.team_id = team_members.team_id
      and admin_check.user_id = auth.uid()
      and admin_check.role = 'admin'
    )
  );

-- Apply updated_at trigger to teams
create trigger teams_updated_at
  before update on public.teams
  for each row execute function public.update_updated_at();

-- Function to look up a team by invite code (bypasses RLS for joining)
create or replace function public.join_team_by_invite_code(code text)
returns uuid as $$
declare
  found_team_id uuid;
begin
  select id into found_team_id
  from public.teams
  where invite_code = code;

  if found_team_id is null then
    raise exception 'Invalid invite code';
  end if;

  return found_team_id;
end;
$$ language plpgsql security definer;

-- Function to regenerate invite code
create or replace function public.regenerate_invite_code(target_team_id uuid)
returns text as $$
declare
  new_code text;
begin
  -- Verify caller is admin
  if not exists (
    select 1 from public.team_members
    where team_id = target_team_id
    and user_id = auth.uid()
    and role = 'admin'
  ) then
    raise exception 'Only admins can regenerate invite codes';
  end if;

  new_code := encode(gen_random_bytes(4), 'hex');

  update public.teams
  set invite_code = new_code
  where id = target_team_id;

  return new_code;
end;
$$ language plpgsql security definer;
