-- Migration: guardian_only_join
-- 参加フロー変更 — 保護者統一入口・コーチ権限後付け
-- コーチ用招待コード廃止、保護者コード1本に統一

-- 1. teams.invite_code 列を DROP（コーチ用招待コードを廃止）
ALTER TABLE public.teams DROP COLUMN IF EXISTS invite_code;

-- 2. regenerate_invite_code 関数を DROP（コーチ用コード再生成は不要）
DROP FUNCTION IF EXISTS public.regenerate_invite_code(uuid);

-- 3. join_team_with_profile() を書き直し（保護者コードのみ受け付ける）
CREATE OR REPLACE FUNCTION public.join_team_with_profile(
  code text,
  profile_name text DEFAULT NULL,  -- 後方互換のため残すが使用しない
  profile_kind text DEFAULT NULL   -- 後方互換のため残すが使用しない
)
RETURNS uuid AS $$
DECLARE
  found_team_id uuid;
  resolved_name text;
  new_profile_id uuid;
BEGIN
  -- 保護者用招待コードのみ受け付ける
  SELECT id INTO found_team_id
  FROM public.teams
  WHERE invite_code_guardian = code;

  IF found_team_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- プロファイル名: profiles テーブルから取得
  SELECT name INTO resolved_name FROM public.profiles WHERE id = auth.uid();

  -- member_profiles を guardian として作成
  INSERT INTO public.member_profiles (user_id, kind, name)
  VALUES (auth.uid(), 'guardian', resolved_name)
  RETURNING id INTO new_profile_id;

  -- team_members に追加（member_profile_id NOT NULL 制約を満たすため必ず設定）
  INSERT INTO public.team_members (team_id, member_profile_id, role, account_type)
  VALUES (found_team_id, new_profile_id, 'member', 'guardian');

  RETURN found_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. check_invite_code_type() を書き直し（保護者コードのみ → 常に 'guardian' を返す）
CREATE OR REPLACE FUNCTION public.check_invite_code_type(code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.teams WHERE invite_code_guardian = code) THEN
    RETURN 'guardian';
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- 5. grant_coach_role() を新規作成（管理者がユーザーにコーチ権限を付与）
CREATE OR REPLACE FUNCTION public.grant_coach_role(target_user_id uuid)
RETURNS void AS $$
DECLARE
  v_team_id uuid;
  v_tm_id uuid;
  v_profile_id uuid;
BEGIN
  -- 呼び出し元が管理者かチェック（自分のチームIDを取得）
  SELECT team_id INTO v_team_id
  FROM public.team_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Not a team member';
  END IF;

  IF NOT public.is_admin_of_team(v_team_id) THEN
    RAISE EXCEPTION 'Only admins can grant coach role';
  END IF;

  -- 対象ユーザーの team_members を取得
  SELECT id, member_profile_id INTO v_tm_id, v_profile_id
  FROM public.team_members
  WHERE user_id = target_user_id
    AND team_id = v_team_id
  LIMIT 1;

  IF v_tm_id IS NULL THEN
    RAISE EXCEPTION 'Target user is not in this team';
  END IF;

  -- account_type を coach に変更
  UPDATE public.team_members
  SET account_type = 'coach'
  WHERE id = v_tm_id;

  -- 本人の member_profiles.kind を coach に変更
  IF v_profile_id IS NOT NULL THEN
    UPDATE public.member_profiles
    SET kind = 'coach'
    WHERE id = v_profile_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. revoke_coach_role() を新規作成（管理者がユーザーのコーチ権限を剥奪）
CREATE OR REPLACE FUNCTION public.revoke_coach_role(target_user_id uuid)
RETURNS void AS $$
DECLARE
  v_team_id uuid;
  v_tm_id uuid;
  v_profile_id uuid;
BEGIN
  SELECT team_id INTO v_team_id
  FROM public.team_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Not a team member';
  END IF;

  IF NOT public.is_admin_of_team(v_team_id) THEN
    RAISE EXCEPTION 'Only admins can revoke coach role';
  END IF;

  SELECT id, member_profile_id INTO v_tm_id, v_profile_id
  FROM public.team_members
  WHERE user_id = target_user_id
    AND team_id = v_team_id
  LIMIT 1;

  IF v_tm_id IS NULL THEN
    RAISE EXCEPTION 'Target user is not in this team';
  END IF;

  -- 自分自身の権限は剥奪不可（管理者が自分をコーチから外すのを防ぐ）
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own coach role';
  END IF;

  UPDATE public.team_members
  SET account_type = 'guardian'
  WHERE id = v_tm_id;

  IF v_profile_id IS NOT NULL THEN
    UPDATE public.member_profiles
    SET kind = 'guardian'
    WHERE id = v_profile_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. notify_admin_on_member_join トリガー関数を更新
--    NULL名対応（COALESCE）、コーチ/保護者の種別表示を削除
CREATE OR REPLACE FUNCTION public.notify_admin_on_member_join()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_team_id uuid;
  v_profile_name text;
  v_author_id uuid;
BEGIN
  SELECT tm.team_id, mp.name, mp.user_id
    INTO v_team_id, v_profile_name, v_author_id
    FROM team_members tm
    JOIN member_profiles mp ON mp.id = tm.member_profile_id
   WHERE tm.id = NEW.id;

  IF (SELECT COUNT(*) FROM team_members WHERE team_id = v_team_id) > 1 THEN
    INSERT INTO announcements (team_id, author_id, title, body, target_role)
    VALUES (
      v_team_id,
      v_author_id,
      '新しいメンバーが参加しました',
      COALESCE(v_profile_name, '名前未設定') || ' さんがチームに参加しました。',
      'admin'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 8. データ整合性修正
--    guardian account なのに coach プロファイルを持つ不整合レコードを修正
UPDATE public.member_profiles mp
SET kind = 'guardian'
FROM public.team_members tm
WHERE tm.member_profile_id = mp.id
  AND tm.account_type = 'guardian'
  AND mp.kind = 'coach';
