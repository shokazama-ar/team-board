import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type InquiryStatus = "new" | "read" | "replied";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
  inquiry_types: { name: string } | null;
};

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

const TABS: { label: string; value: string | null }[] = [
  { label: "すべて", value: null },
  { label: "未読", value: "new" },
  { label: "対応中", value: "read" },
  { label: "返信済み", value: "replied" },
];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const statusFilter = params.status ?? null;

  let query = supabase
    .from("inquiries")
    .select("id, name, email, phone, message, status, created_at, inquiry_types(name)")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const [{ data: inquiries }, { data: statusCounts }] = await Promise.all([
    query,
    supabase.from("inquiries").select("status"),
  ]);

  const counts = {
    all: statusCounts?.length ?? 0,
    new: statusCounts?.filter((r) => r.status === "new").length ?? 0,
    read: statusCounts?.filter((r) => r.status === "read").length ?? 0,
    replied: statusCounts?.filter((r) => r.status === "replied").length ?? 0,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">問い合わせ</h1>

      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {TABS.map((tab) => {
            const isActive = (statusFilter ?? null) === tab.value;
            const href = tab.value ? `?status=${tab.value}` : "?";
            const count =
              tab.value === null
                ? counts.all
                : tab.value === "new"
                ? counts.new
                : tab.value === "read"
                ? counts.read
                : counts.replied;
            return (
              <Link
                key={tab.label}
                href={href}
                className={`flex items-center pb-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {(tab.value === null || count > 0) && (
                  <span className="ml-1.5 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Inquiry list */}
      {!inquiries || inquiries.length === 0 ? (
        <p className="text-center text-gray-500 py-12">問い合わせはありません</p>
      ) : (
        <div>
          {inquiries.map((inquiry) => {
            const typedInquiry = inquiry as unknown as Inquiry;
            const dt = new Date(typedInquiry.created_at);
            const formatted = dt.toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            const msg = typedInquiry.message ?? "";
            const messagePreview =
              msg.length > 60
                ? msg.slice(0, 60) + "…"
                : msg;

            return (
              <Link
                key={typedInquiry.id}
                href={`/inquiries/${typedInquiry.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 mb-2 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {typedInquiry.name}
                    </span>
                    {typedInquiry.inquiry_types?.name && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {typedInquiry.inquiry_types.name}
                      </span>
                    )}
                    <span className={STATUS_STYLES[typedInquiry.status]}>
                      {STATUS_LABELS[typedInquiry.status]}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{formatted}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {typedInquiry.email}
                  {typedInquiry.phone && (
                    <span className="ml-2">{typedInquiry.phone}</span>
                  )}
                </p>
                <p className="mt-2 text-sm text-gray-700">{messagePreview}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
