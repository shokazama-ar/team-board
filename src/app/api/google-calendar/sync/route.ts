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

  // チーム設定取得
  const { data: team } = await supabase
    .from("teams")
    .select("google_refresh_token, google_calendar_id, google_sync_enabled")
    .eq("id", teamMember.team_id)
    .single();

  if (!team?.google_sync_enabled || !team.google_refresh_token || !team.google_calendar_id) {
    return NextResponse.json({ error: "Google連携が有効ではありません" }, { status: 400 });
  }

  // まだ同期されていないイベントを取得（google_event_id が NULL のもの）
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, date, end_at, location, memo, event_type_id")
    .eq("team_id", teamMember.team_id)
    .is("google_event_id", null);

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ synced: 0, message: "同期対象のイベントはありません" });
  }

  // 同期設定が false になっているevent_type IDを取得
  const { data: disabledTypes } = await supabase
    .from("event_types")
    .select("id")
    .eq("team_id", teamMember.team_id)
    .eq("google_sync_enabled", false);

  const disabledTypeIds = new Set((disabledTypes ?? []).map((t) => t.id));

  try {
    const accessToken = await getAccessToken(team.google_refresh_token);
    const calendarId = team.google_calendar_id;

    let synced = 0;
    let skipped = 0;

    for (const event of events) {
      // カテゴリ別同期設定チェック
      if (event.event_type_id && disabledTypeIds.has(event.event_type_id)) {
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
