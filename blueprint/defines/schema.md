# データベーススキーマ定義

Supabase (PostgreSQL) のテーブル構成。RLSはすべて有効。

## テーブル一覧

### `profiles`
ログインユーザーのアカウント情報。`auth.users` と1対1。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | auth.users.id と一致 |
| email | text | |
| name | text | 表示名 |
| avatar_url | text | Storageパス |

---

### `teams`
チーム情報。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| name | text | |
| icon_url | text | |
| invite_code | text | コーチ用招待コード |
| invite_code_guardian | text | 保護者用招待コード |
| created_by | uuid | profiles.id |

---

### `member_profiles`
チーム内のプロファイル（1ユーザーが複数持てる）。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| user_id | uuid | auth.users.id |
| kind | enum | `coach` / `player` |
| name | text | プロファイル表示名 |
| avatar_url | text | |
| number | text | 背番号（任意） |

---

### `team_members`
チームとプロファイルの中間テーブル。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| team_id | uuid | teams.id |
| member_profile_id | uuid | member_profiles.id |
| role | enum | `admin` / `member` |
| account_type | enum | `coach` / `guardian` |

> ⚠️ `user_id` カラムは存在しない。ユーザー特定は `member_profiles!inner(user_id)` 経由で行う。

---

### `events`
チームの予定。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| team_id | uuid | |
| title | text | |
| event_type | text | 旧形式（後方互換用） |
| event_type_id | uuid | event_types.id（任意） |
| date | timestamptz | |
| location | text | |
| memo | text | |
| created_by | uuid | profiles.id |

---

### `event_types`
カスタムイベント種別・カテゴリ。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| team_id | uuid | |
| name | text | |
| color | text | hex カラーコード |
| sort_order | int | |
| kind | enum | `type`（種別）/ `category`（対象） |

---

### `attendances`
イベントへの出欠回答。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| event_id | uuid | |
| member_profile_id | uuid | |
| status | enum | `present` / `absent` / `undecided` |

---

### `announcements`
お知らせ。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| team_id | uuid | |
| author_id | uuid | profiles.id |
| title | text | |
| body | text | |
| created_at | timestamptz | |

---

### `event_event_types`
イベントと `event_types` の中間テーブル（1イベントに複数種別・カテゴリ）。

| カラム | 型 | 備考 |
|---|---|---|
| event_id | uuid | events.id |
| event_type_id | uuid | event_types.id |

---

### `member_profile_categories`
プレイヤープロファイルが所属するカテゴリ（`event_types.kind='category'`）。
イベント・お知らせの表示フィルタに使用。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| team_id | uuid | |
| member_profile_id | uuid | member_profiles.id |
| event_type_id | uuid | event_types.id（kind='category'のもの） |

---

### `announcement_categories`
お知らせと対象カテゴリの中間テーブル。
行なし = 全メンバーに表示。行あり = 該当カテゴリのプレイヤーを持つユーザーにのみ表示（管理者は常に全件参照可）。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| announcement_id | uuid | announcements.id |
| event_type_id | uuid | event_types.id（kind='category'のもの） |

## RLS重要事項

- `team_members` の SELECT ポリシーで同テーブルを自己参照すると無限ループになる
- 回避策: `SECURITY DEFINER` 関数 `is_member_of_team(tid)` を経由する

## 主要RPC関数

| 関数 | 説明 |
|---|---|
| `get_my_team_id()` | ログインユーザーのチームIDを返す |
| `is_member_of_team(tid)` | チームメンバーか判定（SECURITY DEFINER） |
| `is_admin_of_team(tid)` | 管理者か判定 |
| `add_profile_to_team(target_team_id, profile_name, profile_kind)` | プロファイル追加 |
| `join_team_with_profile(code, profile_name, profile_kind)` | 招待コードでチーム参加 |
| `regenerate_invite_code(target_team_id)` | コーチ用招待コード再生成 |
| `regenerate_guardian_invite_code(target_team_id)` | 保護者用招待コード再生成 |
