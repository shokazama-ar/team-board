import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAccessToken,
  createGoogleEvent,
  toGoogleCalendarEvent,
} from "@/lib/google-calendar";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 管理者チェック
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!teamMember) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  // チーム設定取得（google_calendar_id は使用しない）
  const { data: team } = await supabase
    .from("teams")
    .select("google_refresh_token, google_sync_enabled")
    .eq("id", teamMember.team_id)
    .single();

  if (!team?.google_sync_enabled || !team.google_refresh_token) {
    return NextResponse.json({ error: "Google連携が有効ではありません" }, { status: 400 });
  }

  // まだ同期されていないイベントを取得（google_event_id が NULL のもの）
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, date, end_at, location, memo")
    .eq("team_id", teamMember.team_id)
    .is("google_event_id", null);

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ synced: 0, message: "同期対象のイベントはありません" });
  }

  // event_event_types 中間テーブル経由でカテゴリ（kind='category'）を取得
  const eventIds = events.map((e) => e.id);
  const { data: eventTypesLinks } = await supabase
    .from("event_event_types")
    .select("event_id, event_type_id, event_types(id, kind, google_sync_enabled, google_calendar_id)")
    .in("event_id", eventIds);

  // event_id → 最初に見つかった category の情報 をマップ化
  type CategoryInfo = { google_sync_enabled: boolean | null; google_calendar_id: string | null };
  const categoryByEventId = new Map<string, CategoryInfo>();

  for (const link of eventTypesLinks ?? []) {
    const et = Array.isArray(link.event_types) ? link.event_types[0] : link.event_types;
    if (!et || et.kind !== "category") continue;
    // 既にカテゴリ情報が設定済みの場合はスキップ（最初のカテゴリを優先）
    if (categoryByEventId.has(link.event_id)) continue;
    categoryByEventId.set(link.event_id, {
      google_sync_enabled: et.google_sync_enabled,
      google_calendar_id: et.google_calendar_id,
    });
  }

  try {
    const accessToken = await getAccessToken(team.google_refresh_token);

    let synced = 0;
    let skipped = 0;

    for (const event of events) {
      const category = categoryByEventId.get(event.id);

      // カテゴリが存在しない、または同期無効の場合はスキップ
      if (!category || category.google_sync_enabled === false) {
        skipped++;
        continue;
      }

      // カテゴリの google_calendar_id のみ使用。フォールバックなし
      const calendarId = category.google_calendar_id ?? null;

      if (!calendarId) {
        skipped++;
        continue;
      }

      const gcalEvent = toGoogleCalendarEvent(event);
      try {
        const googleEventId = await createGoogleEvent(accessToken, calendarId, gcalEvent);
        await supabase
          .from("events")
          .update({ google_event_id: googleEventId })
          .eq("id", event.id);
        synced++;
      } catch (err) {
        console.error(`Failed to sync event ${event.id}:`, err);
        skipped++;
      }
    }

    return NextResponse.json({ synced, skipped });
  } catch (err) {
    console.error("Bulk sync error:", err);
    return NextResponse.json(
      { error: "一括同期に失敗しました" },
      { status: 500 }
    );
  }
}
