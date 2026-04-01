import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import DashboardFilteredContent, {
  type EventWithCategories,
  type AnnouncementWithCategories,
} from "./DashboardFilteredContent";

export default async function DashboardContent({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role, account_type, member_profiles!inner(user_id)")
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

  // JSTで「今日の00:00」〜「7日後の23:59:59」をUTCで計算
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const nowUtcMs = Date.now();
  const nowJstMs = nowUtcMs + JST_OFFSET_MS;
  const jstMidnightMs = nowJstMs - (nowJstMs % (24 * 60 * 60 * 1000));
  const todayStart = new Date(jstMidnightMs - JST_OFFSET_MS).toISOString();
  const sevenDaysLaterEnd = new Date(jstMidnightMs - JST_OFFSET_MS + 8 * 24 * 60 * 60 * 1000 - 1).toISOString();

  const [teamResult, memberCountResult, allUpcomingEventsResult, announcementsResult, myProfilesResult] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name")
        .eq("id", membership.team_id)
        .single(),
      supabase
        .from("team_members")
        .select("account_type, member_profiles(user_id, kind)")
        .eq("team_id", membership.team_id),
      supabase
        .from("events")
        .select("id, title, event_type, date, location, event_event_types(event_types(id, name, color, kind, sort_order))")
        .eq("team_id", membership.team_id)
        .gte("date", todayStart)
        .lte("date", sevenDaysLaterEnd)
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
        .select("member_profile_id, member_profiles!inner(user_id, kind)")
        .eq("team_id", membership.team_id)
        .eq("member_profiles.user_id", userId),
    ]);

  const team = teamResult.data;
  const membersRaw = memberCountResult.data ?? [];
  type MemberRaw = { account_type: string | null; member_profiles: { user_id: string; kind: string } | null };
  const membersTyped = membersRaw as unknown as MemberRaw[];

  const coachAccountCount = new Set(
    membersTyped.filter((m) => m.account_type === "coach").map((m) => m.member_profiles?.user_id).filter(Boolean)
  ).size;
  const guardianAccountCount = new Set(
    membersTyped.filter((m) => m.account_type === "guardian").map((m) => m.member_profiles?.user_id).filter(Boolean)
  ).size;
  const playerCount = membersTyped.filter((m) => m.member_profiles?.kind === "player").length;

  const myProfileIds = (myProfilesResult.data ?? []).map((m) => m.member_profile_id);

  // リンク済みプロファイルIDを取得（保護者が子プロファイルにアクセスできるケース）
  const { data: linkedAccess } = await supabase
    .from("member_profile_access")
    .select("member_profile_id, member_profiles(kind)");
  const linkedProfileIds = (linkedAccess ?? []).map((r) => r.member_profile_id);
  const allMyProfileIds = [...new Set([...myProfileIds, ...linkedProfileIds])];

  const isGuardian = (membership.account_type as string) === "guardian";
  const ownedPlayerProfiles = (myProfilesResult.data ?? []).filter(
    (m) => (m.member_profiles as unknown as { kind: string } | null)?.kind === "player"
  );
  const linkedPlayerProfiles = (linkedAccess ?? []).filter(
    (a) => (a.member_profiles as unknown as { kind: string } | null)?.kind === "player"
  );
  const hasPlayerProfile = ownedPlayerProfiles.length > 0 || linkedPlayerProfiles.length > 0;

  // ユーザーのカテゴリ取得 + 出欠回答済みイベント取得 を並列実行
  const eventIds = (allUpcomingEventsResult.data ?? []).map((e) => e.id);
  const [userCategoriesResult, userAttendancesResult] = await Promise.all([
    allMyProfileIds.length > 0
      ? supabase
          .from("member_profile_categories")
          .select("event_type_id")
          .in("member_profile_id", allMyProfileIds)
      : Promise.resolve({ data: [] as { event_type_id: string }[] }),
    allMyProfileIds.length > 0 && eventIds.length > 0
      ? supabase
          .from("attendances")
          .select("event_id")
          .in("member_profile_id", allMyProfileIds)
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
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((et: any) => ({ id: et.id, name: et.name, color: et.color, sort_order: et.sort_order })),
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
      {/* 保護者向け：選手プロファイル未登録バナー */}
      {isGuardian && !hasPlayerProfile && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">
            まずは選手のプロファイルを登録してください 😊
          </p>
          <p className="mt-1 text-sm text-blue-700">
            選手プロファイルを登録すると、スケジュールの出欠回答などの機能が利用できます。
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            設定画面で登録する
          </Link>
        </div>
      )}

      {/* Team Info */}
      <div className="mt-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{team.name}</h2>
            <Link href="/members" className="text-sm text-blue-600 hover:text-blue-700">
              メンバー一覧 <ChevronRight size={16} strokeWidth={1.5} className="inline" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-blue-50 px-2 py-1.5">
              <p className="text-base font-bold text-blue-700">{coachAccountCount}</p>
              <p className="text-xs text-blue-500">コーチ</p>
            </div>
            <div className="rounded-md bg-orange-50 px-2 py-1.5">
              <p className="text-base font-bold text-orange-700">{guardianAccountCount}</p>
              <p className="text-xs text-orange-500">保護者</p>
            </div>
            <div className="rounded-md bg-green-50 px-2 py-1.5">
              <p className="text-base font-bold text-green-700">{playerCount}</p>
              <p className="text-xs text-green-500">選手</p>
            </div>
          </div>
        </div>
      </div>

      {/* 選手プロファイルがある場合のみ予定・お知らせを表示 */}
      {hasPlayerProfile && (
        <DashboardFilteredContent
          allUpcomingEvents={allUpcomingEvents}
          answeredEventIds={answeredEventIds}
          announcements={announcements}
          userCategoryIds={userCategoryIds}
        />
      )}
    </>
  );
}
