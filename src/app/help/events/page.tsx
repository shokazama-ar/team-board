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
              <p className="mt-1.5 text-[10px] text-blue-500">↑ 予定の内容を分類します（ダッシュボードで色分け表示）</p>
            </div>
            <div className="mb-3 rounded-lg p-2 ring-2 ring-green-400 ring-offset-1">
              <p className="mb-2 font-medium text-gray-700">対象カテゴリ</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border-2 border-blue-500 bg-blue-50 px-2 py-0.5 font-medium text-blue-600">A組</span>
                <span className="rounded-full border-2 border-gray-200 bg-white px-2 py-0.5 text-gray-500">B組</span>
                <span className="rounded-full border-2 border-gray-200 bg-white px-2 py-0.5 text-gray-500">全体</span>
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

      <Section title="カテゴリフィルタ">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>予定一覧の右上にある「自分のカテゴリのみ ◯—◯ すべて」トグルで表示を絞り込めます。</li>
          <li>自分のプレイヤープロファイルが所属するカテゴリの予定のみ表示します。</li>
          <li>カテゴリが未設定の場合はトグルが表示されず、すべての予定が表示されます。</li>
        </ul>
        <MockupFrame title="予定 — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">予定</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">自分のカテゴリのみ</span>
                <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-gray-300">
                  <span className="inline-block h-3 w-3 translate-x-0.5 rounded-full bg-white shadow" />
                </div>
                <span className="text-gray-400">すべて</span>
              </div>
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
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                      style={{ backgroundColor: color }}
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
          <li>予定の詳細ページでプレイヤーごとに「参加 / 欠席 / 未定」を選択します。</li>
          <li>保護者アカウントは、自分が管理する複数の選手分まとめて回答できます。</li>
          <li>回答状況は一覧で確認できます。</li>
        </ul>
        <MockupFrame title="第10回練習 — TeamBoard">
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="font-semibold text-gray-900">第10回練習</p>
              <p className="mt-0.5 text-gray-500">3月15日（金） 10:00 〜 12:00 ・ 市民体育館</p>
            </div>
            <div className="rounded-lg border-2 border-blue-300 bg-white p-3">
              <p className="mb-2 font-medium text-gray-700">あなたの出欠回答</p>
              <div className="space-y-2">
                {[
                  { name: "田中 太郎（コーチ）" },
                  { name: "田中 次郎（選手 #10）" },
                ].map(({ name }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-gray-700">{name}</span>
                    <div className="flex gap-1">
                      <span className="rounded-lg border-2 border-green-500 bg-green-50 px-2 py-0.5 font-medium text-green-700">参加</span>
                      <span className="rounded-lg border border-gray-200 px-2 py-0.5 text-gray-400">欠席</span>
                      <span className="rounded-lg border border-gray-200 px-2 py-0.5 text-gray-400">未定</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-blue-500">↑ プロファイルごとに個別に回答できます</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="mb-2 font-medium text-gray-700">出欠一覧</p>
              <div className="space-y-1">
                {[
                  { name: "山田 花子", status: "参加", style: "bg-green-100 text-green-700" },
                  { name: "鈴木 一郎", status: "欠席", style: "bg-red-100 text-red-700" },
                  { name: "佐藤 次郎", status: "未定", style: "bg-yellow-100 text-yellow-700" },
                ].map(({ name, status, style }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-gray-700">{name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style}`}>{status}</span>
                  </div>
                ))}
              </div>
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
                  { title: "第10回練習", cat: "A組", date: "3月15日（金）" },
                  { title: "春季合宿", cat: "B組", date: "3月20日（水）" },
                ].map(({ title, cat, date }) => (
                  <li key={title} className="flex items-center gap-1.5 text-yellow-800">
                    <span className="font-medium">{title}</span>
                    <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] text-white">{cat}</span>
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
          <li>「予定」一覧右上の「一括登録」ボタンから複数の予定をまとめて作成できます。</li>
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
