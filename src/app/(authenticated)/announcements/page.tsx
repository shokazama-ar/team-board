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
};

export default function AnnouncementsPage() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teamId } = await supabase.rpc("get_my_team_id");
    if (!teamId) return;

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role, member_profiles!inner(user_id)")
      .eq("team_id", teamId)
      .eq("member_profiles.user_id", user.id)
      .limit(1)
      .single();

    if (!membership) return;
    setTeamId(membership.team_id);
    setCurrentUserRole(membership.role);

    const { data: announcementsData } = await supabase
      .from("announcements")
      .select(
        "id, title, author_id, created_at, profiles!announcements_author_id_fkey(name), announcement_categories(event_types(id, name, color))"
      )
      .eq("team_id", membership.team_id)
      .order("created_at", { ascending: false });

    if (announcementsData) {
      const formatted = announcementsData.map((a: any) => ({
        id: a.id,
        title: a.title,
        author_id: a.author_id,
        created_at: a.created_at,
        author_name: a.profiles?.name ?? null,
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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">お知らせ</h1>
        {currentUserRole === "admin" && (
          <Link
            href="/announcements/new"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
            新規作成
          </Link>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">まだお知らせがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {announcement.title}
                  </h2>
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
