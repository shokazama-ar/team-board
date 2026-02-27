-- Junction table: events <-> event_types (multiple types per event)
create table public.event_event_types (
  event_id uuid not null references public.events(id) on delete cascade,
  event_type_id uuid not null references public.event_types(id) on delete cascade,
  primary key (event_id, event_type_id)
);

alter table public.event_event_types enable row level security;

create policy "Team members can view event_event_types"
  on public.event_event_types for select
  to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.team_members tm on tm.team_id = e.team_id
      where e.id = event_event_types.event_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Team members can insert event_event_types"
  on public.event_event_types for insert
  to authenticated
  with check (
    exists (
      select 1 from public.events e
      join public.team_members tm on tm.team_id = e.team_id
      where e.id = event_event_types.event_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Team members can delete event_event_types"
  on public.event_event_types for delete
  to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.team_members tm on tm.team_id = e.team_id
      where e.id = event_event_types.event_id
        and tm.user_id = auth.uid()
    )
  );

-- Migrate existing single event_type_id to junction table
insert into public.event_event_types (event_id, event_type_id)
select id, event_type_id
from public.events
where event_type_id is not null;
