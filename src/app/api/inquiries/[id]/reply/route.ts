import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { message } = await req.json();

  // 認証チェック
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  // 問い合わせ取得
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("id, name, email, team_id, teams(slug)")
    .eq("id", id)
    .single();
  if (!inquiry) return Response.json({ error: "not found" }, { status: 404 });

  const teamsData = inquiry.teams;
  const slug = (Array.isArray(teamsData) ? teamsData[0] : teamsData as { slug: string } | null)?.slug;

  // Resend でメール送信
  try {
    await resend.emails.send({
      from: `contact-${slug}@minibas.ballershub.net`,
      to: [inquiry.email],
      replyTo: `reply+${inquiry.id}@minibas.ballershub.net`,
      subject: "【ご返信】お問い合わせいただきありがとうございます",
      text: message,
    });
  } catch (e) {
    console.error("Resend error:", e);
    // メール送信失敗はログのみ。DB更新は継続
  }

  // サービスロールクライアント（inquiry_replies への INSERT は RLS により service_role のみ可）
  const supabaseAdmin = createSupabaseClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // inquiry_replies に保存
  await supabaseAdmin.from("inquiry_replies").insert({
    inquiry_id: inquiry.id,
    direction: "outbound",
    from_name: "管理者",
    from_email: `contact-${slug}@minibas.ballershub.net`,
    body: message,
  });

  // status を replied に更新
  await supabaseAdmin.from("inquiries").update({ status: "replied" }).eq("id", id);

  return Response.json({ success: true });
}
