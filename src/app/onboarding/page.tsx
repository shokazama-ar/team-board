"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvite = searchParams.get("invite") ?? "";

  const [step, setStep] = useState<"confirm" | "input" | "done">(
    initialInvite ? "confirm" : "input"
  );
  const [inviteCode, setInviteCode] = useState(initialInvite);
  const [profileName, setProfileName] = useState("");
  const [kind, setKind] = useState<"coach" | "player">("player");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !profileName.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: joinError } = await supabase.rpc("join_team_with_profile", {
      code: inviteCode.trim(),
      profile_name: profileName.trim(),
      profile_kind: kind,
    });

    if (joinError) {
      if (joinError.message?.includes("Invalid invite code")) {
        setError("招待コードが無効です");
      } else if (joinError.message?.includes("unique")) {
        setError("このプロファイルはすでにこのチームに参加しています");
      } else {
        setError("チームへの参加に失敗しました");
      }
      setLoading(false);
      return;
    }

    router.push("/");
  };

  // --- confirm step: shown when invite code came from URL ---
  if (step === "confirm") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-center text-2xl font-bold">TeamBoard</h1>
          <p className="mb-8 text-center text-sm text-gray-500">チームへの参加</p>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm text-gray-700">
              以下の招待コードでチームに参加します。プロフィール情報を入力してください。
            </p>

            <div className="mb-4 rounded-md bg-blue-50 px-4 py-3 text-sm font-mono text-blue-800">
              {inviteCode}
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="profileName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  お名前（プロフィール表示名）
                </label>
                <input
                  id="profileName"
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="山田太郎"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  種別
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="kind"
                      value="player"
                      checked={kind === "player"}
                      onChange={() => setKind("player")}
                      className="accent-blue-600"
                    />
                    プレイヤー
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="kind"
                      value="coach"
                      checked={kind === "coach"}
                      onChange={() => setKind("coach")}
                      className="accent-blue-600"
                    />
                    コーチ
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "参加中..." : "チームに参加する"}
              </button>
            </form>

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setInviteCode("");
                  setStep("input");
                }}
                className="w-full text-center text-sm text-blue-600 hover:underline"
              >
                別のコードを使う
              </button>
              <button
                type="button"
                onClick={() => router.push("/teams/setup")}
                className="w-full text-center text-sm text-gray-500 hover:underline"
              >
                コードなしで続ける（チームを作成する）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- input step: no invite code yet, ask user ---
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">TeamBoard</h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          ようこそ！まずはチームに参加するか作成してください
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-6 text-sm font-medium text-gray-700">
            招待コードをお持ちですか？
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="inviteCode"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                招待コード
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="招待コードを入力"
              />
            </div>

            <div>
              <label
                htmlFor="profileNameInput"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                お名前（プロフィール表示名）
              </label>
              <input
                id="profileNameInput"
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                種別
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="kindInput"
                    value="player"
                    checked={kind === "player"}
                    onChange={() => setKind("player")}
                    className="accent-blue-600"
                  />
                  プレイヤー
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="kindInput"
                    value="coach"
                    checked={kind === "coach"}
                    onChange={() => setKind("coach")}
                    className="accent-blue-600"
                  />
                  コーチ
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "参加中..." : "招待コードでチームに参加する"}
            </button>
          </form>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => router.push("/teams/setup")}
              className="w-full text-center text-sm text-gray-500 hover:underline"
            >
              招待コードをお持ちでない方はこちら（チームを作成する）
            </button>
          </div>
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
