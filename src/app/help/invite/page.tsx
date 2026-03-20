import MockupFrame from "../_components/MockupFrame";

export default function HelpInvitePage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">招待コード</h1>
      <p className="mb-8 text-sm text-gray-500">新しいメンバーをチームに招待する方法です。</p>

      <Section title="招待コードについて">
        <div className="space-y-3 text-sm text-gray-700">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="mb-1 font-semibold text-gray-800">保護者用招待コード（1種類のみ）</p>
            <p>チームへの参加はすべて保護者用招待コード1つで行います。参加後、管理者がコーチ権限を付与することができます。</p>
          </div>
        </div>
        <MockupFrame title="設定 › 管理者 — TeamBoard">
          <div className="text-xs">
            <div className="mb-3 flex gap-2 border-b border-gray-200 pb-2">
              {["管理者", "コーチ", "保護者"].map((tab) => (
                <span
                  key={tab}
                  className={`px-3 py-1 ${tab === "管理者" ? "border-b-2 border-blue-600 font-medium text-blue-600" : "text-gray-500"}`}
                >
                  {tab}
                </span>
              ))}
            </div>
            <p className="mb-2 font-semibold text-gray-700">招待コード</p>
            <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-3">
              <p className="mb-1 font-medium text-purple-800">保護者用</p>
              <code className="mb-2 block rounded border border-purple-300 bg-white px-2 py-1 font-mono text-purple-900 tracking-wider">PRNT-EFGH-5678</code>
              <div className="flex gap-2">
                <span className="rounded-lg border border-purple-300 px-3 py-1 text-xs text-purple-700">共有</span>
                <span className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600">再生成</span>
              </div>
              <p className="mt-1.5 text-[10px] text-purple-600">↑ チームに参加する人に共有します</p>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="招待の手順">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
          <li>設定画面（管理者タブ）で招待コードを確認します。</li>
          <li>コードを参加者に共有します（メッセージ・口頭など）。</li>
          <li>参加者はサインアップ後、「チームに参加」画面でコードを入力します。</li>
          <li>コーチとして活動する場合は、管理者がメンバー画面からコーチ権限を付与します。</li>
        </ol>
        <MockupFrame title="チームに参加 — TeamBoard">
          <div className="text-xs">
            {/* Steps */}
            <div className="mb-4 flex items-center gap-1">
              {[
                { n: "1", label: "設定で確認", active: false, done: true },
                { n: "2", label: "コードを共有", active: false, done: true },
                { n: "3", label: "参加者が入力", active: true, done: false },
              ].map(({ n, label, active, done }) => (
                <div key={n} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {done ? "✓" : n}
                    </span>
                    <span className={`mt-0.5 text-[9px] ${active ? "font-medium text-blue-600" : "text-gray-400"}`}>{label}</span>
                  </div>
                  {n !== "3" && <span className="mx-1 text-gray-300">→</span>}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-3 text-sm font-bold text-gray-900">チームに参加する</p>
              <div className="mb-3">
                <p className="mb-1 font-medium text-gray-700">招待コード</p>
                <div className="rounded border-2 border-blue-400 bg-white px-2 py-1.5 font-mono text-gray-600 tracking-wider">PRNT-EFGH-5678</div>
              </div>
              <span className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white">チームに参加する</span>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="招待コードの再生成">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>コードが漏洩した場合などは、設定画面から再生成できます。</li>
          <li>再生成すると<b>古いコードは即時無効</b>になります。</li>
        </ul>
        <MockupFrame title="設定 › 管理者 — TeamBoard">
          <div className="text-xs">
            <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-3">
              <p className="mb-2 font-medium text-orange-800">保護者用招待コード</p>
              <code className="mb-2 block rounded border border-orange-200 bg-white px-2 py-1 font-mono text-gray-700">PRNT-EFGH-5678</code>
              <div className="flex gap-2">
                <span className="rounded-lg border border-orange-300 px-3 py-1 text-xs text-orange-700">共有</span>
                <span className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600">再生成</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-orange-300 bg-white p-2">
                <span className="text-orange-500">⚠</span>
                <div>
                  <p className="font-medium text-orange-800">再生成する</p>
                  <p className="text-[10px] text-orange-600">古いコードは即時無効になります</p>
                </div>
                <span className="ml-auto rounded border border-orange-400 px-2 py-0.5 text-orange-700">再生成</span>
              </div>
            </div>
          </div>
        </MockupFrame>
      </Section>

      <Section title="コーチ権限の付与">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>参加者が保護者として参加した後、管理者がメンバー画面からコーチ権限を付与できます。</li>
          <li>コーチ権限の付与・剥奪は管理者のみが行えます。</li>
        </ul>
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
