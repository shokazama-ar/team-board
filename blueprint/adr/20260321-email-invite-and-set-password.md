---
status: accepted
date: 2026-03-21
---

# メール招待フロー再設計とパスワード設定画面の追加

## 背景

招待コードをコピーして LINE 等で送るUXはメンバーへの伝達コストが高かった。
また、一度 Supabase アカウントが作成された既存ユーザーへは `inviteUserByEmail` が失敗するため、再招待できない問題があった。

招待フロー確立後、招待メールからログインしたユーザーがパスワードを持たない状態になること、
および「パスワードを忘れた」フローでリセットリンクをクリックしてもパスワード設定画面に遷移しない問題も判明した。

## 決定事項

### 1. `team_invitations` テーブルによるメール招待フロー

- 管理者が設定画面でメールアドレスを入力 → `/api/invite` POST
- API が `team_invitations` に INSERT し、`invitation.id` を `invitation_token` として `redirectTo` URL に付与
- 新規ユーザー: `auth.admin.inviteUserByEmail` で Supabase 標準招待メール送信
- 既存ユーザー: `inviteUserByEmail` が "already registered" エラー → `generateLink(magiclink)` + Resend でカスタム招待メール送信
- 招待リンクは `/auth/callback?invitation_token=<uuid>` を経由

### 2. `accept_team_invite_by_token` RPC

- `/auth/callback` でコード交換後、`invitation_token` があれば RPC を呼び出す（PKCE フロー）
- `/accept-invite` ページで implicit フローの場合もクライアント側から同 RPC を呼ぶ
- RPC 内でトークンを検証し、`kind='guardian'` の `member_profile` を自動作成してから `team_members` に INSERT
- `team_invitations.accepted_at` を更新して使用済みにする

### 3. `/set-password` ページ（新規）

- 招待受諾後・パスワードリセット後の両方でパスワード設定を求める統一ページ
- `?from=reset` クエリパラメータで招待フロー / リセットフローを区別して説明文を切り替え
- `supabase.auth.updateUser({ password })` でパスワードを設定、`profiles.name` も同時に更新可能
- 「あとで設定する」ボタンでスキップ可能（`/` へ遷移）
- `/lib/supabase/middleware.ts` の `skipTeamCheck` に追加し、チーム未所属でもアクセス可能にした

### 4. パスワードリセットフローの修正

- `/auth/callback` の `type === "recovery"` 分岐で `→ /set-password?from=reset` にリダイレクト（以前は存在しない `/reset-password` に遷移していた）
- `middleware.ts` の `authOnlyPublicPaths` から `/reset-password` を削除（ログイン済みユーザーが `/` に飛ばされる問題を修正）

### 5. ガーディアン（招待ユーザー）のダッシュボード表示制御

- 招待経由で参加した直後は選手プロファイル（`member_profiles.kind='player'`）を持たない
- `DashboardContent` でプレイヤープロファイル有無 (`hasPlayerProfile`) を確認し、未所持の場合は未回答イベント・予定表・お知らせセクションを非表示にする

### 6. Next.js 16 `proxy.ts` への移行

- `src/middleware.ts` を廃止し `src/proxy.ts` に改名（`middleware()` → `proxy()` 関数）
- Next.js 16 は `middleware.ts` の規約を deprecated としており、両ファイルが共存するとビルドエラーになるため

## 変更ファイル

- `supabase/migrations/20260322000001_add_accept_team_invite_rpc.sql`
- `supabase/migrations/20260323000001_team_invitations.sql`
- `supabase/migrations/20260324000001_fix_accept_team_invite_by_token.sql`
- `src/proxy.ts`（新規、`src/middleware.ts` を置換）
- `src/app/api/invite/route.ts`
- `src/app/auth/callback/route.ts`
- `src/app/(auth)/accept-invite/page.tsx`
- `src/app/set-password/page.tsx`（新規）
- `src/app/(authenticated)/_components/DashboardContent.tsx`
- `src/lib/supabase/middleware.ts`
- `src/app/help/invite/page.tsx`

## 影響・注意点

- 招待コード経由の参加フロー（`join_team_with_profile`）は引き続き有効。メール招待はそれに加わる形
- Resend の `RESEND_API_KEY` と `RESEND_FROM_EMAIL` 環境変数が必要（ステージングでは設定済み）
- `NEXT_PUBLIC_SITE_URL` または `VERCEL_URL` 環境変数で `redirectTo` の origin を決定する
- implicit フロー（Supabase がハッシュ付きURLを返す場合）では `/accept-invite` ページがクライアント側で `setSession` を呼び、その後 RPC を実行する
- PKCE フロー（コードがクエリパラメータで来る場合）では `/auth/callback` サーバー側で完結する
