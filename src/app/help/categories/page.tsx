import MockupFrame from "../_components/MockupFrame";

export default function HelpCategoriesPage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">カテゴリ機能</h1>
      <p className="mb-8 text-sm text-gray-500">予定・お知らせの対象を絞り込む仕組みです。</p>

      <Section title="イベント種別 と 対象カテゴリの違い">
        <div className="space-y-3 text-sm text-gray-700">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="mb-1 font-semibold text-gray-800">イベント種別（例: 練習・試合・合宿）</p>
            <p>予定の<b>内容</b>を分類します。ダッシュボードやカレンダーで色分け表示されます。設定画面で自由に追加できます。</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="mb-1 font-semibold text-gray-800">対象カテゴリ（例: A組・男子・全体）</p>
            <p>予定・お知らせの<b>対象者</b>を絞ります。選手をカテゴリに所属させることで、関係する予定だけが表示されます。</p>
          </div>
        </div>
        <MockupFrame title="予定を作成 — TeamBoard">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs">
            <div className="mb-3 rounded-lg p-2 ring-2 ring-red-400 ring-offset-1">
              <p className="mb-2 font-medium text-gray-700">イベント種別</p>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-red-500 bg-red-500">
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </span>
                  <span className="font-medium text-red-600">試合</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />
                  <span className="text-gray-500">練習</span>
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-red-500">↑ 予定の「内容」を分類（1つだけ選択・色分け表示）</p>
            </div>
            <div className="rounded-lg p-2 ring-2 ring-blue-400 ring-offset-1">
              <p className="mb-2 font-medium text-gray-700">対象カテゴリ</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border-2 border-blue-500 bg-blue-50 px-2 py-0.5 font-medium text-blue-600">A組</span>
                <span className="rounded-full border-2 border-gray-200 bg-white px-2 py-0.5 text-gray-500">B組</span>
                <span className="rounded-full border-2 border-gray-200 bg-white px-2 py-0.5 text-gray-500">全体</span>
              </div>
              <p className="mt-1.5 text-[10px] text-blue-500">↑ 予定の「対象者」を絞り込む（複数選択可）</p>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="選手へのカテゴリ割り当て">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>コーチは設定画面の「コーチ」タブの「カテゴリ割り当て」から、各選手にカテゴリを割り当てます。</li>
          <li>1人の選手に複数カテゴリを設定できます。</li>
        </ul>
        <MockupFrame title="設定 — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 flex gap-2 border-b border-gray-200 pb-2">
              {["管理者", "コーチ", "保護者"].map((tab) => (
                <span
                  key={tab}
                  className={`rounded-t px-3 py-1 ${tab === "コーチ" ? "border-b-2 border-blue-600 font-medium text-blue-600" : "text-gray-500"}`}
                >
                  {tab}
                </span>
              ))}
            </div>
            <div className="rounded-lg p-2 ring-2 ring-green-400 ring-offset-1">
              <p className="mb-2 font-semibold text-gray-700">選手カテゴリ割り当て</p>
              <div className="space-y-2">
                {[
                  { name: "田中 次郎", cats: ["A組", "全体"] },
                  { name: "鈴木 花子", cats: ["B組", "全体"] },
                  { name: "佐藤 一郎", cats: ["A組"] },
                ].map(({ name, cats }) => (
                  <div key={name} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1.5">
                    <span className="text-gray-700">{name}</span>
                    <div className="flex gap-1">
                      {cats.map((cat) => (
                        <span key={cat} className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-medium text-white">{cat}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-green-600">↑ 各選手に複数のカテゴリを割り当てられます</p>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="フィルタ機能（ダッシュボード・予定表・お知らせ）">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>ダッシュボードには、自分の選手プロファイルが所属するカテゴリに関係する予定・お知らせだけが表示されます。</li>
          <li>トグルスイッチを「すべて」にするとフィルタを解除して全件表示できます。</li>
          <li>カテゴリ未設定の予定・お知らせは、フィルタに関係なく常に全員に表示されます。</li>
          <li>「予定表」と「お知らせ」ページにも同じトグルがあります。自分のカテゴリに関係する内容だけに絞り込めます。</li>
        </ul>
        <MockupFrame title="ダッシュボード — TeamBoard">
          <div className="text-xs">
            <div className="grid gap-4 md:grid-cols-2">
              {/* フィルタOFF */}
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-end gap-1.5">
                  <span className="text-gray-500">自分のカテゴリのみ</span>
                  <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-gray-300">
                    <span className="inline-block h-3 w-3 translate-x-0.5 rounded-full bg-white shadow" />
                  </div>
                  <span className="text-gray-400">すべて</span>
                </div>
                <p className="mb-1 font-semibold text-gray-700">直近のイベント</p>
                <div className="space-y-1">
                  <div className="rounded border border-gray-100 px-2 py-1 text-gray-700">
                    <span>第10回練習</span>
                    <span className="ml-1 rounded-full bg-blue-500 px-1 py-0.5 text-[9px] text-white">A組</span>
                  </div>
                </div>
                <p className="mt-1.5 text-[10px] text-gray-400">A組のイベントのみ表示</p>
              </div>
              {/* フィルタON（すべて） */}
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-end gap-1.5">
                  <span className="text-gray-400">自分のカテゴリのみ</span>
                  <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-3 w-3 translate-x-3.5 rounded-full bg-white shadow" />
                  </div>
                  <span className="font-medium text-blue-600">すべて</span>
                </div>
                <p className="mb-1 font-semibold text-gray-700">直近のイベント</p>
                <div className="space-y-1">
                  <div className="rounded border border-gray-100 px-2 py-1 text-gray-700">
                    第10回練習 <span className="ml-1 rounded-full bg-blue-500 px-1 py-0.5 text-[9px] text-white">A組</span>
                  </div>
                  <div className="rounded border border-gray-100 px-2 py-1 text-gray-700">
                    春季合宿 <span className="ml-1 rounded-full bg-green-500 px-1 py-0.5 text-[9px] text-white">B組</span>
                  </div>
                  <div className="rounded border border-gray-100 px-2 py-1 text-gray-700">全体ミーティング</div>
                </div>
                <p className="mt-1.5 text-[10px] text-blue-600">全カテゴリのイベントを表示</p>
              </div>
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
