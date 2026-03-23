import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー | TeamBoard",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <div className="mb-8">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← TeamBoard に戻る
            </Link>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">プライバシーポリシー</h1>
          <p className="mb-8 text-sm text-gray-500">最終更新日: 2026年3月23日</p>
          <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">1. 取得する情報</h2>
              <p>本サービスは、以下の情報を取得・保存します。</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>メールアドレス（アカウント登録時）</li>
                <li>プロフィール情報（氏名・アバター画像など、任意入力）</li>
                <li>チーム・メンバー管理に必要なデータ（予定・出欠・お知らせ等）</li>
                <li>お問い合わせ時に入力された情報</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">2. 利用目的</h2>
              <p>取得した情報は、以下の目的に限り利用します。</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>本サービスの提供・運営</li>
                <li>ユーザーサポートへの対応</li>
                <li>サービスの改善・新機能の開発</li>
                <li>利用規約違反等の調査</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">3. 第三者提供</h2>
              <p>本サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。</p>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">4. 委託先・利用サービス</h2>
              <p>本サービスは以下の外部サービスを利用しており、各社のプライバシーポリシーに従ってデータが処理される場合があります。</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Supabase（認証・データベース）</li>
                <li>Vercel（ホスティング）</li>
                <li>Resend（メール送信）</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">5. Cookie の利用</h2>
              <p>本サービスは、認証状態の維持のために Cookie を使用します。ブラウザの設定で Cookie を無効にすると、本サービスが正常に動作しない場合があります。</p>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">6. 情報の管理・削除</h2>
              <p>ユーザーは、アカウントの削除により本サービス上の個人情報を削除できます。削除申請はお問い合わせフォームからご連絡ください。</p>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">7. 改定</h2>
              <p>本ポリシーは予告なく改定する場合があります。重要な変更がある場合は、本ページにて通知します。</p>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold text-gray-900">8. お問い合わせ</h2>
              <p>本ポリシーに関するお問い合わせは、<Link href="/contact" className="text-blue-600 hover:underline">お問い合わせフォーム</Link>よりご連絡ください。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
