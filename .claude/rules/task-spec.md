## タスクファイル仕様

- 配置: `blueprint/tasks/todo/` (着手予定) / `pending/` (バックログ) / `done/` (完了)
- ファイル名: `task-YYYYMMDDNNN-<slug>.md`（例: `task-20260322001-inquiry-reply-templates.md`）
- `blueprint/tasks/` は `.gitignore` によりソース管理対象外（ローカル専用）

### 必須項目

```markdown
---
status: todo
priority: high | medium | low
conflict_risk: high | low
depends_on: []
---

# task-YYYYMMDDNNN — タイトル

## 概要
## 変更ファイル一覧
## 実装手順
## 注意
```
