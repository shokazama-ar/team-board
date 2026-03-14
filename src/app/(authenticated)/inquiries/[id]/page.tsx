import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ReplyForm from "./ReplyForm";

type InquiryStatus = "new" | "read" | "replied";

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "未読",
  read: "対応中",
  replied: "返信済み",
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full",
  read: "bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded-full",
  replied: "bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full",
};

function formatDateTime(dateStr: string) {
  const dt = new Date(dateStr);
  return dt.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("*, inquiry_types(name, message_template), teams(slug)")
    .eq("id", id)
    .single();

  if (!inquiry) {
    notFound();
  }

  const { data: replies } = await supabase
    .from("inquiry_replies")
    .select("*")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: true });

  // custom_fields のラベル解決
  let fieldLabels: Record<string, string> = {};
  if (inquiry.custom_fields && Object.keys(inquiry.custom_fields).length > 0) {
    const fieldIds = Object.keys(inquiry.custom_fields);
    const { data: fieldDefs } = await supabase
      .from("inquiry_form_fields")
      .select("id, field_label")
      .in("id", fieldIds);
    fieldLabels = Object.fromEntries(
      (fieldDefs ?? []).map((f: { id: string; field_label: string }) => [f.id, f.field_label])
    );
  }

  // 既読更新（Server Component の非同期処理として直接実行）
  if (inquiry.status === "new") {
    await supabase
      .from("inquiries")
      .update({ status: "read" })
      .eq("id", id)
      .eq("status", "new");
  }

  const typedStatus = inquiry.status as InquiryStatus;
  const inquiryTypes = inquiry.inquiry_types as { name: string; message_template: string | null } | null;
  const teams = inquiry.teams as { slug: string } | null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/inquiries"
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6"
      >
        <ChevronLeft strokeWidth={1.5} size={16} />
        問い合わせ一覧
      </Link>

      {/* 問い合わせ詳細カード */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        {/* ヘッダー行: ステータスバッジ + 受信日時 */}
        <div className="flex items-center justify-between mb-3">
          <span className={STATUS_STYLES[typedStatus]}>
            {STATUS_LABELS[typedStatus]}
          </span>
          <span className="text-xs text-gray-400">
            {formatDateTime(inquiry.created_at)}
          </span>
        </div>

        {/* 名前 */}
        <p className="text-xl font-semibold mb-1">{inquiry.name}</p>

        {/* メール・電話 */}
        <p className="text-sm text-gray-600">
          {inquiry.email}
          {inquiry.phone && (
            <span className="ml-3">{inquiry.phone}</span>
          )}
        </p>

        {/* 種別 */}
        {inquiryTypes?.name && (
          <p className="text-sm text-gray-500 mt-1">{inquiryTypes.name}</p>
        )}

        <hr className="my-4" />

        {/* メッセージ本文 */}
        <p className="whitespace-pre-wrap text-sm">{inquiry.message}</p>

        {/* custom_fields */}
        {inquiry.custom_fields && Object.keys(inquiry.custom_fields).length > 0 && (
          <div className="mt-4 space-y-1">
            {Object.entries(inquiry.custom_fields as Record<string, unknown>).map(([key, val]) => {
              const label = fieldLabels[key] ?? key;
              const display = Array.isArray(val) ? (val as string[]).join(", ") : String(val);
              return (
                <p key={key} className="text-sm">
                  <span className="text-gray-500">{label}: </span>
                  {display}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* スレッドセクション */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-3">返信履歴</p>

        {!replies || replies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">返信はありません</p>
        ) : (
          <div>
            {replies.map((reply: {
              id: string;
              direction: "outbound" | "inbound";
              from_name: string | null;
              body: string;
              created_at: string;
            }) => {
              const isOutbound = reply.direction === "outbound";
              return (
                <div
                  key={reply.id}
                  className={`flex mb-3 ${isOutbound ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isOutbound ? "bg-blue-50" : "bg-gray-50"
                    }`}
                  >
                    <p
                      className={`text-xs mb-1 ${
                        isOutbound ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {isOutbound
                        ? `管理者 · ${formatDateTime(reply.created_at)}`
                        : `${reply.from_name ?? "送信者"} · ${formatDateTime(reply.created_at)}`}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 返信フォーム */}
      <ReplyForm
        inquiryId={inquiry.id}
        defaultMessage={inquiryTypes?.message_template ?? ""}
        recipientEmail={inquiry.email ?? ""}
      />
    </div>
  );
}
