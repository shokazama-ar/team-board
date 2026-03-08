"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { Copy, Trash2, Plus, ChevronDown, ChevronUp, LayoutList } from "lucide-react";

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

function newDraft(): DraftEvent {
  return {
    localId: crypto.randomUUID(),
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

function TypeRadios({
  items,
  selectedId,
  onSelect,
}: {
  items: EventType[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => {
        const selected = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(selected ? null : item.id)}
            className="flex items-center gap-1.5"
          >
            <span
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
              style={
                selected
                  ? { borderColor: item.color, backgroundColor: item.color }
                  : { borderColor: "#d1d5db" }
              }
            >
              {selected && <span className="h-1 w-1 rounded-full bg-white" />}
            </span>
            <span
              className="text-xs font-medium transition-colors"
              style={selected ? { color: item.color } : { color: "#4b5563" }}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CategoryPills({
  items,
  selectedIds,
  onToggle,
}: {
  items: EventType[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
              selected ? "shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
            style={
              selected
                ? { backgroundColor: item.color + "20", color: item.color, borderColor: item.color }
                : {}
            }
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

function EventCard({
  draft,
  index,
  total,
  types,
  categories,
  memoOpen,
  failed,
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
  memoOpen: boolean;
  failed: boolean;
  onChange: (updated: DraftEvent) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddBelow: () => void;
}) {
  const [localMemoOpen, setLocalMemoOpen] = useState(memoOpen);

  useEffect(() => {
    setLocalMemoOpen(memoOpen);
  }, [memoOpen]);

  const update = (patch: Partial<DraftEvent>) => onChange({ ...draft, ...patch });

  const toggleCategory = (id: string) => {
    const next = draft.selectedCategoryIds.includes(id)
      ? draft.selectedCategoryIds.filter((x) => x !== id)
      : [...draft.selectedCategoryIds, id];
    update({ selectedCategoryIds: next });
  };

  const selectedType = types.find((t) => t.id === draft.selectedTypeId);
  const selectedCategories = categories.filter((c) => draft.selectedCategoryIds.includes(c.id));

  return (
    <div className="group">
      <div
        className={`rounded-lg border bg-white p-4 transition-all ${
          failed
            ? "border-red-400 bg-red-50"
            : isValid(draft)
            ? "border-gray-200"
            : "border-gray-200"
        }`}
      >
        {/* Card header: badges + actions */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedType && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: selectedType.color + "20", color: selectedType.color }}
              >
                {selectedType.name}
              </span>
            )}
            {selectedCategories.map((c) => (
              <span
                key={c.id}
                className="rounded border px-2 py-0.5 text-xs font-medium"
                style={{ borderColor: c.color, color: c.color }}
              >
                {c.name}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1">
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
        </div>

        {/* Title */}
        <input
          type="text"
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="タイトル *"
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Type */}
        {types.length > 0 && (
          <div className="mb-2">
            <p className="mb-1 text-xs text-gray-400">種別</p>
            <TypeRadios
              items={types}
              selectedId={draft.selectedTypeId}
              onSelect={(id) => update({ selectedTypeId: id })}
            />
          </div>
        )}

        {/* Category */}
        {categories.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs text-gray-400">カテゴリ</p>
            <CategoryPills
              items={categories}
              selectedIds={draft.selectedCategoryIds}
              onToggle={toggleCategory}
            />
          </div>
        )}

        {/* Dates */}
        <div className="mb-3 space-y-2">
          <div>
            <p className="mb-1 text-xs text-gray-400">開始日時 *</p>
            <DateTimePicker
              value={draft.date}
              onChange={(val) => update({ date: val })}
              required
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-400">終了日時（任意）</p>
            <DateTimePicker
              value={draft.endDate}
              onChange={(val) => update({ endDate: val })}
              min={draft.date}
            />
          </div>
        </div>

        {/* Location */}
        <input
          type="text"
          value={draft.location}
          onChange={(e) => update({ location: e.target.value })}
          placeholder="場所（任意）"
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Memo toggle */}
        <button
          type="button"
          onClick={() => setLocalMemoOpen((prev) => !prev)}
          className="mb-1 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          {localMemoOpen ? (
            <ChevronUp size={14} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={1.5} />
          )}
          メモ{draft.memo ? "（入力済み）" : ""}
        </button>
        {localMemoOpen && (
          <textarea
            value={draft.memo}
            onChange={(e) => update({ memo: e.target.value })}
            rows={3}
            placeholder="持ち物や注意事項など"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}

        {failed && (
          <p className="mt-2 text-xs text-red-600">この予定の保存に失敗しました</p>
        )}
      </div>

      {/* Add row below */}
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
  const [allMemoOpen, setAllMemoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

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
        localId: crypto.randomUUID(),
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
        <button
          type="button"
          onClick={() => setAllMemoOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          {allMemoOpen ? (
            <>
              <ChevronUp size={13} strokeWidth={1.5} />
              詳細を折りたたむ
            </>
          ) : (
            <>
              <ChevronDown size={13} strokeWidth={1.5} />
              詳細を展開する
            </>
          )}
        </button>
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
            memoOpen={allMemoOpen}
            failed={failedIds.has(draft.localId)}
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
