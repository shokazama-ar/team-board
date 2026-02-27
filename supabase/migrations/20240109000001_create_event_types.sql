-- Create event_types table
create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  color text not null default '#6b7280',
  sort_order int not null default 0,
  created_at timestamptz default now() not null,
  unique (team_id, name)
);

-- Enable RLS
alter table public.event_types enable row level security;

-- SELECT: team members can view event types
create policy "Team members can view event types"
  on public.event_types for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = event_types.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- INSERT: admins can add event types
create policy "Admins can insert event types"
  on public.event_types for insert
  to authenticated
  with check (
    exists (
      select 1 from public.team_members
      where team_members.team_id = event_types.team_id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

-- UPDATE: admins can update event types
create policy "Admins can update event types"
  on public.event_types for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = event_types.team_id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

-- DELETE: admins can delete event types
create policy "Admins can delete event types"
  on public.event_types for delete
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = event_types.team_id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

-- Insert default event types for all existing teams
insert into public.event_types (team_id, name, color, sort_order)
select id, '練習', '#16a34a', 0 from public.teams
union all
select id, '試合', '#dc2626', 1 from public.teams
union all
select id, 'その他', '#6b7280', 2 from public.teams;

-- Add event_type_id column to events (nullable FK)
alter table public.events add column event_type_id uuid references public.event_types(id) on delete set null;

-- Migrate existing events: map old string values to new event_type_id
update public.events e
set event_type_id = (
  select et.id
  from public.event_types et
  where et.team_id = e.team_id
  and et.name = case e.event_type
    when 'practice' then '練習'
    when 'game' then '試合'
    else 'その他'
  end
  limit 1
);

-- Drop the old CHECK constraint on event_type
alter table public.events drop constraint if exists events_event_type_check;

-- Function: create default event types for a new team
create or replace function public.create_default_event_types()
returns trigger as $$
begin
  insert into public.event_types (team_id, name, color, sort_order)
  values
    (new.id, '練習', '#16a34a', 0),
    (new.id, '試合', '#dc2626', 1),
    (new.id, 'その他', '#6b7280', 2);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: auto-create default event types on team creation
create trigger teams_create_default_event_types
  after insert on public.teams
  for each row execute function public.create_default_event_types();
