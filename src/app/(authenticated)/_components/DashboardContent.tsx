import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users } from "lucide-react";
import DashboardFilteredContent, {
  type EventWithCategories,
  type AnnouncementWithCategories,
} from "./DashboardFilteredContent";

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

  const [teamResult, memberCountResult, allUpcomingEventsResult, announcementsResult, myProfilesResult] =
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
        .select("id, title, event_type, date, location, event_event_types(event_types(id, name, color, kind))")
        .eq("team_id", membership.team_id)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(100),
      supabase
        .from("announcements")
        .select("id, title, body, created_at, announcement_categories(event_types(id, name, color))")
        .eq("team_id", membership.team_id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("team_members")
        .select("member_profile_id, member_profiles!inner(user_id)")
        .eq("team_id", membership.team_id)
        .eq("member_profiles.user_id", userId),
    ]);

  const team = teamResult.data;
  const membersRaw = memberCountResult.data ?? [];
  type MemberRaw = { member_profiles: { user_id: string; kind: string } | null };
  const userAccountCount = new Set(
    (membersRaw as unknown as MemberRaw[]).map((m) => m.member_profiles?.user_id).filter(Boolean)
  ).size;
  const coachCount = (membersRaw as unknown as MemberRaw[]).filter((m) => m.member_profiles?.kind === "coach").length;
  const playerCount = (membersRaw as unknown as MemberRaw[]).filter((m) => m.member_profiles?.kind === "player").length;

  const myProfileIds = (myProfilesResult.data ?? []).map((m) => m.member_profile_id);

  // ユーザーのカテゴリ取得 + 出欠回答済みイベント取得 を並列実行
  const eventIds = (allUpcomingEventsResult.data ?? []).map((e) => e.id);
  const [userCategoriesResult, userAttendancesResult] = await Promise.all([
    myProfileIds.length > 0
      ? supabase
          .from("member_profile_categories")
          .select("event_type_id")
          .in("member_profile_id", myProfileIds)
      : Promise.resolve({ data: [] as { event_type_id: string }[] }),
    myProfileIds.length > 0 && eventIds.length > 0
      ? supabase
          .from("attendances")
          .select("event_id")
          .in("member_profile_id", myProfileIds)
          .in("event_id", eventIds)
      : Promise.resolve({ data: [] as { event_id: string }[] }),
  ]);

  const userCategoryIds = (userCategoriesResult.data ?? []).map((c) => c.event_type_id);
  const answeredEventIds = (userAttendancesResult.data ?? []).map((a) => a.event_id);

  // イベントをカテゴリIDつきに変換
  const allUpcomingEvents: EventWithCategories[] = (allUpcomingEventsResult.data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    event_type: e.event_type,
    date: e.date,
    location: e.location,
    categories: (e.event_event_types ?? [])
      .map((eet: any) => eet.event_types)
      .filter((et: any) => et && et.kind === "category")
      .map((et: any) => ({ id: et.id, name: et.name, color: et.color })),
  }));

  // お知らせをカテゴリつきに変換
  const announcements: AnnouncementWithCategories[] = (announcementsResult.data ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    created_at: a.created_at,
    categories: (a.announcement_categories ?? [])
      .map((ac: any) => ac.event_types)
      .filter(Boolean),
  }));

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

      <DashboardFilteredContent
        allUpcomingEvents={allUpcomingEvents}
        answeredEventIds={answeredEventIds}
        announcements={announcements}
        userCategoryIds={userCategoryIds}
      />
    </>
  );
}
