"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type EventCategory = { id: string; name: string; color: string };

export default function NewAnnouncementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [teamId, setTeamId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: teamId } = await supabase.rpc("get_my_team_id");
      const { data: membership } = teamId
        ? await supabase
            .from("team_members")
            .select("team_id, role, member_profiles!inner(user_id)")
            .eq("team_id", teamId)
            .eq("member_profiles.user_id", user.id)
            .limit(1)
            .single()
        : { data: null };

      if (membership) {
        setTeamId(membership.team_id);
        setUserRole(membership.role);

        if (membership.role !== "admin") {
          router.push("/announcements");
          return;
        }

        const { data: cats } = await supabase
          .from("event_types")
          .select("id, name, color")
          .eq("team_id", membership.team_id)
          .eq("kind", "category")
          .order("sort_order");
        if (cats) setCategories(cats);
      }
      setLoading(false);
    })();
  }, [supabase, router]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !userId) return;
    setSubmitting(true);
    setError(null);

    const { data: inserted, error: insertError } = await supabase
      .from("announcements")
      .insert({ team_id: teamId, author_id: userId, title, body })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setError(insertError?.message ?? "作成に失敗しました");
      setSubmitting(false);
      return;
    }

    if (selectedCategoryIds.size > 0) {
      await supabase.from("announcement_categories").insert(
        [...selectedCategoryIds].map((event_type_id) => ({
          announcement_id: inserted.id,
          event_type_id,
        }))
      );
    }

    router.push("/announcements");
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  if (userRole !== "admin") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">お知らせの作成は管理者のみ可能です</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">お知らせ作成</h1>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="例: 来週の練習について"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            本文 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="お知らせの内容を入力してください"
          />
        </div>

        {categories.length > 0 && (
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              対象カテゴリ
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                （未選択で全員に表示）
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const selected = selectedCategoryIds.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "作成中..." : "作成する"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/announcements")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
