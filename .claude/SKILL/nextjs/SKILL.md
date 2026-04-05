---
name: nextjs-patterns
description: team-board プロジェクトの Next.js 16 実装パターンと既知の地雷。src/ ファイルを編集する際に自動参照する。
version: 1.0.0
paths:
  - src/**/*.tsx
  - src/**/*.ts
---

# Next.js 16 実装パターン

## 既知の地雷

### `router.push()` + `router.refresh()` の競合

`router.push()` の直後に `router.refresh()` を呼ぶと遷移が中断される。
**`router.push()` のみにすること。**

```tsx
// 悪い例
router.push("/");
router.refresh(); // ← 削除

// 良い例
router.push("/");
```

### Supabase Auth — メール確認

クラウド環境はデフォルトでメール確認必須（`mailer_autoconfirm: false`）。
ログインエラー `Email not confirmed` は「パスワード誤り」ではなく専用メッセージで案内する。

## ディレクトリ構造

```
src/app/
  (auth)/          # ログイン・サインアップ
  (authenticated)/ # 認証後ページ（全ページここに配置）
src/lib/supabase/
  client.ts        # クライアントサイド Supabase
  server.ts        # サーバーサイド Supabase
  middleware.ts    # 認証・チーム所属チェック
```

## 環境

- Next.js 16 (Turbopack)
- `next` コマンドは PATH にない → `node_modules/.bin/next build` を使う
- main push で Vercel 自動デプロイ
