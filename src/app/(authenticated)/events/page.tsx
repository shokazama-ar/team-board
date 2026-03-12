"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CalendarView } from "@/components/events/CalendarView";
import { ImportModal } from "@/components/events/ImportModal";
import { List, CalendarDays, Plus, MapPin, Download, Upload, LayoutList } from "lucide-react";

type EventType = {
  id: string;
  name: string;
  color: string;
  kind: string;
};

type Event = {
  id: string;
  title: string;
  event_type: string;
  date: string;
  end_at: string | null;
  location: string | null;
  created_by: string;
  event_event_types: { event_types: EventType | null }[];
};

type AttendanceSummary = {
  present: number;
  absent: number;
  undecided: number;
};

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, AttendanceSummary>>({});
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterTypeIds, setFilterTypeIds] = useState<Set<string>>(new Set());
  const [showOnlyMyCategories, setShowOnlyMyCategories] = useState(true);
  const [myCategoryIds, setMyCategoryIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teamId } = await supabase.rpc("get_my_team_id");
    if (!teamId) return;
    setTeamId(teamId);

    const { data: myMembership } = await supabase
      .from("team_members")
      .select("role, member_profiles!inner(id, user_id)")
      .eq("team_id", teamId)
      .eq("member_profiles.user_id", user.id)
      .limit(1)
      .single();
    setCurrentUserRole(myMembership?.role ?? "");

    // 自分のカテゴリIDを取得（リンク済みプロファイルも含む）
    const myProfileIds = (myMembership as any)?.member_profiles
      ? [(myMembership as any).member_profiles.id]
      : [];

    // リンク済みプロファイルIDを取得（保護者が子プロファイルにアクセスできるケース）
    const { data: linkedAccess } = await supabase
      .from("member_profile_access")
      .select("member_profile_id");
    const linkedProfileIds = (linkedAccess ?? []).map((r: any) => r.member_profile_id);
    const allMyProfileIds = [...new Set([...myProfileIds, ...linkedProfileIds])];

    if (allMyProfileIds.length > 0) {
      const { data: myCategories } = await supabase
        .from("member_profile_categories")
        .select("event_type_id")
        .in("member_profile_id", allMyProfileIds);
      setMyCategoryIds((myCategories ?? []).map((c: any) => c.event_type_id));
    }

    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, event_type, date, end_at, location, created_by, event_event_types(event_types(id, name, color, kind))")
      .eq("team_id", teamId)
      .order("date", { ascending: false });

    if (eventsData) {
      setEvents(eventsData as unknown as Event[]);

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

  // フィルタ用: 全イベントから利用可能な種別を収集
  const availableTypes = useMemo(() => {
    const typeMap = new Map<string, EventType>();
    for (const event of events) {
      for (const et of event.event_event_types) {
        if (!et.event_types) continue;
        if (et.event_types.kind === "type") typeMap.set(et.event_types.id, et.event_types);
      }
    }
    return Array.from(typeMap.values());
  }, [events]);

  // カテゴリが存在するかどうか
  const hasCategories = myCategoryIds.length > 0;

  // フィルタ適用後のイベント一覧
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const types = event.event_event_types.map((e) => e.event_types).filter(Boolean) as EventType[];
      const typeIds = types.filter((t) => t.kind === "type").map((t) => t.id);
      const categoryIds = types.filter((t) => t.kind === "category").map((t) => t.id);
      const typeMatch = filterTypeIds.size === 0 || typeIds.some((id) => filterTypeIds.has(id));
      const categoryMatch =
        !showOnlyMyCategories ||
        !hasCategories ||
        categoryIds.length === 0 ||
        categoryIds.some((id) => myCategoryIds.includes(id));
      return typeMatch && categoryMatch;
    });
  }, [events, filterTypeIds, showOnlyMyCategories, myCategoryIds, hasCategories]);

  function toggleTypeFilter(id: string) {
    setFilterTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setFilterTypeIds(new Set());
  }

  function toJSTString(date: Date): string {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const y = jst.getUTCFullYear();
    const mo = String(jst.getUTCMonth() + 1).padStart(2, "0");
    const d = String(jst.getUTCDate()).padStart(2, "0");
    const h = String(jst.getUTCHours()).padStart(2, "0");
    const mi = String(jst.getUTCMinutes()).padStart(2, "0");
    return `${y}-${mo}-${d} ${h}:${mi}`;
  }

  function buildCSV(targetEvents: Event[]): string {
    const headers = ["title", "date", "end_at", "location", "memo", "event_type", "categories"];
    const rows: string[] = [headers.join(",")];
    for (const event of targetEvents) {
      const types = event.event_event_types.map((e) => e.event_types).filter(Boolean) as EventType[];
      const eventType = types.find((t) => t.kind === "type")?.name ?? event.event_type ?? "";
      const categories = types.filter((t) => t.kind === "category").map((t) => t.name).join("|");
      const cols = [
        event.title,
        toJSTString(new Date(event.date)),
        event.end_at ? toJSTString(new Date(event.end_at)) : "",
        event.location ?? "",
        "",
        eventType,
        categories,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      rows.push(cols.join(","));
    }
    return "\uFEFF" + rows.join("\n");
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    if (view === "list") {
      // 一覧: フィルタ済み全件
      const count = filteredEvents.length;
      const filterNote = hasFilter ? "（フィルタ適用中）" : "";
      const message =
        count === 0
          ? `エクスポート対象の予定は0件です${filterNote}。\nヘッダーのみの空のCSVファイルをダウンロードしますか？`
          : `全予定 ${count}件${filterNote} をCSVエクスポートします。\nよろしいですか？`;
      if (!window.confirm(message)) return;
      downloadCSV(buildCSV(filteredEvents), "events.csv");
    } else {
      // カレンダー: フィルタ済み × 表示中の月
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      const monthLabel = currentMonth.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
      const monthEvents = filteredEvents.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === y && d.getMonth() === m;
      });
      const count = monthEvents.length;
      const filterNote = hasFilter ? "（フィルタ適用中）" : "";
      const message =
        count === 0
          ? `${monthLabel}の予定は0件です${filterNote}。\nヘッダーのみの空のCSVファイルをダウンロードしますか？`
          : `${monthLabel}の予定 ${count}件${filterNote} をCSVエクスポートします。\nよろしいですか？`;
      if (!window.confirm(message)) return;
      const mm = String(m + 1).padStart(2, "0");
      downloadCSV(buildCSV(monthEvents), `events_${y}${mm}.csv`);
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  if (!teamId) {
    return <div className="text-sm text-gray-500">チームが見つかりません</div>;
  }

  const hasFilter = filterTypeIds.size > 0;

  return (
    <div className="mx-auto max-w-3xl">
      {showImportModal && (
        <ImportModal
          teamId={teamId}
          existingEvents={events}
          onSuccess={loadData}
          onClose={() => setShowImportModal(false)}
        />
      )}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setView("list")}
              title="一覧"
              aria-label="一覧"
              className={`flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              onClick={() => setView("calendar")}
              title="カレンダー"
              aria-label="カレンダー"
              className={`flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                view === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CalendarDays size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            title="エクスポート"
            aria-label="エクスポート"
            className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Download size={15} strokeWidth={1.5} aria-hidden="true" />
          </button>
          {currentUserRole === "admin" && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                title="インポート"
                aria-label="インポート"
                className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Upload size={15} strokeWidth={1.5} aria-hidden="true" />
              </button>
              <Link
                href="/events/bulk"
                title="一括追加"
                aria-label="一括追加"
                className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LayoutList size={16} strokeWidth={1.5} aria-hidden="true" />
              </Link>
              <Link
                href="/events/new"
                aria-label="追加"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
                追加
              </Link>
            </>
          )}
        </div>
      </div>

      {/* フィルタバー */}
      {availableTypes.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-400 shrink-0">種別</span>
            {availableTypes.map((t) => {
              const active = filterTypeIds.size === 0 || filterTypeIds.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTypeFilter(t.id)}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity"
                  style={{
                    color: t.color,
                    backgroundColor: t.color + "20",
                    opacity: active ? 1 : 0.3,
                  }}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            >
              クリア
            </button>
          )}
        </div>
      )}

      {/* カテゴリトグル */}
      {hasCategories && (
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="text-xs text-gray-500">
            {showOnlyMyCategories ? "自分のカテゴリのみ" : "すべてのカテゴリを表示中"}
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
        </div>
      )}

      {view === "calendar" ? (
        <div className="pb-20">
          <CalendarView
            events={filteredEvents.map(e => ({
              ...e,
              color: (e.event_event_types
                .map(et => et.event_types)
                .filter((t): t is NonNullable<typeof t> => t !== null && t.kind === "type")[0]?.color) ?? undefined,
            }))}
            date={currentMonth}
            onNavigate={setCurrentMonth}
          />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            {events.length === 0 ? "まだ予定がありません" : "条件に一致する予定がありません"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const summary = summaries[event.id];
            const types = event.event_event_types
              .map((e) => e.event_types)
              .filter(Boolean) as EventType[];
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">
                        {event.title}
                      </h2>
                      {types.length > 0
                        ? types.map((et) => (
                            <span
                              key={et.id}
                              className={et.kind === "category" ? "rounded border px-2 py-0.5 text-xs font-medium" : "rounded-full px-2 py-0.5 text-xs font-medium"}
                              style={et.kind === "category"
                                ? { borderColor: et.color, color: et.color }
                                : { backgroundColor: et.color + "20", color: et.color }}
                            >
                              {et.name}
                            </span>
                          ))
                        : event.event_type && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                              {event.event_type}
                            </span>
                          )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Tokyo",
                      })}
                      {event.end_at && (
                        <span>
                          {" 〜 "}
                          {new Date(event.end_at).toLocaleDateString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Tokyo",
                          })}
                        </span>
                      )}
                    </p>
                    {event.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
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
