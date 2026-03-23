"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-300">500</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          エラーが発生しました
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          申し訳ありません。予期せぬエラーが発生しました。
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            もう一度試す
          </button>
          <a
            href="/"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            トップに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
