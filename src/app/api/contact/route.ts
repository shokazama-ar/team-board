import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_DOMAIN = "minibas.ballershub.net";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { team_id, type, inquiry_type_id, name, email, message, custom_fields } = body;

  if (!team_id || !name || !email) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const supabase = await createClient();

  const [{ data: teamName }, { data: teamSlug }] = await Promise.all([
    supabase.rpc("get_team_name", { tid: team_id }),
    supabase.rpc("get_team_slug", { tid: team_id }),
  ]);

  if (!teamName) {
    return NextResponse.json({ error: "チームが見つかりません" }, { status: 404 });
  }
  if (!teamSlug) {
    return NextResponse.json({ error: "問い合わせフォームは現在利用できません" }, { status: 403 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("inquiries")
    .insert({
      team_id,
      type: type ?? "other",
      inquiry_type_id: inquiry_type_id ?? null,
      name: name.trim(),
      email: email.trim(),

      message: message?.trim() || null,
      custom_fields: custom_fields ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("inquiry insert error:", insertError);
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 });
  }

  const from = `contact-${teamSlug}@${FROM_DOMAIN}`;
  const subject = `[${teamName}] お問い合わせを受け付けました`;

  const lines: string[] = [
    `${name} 様`,
    "",
    "お問い合わせを受け付けました。担当者よりご連絡いたします。",
    "",
    "━━━ 送信内容 ━━━━━━━━━━━━━━━━",
    `お名前: ${name}`,
    `メールアドレス: ${email}`,
  ];

  if (message) lines.push("", "メッセージ:", message);
  if (custom_fields && Object.keys(custom_fields).length > 0) {
    const fieldIds = Object.keys(custom_fields);
    const { data: fieldDefs } = await supabase
      .from("inquiry_form_fields")
      .select("id, field_label")
      .in("id", fieldIds);

    const labelMap = new Map(
      (fieldDefs ?? []).map((f) => [f.id, f.field_label])
    );

    lines.push("", "その他の項目:");
    for (const [key, val] of Object.entries(custom_fields)) {
      const label = labelMap.get(key) ?? key;
      const display = Array.isArray(val) ? (val as string[]).join(", ") : String(val);
      lines.push(`  ${label}: ${display}`);
    }
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const { error: emailError } = await resend.emails.send({
    from,
    to: email,
    replyTo: `reply+${inserted.id}@minibas.ballershub.net`,
    subject,
    text: lines.join("\n"),
  });

  if (emailError) {
    console.error("resend error:", emailError);
  }

  return NextResponse.json({ ok: true });
}
