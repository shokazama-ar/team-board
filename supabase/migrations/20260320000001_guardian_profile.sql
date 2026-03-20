-- Migration: guardian_profile
-- 保護者チーム参加時に guardian プロファイルを作成する

-- 1. member_profiles.kind の CHECK 制約を更新
ALTER TABLE public.member_profiles
  DROP CONSTRAINT IF EXISTS member_profiles_kind_check;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_kind_check
  CHECK (kind IN ('coach', 'player', 'guardian'));

-- 2-a: member_profile_id=NULL の guardian に guardian プロファイルを作成・リンク
DO $$
DECLARE
  rec RECORD;
  new_profile_id uuid;
  user_name text;
BEGIN
  FOR rec IN
    SELECT tm.id AS tm_id, tm.user_id, tm.team_id
    FROM public.team_members tm
    WHERE tm.account_type = 'guardian'
      AND tm.member_profile_id IS NULL
      AND tm.user_id IS NOT NULL
  LOOP
    SELECT name INTO user_name FROM public.profiles WHERE id = rec.user_id;

    INSERT INTO public.member_profiles (user_id, kind, name)
    VALUES (rec.user_id, 'guardian', COALESCE(user_name, ''))
    RETURNING id INTO new_profile_id;

    UPDATE public.team_members
    SET member_profile_id = new_profile_id
    WHERE id = rec.tm_id;
  END LOOP;
END $$;

-- 2-b: guardian の team_members に player プロファイルが紐付いている場合（ローカルDB）
-- player プロファイルを guardian に差し替える
DO $$
DECLARE
  rec RECORD;
  new_profile_id uuid;
  user_name text;
BEGIN
  FOR rec IN
    SELECT tm.id AS tm_id, tm.user_id, tm.team_id, tm.member_profile_id AS old_profile_id
    FROM public.team_members tm
    JOIN public.member_profiles mp ON mp.id = tm.member_profile_id
    WHERE tm.account_type = 'guardian'
      AND mp.kind = 'player'
  LOOP
    SELECT name INTO user_name FROM public.profiles WHERE id = rec.user_id;

    -- 新しい guardian プロファイルを作成
    INSERT INTO public.member_profiles (user_id, kind, name)
    VALUES (rec.user_id, 'guardian', COALESCE(user_name, ''))
    RETURNING id INTO new_profile_id;

    -- team_members を新プロファイルに差し替え
    UPDATE public.team_members
    SET member_profile_id = new_profile_id
    WHERE id = rec.tm_id;

    -- 旧 player プロファイルを削除（他で参照されていなければ）
    DELETE FROM public.member_profiles
    WHERE id = rec.old_profile_id
      AND NOT EXISTS (
        SELECT 1 FROM public.team_members WHERE member_profile_id = rec.old_profile_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.member_profile_access WHERE member_profile_id = rec.old_profile_id
      );
  END LOOP;
END $$;

-- 3. join_team_with_profile() を更新
CREATE OR REPLACE FUNCTION public.join_team_with_profile(
  code text,
  profile_name text DEFAULT NULL,
  profile_kind text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  found_team_id uuid;
  resolved_account_type text;
  resolved_kind text;
  new_profile_id uuid;
  resolved_name text;
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
    resolved_kind := 'guardian';
  END IF;

  -- プロファイル名: 引数があれば使用、なければ profiles テーブルから取得
  IF profile_name IS NOT NULL AND trim(profile_name) != '' THEN
    resolved_name := trim(profile_name);
  ELSE
    SELECT name INTO resolved_name FROM public.profiles WHERE id = auth.uid();
  END IF;

  -- member_profiles を作成
  INSERT INTO public.member_profiles (user_id, kind, name)
  VALUES (auth.uid(), resolved_kind, resolved_name)
  RETURNING id INTO new_profile_id;

  -- team_members に追加
  INSERT INTO public.team_members (team_id, member_profile_id, role, account_type)
  VALUES (found_team_id, new_profile_id, 'member', resolved_account_type);

  RETURN found_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. team_members INSERT RLSポリシーを元に戻す（member_profile_id 必須に）
DROP POLICY IF EXISTS "Users can join team with own profile" ON public.team_members;

CREATE POLICY "Users can join team with own profile"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    member_profile_id IS NOT NULL
    AND public.owns_member_profile(member_profile_id)
  );
