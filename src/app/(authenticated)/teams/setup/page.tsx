"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Kind = "coach" | "player";

export default function TeamSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  // Create team form
  const [teamName, setTeamName] = useState("");
  const [createProfileName, setCreateProfileName] = useState("");
  const [createKind, setCreateKind] = useState<Kind>("coach");
  const [creating, setCreating] = useState(false);

  // Join team form
  const [inviteCode, setInviteCode] = useState("");
  const [joinProfileName, setJoinProfileName] = useState("");
  const [joinKind, setJoinKind] = useState<Kind>("player");
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
        profile_kind: createKind,
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
    if (!inviteCode.trim() || !joinProfileName.trim()) return;
    setJoining(true);
    setError("");

    const { error: joinError } = await supabase.rpc("join_team_with_profile", {
      code: inviteCode.trim(),
      profile_name: joinProfileName.trim(),
      profile_kind: joinKind,
    });

    if (joinError) {
      if (joinError.message?.includes("Invalid invite code")) {
        setError("招待コードが無効です");
      } else if (joinError.message?.includes("unique")) {
        setError("このプロファイルはすでにこのチームに参加しています");
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
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                参加種別
              </label>
              <div className="flex gap-3">
                {(["coach", "player"] as Kind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCreateKind(k)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      createKind === k
                        ? k === "coach"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {k === "coach" ? "コーチ" : "プレイヤー"}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !teamName.trim() || !createProfileName.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "作成中..." : "チームを作成"}
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
            <div>
              <label htmlFor="joinProfileName" className="mb-1 block text-sm font-medium text-gray-700">
                参加者の名前（チーム内表示名）
              </label>
              <input
                id="joinProfileName"
                type="text"
                value={joinProfileName}
                onChange={(e) => setJoinProfileName(e.target.value)}
                placeholder="例: 田中"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                参加種別
              </label>
              <div className="flex gap-3">
                {(["coach", "player"] as Kind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setJoinKind(k)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      joinKind === k
                        ? k === "coach"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {k === "coach" ? "コーチ" : "プレイヤー"}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={joining || !inviteCode.trim() || !joinProfileName.trim()}
              className="w-full rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {joining ? "参加中..." : "チームに参加"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
