import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAccessToken,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  toGoogleCalendarEvent,
} from "@/lib/google-calendar";

type SyncAction = "create" | "update" | "delete";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { event_id, action } = body as { event_id: string; action: SyncAction };

  if (!event_id || !action) {
    return NextResponse.json({ error: "event_id と action が必要です" }, { status: 400 });
  }

  // チームメンバー確認
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .single();

  if (!teamMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // チーム設定取得
  const { data: team } = await supabase
    .from("teams")
    .select("google_refresh_token, google_calendar_id, google_sync_enabled")
    .eq("id", teamMember.team_id)
    .single();

  if (!team?.google_sync_enabled || !team.google_refresh_token || !team.google_calendar_id) {
    // 連携が無効なためスキップ
    return NextResponse.json({ skipped: true });
  }

  // イベント取得
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, date, end_at, location, memo, google_event_id, event_type_id"
    )
    .eq("id", event_id)
    .eq("team_id", teamMember.team_id)
    .single();

  if (!event && action !== "delete") {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  // カレンダーIDの決定（カテゴリのcalendar_idがあればそちらを使用、なければチームのcalendar_idにフォールバック）
  let calendarId: string | null = team.google_calendar_id;

  if (event?.event_type_id) {
    const { data: eventType } = await supabase
      .from("event_types")
      .select("google_sync_enabled, google_calendar_id")
      .eq("id", event.event_type_id)
      .single();

    // deleteアクション以外は同期無効チェックを行う（削除は同期無効でも実行する）
    if (action !== "delete" && eventType?.google_sync_enabled === false) {
      return NextResponse.json({ skipped: true, reason: "event_type sync disabled" });
    }
    if (eventType?.google_calendar_id) {
      calendarId = eventType.google_calendar_id;
    }
  }

  if (!calendarId) {
    return NextResponse.json({ skipped: true, reason: "no calendar configured" });
  }

  try {
    const accessToken = await getAccessToken(team.google_refresh_token);

    if (action === "create") {
      const gcalEvent = toGoogleCalendarEvent(event!);
      const googleEventId = await createGoogleEvent(accessToken, calendarId, gcalEvent);
      await supabase
        .from("events")
        .update({ google_event_id: googleEventId })
        .eq("id", event_id);

      return NextResponse.json({ success: true, google_event_id: googleEventId });
    }

    if (action === "update") {
      const gcalEvent = toGoogleCalendarEvent(event!);
      if (event!.google_event_id) {
        await updateGoogleEvent(accessToken, calendarId, event!.google_event_id, gcalEvent);
      } else {
        // google_event_idがない場合は新規作成
        const googleEventId = await createGoogleEvent(accessToken, calendarId, gcalEvent);
        await supabase
          .from("events")
          .update({ google_event_id: googleEventId })
          .eq("id", event_id);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      // eventがない場合でも google_event_id をDBから直接取得して削除
      let googleEventId: string | null = event?.google_event_id ?? null;

      if (!googleEventId) {
        // すでにDBから消えている可能性があるため、スキップ
        return NextResponse.json({ skipped: true, reason: "no google_event_id" });
      }

      await deleteGoogleEvent(accessToken, calendarId, googleEventId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "不明なaction" }, { status: 400 });
  } catch (err) {
    console.error("Google Calendar sync error:", err);
    return NextResponse.json(
      { error: "Google Calendar同期に失敗しました" },
      { status: 500 }
    );
  }
}
