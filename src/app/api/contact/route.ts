import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_DOMAIN = "minibas.ballershub.net";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: false,
});

export async function POST(req: NextRequest) {
  // IP取得: x-forwarded-for ヘッダー優先、なければ "unknown"
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { team_id, type, inquiry_type_id, name, email, message, custom_fields, turnstileToken } = body;

  if (!team_id || !name || !email) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  // Cloudflare Turnstile 検証
  const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const turnstileRes = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: turnstileToken ?? '',
    }),
  });
  const turnstileData = await turnstileRes.json();
  if (!turnstileData.success) {
    return NextResponse.json({ error: 'ボット認証に失敗しました' }, { status: 400 });
  }

  // 文字数バリデーション（M-1）
  if (name.length > 100) {
    return NextResponse.json({ error: "名前は100文字以内で入力してください" }, { status: 400 });
  }
  if (email.length > 255) {
    return NextResponse.json({ error: "メールアドレスは255文字以内で入力してください" }, { status: 400 });
  }
  if (message && message.length > 5000) {
    return NextResponse.json({ error: "メッセージは5,000文字以内で入力してください" }, { status: 400 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

  // custom_fields フィルタリング（M-3）
  let filteredCustomFields: Record<string, unknown> | null = null;
  if (custom_fields && Object.keys(custom_fields).length > 0) {
    if (!inquiry_type_id) {
      // inquiry_type_id が NULL の場合は custom_fields を全拒否
      filteredCustomFields = null;
    } else {
      // inquiry_form_fields に存在するIDのみを許可
      const fieldIds = Object.keys(custom_fields);
      const { data: validFields } = await supabase
        .from("inquiry_form_fields")
        .select("id")
        .eq("inquiry_type_id", inquiry_type_id)
        .in("id", fieldIds);
      const validIds = new Set((validFields ?? []).map((f: { id: string }) => f.id));
      const filtered = Object.fromEntries(
        Object.entries(custom_fields).filter(([key]) => validIds.has(key))
      );
      filteredCustomFields = Object.keys(filtered).length > 0 ? filtered : null;
    }
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
      custom_fields: filteredCustomFields,
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
  if (filteredCustomFields && Object.keys(filteredCustomFields).length > 0) {
    const fieldIds = Object.keys(filteredCustomFields);
    const { data: fieldDefs } = await supabase
      .from("inquiry_form_fields")
      .select("id, field_label")
      .in("id", fieldIds);

    const labelMap = new Map(
      (fieldDefs ?? []).map((f) => [f.id, f.field_label])
    );

    lines.push("", "その他の項目:");
    for (const [key, val] of Object.entries(filteredCustomFields)) {
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
