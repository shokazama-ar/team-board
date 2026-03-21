-- accept_team_invite_by_token を修正
-- guardian_only_join と同様に guardian member_profile を作成してから
-- team_members に挿入する（member_profile_id NOT NULL 制約を満たす）

CREATE OR REPLACE FUNCTION accept_team_invite_by_token(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_user_email  text;
  v_invitation  RECORD;
  v_profile_name text;
  v_profile_id  uuid;
BEGIN
  SELECT * INTO v_invitation
  FROM team_invitations
  WHERE id = p_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  IF lower(v_user_email) != lower(v_invitation.email) THEN
    RAISE EXCEPTION 'Email does not match invitation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_invitation.team_id AND user_id = v_user_id
  ) THEN
    -- profiles テーブルから名前を取得
    SELECT name INTO v_profile_name FROM profiles WHERE id = v_user_id;

    -- guardian member_profile を作成（guardian_only_join と同じパターン）
    INSERT INTO member_profiles (user_id, kind, name)
    VALUES (v_user_id, 'guardian', v_profile_name)
    RETURNING id INTO v_profile_id;

    -- team_members に追加（member_profile_id を必ず設定）
    INSERT INTO team_members (team_id, member_profile_id, role, account_type)
    VALUES (v_invitation.team_id, v_profile_id, 'member', 'guardian');
  END IF;

  UPDATE team_invitations SET accepted_at = now() WHERE id = p_token;
END;
$$;
