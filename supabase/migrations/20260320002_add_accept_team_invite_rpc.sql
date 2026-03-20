-- 招待リンク経由でチームに参加する RPC（SECURITY DEFINER）
-- user_metadata->>'team_id' が一致する場合のみ実行を許可する
CREATE OR REPLACE FUNCTION accept_team_invite(p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_meta_team_id uuid;
  v_exists boolean;
BEGIN
  -- user_metadata.team_id を確認（inviteUserByEmail 時に埋め込んだ値）
  SELECT (raw_user_meta_data->>'team_id')::uuid
    INTO v_meta_team_id
    FROM auth.users
   WHERE id = v_user_id;

  IF v_meta_team_id IS DISTINCT FROM p_team_id THEN
    RAISE EXCEPTION 'team_id mismatch';
  END IF;

  -- 既に参加済みなら何もしない
  SELECT EXISTS (
    SELECT 1 FROM team_members
     WHERE team_id = p_team_id
       AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN RETURN; END IF;

  -- team_members に追加（account_type = 'guardian'、role = 'member'）
  INSERT INTO team_members (team_id, user_id, role, account_type)
  VALUES (p_team_id, v_user_id, 'member', 'guardian');
END;
$$;

GRANT EXECUTE ON FUNCTION accept_team_invite(uuid) TO authenticated;
