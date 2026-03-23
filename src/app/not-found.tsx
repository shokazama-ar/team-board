import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-blue-600">404</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          ページが見つかりません
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          お探しのページは削除されたか、URLが変更された可能性があります。
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
