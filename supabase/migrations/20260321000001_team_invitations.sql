-- team_invitations テーブル
CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- チームメンバーは自チームの招待を閲覧可能
CREATE POLICY "team members can view invitations"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (is_member_of_team(team_id));

-- accept_team_invite_by_token RPC
CREATE OR REPLACE FUNCTION accept_team_invite_by_token(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invitation RECORD;
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
    INSERT INTO team_members (team_id, user_id, role, account_type)
    VALUES (v_invitation.team_id, v_user_id, 'member', 'guardian');
  END IF;

  UPDATE team_invitations SET accepted_at = now() WHERE id = p_token;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_team_invite_by_token(uuid) TO authenticated;
