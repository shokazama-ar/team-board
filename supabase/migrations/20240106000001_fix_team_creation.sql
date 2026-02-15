-- Fix: Atomic team creation to prevent orphaned teams
-- Previous approach used two separate INSERTs (teams + team_members) from client-side,
-- which could leave orphaned team rows when the second INSERT failed.

-- Atomic team creation function (security definer to bypass RLS within transaction)
create or replace function public.create_team_with_member(team_name text)
returns uuid as $$
declare
  new_team_id uuid;
begin
  -- Validate input
  if trim(team_name) = '' then
    raise exception 'Team name cannot be empty';
  end if;

  -- Create team
  insert into public.teams (name, created_by)
  values (trim(team_name), auth.uid())
  returning id into new_team_id;

  -- Add creator as admin member (same transaction)
  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, auth.uid(), 'admin');

  return new_team_id;
end;
$$ language plpgsql security definer;
