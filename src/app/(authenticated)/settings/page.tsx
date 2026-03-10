"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw, Trash2, AlertTriangle, Plus, X, ChevronUp, ChevronDown, Pencil, Check, UserPlus, ExternalLink, Copy, Mail } from "lucide-react";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // HTTP環境用フォールバック
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
}

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
                  className="flex-1 min-w-0 rounded border border-blue-400 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <span className="flex-1 min-w-0 text-sm text-gray-900">{item.name}</span>
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

      <form onSubmit={handleSubmit}>
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between">
            <label className="text-sm font-medium text-gray-700">名前</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setNewColor(c.value)}
                  className={`h-4 w-4 rounded-full border-2 transition-all ${
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
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={addLabel}
              className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
              {adding ? "追加中..." : "追加"}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mt-3 rounded-md p-3 text-sm ${
              message.includes("失敗") || message.includes("存在")
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </>
  );
}

// ── メンバープロファイル行 ────────────────────────────────────────────────────
type MemberProfileRowProps = {
  profile: {
    id: string;
    member_profile_id: string;
    kind: "coach" | "player";
    profile_name: string | null;
    avatar_url: string | null;
    number: string | null;
    role: string;
  };
  onUpdated: (name: string, number: string) => Promise<void>;
  onAvatarUploaded: (url: string) => Promise<void>;
  canDelete: boolean;
  onDeleted: () => Promise<void>;
};

function MemberProfileRow({ profile, onUpdated, onAvatarUploaded, canDelete, onDeleted }: MemberProfileRowProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.profile_name ?? "");
  const [editNumber, setEditNumber] = useState(profile.number ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    await onUpdated(editName.trim(), editNumber.trim());
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <AvatarUpload
            currentUrl={profile.avatar_url}
            bucket="avatars"
            folderPath={profile.member_profile_id}
            size={48}
            fallbackText={profile.profile_name ?? ""}
            onUploaded={onAvatarUploaded}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  profile.kind === "coach" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                }`}
              >
                {profile.kind === "coach" ? "コーチ" : "プレイヤー"}
              </span>
              {profile.role === "admin" && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">管理者</span>
              )}
            </div>
            {editing ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="名前"
                  autoFocus
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  placeholder="背番号（任意）"
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !editName.trim()}
                    className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Check size={12} strokeWidth={2} />
                    保存
                  </button>
                  <button
                    onClick={() => { setEditing(false); setEditName(profile.profile_name ?? ""); setEditNumber(profile.number ?? ""); }}
                    className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {profile.profile_name || "名前未設定"}
                {profile.number && <span className="ml-1.5 text-xs text-gray-400">#{profile.number}</span>}
              </p>
            )}
          </div>
        </div>
        {!editing && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="編集"
            >
              <Pencil size={16} strokeWidth={1.5} />
            </button>
            {canDelete && (
              <button
                onClick={onDeleted}
                className="text-gray-400 hover:text-red-500"
                aria-label="削除"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── プロファイル追加フォーム ───────────────────────────────────────────────
function AddProfileForm({
  teamId,
  showKindSelector = true,
  onAdded,
}: {
  teamId: string;
  showKindSelector?: boolean;
  onAdded: () => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"coach" | "player">("player");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError("");
    const { error: addError } = await supabase.rpc("add_profile_to_team", {
      target_team_id: teamId,
      profile_name: name.trim(),
      profile_kind: kind,
    });
    if (addError) {
      setError("追加に失敗しました");
      setAdding(false);
      return;
    }
    setName("");
    setOpen(false);
    onAdded();
    setAdding(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
      >
        <UserPlus size={16} strokeWidth={1.5} aria-hidden="true" />
        プロファイルを追加
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">新しいプロファイルを追加</h3>
      <form onSubmit={handleAdd} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="名前（例: 山田 太郎）"
          autoFocus
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {showKindSelector && (
          <div className="flex gap-2">
            {(["coach", "player"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-lg border py-1.5 text-sm font-medium transition-colors ${
                  kind === k
                    ? k === "coach"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {k === "coach" ? "コーチ" : "プレイヤー"}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? "追加中..." : "追加"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setName(""); setError(""); }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}

// ── 問い合わせ種別・フォーム項目の型定義 ────────────────────────────────────
type InquiryType = {
  id: string;
  team_id: string;
  name: string;
  message_template: string | null;
  sort_order: number;
  is_active: boolean;
};

type InquiryFormField = {
  id: string;
  inquiry_type_id: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'tel' | 'email' | 'select' | 'checkbox' | 'radio';
  placeholder: string | null;
  options: { label: string; value: string }[] | null;
  is_required: boolean;
  sort_order: number;
};

const FIELD_TYPE_OPTIONS: { value: InquiryFormField['field_type']; label: string }[] = [
  { value: 'text',     label: 'テキスト（1行）' },
  { value: 'textarea', label: 'テキスト（複数行）' },
  { value: 'tel',      label: '電話番号' },
  { value: 'email',    label: 'メールアドレス' },
  { value: 'select',   label: '選択肢（プルダウン）' },
  { value: 'checkbox', label: 'チェックボックス（複数選択）' },
  { value: 'radio',    label: 'ラジオボタン（単一選択）' },
];

// ── 問い合わせ種別管理セクション ──────────────────────────────────────────────
type InquiryTypeSectionProps = {
  teamId: string;
};

function InquiryTypeSection({ teamId }: InquiryTypeSectionProps) {
  const supabase = createClient();
  const [inquiryTypes, setInquiryTypes] = useState<InquiryType[]>([]);
  const [formFields, setFormFields] = useState<Record<string, InquiryFormField[]>>({});
  const [editingTypeId, setEditingTypeId] = useState<string | null | 'new'>(null);
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false);

  // フォーム state
  const [editName, setEditName] = useState('');
  const [editTemplate, setEditTemplate] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editFields, setEditFields] = useState<Omit<InquiryFormField, 'id' | 'inquiry_type_id'>[]>([]);
  const [saving, setSaving] = useState(false);
  const [sectionMessage, setSectionMessage] = useState('');

  const loadData = async () => {
    const { data: types } = await supabase
      .from('inquiry_types')
      .select('*')
      .eq('team_id', teamId)
      .order('sort_order');

    if (!types) return;
    setInquiryTypes(types as InquiryType[]);

    const typeIds = types.map((t) => t.id);
    if (typeIds.length === 0) {
      setFormFields({});
      return;
    }

    const { data: fields } = await supabase
      .from('inquiry_form_fields')
      .select('*')
      .in('inquiry_type_id', typeIds)
      .order('sort_order');

    const fieldMap: Record<string, InquiryFormField[]> = {};
    for (const f of (fields ?? []) as InquiryFormField[]) {
      if (!fieldMap[f.inquiry_type_id]) fieldMap[f.inquiry_type_id] = [];
      fieldMap[f.inquiry_type_id].push(f);
    }
    setFormFields(fieldMap);
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const openNewForm = () => {
    setEditingTypeId('new');
    setEditName('');
    setEditTemplate('');
    setEditIsActive(true);
    setEditFields([]);
    setIsTypeFormOpen(true);
    setSectionMessage('');
  };

  const openEditForm = (t: InquiryType) => {
    setEditingTypeId(t.id);
    setEditName(t.name);
    setEditTemplate(t.message_template ?? '');
    setEditIsActive(t.is_active);
    setEditFields(
      (formFields[t.id] ?? []).map((f) => ({
        field_label: f.field_label,
        field_type: f.field_type,
        placeholder: f.placeholder,
        options: f.options,
        is_required: f.is_required,
        sort_order: f.sort_order,
      }))
    );
    setIsTypeFormOpen(true);
    setSectionMessage('');
  };

  const closeForm = () => {
    setIsTypeFormOpen(false);
    setEditingTypeId(null);
    setSectionMessage('');
  };

  const addField = () => {
    setEditFields((prev) => [
      ...prev,
      { field_label: '', field_type: 'text', placeholder: null, options: null, is_required: false, sort_order: prev.length },
    ]);
  };

  const updateField = (index: number, patch: Partial<Omit<InquiryFormField, 'id' | 'inquiry_type_id'>>) => {
    setEditFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    setEditFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setSectionMessage('種別名を入力してください');
      return;
    }
    setSaving(true);
    setSectionMessage('');

    if (editingTypeId === 'new') {
      const maxOrder = inquiryTypes.reduce((m, t) => Math.max(m, t.sort_order), -1);
      const { data: newType, error } = await supabase
        .from('inquiry_types')
        .insert({
          team_id: teamId,
          name: editName.trim(),
          message_template: editTemplate.trim() || null,
          is_active: editIsActive,
          sort_order: maxOrder + 1,
        })
        .select('*')
        .single();

      if (error || !newType) {
        setSectionMessage('追加に失敗しました');
        setSaving(false);
        return;
      }

      // フォーム項目を追加
      if (editFields.length > 0) {
        await supabase.from('inquiry_form_fields').insert(
          editFields.map((f, i) => ({
            inquiry_type_id: newType.id,
            field_label: f.field_label,
            field_type: f.field_type,
            placeholder: f.placeholder,
            options: f.options,
            is_required: f.is_required,
            sort_order: i,
          }))
        );
      }
    } else {
      const { error } = await supabase
        .from('inquiry_types')
        .update({
          name: editName.trim(),
          message_template: editTemplate.trim() || null,
          is_active: editIsActive,
        })
        .eq('id', editingTypeId!);

      if (error) {
        setSectionMessage('更新に失敗しました');
        setSaving(false);
        return;
      }

      // フォーム項目を一旦全削除して再挿入
      await supabase.from('inquiry_form_fields').delete().eq('inquiry_type_id', editingTypeId!);
      if (editFields.length > 0) {
        await supabase.from('inquiry_form_fields').insert(
          editFields.map((f, i) => ({
            inquiry_type_id: editingTypeId!,
            field_label: f.field_label,
            field_type: f.field_type,
            placeholder: f.placeholder,
            options: f.options,
            is_required: f.is_required,
            sort_order: i,
          }))
        );
      }
    }

    await loadData();
    setSaving(false);
    closeForm();
    setSectionMessage('保存しました');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('この問い合わせ種別を削除しますか？関連するフォーム項目もすべて削除されます。')) return;
    const { error } = await supabase.from('inquiry_types').delete().eq('id', id);
    if (error) {
      setSectionMessage('削除に失敗しました');
    } else {
      setInquiryTypes((prev) => prev.filter((t) => t.id !== id));
      setFormFields((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const hasOptionsField = (ft: InquiryFormField['field_type']) =>
    ft === 'select' || ft === 'radio' || ft === 'checkbox';

  return (
    <>
      <hr className="my-8 border-gray-200" />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">問い合わせ種別</h2>
          <p className="mt-1 text-sm text-gray-500">問い合わせフォームで選択できる種別を管理します</p>
        </div>
        {!isTypeFormOpen && (
          <button
            type="button"
            onClick={openNewForm}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
            種別を追加
          </button>
        )}
      </div>

      {sectionMessage && !isTypeFormOpen && (
        <div className={`mb-4 rounded-md p-3 text-sm ${sectionMessage.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {sectionMessage}
        </div>
      )}

      {/* 種別一覧 */}
      {!isTypeFormOpen && (
        <div className="space-y-2">
          {inquiryTypes.length === 0 && (
            <p className="text-sm text-gray-400">種別が登録されていません</p>
          )}
          {inquiryTypes.map((t) => {
            const fields = formFields[t.id] ?? [];
            return (
              <div key={t.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 text-sm font-medium text-gray-900">{t.name}</span>
                  {!t.is_active && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">無効</span>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditForm(t)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="編集"
                  >
                    <Pencil size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="削除"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
                {t.message_template && (
                  <p className="mt-1 text-xs text-gray-400">テンプレート: {t.message_template.slice(0, 40)}{t.message_template.length > 40 ? '...' : ''}</p>
                )}
                {fields.length > 0 && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    フォーム項目: {fields.map((f) => f.field_label).join('、')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 追加・編集フォーム */}
      {isTypeFormOpen && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">
            {editingTypeId === 'new' ? '種別を追加' : '種別を編集'}
          </h3>

          {/* 種別名 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              種別名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="例: 体験・見学希望"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* テンプレート */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">テンプレート</label>
            <p className="mb-1 text-xs text-gray-400">ここに入力したテキストが問い合わせフォームのメッセージ欄に挿入されます</p>
            <textarea
              value={editTemplate}
              onChange={(e) => setEditTemplate(e.target.value)}
              rows={3}
              placeholder="例: 体験希望日: &#10;ご質問: "
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 有効/無効 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-blue-600"
            />
            <label htmlFor="editIsActive" className="text-sm text-gray-700">有効（問い合わせフォームに表示）</label>
          </div>

          {/* カスタムフォーム項目 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">カスタムフォーム項目</span>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus size={14} strokeWidth={2} />
                項目を追加
              </button>
            </div>

            <div className="space-y-3">
              {editFields.map((f, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={f.field_label}
                      onChange={(e) => updateField(i, { field_label: e.target.value })}
                      placeholder="ラベル（例: 希望日時）"
                      className="flex-1 min-w-0 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                      aria-label="削除"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={f.field_type}
                      onChange={(e) => updateField(i, { field_type: e.target.value as InquiryFormField['field_type'] })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {FIELD_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={f.is_required}
                        onChange={(e) => updateField(i, { is_required: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600"
                      />
                      必須
                    </label>
                  </div>
                  <input
                    type="text"
                    value={f.placeholder ?? ''}
                    onChange={(e) => updateField(i, { placeholder: e.target.value || null })}
                    placeholder="プレースホルダ（任意）"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {hasOptionsField(f.field_type) && (
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">選択肢（カンマ区切り）</label>
                      <input
                        type="text"
                        value={(f.options ?? []).map((o) => o.label).join(', ')}
                        onChange={(e) => {
                          const opts = e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((s) => ({ label: s, value: s }));
                          updateField(i, { options: opts.length > 0 ? opts : null });
                        }}
                        placeholder="例: 午前, 午後, 夕方"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
              {editFields.length === 0 && (
                <p className="text-xs text-gray-400">カスタム項目なし</p>
              )}
            </div>
          </div>

          {sectionMessage && (
            <div className={`rounded-md p-3 text-sm ${sectionMessage.includes('失敗') || sectionMessage.includes('入力') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {sectionMessage}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
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
  const [origin, setOrigin] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamIconUrl, setTeamIconUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeGuardian, setInviteCodeGuardian] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountType, setAccountType] = useState<"coach" | "guardian">("coach");
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamMessage, setTeamMessage] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingGuardian, setRegeneratingGuardian] = useState(false);
  const [contactUrlCopied, setContactUrlCopied] = useState(false);
  const [coachShareOpen, setCoachShareOpen] = useState(false);
  const [guardianShareOpen, setGuardianShareOpen] = useState(false);
  const [coachCopied, setCoachCopied] = useState<"code" | "link" | null>(null);
  const [guardianCopied, setGuardianCopied] = useState<"code" | "link" | null>(null);

  // Refs for share panels (outside click)
  const coachShareRef = useRef<HTMLDivElement>(null);
  const guardianShareRef = useRef<HTMLDivElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"coach" | "guardian" | "admin">("coach");

  // Event types / categories state
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventCategories, setEventCategories] = useState<EventType[]>([]);

  // Coach category state (self-managed)
  const [coachProfileIds, setCoachProfileIds] = useState<string[]>([]);
  const [coachCategoryIds, setCoachCategoryIds] = useState<Set<string>>(new Set());
  const [savingCoachCategories, setSavingCoachCategories] = useState(false);
  const [coachCategoryMessage, setCoachCategoryMessage] = useState("");

  // Player/profile category modal state (admin)
  type PlayerForCategory = { member_profile_id: string; name: string | null; kind: "coach" | "player" };
  const [playerCategoryModalOpen, setPlayerCategoryModalOpen] = useState(false);
  const [playerCategoryPlayers, setPlayerCategoryPlayers] = useState<PlayerForCategory[]>([]);
  const [playerCategoryAssignments, setPlayerCategoryAssignments] = useState<Set<string>>(new Set());
  const [savingPlayerCategories, setSavingPlayerCategories] = useState(false);
  const [playerCategoryModalTab, setPlayerCategoryModalTab] = useState<"coach" | "player">("coach");

  // Member profiles state
  type MemberProfileItem = {
    id: string;
    member_profile_id: string;
    kind: "coach" | "player";
    profile_name: string | null;
    avatar_url: string | null;
    number: string | null;
    role: string;
  };
  const [myProfiles, setMyProfiles] = useState<MemberProfileItem[]>([]);

  const reloadMyProfiles = useCallback(async (tid: string, uid: string) => {
    const { data: myMemberships } = await supabase
      .from("team_members")
      .select("id, role, member_profile_id, member_profiles!inner(user_id, kind, name, avatar_url, number)")
      .eq("team_id", tid)
      .eq("member_profiles.user_id", uid);
    if (myMemberships) {
      setMyProfiles(
        myMemberships.map((m) => {
          const mp = m.member_profiles as unknown as {
            user_id: string;
            kind: "coach" | "player";
            name: string | null;
            avatar_url: string | null;
            number: string | null;
          } | null;
          return {
            id: m.id,
            member_profile_id: m.member_profile_id,
            kind: mp?.kind ?? "player",
            profile_name: mp?.name ?? null,
            avatar_url: mp?.avatar_url ?? null,
            number: mp?.number ?? null,
            role: m.role,
          };
        })
      );
    }
  }, [supabase]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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

      const { data: teamIdResult } = await supabase.rpc("get_my_team_id");

      const { data: membership } = teamIdResult
        ? await supabase
            .from("team_members")
            .select("team_id, role, account_type, member_profiles!inner(user_id)")
            .eq("team_id", teamIdResult)
            .eq("member_profiles.user_id", user.id)
            .limit(1)
            .single()
        : { data: null };

      if (membership) {
        const type = (membership.account_type ?? "coach") as "coach" | "guardian";
        setIsAdmin(membership.role === "admin");
        setAccountType(type);
        setActiveTab(membership.role === "admin" ? "admin" : type === "guardian" ? "guardian" : "coach");
        setTeamId(membership.team_id);

        const { data: team } = await supabase
          .from("teams")
          .select("name, invite_code, invite_code_guardian, icon_url")
          .eq("id", membership.team_id)
          .single();

        if (team) {
          setTeamName(team.name);
          setInviteCode(team.invite_code);
          setInviteCodeGuardian(team.invite_code_guardian);
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

        await reloadMyProfiles(membership.team_id, user.id);

        // コーチプロファイルの担当カテゴリを読み込む
        const { data: myMembershipsForKind } = await supabase
          .from("team_members")
          .select("member_profile_id, member_profiles!inner(user_id, kind)")
          .eq("team_id", membership.team_id)
          .eq("member_profiles.user_id", user.id);

        const coachIds = (myMembershipsForKind ?? [])
          .filter((m) => (m.member_profiles as unknown as { kind: string } | null)?.kind === "coach")
          .map((m) => m.member_profile_id);

        setCoachProfileIds(coachIds);

        if (coachIds.length > 0) {
          const { data: coachCats } = await supabase
            .from("member_profile_categories")
            .select("event_type_id")
            .in("member_profile_id", coachIds);
          setCoachCategoryIds(new Set((coachCats ?? []).map((c) => c.event_type_id)));
        }
      }

      setLoading(false);
    };
    loadData();
  }, [supabase, reloadMyProfiles]);

  // ── Share panel outside-click handlers ──────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (coachShareRef.current && !coachShareRef.current.contains(e.target as Node)) {
        setCoachShareOpen(false);
      }
      if (guardianShareRef.current && !guardianShareRef.current.contains(e.target as Node)) {
        setGuardianShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      "コーチ用招待コードを再生成すると、以前のコードは無効になります。よろしいですか？"
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
      setTeamMessage("コーチ用招待コードを再生成しました");
    }
    setRegenerating(false);
  };

  const handleRegenerateGuardianCode = async () => {
    if (!teamId) return;
    const confirmed = window.confirm(
      "保護者用招待コードを再生成すると、以前のコードは無効になります。よろしいですか？"
    );
    if (!confirmed) return;

    setRegeneratingGuardian(true);
    setTeamMessage("");

    const { data: newCode, error } = await supabase.rpc(
      "regenerate_guardian_invite_code",
      { target_team_id: teamId }
    );

    if (error) {
      setTeamMessage("再生成に失敗しました");
    } else {
      setInviteCodeGuardian(newCode);
      setTeamMessage("保護者用招待コードを再生成しました");
    }
    setRegeneratingGuardian(false);
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

  // ── Coach category handlers ─────────────────────────────────────────────
  const toggleCoachCategory = (eventTypeId: string) => {
    setCoachCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventTypeId)) next.delete(eventTypeId); else next.add(eventTypeId);
      return next;
    });
  };

  const handleSaveCoachCategories = async () => {
    if (!teamId || coachProfileIds.length === 0) return;
    setSavingCoachCategories(true);
    setCoachCategoryMessage("");

    await supabase
      .from("member_profile_categories")
      .delete()
      .in("member_profile_id", coachProfileIds);

    const rows = [...coachCategoryIds].flatMap((catId) =>
      coachProfileIds.map((profileId) => ({
        team_id: teamId,
        member_profile_id: profileId,
        event_type_id: catId,
      }))
    );
    if (rows.length > 0) {
      await supabase.from("member_profile_categories").insert(rows);
    }

    setCoachCategoryMessage("保存しました");
    setSavingCoachCategories(false);
  };

  // ── Player category handlers ────────────────────────────────────────────
  const openPlayerCategoryModal = async () => {
    if (!teamId) return;

    const { data: members } = await supabase
      .from("team_members")
      .select("member_profile_id, account_type, member_profiles!inner(name, kind)")
      .eq("team_id", teamId);

    if (members) {
      const seen = new Set<string>();
      const players = members
        .filter((m) => {
          if (seen.has(m.member_profile_id)) return false;
          seen.add(m.member_profile_id);
          return true;
        })
        .map((m) => {
          const mp = m.member_profiles as unknown as { name: string | null; kind: "coach" | "player" } | null;
          return { member_profile_id: m.member_profile_id, name: mp?.name ?? null, kind: mp?.kind ?? "player" };
        });
      setPlayerCategoryPlayers(players);
    }

    const { data: existing } = await supabase
      .from("member_profile_categories")
      .select("member_profile_id, event_type_id")
      .eq("team_id", teamId);

    setPlayerCategoryAssignments(
      new Set((existing ?? []).map((a) => `${a.member_profile_id}:${a.event_type_id}`))
    );
    setPlayerCategoryModalTab("coach");
    setPlayerCategoryModalOpen(true);
  };

  const togglePlayerCategory = (memberProfileId: string, eventTypeId: string) => {
    const key = `${memberProfileId}:${eventTypeId}`;
    setPlayerCategoryAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSavePlayerCategories = async () => {
    if (!teamId) return;
    setSavingPlayerCategories(true);

    await supabase.from("member_profile_categories").delete().eq("team_id", teamId);

    const rows = [...playerCategoryAssignments].map((key) => {
      const [member_profile_id, event_type_id] = key.split(":");
      return { team_id: teamId, member_profile_id, event_type_id };
    });
    if (rows.length > 0) {
      await supabase.from("member_profile_categories").insert(rows);
    }

    setPlayerCategoryModalOpen(false);
    setSavingPlayerCategories(false);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  // ── プロファイルフォーム（コーチ・保護者タブ共通） ─────────────────────
  const profileFormJsx = (
    <form onSubmit={handleSaveProfile} className="space-y-4">
      <div className="flex items-center gap-4">
        {userId && (
          <AvatarUpload
            currentUrl={avatarUrl}
            bucket="avatars"
            folderPath={userId}
            size={72}
            fallbackText={name}
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
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
    </form>
  );

  // ── チームプロファイル一覧（コーチ・保護者タブ共通） ──────────────────
  const memberProfilesJsx = teamId ? (
    <>
      <hr className="my-8 border-gray-200" />
      <h2 className="mb-1 text-lg font-semibold">
        {accountType === "guardian" ? "選手プロファイル" : "プレイヤープロファイル"}
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        {accountType === "guardian"
          ? "お子様などのプロファイルを管理します。"
          : "プレイヤーのプロファイルを登録してください。"}
      </p>
      <div className="space-y-3 mb-4">
        {myProfiles.filter((p) => accountType !== "coach" || p.kind === "player").map((p) => (
          <MemberProfileRow
            key={p.id}
            profile={p}
            onUpdated={async (newName, newNumber) => {
              await supabase
                .from("member_profiles")
                .update({ name: newName, number: newNumber || null })
                .eq("id", p.member_profile_id);
              setMyProfiles((prev) =>
                prev.map((mp) =>
                  mp.id === p.id
                    ? { ...mp, profile_name: newName, number: newNumber || null }
                    : mp
                )
              );
            }}
            onAvatarUploaded={async (url) => {
              await supabase
                .from("member_profiles")
                .update({ avatar_url: url })
                .eq("id", p.member_profile_id);
              setMyProfiles((prev) =>
                prev.map((mp) => (mp.id === p.id ? { ...mp, avatar_url: url } : mp))
              );
            }}
            canDelete={myProfiles.filter((mp) => accountType !== "coach" || mp.kind === "player").length > 1}
            onDeleted={async () => {
              if (!window.confirm("このプロファイルをチームから削除しますか？")) return;
              await supabase.from("team_members").delete().eq("id", p.id);
              setMyProfiles((prev) => prev.filter((mp) => mp.id !== p.id));
            }}
          />
        ))}
      </div>
      <AddProfileForm
        teamId={teamId}
        showKindSelector={false}
        onAdded={() => reloadMyProfiles(teamId, userId)}
      />
    </>
  ) : null;

  const showCoachTab = accountType === "coach";
  const showGuardianTab = accountType === "guardian";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold hidden md:block">設定</h1>

      {/* タブナビゲーション */}
      {teamId && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex">
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-4 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "admin"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                管理者
              </button>
            )}
            {showGuardianTab && (
              <button
                onClick={() => setActiveTab("guardian")}
                className={`px-4 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "guardian"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                保護者
              </button>
            )}
            {showCoachTab && (
              <button
                onClick={() => setActiveTab("coach")}
                className={`px-4 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "coach"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                コーチ
              </button>
            )}
          </nav>
        </div>
      )}

      {/* コーチタブ */}
      {(activeTab === "coach" || !teamId) && showCoachTab && (
        <>
          {profileFormJsx}
          {teamId && (
            <>
              <hr className="my-8 border-gray-200" />
              <h2 className="mb-1 text-lg font-semibold">担当カテゴリ</h2>
              <p className="mb-4 text-sm text-gray-500">
                担当するカテゴリを設定すると、関連する予定・お知らせのみダッシュボードに表示されます。未設定の場合は全件表示されます。
              </p>
              {eventCategories.length === 0 ? (
                <p className="text-sm text-gray-400">カテゴリが登録されていません（管理者に依頼してください）</p>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {eventCategories.map((cat) => {
                      const selected = coachCategoryIds.has(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCoachCategory(cat.id)}
                          className={`rounded-full border-2 px-3 py-1 text-sm font-medium transition-all ${
                            selected
                              ? "shadow-sm"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                          style={
                            selected
                              ? { backgroundColor: cat.color + "20", color: cat.color, borderColor: cat.color }
                              : {}
                          }
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCoachCategories}
                    disabled={savingCoachCategories}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingCoachCategories ? "保存中..." : "保存"}
                  </button>
                  {coachCategoryMessage && (
                    <div
                      className={`mt-3 rounded-md p-3 text-sm ${
                        coachCategoryMessage.includes("失敗")
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {coachCategoryMessage}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {/* 機能説明 */}
          <hr className="my-8 border-gray-200" />
          <h2 className="mb-1 text-lg font-semibold">機能説明</h2>
          <p className="mb-4 text-sm text-gray-500">各機能の使い方を確認できます。</p>
          <ul className="space-y-2">
            {[
              { href: "/help",               label: "ヘルプ一覧" },
              { href: "/help/events",        label: "予定と出欠管理" },
              { href: "/help/announcements", label: "お知らせ" },
              { href: "/help/categories",    label: "カテゴリ機能" },
            ].map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 保護者タブ */}
      {activeTab === "guardian" && showGuardianTab && (
        <>
          {profileFormJsx}
          {memberProfilesJsx}
          {/* 機能説明 */}
          <hr className="my-8 border-gray-200" />
          <h2 className="mb-1 text-lg font-semibold">機能説明</h2>
          <p className="mb-4 text-sm text-gray-500">各機能の使い方を確認できます。</p>
          <ul className="space-y-2">
            {[
              { href: "/help",               label: "ヘルプ一覧" },
              { href: "/help/events",        label: "予定と出欠管理" },
              { href: "/help/announcements", label: "お知らせ" },
              { href: "/help/members",       label: "メンバー管理" },
            ].map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* チームがない場合（タブなし）のプロファイル表示 */}
      {!teamId && (
        profileFormJsx
      )}

      {/* 管理者タブ */}
      {activeTab === "admin" && isAdmin && teamId && (
        <>
          <h2 className="mb-4 text-lg font-semibold">チーム設定</h2>

          <div className="mb-4 flex items-center gap-4">
            <AvatarUpload
              currentUrl={teamIconUrl}
              bucket="team-icons"
              folderPath={teamId}
              size={72}
              onUploaded={handleTeamIconUploaded}
            />
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
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={savingTeam || !teamName.trim()}
                  className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingTeam ? "保存中..." : "保存"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                コーチ用招待コード
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono">
                  {inviteCode}
                </code>
                <div className="relative shrink-0" ref={coachShareRef}>
                  <button
                    type="button"
                    onClick={() => setCoachShareOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:px-3"
                  >
                    <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span className="hidden sm:inline">{coachCopied ? "コピーしました！" : "コピー"}</span>
                  </button>
                  {coachShareOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          copyToClipboard(inviteCode).then(() => {
                            setCoachCopied("code");
                            setTimeout(() => setCoachCopied(null), 1500);
                          });
                          setCoachShareOpen(false);
                        }}
                      >
                        コードをコピー
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          copyToClipboard(`${origin}/signup?invite=${inviteCode}`).then(() => {
                            setCoachCopied("link");
                            setTimeout(() => setCoachCopied(null), 1500);
                          });
                          setCoachShareOpen(false);
                        }}
                      >
                        招待リンクをコピー
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="メールで共有"
                  onClick={() => {
                    const body = encodeURIComponent(
                      `TeamBoard のチームへ招待します。\n\n以下のリンクからサインアップして参加してください：\n${origin}/signup?invite=${inviteCode}\n\nすでにアカウントをお持ちの場合は、ログイン後に\n招待コード「${inviteCode}」を入力してチームに参加できます。`
                    );
                    window.open(`mailto:?subject=${encodeURIComponent("TeamBoard チームへの招待")}&body=${body}`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:px-3"
                >
                  <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
                  <span className="hidden sm:inline">メール</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 sm:px-3"
                >
                  <RefreshCw size={16} strokeWidth={1.5} aria-hidden="true" />
                  <span className="hidden sm:inline">{regenerating ? "再生成中..." : "再生成"}</span>
                </button>
              </div>
              {coachCopied && (
                <p className="mt-1 text-xs text-green-600">コピーしました！</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                保護者用招待コード
              </label>
              <p className="mb-1.5 text-xs text-gray-400">保護者アカウントでチームに参加する際に使用します</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono">
                  {inviteCodeGuardian}
                </code>
                <div className="relative shrink-0" ref={guardianShareRef}>
                  <button
                    type="button"
                    onClick={() => setGuardianShareOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:px-3"
                  >
                    <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span className="hidden sm:inline">{guardianCopied ? "コピーしました！" : "コピー"}</span>
                  </button>
                  {guardianShareOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          copyToClipboard(inviteCodeGuardian).then(() => {
                            setGuardianCopied("code");
                            setTimeout(() => setGuardianCopied(null), 1500);
                          });
                          setGuardianShareOpen(false);
                        }}
                      >
                        コードをコピー
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          copyToClipboard(`${window.location.origin}/signup?invite=${inviteCodeGuardian}`).then(() => {
                            setGuardianCopied("link");
                            setTimeout(() => setGuardianCopied(null), 1500);
                          });
                          setGuardianShareOpen(false);
                        }}
                      >
                        招待リンクをコピー
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="メールで共有"
                  onClick={() => {
                    const origin = window.location.origin;
                    const body = encodeURIComponent(
                      `TeamBoard のチームへ招待します。\n\n以下のリンクからサインアップして参加してください：\n${origin}/signup?invite=${inviteCodeGuardian}\n\nすでにアカウントをお持ちの場合は、ログイン後に\n招待コード「${inviteCodeGuardian}」を入力してチームに参加できます。`
                    );
                    window.open(`mailto:?subject=${encodeURIComponent("TeamBoard チームへの招待")}&body=${body}`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:px-3"
                >
                  <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
                  <span className="hidden sm:inline">メール</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateGuardianCode}
                  disabled={regeneratingGuardian}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 sm:px-3"
                >
                  <RefreshCw size={16} strokeWidth={1.5} aria-hidden="true" />
                  <span className="hidden sm:inline">{regeneratingGuardian ? "再生成中..." : "再生成"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                問い合わせフォームURL
              </label>
              <p className="mb-1.5 text-xs text-gray-400">外部公開用の問い合わせフォームです。未ログインでもアクセスできます</p>
              <code className="mb-2 block w-full truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono">
                {origin ? `${origin}/contact/${teamId}` : `/contact/${teamId}`}
              </code>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/contact/${teamId}`;
                  copyToClipboard(url).then(() => {
                    setContactUrlCopied(true);
                    setTimeout(() => setContactUrlCopied(false), 1500);
                  });
                }}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                {contactUrlCopied ? "コピーしました！" : "コピー"}
              </button>
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

          {/* 問い合わせ種別 */}
          <InquiryTypeSection teamId={teamId} />

          {/* カテゴリ割り当て */}
          <hr className="my-8 border-gray-200" />
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold">カテゴリ割り当て</h2>
            <button
              type="button"
              onClick={openPlayerCategoryModal}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Pencil size={14} strokeWidth={1.5} aria-hidden="true" />
              編集
            </button>
          </div>
          <p className="text-sm text-gray-500">
            コーチ・選手プロファイルごとに担当カテゴリを設定します。予定やお知らせの対象絞り込みに使用します。
          </p>

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

          {/* 機能説明 */}
          <hr className="my-8 border-gray-200" />
          <h2 className="mb-1 text-lg font-semibold">機能説明</h2>
          <p className="mb-4 text-sm text-gray-500">各機能の使い方を確認できます。</p>
          <ul className="space-y-2">
            {[
              { href: "/help",               label: "ヘルプ一覧" },
              { href: "/help/events",        label: "予定と出欠管理" },
              { href: "/help/announcements", label: "お知らせ" },
              { href: "/help/categories",    label: "カテゴリ機能" },
              { href: "/help/invite",        label: "招待コード" },
              { href: "/help/members",       label: "メンバー管理" },
            ].map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* プレイヤーカテゴリ編集モーダル */}
      {playerCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold">カテゴリ割り当て</h2>
              <button
                type="button"
                onClick={() => setPlayerCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* モーダル内タブ */}
            <div className="border-b border-gray-200 px-6">
              <nav className="-mb-px flex gap-6">
                {(["coach", "player"] as const).map((tab) => {
                  const label = tab === "coach" ? "コーチ" : "選手";
                  const count = playerCategoryPlayers.filter((p) => p.kind === tab).length;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPlayerCategoryModalTab(tab)}
                      className={`border-b-2 pb-3 pt-2 text-sm font-medium transition-colors ${
                        playerCategoryModalTab === tab
                          ? tab === "coach"
                            ? "border-blue-500 text-blue-600"
                            : "border-green-500 text-green-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {label}
                      <span className="ml-1.5 text-xs text-gray-400">({count})</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="overflow-x-auto px-6 py-4">
              {eventCategories.length === 0 ? (
                <p className="text-sm text-gray-400">対象カテゴリが登録されていません。先に「対象カテゴリ」を追加してください。</p>
              ) : (() => {
                const visibleProfiles = playerCategoryPlayers.filter(
                  (p) => p.kind === playerCategoryModalTab
                );
                if (visibleProfiles.length === 0) {
                  return (
                    <p className="text-sm text-gray-400">
                      {playerCategoryModalTab === "coach" ? "コーチ" : "選手"}プロファイルが登録されていません
                    </p>
                  );
                }
                return (
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="pb-3 pr-6 text-left text-sm font-medium text-gray-500">
                          {playerCategoryModalTab === "coach" ? "コーチ" : "選手"}
                        </th>
                        {eventCategories.map((cat) => (
                          <th key={cat.id} className="min-w-[72px] pb-3 text-center">
                            <span
                              className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: cat.color }}
                            >
                              {cat.name}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleProfiles.map((player) => (
                        <tr key={player.member_profile_id}>
                          <td className="py-3 pr-6 font-medium text-gray-900">
                            {player.name || "名前未設定"}
                          </td>
                          {eventCategories.map((cat) => (
                            <td key={cat.id} className="py-3 text-center">
                              <input
                                type="checkbox"
                                checked={playerCategoryAssignments.has(`${player.member_profile_id}:${cat.id}`)}
                                onChange={() => togglePlayerCategory(player.member_profile_id, cat.id)}
                                className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setPlayerCategoryModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSavePlayerCategories}
                disabled={savingPlayerCategories}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingPlayerCategories ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
