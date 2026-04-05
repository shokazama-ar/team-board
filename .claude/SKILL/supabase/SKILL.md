---
name: supabase-patterns
description: team-board プロジェクトの Supabase RLS・マイグレーション規約・環境構成。supabase/ や src/lib/supabase/ を編集する際に自動参照する。
version: 1.0.0
paths:
  - supabase/**/*.sql
  - src/lib/supabase/**
---

# Supabase パターン

## 環境構成

| 環境 | URL |
|---|---|
| Dev | `https://hpzoaewvdwpshgxotmed.supabase.co` |
| Staging / 本番 | `https://lgghvqytslnocbpgouhb.supabase.co` |

- ローカル Docker は削除済み（2026-03-28）。Dev 環境に直接接続する。
- main push → GitHub Actions が `supabase db push` を自動実行（手動不要）

## マイグレーション規約

- ファイル作成は OK。**`supabase db push` の手動実行は禁止**
- べき等に書く（`IF NOT EXISTS` / `OR REPLACE`）
- RLS 変更は必ず Dev で動作確認してから commit

## RLS ポリシーの注意点

### 自己参照による無限ループ

`team_members` テーブルの SELECT ポリシーで同テーブルを参照すると `infinite recursion detected` になる。

**回避策**: `SECURITY DEFINER` 関数 (`is_member_of_team()`) を経由する。

```sql
-- 悪い例: 自己参照
CREATE POLICY "members_select" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- 良い例: SECURITY DEFINER 関数経由
CREATE POLICY "members_select" ON team_members
  FOR SELECT USING (is_member_of_team(team_id));
```

### ポリシーの書き方

- `USING` と `WITH CHECK` を明示的に分ける
- `SECURITY DEFINER` 関数は `search_path = ''` を指定する

## Auth

- クラウドはデフォルトでメール確認必須（`mailer_autoconfirm: false`）
- Redirect URLs は Supabase ダッシュボードの Authentication > URL Configuration で管理
