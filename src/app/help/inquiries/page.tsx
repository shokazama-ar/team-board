export default function HelpInquiriesPage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">問い合わせ管理</h1>
      <p className="mb-8 text-sm text-gray-500">外部からの体験・見学希望などの問い合わせを受け取り、管理者が返信・対応状況を管理する機能です。</p>

      <Section title="問い合わせを受け取る">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>チームの公開フォーム（<code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">/contact/[チームID]</code>）から送信された問い合わせが管理者に届きます。</li>
          <li>問い合わせが届くとメールでも通知されます。</li>
        </ul>
      </Section>

      <Section title="問い合わせ一覧">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>ナビの「問い合わせ」から一覧を確認できます。</li>
          <li>ステータスは「未読」「対応中」「返信済み」で管理されます。</li>
        </ul>
      </Section>

      <Section title="返信する">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>問い合わせ詳細から直接メールで返信できます。</li>
          <li>返信メールは問い合わせ者のメールアドレス宛に送信されます。</li>
        </ul>
      </Section>

      <Section title="返信履歴">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>管理者からの返信（送信済み）と問い合わせ元からの返信メールの両方がスレッド形式で表示されます。</li>
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
