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
| slug | text | 一意。問い合わせ受信メールのローカルパート（contact-{slug}@...）。設定済みチームのみ問い合わせフォームが有効。形式: `^[a-z0-9][a-z0-9-]*[a-z0-9]$` |
| created_by | uuid | profiles.id |
| google_calendar_id | text | 同期先GoogleカレンダーID（Googleカレンダー連携） |
| google_refresh_token | text | OAuth2リフレッシュトークン（管理者）（Googleカレンダー連携） |
| google_sync_enabled | bool | 連携ON/OFF（デフォルトfalse）（Googleカレンダー連携） |

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
双方向承認フロー（2026-04-01 再設計）に対応するため、`status` と `requested_by` カラムを追加する。

| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | |
| member_profile_id | uuid | member_profiles.id |
| user_id | uuid | アクセスを許可されたユーザー（auth.users.id） |
| granted_by | uuid | アクセス権を付与したユーザー（auth.users.id） |
| status | text | `'pending'` / `'accepted'` / `'rejected'`（新フロー用。既存行はデフォルト `'accepted'`） |
| requested_by | uuid | リクエストを送ったユーザーの user_id（プロファイル作成者）（新フロー用） |
| created_at | timestamptz | |

RLSポリシー（新フロー後）:
- SELECT: `user_id = auth.uid()` または `owns_member_profile_by_id(member_profile_id)`
- INSERT: プロファイルの作成者本人（自分のプロファイルへのアクセスリクエスト発行）
- UPDATE: 共有先ユーザー本人（`status` を `accepted` / `rejected` に変更）
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
| google_event_id | text | GoogleカレンダーイベントID（紐付け用）（Googleカレンダー連携） |

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
| google_sync_enabled | bool | カテゴリ別同期設定（デフォルトtrue）（Googleカレンダー連携） |

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

---

## 選手プロファイル共有の設計方針（再設計: 2026-04-01）

> 設計日: 2026-04-01（GMからの指示に基づき全面再設計）

### 設計概要

選手プロファイルの**作成者自身**が共有相手（guardian）を検索・指定・管理する設計に変更する。
share_code による受動的な紐付けフローを廃止し、作成者主導の双方向承認フローに移行する。

---

### 廃止する機能

| 対象 | 種別 | 理由 |
|---|---|---|
| `member_profiles.share_code` | DROP COLUMN | 新フローでは不要 |
| `member_profiles.invite_code_guardian` | DROP COLUMN | 即時廃止（移行期間不要） |
| `link_profile_by_share_code` RPC | DROP FUNCTION | share_code 廃止により不要 |
| `regenerate_profile_share_code` RPC | DROP FUNCTION | share_code 廃止により不要 |
| `/teams/join-profile` ページ | 廃止 | 後継ページなし |
| 設定画面の「共有コード」表示セクション | 廃止 | 新 UI に置き換え |

---

### 新しい UX フロー

#### 共有する側（プロファイル作成者）

1. 選手プロファイル編集画面（または専用の「共有管理」エリア）でチーム内ユーザーを名前・メールアドレスで検索する
2. 対象ユーザーを選択して「共有リクエストを送る」を実行する
3. 共有中の guardian 一覧を確認し、任意のタイミングで「共有解除」できる

#### 共有を受ける側（guardian）

1. 選手プロファイルの作成エリア（画面）を開くと、受信した共有リクエストが表示される
2. 「承認」または「拒否」を選択する（承認で `member_profile_access` に行が追加される）
3. 承認済みのプロファイルを一覧で確認し、任意のタイミングで「共有解除」できる

---

### テーブル・カラムの変更概要

#### `member_profiles`

| カラム | 変更 | 内容 |
|---|---|---|
| `share_code` | DROP | 廃止 |
| `invite_code_guardian` | DROP | 廃止 |

#### `member_profile_access`（既存テーブル）

既存データはそのまま有効（アクセス権を失わせない）。
構造は維持しつつ、以下のカラムを追加してリクエスト状態を管理する。

| カラム | 変更 | 内容 |
|---|---|---|
| `status` | ADD COLUMN | `'pending'` / `'accepted'` / `'rejected'` のいずれか |
| `requested_by` | ADD COLUMN | リクエストを送ったユーザーの user_id（プロファイル作成者） |

RLS 変更概要:
- INSERT: プロファイルの作成者本人（自分のプロファイルへのアクセスリクエスト発行）
- UPDATE: 共有先ユーザー本人（`status` を `accepted` / `rejected` に変更）
- DELETE: プロファイル作成者または共有先ユーザー本人（双方から解除可能）
- SELECT: `user_id = auth.uid()` または `profile_id` のオーナー本人

---

### 影響する画面一覧

| 画面 | 変更内容 |
|---|---|
| 選手プロファイル詳細・編集画面 | 共有リクエスト送信 UI・共有中 guardian 一覧・解除ボタンを追加 |
| guardian の「プロファイル作成エリア」 | 受信リクエスト一覧・承認/拒否 UI を追加 |
| `/teams/join-profile` | 廃止（share_code フロー自体を削除） |
| 設定画面（共有コード表示） | 廃止 |

---

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
| `create_team_with_member(team_name, profile_name, profile_kind, team_account_type)` | チーム作成と同時にメンバー登録。`team_account_type` で `coach`/`guardian` を指定 |
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
