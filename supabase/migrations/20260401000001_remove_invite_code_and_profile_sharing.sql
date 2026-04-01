-- 招待コード・プロファイル共有廃止マイグレーション (2026-04-01)
-- member_profile_access テーブルは双方向承認フロー（新設計）で継続使用するため削除しない
-- accept_team_invite_by_token / team_invitations はメール招待フローで使用継続のため削除しない

-- 1. teams.invite_code_guardian カラムを削除
ALTER TABLE teams DROP COLUMN IF EXISTS invite_code_guardian;

-- 2. member_profiles.share_code カラムを削除
ALTER TABLE member_profiles DROP COLUMN IF EXISTS share_code;

-- 3. 廃止RPC関数を削除
DROP FUNCTION IF EXISTS join_team_with_profile(text);
DROP FUNCTION IF EXISTS check_invite_code_type(text);
DROP FUNCTION IF EXISTS regenerate_guardian_invite_code(uuid);
DROP FUNCTION IF EXISTS link_profile_by_share_code(text);
DROP FUNCTION IF EXISTS regenerate_profile_share_code(uuid);
