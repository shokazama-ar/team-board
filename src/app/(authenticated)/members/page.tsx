"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, Shield, Trash2 } from "lucide-react";

type Member = {
  id: string;
  user_id: string;
  role: "admin" | "member";
  created_at: string;
  profile: {
    name: string | null;
    email: string;
  };
};

type Team = {
  id: string;
  name: string;
  invite_code: string;
};

export default function MembersPage() {
  const supabase = createClient();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get user's team membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!membership) return;
    setCurrentUserRole(membership.role);

    // Get team info
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, invite_code")
      .eq("id", membership.team_id)
      .single();

    if (teamData) setTeam(teamData);

    // Get all members with profiles
    const { data: membersData } = await supabase
      .from("team_members")
      .select("id, user_id, role, created_at")
      .eq("team_id", membership.team_id)
      .order("created_at", { ascending: true });

    if (membersData) {
      // Fetch profiles for each member
      const userIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      const enriched: Member[] = membersData.map((m) => ({
        ...m,
        role: m.role as "admin" | "member",
        profile: profileMap.get(m.user_id) ?? {
          name: null,
          email: "不明",
        },
      }));

      setMembers(enriched);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyInviteCode = async () => {
    if (!team) return;
    await navigator.clipboard.writeText(team.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleRole = async (memberId: string, currentRole: string) => {
    setActionLoading(memberId);
    const newRole = currentRole === "admin" ? "member" : "admin";

    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (!error) {
      await loadData();
    }
    setActionLoading(null);
  };

  const removeMember = async (memberId: string, memberName: string) => {
    const confirmed = window.confirm(
      `${memberName || "このメンバー"}をチームから削除しますか？`
    );
    if (!confirmed) return;

    setActionLoading(memberId);

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (!error) {
      await loadData();
    }
    setActionLoading(null);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  if (!team) {
    return <div className="text-sm text-gray-500">チームが見つかりません</div>;
  }

  const isAdmin = currentUserRole === "admin";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">メンバー</h1>

      {/* Team Info & Invite Code */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">チーム名</p>
            <p className="text-lg font-semibold">{team.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">招待コード</p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono">
                {team.invite_code}
              </code>
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                {copied ? <Check size={14} strokeWidth={1.5} aria-hidden="true" /> : <Copy size={14} strokeWidth={1.5} aria-hidden="true" />}
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-3">
          <p className="text-sm font-medium text-gray-700">
            メンバー一覧（{members.length}人）
          </p>
        </div>
        <ul className="divide-y divide-gray-100">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {member.profile.name || "名前未設定"}
                  {member.user_id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-400">
                      (あなた)
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {member.profile.email}
                </p>
                <p className="text-xs text-gray-400">
                  参加日:{" "}
                  {new Date(member.created_at).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.role === "admin"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {member.role === "admin" && <Shield size={12} strokeWidth={1.5} aria-hidden="true" />}
                  {member.role === "admin" ? "管理者" : "メンバー"}
                </span>

                {isAdmin && member.user_id !== currentUserId && (
                  <>
                    <button
                      onClick={() => toggleRole(member.id, member.role)}
                      disabled={actionLoading === member.id}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {member.role === "admin"
                        ? "メンバーに変更"
                        : "管理者に変更"}
                    </button>
                    <button
                      onClick={() =>
                        removeMember(
                          member.id,
                          member.profile.name ?? ""
                        )
                      }
                      disabled={actionLoading === member.id}
                      className="flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={12} strokeWidth={1.5} aria-hidden="true" />
                      削除
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
