---
status: accepted
date: 2026-03-22
---

# UI細部修正・パスワード設定画面改善・返信テンプレート機能追加

## 背景

複数の小規模 UI 修正と、問い合わせ返信テンプレート機能の新規追加をまとめて対応した。

## 決定事項

### 1. メンバー一覧の削除ボタン統一

- 選手セクションの削除ボタンが「アイコン + "削除" テキスト」、コーチ/保護者セクションが「アイコンのみ」で表記揺れが発生していた
- スマホ画面でのスペース確保のため、全セクションで「アイコンのみ」に統一
- `title="削除"` / `aria-label="削除"` でアクセシビリティを維持

### 2. ヘルプページの「付与・剥奪」表現修正

- `help/invite/page.tsx` のコーチ権限セクションに「付与・剥奪」という表現が残存していた
- 現在の UI は `+コーチ権限` / `-コーチ権限` ボタン形式のため、「コーチ権限の変更は管理者のみが行えます」に変更

### 3. パスワード設定画面にメールアドレス表示を追加

- ブラウザのパスワードマネージャーがアカウント名（メールアドレス）なしでパスワードを保存する問題を修正
- `supabase.auth.getUser()` で取得したメールアドレスを `readOnly` フィールドとして表示
- `autocomplete="username"` を付与することでブラウザがメールアドレスと紐付けて保存できるようにした
- パスワード入力欄に `autocomplete="new-password"` を追加

### 4. カテゴリ割り当てモーダルの横スクロール修正

- `overflow-x-auto` コンテナに `px-6` があり、スクロール時にカテゴリ列が sticky 名前列の左側パディング領域に流れ込む問題
- コンテナから水平パディングを除去し、sticky な `th`/`td` に `pl-6` を移動することで修正

### 5. `RESEND_FROM_EMAIL` の必須化と README 更新

- `/api/invite/route.ts` でハードコードされていたフォールバックメールアドレスを削除し、未設定時は 500 エラーを返すよう変更
- README の環境変数テーブルと `.env.local` サンプルに `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `NEXT_PUBLIC_SITE_URL` を追記

### 6. 返信テンプレート機能（新規）

管理者が問い合わせ返信用のテンプレートをチームごとに管理し、返信フォームからカーソル位置に挿入できる機能を追加。

#### DB

- `inquiry_reply_templates` テーブルを新設（`team_id`, `title`, `body`, `sort_order`）
- RLS: SELECT はチームメンバー全員、INSERT/UPDATE/DELETE は管理者のみ

#### 設定UI

- 管理者タブの「問い合わせ種別」直後に「返信テンプレート」セクションを追加
- テンプレートの追加・編集（モーダル）・削除（`window.confirm`）が可能

#### 返信フォーム

- `ReplyForm` マウント時に `inquiry_reply_templates` を取得（Props に `teamId` 追加）
- テンプレートが1件以上ある場合のみ「テンプレートを挿入 ▾」ドロップダウンを表示
- `textarea` の `selectionStart`/`selectionEnd` を使ってカーソル位置に本文を挿入
- ドロップダウン外クリックで閉じる（`mousedown` イベントで監視）

## 変更ファイル

- `supabase/migrations/20260322120000_create_inquiry_reply_templates.sql`（新規）
- `src/app/(authenticated)/settings/page.tsx`
- `src/app/(authenticated)/inquiries/[id]/ReplyForm.tsx`
- `src/app/(authenticated)/inquiries/[id]/page.tsx`
- `src/app/(authenticated)/members/page.tsx`
- `src/app/set-password/page.tsx`
- `src/app/api/invite/route.ts`
- `src/app/help/invite/page.tsx`
- `src/app/help/inquiries/page.tsx`
- `README.md`

## 影響・注意点

- `RESEND_FROM_EMAIL` が未設定の場合、メール招待 API が 500 を返すようになった。ステージング環境では設定済みであることを確認すること
- 返信テンプレートはチームメンバー全員が SELECT 可能（返信フォームから読み込むため）
