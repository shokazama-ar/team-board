// WARNING: SUPABASE_SERVICE_ROLE_KEY が .env.local に存在しません。
// Supabase ダッシュボード → Settings → API → service_role キーを取得し、
// .env.local に SUPABASE_SERVICE_ROLE_KEY=<key> を追加してください。
// このキーがないと supabaseAdmin の RLS バイパスが機能しません。

import { createClient } from "@supabase/supabase-js";

// サービスロールクライアント（RLS バイパス用）
const supabaseAdmin = createClient(
  process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

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

    // inquiry_replies に保存（inbound）
    await supabaseAdmin.from("inquiry_replies").insert({
      inquiry_id: inquiryId,
      direction: "inbound",
      from_name: data.from_name ?? null,
      from_email: data.from ?? null,
      body: data.text ?? data.html ?? "",
    });

    // status が replied でない場合のみ read に更新
    await supabaseAdmin
      .from("inquiries")
      .update({ status: "read" })
      .eq("id", inquiryId)
      .neq("status", "replied");

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Resend inbound webhook error:", err);
    return Response.json({ ok: true }); // エラーでも 200 を返す（Resend リトライ防止）
  }
}
