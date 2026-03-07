# ADR-001: メンバー管理・設定画面リファクタリング

- **日付**: 2026-03-06
- **ステータス**: 完了

## 議論の背景

ダッシュボード・メンバーページ・設定ページの3画面について、以下の課題が議論された。

1. ダッシュボードに「直近のイベント」が2つ表示されており、重複していた
2. メンバー数が総数のみで、内訳（コーチ/選手）が分からなかった
3. プロファイル追加がメンバーページと設定ページの両方にあり、混乱を招いていた
4. 設定ページに管理者・コーチ・保護者の設定が混在しており、見通しが悪かった

## 決定事項

### ダッシュボード
- 上部サマリーカードの「直近のイベント」件数カードを削除し、下部の一覧カードに統合（件数はタイトル横に表示）
- メンバー数をアカウント数・コーチ数・選手数の3列に分けて表示

### メンバーページ
- `AddPlayerSection`（プロファイル追加UI）を削除
- プロファイル追加は設定ページに集約する

### 設定ページ
- コーチ・保護者・管理者の3タブ構成に変更
- **コーチタブ**: アカウントプロフィール + チームプロファイル管理・追加
- **保護者タブ**: アカウントプロフィール + 選手プロファイル管理・追加（種別選択なし）
- **管理者タブ**: チーム設定・招待コード・イベント種別・チーム削除
- `window.prompt` によるプロファイル追加をインラインフォームに置き換え
- `account_type`（`team_members.account_type`）を参照して初期タブを自動選択

### お知らせページ（バグ修正）
- `team_members` に存在しない `user_id` カラムを参照していた（400エラーの原因）
- `member_profiles!inner(user_id)` 経由のフィルタに修正
- 対象: `announcements/page.tsx`, `announcements/new/page.tsx`, `announcements/[id]/page.tsx`

### DBデータ変更
- `kazama.takeru.2014@gmail.com` の `account_type` を `coach` → `guardian` に変更

## 影響ファイル

- `src/app/(authenticated)/_components/DashboardContent.tsx`
- `src/app/(authenticated)/members/page.tsx`
- `src/app/(authenticated)/settings/page.tsx`
- `src/app/(authenticated)/announcements/page.tsx`
- `src/app/(authenticated)/announcements/new/page.tsx`
- `src/app/(authenticated)/announcements/[id]/page.tsx`
