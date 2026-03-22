"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ReplyTemplate = {
  id: string;
  title: string;
  body: string;
};

type Props = {
  inquiryId: string;
  defaultMessage?: string;
  recipientEmail: string;
  teamId: string;
};

export default function ReplyForm({ inquiryId, defaultMessage = "", recipientEmail, teamId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("inquiry_reply_templates")
      .select("id, title, body")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setTemplates(data as ReplyTemplate[]);
      });
  }, [teamId]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleMouseDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [dropdownOpen]);

  function insertTemplate(body: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newValue = message.slice(0, start) + body + message.slice(end);
    setMessage(newValue);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + body.length;
      el.focus();
    });
    setDropdownOpen(false);
  }

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
      setMessage("");
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
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">返信メッセージ</label>
          {templates.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                テンプレートを挿入
                <ChevronDown size={12} strokeWidth={2} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => insertTemplate(t.body)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <textarea
          ref={textareaRef}
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
