import MockupFrame from "../_components/MockupFrame";

export default function HelpAnnouncementsPage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">お知らせ</h1>
      <p className="mb-8 text-sm text-gray-500">チームメンバーへの連絡事項を投稿・確認します。</p>

      <Section title="投稿できる人">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>お知らせの投稿は<b>管理者のみ</b>できます。</li>
          <li>閲覧はすべてのメンバーが可能です（対象カテゴリを設定している場合を除く）。</li>
        </ul>
        <MockupFrame title="お知らせ — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">お知らせ</p>
              <div className="rounded-lg ring-2 ring-blue-400 ring-offset-1">
                <span className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white">
                  + 新規作成
                </span>
              </div>
            </div>
            <p className="mb-2 text-[10px] text-blue-500">↑ 管理者アカウントのみ表示されます</p>
            <div className="space-y-2">
              {[
                { title: "3月の練習スケジュール", author: "山田 管理者", date: "3月1日（金）" },
                { title: "保護者会のご案内", author: "山田 管理者", date: "2月20日（火）" },
              ].map(({ title, author, date }) => (
                <div key={title} className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="mt-0.5 text-gray-400">{author} ・ {date}</p>
                </div>
              ))}
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="対象カテゴリの設定">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>お知らせ作成時に<b>対象カテゴリ</b>を1つ以上選ぶと、そのカテゴリに所属する選手を持つメンバーにのみ表示されます。</li>
          <li>カテゴリを設定しない場合は、チーム全員に表示されます。</li>
          <li>管理者はカテゴリ設定に関わらず、すべてのお知らせを閲覧できます。</li>
        </ul>
        <MockupFrame title="お知らせを作成 — TeamBoard">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs">
            <div className="mb-3">
              <p className="mb-1 font-medium text-gray-700">タイトル</p>
              <div className="rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-600">A組 3月練習スケジュール</div>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-medium text-gray-700">本文</p>
              <div className="h-12 rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-400">内容を入力...</div>
            </div>
            <div className="mb-4 rounded-lg p-2 ring-2 ring-green-400 ring-offset-1">
              <p className="mb-2 font-medium text-gray-700">対象カテゴリ</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border-2 border-blue-500 bg-blue-50 px-2 py-0.5 font-medium text-blue-600">A組</span>
                <span className="rounded-full border-2 border-gray-200 bg-white px-2 py-0.5 text-gray-500">B組</span>
                <span className="rounded-full border-2 border-gray-200 bg-white px-2 py-0.5 text-gray-500">全体</span>
              </div>
              <div className="mt-2 space-y-1 text-[10px]">
                <p className="text-green-600">↑ A組を選択 → A組の選手を持つメンバーにのみ表示</p>
                <p className="text-gray-400">未選択の場合はチーム全員に表示されます</p>
              </div>
            </div>
            <span className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white">投稿する</span>
          </div>
        </MockupFrame>
      </Section>

      <Section title="ダッシュボードでの表示">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>ダッシュボードには最新のお知らせが最大5件表示されます。</li>
          <li>自分のカテゴリに関係するお知らせのみ表示するフィルタ（トグル）があります。</li>
          <li>お知らせにはカテゴリの色付きラベルが表示されます。</li>
        </ul>
        <MockupFrame title="ダッシュボード — TeamBoard">
          <div className="text-xs">
            <div className="mb-2 flex items-center justify-end gap-2">
              <span className="text-gray-500">自分のカテゴリのみ</span>
              <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-gray-300">
                <span className="inline-block h-3 w-3 translate-x-0.5 rounded-full bg-white shadow" />
              </div>
              <span className="text-gray-400">すべて</span>
              <p className="text-[10px] text-blue-500">← トグルで切り替え</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="mb-2 font-semibold text-gray-800">最新のお知らせ</p>
              <div className="space-y-2">
                {[
                  { title: "A組 3月練習スケジュール", cat: "A組", color: "#2563eb" },
                  { title: "保護者会のご案内", cat: null, color: null },
                  { title: "春合宿について", cat: "B組", color: "#16a34a" },
                ].map(({ title, cat, color }) => (
                  <div key={title} className="rounded border border-gray-100 p-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-gray-900">{title}</span>
                      {cat && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                          style={{ backgroundColor: color ?? undefined }}
                        >
                          {cat}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-blue-500">↑ カテゴリの色付きラベルで対象が一目でわかります</p>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="問い合わせ管理（管理者向け）">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>お知らせ画面の<b>管理者タブ</b>から、チームへの問い合わせ一覧を確認できます。</li>
          <li>問い合わせは「未読・既読・返信済み」の3つのステータスで管理できます。</li>
          <li>チームの公開お問い合わせフォーム（<code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">/contact/[チームID]</code>）から送信されます。</li>
          <li>フォームではメールアドレスが必須で、送信前に確認ダイアログが表示されます。</li>
        </ul>
        <MockupFrame title="お知らせ › 管理者タブ — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 flex gap-2 border-b border-gray-200 pb-2">
              {["全員向け", "管理者"].map((tab) => (
                <span
                  key={tab}
                  className={`px-3 py-1 ${tab === "管理者" ? "border-b-2 border-blue-600 font-medium text-blue-600" : "text-gray-500"}`}
                >
                  {tab}
                </span>
              ))}
            </div>
            <p className="mb-2 font-semibold text-gray-700">問い合わせ</p>
            <div className="space-y-2">
              {[
                { name: "田中 太郎", type: "体験・見学希望", status: "未読", statusStyle: "bg-yellow-100 text-yellow-800" },
                { name: "鈴木 次郎", type: "入会依頼", status: "返信済み", statusStyle: "bg-green-100 text-green-700" },
              ].map(({ name, type, status, statusStyle }) => (
                <div key={name} className="rounded-lg border border-gray-200 bg-white p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{name}</p>
                      <p className="text-gray-500">{type}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}>{status}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-blue-500">↑ ステータスをタップして既読・返信済みに変更できます</p>
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
