"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type AnnouncementDetail = {
  id: string;
  team_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export default function AnnouncementDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const announcementId = params.id as string;

  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

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

    const announcement: AnnouncementDetail = {
      id: announcementData.id,
      team_id: announcementData.team_id,
      author_id: announcementData.author_id,
      title: announcementData.title,
      body: announcementData.body,
      created_at: announcementData.created_at,
      updated_at: announcementData.updated_at,
    };
    setAnnouncement(announcement);
    setEditTitle(announcement.title);
    setEditBody(announcement.body);

    const profile = announcementData.profiles as { name: string | null } | null;
    if (profile) {
      setAuthorName(profile.name || "不明");
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", announcement.team_id)
      .eq("user_id", user.id)
      .single();

    if (membership) setCurrentUserRole(membership.role);

    setLoading(false);
  }, [supabase, announcementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!announcement) return;
    const confirmed = window.confirm("このお知らせを削除しますか？");
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);

    if (!error) {
      router.push("/announcements");
    }
    setDeleting(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!announcement) return;
    setEditTitle(announcement.title);
    setEditBody(announcement.body);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!announcement) return;
    setSaving(true);

    const { error } = await supabase
      .from("announcements")
      .update({
        title: editTitle,
        body: editBody,
        updated_at: new Date().toISOString(),
      })
      .eq("id", announcement.id);

    if (!error) {
      setAnnouncement({
        ...announcement,
        title: editTitle,
        body: editBody,
        updated_at: new Date().toISOString(),
      });
      setIsEditing(false);
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  if (!announcement) {
    return <div className="text-sm text-gray-500">お知らせが見つかりません</div>;
  }

  const canEdit = currentUserRole === "admin";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/announcements" className="text-sm text-blue-600 hover:underline">
          &larr; お知らせ一覧
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {!isEditing ? (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{announcement.title}</h1>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    編集
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting ? "削除中..." : "削除"}
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4 whitespace-pre-wrap text-sm text-gray-900">
              {announcement.body}
            </div>

            <dl className="space-y-3 border-t border-gray-100 pt-4">
              <div>
                <dt className="text-xs text-gray-500">投稿者</dt>
                <dd className="text-sm text-gray-900">{authorName}</dd>
              </div>

              <div>
                <dt className="text-xs text-gray-500">投稿日</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(announcement.created_at).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>

              {announcement.updated_at !== announcement.created_at && (
                <div>
                  <dt className="text-xs text-gray-500">最終更新</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(announcement.updated_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="edit-title" className="mb-1 block text-sm font-medium text-gray-700">
                タイトル
              </label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="edit-body" className="mb-1 block text-sm font-medium text-gray-700">
                本文
              </label>
              <textarea
                id="edit-body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !editTitle.trim() || !editBody.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
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
