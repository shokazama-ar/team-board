"use client";

import { Loader2, MapPin } from "lucide-react";

export type EventCardType = {
  id: string;
  name: string;
  color: string;
  kind: string;
  sort_order: number;
};

export type AttendanceSummary = {
  present: number;
  absent: number;
  undecided: number;
};

export type EventCardProps = {
  id: string;
  title: string;
  event_type?: string | null;
  date: string;
  end_at?: string | null;
  location?: string | null;
  eventTypes: EventCardType[];
  summary?: AttendanceSummary;
  isLoading?: boolean;
  onClick: () => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJst(utcStr: string): Date {
  return new Date(new Date(utcStr).getTime() + JST_OFFSET_MS);
}

function formatEventDateTime(date: string, end_at?: string | null): string {
  const start = toJst(date);
  const yy = start.getUTCFullYear();
  const mm = String(start.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(start.getUTCDate()).padStart(2, "0");
  const wd = WEEKDAYS[start.getUTCDay()];
  const hh = String(start.getUTCHours()).padStart(2, "0");
  const min = String(start.getUTCMinutes()).padStart(2, "0");

  let result = `${yy}/${mm}/${dd}(${wd}) ${hh}:${min}`;

  if (end_at) {
    const end = toJst(end_at);
    const sameDay =
      start.getUTCFullYear() === end.getUTCFullYear() &&
      start.getUTCMonth() === end.getUTCMonth() &&
      start.getUTCDate() === end.getUTCDate();
    const endHh = String(end.getUTCHours()).padStart(2, "0");
    const endMin = String(end.getUTCMinutes()).padStart(2, "0");
    if (sameDay) {
      result += ` ~ ${endHh}:${endMin}`;
    } else {
      const eyy = end.getUTCFullYear();
      const emm = String(end.getUTCMonth() + 1).padStart(2, "0");
      const edd = String(end.getUTCDate()).padStart(2, "0");
      const ewd = WEEKDAYS[end.getUTCDay()];
      result += ` ~ ${eyy}/${emm}/${edd}(${ewd}) ${endHh}:${endMin}`;
    }
  }

  return result;
}

export function EventCard({
  title,
  event_type,
  date,
  end_at,
  location,
  eventTypes,
  summary,
  isLoading,
  onClick,
}: EventCardProps) {
  const sortedTypes = [...eventTypes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "type" ? -1 : 1;
    return a.sort_order - b.sort_order;
  });

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm cursor-pointer${isLoading ? " opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* 1行目: タイトル + バッジ */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            {sortedTypes.length > 0
              ? sortedTypes.map((et) =>
                  et.kind === "type" ? (
                    <span
                      key={et.id}
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: et.color + "20", color: et.color }}
                    >
                      {et.name}
                    </span>
                  ) : (
                    <span
                      key={et.id}
                      className="rounded border px-2 py-0.5 text-xs font-medium"
                      style={{ borderColor: et.color, color: et.color }}
                    >
                      {et.name}
                    </span>
                  )
                )
              : event_type && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    {event_type}
                  </span>
                )}
          </div>
          {/* 2行目: 日時 */}
          <p className="mt-1 text-xs text-gray-500">
            {formatEventDateTime(date, end_at)}
          </p>
          {/* 場所 */}
          {location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
              {location}
            </p>
          )}
        </div>
        {/* 右端: 出欠サマリ + スピナー */}
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {summary && (
            <div className="flex gap-2 text-xs">
              <span className="text-green-700">{summary.present}</span>
              <span className="text-gray-400">/</span>
              <span className="text-red-700">{summary.absent}</span>
              <span className="text-gray-400">/</span>
              <span className="text-yellow-700">{summary.undecided}</span>
            </div>
          )}
          {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </div>
      </div>
    </div>
  );
}
