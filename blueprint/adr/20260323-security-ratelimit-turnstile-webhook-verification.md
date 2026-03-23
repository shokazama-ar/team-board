---
status: accepted
date: 2026-03-23
---

# セキュリティ強化 — レート制限・Cloudflare Turnstile・Webhook署名検証

## 背景

公開問い合わせフォームとメール受信 Webhook がセキュリティ対策なしで稼働していた。
スパム・ボット送信・なりすまし Webhook のリスクを低減するため、以下の対策を一括導入する。

## 決定事項

### 1. レート制限（`@upstash/ratelimit`）

- `src/app/api/contact/route.ts` に Upstash Redis ベースのスライディングウィンドウ方式を導入
- 制限: 同一 IP から **5リクエスト / 1分** を超えた場合に `429 Too Many Requests` を返す
- 環境変数: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

### 2. Cloudflare Turnstile（ボット対策）

- `src/app/contact/[teamId]/page.tsx` に `@marsidev/react-turnstile` コンポーネントを追加
- フォーム送信時に Turnstile トークンを `turnstileToken` フィールドで API へ送信
- `src/app/api/contact/route.ts` でトークンを Cloudflare Siteverify API で検証し、失敗時は `400` を返す
- 環境変数: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`

### 3. Resend Webhook 署名検証（`svix`）

- `src/app/api/webhooks/resend-inbound/route.ts` に `svix` による署名検証を追加
- `svix-id` / `svix-timestamp` / `svix-signature` ヘッダーを使ってリクエストの真正性を確認
- 署名不正時は `401 Unauthorized` を返す
- 環境変数: `RESEND_WEBHOOK_SECRET`

## 変更ファイル

- `package.json` / `package-lock.json`（依存追加: `@marsidev/react-turnstile`, `@upstash/ratelimit`, `@upstash/redis`, `svix`）
- `src/app/api/contact/route.ts`
- `src/app/api/webhooks/resend-inbound/route.ts`
- `src/app/contact/[teamId]/page.tsx`

## 影響・注意点

- ステージング環境に以下の環境変数を追加する必要がある
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `TURNSTILE_SECRET_KEY`
  - `RESEND_WEBHOOK_SECRET`
- レート制限は Upstash Redis が利用できない場合は制限なしでスルーするフォールバック実装か確認すること
- Turnstile の `siteKey` は公開鍵のため `NEXT_PUBLIC_` プレフィックスで問題ない
