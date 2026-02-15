-- Create events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  event_type text not null default 'practice' check (event_type in ('practice', 'game', 'other')),
  date timestamptz not null,
  location text,
  memo text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.events enable row level security;

-- SELECT: team members can view events
create policy "Team members can view events"
  on public.events for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = events.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- INSERT: team members can create events
create policy "Team members can create events"
  on public.events for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.team_members
      where team_members.team_id = events.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- UPDATE: admin or creator only
create policy "Admins and creators can update events"
  on public.events for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = events.team_id
      and team_members.user_id = auth.uid()
      and (team_members.role = 'admin' or events.created_by = auth.uid())
    )
  );

-- DELETE: admin or creator only
create policy "Admins and creators can delete events"
  on public.events for delete
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = events.team_id
      and team_members.user_id = auth.uid()
      and (team_members.role = 'admin' or events.created_by = auth.uid())
    )
  );

-- Apply updated_at trigger
create trigger events_updated_at
  before update on public.events
  for each row execute function public.update_updated_at();
