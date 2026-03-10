-- ============================================================
-- task-036: ステージング環境 事前確認用クエリ集
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. テーブル存在確認
-- ────────────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('inquiry_types', 'inquiry_form_fields', 'inquiries');

-- ────────────────────────────────────────────────────────────
-- 2. inquiries の列確認（inquiry_type_id / custom_fields があるか）
-- ────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'inquiries'
  AND column_name IN ('inquiry_type_id', 'custom_fields')
ORDER BY column_name;

-- ────────────────────────────────────────────────────────────
-- 3. RLS ポリシー確認
-- ────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('inquiry_types', 'inquiry_form_fields', 'inquiries')
ORDER BY tablename, cmd;

-- ────────────────────────────────────────────────────────────
-- 4. is_admin_of_team 関数の存在確認
-- ────────────────────────────────────────────────────────────
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin_of_team', 'is_member_of_team', 'get_team_name', 'update_updated_at_column')
ORDER BY routine_name;

-- ────────────────────────────────────────────────────────────
-- 5. get_team_name の anon 実行権限確認
-- ────────────────────────────────────────────────────────────
SELECT
  grantee,
  routine_name,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_team_name'
ORDER BY grantee;

-- ────────────────────────────────────────────────────────────
-- 6. inquiry_types・inquiry_form_fields の RLS 有効化確認
-- ────────────────────────────────────────────────────────────
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname IN ('inquiry_types', 'inquiry_form_fields', 'inquiries')
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
