import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { email, teamId } = await req.json();
  if (!email || !teamId) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  }

  // 呼び出し元ユーザーの認証・管理者確認
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (member?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Admin API で招待メール送信
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/accept-invite`;

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { team_id: teamId },
    redirectTo,
  });

  if (error) {
    // 既存ユーザーへの招待は別途案内
    if (error.message.includes("already registered")) {
      return NextResponse.json({ error: "already_registered" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
