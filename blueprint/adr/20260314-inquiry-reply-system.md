# ADR: 問い合わせ返信システム（2026-03-14）

- **日付**: 2026-03-14
- **ステータス**: 採用

## 背景

外部からの問い合わせ（`inquiries` テーブル）に対して、管理者がメールで返信し、返信者からのメール返信も管理画面でスレッド表示できる仕組みを実装した。

## 決定事項

### DB スキーマ（migration 20260314120000）

- `inquiry_replies` テーブルを追加
  - `direction`: `outbound`（管理者送信）/ `inbound`（問い合わせ元からの返信）
  - RLS: SELECT はチームメンバーのみ。INSERT はサービスロール経由（API ルート・webhook）のみ

### メール送信（Resend）

- 管理者返信: `contact-{slug}@minibas.ballershub.net` から送信
- `replyTo`: `reply+{inquiry_id}@minibas.ballershub.net` を設定することで、問い合わせ元が返信した際に inbound webhook が inquiry_id を特定できる
- 問い合わせ受信確認メール（`/api/contact`）にも同じ `replyTo` を設定

### Resend Inbound Webhook（`/api/webhooks/resend-inbound`）

- `reply+{uuid}@minibas.ballershub.net` 宛のメールを受信し、`inquiry_replies` に `direction: inbound` で保存
- ミドルウェアの `alwaysPublicPaths` に `/api/webhooks` を追加（認証バイパス必須）
- サーバー側の Supabase 接続は `SUPABASE_INTERNAL_URL` を使用（EC2 公開 IP 自己参照不可のため）

### UI

- ナビに「問い合わせ」（`/inquiries`）を追加
- 問い合わせ一覧ページ（`/inquiries`）: ステータスバッジ・未読件数バッジ表示
- 問い合わせ詳細ページ（`/inquiries/[id]`）: スレッド形式の返信履歴 + ReplyForm
- お知らせページの問い合わせセクションを削除（専用ページへ移行）

### オンボーディング・チーム参加 UX 改善

- 保護者招待コードでの参加時は「名前入力」フォームを非表示にする
  - 対象: `src/app/onboarding/page.tsx`, `src/app/(authenticated)/teams/setup/page.tsx`

## 影響ファイル

- `supabase/migrations/20260314120000_add_inquiry_replies.sql`
- `src/app/api/contact/route.ts`
- `src/app/api/inquiries/[id]/reply/route.ts`（新規）
- `src/app/api/webhooks/resend-inbound/route.ts`（新規）
- `src/app/(authenticated)/inquiries/page.tsx`（新規）
- `src/app/(authenticated)/inquiries/[id]/page.tsx`（新規）
- `src/app/(authenticated)/inquiries/[id]/ReplyForm.tsx`（新規）
- `src/app/(authenticated)/announcements/page.tsx`
- `src/app/(authenticated)/teams/setup/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/components/layout/nav.tsx`
- `src/lib/supabase/middleware.ts`
