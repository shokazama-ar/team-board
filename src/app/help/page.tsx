import Link from "next/link";
import { ChevronRight } from "lucide-react";

const TOPICS = [
  {
    href: "/help/events",
    label: "予定と出欠管理",
    description: "チームの練習・試合などの予定を作成し、出欠を管理します。",
  },
  {
    href: "/help/announcements",
    label: "お知らせ",
    description: "チームメンバーへの連絡事項を投稿・確認します。",
  },
  {
    href: "/help/categories",
    label: "カテゴリ機能",
    description: "予定・お知らせの対象を絞り込む仕組みです。",
  },
  {
    href: "/help/invite",
    label: "招待コード",
    description: "新しいメンバーをチームに招待する方法です。",
  },
  {
    href: "/help/members",
    label: "メンバー管理",
    description: "アカウントとプレイヤープロファイルの関係を理解しましょう。",
  },
];

export default function HelpIndexPage() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">ヘルプ</h1>
      <p className="mb-8 text-sm text-gray-500">
        TeamBoard の各機能の使い方を説明しています。
      </p>
      <div className="space-y-2">
        {TOPICS.map(({ href, label, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{description}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-gray-400" strokeWidth={1.5} />
          </Link>
        ))}
      </div>
    </article>
  );
}
