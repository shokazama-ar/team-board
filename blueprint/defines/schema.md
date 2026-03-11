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
| share_code | text | プロファイル共有コード（UUID形式）。`/profile/[share_code]` で公開ページを表示 |

---

### `team_members`
チームとプロファイルの中間テーブル。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| team_id | uuid | teams.id |
| member_profile_id | uuid | member_profiles.id |
| user_id | uuid | auth.users.id。RLS高速化のため member_profiles.user_id を非正規化して格納 |
| role | enum | `admin` / `member` |
| account_type | enum | `coach` / `guardian` |

---

### `member_profile_access`
プレイヤープロファイルへのアクセス権限テーブル。保護者アカウントが子供のプロファイルを管理できるようリンクを保持する。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| member_profile_id | uuid | member_profiles.id |
| user_id | uuid | アクセスを許可されたユーザー（auth.users.id） |
| granted_by | uuid | アクセス権を付与したユーザー（auth.users.id） |
| created_at | timestamptz | |

RLSポリシー:
- SELECT: `user_id = auth.uid()` または `owns_member_profile_by_id(member_profile_id)`
- INSERT: プロファイルオーナーのみ（`owns_member_profile_by_id(member_profile_id)` かつ `granted_by = auth.uid()`）
- DELETE: `user_id = auth.uid()` または `owns_member_profile_by_id(member_profile_id)`

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
プロファイル（コーチ・選手）が所属する担当カテゴリ（`event_types.kind='category'`）。
イベント・お知らせの表示フィルタに使用。
コーチは設定画面「コーチ」タブで自己管理、選手は管理者が「カテゴリ割り当て」モーダルから管理する。

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

- `team_members` の SELECT ポリシーで `member_profiles` を JOIN すると無限ループになる場合がある
- 回避策: `team_members.user_id` を直接参照するか、`SECURITY DEFINER` 関数 (`is_member_of_team` 等) を経由する
- `member_profile_access` ポリシーで `member_profiles` を直接参照すると再帰的 RLS 評価が発生する。`SECURITY DEFINER` 関数 `owns_member_profile_by_id(profile_id)` 経由で回避する

## 主要RPC関数

| 関数 | 説明 |
|---|---|
| `get_my_team_id()` | ログインユーザーのチームIDを返す |
| `is_member_of_team(tid)` | チームメンバーか判定（SECURITY DEFINER） |
| `is_admin_of_team(tid)` | 管理者か判定 |
| `add_profile_to_team(target_team_id, profile_name, profile_kind)` | プロファイル追加 |
| `join_team_with_profile(code, profile_name, profile_kind)` | 招待コードでチーム参加（種別はRPC内部で自動判定） |
| `create_team_with_member(team_name, profile_name, profile_kind, team_account_type)` | チーム作成と同時にメンバー登録。`team_account_type` で `coach`/`guardian` を指定 |
| `check_invite_code_type(code)` | 招待コードの種別を返す（`'coach'`/`'guardian'`/`null`）。認証不要（SECURITY DEFINER） |
| `regenerate_invite_code(target_team_id)` | コーチ用招待コード再生成 |
| `regenerate_guardian_invite_code(target_team_id)` | 保護者用招待コード再生成 |
| `get_team_name(tid)` | チームIDからチーム名を返す。認証不要（SECURITY DEFINER）。公開問い合わせフォームから使用 |
| `owns_member_profile_by_id(profile_id)` | プロファイルのオーナーか判定（SECURITY DEFINER）。`member_profile_access` のRLSから呼ばれる |

---

### `inquiries`
チームへの外部問い合わせ。認証不要の公開フォーム（`/contact/[teamId]`）から送信される。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| team_id | uuid | teams.id |
| type | text | 旧形式: `trial`/`join`/`leave`/`other`（後方互換のため残存） |
| inquiry_type_id | uuid | inquiry_types.id（新形式。旧形式の場合は NULL） |
| name | text | 問い合わせ者の氏名 |
| email | text | メールアドレス |
| phone | text | 電話番号（任意） |
| message | text | メッセージ（任意） |
| custom_fields | jsonb | カスタムフォーム項目の回答 `{"field_id": "value"}` |
| status | text | `new`（未読）/ `read`（既読）/ `replied`（返信済み） |
| created_at | timestamptz | |

RLSポリシー:
- INSERT: 誰でも可（公開フォームから送信）
- SELECT/UPDATE: `is_admin_of_team(team_id)` を満たす管理者のみ

---

### `inquiry_types`
チームごとにカスタマイズ可能な問い合わせ種別。管理者が設定画面から管理する。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| team_id | uuid | teams.id |
| name | text | 種別名（例: 体験・見学希望） |
| message_template | text | フォームのメッセージ欄に自動挿入されるテンプレート |
| sort_order | int | 表示順 |
| is_active | boolean | false の場合フォームに表示しない |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLSポリシー:
- SELECT: 誰でも可（公開フォームから取得するため）
- INSERT/UPDATE/DELETE: `is_admin_of_team(team_id)` を満たす管理者のみ

---

### `inquiry_form_fields`
問い合わせ種別ごとのカスタムフォーム項目。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| inquiry_type_id | uuid | inquiry_types.id（CASCADE DELETE） |
| field_label | text | 表示ラベル |
| field_type | text | `text`/`textarea`/`tel`/`email`/`select`/`checkbox`/`radio` |
| placeholder | text | プレースホルダ（任意） |
| options | jsonb | select/radio/checkbox 用: `[{"label":"...","value":"..."}]` |
| is_required | boolean | 必須項目かどうか |
| sort_order | int | 表示順 |
| created_at | timestamptz | |

RLSポリシー:
- SELECT: 誰でも可
- INSERT/UPDATE/DELETE: 親 `inquiry_types` のチームの管理者のみ
