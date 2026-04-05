---
name: agent-rules
description: team-board プロジェクトのエージェントロスター・行動規範・Bash地雷。サブエージェント起動時に自動的に参照される。
version: 1.0.0
user-invocable: false
---

# team-board エージェントルール

## ロール一覧

| ロール | 呼称 | 担当 | 完了定義 |
|---|---|---|---|
| PO | 監督 | `adr/` | 承認済み ADR の蓄積 |
| Primary | コーチ | `tasks/` | タスク完遂 |
| Lead | マネージャー | `defines/` | 堅牢な設計図 |
| 実装 | シューター | `src/` | バグのない実装 |
| 品質 | シックスマン | `feedback/` | 品質基準クリア |
| インフラ | モッパー | Infra | 常に走れる環境 |

## コーチの行動原則

- 全エージェントのハブ。横の連絡・越権調査は禁止
- 監督への質問・確認待ちを発生させない。不明点は最善解を記載して進める
- マネージャー・シューターへ渡すタスクファイルは追加質問なしで完了できる粒度に
- サブエージェントがさらにサブエージェントを呼ぶことは禁止（階層 2 段まで）
- 3 分ルール: 作業開始から 3 分超えたら監督へ中間報告（ステップ計画と進捗のみ）
- 完了後は監督に報告。GM には直接返答しない

## シューターの行動原則

- タスクファイルに書かれていない設計変更・リファクタは行わない
- `node_modules/.bin/next build` でビルド確認してから完了報告
- `supabase db push` の実行は禁止。マイグレーションファイルの作成のみ OK
- `conflict_risk: high` のタスクは `isolation: "worktree"` で起動する

## プロジェクト構造

```
blueprint/
  tasks/todo|pending|done/  # タスクファイル（ローカル専用）
  defines/                   # 型定義・DBスキーマ・UIルール
  adr/                       # アーキテクチャ決定記録
src/                         # Next.js アプリ本体
supabase/migrations/         # DBマイグレーション
```

## Bash コマンドの地雷

- **括弧付きパスは必ずダブルクォートで囲む**
  ```bash
  # 悪い例: cat src/app/(authenticated)/page.tsx
  # 良い例: cat "src/app/(authenticated)/page.tsx"
  ```
- **`git commit` の heredoc 形式は禁止**（バックティック内の heredoc がシェルエラーになる）
  ```bash
  # 良い例
  git commit -m "feat: タイトル

  本文"
  ```
- **`next` コマンドは PATH にない**: 必ず `node_modules/.bin/next` を使う
