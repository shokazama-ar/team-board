"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function OnboardingContent() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">TeamBoard</h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          ようこそ！まずはチームに参加するか作成してください
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
            <p className="mb-1 font-semibold">チームへの参加はメール招待で</p>
            <p>チームの管理者から招待メールが届いている場合は、メール内のリンクをクリックしてチームに参加してください。</p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/teams/setup")}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            チームを作成する
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link href="/" className="hover:underline">
            スキップしてホームへ
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
