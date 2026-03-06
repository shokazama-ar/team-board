import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AlertTriangle, Users, ChevronRight, MapPin } from "lucide-react";

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

export default async function DashboardContent({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role, member_profiles!inner(user_id)")
    .eq("member_profiles.user_id", userId)
    .limit(1)
    .single();

  if (!membership) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold">チームに参加しましょう</h2>
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
    );
  }

  const today = new Date().toISOString();

  // 独立したクエリを並列実行
  const [teamResult, memberCountResult, eventsResult, upcomingAllEventsResult, announcementsResult] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name")
        .eq("id", membership.team_id)
        .single(),
      supabase
        .from("team_members")
        .select("member_profiles(user_id, kind)")
        .eq("team_id", membership.team_id),
      supabase
        .from("events")
        .select("id, title, event_type, date, location")
        .eq("team_id", membership.team_id)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(5),
      // 未回答チェック用: 今日以降の全イベント
      supabase
        .from("events")
        .select("id, title, event_type, date, location")
        .eq("team_id", membership.team_id)
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("announcements")
        .select("id, title, body, created_at")
        .eq("team_id", membership.team_id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const team = teamResult.data;
  const membersRaw = memberCountResult.data ?? [];
  type MemberRaw = { member_profiles: { user_id: string; kind: string } | null };
  const userAccountCount = new Set(
    (membersRaw as MemberRaw[]).map((m) => m.member_profiles?.user_id).filter(Boolean)
  ).size;
  const coachCount = (membersRaw as MemberRaw[]).filter((m) => m.member_profiles?.kind === "coach").length;
  const playerCount = (membersRaw as MemberRaw[]).filter((m) => m.member_profiles?.kind === "player").length;
  const upcomingEvents: Event[] = eventsResult.data ?? [];
  const upcomingAllEvents: Event[] = upcomingAllEventsResult.data ?? [];
  const latestAnnouncements: Announcement[] = announcementsResult.data ?? [];

  // 出欠未回答イベント（今日以降のイベントを対象）
  let unansweredEvents: Event[] = [];
  if (upcomingAllEvents.length > 0) {
    const eventIds = upcomingAllEvents.map((e) => e.id);
    // ユーザーのmember_profile_idsを取得してから出欠を確認
    const { data: myProfiles } = await supabase
      .from("team_members")
      .select("member_profile_id, member_profiles!inner(user_id)")
      .eq("team_id", membership.team_id)
      .eq("member_profiles.user_id", userId);
    const myProfileIds = (myProfiles ?? []).map((m) => m.member_profile_id);

    const { data: userAttendances } = myProfileIds.length > 0
      ? await supabase
          .from("attendances")
          .select("event_id")
          .in("member_profile_id", myProfileIds)
          .in("event_id", eventIds)
      : { data: [] };

    const answeredEventIds = new Set(
      (userAttendances ?? []).map((a) => a.event_id)
    );
    unansweredEvents = upcomingAllEvents.filter(
      (e) => !answeredEventIds.has(e.id)
    );
  }

  if (!team) return null;

  return (
    <>
      {/* Team Info */}
      <div className="mt-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold">{team.name}</h2>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <Users size={14} strokeWidth={1.5} aria-hidden="true" />
            メンバー構成
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-gray-50 px-2 py-1.5">
              <p className="text-base font-bold text-gray-800">{userAccountCount}</p>
              <p className="text-xs text-gray-500">アカウント</p>
            </div>
            <div className="rounded-md bg-blue-50 px-2 py-1.5">
              <p className="text-base font-bold text-blue-700">{coachCount}</p>
              <p className="text-xs text-blue-500">コーチ</p>
            </div>
            <div className="rounded-md bg-green-50 px-2 py-1.5">
              <p className="text-base font-bold text-green-700">{playerCount}</p>
              <p className="text-xs text-green-500">選手</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unanswered Events Warning */}
      {unansweredEvents.length > 0 && (
        <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="mb-3 flex items-center text-lg font-semibold text-yellow-900">
            <AlertTriangle size={20} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
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
        {/* Upcoming Events */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              直近のイベント
              {upcomingEvents.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">{upcomingEvents.length}件</span>
              )}
            </h2>
            <Link href="/events" className="text-sm text-blue-600 hover:text-blue-700">
              すべて見る <ChevronRight size={16} strokeWidth={1.5} className="inline" aria-hidden="true" />
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
                          <span className="text-sm font-medium">{ev.title}</span>
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
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
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

        {/* Latest Announcements */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">最新のお知らせ</h2>
            <Link href="/announcements" className="text-sm text-blue-600 hover:text-blue-700">
              すべて見る <ChevronRight size={16} strokeWidth={1.5} className="inline" aria-hidden="true" />
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
                    <h3 className="text-sm font-medium">{announcement.title}</h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {announcement.body.slice(0, 50)}
                      {announcement.body.length > 50 ? "..." : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(announcement.created_at).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
