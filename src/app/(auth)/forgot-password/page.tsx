"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError("メールの送信に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-2 text-2xl font-bold">TeamBoard</h1>
          <div className="mt-8 rounded-lg bg-green-50 p-6">
            <p className="text-lg font-medium text-green-800">リセットメールを送信しました</p>
            <p className="mt-2 text-sm text-green-700">
              <strong>{email}</strong> にパスワードリセット用のメールを送りました。<br />
              メール内のリンクをクリックして新しいパスワードを設定してください。
            </p>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 hover:underline">
              ログインページに戻る
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">TeamBoard</h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          パスワードをリセット
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "送信中..." : "リセットメールを送信"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            ログインページに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
