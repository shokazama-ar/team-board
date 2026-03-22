"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";

type MemberProfile = {
  id: string;
  member_profile_id: string;
  role: "admin" | "member";
  created_at: string;
  account_type: "coach" | "guardian";
  kind: "coach" | "player";
  name: string | null;
  avatar_url: string | null;
  number: string | null;
  owner_user_id: string;
};

type Team = {
  id: string;
  name: string;
  icon_url: string | null;
};

type Category = {
  id: string;
  name: string;
  color: string;
};

function ProfileAvatar({ name, avatarUrl, size = 40 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  const initials = name ? name.charAt(0).toUpperCase() : "?";
  if (avatarUrl) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        <Image
          src={`${avatarUrl}?t=cached`}
          alt={name ?? ""}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
      }}
    >
      {initials}
    </div>
  );
}

export default function MembersPage() {
  const supabase = createClient();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<MemberProfile[]>([]);
  const [coaches, setCoaches] = useState<MemberProfile[]>([]);
  const [guardians, setGuardians] = useState<MemberProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [playerCategoryMap, setPlayerCategoryMap] = useState<Map<string, Category[]>>(new Map());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: teamId } = await supabase.rpc("get_my_team_id");
    if (!teamId) return;

    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, icon_url")
      .eq("id", teamId)
      .single();

    if (teamData) setTeam(teamData);

    // Get current user's role (use their first membership in this team)
    const { data: myMemberships } = await supabase
      .from("team_members")
      .select("role, member_profile_id, member_profiles!inner(user_id)")
      .eq("team_id", teamId)
      .eq("member_profiles.user_id", user.id)
      .limit(1);

    if (myMemberships && myMemberships.length > 0) {
      setCurrentUserRole(myMemberships[0].role);
    }

    // Load all team members with their profiles
    const { data: membersData } = await supabase
      .from("team_members")
      .select("id, member_profile_id, role, created_at, account_type, member_profiles(id, user_id, kind, name, avatar_url, number)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });

    if (membersData) {
      const enriched: MemberProfile[] = membersData.map((m) => {
        const mp = m.member_profiles as unknown as {
          id: string;
          user_id: string;
          kind: "coach" | "player";
          name: string | null;
          avatar_url: string | null;
          number: string | null;
        } | null;
        return {
          id: m.id,
          member_profile_id: m.member_profile_id,
          role: m.role as "admin" | "member",
          created_at: m.created_at,
          account_type: (m.account_type ?? "coach") as "coach" | "guardian",
          kind: mp?.kind ?? "player",
          name: mp?.name ?? null,
          avatar_url: mp?.avatar_url ?? null,
          number: mp?.number ?? null,
          owner_user_id: mp?.user_id ?? "",
        };
      });

      // コーチ: account_type="coach" かつ kind="coach"（コーチが登録した選手を除外）
      // 保護者: account_type="guardian"（選手セクションと重複させない）
      setCoaches(enriched.filter((m) => m.account_type === "coach" && m.kind === "coach"));
      setGuardians(enriched.filter((m) => m.account_type === "guardian" && m.kind !== "player"));
      const playerList = enriched.filter((m) => m.kind === "player");
      setPlayers(playerList);

      // Fetch category info for players
      const playerProfileIds = playerList.map((p) => p.member_profile_id);
      if (playerProfileIds.length > 0) {
        const { data: profileCategories } = await supabase
          .from("member_profile_categories")
          .select("member_profile_id, event_types(id, name, color)")
          .in("member_profile_id", playerProfileIds);

        if (profileCategories) {
          const catMap = new Map<string, Category[]>();
          const catIndex = new Map<string, Category>();

          for (const row of profileCategories) {
            const et = row.event_types as unknown as { id: string; name: string; color: string } | null;
            if (!et) continue;
            const profileId = row.member_profile_id;
            if (!catMap.has(profileId)) catMap.set(profileId, []);
            catMap.get(profileId)!.push({ id: et.id, name: et.name, color: et.color });
            if (!catIndex.has(et.id)) {
              catIndex.set(et.id, { id: et.id, name: et.name, color: et.color });
            }
          }

          setPlayerCategoryMap(catMap);
          setAvailableCategories(Array.from(catIndex.values()));
        }
      } else {
        setPlayerCategoryMap(new Map());
        setAvailableCategories([]);
      }
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleRole = async (memberId: string, currentRole: string) => {
    setActionLoading(memberId);
    const newRole = currentRole === "admin" ? "member" : "admin";
    await supabase.from("team_members").update({ role: newRole }).eq("id", memberId);
    await loadData();
    setActionLoading(null);
  };

  const removeMember = async (memberId: string, memberName: string) => {
    const confirmed = window.confirm(`${memberName || "このメンバー"}をチームから削除しますか？`);
    if (!confirmed) return;
    setActionLoading(memberId);
    await supabase.from("team_members").delete().eq("id", memberId);
    await loadData();
    setActionLoading(null);
  };

  const grantCoach = async (ownerUserId: string) => {
    setActionLoading(ownerUserId);
    const { error } = await supabase.rpc("grant_coach_role", {
      target_user_id: ownerUserId,
    });
    if (!error) await loadData();
    setActionLoading(null);
  };

  const revokeCoach = async (ownerUserId: string) => {
    if (!window.confirm("コーチ権限を削除しますか？")) return;
    setActionLoading(ownerUserId);
    const { error } = await supabase.rpc("revoke_coach_role", {
      target_user_id: ownerUserId,
    });
    if (!error) await loadData();
    setActionLoading(null);
  };

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;
  if (!team) return <div className="text-sm text-gray-500">チームが見つかりません</div>;

  const isAdmin = currentUserRole === "admin";

  const renderSection = (title: string, members: MemberProfile[], badgeColor: string, showRoleActions = false) => (
    <div className="rounded-lg border border-gray-200 bg-white mb-4">
      <div className="border-b border-gray-200 px-6 py-3 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor}`}>
          {title}
        </span>
        <span className="text-sm text-gray-500">{members.length}人</span>
      </div>
      <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {members.length === 0 && (
          <li className="px-6 py-4 text-sm text-gray-400">なし</li>
        )}
        {members.map((member) => (
          <li key={member.id} className={`flex items-center justify-between px-6 py-4 ${actionLoading === member.id ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ProfileAvatar name={member.name} avatarUrl={member.avatar_url} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {member.name || "名前未設定"}
                  {member.number && (
                    <span className="ml-1.5 text-xs text-gray-400">#{member.number}</span>
                  )}
                  {member.owner_user_id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-400">(あなた)</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  参加日: {new Date(member.created_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.role === "admin" && (
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  <Shield size={12} strokeWidth={1.5} aria-hidden="true" />
                  管理者
                </span>
              )}
              {isAdmin && member.owner_user_id !== currentUserId && (
                <>
                  {showRoleActions && (
                    <>
                      <button
                        onClick={() => toggleRole(member.id, member.role)}
                        disabled={actionLoading === member.id}
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {member.role === "admin" ? "-管理者権限" : "+管理者権限"}
                      </button>
                      {member.account_type === "guardian" ? (
                        <button
                          onClick={() => grantCoach(member.owner_user_id)}
                          disabled={actionLoading === member.owner_user_id}
                          className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                        >
                          +コーチ権限
                        </button>
                      ) : (
                        <button
                          onClick={() => revokeCoach(member.owner_user_id)}
                          disabled={actionLoading === member.owner_user_id}
                          className="rounded border border-orange-300 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                        >
                          -コーチ権限
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => removeMember(member.id, member.name ?? "")}
                    disabled={actionLoading === member.id}
                    title="削除"
                    aria-label="削除"
                    className="flex items-center rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionLoading === member.id ? (
                      <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 size={12} strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">

      {/* Team Info & Invite Code */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          {team.icon_url ? (
            <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-200">
              <Image
                src={`${team.icon_url}?t=cached`}
                alt={team.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              {team.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">チーム名</p>
            <p className="text-lg font-semibold">{team.name}</p>
          </div>
        </div>
      </div>

      {/* Player Section */}
      <div className="rounded-lg border border-gray-200 bg-white mb-4">
        <div className="border-b border-gray-200 px-6 py-3 flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
            選手
          </span>
          <span className="text-sm text-gray-500">
            {selectedCategoryId === null
              ? players.length
              : players.filter((p) => {
                  const cats = playerCategoryMap.get(p.member_profile_id) ?? [];
                  return cats.some((c) => c.id === selectedCategoryId);
                }).length}
            人
          </span>
        </div>
        <div className="px-6 pt-4">
          {/* カテゴリフィルタ */}
          {availableCategories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  selectedCategoryId === null
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                すべて
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="rounded-full border-2 px-3 py-1 text-sm font-medium transition-colors"
                  style={
                    selectedCategoryId === cat.id
                      ? { backgroundColor: cat.color + "20", borderColor: cat.color, color: cat.color }
                      : { borderColor: "#e5e7eb", color: "#4b5563" }
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {(() => {
            const filtered =
              selectedCategoryId === null
                ? players
                : players.filter((p) => {
                    const cats = playerCategoryMap.get(p.member_profile_id) ?? [];
                    return cats.some((c) => c.id === selectedCategoryId);
                  });
            if (filtered.length === 0) {
              return <li className="px-6 py-4 text-sm text-gray-400">なし</li>;
            }
            return filtered.map((member) => (
              <li key={member.id} className={`flex items-center justify-between px-6 py-4 ${actionLoading === member.id ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ProfileAvatar name={member.name} avatarUrl={member.avatar_url} size={40} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {member.name || "名前未設定"}
                      {member.number && (
                        <span className="ml-1.5 text-xs text-gray-400">#{member.number}</span>
                      )}
                      {member.owner_user_id === currentUserId && (
                        <span className="ml-2 text-xs text-gray-400">(あなた)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      参加日: {new Date(member.created_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "admin" && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      <Shield size={12} strokeWidth={1.5} aria-hidden="true" />
                      管理者
                    </span>
                  )}
                  {isAdmin && member.owner_user_id !== currentUserId && (
                    <>
                      <button
                        onClick={() => removeMember(member.id, member.name ?? "")}
                        disabled={actionLoading === member.id}
                        title="削除"
                        aria-label="削除"
                        className="flex items-center rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {actionLoading === member.id ? (
                          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 size={12} strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ));
          })()}
        </ul>
      </div>

      {/* Coach Section */}
      {renderSection("コーチ", coaches, "bg-blue-50 text-blue-700", false)}

      {/* Guardian Section */}
      {renderSection("保護者", guardians, "bg-orange-50 text-orange-700", true)}
    </div>
  );
}

