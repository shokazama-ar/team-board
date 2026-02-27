"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Clock, MapPin, Check, X, HelpCircle } from "lucide-react";

type EventType = {
  id: string;
  name: string;
  color: string;
};

type EventDetail = {
  id: string;
  team_id: string;
  title: string;
  event_type: string;
  date: string;
  end_at: string | null;
  location: string | null;
  memo: string | null;
  created_by: string;
  created_at: string;
  event_event_types: { event_types: EventType | null }[];
};

type Attendance = {
  user_id: string;
  status: "present" | "absent" | "undecided";
};

type MemberWithAttendance = {
  user_id: string;
  name: string;
  status: "present" | "absent" | "undecided" | null;
};

const STATUS_LABELS: Record<string, string> = {
  present: "出席",
  absent: "欠席",
  undecided: "未定",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  undecided: "bg-yellow-100 text-yellow-700",
};

export default function EventDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [creatorName, setCreatorName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<MemberWithAttendance[]>([]);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: eventData } = await supabase
      .from("events")
      .select("id, team_id, title, event_type, date, end_at, location, memo, created_by, created_at, event_event_types(event_types(id, name, color))")
      .eq("id", eventId)
      .single();

    if (!eventData) {
      setLoading(false);
      return;
    }
    setEvent(eventData as unknown as EventDetail);

    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", eventData.team_id)
      .eq("user_id", user.id)
      .single();

    if (membership) setCurrentUserRole(membership.role);

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", eventData.created_by)
      .single();

    if (profile) setCreatorName(profile.name || profile.email);

    // Load attendances
    const { data: attendances } = await supabase
      .from("attendances")
      .select("user_id, status")
      .eq("event_id", eventId);

    const attendanceMap = new Map<string, string>();
    if (attendances) {
      for (const a of attendances) {
        attendanceMap.set(a.user_id, a.status);
      }
    }

    const myAtt = attendanceMap.get(user.id);
    setMyStatus(myAtt ?? null);

    // Load team members with profiles
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("user_id, profiles(name, email)")
      .eq("team_id", eventData.team_id);

    if (teamMembers) {
      const memberList: MemberWithAttendance[] = teamMembers.map((tm: Record<string, unknown>) => {
        const p = tm.profiles as { name: string | null; email: string } | null;
        return {
          user_id: tm.user_id as string,
          name: p?.name || p?.email || "不明",
          status: (attendanceMap.get(tm.user_id as string) as Attendance["status"]) ?? null,
        };
      });
      setMembers(memberList);
    }

    setLoading(false);
  }, [supabase, eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAttendance = async (status: "present" | "absent" | "undecided") => {
    if (submitting) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("attendances")
      .upsert(
        { event_id: eventId, user_id: currentUserId, status },
        { onConflict: "event_id,user_id" }
      );

    if (!error) {
      setMyStatus(status);
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === currentUserId ? { ...m, status } : m
        )
      );
    }

    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!event) return;
    const confirmed = window.confirm("このイベントを削除しますか？");
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", event.id);

    if (!error) {
      router.push("/events");
    }
    setDeleting(false);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  if (!event) {
    return <div className="text-sm text-gray-500">イベントが見つかりません</div>;
  }

  const canEdit =
    currentUserRole === "admin" || event.created_by === currentUserId;

  const presentCount = members.filter((m) => m.status === "present").length;
  const absentCount = members.filter((m) => m.status === "absent").length;
  const undecidedCount = members.filter((m) => m.status === "undecided").length;
  const noAnswerCount = members.filter((m) => m.status === null).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/events" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          イベント一覧
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              {event.event_event_types
                .map((e) => e.event_types)
                .filter(Boolean)
                .map((et) => (
                  <span
                    key={et!.id}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: et!.color + "20", color: et!.color }}
                  >
                    {et!.name}
                  </span>
                ))}
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Link
                href={`/events/${event.id}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                編集
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                {deleting ? "削除中..." : "削除"}
              </button>
            </div>
          )}
        </div>

        <dl className="space-y-3">
          <div>
            <dt className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} strokeWidth={1.5} aria-hidden="true" />日時</dt>
            <dd className="text-sm text-gray-900">
              {new Date(event.date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {event.end_at && (
                <span className="text-gray-500">
                  {" 〜 "}
                  {new Date(event.end_at).toLocaleDateString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </dd>
          </div>

          {event.location && (
            <div>
              <dt className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} strokeWidth={1.5} aria-hidden="true" />場所</dt>
              <dd className="text-sm text-gray-900">{event.location}</dd>
            </div>
          )}

          {event.memo && (
            <div>
              <dt className="text-xs text-gray-500">メモ</dt>
              <dd className="whitespace-pre-wrap text-sm text-gray-900">
                {event.memo}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-xs text-gray-500">作成者</dt>
            <dd className="text-sm text-gray-900">{creatorName}</dd>
          </div>

          <div>
            <dt className="text-xs text-gray-500">作成日</dt>
            <dd className="text-sm text-gray-900">
              {new Date(event.created_at).toLocaleDateString("ja-JP")}
            </dd>
          </div>
        </dl>
      </div>

      {/* 出欠管理セクション */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">出欠</h2>

        {/* 自分の回答 */}
        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-600">あなたの回答</p>
          <div className="flex gap-2">
            {(["present", "absent", "undecided"] as const).map((status) => {
              const StatusIcon = status === "present" ? Check : status === "absent" ? X : HelpCircle;
              return (
                <button
                  key={status}
                  onClick={() => handleAttendance(status)}
                  disabled={submitting}
                  className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    myStatus === status
                      ? status === "present"
                        ? "border-green-500 bg-green-500 text-white"
                        : status === "absent"
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-yellow-500 bg-yellow-500 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <StatusIcon size={16} strokeWidth={1.5} aria-hidden="true" />
                  {STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 集計サマリー */}
        <div className="mb-4 flex gap-4 text-sm">
          <span className="text-green-700">出席 {presentCount}名</span>
          <span className="text-red-700">欠席 {absentCount}名</span>
          <span className="text-yellow-700">未定 {undecidedCount}名</span>
          <span className="text-gray-500">未回答 {noAnswerCount}名</span>
        </div>

        {/* メンバー別一覧 */}
        <div className="divide-y divide-gray-100">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-gray-900">{member.name}</span>
              {member.status ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[member.status]}`}
                >
                  {STATUS_LABELS[member.status]}
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  未回答
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
