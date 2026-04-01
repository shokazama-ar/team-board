import MockupFrame from "../_components/MockupFrame";

export default function HelpInvitePage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">メンバーの招待</h1>
      <p className="mb-8 text-sm text-gray-500">管理者がメールでメンバーを招待できます。</p>

      {/* ========== メール招待 ========== */}
      <Section title="メールで招待する（管理者）">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="mb-1 font-semibold">メールアドレスを指定して招待リンクを送れます</p>
          <p>管理者が設定画面からメールアドレスを入力すると、招待メールが自動送信されます。参加者はメール内のリンクをクリックするだけでチームに参加でき、サインアップ作業は不要です。</p>
        </div>
        <MockupFrame title="設定 › 管理者 — TeamBoard">
          <div className="text-xs space-y-3">
            <div>
              <p className="mb-1 font-medium text-gray-700">メンバーを招待</p>
              <p className="mb-2 text-[10px] text-gray-400">メンバーに招待メールを送ります</p>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-gray-400">
                  メールアドレス
                </div>
                <span className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white">送信</span>
              </div>
            </div>
          </div>
        </MockupFrame>

        <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-700">手順</h3>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
          <li>設定画面（管理者タブ）の「メンバーを招待」欄にメールアドレスを入力します。</li>
          <li>「送信」をクリックすると、招待メールが送信されます。</li>
          <li>参加者がメール内のリンクをクリックすると、チームに参加します（サインアップ不要）。</li>
          <li>参加直後にパスワード設定画面が表示されます。設定するか「あとで設定する」でスキップできます。</li>
        </ol>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="mb-1 font-semibold text-gray-700">すでにアカウントを持っている方への招待</p>
          <p>招待するメールアドレスがすでに登録済みの場合も、同じ操作で招待メールが届きます。リンクをクリックするとチームへの参加が完了します。</p>
        </div>
      </Section>

      {/* ========== コーチ権限付与 ========== */}
      <Section title="コーチ権限の付与">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>招待で参加したメンバーは最初「保護者」として参加します。</li>
          <li>コーチとして活動する場合は、管理者がメンバー画面から「+コーチ権限」ボタンで権限を付与します。</li>
          <li>コーチ権限の変更は管理者のみが行えます。</li>
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
