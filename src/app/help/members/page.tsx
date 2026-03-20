import MockupFrame from "../_components/MockupFrame";

export default function HelpMembersPage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">メンバー管理</h1>
      <p className="mb-8 text-sm text-gray-500">アカウントと選手プロファイルの関係を理解しましょう。</p>

      <Section title="アカウントとプロファイルの違い">
        <div className="space-y-3 text-sm text-gray-700">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="mb-1 font-semibold text-gray-800">アカウント</p>
            <p>ログインに使うメールアドレスと紐づく単位です。1つのメールアドレスにつき1アカウントです。</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="mb-1 font-semibold text-gray-800">プロファイル（コーチ / 選手）</p>
            <p>チーム内での役割を表します。1アカウントで複数のプロファイルを持てます。保護者が複数の子どもの選手プロファイルを管理するケースが典型例です。</p>
          </div>
        </div>
        <MockupFrame title="メンバー — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
              <p className="mb-2 font-medium text-blue-800">アカウント: tanaka@example.com</p>
              <div className="ml-3 space-y-1.5">
                <div className="flex items-center gap-2 rounded border border-blue-200 bg-white px-2 py-1">
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">コーチ</span>
                  <span className="text-gray-700">田中 太郎</span>
                </div>
                <div className="flex items-center gap-2 rounded border border-blue-200 bg-white px-2 py-1">
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">選手</span>
                  <span className="text-gray-700">田中 次郎 #10</span>
                </div>
                <div className="flex items-center gap-2 rounded border border-blue-200 bg-white px-2 py-1">
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">選手</span>
                  <span className="text-gray-700">田中 三郎 #15</span>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-blue-600">↑ 1アカウントで複数プロファイルを管理できます</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 font-medium text-gray-600">アカウント: yamada@example.com</p>
              <div className="ml-3">
                <div className="flex items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1">
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">選手</span>
                  <span className="text-gray-700">山田 花子 #7</span>
                </div>
              </div>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="プロファイルの追加">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li><b>コーチアカウント</b>は設定画面の「保護者」タブから選手プロファイルを追加・管理できます。</li>
          <li><b>保護者アカウント</b>も設定画面の「保護者」タブから選手プロファイルを追加・管理します。</li>
        </ul>
        <MockupFrame title="設定 — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 flex gap-2 border-b border-gray-200 pb-2">
              {["管理者", "コーチ", "保護者"].map((tab) => (
                <span
                  key={tab}
                  className={`px-3 py-1 ${tab === "保護者" ? "border-b-2 border-blue-600 font-medium text-blue-600" : "text-gray-500"}`}
                >
                  {tab}
                </span>
              ))}
            </div>
            <p className="mb-2 font-semibold text-gray-700">あなたのプロファイル</p>
            <div className="mb-3 space-y-1.5">
              {[
                { kind: "選手", name: "田中 次郎", number: "#10", style: "bg-green-100 text-green-700" },
                { kind: "選手", name: "田中 三郎", number: "#15", style: "bg-green-100 text-green-700" },
              ].map(({ kind, name, number, style }) => (
                <div key={name} className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${style}`}>{kind}</span>
                    <span className="text-gray-700">{name}</span>
                    <span className="text-gray-400">{number}</span>
                  </div>
                  <span className="text-gray-300">···</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-2 text-center">
              <span className="font-medium text-blue-600">+ 選手プロファイルを追加</span>
            </div>
            <p className="mt-1.5 text-[10px] text-blue-500">↑ コーチ・保護者どちらも「保護者」タブからプロファイルを追加できます</p>
          </div>
        </MockupFrame>
      </Section>

      <Section title="メンバー一覧">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>メンバーページではチーム全員のプロファイルを確認できます。<b>選手・コーチ・保護者</b>の3つのセクションに分かれています。</li>
          <li>選手セクションはカテゴリで絞り込めます。カテゴリが設定されている場合、一覧上部にフィルタボタンが表示されます。</li>
          <li>管理者は各メンバーの権限変更（管理者 ↔ メンバー）や削除ができます。</li>
        </ul>
        <MockupFrame title="メンバー — TeamBoard">
          <div className="text-xs">
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold text-gray-700">選手 <span className="font-normal text-gray-400">3名</span></p>
              </div>
              <div className="mb-2 flex gap-1.5">
                <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-500">すべて</span>
                <span className="rounded-full border-2 border-blue-400 bg-blue-50 px-2 py-0.5 font-medium text-blue-600">A組</span>
                <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-500">B組</span>
              </div>
              <div className="space-y-1">
                {[
                  { name: "田中 次郎", number: "#10" },
                  { name: "山田 花子", number: "#7" },
                ].map(({ name, number }) => (
                  <div key={name} className="flex items-center gap-2 rounded border border-gray-100 px-2 py-1.5">
                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">選手</span>
                    <span className="text-gray-700">{name}</span>
                    <span className="text-gray-400">{number}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-semibold text-gray-700">コーチ <span className="font-normal text-gray-400">2名</span></p>
              <div className="space-y-1">
                {["山田 コーチ", "鈴木 コーチ"].map((name) => (
                  <div key={name} className="flex items-center gap-2 rounded border border-gray-100 px-2 py-1.5">
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">コーチ</span>
                    <span className="text-gray-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 font-semibold text-gray-700">保護者 <span className="font-normal text-gray-400">1名</span></p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 rounded border border-gray-100 px-2 py-1.5">
                  <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700">保護者</span>
                  <span className="text-gray-700">田中 保護者さん</span>
                </div>
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
