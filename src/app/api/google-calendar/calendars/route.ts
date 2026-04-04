import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessToken, listCalendars } from "@/lib/google-calendar";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // チームの管理者確認 + リフレッシュトークン取得
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!teamMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: team } = await supabase
    .from("teams")
    .select("google_refresh_token")
    .eq("id", teamMember.team_id)
    .single();

  if (!team?.google_refresh_token) {
    return NextResponse.json({ error: "Google連携が必要です" }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken(team.google_refresh_token);
    const calendars = await listCalendars(accessToken);
    return NextResponse.json({ calendars });
  } catch (err) {
    console.error("calendars list error:", err);
    return NextResponse.json(
      { error: "カレンダー一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
