"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  event_type: string;
  date: string;
  end_at: string | null;
  location: string | null;
  created_by: string;
};

type AttendanceSummary = {
  present: number;
  absent: number;
  undecided: number;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  game: "試合",
  other: "その他",
};

const EVENT_TYPE_STYLES: Record<string, string> = {
  practice: "bg-green-50 text-green-700",
  game: "bg-red-50 text-red-700",
  other: "bg-gray-100 text-gray-600",
};

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, AttendanceSummary>>({});

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!membership) return;
    setTeamId(membership.team_id);
    setCurrentUserRole(membership.role);

    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, event_type, date, end_at, location, created_by")
      .eq("team_id", membership.team_id)
      .order("date", { ascending: false });

    if (eventsData) {
      setEvents(eventsData);

      // Load attendance summaries for all events
      const eventIds = eventsData.map((e) => e.id);
      if (eventIds.length > 0) {
        const { data: attendances } = await supabase
          .from("attendances")
          .select("event_id, status")
          .in("event_id", eventIds);

        if (attendances) {
          const map: Record<string, AttendanceSummary> = {};
          for (const a of attendances) {
            if (!map[a.event_id]) {
              map[a.event_id] = { present: 0, absent: 0, undecided: 0 };
            }
            const s = a.status as keyof AttendanceSummary;
            if (s in map[a.event_id]) {
              map[a.event_id][s]++;
            }
          }
          setSummaries(map);
        }
      }
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
        <h1 className="text-2xl font-bold">イベント</h1>
        <Link
          href="/events/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規作成
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">まだイベントがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const summary = summaries[event.id];
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">
                        {event.title}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_STYLES[event.event_type] ?? EVENT_TYPE_STYLES.other}`}
                      >
                        {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {event.end_at && (
                        <span>
                          {" 〜 "}
                          {new Date(event.end_at).toLocaleDateString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </p>
                    {event.location && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {event.location}
                      </p>
                    )}
                  </div>
                  {summary && (
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-700">{summary.present}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-700">{summary.absent}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-yellow-700">{summary.undecided}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
