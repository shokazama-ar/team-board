---
name: ship
description: blueprint更新確認→コミット→プッシュのフロー。push前にblueprintが更新されているか確認する。
---

以下のフローでコミット＆プッシュを実施してください。

## Ship フロー

1. `git diff --stat HEAD` で変更ファイルを確認する
2. 変更内容に応じて以下を確認する:
   - スキーマ・UIルール変更 → `blueprint/defines/` が更新されているか
   - 重要な設計決定 → `blueprint/adr/` に ADR があるか
3. 不足があれば先に更新してからコミットする
4. コミットメッセージを生成してユーザーに確認を求める
5. 承認を得たらコミット＆ `git push origin main`
