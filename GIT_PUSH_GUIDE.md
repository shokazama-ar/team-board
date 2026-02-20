# GitHubへのプッシュ手順

このドキュメントでは、team-boardプロジェクトをGitHubリポジトリにプッシュする手順を説明します。

## 前提条件

- Gitがインストールされていること
- GitHubアカウントを持っていること
- リモートリポジトリが作成済みであること（https://github.com/shokazama-ar/team-board.git）

## 手順

### 1. Gitリポジトリの初期化（まだ初期化されていない場合）

```bash
cd c:\Users\shoka\Desktop\Projects\team-board
git init
```

### 2. ファイルをステージングエリアに追加

```bash
git add .
```

### 3. 初回コミットを作成

```bash
git commit -m "Initial commit: team-board project"
```

### 4. リモートリポジトリを追加

```bash
git remote add origin https://github.com/shokazama-ar/team-board.git
```

既にリモートが設定されている場合は、以下のコマンドで確認・更新できます：

```bash
# 現在のリモートを確認
git remote -v

# 既存のリモートを削除してから追加（必要な場合）
git remote remove origin
git remote add origin https://github.com/shokazama-ar/team-board.git
```

### 5. メインブランチの名前を確認・設定

```bash
# 現在のブランチを確認
git branch

# ブランチ名がmainでない場合、mainに変更
git branch -M main
```

### 6. リモートリポジトリにプッシュ

```bash
git push -u origin main
```

初回プッシュの場合は `-u` オプションを使用することで、今後の `git push` コマンドでリモートとブランチを指定する必要がなくなります。

## 認証について

GitHubへのプッシュには認証が必要です。以下のいずれかの方法を使用してください：

### 方法1: Personal Access Token (PAT) を使用

1. GitHubでPersonal Access Tokenを作成
2. プッシュ時にユーザー名とトークンを入力

### 方法2: GitHub CLIを使用

```bash
gh auth login
```

### 方法3: SSHキーを使用

1. SSHキーを生成してGitHubに登録
2. リモートURLをSSH形式に変更：
   ```bash
   git remote set-url origin git@github.com:shokazama-ar/team-board.git
   ```

## トラブルシューティング

### エラー: "remote origin already exists"

既にリモートが設定されている場合：
```bash
git remote remove origin
git remote add origin https://github.com/shokazama-ar/team-board.git
```

### エラー: "failed to push some refs"

リモートリポジトリに既にファイルがある場合：
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### 認証エラーが発生する場合

Personal Access Tokenを使用する場合、パスワードの代わりにトークンを入力してください。

## 今後の更新手順

プロジェクトを更新した後、以下のコマンドでプッシュできます：

```bash
git add .
git commit -m "変更内容の説明"
git push
```
