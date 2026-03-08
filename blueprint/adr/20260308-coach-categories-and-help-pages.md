# ADR-003: コーチ担当カテゴリ・ヘルプページ整備

- **日付**: 2026-03-08
- **ステータス**: 完了

## 議論の背景

1. コーチプロファイルにカテゴリ概念がなく、コーチが担当するカテゴリの予定・お知らせだけをダッシュボードでフィルタできなかった
2. 管理者のカテゴリ割り当てモーダルでコーチと選手が混在しており、区別がつきにくかった
3. ヘルプページが文字のみで、どの画面の説明かわかりにくかった
4. ダッシュボードの挨拶文にメールアドレスが表示されており、表示名を使うべきだった

## 決定事項

### コーチ担当カテゴリ（自己管理）

- コーチアカウントは設定画面「コーチ」タブから自分の担当カテゴリを選択・保存できる
- `member_profile_categories` テーブルを活用（プレイヤーと同一スキーマ）
- RLSポリシーを追加: `own_member_profile()`経由で自分のプロファイルへの INSERT/DELETE を許可
- ダッシュボードのカテゴリフィルタはコーチプロファイルのカテゴリも考慮される（既存の `DashboardContent.tsx` の仕組みをそのまま利用）

### 管理者カテゴリ割り当てモーダルの分離

- `openPlayerCategoryModal` で全プロファイル（`kind` 問わず）を取得するよう変更
- モーダル内にタブ（コーチ / 選手）を追加し、表示するプロファイルを kind で切り替え
- `playerCategoryModalTab` state で管理

### ダッシュボード挨拶文の改善

- `profiles.name` を取得し、設定名 → メールのローカルパート → "ゲスト" の順でフォールバック
- 表示名を設定画面へのリンクとして表示

### ヘルプページ整備

- `src/app/help/` 配下に共通コンポーネントを追加:
  - `_components/HelpNav.tsx`: サイドバー/横スクロールナビ（usePathname でアクティブ表示）
  - `_components/MockupFrame.tsx`: macOS風ブラウザクロームのモックアップラッパー
- `layout.tsx` を再構成: デスクトップではスティッキーサイドバー、モバイルでは横スクロール
- `page.tsx`（インデックス）を新規作成: 各トピックへのリンクカード一覧
- 各ヘルプページに `MockupFrame` を使った Tailwind CSS UI イラストを追加し、説明対象の画面要素を `ring-2` で強調表示

## 影響ファイル

- `supabase/migrations/20240118000001_coach_profile_categories.sql`（新規）
- `src/app/(authenticated)/settings/page.tsx`（大幅変更）
- `src/app/(authenticated)/page.tsx`（挨拶文改善）
- `src/app/help/layout.tsx`（再構成）
- `src/app/help/page.tsx`（新規）
- `src/app/help/_components/HelpNav.tsx`（新規）
- `src/app/help/_components/MockupFrame.tsx`（新規）
- `src/app/help/events/page.tsx`（モックアップ追加）
- `src/app/help/announcements/page.tsx`（モックアップ追加）
- `src/app/help/categories/page.tsx`（モックアップ追加）
- `src/app/help/invite/page.tsx`（モックアップ追加）
- `src/app/help/members/page.tsx`（モックアップ追加）

## 関連スキーマ

- `member_profile_categories`: プロファイル（コーチ含む）とカテゴリの紐付け
- `member_profiles.kind`: `coach` / `player` でプロファイル種別を区別
- `profiles.name`: ダッシュボード挨拶文で使用
