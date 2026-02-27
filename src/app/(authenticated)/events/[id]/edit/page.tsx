"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type EventType = {
  id: string;
  name: string;
  color: string;
};

export default function EditEventPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [title, setTitle] = useState("");
  const [eventTypeId, setEventTypeId] = useState<string>("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [teamId, setTeamId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("title, event_type, event_type_id, date, end_at, location, memo, team_id")
        .eq("id", eventId)
        .single();

      if (!eventData) {
        setLoading(false);
        return;
      }

      setTitle(eventData.title);
      setTeamId(eventData.team_id);

      const toLocal = (iso: string) =>
        new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      setDate(toLocal(eventData.date));
      if (eventData.end_at) setEndDate(toLocal(eventData.end_at));
      setLocation(eventData.location ?? "");
      setMemo(eventData.memo ?? "");

      const { data: types } = await supabase
        .from("event_types")
        .select("id, name, color")
        .eq("team_id", eventData.team_id)
        .order("sort_order");

      if (types) {
        setEventTypes(types);
        // Set current event type selection
        if (eventData.event_type_id) {
          setEventTypeId(eventData.event_type_id);
        } else if (types.length > 0) {
          setEventTypeId(types[0].id);
        }
      }

      setLoading(false);
    })();
  }, [supabase, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("events")
      .update({
        title,
        event_type: eventTypes.find((t) => t.id === eventTypeId)?.name ?? "",
        event_type_id: eventTypeId || null,
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

    router.push(`/events/${eventId}`);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

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
          <label className="mb-1 block text-sm font-medium text-gray-700">
            種別
          </label>
          {eventTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setEventTypeId(type.id)}
                  className={`rounded-full px-3 py-1 text-sm font-medium border transition-all ${
                    eventTypeId === type.id
                      ? "border-transparent shadow-sm"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                  style={
                    eventTypeId === type.id
                      ? { backgroundColor: type.color + "20", color: type.color, borderColor: type.color }
                      : {}
                  }
                >
                  {type.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">種別が登録されていません</p>
          )}
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            開始日時 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            終了日時
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={date}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
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
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "更新中..." : "更新する"}
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
