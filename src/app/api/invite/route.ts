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

  // member_profiles!inner 経由で確認（team_members.user_id が NULL の場合も対応）
  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, member_profiles!inner(user_id)")
    .eq("team_id", teamId)
    .eq("member_profiles.user_id", user.id)
    .limit(1);

  if (!memberships || memberships.length === 0 || memberships[0].role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Admin API で招待メール送信
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // PKCE フローでは /auth/callback でコード交換してから /auth/accept-invite へ
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${process.env.VERCEL_URL}`;
  const redirectTo = `${siteUrl}/auth/callback?next=/accept-invite`;

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
