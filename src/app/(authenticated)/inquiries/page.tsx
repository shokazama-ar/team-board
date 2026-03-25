"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type InquiryStatus = "new" | "replied" | "done" | "pending";

type Inquiry = {
  id: string;
  name: string;
  email: string;

  message: string;
  status: InquiryStatus;
  created_at: string;
  inquiry_types: { name: string } | null;
};

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "未読",
  replied: "返信済み",
  done: "完了",
  pending: "要確認",
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full",
  replied: "bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full",
  done: "bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full",
  pending: "bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full",
};

const TABS: { label: string; value: string | null }[] = [
  { label: "すべて", value: null },
  { label: "未読", value: "new" },
  { label: "要確認", value: "pending" },
  { label: "返信済み", value: "replied" },
  { label: "完了", value: "done" },
];

export default function InquiriesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [counts, setCounts] = useState({ all: 0, new: 0, replied: 0, done: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      let query = supabase
        .from("inquiries")
        .select("id, name, email, message, status, created_at, inquiry_types(name)")
        .order("created_at", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const [{ data: inquiriesData }, { data: statusCounts }] = await Promise.all([
        query,
        supabase.from("inquiries").select("status"),
      ]);

      setInquiries((inquiriesData as unknown as Inquiry[]) ?? []);
      setCounts({
        all: statusCounts?.length ?? 0,
        new: statusCounts?.filter((r) => r.status === "new").length ?? 0,
        replied: statusCounts?.filter((r) => r.status === "replied").length ?? 0,
        done: statusCounts?.filter((r) => r.status === "done").length ?? 0,
        pending: statusCounts?.filter((r) => r.status === "pending").length ?? 0,
      });
      setLoading(false);
    };
    loadData();
  }, [statusFilter]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-x-1">
          {TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count =
              tab.value === null
                ? counts.all
                : tab.value === "new"
                ? counts.new
                : tab.value === "replied"
                ? counts.replied
                : tab.value === "pending"
                ? counts.pending
                : counts.done;
            return (
              <button
                key={tab.label}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center whitespace-nowrap px-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.value !== null && (
                  <span className="ml-1.5 text-xs text-gray-500">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Inquiry list */}
      {loading ? (
        <p className="text-center text-gray-500 py-12">読み込み中...</p>
      ) : inquiries.length === 0 ? (
        <p className="text-center text-gray-500 py-12">問い合わせはありません</p>
      ) : (
        <div>
          {inquiries.map((typedInquiry) => {
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
            const isLoading = loadingId === typedInquiry.id;

            return (
              <div
                key={typedInquiry.id}
                onClick={() => {
                  setLoadingId(typedInquiry.id);
                  router.push(`/inquiries/${typedInquiry.id}`);
                }}
                className={`block rounded-lg border border-gray-200 bg-white p-4 mb-2 cursor-pointer hover:bg-gray-50 ${isLoading ? "opacity-60" : ""}`}
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{formatted}</span>
                    {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {typedInquiry.email}
                </p>
                <p className="mt-2 text-sm text-gray-700">{messagePreview}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
