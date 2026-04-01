import MockupFrame from "../_components/MockupFrame";

export default function HelpEventsPage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">予定と出欠管理</h1>
      <p className="mb-8 text-sm text-gray-500">チームの練習・試合などの予定を作成し、出欠を管理します。</p>

      <Section title="予定の作成">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>管理者・コーチどちらも予定を作成できます。</li>
          <li><b>イベント種別</b>（練習・試合など）と<b>対象カテゴリ</b>（A組・B組など）を設定できます。</li>
          <li>開始日時・終了日時・場所・メモを入力して保存します。</li>
        </ul>
        <MockupFrame title="予定を作成 — TeamBoard">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs">
            <div className="mb-3">
              <p className="mb-1 font-medium text-gray-700">タイトル <span className="text-red-500">*</span></p>
              <div className="rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-400">例: 第10回練習</div>
            </div>
            <div className="mb-3 rounded-lg p-2 ring-2 ring-blue-400 ring-offset-1">
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
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />
                  <span className="text-gray-500">その他</span>
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-blue-500">↑ 予定の内容を分類します（一覧で色分け表示）</p>
            </div>
            <div className="mb-3 rounded-lg p-2 ring-2 ring-green-400 ring-offset-1">
              <p className="mb-2 font-medium text-gray-700">対象カテゴリ</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded border-2 border-blue-500 bg-blue-50 px-2 py-0.5 font-medium text-blue-600">A組</span>
                <span className="rounded border-2 border-gray-200 bg-white px-2 py-0.5 text-gray-500">B組</span>
                <span className="rounded border-2 border-gray-200 bg-white px-2 py-0.5 text-gray-500">全体</span>
              </div>
              <p className="mt-1.5 text-[10px] text-green-600">↑ 対象者を絞り込みます（複数選択可、未選択なら全員対象）</p>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-medium text-gray-700">開始日時 <span className="text-red-500">*</span></p>
              <div className="rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-600">2024/03/15  10:00</div>
            </div>
            <div className="mb-4">
              <p className="mb-1 font-medium text-gray-700">場所</p>
              <div className="rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-400">例: 市民体育館</div>
            </div>
            <div className="flex gap-2">
              <span className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white">作成する</span>
              <span className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-600">キャンセル</span>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="一覧の表示切り替えとフィルタ">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>予定一覧は<b>リスト表示</b>と<b>カレンダー表示</b>を切り替えられます。左上のアイコンで切り替えます。</li>
          <li>種別フィルタバーの種別ボタンをクリックすると、その種別のみに絞り込めます。もう一度クリックで解除します。複数同時選択も可能です。</li>
          <li>管理者はCSVで予定を<b>エクスポート</b>できます。また<b>インポート</b>（一括取り込み）・<b>一括追加</b>も右上のボタンから行えます。</li>
        </ul>
        <MockupFrame title="予定 — TeamBoard">
          <div className="text-xs">
            {/* 上部ツールバー */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5 rounded-lg bg-gray-100 p-1">
                  <span className="flex items-center rounded-md bg-white px-2 py-1 text-gray-900 shadow-sm">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                  </span>
                  <span className="flex items-center rounded-md px-2 py-1 text-gray-500">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-600">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                </span>
                <span className="flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-600">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                </span>
                <span className="flex items-center rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-gray-700">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                </span>
              </div>
            </div>
            {/* 種別フィルタバー */}
            <div className="mb-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="shrink-0 text-[10px] text-gray-400">種別</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: "#dc2626", backgroundColor: "#dc262620" }}>試合</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: "#2563eb", backgroundColor: "#2563eb20" }}>練習</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium opacity-30" style={{ color: "#16a34a", backgroundColor: "#16a34a20" }}>合宿</span>
              </div>
            </div>
            <p className="text-[10px] text-blue-500">↑ 薄く表示の「合宿」は非アクティブ。種別をクリックして絞り込み（複数選択可）</p>
          </div>
        </MockupFrame>
      </Section>

      <Section title="カテゴリフィルタ">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>予定一覧の「関連カテゴリのみ」トグルで表示を絞り込めます。</li>
          <li>自分の選手プロファイルが所属するカテゴリの予定のみ表示します。</li>
          <li>カテゴリが未設定の場合はトグルが表示されず、すべての予定が表示されます。</li>
          <li>管理者は右端の「＋」ボタンから新規予定を作成できます。</li>
        </ul>
        <MockupFrame title="予定 — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-gray-500">関連カテゴリのみ</span>
              <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-gray-300">
                <span className="inline-block h-3 w-3 translate-x-0.5 rounded-full bg-white shadow" />
              </div>
              <span className="text-gray-400">すべて</span>
              <span className="ml-auto flex items-center rounded-lg bg-blue-600 p-1.5 text-white">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </span>
            </div>
            <div className="space-y-2">
              {[
                { title: "第10回練習", cat: "A組", color: "#2563eb" },
                { title: "春季合宿", cat: "A組", color: "#2563eb" },
              ].map(({ title, cat, color }) => (
                <div key={title} className="rounded-lg border border-gray-200 bg-white p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{title}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                      style={{ borderWidth: 1, borderColor: color, color: color }}
                    >
                      {cat}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-blue-500">↑ 自分のA組カテゴリの予定のみ表示中</p>
          </div>
        </MockupFrame>
      </Section>

      <Section title="出欠回答">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>予定の詳細ページで選手ごとに「出席 / 欠席 / 未定」を選択します。</li>
          <li>保護者アカウントは、自分が管理する複数の選手分まとめて回答できます。</li>
          <li>回答状況の集計（出席・欠席・未定・未回答の人数）が一目で確認できます。</li>
          <li>コーチは「選手」「コーチ」タブを切り替えて出欠一覧を確認できます。</li>
        </ul>
        <MockupFrame title="第10回練習 — TeamBoard">
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="font-semibold text-gray-900">第10回練習</p>
              <p className="mt-0.5 text-gray-500">3月15日（金） 10:00 〜 12:00 ・ 市民体育館</p>
            </div>
            {/* 出欠回答セクション */}
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="mb-3 font-medium text-gray-700">あなたの回答</p>
              <div className="space-y-2">
                {[
                  { name: "田中 太郎", kind: "コーチ", kindStyle: "bg-blue-50 text-blue-700", status: "present" },
                  { name: "田中 次郎", kind: "選手", kindStyle: "bg-green-50 text-green-700", status: "absent" },
                ].map(({ name, kind, kindStyle, status }) => (
                  <div key={name} className="rounded-lg bg-gray-50 p-2">
                    <p className="mb-1.5 flex items-center gap-1.5 text-gray-600">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${kindStyle}`}>{kind}</span>
                      {name}
                    </p>
                    <div className="flex gap-1.5">
                      <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-medium ${status === "present" ? "border-green-500 bg-green-500 text-white" : "border-gray-300 text-gray-700"}`}>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        出席
                      </span>
                      <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-medium ${status === "absent" ? "border-red-500 bg-red-500 text-white" : "border-gray-300 text-gray-700"}`}>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        欠席
                      </span>
                      <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-medium ${status === "undecided" ? "border-yellow-500 bg-yellow-500 text-white" : "border-gray-300 text-gray-700"}`}>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01" /></svg>
                        未定
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-blue-500">↑ プロファイルごとに個別に回答できます</p>
            </div>
            {/* 集計サマリー */}
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-3 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[10px] font-medium text-green-700">選手</span>
                  <span className="text-green-700">出席 5</span>
                  <span className="text-red-700">欠席 2</span>
                  <span className="text-yellow-700">未定 1</span>
                  <span className="text-gray-400">未回答 3</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[10px] font-medium text-blue-700">コーチ</span>
                  <span className="text-green-700">出席 2</span>
                  <span className="text-red-700">欠席 0</span>
                  <span className="text-yellow-700">未定 0</span>
                  <span className="text-gray-400">未回答 1</span>
                </div>
              </div>
              {/* タブ */}
              <div className="mb-2 flex gap-0.5 rounded-lg bg-gray-100 p-1">
                <span className="flex-1 rounded-md bg-white py-1 text-center text-[10px] font-medium text-gray-900 shadow-sm">選手</span>
                <span className="flex-1 rounded-md py-1 text-center text-[10px] font-medium text-gray-500">コーチ</span>
              </div>
              {/* 出欠一覧（回答済みのみ） */}
              <div className="divide-y divide-gray-100">
                {[
                  { name: "山田 花子", number: "#7", status: "出席", style: "bg-green-100 text-green-700" },
                  { name: "鈴木 一郎", number: "#10", status: "欠席", style: "bg-red-100 text-red-700" },
                  { name: "佐藤 次郎", number: "#15", status: "未定", style: "bg-yellow-100 text-yellow-700" },
                ].map(({ name, number, status, style }) => (
                  <div key={name} className="flex items-center justify-between py-1.5">
                    <span className="text-gray-900">
                      {name}
                      <span className="ml-1 text-[10px] text-gray-400">{number}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style}`}>{status}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-blue-500">↑ 回答済みのメンバーのみ表示されます（未回答は非表示）</p>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="未回答の通知">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>出欠を未回答のまま当日を迎えそうな予定は、ダッシュボードの上部に警告表示されます。</li>
          <li>ダッシュボードの「直近のイベント」には、今後の予定が最大5件表示されます。</li>
        </ul>
        <MockupFrame title="ダッシュボード — TeamBoard">
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-yellow-900">
                <span>⚠</span> 未回答のイベントがあります
              </p>
              <ul className="space-y-1">
                {[
                  { title: "第10回練習", cat: "A組", date: "3月15日（金）", color: "#2563eb" },
                  { title: "春季合宿", cat: "B組", date: "3月20日（水）", color: "#16a34a" },
                ].map(({ title, cat, date, color }) => (
                  <li key={title} className="flex items-center gap-1.5 text-yellow-800">
                    <span className="font-medium">{title}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                      style={{ borderWidth: 1, borderColor: color, color: color, backgroundColor: color + "15" }}
                    >
                      {cat}
                    </span>
                    <span>{date}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-yellow-600">↑ タップすると出欠回答ページへ移動します</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="mb-2 font-semibold text-gray-800">直近のイベント <span className="font-normal text-gray-400">3件</span></p>
                <div className="space-y-1.5">
                  {["第10回練習", "春季合宿", "試合 vs 北高"].map((t) => (
                    <div key={t} className="rounded border border-gray-100 px-2 py-1 text-gray-700">{t}</div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-gray-400">↑ 今後の予定 最大5件</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="mb-2 font-semibold text-gray-800">最新のお知らせ</p>
                <div className="space-y-1.5">
                  {["3月の練習スケジュール", "保護者会のご案内"].map((t) => (
                    <div key={t} className="rounded border border-gray-100 px-2 py-1 text-gray-700">{t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="一括登録">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>予定一覧右上の「一括追加」ボタン（リストアイコン）から複数の予定をまとめて作成できます。</li>
          <li>各予定のタイトル・日時・種別・カテゴリをコンパクトなカード形式で入力します。</li>
          <li>種別はセレクトボックス、カテゴリはドロップダウンで選択します。</li>
          <li>「複製」ボタンで同じ内容のカードをすばやく追加できます。</li>
        </ul>
        <MockupFrame title="一括登録 — TeamBoard">
          <div className="space-y-2 text-xs">
            {[
              { title: "第11回練習", date: "2024/04/01  10:00", type: "練習", cat: "A組" },
              { title: "第12回練習", date: "2024/04/08  10:00", type: "練習", cat: "A組" },
            ].map(({ title, date, type, cat }, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-2.5">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="flex-1 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-gray-700">{title}</span>
                  <span className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-gray-600">{type} ▾</span>
                  <span className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-gray-400">複製</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex-1 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-gray-600">{date}</span>
                  <span className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-blue-600">{cat} ▾</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <span className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-gray-400">+ 追加</span>
              <span className="ml-auto rounded-lg bg-blue-600 px-4 py-1.5 font-medium text-white">一括保存</span>
            </div>
            <p className="text-[10px] text-blue-500">↑ 種別・カテゴリはセレクトボックスで素早く選択できます</p>
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
