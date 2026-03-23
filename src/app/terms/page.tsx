import Link from "next/link";

export const metadata = {
  title: "利用規約 | TeamBoard",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <div className="mb-8">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← TeamBoard に戻る
            </Link>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">利用規約</h1>
          <p className="mb-8 text-sm text-gray-500">最終更新日: 2026年3月23日</p>
          <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">第1条（適用）</h2>
              <p>本規約は、TeamBoard（以下「本サービス」）を利用するすべてのユーザーに適用されます。本サービスを利用することにより、本規約に同意したものとみなします。</p>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">第2条（利用登録）</h2>
              <p>登録希望者は、本規約に同意のうえ所定の方法で利用登録を申請します。本サービスは、登録申請者が以下のいずれかに該当する場合、登録を拒否することがあります。</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>虚偽の情報を提供した場合</li>
                <li>過去に本規約に違反したことがある場合</li>
                <li>その他、本サービスが不適切と判断した場合</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">第3条（禁止事項）</h2>
              <p>ユーザーは、以下の行為を行ってはなりません。</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>他のユーザーまたは第三者への迷惑行為・誹謗中傷</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>不正アクセスその他のサービスへの不正操作</li>
                <li>本サービスを通じた営業活動・広告行為（無承認）</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">第4条（サービスの変更・停止）</h2>
              <p>本サービスは、事前の通知なく内容を変更・停止する場合があります。これによりユーザーに生じた損害について、本サービスは一切の責任を負いません。</p>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">第5条（免責事項）</h2>
              <p>本サービスは、ユーザーが本サービスを通じて取得した情報の正確性・完全性について保証しません。本サービスの利用に起因してユーザーに生じた損害について、本サービスは一切の責任を負いません。</p>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">第6条（個人情報）</h2>
              <p>個人情報の取り扱いについては、<Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>をご確認ください。</p>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">第7条（準拠法・管轄裁判所）</h2>
              <p>本規約の解釈は日本法に準拠します。本サービスに関して紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
