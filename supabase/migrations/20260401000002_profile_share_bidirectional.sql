-- 双方向プロファイル共有フロー: member_profile_access カラム追加 & RPC追加 (2026-04-01)

-- 1. status カラム追加（既存行は 'accepted' をデフォルトに）
ALTER TABLE member_profile_access
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted'
  CHECK (status IN ('pending', 'accepted', 'rejected'));

-- 2. requested_by カラム追加（既存行は NULL 許容）
ALTER TABLE member_profile_access
  ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES auth.users(id);

-- 3. 既存 INSERT ポリシーを削除して新ポリシーに置き換え
DROP POLICY IF EXISTS "profile access insert" ON member_profile_access;
DROP POLICY IF EXISTS "member_profile_access_insert" ON member_profile_access;

CREATE POLICY "member_profile_access_insert" ON member_profile_access
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND owns_member_profile_by_id(member_profile_id)
  );

-- 4. UPDATE ポリシー追加（共有先ユーザーが status を変更）
DROP POLICY IF EXISTS "member_profile_access_update" ON member_profile_access;

CREATE POLICY "member_profile_access_update" ON member_profile_access
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. send_profile_share_request RPC（プロファイルオーナーがリクエスト送信）
CREATE OR REPLACE FUNCTION send_profile_share_request(
  p_profile_id uuid,
  p_target_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- オーナーチェック
  IF NOT owns_member_profile_by_id(p_profile_id) THEN
    RAISE EXCEPTION 'Not the owner of this profile';
  END IF;
  -- 自分自身へのリクエスト禁止
  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot send request to yourself';
  END IF;
  -- 重複チェック（pending または accepted が既にある場合は送信不可）
  IF EXISTS (
    SELECT 1 FROM member_profile_access
    WHERE member_profile_id = p_profile_id
      AND user_id = p_target_user_id
      AND status IN ('pending', 'accepted')
  ) THEN
    RAISE EXCEPTION 'Request already exists';
  END IF;

  INSERT INTO member_profile_access (member_profile_id, user_id, granted_by, requested_by, status)
  VALUES (p_profile_id, p_target_user_id, auth.uid(), auth.uid(), 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 6. respond_profile_share_request RPC（共有先ユーザーが承認/拒否）
CREATE OR REPLACE FUNCTION respond_profile_share_request(
  p_access_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_new_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE member_profile_access
  SET status = p_new_status
  WHERE id = p_access_id
    AND user_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already responded';
  END IF;
END;
$$;
