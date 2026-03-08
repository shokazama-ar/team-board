# UIルール定義

## スタイル基盤

- Tailwind CSS（`clsx` / `cn` は未導入、直接クラス文字列を使用）
- アイコン: `lucide-react`（`strokeWidth={1.5}` を基本とし、強調時は `2`）
- フォント: システムデフォルト

## カラー規則

| 用途 | クラス例 |
|---|---|
| プライマリアクション | `bg-blue-600 text-white hover:bg-blue-700` |
| 危険なアクション | `border-red-300 text-red-600 hover:bg-red-50` |
| コーチバッジ | `bg-blue-50 text-blue-700` |
| 選手バッジ | `bg-green-50 text-green-700` |
| 管理者バッジ | `bg-gray-100 text-gray-600` |
| 警告（未回答） | `border-yellow-300 bg-yellow-50 text-yellow-900` |

## イベント種別カラー

- 種別（type）: 暖色系（赤・オレンジ・ピンク・紫など）
- カテゴリ（category）: 寒色系（青・インジゴ・ティール・緑など）

## コンポーネント規則

### カード
```
rounded-lg border border-gray-200 bg-white p-6
```

### 入力フィールド
```
w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
```

### タブナビゲーション
```
border-b border-gray-200 / -mb-px flex space-x-6
アクティブ: border-b-2 border-blue-500 text-blue-600
非アクティブ: border-transparent text-gray-500 hover:text-gray-700
```

## ページレイアウト

- 最大幅: `max-w-3xl`（一覧系）/ `max-w-lg`（設定・フォーム系）
- ページタイトル: `text-2xl font-bold mb-6`

## ナビゲーション

- CLAUDE.md の `router.push()` ルールに従い、`router.push()` 後に `router.refresh()` を呼ばない

## 共通UIコンポーネント

### `DateTimePicker` (`src/components/ui/DateTimePicker.tsx`)
日付 `<input type="date">` ＋ 時・分 `<select>` を組み合わせた日時選択コンポーネント。
分の選択肢は 0, 5, 10, …, 55 の5分刻み。
`value` / `onChange` は `"YYYY-MM-DDTHH:mm"` 形式（`datetime-local` と互換）。

```tsx
<DateTimePicker value={date} onChange={setDate} required />
<DateTimePicker value={endDate} onChange={setEndDate} min={date} />
```

### トグルスイッチ
カテゴリフィルタなど ON/OFF 切替に使用するインラインパターン。

```tsx
<button
  onClick={() => setShowAll((v) => !v)}
  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showAll ? "bg-blue-600" : "bg-gray-300"}`}
>
  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showAll ? "translate-x-4" : "translate-x-1"}`} />
</button>
```

## アクセシビリティ

- アイコンのみのボタンには `aria-label` を付与
- 装飾アイコンには `aria-hidden="true"` を付与

## クリップボードコピー

HTTP環境（`navigator.clipboard` が使えない環境）向けのフォールバック関数を使用すること：

```tsx
function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
}
```

`navigator.clipboard.writeText()` を直接呼ばないこと。

## 招待コード共有UIパターン

招待コードはブロック表示し、下に「共有」「再生成」ボタンを横並びにする：

```tsx
<code className="mb-2 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono">
  {inviteCode}
</code>
<div className="flex gap-2">
  <div className="relative" ref={shareRef}>
    <button className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
      <Share2 size={16} /> 共有
    </button>
    {/* ドロップダウンは left-0（左揃え）で配置 */}
    <div className="absolute left-0 top-full z-10 mt-1 w-48 ...">...</div>
  </div>
  <button className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
    <RefreshCw size={16} /> 再生成
  </button>
</div>
```

## 送信確認ダイアログパターン

フォーム送信前の確認には固定モーダルを使用：

```tsx
{showConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
      <h3 className="mb-3 text-base font-semibold text-gray-900">送信内容の確認</h3>
      {/* 確認内容 */}
      <div className="flex gap-3">
        <button onClick={() => setShowConfirm(false)}
          className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          戻る
        </button>
        <button onClick={handleConfirmedSubmit}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
          この内容で送信
        </button>
      </div>
    </div>
  </div>
)}
```

## タイムゾーン

日付表示には必ず `timeZone: "Asia/Tokyo"` を指定すること：

```tsx
// NG
new Date(value).toLocaleDateString("ja-JP", { year: "numeric", ... })

// OK
new Date(value).toLocaleDateString("ja-JP", { year: "numeric", ..., timeZone: "Asia/Tokyo" })
```
