# ADR: UIリファクタ・カテゴリフィルタ改善・RLS再設計（task-040〜050）

- **日付**: 2026-03-11
- **ステータス**: 採用

## 背景

task-040〜050 として以下の改善を実施した。

## 決定事項

### UI改善

- **[040]** DashboardContent: メンバー一覧リンクを `ChevronRight` アイコン + `hover:text-blue-700` に統一
- **[041]** events/announcements: カテゴリフィルタを個別ボタン式からダッシュボードと同じトグル切り替えに変更
- **[042]** members: プレイヤーセクションにカテゴリフィルタボタンを追加
- **[043]** teams/setup: チーム作成時のアカウントタイプ選択UIを削除（コーチ固定）
- **[044]** settings: コーチアカウントにも保護者タブを表示。プロフィールフォームをコーチタブから保護者タブへ移動
- **[045]** settings: 保護者タブのプロファイル削除ボタンを常時表示・`member_profiles` レコード削除に変更（team_members は CASCADE）
- **[046]** settings: 管理者タブの招待メール送信ボタンを削除
- **[047]** settings: コピーボタンのフィードバックをボタン内の `Check` アイコン表示に統一（1秒）
- **[048]** members: 保護者管理の選手プロファイルもプレイヤーセクションに表示（`account_type` 条件を削除）
- **[049]** 全ページ: カテゴリフィルタが `member_profile_access` 経由のリンク済みプロファイルのカテゴリを考慮するよう修正
- **[050]** settings: 「カテゴリ割り当て」を管理者タブからコーチタブへ移動

### DB スキーマ変更（migration 20260310000012）

- `team_members` に `user_id uuid` カラムを追加（`member_profiles.user_id` を非正規化）
- `is_member_of_team()`, `is_admin_of_team()`, `get_my_team_id()` を `team_members.user_id` を直接参照するよう再定義
- `member_profiles` の SELECT RLS ポリシーを `team_members.user_id` ベースに再定義（再帰ループ回避）
- `member_profile_access` の RLS を `owns_member_profile_by_id()` SECURITY DEFINER 経由に変更
- `sync_team_member_user_id` トリガーで `member_profile_id` 変更時に `user_id` を自動同期

### DBクリーンアップ（migration 20260310000013）

- 孤立したプレイヤープロファイル（チーム未所属・`member_profile_access` 未登録）を削除

## 影響ファイル

- `src/app/(authenticated)/_components/DashboardContent.tsx`
- `src/app/(authenticated)/events/page.tsx`
- `src/app/(authenticated)/announcements/page.tsx`
- `src/app/(authenticated)/members/page.tsx`
- `src/app/(authenticated)/settings/page.tsx`
- `src/app/(authenticated)/teams/setup/page.tsx`
- `supabase/migrations/20260310000012_add_user_id_to_team_members.sql`
- `supabase/migrations/20260310000013_cleanup_orphan_player_profiles.sql`
