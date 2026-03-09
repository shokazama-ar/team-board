# ADR: サインアップ〜チーム参加UX改善・ナビ非活性化・設定UIリファクタ

- **日付**: 2026-03-09
- **ステータス**: 採用

## 背景

- サインアップ後のフローで種別選択が複数画面に散在し、ユーザーが混乱していた
- チーム参加時の種別（コーチ/保護者）を手動選択させていたが、招待コードから自動判定できるはず
- チーム未所属ユーザーにも全ナビメニューがアクティブで、空ページへ遷移できてしまっていた
- 設定画面の招待コードUIが縦並びで操作性が悪く、共有ボタンが `navigator.share` 依存だった

## 決定事項

### 1. `check_invite_code_type(code)` RPC 追加（マイグレーション）
- 招待コードの種別（`'coach'`/`'guardian'`/`null`）を返す認証不要の SECURITY DEFINER 関数
- `onboarding` / `teams/setup` でリアルタイム自動判定に使用

### 2. `create_team_with_member` RPC に `team_account_type` 引数追加
- 保護者がチームを作成する際に `account_type='guardian'` で登録できるよう拡張

### 3. `onboarding/page.tsx` / `teams/setup/page.tsx`
- 招待コードの種別選択ラジオボタンを削除し、RPC 自動判定結果を表示のみ
- チーム作成フォームの種別を「コーチ / プレイヤー」→「コーチ / 保護者」に変更

### 4. `layout.tsx`（authenticated）に `hasTeam` フェッチ追加
- Server Component として `team_members` を確認し、`SideNav`/`BottomNav` に `hasTeam` を渡す

### 5. `nav.tsx` に非活性UI実装
- `hasTeam === false` の場合、ホーム・設定以外のメニューを `<span>` でグレー表示（クリック不可）

### 6. 設定画面 招待コードUI（task-021）
- コードと操作ボタンを横並び flex に変更
- 「共有」ドロップダウンを「コピー」「メール」の独立ボタンに分割
- `navigator.share` 依存を廃止、Mail アイコンの `mailto:` ボタンに統一
- タブナビに `overflow-x-auto` + `whitespace-nowrap` を追加

### 7. `layout.tsx`（root）に `suppressHydrationWarning` 追加
- Chrome 拡張機能が `<body>` に属性注入する際の hydration 警告を抑制

## 影響ファイル

- `supabase/migrations/20260309000001_add_check_invite_code_type.sql`（新規）
- `src/app/onboarding/page.tsx`
- `src/app/(authenticated)/teams/setup/page.tsx`
- `src/app/(authenticated)/settings/page.tsx`
- `src/app/(authenticated)/layout.tsx`
- `src/components/layout/nav.tsx`
- `src/app/layout.tsx`
- `e2e/team-board.spec.ts`（T021/T022 テスト追加）
