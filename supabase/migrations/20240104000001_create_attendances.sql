-- Create attendances table
create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'undecided' check (status in ('present', 'absent', 'undecided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- Auto-update updated_at (reuse existing function)
create trigger attendances_updated_at
  before update on public.attendances
  for each row execute function public.update_updated_at();

-- Enable RLS
alter table public.attendances enable row level security;

-- SELECT: team members can view attendances for events in their teams
create policy "Team members can view attendances"
  on public.attendances for select
  using (
    exists (
      select 1 from public.events e
      join public.team_members tm on tm.team_id = e.team_id
      where e.id = attendances.event_id
        and tm.user_id = auth.uid()
    )
  );

-- INSERT: users can only create their own attendance
create policy "Users can insert own attendance"
  on public.attendances for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events e
      join public.team_members tm on tm.team_id = e.team_id
      where e.id = event_id
        and tm.user_id = auth.uid()
    )
  );

-- UPDATE: users can only update their own attendance
create policy "Users can update own attendance"
  on public.attendances for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: users can only delete their own attendance
create policy "Users can delete own attendance"
  on public.attendances for delete
  using (auth.uid() = user_id);
