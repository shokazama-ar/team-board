# Team Board

チームの出欠管理・お知らせ管理ができる Web アプリです。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| バックエンド | Supabase (PostgreSQL + Auth + Storage) |
| ランタイム | Node.js v20 |

## ディレクトリ構成

```
team-board/
├── src/
│   ├── app/
│   │   ├── (auth)/          # 認証画面 (ログイン・サインアップ)
│   │   ├── (authenticated)/ # 認証後の画面
│   │   └── auth/callback/   # OAuth コールバック
│   ├── components/          # 共通コンポーネント
│   ├── lib/supabase/        # Supabase クライアント設定
│   └── types/               # TypeScript 型定義
└── supabase/
    ├── config.toml          # Supabase ローカル設定
    └── migrations/          # DB マイグレーションファイル
```

---

## 環境一覧

| | ローカル確認 (EC2) | ステージング |
|---|---|---|
| **URL** | `http://<EC2の公開IP>:3000` | `https://team-board-psi.vercel.app` |
| **フロントエンド** | Next.js dev server (EC2上) | Vercel |
| **データベース** | ローカル Supabase (Docker) | Supabase クラウド |
| **Supabase プロジェクト** | `127.0.0.1:54321` | `lgghvqytslnocbpgouhb.supabase.co` |
| **デプロイ方法** | 手動起動 | `main` ブランチへの push で自動デプロイ |
| **データ** | ローカル専用（完全分離） | ステージング専用（完全分離） |

> ローカル確認とステージングはデータベースが完全に分離されています。

---

## 環境変数

`.env.local` をプロジェクトルートに作成して設定します（Git 管理外）。

| 変数名 | 必須 | 説明 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ブラウザから接続する Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase の anon（公開）キー |
| `SUPABASE_INTERNAL_URL` | ローカルのみ | サーバーサイドが内部ネットワーク経由で接続する URL。未設定時は `NEXT_PUBLIC_SUPABASE_URL` にフォールバック |
| `NEXT_PUBLIC_SUPABASE_STORAGE_KEY` | ローカルのみ | Auth トークンの Cookie 名。ブラウザとサーバー間で Cookie 名を統一するために使用 |
| `DEV_HOST` | ローカルのみ | EC2 など外部からブラウザでアクセスする際のホスト名または IP。`next.config.ts` の `allowedDevOrigins` と画像の `remotePatterns` に反映される |

### ローカル開発（EC2）の場合

```env
NEXT_PUBLIC_SUPABASE_URL=http://<EC2の公開IP>:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<npx supabase status で確認した anon key>
SUPABASE_INTERNAL_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_STORAGE_KEY=sb-local-auth-token
DEV_HOST=<EC2の公開IP>
```

### ステージング（Vercel）の場合

Vercel ダッシュボードの **Settings > Environment Variables** で設定します。
`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` のみ設定すれば動作します。

---

## Linux リモート環境での開発セットアップ

> **対象環境**: クラウド上の Linux サーバー (Amazon Linux 2023 など)
> Windows + WSL2 / Docker Desktop は不要です。

### 前提条件

- Docker Engine がインストール済み
- Node.js v20 以上がインストール済み (nvm 推奨)
- Supabase CLI は `npx` 経由で利用するため個別インストール不要

### 1. リポジトリのクローン

```bash
git clone https://github.com/shokazama-ar/team-board.git
cd team-board
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Docker の権限設定 (Linux)

Linux では Docker のソケットへのアクセスにグループ権限が必要です。初回のみ実施してください。

```bash
# 現在のユーザーを docker グループに追加
sudo usermod -aG docker $USER

# グループ変更を現在のシェルに反映 (再ログインでも可)
newgrp docker

# 動作確認
docker info
```

> `permission denied while trying to connect to the Docker daemon socket` エラーが出る場合はこの手順を実施してください。

### 4. ローカル Supabase の起動

初回は Docker イメージのダウンロードが発生するため数分かかります。

```bash
npx supabase start
```

起動に成功すると以下のような出力が表示されます。この値を次の手順で使用します。

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 一度起動した後に値を確認したい場合は `npx supabase status` を実行してください。

### 5. 環境変数の設定

プロジェクトルートに `.env.local` を作成します。EC2 サーバーの公開 IP からブラウザでアクセスする場合は以下の形式で設定します。

```bash
cat > .env.local << 'EOF'
# ブラウザからアクセスする Supabase URL（EC2 の公開 IP を使用）
NEXT_PUBLIC_SUPABASE_URL=http://<EC2の公開IP>:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<手順4で表示された anon key>

# サーバーサイド（middleware）から内部ネットワーク経由でアクセスする URL
SUPABASE_INTERNAL_URL=http://127.0.0.1:54321

# ブラウザ・サーバー間で Cookie 名を統一するためのキー
NEXT_PUBLIC_SUPABASE_STORAGE_KEY=sb-local-auth-token

# EC2 の公開 IP（next.config.ts で allowedDevOrigins と remotePatterns に使用）
DEV_HOST=<EC2の公開IP>
EOF
```

> **注意**: EC2 はインスタンス内部から公開 IP への自己参照ができないため、サーバーサイドは `SUPABASE_INTERNAL_URL` で内部 URL を指定します。`NEXT_PUBLIC_SUPABASE_STORAGE_KEY` を固定することで、ブラウザとサーバー間の Cookie 名の不一致を防ぎます。

### 6. DB マイグレーションの適用

```bash
npx supabase db reset
```

このコマンドにより `supabase/migrations/` 内の SQL ファイルが順番に適用されます。

### 7. 開発サーバーの起動

```bash
# EC2 外部からブラウザでアクセスする場合（0.0.0.0 にバインド）
node_modules/.bin/next dev --hostname 0.0.0.0 > /tmp/nextjs.log 2>&1 &
```

サーバーは `http://<EC2の公開IP>:3000` でアクセスできます。EC2 のセキュリティグループでポート `3000` と `54321` の開放が必要です。

---

## リモートサーバーへのアクセス方法

リモート Linux サーバーで開発している場合、ブラウザからアプリと Supabase Studio にアクセスするために **SSH ポートフォワーディング** を使用します。

### ローカル PC から SSH 接続するとき

```bash
# Next.js (3000) と Supabase API (54321) を同時にフォワード
ssh -L 3000:localhost:3000 -L 54321:localhost:54321 <USER>@<SERVER_IP>
```

SSH 接続後、ローカル PC のブラウザで以下にアクセスできます。

| サービス | URL |
|---|---|
| アプリ | http://localhost:3000 |
| Supabase Studio | http://localhost:54323 |

### VS Code Remote SSH を使用している場合

VS Code の「ポートの転送」機能でポート `3000` と `54321` を転送設定するだけで自動的にアクセス可能です。

---

## 開発コマンド一覧

### Next.js

```bash
npm run dev    # 開発サーバーの起動
npm run build  # プロダクションビルド
npm run start  # プロダクションサーバーの起動
npm run lint   # ESLint の実行
```

バックグラウンドで起動する場合（EC2 などリモート環境向け）:

```bash
node_modules/.bin/next dev --hostname 0.0.0.0 > /tmp/nextjs.log 2>&1 &
```

ログの確認・停止:

```bash
tail -f /tmp/nextjs.log   # ログをリアルタイム確認
kill %1                   # バックグラウンドジョブを停止（またはジョブ番号を指定）
```

### Supabase

```bash
npx supabase start          # ローカル Supabase の起動
npx supabase stop           # ローカル Supabase の停止
npx supabase status         # 起動状態と接続情報の確認
npx supabase db reset       # DB をリセットしてマイグレーションを再適用
npx supabase db diff        # スキーマ差分の確認
npx supabase migration new <name>  # 新しいマイグレーションファイルの作成
```

---

## トラブルシューティング

### Docker ソケットに接続できない

```
ERROR: permission denied while trying to connect to the Docker daemon socket
```

→ [手順 3](#3-docker-の権限設定-linux) の Docker グループ設定を確認してください。`newgrp docker` または再ログイン後に再試行してください。

### `supabase start` が失敗する

Docker が起動していない可能性があります。

```bash
sudo systemctl start docker
sudo systemctl enable docker  # OS 起動時に自動起動
```

### 環境変数が読み込まれない

`.env.local` ファイルがプロジェクトルート直下に存在するか確認してください。

```bash
ls -la .env.local
```

存在しない場合は [手順 5](#5-環境変数の設定) を参照して作成してください。

### ポート 3000 が既に使用中

```bash
# 使用中のプロセスを確認
lsof -i :3000

# プロセスを終了 (PID は上記コマンドで確認)
kill -9 <PID>
```

### `supabase status` でキーを再確認する

```bash
npx supabase status
```

---

## ステージング DB への手動マイグレーション適用

`supabase db push` ではなく Supabase ダッシュボードの **SQL Editor** から手動適用が必要なマイグレーションを管理します。

> **背景**: ステージング環境は一部のマイグレーションを SQL Editor 経由で直接適用しているため、`supabase migration list` のリモート履歴と実際の DB スキーマが一致しない場合があります。

### 未適用マイグレーション（要適用・順番厳守）

以下のファイルを **`supabase/migrations/` フォルダから順番に** SQL Editor へ貼り付けて実行してください。

| 順序 | ファイル名 | 内容 |
|---|---|---|
| 1 | `20260314120000_add_inquiry_replies.sql` | `inquiry_replies` テーブル作成・RLS ポリシー設定 |

### SQL Editor への貼り付け手順

1. [Supabase ダッシュボード](https://supabase.com/dashboard/project/lgghvqytslnocbpgouhb) を開く
2. 左メニューの **SQL Editor** を選択
3. 上記の順序でファイルの内容をコピーして実行

---

## GitHub へのプッシュ

リポジトリ: https://github.com/shokazama-ar/team-board.git

```bash
git add .
git commit -m "変更内容の説明"
git push
```
