import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

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

  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, member_profiles!inner(user_id)")
    .eq("team_id", teamId)
    .eq("member_profiles.user_id", user.id)
    .limit(1);

  if (!memberships || memberships.length === 0 || memberships[0].role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // team_invitations レコードを作成
  const { data: invitation, error: invErr } = await adminClient
    .from("team_invitations")
    .insert({ team_id: teamId, email, invited_by: user.id })
    .select("id")
    .single();

  if (invErr || !invitation) {
    return NextResponse.json({ error: "invitation_create_failed" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${process.env.VERCEL_URL}`;
  const redirectTo = `${siteUrl}/auth/callback?next=/accept-invite&invitation_token=${invitation.id}`;

  // チーム名を取得（メール本文用）
  const { data: team } = await adminClient
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .single();
  const teamName = team?.name ?? "チーム";

  // まず新規ユーザー向け inviteUserByEmail を試みる
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (!inviteError) {
    return NextResponse.json({ ok: true });
  }

  if (!inviteError.message.includes("already registered")) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  // 既存ユーザー: generateLink でマジックリンクを生成し Resend で送信
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (linkError || !linkData) {
    console.error("[invite] generateLink failed:", linkError);
    return NextResponse.json({ error: "link_generate_failed" }, { status: 500 });
  }

  const actionLink = linkData.properties.action_link;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    console.error("[invite] RESEND_FROM_EMAIL is not set");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: resendError } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `【${teamName}】チームへの招待`,
    html: `
      <p>チーム「${teamName}」へのご招待です。</p>
      <p>以下のリンクをクリックしてチームに参加してください。</p>
      <p><a href="${actionLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">チームに参加する</a></p>
      <p style="color:#6b7280;font-size:12px;">このリンクの有効期限は1時間です。心当たりがない場合は無視してください。</p>
    `,
  });

  if (resendError) {
    console.error("[invite] resend failed:", resendError);
    return NextResponse.json({ error: "mail_send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
