import MockupFrame from "../_components/MockupFrame";

export default function HelpInquiriesPage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">問い合わせ管理</h1>
      <p className="mb-8 text-sm text-gray-500">外部からの体験・見学希望などの問い合わせを受け取り、管理者が返信・対応状況を管理する機能です。</p>

      <Section title="問い合わせを受け取る">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>チームの公開フォーム（<code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">/contact/[チームID]</code>）から送信された問い合わせが管理者に届きます。</li>
          <li>問い合わせが届くとメールでも通知されます。</li>
          <li>フォームでは名前・メールアドレス・問い合わせ種別などを入力します。送信前に確認ダイアログが表示されます。</li>
        </ul>
      </Section>

      <Section title="問い合わせ一覧">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>ナビの「問い合わせ」から一覧を確認できます。</li>
          <li>ステータスは「未読」「要確認」「対応中」「返信済み」「完了」の5種類で管理されます。タブをクリックするとステータスで絞り込めます。</li>
          <li>問い合わせを開くと自動的に「対応中」に変わります。</li>
          <li>返信後は「返信済み」になり、対応完了後は「完了」ボタンで「完了」ステータスに変更できます。</li>
          <li>返信受信など要対応の場合は「要確認」ステータスになります。</li>
        </ul>
        <MockupFrame title="問い合わせ — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 flex gap-1 border-b border-gray-200 pb-2">
              {[
                { label: "すべて", active: true },
                { label: "未読", active: false },
                { label: "要確認", active: false },
                { label: "対応中", active: false },
                { label: "返信済み", active: false },
                { label: "完了", active: false },
              ].map(({ label, active }) => (
                <span
                  key={label}
                  className={`px-3 py-1 ${active ? "border-b-2 border-blue-600 font-medium text-blue-600" : "text-gray-500"}`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { name: "田中 太郎", type: "体験・見学希望", status: "未読", statusStyle: "bg-red-50 text-red-700", date: "3/1 10:00" },
                { name: "鈴木 次郎", type: "入会依頼", status: "返信済み", statusStyle: "bg-green-50 text-green-700", date: "2/20 14:30" },
                { name: "佐藤 三郎", type: "体験・見学希望", status: "完了", statusStyle: "bg-gray-100 text-gray-500", date: "2/10 09:00" },
              ].map(({ name, type, status, statusStyle, date }) => (
                <div key={name} className="rounded-lg border border-gray-200 bg-white p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{name}</p>
                      <p className="text-gray-500">{type}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}>{status}</span>
                      <span className="text-[10px] text-gray-400">{date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="返信する">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>問い合わせ詳細から直接メールで返信できます。</li>
          <li>返信メールは問い合わせ者のメールアドレス宛に送信されます。</li>
          <li>返信後にステータスが自動で「返信済み」に変わります。</li>
          <li>あらかじめ登録した返信テンプレートをカーソル位置に挿入できます（「テンプレートを挿入」ボタン）。</li>
        </ul>
        <MockupFrame title="問い合わせ詳細 — TeamBoard">
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-gray-900">田中 太郎 さんからの問い合わせ</p>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">未読</span>
              </div>
              <p className="text-gray-500">種別: 体験・見学希望</p>
              <p className="text-gray-500">メール: tanaka@example.com</p>
              <p className="mt-1.5 text-gray-700">体験入会を希望します。いつ頃伺えますか？</p>
            </div>
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-gray-700">返信メッセージ</p>
                <span className="rounded border border-gray-300 px-2 py-0.5 text-[10px] text-gray-600">テンプレートを挿入 ▾</span>
              </div>
              <div className="h-12 rounded border border-blue-300 bg-white px-2 py-1.5 text-gray-400">返信内容を入力...</div>
              <span className="mt-2 inline-block rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white">送信する</span>
              <p className="mt-1.5 text-[10px] text-blue-600">↑ 送信後にステータスが「返信済み」に変わります</p>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="返信テンプレート">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>よく使う返信文をテンプレートとして登録しておくと、返信フォームから素早く挿入できます。</li>
          <li>テンプレートは設定画面（管理者タブ）の「返信テンプレート」セクションから追加・編集・削除できます。</li>
          <li>テンプレートはチームごとに管理されます。管理者のみ編集可能です。</li>
        </ul>
        <MockupFrame title="設定 › 管理者 — TeamBoard">
          <div className="text-xs space-y-2">
            <p className="font-semibold text-gray-700">返信テンプレート</p>
            <div className="rounded-lg border border-gray-200 bg-white p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">体験受付の返信</p>
                  <p className="mt-0.5 text-gray-500 line-clamp-2">ご連絡ありがとうございます。体験入会のお申し込みを受け付けました...</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <span className="rounded border border-gray-300 px-2 py-0.5 text-gray-600">編集</span>
                  <span className="rounded border border-red-300 px-2 py-0.5 text-red-600">削除</span>
                </div>
              </div>
            </div>
            <span className="inline-block rounded border border-dashed border-gray-300 px-3 py-1 text-gray-500">＋ テンプレートを追加</span>
          </div>
        </MockupFrame>
      </Section>

      <Section title="返信履歴">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>管理者からの返信（送信済み）と問い合わせ元からの返信メールの両方がスレッド形式で表示されます。</li>
        </ul>
        <MockupFrame title="問い合わせ詳細 › 返信履歴 — TeamBoard">
          <div className="space-y-2 text-xs">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
              <p className="mb-0.5 font-medium text-gray-700">田中 太郎（問い合わせ者）</p>
              <p className="text-gray-600">体験入会を希望します。いつ頃伺えますか？</p>
              <p className="mt-1 text-[10px] text-gray-400">3/1 10:00</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
              <p className="mb-0.5 font-medium text-blue-800">山田 管理者（返信）</p>
              <p className="text-blue-700">ご連絡ありがとうございます。3/15の練習にお越しください。</p>
              <p className="mt-1 text-[10px] text-blue-400">3/2 09:30</p>
            </div>
          </div>
        </MockupFrame>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-gray-800">{title}</h2>
      {children}
    </div>
  );
}
