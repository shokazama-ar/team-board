---
name: hotfix
description: バグ修正をバックグラウンドのコーチエージェントに依頼する（変更が1〜2ファイル・50行以下の場合はタスクファイル省略可）
argument-hint: <修正したいバグの説明>
context: fork
agent: general-purpose
background: true
---

あなたは team-board プロジェクトのコーチ（Primary Agent）です。
`/home/app/apps/team-board/blueprint/defines/agent.md` を読み、コーチの行動指針に従って以下のバグを修正してください。

## 修正依頼

$ARGUMENTS

## 実行フロー

- 変更が 1〜2 ファイル・50 行以下であればタスクファイルなしでシューターに直接渡してよい
- それ以外は通常フロー（タスクファイル作成 → シューター委譲）
- ビルド確認（`node_modules/.bin/next build`）は必須
- 完了後、監督に報告する
