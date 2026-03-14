"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  inquiryId: string;
  defaultMessage?: string;
  recipientEmail: string;
};

export default function ReplyForm({ inquiryId, defaultMessage = "", recipientEmail }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "送信に失敗しました");
        return;
      }

      setSuccess(true);
      // 同ページのデータ再取得（遷移ではないため router.refresh() は問題なし）
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-700 mb-2">
        返信メール送信先: {recipientEmail}
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
          placeholder="返信メッセージを入力してください"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {sending && <Loader2 strokeWidth={1.5} size={16} className="animate-spin" />}
            {sending ? "送信中..." : "返信を送信"}
          </button>
          {success && (
            <span className="text-green-600 text-sm">返信を送信しました</span>
          )}
          {error && (
            <span className="text-red-600 text-sm">{error}</span>
          )}
        </div>
      </form>
    </div>
  );
}
