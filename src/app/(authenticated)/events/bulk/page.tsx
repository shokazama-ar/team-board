"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Copy, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";

type EventType = {
  id: string;
  name: string;
  color: string;
  kind: "type" | "category";
};

type DraftEvent = {
  localId: string;
  title: string;
  selectedTypeId: string | null;
  selectedCategoryIds: string[];
  date: string;
  endDate: string;
  location: string;
  memo: string;
};

type SaveResult = {
  localId: string;
  success: boolean;
  error?: string;
};

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function newDraft(): DraftEvent {
  return {
    localId: randomId(),
    title: "",
    selectedTypeId: null,
    selectedCategoryIds: [],
    date: "",
    endDate: "",
    location: "",
    memo: "",
  };
}

function isValid(draft: DraftEvent): boolean {
  return draft.title.trim() !== "" && draft.date !== "";
}

function CategorySelect({
  items,
  selectedIds,
  onToggle,
}: {
  items: EventType[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const label =
    selectedItems.length === 0
      ? "カテゴリ"
      : selectedItems.length === 1
      ? selectedItems[0].name
      : `${selectedItems.length}件選択`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <span className={selectedItems.length > 0 ? "text-gray-800" : "text-gray-400"}>{label}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 min-w-[150px] rounded-lg border border-gray-200 bg-white shadow-lg">
          {items.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  className="h-3.5 w-3.5 rounded accent-blue-600"
                />
                <span className="text-sm font-medium" style={{ color: item.color }}>
                  {item.name}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const pad = (n: number) => String(n).padStart(2, "0");
const getDatePart = (dt: string) => dt.includes("T") ? dt.split("T")[0] : "";
const getTimePart = (dt: string) => dt.includes("T") ? dt.split("T")[1] : "00:00";
const getHour = (time: string) => time ? parseInt(time.split(":")[0], 10) : 0;
const getMinute = (time: string) => time ? parseInt(time.split(":")[1], 10) : 0;

function EventCard({
  draft,
  index,
  total,
  types,
  categories,
  failed,
  locationSuggestions,
  onChange,
  onDuplicate,
  onDelete,
  onAddBelow,
}: {
  draft: DraftEvent;
  index: number;
  total: number;
  types: EventType[];
  categories: EventType[];
  failed: boolean;
  locationSuggestions: string[];
  onChange: (updated: DraftEvent) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddBelow: () => void;
}) {
  const [memoOpen, setMemoOpen] = useState(false);
  const update = (patch: Partial<DraftEvent>) => onChange({ ...draft, ...patch });

  const toggleCategory = (id: string) => {
    const next = draft.selectedCategoryIds.includes(id)
      ? draft.selectedCategoryIds.filter((x) => x !== id)
      : [...draft.selectedCategoryIds, id];
    update({ selectedCategoryIds: next });
  };

  return (
    <div className="group">
      <div
        className={`rounded-lg border bg-white p-3 transition-all ${
          failed ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      >
        {/* Row 1: タイトル | 複製ボタン | 削除ボタン */}
        <div className="mb-2 flex items-end gap-2">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="タイトル *"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="複製"
            title="複製"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Copy size={14} strokeWidth={1.5} />
          </button>
          {total > 1 && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="削除"
              title="削除"
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Row 2: イベント種別 | カテゴリ（存在する場合のみ） */}
        <div className="mb-2 flex gap-2 items-end">
          {types.length > 0 ? (
            <select
              value={draft.selectedTypeId ?? ""}
              onChange={(e) => update({ selectedTypeId: e.target.value || null })}
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <a
              href="/settings"
              className="flex-1 rounded-lg border border-dashed border-gray-300 px-2 py-1.5 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500 whitespace-nowrap text-center"
              title="設定から種別を追加できます"
            >
              種別を設定
            </a>
          )}
          {categories.length > 0 && (
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-xs text-gray-400">カテゴリ</span>
              <CategorySelect
                items={categories}
                selectedIds={draft.selectedCategoryIds}
                onToggle={toggleCategory}
              />
            </div>
          )}
        </div>

        {/* Row 3: 日付 | 開始時間 | 終了時間 */}
        <div className="mb-2 flex gap-2 items-end flex-wrap">
          {/* 日付（共通） */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">日付 *</span>
            <input
              type="date"
              value={getDatePart(draft.date)}
              required
              onChange={(e) => {
                const d = e.target.value;
                const startTime = getTimePart(draft.date);
                const endTime = getTimePart(draft.endDate);
                update({
                  date: d ? `${d}T${startTime}` : "",
                  endDate: d ? `${d}T${endTime}` : "",
                });
              }}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 開始時間 */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">開始</span>
            <div className="flex gap-1">
              <select
                value={getHour(getTimePart(draft.date))}
                onChange={(e) => {
                  const d = getDatePart(draft.date);
                  const m = getMinute(getTimePart(draft.date));
                  update({ date: d ? `${d}T${pad(+e.target.value)}:${pad(m)}` : `T${pad(+e.target.value)}:${pad(m)}` });
                }}
                className="rounded-lg border border-gray-300 px-1.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
              </select>
              <select
                value={getMinute(getTimePart(draft.date))}
                onChange={(e) => {
                  const d = getDatePart(draft.date);
                  const h = getHour(getTimePart(draft.date));
                  update({ date: d ? `${d}T${pad(h)}:${pad(+e.target.value)}` : `T${pad(h)}:${pad(+e.target.value)}` });
                }}
                className="rounded-lg border border-gray-300 px-1.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
              </select>
            </div>
          </div>

          {/* 終了時間 */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">終了</span>
            <div className="flex gap-1">
              <select
                value={getHour(getTimePart(draft.endDate))}
                onChange={(e) => {
                  const d = getDatePart(draft.date);
                  const m = getMinute(getTimePart(draft.endDate));
                  update({ endDate: d ? `${d}T${pad(+e.target.value)}:${pad(m)}` : `T${pad(+e.target.value)}:${pad(m)}` });
                }}
                className="rounded-lg border border-gray-300 px-1.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
              </select>
              <select
                value={getMinute(getTimePart(draft.endDate))}
                onChange={(e) => {
                  const d = getDatePart(draft.date);
                  const h = getHour(getTimePart(draft.endDate));
                  update({ endDate: d ? `${d}T${pad(h)}:${pad(+e.target.value)}` : `T${pad(h)}:${pad(+e.target.value)}` });
                }}
                className="rounded-lg border border-gray-300 px-1.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Row 4: 場所 */}
        <div className="mb-2">
          <input
            type="text"
            value={draft.location}
            onChange={(e) => update({ location: e.target.value })}
            list={`location-suggestions-${draft.localId}`}
            placeholder="場所（任意）"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <datalist id={`location-suggestions-${draft.localId}`}>
            {locationSuggestions.map(loc => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        {/* メモ（折りたたみ） */}
        <button
          type="button"
          onClick={() => setMemoOpen((prev) => !prev)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          {memoOpen ? (
            <ChevronUp size={13} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={13} strokeWidth={1.5} />
          )}
          メモ{draft.memo ? "（入力済み）" : ""}
        </button>
        {memoOpen && (
          <textarea
            value={draft.memo}
            onChange={(e) => update({ memo: e.target.value })}
            rows={2}
            placeholder="持ち物や注意事項など"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}

        {failed && (
          <p className="mt-2 text-xs text-red-600">この予定の保存に失敗しました</p>
        )}
      </div>

      {/* 行を追加 */}
      <div className="flex justify-center py-1">
        <button
          type="button"
          onClick={onAddBelow}
          className="flex items-center gap-1 rounded px-3 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <Plus size={12} strokeWidth={1.5} />
          行を追加
        </button>
      </div>
    </div>
  );
}

export default function BulkEventsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [teamId, setTeamId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<DraftEvent[]>([newDraft()]);
  const [saving, setSaving] = useState(false);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: tid } = await supabase.rpc("get_my_team_id");
      if (!tid) return;
      setTeamId(tid);

      const { data: myMembership } = await supabase
        .from("team_members")
        .select("role, member_profiles!inner(user_id)")
        .eq("team_id", tid)
        .eq("member_profiles.user_id", user.id)
        .limit(1)
        .single();
      const role = myMembership?.role ?? "";
      setIsAdmin(role === "admin");

      if (role !== "admin") {
        setLoading(false);
        return;
      }

      const { data: types } = await supabase
        .from("event_types")
        .select("id, name, color, kind")
        .eq("team_id", tid)
        .order("sort_order");

      if (types) setEventTypes(types as EventType[]);
      setLoading(false);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!teamId) return;
    supabase
      .from("events")
      .select("location")
      .eq("team_id", teamId)
      .not("location", "is", null)
      .neq("location", "")
      .then(({ data }) => {
        if (!data) return;
        const unique = [...new Set(data.map(d => d.location as string).filter(Boolean))].sort();
        setLocationSuggestions(unique);
      });
  }, [teamId, supabase]);

  const types = eventTypes.filter((t) => t.kind === "type");
  const categories = eventTypes.filter((t) => t.kind === "category");

  const validCount = drafts.filter(isValid).length;

  const updateDraft = useCallback((localId: string, updated: DraftEvent) => {
    setDrafts((prev) => prev.map((d) => (d.localId === localId ? updated : d)));
  }, []);

  const duplicateDraft = useCallback((index: number) => {
    setDrafts((prev) => {
      const src = prev[index];
      // Clear date part but keep time
      const timePart = src.date.includes("T") ? "T" + src.date.split("T")[1] : "";
      const duplicated: DraftEvent = {
        ...src,
        localId: randomId(),
        date: timePart ? timePart : "",
        endDate: src.endDate.includes("T") ? "T" + src.endDate.split("T")[1] : "",
      };
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
  }, []);

  const deleteDraft = useCallback((localId: string) => {
    setDrafts((prev) => prev.filter((d) => d.localId !== localId));
  }, []);

  const addDraftAt = useCallback((index: number) => {
    setDrafts((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newDraft());
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!teamId || !userId) return;
    const validDrafts = drafts.filter(isValid);
    if (validDrafts.length === 0) return;

    setSaving(true);
    setFailedIds(new Set());

    const results: SaveResult[] = await Promise.all(
      validDrafts.map(async (draft): Promise<SaveResult> => {
        const selectedType = types.find((t) => t.id === draft.selectedTypeId);

        const { data: newEvent, error: insertError } = await supabase
          .from("events")
          .insert({
            team_id: teamId,
            title: draft.title.trim(),
            event_type: selectedType?.name ?? "",
            event_type_id: draft.selectedTypeId ?? null,
            date: new Date(draft.date).toISOString(),
            end_at: draft.endDate ? new Date(draft.endDate).toISOString() : null,
            location: draft.location || null,
            memo: draft.memo || null,
            created_by: userId,
          })
          .select("id")
          .single();

        if (insertError || !newEvent) {
          return { localId: draft.localId, success: false, error: insertError?.message };
        }

        const allSelectedIds = [draft.selectedTypeId, ...draft.selectedCategoryIds].filter(
          (id): id is string => id !== null
        );
        if (allSelectedIds.length > 0) {
          const { error: linkError } = await supabase.from("event_event_types").insert(
            allSelectedIds.map((id) => ({ event_id: newEvent.id, event_type_id: id }))
          );
          if (linkError) {
            return { localId: draft.localId, success: false, error: linkError.message };
          }
        }

        return { localId: draft.localId, success: true };
      })
    );

    const failed = new Set(results.filter((r) => !r.success).map((r) => r.localId));

    if (failed.size > 0) {
      setFailedIds(failed);
      // Remove successful drafts, keep failed ones
      setDrafts((prev) => prev.filter((d) => {
        const wasValid = validDrafts.some((v) => v.localId === d.localId);
        if (!wasValid) return true; // invalid drafts stay
        return failed.has(d.localId); // only failed ones stay
      }));
      setSaving(false);
    } else {
      // All succeeded
      router.push("/events");
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-gray-500">この操作は管理者のみ利用できます。</p>
      </div>
    );
  }

  const overLimit = drafts.length > 20;

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">予定を一括追加</h1>
      </div>

      {overLimit && (
        <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          カードが20件を超えています。一度に保存する件数を減らすことを検討してください。
        </div>
      )}

      <div className="space-y-0">
        {drafts.map((draft, index) => (
          <EventCard
            key={draft.localId}
            draft={draft}
            index={index}
            total={drafts.length}
            types={types}
            categories={categories}
            failed={failedIds.has(draft.localId)}
            locationSuggestions={locationSuggestions}
            onChange={(updated) => updateDraft(draft.localId, updated)}
            onDuplicate={() => duplicateDraft(index)}
            onDelete={() => deleteDraft(draft.localId)}
            onAddBelow={() => addDraftAt(index)}
          />
        ))}
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/events")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || validCount === 0}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "保存中..." : `すべて保存 (${validCount}件)`}
          </button>
        </div>
      </div>
    </div>
  );
}
