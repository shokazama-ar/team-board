"use client";

import { useState } from "react";

type Reply = {
  id: string;
  direction: "outbound" | "inbound";
  from_name: string | null;
  body: string;
  created_at: string;
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

// "On ... wrote:" または ">" で始まる引用部分を分割
function splitQuote(body: string): { main: string; quote: string | null } {
  // "On ... wrote:" パターン
  const onWroteIdx = body.search(/\nOn .+wrote:/);
  if (onWroteIdx !== -1) {
    return {
      main: body.slice(0, onWroteIdx).trim(),
      quote: body.slice(onWroteIdx).trim(),
    };
  }

  // ">" で始まる行のパターン
  const lines = body.split("\n");
  const firstQuoteIdx = lines.findIndex((l) => l.startsWith(">"));
  if (firstQuoteIdx > 0) {
    return {
      main: lines.slice(0, firstQuoteIdx).join("\n").trim(),
      quote: lines.slice(firstQuoteIdx).join("\n").trim(),
    };
  }

  return { main: body, quote: null };
}

function ReplyBubble({ reply }: { reply: Reply }) {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const isOutbound = reply.direction === "outbound";
  const { main, quote } = splitQuote(reply.body);

  return (
    <div className={`mb-3 ${isOutbound ? "flex justify-end" : ""}`}>
      <div
        className={`rounded-lg p-3 ${
          isOutbound ? "max-w-[80%] bg-blue-50" : "w-full bg-green-50"
        }`}
      >
        <p
          className={`text-xs mb-1 ${
            isOutbound ? "text-blue-600" : "text-green-700"
          }`}
        >
          {isOutbound
            ? `管理者 · ${formatDateTime(reply.created_at)}`
            : `${reply.from_name ?? "送信者"} · ${formatDateTime(reply.created_at)}`}
        </p>
        <p className="text-sm whitespace-pre-wrap">{main}</p>
        {quote && (
          <div className="mt-2">
            <button
              onClick={() => setQuoteOpen((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {quoteOpen ? "引用を隠す" : "引用を表示"}
            </button>
            {quoteOpen && (
              <p className="mt-1 text-xs text-gray-400 whitespace-pre-wrap border-l-2 border-gray-300 pl-2">
                {quote}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReplyThread({ replies }: { replies: Reply[] }) {
  if (replies.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">返信はありません</p>
    );
  }

  return (
    <div>
      {replies.map((reply) => (
        <ReplyBubble key={reply.id} reply={reply} />
      ))}
    </div>
  );
}
