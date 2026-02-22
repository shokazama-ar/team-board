"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Team state
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamMessage, setTeamMessage] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setName(profile.name ?? "");
      }

      // Load team membership
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membership) {
        setIsAdmin(membership.role === "admin");
        setTeamId(membership.team_id);

        const { data: team } = await supabase
          .from("teams")
          .select("name, invite_code")
          .eq("id", membership.team_id)
          .single();

        if (team) {
          setTeamName(team.name);
          setInviteCode(team.invite_code);
        }
      }

      setLoading(false);
    };
    loadData();
  }, [supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);

    if (error) {
      setMessage("保存に失敗しました");
    } else {
      setMessage("保存しました");
    }
    setSaving(false);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !teamName.trim()) return;
    setSavingTeam(true);
    setTeamMessage("");

    const { error } = await supabase
      .from("teams")
      .update({ name: teamName.trim() })
      .eq("id", teamId);

    if (error) {
      setTeamMessage("保存に失敗しました");
    } else {
      setTeamMessage("保存しました");
    }
    setSavingTeam(false);
  };

  const handleRegenerateCode = async () => {
    if (!teamId) return;
    const confirmed = window.confirm(
      "招待コードを再生成すると、以前のコードは無効になります。よろしいですか？"
    );
    if (!confirmed) return;

    setRegenerating(true);
    setTeamMessage("");

    const { data: newCode, error } = await supabase.rpc(
      "regenerate_invite_code",
      { target_team_id: teamId }
    );

    if (error) {
      setTeamMessage("再生成に失敗しました");
    } else {
      setInviteCode(newCode);
      setTeamMessage("招待コードを再生成しました");
    }
    setRegenerating(false);
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;
    const confirmed = window.confirm(
      "チームを削除すると、すべてのメンバー・イベント・お知らせも削除されます。本当に削除しますか？"
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "この操作は取り消せません。本当に削除しますか？"
    );
    if (!doubleConfirm) return;

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      setTeamMessage("削除に失敗しました");
    } else {
      router.push("/teams/setup");
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">設定</h1>

      {/* Profile Settings */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            名前
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.includes("失敗")
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </form>

      {/* Team Settings (admin only) */}
      {isAdmin && teamId && (
        <>
          <hr className="my-8 border-gray-200" />
          <h2 className="mb-4 text-lg font-semibold">チーム設定</h2>

          <form onSubmit={handleSaveTeam} className="space-y-4">
            <div>
              <label
                htmlFor="teamName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                チーム名
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                招待コード
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono">
                  {inviteCode}
                </code>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  {regenerating ? "再生成中..." : "再生成"}
                </button>
              </div>
            </div>

            {teamMessage && (
              <div
                className={`rounded-md p-3 text-sm ${
                  teamMessage.includes("失敗")
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {teamMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={savingTeam || !teamName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingTeam ? "保存中..." : "チーム名を保存"}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-red-700">
              危険な操作
            </h3>
            <p className="mb-3 text-xs text-red-600">
              チームを削除すると、すべてのデータが失われます。
            </p>
            <button
              onClick={handleDeleteTeam}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              チームを削除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
