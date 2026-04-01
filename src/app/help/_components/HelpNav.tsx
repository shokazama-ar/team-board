"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/help", label: "ヘルプ一覧" },
  { href: "/help/events", label: "予定と出欠管理" },
  { href: "/help/announcements", label: "お知らせ" },
  { href: "/help/categories", label: "カテゴリ機能" },
  { href: "/help/invite", label: "メンバー招待" },
  { href: "/help/inquiries", label: "問い合わせ管理" },
  { href: "/help/members", label: "メンバー管理" },
];

export default function HelpNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const [navVisible, setNavVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNavVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const currentLabel = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "ヘルプ";

  return (
    <>
      <div ref={navRef}>
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
      </div>

      {/* ナビが画面外に出たら表示するフローティングボタン */}
      {!navVisible && (
        <div className="fixed bottom-6 right-6 z-50">
          {menuOpen && (
            <>
              {/* 背景オーバーレイ */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              {/* メニューパネル */}
              <div className="absolute bottom-14 right-0 z-50 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <p className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-600">
                  ヘルプメニュー
                </p>
                <nav className="py-1">
                  {NAV_ITEMS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === href
                          ? "bg-blue-50 font-medium text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "メニューを閉じる" : "ヘルプメニューを開く"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {!menuOpen && (
            <p className="mt-1 text-center text-[10px] text-gray-500">{currentLabel}</p>
          )}
        </div>
      )}
    </>
  );
}
