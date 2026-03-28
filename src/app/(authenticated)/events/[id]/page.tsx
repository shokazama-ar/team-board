"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Clock, MapPin, Check, X, HelpCircle, Loader2 } from "lucide-react";

type EventType = {
  id: string;
  name: string;
  color: string;
  kind: string;
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

type AttendanceStatus = "present" | "absent" | "undecided";

// My profile (one auth user may have multiple)
type MyProfile = {
  profile_id: string;
  name: string | null;
  kind: "coach" | "player" | "guardian";
  status: AttendanceStatus | null;
};

// All members in the team for the attendance list
type MemberAttendance = {
  profile_id: string;
  name: string | null;
  kind: "coach" | "player";
  number: string | null;
  status: AttendanceStatus | null;
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
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // My profiles for attendance
  const [myProfiles, setMyProfiles] = useState<MyProfile[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null); // profile_id being submitted

  // All members' attendance
  const [coaches, setCoaches] = useState<MemberAttendance[]>([]);
  const [players, setPlayers] = useState<MemberAttendance[]>([]);

  // Attendance list tab (coach sees both tabs, player sees only player)
  const [activeTab, setActiveTab] = useState<"player" | "coach">("player");

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: eventData } = await supabase
      .from("events")
      .select("id, team_id, title, event_type, date, end_at, location, memo, created_by, created_at, event_event_types(event_types(id, name, color, kind))")
      .eq("id", eventId)
      .single();

    if (!eventData) {
      setLoading(false);
      return;
    }
    setEvent(eventData as unknown as EventDetail);

    // Parallel fetch: myMemberships, profile, attendances, teamMembers, linkedAccess
    const [
      { data: myMemberships },
      { data: profile },
      { data: attendances },
      { data: teamMembers },
      { data: linkedAccess },
    ] = await Promise.all([
      supabase
        .from("team_members")
        .select("role, member_profile_id, member_profiles!inner(user_id, kind)")
        .eq("team_id", eventData.team_id)
        .eq("member_profiles.user_id", user.id),
      supabase
        .from("profiles")
        .select("name, email")
        .eq("id", eventData.created_by)
        .single(),
      supabase
        .from("attendances")
        .select("member_profile_id, status")
        .eq("event_id", eventId),
      supabase
        .from("team_members")
        .select("member_profile_id, member_profiles(user_id, kind, name, number)")
        .eq("team_id", eventData.team_id),
      supabase
        .from("member_profile_access")
        .select("member_profile_id"),
    ]);

    if (myMemberships && myMemberships.length > 0) {
      const roles = myMemberships.map((m) => m.role);
      setCurrentUserRole(roles.includes("admin") ? "admin" : "member");

      // Is this user a coach (in any of their profiles)?
      const hasCoach = myMemberships.some((m) => {
        const mp = m.member_profiles as unknown as { user_id: string; kind: string } | null;
        return mp?.kind === "coach";
      });
      setIsCoach(hasCoach);
    }

    if (profile) setCreatorName(profile.name || profile.email);

    const attendanceMap = new Map<string, AttendanceStatus>();
    if (attendances) {
      for (const a of attendances) {
        attendanceMap.set(a.member_profile_id, a.status as AttendanceStatus);
      }
    }

    if (teamMembers) {
      const allMembers: MemberAttendance[] = teamMembers.map((tm) => {
        const mp = tm.member_profiles as unknown as {
          user_id: string;
          kind: "coach" | "player";
          name: string | null;
          number: string | null;
        } | null;
        return {
          profile_id: tm.member_profile_id,
          name: mp?.name ?? null,
          kind: mp?.kind ?? "player",
          number: mp?.number ?? null,
          status: attendanceMap.get(tm.member_profile_id) ?? null,
        };
      });

      setCoaches(allMembers.filter((m) => m.kind === "coach"));
      setPlayers(allMembers.filter((m) => m.kind === "player"));

      // My profiles = profiles owned by current user OR linked via member_profile_access
      const linkedProfileIds = new Set((linkedAccess ?? []).map((r) => r.member_profile_id));
      const mine: MyProfile[] = teamMembers
        .filter((tm) => {
          const mp = tm.member_profiles as unknown as { user_id: string; kind: string; name: string | null; number: string | null } | null;
          return mp?.user_id === user.id || linkedProfileIds.has(tm.member_profile_id);
        })
        .map((tm) => {
          const mp = tm.member_profiles as unknown as { user_id: string; kind: "coach" | "player" | "guardian"; name: string | null; number: string | null } | null;
          return {
            profile_id: tm.member_profile_id,
            name: mp?.name ?? null,
            kind: mp?.kind ?? "player",
            status: attendanceMap.get(tm.member_profile_id) ?? null,
          };
        });
      setMyProfiles(mine);
    }

    setLoading(false);
  }, [supabase, eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAttendance = async (profileId: string, status: AttendanceStatus) => {
    if (submitting) return;
    setSubmitting(profileId);

    const { error } = await supabase
      .from("attendances")
      .upsert(
        { event_id: eventId, member_profile_id: profileId, status },
        { onConflict: "event_id,member_profile_id" }
      );

    if (!error) {
      setMyProfiles((prev) =>
        prev.map((p) => (p.profile_id === profileId ? { ...p, status } : p))
      );
      const updater = (prev: MemberAttendance[]) =>
        prev.map((m) => (m.profile_id === profileId ? { ...m, status } : m));
      setCoaches(updater);
      setPlayers(updater);
    }

    setSubmitting(null);
  };

  const handleDelete = async () => {
    if (!event) return;
    const confirmed = window.confirm("このイベントを削除しますか？");
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (!error) router.push("/events");
    setDeleting(false);
  };

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;
  if (!event) return <div className="text-sm text-gray-500">イベントが見つかりません</div>;

  const canEdit = currentUserRole === "admin" || event.created_by === currentUserId;

  const countOf = (list: MemberAttendance[], s: AttendanceStatus) =>
    list.filter((m) => m.status === s).length;
  const noAnswer = (list: MemberAttendance[]) =>
    list.filter((m) => m.status === null).length;

  // Separate summaries for players and coaches
  const playerSummary = {
    present: countOf(players, "present"),
    absent: countOf(players, "absent"),
    undecided: countOf(players, "undecided"),
    noAnswer: noAnswer(players),
  };
  const coachSummary = {
    present: countOf(coaches, "present"),
    absent: countOf(coaches, "absent"),
    undecided: countOf(coaches, "undecided"),
    noAnswer: noAnswer(coaches),
  };

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
                    className={et!.kind === "category" ? "rounded border px-2 py-0.5 text-xs font-medium" : "rounded-full px-2 py-0.5 text-xs font-medium"}
                    style={et!.kind === "category"
                      ? { borderColor: et!.color, color: et!.color }
                      : { backgroundColor: et!.color + "20", color: et!.color }}
                  >
                    {et!.name}
                  </span>
                ))}
            </div>
          </div>
          {canEdit && (
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/events/${event.id}/edit`}
                aria-label="編集"
                className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
              >
                <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                aria-label="削除"
                className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <dl className="space-y-3">
          <div>
            <dt className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} strokeWidth={1.5} aria-hidden="true" />日時
            </dt>
            <dd className="text-sm text-gray-900">
              {new Date(event.date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Tokyo",
              })}
              {event.end_at && (
                <span className="text-gray-500">
                  {" 〜 "}
                  {new Date(event.end_at).toLocaleDateString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Tokyo",
                  })}
                </span>
              )}
            </dd>
          </div>
          {event.location && (
            <div>
              <dt className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />場所
              </dt>
              <dd className="text-sm text-gray-900">{event.location}</dd>
            </div>
          )}
          {event.memo && (
            <div>
              <dt className="text-xs text-gray-500">メモ</dt>
              <dd className="whitespace-pre-wrap text-sm text-gray-900">{event.memo}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-500">作成者</dt>
            <dd className="text-sm text-gray-900">{creatorName}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">作成日</dt>
            <dd className="text-sm text-gray-900">{new Date(event.created_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}</dd>
          </div>
        </dl>
      </div>

      {/* 出欠管理セクション */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">出欠</h2>

        {/* 自分のプロファイルごとに出欠ボタン */}
        {myProfiles.length > 0 && (
          <div className="mb-5 space-y-3">
            <p className="text-sm font-medium text-gray-700">あなたの回答</p>
            {myProfiles.map((profile) => (
              <div key={profile.profile_id} className="rounded-lg bg-gray-50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-sm text-gray-600">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      profile.kind === "coach"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {profile.kind === "coach" ? "コーチ" : "選手"}
                  </span>
                  {profile.name || "名前未設定"}
                </p>
                <div className="flex gap-2">
                  {(["present", "absent", "undecided"] as const).map((status) => {
                    const StatusIcon = status === "present" ? Check : status === "absent" ? X : HelpCircle;
                    const isLoading = submitting === profile.profile_id;
                    return (
                      <button
                        key={status}
                        onClick={() => handleAttendance(profile.profile_id, status)}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                          profile.status === status
                            ? status === "present"
                              ? "border-green-500 bg-green-500 text-white"
                              : status === "absent"
                                ? "border-red-500 bg-red-500 text-white"
                                : "border-yellow-500 bg-yellow-500 text-white"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <StatusIcon size={16} strokeWidth={1.5} aria-hidden="true" />
                        )}
                        {STATUS_LABELS[status]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 集計サマリー（選手・コーチ別） */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 text-xs font-medium text-green-700">選手</span>
            <span className="text-green-700">出席 {playerSummary.present}</span>
            <span className="text-red-700">欠席 {playerSummary.absent}</span>
            <span className="text-yellow-700">未定 {playerSummary.undecided}</span>
            <span className="text-gray-400">未回答 {playerSummary.noAnswer}</span>
          </div>
          {isCoach && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 text-xs font-medium text-blue-700">コーチ</span>
              <span className="text-green-700">出席 {coachSummary.present}</span>
              <span className="text-red-700">欠席 {coachSummary.absent}</span>
              <span className="text-yellow-700">未定 {coachSummary.undecided}</span>
              <span className="text-gray-400">未回答 {coachSummary.noAnswer}</span>
            </div>
          )}
        </div>

        {/* タブ切り替え（コーチのみ表示） */}
        {isCoach && (
          <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab("player")}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeTab === "player"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              選手
            </button>
            <button
              onClick={() => setActiveTab("coach")}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeTab === "coach"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              コーチ
            </button>
          </div>
        )}

        {/* 出欠一覧 */}
        {(activeTab === "player" || !isCoach) && (
          <div className="divide-y divide-gray-100">
            {players.length === 0 ? (
              <p className="py-2 text-sm text-gray-400">選手はいません</p>
            ) : (
              players.map((member) => (
                <div key={member.profile_id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-900">
                    {member.name || "名前未設定"}
                    {member.number && (
                      <span className="ml-1.5 text-xs text-gray-400">#{member.number}</span>
                    )}
                  </span>
                  {member.status ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[member.status]}`}>
                      {STATUS_LABELS[member.status]}
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      未回答
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {isCoach && activeTab === "coach" && (
          <div className="divide-y divide-gray-100">
            {coaches.length === 0 ? (
              <p className="py-2 text-sm text-gray-400">コーチはいません</p>
            ) : (
              coaches.map((member) => (
                <div key={member.profile_id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-900">
                    {member.name || "名前未設定"}
                  </span>
                  {member.status ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[member.status]}`}>
                      {STATUS_LABELS[member.status]}
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      未回答
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
