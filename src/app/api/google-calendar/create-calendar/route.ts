import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessToken, createCalendar, setCalendarGroupAccess } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { category_id, calendar_name } = body as {
    category_id: string;
    calendar_name: string;
  };

  if (!category_id || !calendar_name) {
    return NextResponse.json(
      { error: "category_id と calendar_name が必要です" },
      { status: 400 }
    );
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
    .select("google_refresh_token, google_sync_enabled, google_group_email")
    .eq("id", teamMember.team_id)
    .single();

  if (!team?.google_sync_enabled || !team.google_refresh_token) {
    return NextResponse.json(
      { error: "Google連携が有効ではありません" },
      { status: 400 }
    );
  }

  const googleGroupEmail = (team as unknown as { google_group_email: string | null }).google_group_email;
  if (!googleGroupEmail) {
    return NextResponse.json(
      { error: "Googleグループが設定されていません" },
      { status: 400 }
    );
  }

  // カテゴリがチームに属しているか確認
  const { data: category } = await supabase
    .from("event_types")
    .select("id, kind")
    .eq("id", category_id)
    .eq("team_id", teamMember.team_id)
    .eq("kind", "category")
    .single();

  if (!category) {
    return NextResponse.json(
      { error: "カテゴリが見つかりません" },
      { status: 404 }
    );
  }

  try {
    const accessToken = await getAccessToken(team.google_refresh_token);
    const calendarId = await createCalendar(accessToken, calendar_name);

    // Google グループにカレンダーの読み取り権限を付与
    await setCalendarGroupAccess(accessToken, calendarId, googleGroupEmail);

    // event_types の google_calendar_id を更新
    const { error: updateError } = await supabase
      .from("event_types")
      .update({ google_calendar_id: calendarId })
      .eq("id", category_id);

    if (updateError) {
      throw new Error(`DB更新失敗: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, calendar_id: calendarId });
  } catch (err) {
    console.error("create-calendar error:", err);
    return NextResponse.json(
      { error: "カレンダー作成に失敗しました" },
      { status: 500 }
    );
  }
}
