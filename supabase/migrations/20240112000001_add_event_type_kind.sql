-- Add kind column to event_types
alter table public.event_types
  add column kind text not null default 'type'
  check (kind in ('type', 'category'));

-- All existing rows are event types (already default 'type')

-- Insert default categories for existing teams
insert into public.event_types (team_id, name, color, sort_order, kind)
select id, '全体',  '#2563eb', 0, 'category' from public.teams
union all
select id, '男子',  '#0891b2', 1, 'category' from public.teams
union all
select id, '女子',  '#db2777', 2, 'category' from public.teams;

-- Update trigger to also create default categories for new teams
create or replace function public.create_default_event_types()
returns trigger as $$
begin
  insert into public.event_types (team_id, name, color, sort_order, kind)
  values
    (new.id, '練習',  '#16a34a', 0, 'type'),
    (new.id, '試合',  '#dc2626', 1, 'type'),
    (new.id, 'その他','#6b7280', 2, 'type'),
    (new.id, '全体',  '#2563eb', 0, 'category'),
    (new.id, '男子',  '#0891b2', 1, 'category'),
    (new.id, '女子',  '#db2777', 2, 'category');
  return new;
end;
$$ language plpgsql security definer;
