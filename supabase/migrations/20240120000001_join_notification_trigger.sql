-- チーム参加時に管理者向けお知らせを自動投稿するトリガー

CREATE OR REPLACE FUNCTION notify_admin_on_member_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_profile_name text;
  v_kind text;
  v_author_id uuid;
BEGIN
  -- team_id と参加者情報を取得
  SELECT tm.team_id, mp.name, mp.kind::text, mp.user_id
    INTO v_team_id, v_profile_name, v_kind, v_author_id
    FROM team_members tm
    JOIN member_profiles mp ON mp.id = tm.member_profile_id
   WHERE tm.id = NEW.id;

  -- チームにすでに他メンバーがいる場合のみ通知（チーム作成者の参加は除外）
  IF (SELECT COUNT(*) FROM team_members WHERE team_id = v_team_id) > 1 THEN
    INSERT INTO announcements (team_id, author_id, title, body, target_role)
    VALUES (
      v_team_id,
      v_author_id,
      '新しいメンバーが参加しました',
      v_profile_name || ' さん（' ||
        CASE v_kind WHEN 'coach' THEN 'コーチ' ELSE 'プレイヤー' END ||
        '）がチームに参加しました。',
      'admin'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_member_join_notify_admin
  AFTER INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_member_join();
