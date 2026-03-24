"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Plus } from "lucide-react";

type AnnouncementCategory = {
  id: string;
  name: string;
  color: string;
};

type Announcement = {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  author_name: string | null;
  categories: AnnouncementCategory[];
  target_role: string | null;
};

type TabType = "member" | "admin";

export default function AnnouncementsPage() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("member");
  const [showOnlyMyCategories, setShowOnlyMyCategories] = useState(true);
  const [myCategoryIds, setMyCategoryIds] = useState<string[]>([]);

  const isAdmin = currentUserRole === "admin";

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teamId } = await supabase.rpc("get_my_team_id");
    if (!teamId) return;

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role, member_profiles!inner(id, user_id)")
      .eq("team_id", teamId)
      .eq("member_profiles.user_id", user.id)
      .limit(1)
      .single();

    if (!membership) return;
    setTeamId(membership.team_id);
    setCurrentUserRole(membership.role);

    // 自分のカテゴリIDを取得（リンク済みプロファイルも含む）
    const myProfileIds = (membership as any)?.member_profiles
      ? [(membership as any).member_profiles.id]
      : [];

    // Parallel fetch: linkedAccess and announcementsData
    const [{ data: linkedAccess }, { data: announcementsData }] = await Promise.all([
      supabase.from("member_profile_access").select("member_profile_id"),
      supabase
        .from("announcements")
        .select(
          "id, title, author_id, created_at, target_role, profiles!announcements_author_id_fkey(name), announcement_categories(event_types(id, name, color))"
        )
        .eq("team_id", membership.team_id)
        .order("created_at", { ascending: false }),
    ]);

    const linkedProfileIds = (linkedAccess ?? []).map((r: any) => r.member_profile_id);
    const allMyProfileIds = [...new Set([...myProfileIds, ...linkedProfileIds])];

    if (allMyProfileIds.length > 0) {
      const { data: myCategories } = await supabase
        .from("member_profile_categories")
        .select("event_type_id")
        .in("member_profile_id", allMyProfileIds);
      setMyCategoryIds((myCategories ?? []).map((c: any) => c.event_type_id));
    }

    if (announcementsData) {
      const formatted = announcementsData.map((a: any) => ({
        id: a.id,
        title: a.title,
        author_id: a.author_id,
        created_at: a.created_at,
        author_name: a.profiles?.name ?? null,
        target_role: a.target_role ?? null,
        categories: (a.announcement_categories ?? [])
          .map((ac: any) => ac.event_types)
          .filter(Boolean) as AnnouncementCategory[],
      }));
      setAnnouncements(formatted);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  if (!teamId) {
    return <div className="text-sm text-gray-500">チームが見つかりません</div>;
  }

  const hasCategories = myCategoryIds.length > 0;

  const tabFilteredAnnouncements = isAdmin
    ? announcements.filter((a) =>
        activeTab === "admin"
          ? a.target_role === "admin"
          : a.target_role == null || a.target_role === "member"
      )
    : announcements;

  const filteredAnnouncements =
    showOnlyMyCategories && hasCategories
      ? tabFilteredAnnouncements.filter(
          (a) =>
            a.categories.length === 0 ||
            a.categories.some((cat) => myCategoryIds.includes(cat.id))
        )
      : tabFilteredAnnouncements;

  return (
    <div className="mx-auto max-w-3xl">
      {isAdmin && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab("member")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "member"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              全員向け
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "admin"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              管理者向け
            </button>
          </nav>
        </div>
      )}

      {/* カテゴリトグル + 追加ボタン */}
      {hasCategories ? (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {showOnlyMyCategories ? "関連カテゴリのみ" : "すべてのカテゴリを表示中"}
          </span>
          <button
            onClick={() => setShowOnlyMyCategories((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              !showOnlyMyCategories ? "bg-blue-600" : "bg-gray-300"
            }`}
            aria-label="すべてのカテゴリを表示"
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                !showOnlyMyCategories ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-xs text-gray-400">すべて</span>
          {isAdmin && (
            <Link
              href="/announcements/new"
              className="ml-auto flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
              追加
            </Link>
          )}
        </div>
      ) : isAdmin ? (
        <div className="mb-4 flex items-center justify-end">
          <Link
            href="/announcements/new"
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
            追加
          </Link>
        </div>
      ) : null}

      {filteredAnnouncements.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">まだお知らせがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">
                      {announcement.title}
                    </h2>
                    {announcement.target_role === "admin" && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
                        管理者向け
                      </span>
                    )}
                  </div>
                  {announcement.categories.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {announcement.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {announcement.author_name ?? "不明"} ・{" "}
                    {new Date(announcement.created_at).toLocaleDateString(
                      "ja-JP",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        timeZone: "Asia/Tokyo",
                      }
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
