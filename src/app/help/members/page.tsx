import MockupFrame from "../_components/MockupFrame";

export default function HelpMembersPage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">メンバー管理</h1>
      <p className="mb-8 text-sm text-gray-500">アカウントとプレイヤープロファイルの関係を理解しましょう。</p>

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
          <li><b>コーチアカウント</b>は設定画面の「コーチ」タブからコーチ・選手プロファイルを追加できます。</li>
          <li><b>保護者アカウント</b>は設定画面の「保護者」タブから選手プロファイルを追加・管理します。</li>
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
            <p className="mt-1.5 text-[10px] text-blue-500">↑ 保護者タブからお子さんのプロファイルを追加できます</p>
          </div>
        </MockupFrame>
      </Section>

      <Section title="メンバー一覧">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>メンバーページではチーム全員のプロファイル（コーチ・選手）を確認できます。</li>
          <li>ダッシュボードのチームカードに、アカウント数・コーチ数・選手数のサマリーが表示されます。</li>
        </ul>
        <MockupFrame title="メンバー — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                { label: "アカウント", value: "8", color: "text-gray-800" },
                { label: "コーチ", value: "3", color: "text-blue-600" },
                { label: "選手", value: "20", color: "text-green-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-white p-2 text-center">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="mb-2">
              <p className="mb-1 font-semibold text-gray-700">コーチ</p>
              <div className="space-y-1">
                {["田中 太郎", "山田 コーチ"].map((name) => (
                  <div key={name} className="flex items-center gap-2 rounded border border-gray-100 px-2 py-1.5">
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">コーチ</span>
                    <span className="text-gray-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 font-semibold text-gray-700">選手</p>
              <div className="space-y-1">
                {[
                  { name: "田中 次郎", number: "#10" },
                  { name: "山田 花子", number: "#7" },
                  { name: "鈴木 一郎", number: "#3" },
                ].map(({ name, number }) => (
                  <div key={name} className="flex items-center gap-2 rounded border border-gray-100 px-2 py-1.5">
                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">選手</span>
                    <span className="text-gray-700">{name}</span>
                    <span className="text-gray-400">{number}</span>
                  </div>
                ))}
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
