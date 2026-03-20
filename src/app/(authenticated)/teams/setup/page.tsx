"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function TeamSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  // Create team form
  const [teamName, setTeamName] = useState("");
  const [createProfileName, setCreateProfileName] = useState("");
  const [creating, setCreating] = useState(false);

  // Join team form
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !createProfileName.trim()) return;
    setCreating(true);
    setError("");

    const { error: createError } = await supabase.rpc(
      "create_team_with_member",
      {
        team_name: teamName.trim(),
        profile_name: createProfileName.trim(),
        profile_kind: "coach",
        team_account_type: "coach",
      }
    );

    if (createError) {
      setError("チームの作成に失敗しました");
      setCreating(false);
      return;
    }

    router.push("/");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    setError("");

    const { error: joinError } = await supabase.rpc("join_team_with_profile", {
      code: inviteCode.trim(),
    });

    if (joinError) {
      if (joinError.message?.includes("Invalid invite code")) {
        setError("招待コードが無効です");
      } else {
        setError("チームへの参加に失敗しました");
      }
      setJoining(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">チームセットアップ</h1>
      <p className="mb-8 text-sm text-gray-500">
        チームを作成するか、招待コードで既存のチームに参加してください。
      </p>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Create Team */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">チームを作成</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="teamName" className="mb-1 block text-sm font-medium text-gray-700">
                チーム名
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="例: サッカー部A"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="createProfileName" className="mb-1 block text-sm font-medium text-gray-700">
                あなたの名前（チーム内表示名）
              </label>
              <input
                id="createProfileName"
                type="text"
                value={createProfileName}
                onChange={(e) => setCreateProfileName(e.target.value)}
                placeholder="例: 田中コーチ"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !teamName.trim() || !createProfileName.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:opacity-60"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-1">
                  <Loader2 size={14} className="animate-spin" />
                  作成中…
                </span>
              ) : "チームを作成"}
            </button>
          </form>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-4 text-sm text-gray-500">または</span>
          </div>
        </div>

        {/* Join Team */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">チームに参加</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="mb-1 block text-sm font-medium text-gray-700">
                招待コード
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="例: a1b2c3d4"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={joining || !inviteCode.trim()}
              className="w-full rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:opacity-60"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-1">
                  <Loader2 size={14} className="animate-spin" />
                  参加中…
                </span>
              ) : "参加"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
