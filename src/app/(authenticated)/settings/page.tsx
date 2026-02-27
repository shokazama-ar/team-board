"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw, Trash2, AlertTriangle, Plus, X } from "lucide-react";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

type EventType = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

const PRESET_COLORS = [
  { label: "緑", value: "#16a34a" },
  { label: "赤", value: "#dc2626" },
  { label: "青", value: "#2563eb" },
  { label: "紫", value: "#9333ea" },
  { label: "オレンジ", value: "#ea580c" },
  { label: "ピンク", value: "#db2777" },
  { label: "水色", value: "#0891b2" },
  { label: "グレー", value: "#6b7280" },
];

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  // Profile state
  const [userId, setUserId] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Team state
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamIconUrl, setTeamIconUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamMessage, setTeamMessage] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  // Event types state
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#16a34a");
  const [addingType, setAddingType] = useState(false);
  const [eventTypeMessage, setEventTypeMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setName(profile.name ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
      }

      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membership) {
        setIsAdmin(membership.role === "admin");
        setTeamId(membership.team_id);

        const { data: team } = await supabase
          .from("teams")
          .select("name, invite_code, icon_url")
          .eq("id", membership.team_id)
          .single();

        if (team) {
          setTeamName(team.name);
          setInviteCode(team.invite_code);
          setTeamIconUrl(team.icon_url ?? null);
        }

        const { data: types } = await supabase
          .from("event_types")
          .select("id, name, color, sort_order")
          .eq("team_id", membership.team_id)
          .order("sort_order");

        if (types) setEventTypes(types);
      }

      setLoading(false);
    };
    loadData();
  }, [supabase]);

  const handleAvatarUploaded = async (url: string) => {
    if (!userId) return;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    setAvatarUrl(url);
  };

  const handleTeamIconUploaded = async (url: string) => {
    if (!teamId) return;
    await supabase.from("teams").update({ icon_url: url }).eq("id", teamId);
    setTeamIconUrl(url);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);

    if (error) {
      setMessage("保存に失敗しました");
    } else {
      setMessage("保存しました");
    }
    setSaving(false);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !teamName.trim()) return;
    setSavingTeam(true);
    setTeamMessage("");

    const { error } = await supabase
      .from("teams")
      .update({ name: teamName.trim() })
      .eq("id", teamId);

    if (error) {
      setTeamMessage("保存に失敗しました");
    } else {
      setTeamMessage("保存しました");
    }
    setSavingTeam(false);
  };

  const handleRegenerateCode = async () => {
    if (!teamId) return;
    const confirmed = window.confirm(
      "招待コードを再生成すると、以前のコードは無効になります。よろしいですか？"
    );
    if (!confirmed) return;

    setRegenerating(true);
    setTeamMessage("");

    const { data: newCode, error } = await supabase.rpc(
      "regenerate_invite_code",
      { target_team_id: teamId }
    );

    if (error) {
      setTeamMessage("再生成に失敗しました");
    } else {
      setInviteCode(newCode);
      setTeamMessage("招待コードを再生成しました");
    }
    setRegenerating(false);
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;
    const confirmed = window.confirm(
      "チームを削除すると、すべてのメンバー・イベント・お知らせも削除されます。本当に削除しますか？"
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "この操作は取り消せません。本当に削除しますか？"
    );
    if (!doubleConfirm) return;

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      setTeamMessage("削除に失敗しました");
    } else {
      router.push("/teams/setup");
    }
  };

  const handleAddEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !newTypeName.trim()) return;
    setAddingType(true);
    setEventTypeMessage("");

    const maxOrder = eventTypes.reduce((max, t) => Math.max(max, t.sort_order), -1);
    const { data, error } = await supabase
      .from("event_types")
      .insert({
        team_id: teamId,
        name: newTypeName.trim(),
        color: newTypeColor,
        sort_order: maxOrder + 1,
      })
      .select("id, name, color, sort_order")
      .single();

    if (error) {
      setEventTypeMessage(
        error.message.includes("unique") ? "同じ名前の種別がすでに存在します" : "追加に失敗しました"
      );
    } else if (data) {
      setEventTypes((prev) => [...prev, data]);
      setNewTypeName("");
      setEventTypeMessage("追加しました");
    }
    setAddingType(false);
  };

  const handleDeleteEventType = async (typeId: string) => {
    const confirmed = window.confirm("この種別を削除しますか？");
    if (!confirmed) return;

    const { error } = await supabase
      .from("event_types")
      .delete()
      .eq("id", typeId);

    if (error) {
      setEventTypeMessage("削除に失敗しました");
    } else {
      setEventTypes((prev) => prev.filter((t) => t.id !== typeId));
      setEventTypeMessage("削除しました");
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">設定</h1>

      {/* Profile Settings */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="flex items-center gap-4">
          {userId && (
            <AvatarUpload
              currentUrl={avatarUrl}
              bucket="avatars"
              folderPath={userId}
              size={72}
              onUploaded={handleAvatarUploaded}
            />
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">プロフィール画像</p>
            <p className="text-xs text-gray-400">クリックして変更</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            名前
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.includes("失敗")
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </form>

      {/* Team Settings (admin only) */}
      {isAdmin && teamId && (
        <>
          <hr className="my-8 border-gray-200" />
          <h2 className="mb-4 text-lg font-semibold">チーム設定</h2>

          <div className="mb-4 flex items-center gap-4">
            {teamId && (
              <AvatarUpload
                currentUrl={teamIconUrl}
                bucket="team-icons"
                folderPath={teamId}
                size={72}
                onUploaded={handleTeamIconUploaded}
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">チームアイコン</p>
              <p className="text-xs text-gray-400">クリックして変更</p>
            </div>
          </div>

          <form onSubmit={handleSaveTeam} className="space-y-4">
            <div>
              <label
                htmlFor="teamName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                チーム名
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                招待コード
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono">
                  {inviteCode}
                </code>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw size={16} strokeWidth={1.5} aria-hidden="true" />
                  {regenerating ? "再生成中..." : "再生成"}
                </button>
              </div>
            </div>

            {teamMessage && (
              <div
                className={`rounded-md p-3 text-sm ${
                  teamMessage.includes("失敗")
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {teamMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={savingTeam || !teamName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingTeam ? "保存中..." : "チーム名を保存"}
            </button>
          </form>

          {/* Event Types Management */}
          <hr className="my-8 border-gray-200" />
          <h2 className="mb-1 text-lg font-semibold">予定の種別</h2>
          <p className="mb-4 text-sm text-gray-500">
            予定作成時に選択できる種別を管理できます
          </p>

          <div className="mb-4 space-y-2">
            {eventTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm text-gray-900">{type.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteEventType(type.id)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="削除"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            ))}
            {eventTypes.length === 0 && (
              <p className="text-sm text-gray-400">種別が登録されていません</p>
            )}
          </div>

          <form onSubmit={handleAddEventType} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                種別名
              </label>
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="例: 合宿"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                カラー
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewTypeColor(c.value)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      newTypeColor === c.value
                        ? "scale-110 border-gray-700"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.label}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {eventTypeMessage && (
              <div
                className={`rounded-md p-3 text-sm ${
                  eventTypeMessage.includes("失敗") || eventTypeMessage.includes("存在")
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {eventTypeMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={addingType || !newTypeName.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
              {addingType ? "追加中..." : "種別を追加"}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700">
              <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />
              危険な操作
            </h3>
            <p className="mb-3 text-xs text-red-600">
              チームを削除すると、すべてのデータが失われます。
            </p>
            <button
              onClick={handleDeleteTeam}
              className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
              チームを削除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
