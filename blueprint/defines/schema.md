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
| invite_code_guardian | text | 保護者用招待コード（唯一の参加経路） |
| slug | text | 一意。問い合わせ受信メールのローカルパート（contact-{slug}@...）。設定済みチームのみ問い合わせフォームが有効。形式: `^[a-z0-9][a-z0-9-]*[a-z0-9]$` |
| created_by | uuid | profiles.id |

---

### `member_profiles`
チーム内のプロファイル（1ユーザーが複数持てる）。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| user_id | uuid | auth.users.id |
| kind | enum | `coach` / `player` / `guardian` |
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

---

### `team_invitations`
管理者が発行するメール招待レコード。`/api/invite` が INSERT し、`accept_team_invite_by_token` RPC が消費する。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | 招待トークンとして使用（URL に埋め込む） |
| team_id | uuid | teams.id |
| email | text | 招待先メールアドレス |
| invited_by | uuid | 招待した管理者の auth.users.id |
| accepted_at | timestamptz | 受諾日時（NULL = 未受諾） |
| expires_at | timestamptz | 有効期限（デフォルト: 作成から7日） |
| created_at | timestamptz | |

RLSポリシー:
- INSERT: サービスロール（`/api/invite` 経由）のみ
- SELECT: 同チームの管理者のみ

招待フロー:
1. 管理者が設定画面でメールアドレスを入力 → `/api/invite` POST
2. API が `team_invitations` に INSERT → `invitation.id` を `invitation_token` として `redirectTo` URL に付与
3. 新規ユーザー: `inviteUserByEmail` で Supabase 標準招待メール送信
4. 既存ユーザー: `generateLink(magiclink)` + Resend でカスタムメール送信
5. 受信者がリンクをクリック → `/auth/callback?invitation_token=<id>` → `accept_team_invite_by_token` RPC 実行 → `/set-password` へ

---

## 主要RPC関数

| 関数 | 説明 |
|---|---|
| `get_my_team_id()` | ログインユーザーのチームIDを返す |
| `is_member_of_team(tid)` | チームメンバーか判定（SECURITY DEFINER） |
| `is_admin_of_team(tid)` | 管理者か判定 |
| `add_profile_to_team(target_team_id, profile_name, profile_kind)` | プロファイル追加 |
| `join_team_with_profile(code)` | 保護者招待コードでチーム参加。`kind='guardian'` の member_profile を自動作成（`profiles.name` をデフォルト名） |
| `create_team_with_member(team_name, profile_name, profile_kind, team_account_type)` | チーム作成と同時にメンバー登録。`team_account_type` で `coach`/`guardian` を指定 |
| `check_invite_code_type(code)` | 招待コードの種別を返す（`'guardian'`/`null`）。認証不要（SECURITY DEFINER） |
| `regenerate_guardian_invite_code(target_team_id)` | 保護者用招待コード再生成 |
| `grant_coach_role(target_user_id)` | 対象ユーザーにコーチ権限を付与（admin専用）。`account_type='coach'` + `member_profiles.kind='coach'` に更新 |
| `revoke_coach_role(target_user_id)` | 対象ユーザーのコーチ権限を剥奪（admin専用・自分自身は不可）。guardian に戻す |
| `get_team_name(tid)` | チームIDからチーム名を返す。認証不要（SECURITY DEFINER）。公開問い合わせフォームから使用 |
| `get_team_slug(tid)` | チームIDからslugを返す。認証不要（SECURITY DEFINER）。公開問い合わせフォームから使用 |
| `owns_member_profile_by_id(profile_id)` | プロファイルのオーナーか判定（SECURITY DEFINER）。`member_profile_access` のRLSから呼ばれる |
| `accept_team_invite_by_token(p_token)` | 招待トークンを検証してチームに参加。`kind='guardian'` の `member_profile` を自動作成し `team_members` に INSERT。`team_invitations.accepted_at` を更新（SECURITY DEFINER） |

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
| status | text | `new`（未読）/ `read`（対応中）/ `replied`（返信済み）/ `done`（完了）/ `pending`（要確認） |
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

---

### `inquiry_reply_templates`
チームごとの問い合わせ返信テンプレート。管理者が設定画面から管理し、返信フォームのカーソル位置に挿入できる。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| team_id | uuid FK→teams | CASCADE DELETE |
| title | text | テンプレート名（管理用ラベル） |
| body | text | 本文 |
| sort_order | int | 現在は UI 上の並び替え不要。created_at 昇順で代用 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLSポリシー:
- SELECT: チームメンバー全員（返信フォームから読み込むため）
- INSERT/UPDATE/DELETE: 管理者のみ（`is_admin_of_team(team_id)` 相当の team_members チェック）

---

### `inquiry_replies`
問い合わせへの返信・受信メール履歴。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| inquiry_id | uuid FK→inquiries | CASCADE DELETE |
| direction | text | outbound / inbound |
| from_name | text | nullable |
| from_email | text | nullable |
| body | text | |
| created_at | timestamptz | |

RLS: SELECT は自チームの問い合わせに紐づくもののみ。INSERT はサービスロール（API ルート経由）のみ。
