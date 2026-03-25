"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  inquiryId: string;
  currentStatus: string;
};

export default function MarkDoneButton({ inquiryId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentStatus !== "replied" && currentStatus !== "pending") {
    return null;
  }

  if (isDone) {
    return null;
  }

  async function handleClick() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("inquiries")
      .update({ status: "done" })
      .eq("id", inquiryId);

    if (updateError) {
      setError("更新に失敗しました");
      setLoading(false);
      return;
    }

    setIsDone(true);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
      >
        {loading && <Loader2 strokeWidth={1.5} size={14} className="animate-spin" />}
        {loading ? "処理中..." : "完了にする"}
      </button>
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </div>
  );
}
