"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinProfilePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("link_profile_by_share_code", {
      code: code.trim(),
    });

    if (rpcError) {
      if (rpcError.message.includes("Invalid share code")) {
        setError("共有コードが正しくありません");
      } else if (rpcError.message.includes("Already linked")) {
        setError("このプロファイルには既にリンクされています");
      } else if (rpcError.message.includes("already own")) {
        setError("このプロファイルはあなたが作成したものです");
      } else {
        setError("エラーが発生しました: " + rpcError.message);
      }
      setLoading(false);
      return;
    }

    setSuccess({ name: (data as { name: string }).name });
    setLoading(false);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-green-800">リンクしました</p>
          <p className="mb-6 text-sm text-green-700">
            「{success.name}」のプロファイルにリンクしました。
          </p>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            設定に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">プロファイルにリンク</h1>
      <p className="mb-8 text-sm text-gray-500">
        保護者・コーチ間でプレイヤーのプロファイルを共有できます。プロファイルの設定画面に表示された共有コードを入力してください。
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="shareCode" className="mb-1 block text-sm font-medium text-gray-700">
              共有コード
            </label>
            <input
              id="shareCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="共有コードを入力"
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "リンク中..." : "リンクする"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
