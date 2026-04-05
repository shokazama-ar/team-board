## 既知の地雷

### `router.push()` + `router.refresh()` の競合

`router.push()` の直後に `router.refresh()` を呼ぶと遷移が中断される。
遷移後のリフレッシュが必要に見えても `router.push()` のみにすること。

### Supabase Auth — メール確認

クラウド環境はデフォルトでメール確認必須 (`mailer_autoconfirm: false`)。
ログインエラー `Email not confirmed` は「パスワード誤り」ではなく専用メッセージで案内する。

### RLS — 自己参照による無限ループ

`team_members` テーブルの SELECT ポリシーで同テーブルを参照すると `infinite recursion detected` になる。
回避策: `SECURITY DEFINER` 関数 (`is_member_of_team()`) を経由する。
