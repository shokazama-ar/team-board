"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { Loader2 } from "lucide-react";

type EventType = {
  id: string;
  name: string;
  color: string;
  kind: "type" | "category";
};

function TypeRadios({
  items,
  selectedId,
  onSelect,
}: {
  items: EventType[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">登録されていません</p>;
  }
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map((item) => {
        const selected = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(selected ? null : item.id)}
            className="flex items-center gap-2"
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all"
              style={
                selected
                  ? { borderColor: item.color, backgroundColor: item.color }
                  : { borderColor: "#d1d5db" }
              }
            >
              {selected && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
            <span
              className="text-sm font-medium transition-colors"
              style={selected ? { color: item.color } : { color: "#4b5563" }}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CategoryPills({
  items,
  selectedIds,
  onToggle,
}: {
  items: EventType[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">登録されていません</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
              selected
                ? "border-2 shadow-sm"
                : "border-2 border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
            style={
              selected
                ? {
                    backgroundColor: item.color + "20",
                    color: item.color,
                    borderColor: item.color,
                  }
                : {}
            }
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

export default function EditEventPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [title, setTitle] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  useEffect(() => {
    (async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("title, event_type_id, date, end_at, location, memo, team_id")
        .eq("id", eventId)
        .single();

      if (!eventData) {
        setLoading(false);
        return;
      }

      setTitle(eventData.title);

      const toLocal = (iso: string) =>
        new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      setDate(toLocal(eventData.date));
      if (eventData.end_at) setEndDate(toLocal(eventData.end_at));
      setLocation(eventData.location ?? "");
      setMemo(eventData.memo ?? "");

      // Parallel fetch: types and existingLinks
      const [{ data: types }, { data: existingLinks }] = await Promise.all([
        supabase.from("event_types").select("id, name, color, kind").eq("team_id", eventData.team_id).order("sort_order"),
        supabase.from("event_event_types").select("event_type_id").eq("event_id", eventId),
      ]);

      if (types) setEventTypes(types as EventType[]);

      if (existingLinks && existingLinks.length > 0 && types) {
        const typeSet = new Set(
          types.filter((t) => t.kind === "type").map((t) => t.id)
        );
        const categorySet = new Set(
          types.filter((t) => t.kind === "category").map((t) => t.id)
        );
        const typeLink = existingLinks.find((l) => typeSet.has(l.event_type_id));
        const categoryLinks = existingLinks.filter((l) =>
          categorySet.has(l.event_type_id)
        );
        setSelectedTypeId(typeLink?.event_type_id ?? null);
        setSelectedCategoryIds(categoryLinks.map((l) => l.event_type_id));
      } else if (eventData.event_type_id) {
        setSelectedTypeId(eventData.event_type_id);
      }

      setLoading(false);
    })();
  }, [supabase, eventId]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const selectedType = eventTypes.find((t) => t.id === selectedTypeId);

    const { error: updateError } = await supabase
      .from("events")
      .update({
        title,
        event_type: selectedType?.name ?? "",
        event_type_id: selectedTypeId ?? null,
        date: new Date(date).toISOString(),
        end_at: endDate ? new Date(endDate).toISOString() : null,
        location: location || null,
        memo: memo || null,
      })
      .eq("id", eventId);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    await supabase.from("event_event_types").delete().eq("event_id", eventId);

    const allSelectedIds = [selectedTypeId, ...selectedCategoryIds].filter(
      (id): id is string => id !== null
    );
    if (allSelectedIds.length > 0) {
      await supabase.from("event_event_types").insert(
        allSelectedIds.map((id) => ({ event_id: eventId, event_type_id: id }))
      );
    }

    // Googleカレンダー同期（非同期・エラー無視）
    fetch("/api/google-calendar/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, action: "update" }),
    }).catch(() => {});

    router.push(`/events/${eventId}`);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  const types = eventTypes.filter((t) => t.kind === "type");
  const categories = eventTypes.filter((t) => t.kind === "category");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href={`/events/${eventId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; 詳細に戻る
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold">予定を編集</h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
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
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            イベント種別
          </label>
          <TypeRadios
            items={types}
            selectedId={selectedTypeId}
            onSelect={setSelectedTypeId}
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            対象カテゴリ
          </label>
          <CategoryPills
            items={categories}
            selectedIds={selectedCategoryIds}
            onToggle={toggleCategory}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            開始日時 <span className="text-red-500">*</span>
          </label>
          <DateTimePicker value={date} onChange={setDate} required />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            終了日時
          </label>
          <DateTimePicker value={endDate} onChange={setEndDate} min={date} />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            場所
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            メモ
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center gap-1">
                <Loader2 size={14} className="animate-spin" />
                保存中…
              </span>
            ) : "保存"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/events/${eventId}`)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
