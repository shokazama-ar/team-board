# ADR-002: ダッシュボードカテゴリフィルタ・お知らせカテゴリラベル・DateTimePicker導入

- **日付**: 2026-03-07
- **ステータス**: 完了

## 議論の背景

1. ダッシュボードの「最新のお知らせ」にカテゴリ（対象）ラベルが表示されていなかった
2. 直近のイベント・未回答のイベント・お知らせが、ログインユーザーのプレイヤープロファイルの所属カテゴリに関わらずすべて表示されていた
3. 予定の登録・編集フォームで時刻を1分単位でしか選べず、選択肢が多すぎた

## 決定事項

### ダッシュボードカテゴリフィルタ

- `DashboardContent.tsx`（Server Component）を分割し、フィルタ付き表示を `DashboardFilteredContent.tsx`（Client Component）に切り出した
- デフォルト表示: ログインユーザーのプレイヤープロファイルが所属するカテゴリに一致するイベント・お知らせのみ表示（カテゴリ未設定のものは全員に表示）
- トグルスイッチで「すべてのカテゴリを表示」モードに切り替え可能
- 対象セクション: 未回答イベント・直近のイベント・最新のお知らせ（すべて同一トグルで連動）
- ユーザーのカテゴリが1件もない場合はトグルを非表示

### カテゴリラベルの追加

- 最新のお知らせ: タイトル横に `announcement_categories` 経由のカテゴリバッジを表示
- 未回答のイベント・直近のイベント: タイトル横に `event_event_types`（kind='category'）経由のカテゴリバッジを表示
- バッジは `event_types.color` を背景色とした `rounded-full` の白文字ラベル

### データ取得の再構成（DashboardContent.tsx）

並列クエリを以下の2段構成に整理:
1. 第1段（並列）: teams, memberCount, allUpcomingEvents（カテゴリ情報含む）, announcements（カテゴリ情報含む）, myProfiles
2. 第2段（並列）: member_profile_categories（ユーザーのカテゴリID）, attendances（出欠回答済みイベントID）

### DateTimePicker コンポーネント

- `src/components/ui/DateTimePicker.tsx` を新規作成
- 日付: `<input type="date">`、時: `<select>`（0〜23）、分: `<select>`（0, 5, 10, …, 55）
- `value` / `onChange` は `"YYYY-MM-DDTHH:mm"` 形式で `datetime-local` と互換
- 既存データの分が5の倍数でない場合は最近傍に自動丸め
- 予定の新規作成・編集ページ（`events/new/page.tsx`, `events/[id]/edit/page.tsx`）で使用

## 影響ファイル

- `src/app/(authenticated)/_components/DashboardContent.tsx`（大幅変更）
- `src/app/(authenticated)/_components/DashboardFilteredContent.tsx`（新規）
- `src/components/ui/DateTimePicker.tsx`（新規）
- `src/app/(authenticated)/events/new/page.tsx`
- `src/app/(authenticated)/events/[id]/edit/page.tsx`

## 関連スキーマ

- `event_event_types`: イベントとカテゴリの紐付け
- `member_profile_categories`: プレイヤープロファイルとカテゴリの紐付け
- `announcement_categories`: お知らせとカテゴリの紐付け
