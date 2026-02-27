"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw, Trash2, AlertTriangle, Plus, X, ChevronUp, ChevronDown, Pencil, Check } from "lucide-react";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

type EventTypeKind = "type" | "category";

type EventType = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  kind: EventTypeKind;
};

// イベント種別用：暖色系
const TYPE_PRESET_COLORS = [
  { label: "赤",       value: "#dc2626" },
  { label: "オレンジ", value: "#ea580c" },
  { label: "アンバー", value: "#d97706" },
  { label: "ピンク",   value: "#db2777" },
  { label: "紫",       value: "#9333ea" },
  { label: "マゼンタ", value: "#c026d3" },
];

// 対象カテゴリ用：寒色系
const CATEGORY_PRESET_COLORS = [
  { label: "青",       value: "#2563eb" },
  { label: "インジゴ", value: "#4f46e5" },
  { label: "水色",     value: "#0891b2" },
  { label: "ティール", value: "#0d9488" },
  { label: "緑",       value: "#16a34a" },
  { label: "スレート", value: "#64748b" },
];

// ── 種別/カテゴリ管理セクション（再利用） ──────────────────────────────────
type SectionProps = {
  title: string;
  description: string;
  addLabel: string;
  items: EventType[];
  colors: { label: string; value: string }[];
  onMoveUp: (index: number) => Promise<void>;
  onMoveDown: (index: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (name: string, color: string) => Promise<string>;
  onUpdate: (id: string, name: string) => Promise<string>;
};

function EventTypeSection({
  title,
  description,
  addLabel,
  items,
  colors,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAdd,
  onUpdate,
}: SectionProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(colors[0].value);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setMessage("");
    const msg = await onAdd(newName, newColor);
    setMessage(msg);
    if (msg === "追加しました") setNewName("");
    setAdding(false);
  };

  return (
    <>
      <hr className="my-8 border-gray-200" />
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-gray-500">{description}</p>

      <div className="mb-4 space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                aria-label="上へ"
              >
                <ChevronUp size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => onMoveDown(index)}
                disabled={index === items.length - 1}
                className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                aria-label="下へ"
              >
                <ChevronDown size={14} strokeWidth={2} />
              </button>
            </div>
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {editingId === item.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="flex-1 rounded border border-blue-400 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!editingName.trim() || editingName === item.name) {
                      setEditingId(null);
                      return;
                    }
                    const msg = await onUpdate(item.id, editingName);
                    if (!msg.includes("失敗") && !msg.includes("存在")) setEditingId(null);
                    else setMessage(msg);
                  }}
                  className="text-blue-500 hover:text-blue-700"
                  aria-label="保存"
                >
                  <Check size={16} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="キャンセル"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-900">{item.name}</span>
                <button
                  type="button"
                  onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="編集"
                >
                  <Pencil size={14} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="削除"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-400">登録されていません</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            名前
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={addLabel}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            カラー
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setNewColor(c.value)}
                className={`h-7 w-7 rounded-full border-2 transition-all ${
                  newColor === c.value
                    ? "scale-110 border-white ring-[3px] ring-gray-800"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
                aria-label={c.label}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.includes("失敗") || message.includes("存在")
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
          {adding ? "追加中..." : "追加"}
        </button>
      </form>
    </>
  );
}

// ── メインページ ────────────────────────────────────────────────────────────
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

  // Event types / categories state
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventCategories, setEventCategories] = useState<EventType[]>([]);

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

        const { data: allTypes } = await supabase
          .from("event_types")
          .select("id, name, color, sort_order, kind")
          .eq("team_id", membership.team_id)
          .order("sort_order");

        if (allTypes) {
          setEventTypes(allTypes.filter((t) => t.kind === "type") as EventType[]);
          setEventCategories(allTypes.filter((t) => t.kind === "category") as EventType[]);
        }
      }

      setLoading(false);
    };
    loadData();
  }, [supabase]);

  // ── Generic helpers ─────────────────────────────────────────────────────
  const moveItem = async (
    items: EventType[],
    setItems: React.Dispatch<React.SetStateAction<EventType[]>>,
    index: number,
    direction: "up" | "down"
  ) => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const a = items[index];
    const b = items[targetIdx];
    await Promise.all([
      supabase.from("event_types").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("event_types").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...a, sort_order: b.sort_order };
      next[targetIdx] = { ...b, sort_order: a.sort_order };
      return next.sort((x, y) => x.sort_order - y.sort_order);
    });
  };

  const deleteItem = async (
    id: string,
    setItems: React.Dispatch<React.SetStateAction<EventType[]>>
  ) => {
    if (!window.confirm("この項目を削除しますか？")) return;
    const { error } = await supabase.from("event_types").delete().eq("id", id);
    if (!error) setItems((prev) => prev.filter((t) => t.id !== id));
  };

  const updateItem = async (
    id: string,
    name: string,
    setItems: React.Dispatch<React.SetStateAction<EventType[]>>
  ): Promise<string> => {
    if (!name.trim()) return "";
    const { error } = await supabase
      .from("event_types")
      .update({ name: name.trim() })
      .eq("id", id);
    if (error) {
      return error.message.includes("unique") ? "同じ名前がすでに存在します" : "更新に失敗しました";
    }
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)));
    return "更新しました";
  };

  const addItem = async (
    kind: EventTypeKind,
    name: string,
    color: string,
    items: EventType[],
    setItems: React.Dispatch<React.SetStateAction<EventType[]>>
  ): Promise<string> => {
    if (!teamId || !name.trim()) return "";
    const maxOrder = items.reduce((max, t) => Math.max(max, t.sort_order), -1);
    const { data, error } = await supabase
      .from("event_types")
      .insert({ team_id: teamId, name: name.trim(), color, sort_order: maxOrder + 1, kind })
      .select("id, name, color, sort_order, kind")
      .single();
    if (error) {
      return error.message.includes("unique") ? "同じ名前がすでに存在します" : "追加に失敗しました";
    }
    if (data) setItems((prev) => [...prev, data as EventType]);
    return "追加しました";
  };

  // ── Profile handlers ────────────────────────────────────────────────────
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

    setMessage(error ? "保存に失敗しました" : "保存しました");
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

    setTeamMessage(error ? "保存に失敗しました" : "保存しました");
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

          {/* イベント種別 */}
          <EventTypeSection
            title="イベント種別"
            description="予定作成時に選択できる種別（例: 練習・試合）を管理します"
            addLabel="例: 合宿"
            items={eventTypes}
            colors={TYPE_PRESET_COLORS}
            onMoveUp={(i) => moveItem(eventTypes, setEventTypes, i, "up")}
            onMoveDown={(i) => moveItem(eventTypes, setEventTypes, i, "down")}
            onDelete={(id) => deleteItem(id, setEventTypes)}
            onAdd={(name, color) => addItem("type", name, color, eventTypes, setEventTypes)}
            onUpdate={(id, name) => updateItem(id, name, setEventTypes)}
          />

          {/* 対象カテゴリ */}
          <EventTypeSection
            title="対象カテゴリ"
            description="予定の対象（例: 全体・男子・女子）を管理します"
            addLabel="例: OB"
            items={eventCategories}
            colors={CATEGORY_PRESET_COLORS}
            onMoveUp={(i) => moveItem(eventCategories, setEventCategories, i, "up")}
            onMoveDown={(i) => moveItem(eventCategories, setEventCategories, i, "down")}
            onDelete={(id) => deleteItem(id, setEventCategories)}
            onAdd={(name, color) => addItem("category", name, color, eventCategories, setEventCategories)}
            onUpdate={(id, name) => updateItem(id, name, setEventCategories)}
          />

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
