"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ChevronRight, MapPin } from "lucide-react";

type AnnouncementCategory = {
  id: string;
  name: string;
  color: string;
};

export type EventWithCategories = {
  id: string;
  title: string;
  event_type: string;
  date: string;
  location: string | null;
  categories: { id: string; name: string; color: string }[];
};

export type AnnouncementWithCategories = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  categories: AnnouncementCategory[];
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  game: "試合",
  other: "その他",
};

const EVENT_TYPE_STYLES: Record<string, string> = {
  practice: "bg-green-50 text-green-700",
  game: "bg-red-50 text-red-700",
  other: "bg-gray-100 text-gray-600",
};

type Props = {
  allUpcomingEvents: EventWithCategories[];
  answeredEventIds: string[];
  announcements: AnnouncementWithCategories[];
  userCategoryIds: string[];
};

export default function DashboardFilteredContent({
  allUpcomingEvents,
  answeredEventIds,
  announcements,
  userCategoryIds,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const hasCategories = userCategoryIds.length > 0;

  const filterEvents = (events: EventWithCategories[]) => {
    if (showAll || !hasCategories) return events;
    return events.filter(
      (e) =>
        e.categories.length === 0 ||
        e.categories.some((cat) => userCategoryIds.includes(cat.id))
    );
  };

  const filteredEvents = filterEvents(allUpcomingEvents);
  const upcomingEvents = filteredEvents.slice(0, 5);

  const answeredSet = new Set(answeredEventIds);
  const unansweredEvents = filteredEvents.filter((e) => !answeredSet.has(e.id));

  const filteredAnnouncements =
    showAll || !hasCategories
      ? announcements
      : announcements.filter(
          (a) =>
            a.categories.length === 0 ||
            a.categories.some((cat) => userCategoryIds.includes(cat.id))
        );

  return (
    <>
      {/* Category filter toggle */}
      {hasCategories && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="text-xs text-gray-500">
            {showAll ? "すべてのカテゴリを表示中" : "自分のカテゴリのみ"}
          </span>
          <button
            onClick={() => setShowAll((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              showAll ? "bg-blue-600" : "bg-gray-300"
            }`}
            aria-label="すべてのカテゴリを表示"
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                showAll ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-xs text-gray-400">すべて</span>
        </div>
      )}

      {/* Unanswered Events Warning */}
      {unansweredEvents.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="mb-3 flex items-center text-lg font-semibold text-yellow-900">
            <AlertTriangle size={20} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
            未回答のイベントがあります
          </h2>
          <ul className="space-y-2">
            {unansweredEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block text-sm text-yellow-900 hover:text-yellow-700"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{event.title}</span>
                    {event.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="rounded border px-2 py-0.5 text-xs font-medium"
                        style={{ borderColor: cat.color, color: cat.color }}
                      >
                        {cat.name}
                      </span>
                    ))}
                    <span className="text-xs text-yellow-700">
                      {new Date(event.date).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Upcoming Events */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              直近のイベント
              {upcomingEvents.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">{upcomingEvents.length}件</span>
              )}
            </h2>
            <Link href="/events" className="text-sm text-blue-600 hover:text-blue-700">
              すべて見る <ChevronRight size={16} strokeWidth={1.5} className="inline" aria-hidden="true" />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">まだイベントがありません</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((ev) => (
                <li key={ev.id}>
                  <Link
                    href={`/events/${ev.id}`}
                    className="block rounded-lg border border-gray-100 p-3 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium">{ev.title}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_STYLES[ev.event_type] ?? EVENT_TYPE_STYLES.other}`}
                          >
                            {EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                          </span>
                          {ev.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="rounded border px-2 py-0.5 text-xs font-medium"
                              style={{ borderColor: cat.color, color: cat.color }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(ev.date).toLocaleDateString("ja-JP", {
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {ev.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
                            {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Latest Announcements */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">最新のお知らせ</h2>
            <Link href="/announcements" className="text-sm text-blue-600 hover:text-blue-700">
              すべて見る <ChevronRight size={16} strokeWidth={1.5} className="inline" aria-hidden="true" />
            </Link>
          </div>
          {filteredAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-500">まだお知らせがありません</p>
          ) : (
            <ul className="space-y-3">
              {filteredAnnouncements.map((announcement) => (
                <li key={announcement.id}>
                  <Link
                    href={`/announcements/${announcement.id}`}
                    className="block rounded-lg border border-gray-100 p-3 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="text-sm font-medium">{announcement.title}</h3>
                      {announcement.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="rounded border px-2 py-0.5 text-xs font-medium shrink-0"
                          style={{ borderColor: cat.color, color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {announcement.body.slice(0, 50)}
                      {announcement.body.length > 50 ? "..." : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(announcement.created_at).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
