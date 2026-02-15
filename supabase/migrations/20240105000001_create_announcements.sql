-- Create announcements table
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Apply updated_at trigger
create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.update_updated_at();

-- Enable RLS
alter table public.announcements enable row level security;

-- SELECT: team members can view announcements
create policy "Team members can view announcements"
  on public.announcements for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = announcements.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- INSERT: team admins can create announcements
create policy "Team admins can create announcements"
  on public.announcements for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.team_members
      where team_members.team_id = announcements.team_id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

-- UPDATE: team admins can update announcements
create policy "Team admins can update announcements"
  on public.announcements for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = announcements.team_id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

-- DELETE: team admins can delete announcements
create policy "Team admins can delete announcements"
  on public.announcements for delete
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = announcements.team_id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );
