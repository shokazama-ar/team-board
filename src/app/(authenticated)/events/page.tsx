"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ImportModal } from "@/components/events/ImportModal";
import { List, CalendarDays, Plus, MapPin, Download, Upload, LayoutList, Loader2 } from "lucide-react";

const CalendarView = dynamic(
  () => import("@/components/events/CalendarView").then((mod) => mod.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[520px] rounded-lg border border-gray-200 bg-white">
        <span className="text-sm text-gray-400">カレンダーを読み込み中...</span>
      </div>
    ),
  }
);

type EventType = {
  id: string;
  name: string;
  color: string;
  kind: string;
  sort_order: number;
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
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teamId } = await supabase.rpc("get_my_team_id");
    if (!teamId) return;
    setTeamId(teamId);

    // eventsクエリをDB側で日付範囲フィルタ
    let eventsQuery = supabase
      .from("events")
      .select("id, title, event_type, date, end_at, location, created_by, event_event_types(event_types(id, name, color, kind, sort_order))")
      .eq("team_id", teamId);

    if (view === "calendar") {
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      const rangeStart = new Date(y, m - 1, 1);
      const rangeEnd = new Date(y, m + 2, 0, 23, 59, 59);
      eventsQuery = eventsQuery
        .gte("date", rangeStart.toISOString())
        .lte("date", rangeEnd.toISOString())
        .order("date", { ascending: false });
    } else {
      const now = new Date();
      const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const todayStart = new Date(
        Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()) - 9 * 60 * 60 * 1000
      );
      eventsQuery = eventsQuery
        .gte("date", todayStart.toISOString())
        .order("date", { ascending: true });
    }

    // 並列化: membership/linkedAccess/events を同時に取得
    const [{ data: myMembership }, { data: linkedAccess }, { data: eventsData }] = await Promise.all([
      supabase
        .from("team_members")
        .select("role, member_profiles!inner(id, user_id)")
        .eq("team_id", teamId)
        .eq("member_profiles.user_id", user.id)
        .limit(1)
        .single(),
      supabase
        .from("member_profile_access")
        .select("member_profile_id"),
      eventsQuery,
    ]);

    setCurrentUserRole(myMembership?.role ?? "");

    // カテゴリ取得（membership + linkedAccess の結果に依存）
    const myProfileIds = (myMembership as any)?.member_profiles
      ? [(myMembership as any).member_profiles.id]
      : [];
    const linkedProfileIds = (linkedAccess ?? []).map((r: any) => r.member_profile_id);
    const allMyProfileIds = [...new Set([...myProfileIds, ...linkedProfileIds])];

    // カテゴリ取得と出欠取得を並列化
    const eventIds = (eventsData ?? []).map((e: any) => e.id);
    const [categoriesResult, attendancesResult] = await Promise.all([
      allMyProfileIds.length > 0
        ? supabase
            .from("member_profile_categories")
            .select("event_type_id")
            .in("member_profile_id", allMyProfileIds)
        : Promise.resolve({ data: null }),
      eventIds.length > 0
        ? supabase
            .from("attendances")
            .select("event_id, status")
            .in("event_id", eventIds)
        : Promise.resolve({ data: null }),
    ]);

    if (categoriesResult.data) {
      setMyCategoryIds(categoriesResult.data.map((c: any) => c.event_type_id));
    }

    if (eventsData) {
      setEvents(eventsData as unknown as Event[]);
    }

    if (attendancesResult.data) {
      const map: Record<string, AttendanceSummary> = {};
      for (const a of attendancesResult.data) {
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

    setLoading(false);
  }, [supabase, view, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 日時フォーマット: YYYY/MM/DD(aaa) HH:mm ~ HH:mm（同日なら終了日付省略）
  const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
  function formatEventDateTime(dateStr: string, endAtStr: string | null): string {
    const start = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toJst = (d: Date) => new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const s = toJst(start);
    const yyyy = s.getUTCFullYear();
    const mm = pad(s.getUTCMonth() + 1);
    const dd = pad(s.getUTCDate());
    const day = WEEKDAYS[s.getUTCDay()];
    const hh = pad(s.getUTCHours());
    const min = pad(s.getUTCMinutes());
    let result = `${yyyy}/${mm}/${dd}(${day}) ${hh}:${min}`;
    if (endAtStr) {
      const end = new Date(endAtStr);
      const e = toJst(end);
      const ehh = pad(e.getUTCHours());
      const emin = pad(e.getUTCMinutes());
      const sameDay = s.getUTCFullYear() === e.getUTCFullYear() &&
        s.getUTCMonth() === e.getUTCMonth() &&
        s.getUTCDate() === e.getUTCDate();
      if (sameDay) {
        result += ` ~ ${ehh}:${emin}`;
      } else {
        const eyyyy = e.getUTCFullYear();
        const emm = pad(e.getUTCMonth() + 1);
        const edd = pad(e.getUTCDate());
        const eday = WEEKDAYS[e.getUTCDay()];
        result += ` ~ ${eyyyy}/${emm}/${edd}(${eday}) ${ehh}:${emin}`;
      }
    }
    return result;
  }

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
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedDate(null)}>
          <div
            className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 pb-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">
                  {selectedDate.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" })}
                </h3>
                <div className="flex items-center gap-2">
                  {currentUserRole === "admin" && (
                    <Link
                      href={`/events/new?date=${selectedDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })}`}
                      onClick={() => setSelectedDate(null)}
                      className="flex items-center rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      aria-label="追加"
                    >
                      <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                  )}
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-gray-500">この日の予定はありません</p>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map((event) => {
                    const summary = summaries[event.id];
                    const types = event.event_event_types
                      .map((e) => e.event_types)
                      .filter(Boolean) as EventType[];
                    const sortedTypes = [...types].sort((a, b) => {
                      if (a.kind !== b.kind) return a.kind === "type" ? -1 : 1;
                      return a.sort_order - b.sort_order;
                    });
                    const isLoading = loadingId === event.id;
                    return (
                      <div
                        key={event.id}
                        onClick={() => {
                          setLoadingId(event.id);
                          setSelectedDate(null);
                          router.push(`/events/${event.id}`);
                        }}
                        className={`rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm cursor-pointer ${isLoading ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-sm font-semibold text-gray-900">{event.title}</h2>
                              {sortedTypes.length > 0
                                ? sortedTypes.map((et) => (
                                    <span
                                      key={et.id}
                                      className={et.kind === "category"
                                        ? "rounded border px-2 py-0.5 text-xs font-medium"
                                        : "rounded-full px-2 py-0.5 text-xs font-medium"}
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
                              {formatEventDateTime(event.date, event.end_at)}
                            </p>
                            {event.location && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
                                {event.location}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {summary && (
                              <div className="flex gap-2 text-xs">
                                <span className="text-green-700">{summary.present}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-red-700">{summary.absent}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-yellow-700">{summary.undecided}</span>
                              </div>
                            )}
                            {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
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
          {currentUserRole === "admin" && (
            <Link
              href="/events/new"
              aria-label="追加"
              className="ml-auto flex items-center rounded-lg bg-blue-600 p-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          )}
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
            onSelectDate={(clickedDate, dayEvents) => {
              setSelectedDate(clickedDate);
              const ids = new Set(dayEvents.map(e => e.id));
              const dateEvents = filteredEvents
                .filter(e => ids.has(e.id))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              setSelectedDateEvents(dateEvents);
            }}
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
            const sortedTypes = [...types].sort((a, b) => {
              if (a.kind !== b.kind) return a.kind === "type" ? -1 : 1;
              return a.sort_order - b.sort_order;
            });
            const isLoading = loadingId === event.id;
            return (
              <div
                key={event.id}
                onClick={() => {
                  setLoadingId(event.id);
                  router.push(`/events/${event.id}`);
                }}
                className={`block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm cursor-pointer ${isLoading ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">
                        {event.title}
                      </h2>
                      {sortedTypes.length > 0
                        ? sortedTypes.map((et) => (
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
                      {formatEventDateTime(event.date, event.end_at)}
                    </p>
                    {event.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {summary && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-700">{summary.present}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-red-700">{summary.absent}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-yellow-700">{summary.undecided}</span>
                      </div>
                    )}
                    {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
