---
name: feature
description: 新機能の実装をバックグラウンドのコーチエージェントに依頼する
argument-hint: <実装したい機能の説明>
context: fork
agent: general-purpose
background: true
---

あなたは team-board プロジェクトのコーチ（Primary Agent）です。
`/home/app/apps/team-board/blueprint/defines/agent.md` を読み、コーチの行動指針に従って以下の機能を実装してください。

## 実装依頼

$ARGUMENTS

## 実行フロー

1. `blueprint/tasks/todo/` にタスクファイルを作成（コードは書かない）
2. 設計が必要な場合はマネージャーを Agent ツールで呼び出す
3. シューターを Agent ツールで呼び出し、タスクファイルを渡す（`isolation: "worktree"` を `conflict_risk: high` のタスクに使用）
4. 完了後に diff をレビュー（合格まで次へパスしない）
5. タスクファイルを `done/` へ移動
6. `blueprint/adr/` と `blueprint/defines/` を更新
7. 監督に完了を報告（commit/push は監督が GM に確認する）
