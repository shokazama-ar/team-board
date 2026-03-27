"use client";

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import type { ToolbarProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useRef } from "react";

const locales = { ja };
// startOfWeek は date-fns の関数をそのまま渡す（ライブラリ内部で locale を注入する）
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const messages = {
  today: "今日",
  previous: "＜",
  next: "＞",
  month: "月",
  week: "週",
  day: "日",
  agenda: "一覧",
  date: "日付",
  time: "時間",
  event: "イベント",
  noEventsInRange: "この期間にイベントはありません",
};

// カスタムツールバー: 「＜ 2026年2月 ＞」の並びで、今日ボタンは左端
type CalEvent = { id: string; title: string; event_type: string; start: Date; end: Date; color?: string };

function CustomToolbar({ date, onNavigate }: ToolbarProps<CalEvent>) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={() => onNavigate("TODAY")}
        className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        今日
      </button>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("PREV")}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ＜
        </button>
        <span className="min-w-[120px] text-center text-base font-bold text-gray-900">
          {format(date, "yyyy年M月", { locale: ja })}
        </span>
        <button
          onClick={() => onNavigate("NEXT")}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ＞
        </button>
      </div>
      {/* 今日ボタンとバランスを取るスペーサー */}
      <div className="w-[52px]" />
    </div>
  );
}

// 曜日ヘッダー: 土=青、日=赤、背景色あり
function CustomHeader({ date }: { date: Date }) {
  const day = getDay(date);
  const isSunday = day === 0;
  const isSaturday = day === 6;
  const color = isSunday ? "#dc2626" : isSaturday ? "#2563eb" : "#374151";
  const bg = isSunday ? "#fef2f2" : isSaturday ? "#eff6ff" : "#f3f4f6";
  return (
    <div style={{ padding: "6px 0", fontWeight: 600, fontSize: "13px", color, backgroundColor: bg }}>
      {format(date, "EEE", { locale: ja })}
    </div>
  );
}

const eventPropGetter = (event: CalEvent) => {
  if (event.color) {
    return {
      style: {
        backgroundColor: event.color + "25",
        color: event.color,
        border: "none",
        borderRadius: "4px",
        padding: "1px 4px",
        fontSize: "12px",
      },
    };
  }
  const colorMap: Record<string, { backgroundColor: string; color: string }> = {
    practice: { backgroundColor: "#f0fdf4", color: "#15803d" },
    game: { backgroundColor: "#fef2f2", color: "#b91c1c" },
    other: { backgroundColor: "#f3f4f6", color: "#374151" },
  };
  const style = colorMap[event.event_type] ?? colorMap.other;
  return {
    style: { ...style, border: "none", borderRadius: "4px", padding: "1px 4px", fontSize: "12px" },
  };
};

// 土曜・日曜のセル背景色
const dayPropGetter = (date: Date) => {
  const day = getDay(date);
  if (day === 0) return { style: { backgroundColor: "#fff8f8" } };
  if (day === 6) return { style: { backgroundColor: "#f5f8ff" } };
  return {};
};

type EventInput = {
  id: string;
  title: string;
  event_type: string;
  date: string;
  end_at: string | null;
  color?: string;
};

export function CalendarView({
  events,
  date,
  onNavigate,
  onSelectDate,
}: {
  events: EventInput[];
  date: Date;
  onNavigate: (date: Date) => void;
  onSelectDate?: (date: Date, events: EventInput[], position?: { x: number; y: number }) => void;
}) {
  const lastClickPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const calEvents: CalEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    event_type: e.event_type,
    color: e.color,
    start: new Date(e.date),
    end: e.end_at ? new Date(e.end_at) : new Date(new Date(e.date).getTime() + 60 * 60 * 1000),
  }));

  return (
    <div
      className="h-[520px] rounded-lg border border-gray-200 bg-white p-4"
      onClickCapture={(e) => {
        lastClickPos.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <style>{`
        .rbc-month-view .rbc-date-cell .rbc-button-link {
          cursor: pointer;
        }
        .rbc-month-view .rbc-month-row {
          min-height: 60px !important;
          max-height: 80px !important;
        }
        .rbc-month-view .rbc-row-content {
          min-height: 0 !important;
        }
        .rbc-month-view .rbc-event {
          padding: 0 2px !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
        }
        .rbc-month-view .rbc-show-more {
          font-size: 10px !important;
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={calEvents}
        date={date}
        onNavigate={onNavigate}
        defaultView={Views.MONTH}
        views={[Views.MONTH]}
        culture="ja"
        messages={messages}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        components={{
          toolbar: CustomToolbar,
          month: { header: CustomHeader },
        }}
        onSelectEvent={(event) => {
          if (onSelectDate) {
            const calEvent = event as CalEvent;
            const clickedDate = new Date(calEvent.start);
            const dayEvents = events.filter((e) => {
              const eventDate = new Date(e.date);
              return (
                eventDate.getFullYear() === clickedDate.getFullYear() &&
                eventDate.getMonth() === clickedDate.getMonth() &&
                eventDate.getDate() === clickedDate.getDate()
              );
            });
            onSelectDate(clickedDate, dayEvents, lastClickPos.current);
          }
        }}
        onShowMore={(_events, date) => {
          if (onSelectDate) {
            const dayEvents = events.filter((e) => {
              const eventDate = new Date(e.date);
              return (
                eventDate.getFullYear() === date.getFullYear() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getDate() === date.getDate()
              );
            });
            onSelectDate(date, dayEvents, lastClickPos.current);
          }
        }}
        onDrillDown={(clickedDate) => {
          if (onSelectDate) {
            const dayEvents = events.filter((e) => {
              const eventDate = new Date(e.date);
              return (
                eventDate.getFullYear() === clickedDate.getFullYear() &&
                eventDate.getMonth() === clickedDate.getMonth() &&
                eventDate.getDate() === clickedDate.getDate()
              );
            });
            onSelectDate(clickedDate, dayEvents, lastClickPos.current);
          }
        }}
        drilldownView={null}
        formats={{
          dayHeaderFormat: (date: Date) => format(date, "M月d日(EEE)", { locale: ja }),
        }}
      />
    </div>
  );
}
