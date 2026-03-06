-- Migration: Add guardian invite code and account_type to team_members
-- team_members = コーチか保護者（auth アカウントの種別）
-- member_profiles = プレイヤー（またはコーチの自分プロファイル）

-- ── 1. account_type を team_members に追加 ────────────────────────────────────

alter table public.team_members
  add column account_type text not null default 'coach'
  check (account_type in ('coach', 'guardian'));

-- ── 2. 保護者用招待コードを teams に追加 ──────────────────────────────────────

alter table public.teams
  add column invite_code_guardian text unique not null
  default left(replace(gen_random_uuid()::text, '-', ''), 8);

-- ── 3. create_team_with_member: account_type='coach' を明示 ──────────────────

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

  insert into public.team_members (team_id, member_profile_id, role, account_type)
  values (new_team_id, new_profile_id, 'admin', 'coach');

  return new_team_id;
end;
$$ language plpgsql security definer;

-- ── 4. join_team_with_profile: コードの種別で account_type を自動判定 ─────────
-- コーチコード → account_type='coach'、保護者コード → account_type='guardian'（強制 player）

create or replace function public.join_team_with_profile(
  code text,
  profile_name text,
  profile_kind text default null
)
returns uuid as $$
declare
  found_team_id uuid;
  resolved_account_type text;
  resolved_kind text;
  new_profile_id uuid;
begin
  -- コーチ用招待コードで検索
  select id into found_team_id
  from public.teams
  where invite_code = code;

  if found_team_id is not null then
    resolved_account_type := 'coach';
    resolved_kind := coalesce(profile_kind, 'coach');
  else
    -- 保護者用招待コードで検索
    select id into found_team_id
    from public.teams
    where invite_code_guardian = code;

    if found_team_id is null then
      raise exception 'Invalid invite code';
    end if;

    resolved_account_type := 'guardian';
    resolved_kind := 'player';
  end if;

  insert into public.member_profiles (user_id, kind, name)
  values (auth.uid(), resolved_kind, profile_name)
  returning id into new_profile_id;

  insert into public.team_members (team_id, member_profile_id, role, account_type)
  values (found_team_id, new_profile_id, 'member', resolved_account_type);

  return found_team_id;
end;
$$ language plpgsql security definer;

-- ── 5. add_profile_to_team: 既存の account_type を引き継ぐ ───────────────────

create or replace function public.add_profile_to_team(
  target_team_id uuid,
  profile_name text,
  profile_kind text default 'player'
)
returns uuid as $$
declare
  new_profile_id uuid;
  user_account_type text;
begin
  if not public.is_member_of_team(target_team_id) then
    raise exception 'Not a member of this team';
  end if;

  -- 既存メンバーシップから account_type を取得
  select tm.account_type into user_account_type
  from public.team_members tm
  join public.member_profiles mp on mp.id = tm.member_profile_id
  where tm.team_id = target_team_id and mp.user_id = auth.uid()
  limit 1;

  -- 保護者は player のみ
  if user_account_type = 'guardian' then
    profile_kind := 'player';
  end if;

  insert into public.member_profiles (user_id, kind, name)
  values (auth.uid(), profile_kind, profile_name)
  returning id into new_profile_id;

  insert into public.team_members (team_id, member_profile_id, role, account_type)
  values (target_team_id, new_profile_id, 'member', coalesce(user_account_type, 'coach'));

  return new_profile_id;
end;
$$ language plpgsql security definer;

-- ── 6. regenerate_guardian_invite_code 関数 ───────────────────────────────────

create or replace function public.regenerate_guardian_invite_code(target_team_id uuid)
returns text as $$
declare
  new_code text;
begin
  if not public.is_admin_of_team(target_team_id) then
    raise exception 'Only admins can regenerate invite codes';
  end if;

  new_code := left(replace(gen_random_uuid()::text, '-', ''), 8);

  update public.teams
  set invite_code_guardian = new_code
  where id = target_team_id;

  return new_code;
end;
$$ language plpgsql security definer;

-- ── 7. is_coach_in_team ヘルパー関数 ─────────────────────────────────────────

create or replace function public.is_coach_in_team(tid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members tm
    join public.member_profiles mp on mp.id = tm.member_profile_id
    where tm.team_id = tid
      and mp.user_id = auth.uid()
      and tm.account_type = 'coach'
  );
$$;
