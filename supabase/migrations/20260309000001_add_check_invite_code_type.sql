-- 招待コードの種別を返す
create or replace function public.check_invite_code_type(code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists(select 1 from public.teams where invite_code = code) then
    return 'coach';
  elsif exists(select 1 from public.teams where invite_code_guardian = code) then
    return 'guardian';
  else
    return null;
  end if;
end;
$$;

-- create_team_with_member に team_account_type 引数を追加
create or replace function public.create_team_with_member(
  team_name text,
  profile_name text default null,
  profile_kind text default 'coach',
  team_account_type text default 'coach'
)
returns uuid as $$
declare
  new_team_id uuid;
  new_profile_id uuid;
  resolved_name text;
  resolved_kind text;
begin
  if trim(team_name) = '' then
    raise exception 'Team name cannot be empty';
  end if;

  resolved_name := coalesce(nullif(trim(coalesce(profile_name, '')), ''),
    (select name from public.profiles where id = auth.uid()));

  -- 保護者の場合は kind を強制的に player に
  resolved_kind := case when team_account_type = 'guardian' then 'player' else profile_kind end;

  insert into public.teams (name, created_by)
  values (trim(team_name), auth.uid())
  returning id into new_team_id;

  insert into public.member_profiles (user_id, kind, name)
  values (auth.uid(), resolved_kind, resolved_name)
  returning id into new_profile_id;

  insert into public.team_members (team_id, member_profile_id, role, account_type)
  values (new_team_id, new_profile_id, 'admin', team_account_type);

  return new_team_id;
end;
$$ language plpgsql security definer;
