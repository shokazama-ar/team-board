"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";

type AnnouncementDetail = {
  id: string;
  team_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type EventCategory = { id: string; name: string; color: string };

export default function AnnouncementDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const announcementId = params.id as string;

  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // 編集
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  // カテゴリ
  const [allCategories, setAllCategories] = useState<EventCategory[]>([]);
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set()); // 現在の割当
  const [editCategoryIds, setEditCategoryIds] = useState<Set<string>>(new Set()); // 編集中

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: announcementData } = await supabase
      .from("announcements")
      .select("*, profiles!announcements_author_id_fkey(name)")
      .eq("id", announcementId)
      .single();

    if (!announcementData) {
      setLoading(false);
      return;
    }

    const ann: AnnouncementDetail = {
      id: announcementData.id,
      team_id: announcementData.team_id,
      author_id: announcementData.author_id,
      title: announcementData.title,
      body: announcementData.body,
      created_at: announcementData.created_at,
      updated_at: announcementData.updated_at,
    };
    setAnnouncement(ann);
    setEditTitle(ann.title);
    setEditBody(ann.body);
    setTeamId(ann.team_id);

    const profile = announcementData.profiles as { name: string | null } | null;
    if (profile) setAuthorName(profile.name || "不明");

    const { data: membership } = await supabase
      .from("team_members")
      .select("role, member_profiles!inner(user_id)")
      .eq("team_id", ann.team_id)
      .eq("member_profiles.user_id", user.id)
      .limit(1)
      .single();

    if (membership) setCurrentUserRole(membership.role);

    // 全カテゴリ
    const { data: cats } = await supabase
      .from("event_types")
      .select("id, name, color")
      .eq("team_id", ann.team_id)
      .eq("kind", "category")
      .order("sort_order");
    if (cats) setAllCategories(cats);

    // このお知らせのカテゴリ
    const { data: ac } = await supabase
      .from("announcement_categories")
      .select("event_type_id")
      .eq("announcement_id", announcementId);
    const ids = new Set((ac ?? []).map((r) => r.event_type_id));
    setCategoryIds(ids);
    setEditCategoryIds(new Set(ids));

    setLoading(false);
  }, [supabase, announcementId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    if (!announcement) return;
    if (!window.confirm("このお知らせを削除しますか？")) return;
    setDeleting(true);
    const { error } = await supabase.from("announcements").delete().eq("id", announcement.id);
    if (!error) router.push("/announcements");
    setDeleting(false);
  };

  const toggleEditCategory = (id: string) => {
    setEditCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!announcement) return;
    setSaving(true);

    await supabase
      .from("announcements")
      .update({ title: editTitle, body: editBody, updated_at: new Date().toISOString() })
      .eq("id", announcement.id);

    // カテゴリを全削除 → 再挿入
    await supabase.from("announcement_categories").delete().eq("announcement_id", announcement.id);
    if (editCategoryIds.size > 0) {
      await supabase.from("announcement_categories").insert(
        [...editCategoryIds].map((event_type_id) => ({
          announcement_id: announcement.id,
          event_type_id,
        }))
      );
    }

    setAnnouncement({ ...announcement, title: editTitle, body: editBody, updated_at: new Date().toISOString() });
    setCategoryIds(new Set(editCategoryIds));
    setIsEditing(false);
    setSaving(false);
  };

  const handleCancelEdit = () => {
    if (!announcement) return;
    setEditTitle(announcement.title);
    setEditBody(announcement.body);
    setEditCategoryIds(new Set(categoryIds));
    setIsEditing(false);
  };

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;
  if (!announcement) return <div className="text-sm text-gray-500">お知らせが見つかりません</div>;

  const canEdit = currentUserRole === "admin";
  const assignedCategories = allCategories.filter((c) => categoryIds.has(c.id));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/announcements" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          お知らせ一覧
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {!isEditing ? (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold">{announcement.title}</h1>
                {assignedCategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {assignedCategories.map((cat) => (
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
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                    編集
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:opacity-60"
                  >
                    {deleting ? (
                      <span className="flex items-center gap-1">
                        <Loader2 size={14} className="animate-spin" />
                        削除中…
                      </span>
                    ) : (
                      <>
                        <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                        削除
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4 whitespace-pre-wrap text-sm text-gray-900">{announcement.body}</div>

            <dl className="space-y-3 border-t border-gray-100 pt-4">
              <div>
                <dt className="text-xs text-gray-500">投稿者</dt>
                <dd className="text-sm text-gray-900">{authorName}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">投稿日</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(announcement.created_at).toLocaleDateString("ja-JP", {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                    timeZone: "Asia/Tokyo",
                  })}
                </dd>
              </div>
              {announcement.updated_at !== announcement.created_at && (
                <div>
                  <dt className="text-xs text-gray-500">最終更新</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(announcement.updated_at).toLocaleDateString("ja-JP", {
                      year: "numeric", month: "long", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                      timeZone: "Asia/Tokyo",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="edit-title" className="mb-1 block text-sm font-medium text-gray-700">タイトル</label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="edit-body" className="mb-1 block text-sm font-medium text-gray-700">本文</label>
              <textarea
                id="edit-body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {allCategories.length > 0 && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  対象カテゴリ
                  <span className="ml-1.5 text-xs font-normal text-gray-400">（未選択で全員に表示）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => {
                    const selected = editCategoryIds.has(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleEditCategory(cat.id)}
                        className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                        style={
                          selected
                            ? { backgroundColor: cat.color, borderColor: cat.color, color: "#fff" }
                            : { borderColor: "#d1d5db", color: "#6b7280" }
                        }
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !editTitle.trim() || !editBody.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:opacity-60"
              >
                {saving ? (
                  <span className="flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />
                    保存中…
                  </span>
                ) : "保存"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
