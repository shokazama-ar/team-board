// WARNING: SUPABASE_SERVICE_ROLE_KEY が .env.local に存在しません。
// Supabase ダッシュボード → Settings → API → service_role キーを取得し、
// .env.local に SUPABASE_SERVICE_ROLE_KEY=<key> を追加してください。
// このキーがないと supabaseAdmin の RLS バイパスが機能しません。

import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";

// サービスロールクライアント（RLS バイパス用）
const supabaseAdmin = createClient(
  process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // 署名検証
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RESEND_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const rawBody = await req.text();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    // Resend Inbound のペイロード形式
    // {
    //   "type": "email.received",
    //   "data": {
    //     "from": "user@example.com",
    //     "to": ["reply+{uuid}@minibas.ballershub.net"],
    //     "subject": "Re: ...",
    //     "text": "返信本文",
    //     "html": "<p>返信本文</p>",
    //     "from_name": "ユーザー名"  // 存在しない場合もある
    //   }
    // }

    const data = payload?.data ?? payload; // ペイロード形式の違いを吸収

    // to アドレスから inquiry-id を抽出
    const toAddresses: string[] = Array.isArray(data.to) ? data.to : [data.to];
    let inquiryId: string | null = null;
    for (const addr of toAddresses) {
      const match = addr.match(
        /^reply\+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@/i
      );
      if (match) {
        inquiryId = match[1];
        break;
      }
    }

    if (!inquiryId) {
      console.log("No inquiry ID found in to address:", toAddresses);
      return Response.json({ ok: true }); // 200 を返す（Resend がリトライしないよう）
    }

    // inquiry の存在確認
    const { data: inquiry } = await supabaseAdmin
      .from("inquiries")
      .select("id")
      .eq("id", inquiryId)
      .single();

    if (!inquiry) {
      console.log("Inquiry not found:", inquiryId);
      return Response.json({ ok: true });
    }

    // from フィールドから name と email を分離
    // 形式: "山田太郎 <taro@example.com>" または "taro@example.com"
    const rawFrom: string = data.from ?? "";
    const fromMatch = rawFrom.match(/^(.*?)\s*<([^>]+)>$/);
    const fromName = fromMatch ? fromMatch[1].trim() || null : null;
    const fromEmail = fromMatch ? fromMatch[2] : rawFrom;

    // email_id で Resend API から本文を取得
    const emailId: string | undefined = data.email_id;
    let body = "";

    if (emailId) {
      const resendRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
      });
      if (resendRes.ok) {
        const emailDetail = await resendRes.json();
        body = emailDetail.text ?? emailDetail.html ?? "";
      } else {
        console.error("Resend API fetch failed:", resendRes.status, await resendRes.text());
      }
    } else {
      // email_id がない場合はフォールバック
      body = data.text ?? data.html ?? "";
    }

    // inquiry_replies に保存（inbound）
    const { error: insertError } = await supabaseAdmin.from("inquiry_replies").insert({
      inquiry_id: inquiryId,
      direction: "inbound",
      from_name: fromName,
      from_email: fromEmail,
      body,
    });

    if (insertError) {
      console.error("inquiry_replies insert error (inbound):", insertError, { inquiryId });
      // Resend へは 200 を返すが、内部エラーはログに残す
      return Response.json({ ok: true });
    }

    // status を new に更新
    await supabaseAdmin
      .from("inquiries")
      .update({ status: "new" })
      .eq("id", inquiryId);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Resend inbound webhook error:", err);
    return Response.json({ ok: true }); // エラーでも 200 を返す（Resend リトライ防止）
  }
}
