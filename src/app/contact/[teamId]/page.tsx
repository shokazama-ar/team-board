"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";

// ── 型定義 ───────────────────────────────────────────────────────────────────
type DisplayInquiryType = {
  id: string;
  name: string;
  message_template: string | null;
};

type FormField = {
  id: string;
  inquiry_type_id: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'tel' | 'email' | 'select' | 'checkbox' | 'radio';
  placeholder: string | null;
  options: { label: string; value: string }[] | null;
  is_required: boolean;
  sort_order: number;
};

// ── フォールバック種別（チームに種別が未設定の場合） ──────────────────────────
const DEFAULT_INQUIRY_TYPES: DisplayInquiryType[] = [
  { id: 'other',  name: 'その他・問い合わせ', message_template: null },
];

const DEFAULT_TYPE_IDS = new Set(['trial', 'join', 'leave', 'other']);

function isDefaultType(id: string) {
  return DEFAULT_TYPE_IDS.has(id);
}

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function ContactPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const supabase = createClient();

  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamNotFound, setTeamNotFound] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // 問い合わせ種別・フォーム項目
  const [displayTypes, setDisplayTypes] = useState<DisplayInquiryType[]>([]);
  const [allFields, setAllFields] = useState<FormField[]>([]);

  // フォーム state
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | string[]>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: teamError } = await supabase.rpc('get_team_name', {
        tid: teamId,
      });
      if (teamError || data === null) {
        setTeamNotFound(true);
        setLoadingTeam(false);
        return;
      }
      setTeamName(data as string);

      // inquiry_types を取得（is_active=true のみ）
      const { data: types } = await supabase
        .from('inquiry_types')
        .select('id, name, message_template')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('sort_order');

      if (types && types.length > 0) {
        setDisplayTypes(types as DisplayInquiryType[]);

        const typeIds = types.map((t) => t.id);
        const { data: fields } = await supabase
          .from('inquiry_form_fields')
          .select('*')
          .in('inquiry_type_id', typeIds)
          .order('sort_order');

        setAllFields((fields ?? []) as FormField[]);
      } else {
        // フォールバック
        setDisplayTypes(DEFAULT_INQUIRY_TYPES);
        setAllFields([]);
      }

      setLoadingTeam(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // 選択中の種別のフィールド一覧
  const currentFields = selectedTypeId
    ? allFields.filter((f) => f.inquiry_type_id === selectedTypeId)
    : [];

  const handleTypeChange = (id: string) => {
    setSelectedTypeId(id);
    const chosen = displayTypes.find((t) => t.id === id);
    if (chosen?.message_template) {
      setMessage(chosen.message_template);
    } else {
      setMessage('');
    }
    setCustomFieldValues({});
    setValidationError('');
  };

  const handleCustomFieldChange = (fieldId: string, value: string | string[]) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, optionValue: string, checked: boolean) => {
    setCustomFieldValues((prev) => {
      const current = (prev[fieldId] as string[] | undefined) ?? [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, optionValue] };
      } else {
        return { ...prev, [fieldId]: current.filter((v) => v !== optionValue) };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedTypeId) {
      setValidationError('問い合わせ種別を選択してください');
      return;
    }

    // 必須カスタム項目チェック
    for (const field of currentFields) {
      if (!field.is_required) continue;
      const val = customFieldValues[field.id];
      const isEmpty = !val || (Array.isArray(val) ? val.length === 0 : val.trim() === '');
      if (isEmpty) {
        setValidationError(`「${field.field_label}」は必須項目です`);
        return;
      }
    }

    setError('');
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    const submitData: Record<string, unknown> = {
      team_id: teamId,
      type: isDefaultType(selectedTypeId) ? selectedTypeId : 'other',
      inquiry_type_id: isUuid(selectedTypeId) ? selectedTypeId : null,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      message: message.trim() || null,
      custom_fields: Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
    };

    const { error: insertError } = await supabase.from('inquiries').insert(submitData);

    if (insertError) {
      setError('送信に失敗しました。しばらく経ってから再度お試しください。');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">TeamBoard</h1>
            {loadingTeam ? (
              <p className="mt-1 text-sm text-gray-400">読み込み中...</p>
            ) : teamNotFound ? (
              <p className="mt-1 text-sm text-red-500">チームが見つかりません</p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">{teamName}</p>
            )}
          </div>

          {/* Not found state */}
          {!loadingTeam && teamNotFound && (
            <div className="rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
              <p className="text-gray-600">お探しのチームは見つかりませんでした。</p>
              <p className="mt-1 text-sm text-gray-400">URLをご確認ください。</p>
            </div>
          )}

          {/* Success state */}
          {submitted && (
            <div className="rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                お問い合わせを受け付けました
              </h2>
              <p className="text-sm text-gray-600">担当者よりご連絡いたします。</p>
            </div>
          )}

          {/* Confirm dialog */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                <h3 className="mb-3 text-base font-semibold text-gray-900">送信内容の確認</h3>
                <p className="mb-2 text-sm text-gray-600">
                  以下のメールアドレスに問い合わせ内容のコピーが届きます。
                </p>
                <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 break-all">
                  {email}
                </p>
                <p className="mb-5 text-xs text-gray-500">
                  メールが届かない場合は、アドレスが正しいかご確認のうえ、フォームから送信しなおしてください。
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    戻る
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmedSubmit}
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    この内容で送信
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          {!loadingTeam && !teamNotFound && !submitted && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">お問い合わせ</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 問い合わせ種別（プルダウン） */}
                <div>
                  <label
                    htmlFor="inquiryType"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    問い合わせ種別
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <select
                    id="inquiryType"
                    value={selectedTypeId}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {displayTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* お名前 */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    お名前
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="山田 太郎"
                  />
                </div>

                {/* メールアドレス */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    メールアドレス
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                {/* 電話番号 */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    電話番号
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="090-0000-0000"
                  />
                </div>

                {/* カスタムフォーム項目（種別選択時に動的表示） */}
                {currentFields.map((field) => (
                  <div key={field.id}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {field.field_label}
                      {field.is_required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    {field.field_type === 'text' && (
                      <input
                        type="text"
                        value={(customFieldValues[field.id] as string) ?? ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                    {field.field_type === 'textarea' && (
                      <textarea
                        value={(customFieldValues[field.id] as string) ?? ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                    {field.field_type === 'tel' && (
                      <input
                        type="tel"
                        value={(customFieldValues[field.id] as string) ?? ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                    {field.field_type === 'email' && (
                      <input
                        type="email"
                        value={(customFieldValues[field.id] as string) ?? ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                    {field.field_type === 'select' && (
                      <select
                        value={(customFieldValues[field.id] as string) ?? ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">選択してください</option>
                        {((field.options ?? []) as { label: string; value: string }[]).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                    {field.field_type === 'radio' && (
                      <div className="space-y-1">
                        {((field.options ?? []) as { label: string; value: string }[]).map((opt) => (
                          <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              name={`custom_${field.id}`}
                              value={opt.value}
                              checked={(customFieldValues[field.id] as string) === opt.value}
                              onChange={() => handleCustomFieldChange(field.id, opt.value)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {field.field_type === 'checkbox' && (
                      <div className="space-y-1">
                        {((field.options ?? []) as { label: string; value: string }[]).map((opt) => (
                          <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              value={opt.value}
                              checked={((customFieldValues[field.id] as string[]) ?? []).includes(opt.value)}
                              onChange={(e) => handleCheckboxChange(field.id, opt.value, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* メッセージ */}
                <div>
                  <label
                    htmlFor="message"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    メッセージ・ご質問
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="ご質問やご要望をご入力ください"
                  />
                </div>

                {/* Validation error */}
                {validationError && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {validationError}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '送信中...' : '送信する'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        &copy; TeamBoard
      </footer>
    </div>
  );
}
