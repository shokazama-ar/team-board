import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

type Event = {
  id: string;
  title: string;
  event_type: string;
  date: string;
  location: string | null;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's team
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .single();

  let team = null;
  let memberCount = 0;
  let upcomingEvents: Event[] = [];
  let latestAnnouncements: Announcement[] = [];
  let unansweredEvents: Event[] = [];

  if (membership) {
    // Get team info
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, invite_code")
      .eq("id", membership.team_id)
      .single();

    team = teamData;

    // Get member count
    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", membership.team_id);

    memberCount = count ?? 0;

    const today = new Date().toISOString();

    // Get upcoming events (5)
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, event_type, date, location")
      .eq("team_id", membership.team_id)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(5);

    upcomingEvents = eventsData ?? [];

    // Get latest announcements (5)
    const { data: announcementsData } = await supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .eq("team_id", membership.team_id)
      .order("created_at", { ascending: false })
      .limit(5);

    latestAnnouncements = announcementsData ?? [];

    // Get unanswered events
    if (user) {
      // Get all upcoming event IDs
      const upcomingEventIds = upcomingEvents.map((e) => e.id);

      if (upcomingEventIds.length > 0) {
        // Get user's attendance records
        const { data: userAttendances } = await supabase
          .from("attendances")
          .select("event_id")
          .eq("user_id", user.id)
          .in("event_id", upcomingEventIds);

        const answeredEventIds = new Set(
          (userAttendances ?? []).map((a) => a.event_id)
        );

        // Filter unanswered events
        unansweredEvents = upcomingEvents.filter(
          (e) => !answeredEventIds.has(e.id)
        );
      }
    }
  }

  // No team case
  if (!team) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600">
          ようこそ、{user?.email ?? "ゲスト"}さん
        </p>
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold">
            チームに参加しましょう
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            チームに所属していません。新しいチームを作成するか、既存のチームに参加してください。
          </p>
          <Link
            href="/teams/setup"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            チーム設定へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
      <p className="text-gray-600">
        ようこそ、{user?.email ?? "ゲスト"}さん
      </p>

      {/* Team Info */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold">{team.name}</h2>
          <p className="text-sm text-gray-500">メンバー: {memberCount}人</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold">招待コード</h2>
          <p className="text-sm text-gray-500">メンバーを招待しましょう</p>
          <code className="mt-2 inline-block rounded bg-gray-100 px-2 py-1 text-sm font-mono">
            {team.invite_code}
          </code>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold">直近のイベント</h2>
          <p className="text-2xl font-bold text-blue-600">
            {upcomingEvents.length}
          </p>
          <p className="text-sm text-gray-500">今後の予定</p>
        </div>
      </div>

      {/* Unanswered Events Warning */}
      {unansweredEvents.length > 0 && (
        <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="mb-3 flex items-center text-lg font-semibold text-yellow-900">
            <svg
              className="mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            未回答のイベントがあります
          </h2>
          <ul className="space-y-2">
            {unansweredEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block text-sm text-yellow-900 hover:text-yellow-700"
                >
                  <span className="font-medium">{event.title}</span>
                  <span className="ml-2 text-xs text-yellow-700">
                    {new Date(event.date).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Upcoming Events Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">直近のイベント</h2>
            <Link
              href="/events"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              すべて見る →
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">まだイベントがありません</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((ev) => (
                <li key={ev.id}>
                  <Link
                    href={`/events/${ev.id}`}
                    className="block rounded-lg border border-gray-100 p-3 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {ev.title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_STYLES[ev.event_type] ?? EVENT_TYPE_STYLES.other}`}
                          >
                            {EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(ev.date).toLocaleDateString("ja-JP", {
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {ev.location && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Latest Announcements Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">最新のお知らせ</h2>
            <Link
              href="/announcements"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              すべて見る →
            </Link>
          </div>
          {latestAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-500">まだお知らせがありません</p>
          ) : (
            <ul className="space-y-3">
              {latestAnnouncements.map((announcement) => (
                <li key={announcement.id}>
                  <Link
                    href={`/announcements/${announcement.id}`}
                    className="block rounded-lg border border-gray-100 p-3 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <h3 className="text-sm font-medium">
                      {announcement.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {announcement.body.slice(0, 50)}
                      {announcement.body.length > 50 ? "..." : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(announcement.created_at).toLocaleDateString(
                        "ja-JP",
                        {
                          month: "short",
                          day: "numeric",
                          weekday: "short",
                        }
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
