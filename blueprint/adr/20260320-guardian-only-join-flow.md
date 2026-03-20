---
status: accepted
date: 2026-03-20
---

# チーム参加フローをガーディアンのみに一本化

## 背景

従来は「コーチ用招待コード」と「保護者用招待コード」の2種類を使い分けていた。
しかし実態として最初からコーチとして参加するケースは少なく、参加時の種別選択がUX上の摩擦になっていた。
また管理者がコーチ権限を後から付与したいニーズが存在した。

## 決定事項

1. **招待コードを1本化**: `teams.invite_code`（コーチ用）を廃止・DROP。`invite_code_guardian` のみ残す。
2. **参加時は全員ガーディアン**: `join_team_with_profile()` は保護者コードのみ受け付け、`kind='guardian'` の `member_profile` を自動作成（`profiles.name` をデフォルト名として使用）。
3. **コーチ権限は管理者が後付け**: `grant_coach_role(target_user_id)` / `revoke_coach_role(target_user_id)` RPC を追加。`account_type` と `member_profiles.kind` の両方を更新する。
4. **チーム作成者は引き続きコーチ/管理者**: `create_team_with_member()` は変更なし。

## 変更ファイル

- `supabase/migrations/20260321000001_guardian_only_join.sql`
- `src/types/database.ts`
- `src/app/(authenticated)/settings/page.tsx` — コーチ用招待コードUI削除
- `src/app/(authenticated)/teams/setup/page.tsx` — 参加フォーム簡素化
- `src/app/onboarding/page.tsx` — 参加フォーム簡素化
- `src/app/(authenticated)/members/page.tsx` — コーチ権限付与/剥奪ボタン追加
- `src/app/help/invite/page.tsx` — ヘルプページ更新

## 影響・注意点

- ステージングの既存コーチユーザーには `member_profiles.kind='guardian'` への修正マイグレーションを含む（`account_type='guardian'` なのに `kind='coach'` になっているデータを修正）。
- `regenerate_invite_code()` RPC を削除。設定画面のコーチ招待コード再生成UIも削除。
- `check_invite_code_type()` の戻り値から `'coach'` が消え、`'guardian'` or NULL のみになる。
