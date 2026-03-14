-- Migration: guardian_no_member_profile
-- 保護者招待コードでの参加時にmember_profilesを作成しないよう修正

-- 1-1. team_members.member_profile_id を nullable に変更
ALTER TABLE public.team_members
  ALTER COLUMN member_profile_id DROP NOT NULL;

-- 1-2. 既存の保護者レコードを修正（orphan profile を削除）
-- 保護者行のorphanプロファイルIDをNULL化
UPDATE public.team_members
SET member_profile_id = NULL
WHERE account_type = 'guardian';

-- 参照が切れたguardian用プロファイルを削除
-- (team_membersからもう参照されていない、かつ kind='player')
-- ※ 他のチームで参照されている場合は残す
DELETE FROM public.member_profiles mp
WHERE kind = 'player'
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.member_profile_id = mp.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.member_profile_access mpa
    WHERE mpa.member_profile_id = mp.id
  );

-- 1-3. sync_team_member_user_id トリガー関数を更新
-- member_profile_id が NULL のとき user_id を上書きしないよう修正
CREATE OR REPLACE FUNCTION public.sync_team_member_user_id()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.member_profile_id IS NOT NULL THEN
    NEW.user_id := (SELECT user_id FROM public.member_profiles WHERE id = NEW.member_profile_id);
  END IF;
  -- member_profile_id IS NULL の場合は呼び出し元が user_id を明示セット
  RETURN NEW;
END;
$$;

-- 1-4. join_team_with_profile() 関数を更新
-- 保護者の場合は member_profiles を作成せず team_members に直接 INSERT する
CREATE OR REPLACE FUNCTION public.join_team_with_profile(
  code text,
  profile_name text default null,
  profile_kind text default null
)
RETURNS uuid AS $$
DECLARE
  found_team_id uuid;
  resolved_account_type text;
  resolved_kind text;
  new_profile_id uuid;
BEGIN
  -- コーチ用招待コードで検索
  SELECT id INTO found_team_id
  FROM public.teams
  WHERE invite_code = code;

  IF found_team_id IS NOT NULL THEN
    resolved_account_type := 'coach';
    resolved_kind := COALESCE(profile_kind, 'coach');
  ELSE
    -- 保護者用招待コードで検索
    SELECT id INTO found_team_id
    FROM public.teams
    WHERE invite_code_guardian = code;

    IF found_team_id IS NULL THEN
      RAISE EXCEPTION 'Invalid invite code';
    END IF;

    resolved_account_type := 'guardian';
  END IF;

  IF resolved_account_type = 'guardian' THEN
    -- 保護者: member_profiles は作成しない
    INSERT INTO public.team_members (team_id, member_profile_id, user_id, role, account_type)
    VALUES (found_team_id, NULL, auth.uid(), 'member', 'guardian');
  ELSE
    -- コーチ: プロファイルを作成してから参加
    INSERT INTO public.member_profiles (user_id, kind, name)
    VALUES (auth.uid(), resolved_kind, profile_name)
    RETURNING id INTO new_profile_id;

    INSERT INTO public.team_members (team_id, member_profile_id, role, account_type)
    VALUES (found_team_id, new_profile_id, 'member', 'coach');
  END IF;

  RETURN found_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1-5. team_members INSERT RLSポリシーを更新
-- member_profile_id が NULL の保護者INSERT を許可する
DROP POLICY IF EXISTS "Users can join team with own profile" ON public.team_members;

CREATE POLICY "Users can join team with own profile"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    (member_profile_id IS NOT NULL AND public.owns_member_profile(member_profile_id))
    OR (member_profile_id IS NULL AND user_id = auth.uid())
  );
