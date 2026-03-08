"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";

type InquiryType = "trial" | "join" | "leave" | "other";

const INQUIRY_TYPES: { value: InquiryType; label: string }[] = [
  { value: "trial", label: "体験・見学希望" },
  { value: "join", label: "入会依頼" },
  { value: "leave", label: "退会依頼" },
  { value: "other", label: "その他のお問い合わせ" },
];

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

  const [inquiryType, setInquiryType] = useState<InquiryType>("trial");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_team_name", {
        tid: teamId,
      });
      if (error || data === null) {
        setTeamNotFound(true);
      } else {
        setTeamName(data as string);
      }
      setLoadingTeam(false);
    })();
  }, [teamId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    const { error: insertError } = await supabase.from("inquiries").insert({
      team_id: teamId,
      type: inquiryType,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      message: message.trim() || null,
    });

    if (insertError) {
      setError("送信に失敗しました。しばらく経ってから再度お試しください。");
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
              <p className="mt-1 text-sm text-red-500">
                チームが見つかりません
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">{teamName}</p>
            )}
          </div>

          {/* Not found state */}
          {!loadingTeam && teamNotFound && (
            <div className="rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
              <p className="text-gray-600">
                お探しのチームは見つかりませんでした。
              </p>
              <p className="mt-1 text-sm text-gray-400">
                URLをご確認ください。
              </p>
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
              <p className="text-sm text-gray-600">
                担当者よりご連絡いたします。
              </p>
            </div>
          )}

          {/* Confirm dialog */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                <h3 className="mb-3 text-base font-semibold text-gray-900">
                  送信内容の確認
                </h3>
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
              <h2 className="mb-6 text-lg font-semibold text-gray-900">
                お問い合わせ
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Inquiry type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    問い合わせ種別
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {INQUIRY_TYPES.map((t) => (
                      <label
                        key={t.value}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="radio"
                          name="inquiryType"
                          value={t.value}
                          checked={inquiryType === t.value}
                          onChange={() => setInquiryType(t.value)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name */}
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

                {/* Email */}
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

                {/* Phone */}
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

                {/* Message */}
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
                  {submitting ? "送信中..." : "送信する"}
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
