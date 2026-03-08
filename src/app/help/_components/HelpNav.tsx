"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/help", label: "ヘルプ一覧" },
  { href: "/help/events", label: "予定と出欠管理" },
  { href: "/help/announcements", label: "お知らせ" },
  { href: "/help/categories", label: "カテゴリ機能" },
  { href: "/help/invite", label: "招待コード" },
  { href: "/help/members", label: "メンバー管理" },
];

export default function HelpNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`flex shrink-0 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === href
              ? "bg-blue-50 font-medium text-blue-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
