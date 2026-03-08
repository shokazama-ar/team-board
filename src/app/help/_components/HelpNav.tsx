"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();

  return (
    <>
      {/* モバイル: セレクトボックス */}
      <select
        className="md:hidden w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={pathname}
        onChange={(e) => router.push(e.target.value)}
      >
        {NAV_ITEMS.map(({ href, label }) => (
          <option key={href} value={href}>
            {label}
          </option>
        ))}
      </select>

      {/* デスクトップ: サイドバーリスト */}
      <nav className="hidden md:flex md:flex-col md:gap-1">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === href
                ? "bg-blue-50 font-medium text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
