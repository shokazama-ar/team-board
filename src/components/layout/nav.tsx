"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, Calendar, Megaphone, Users, Settings, type LucideIcon } from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/events", label: "予定表", icon: Calendar },
  { href: "/announcements", label: "お知らせ", icon: Megaphone },
  { href: "/members", label: "メンバー", icon: Users },
  { href: "/settings", label: "設定", icon: Settings },
];

const ALWAYS_ACTIVE = ["/", "/settings"];

export function BottomNav({ hasTeam }: { hasTeam: boolean }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setHidden(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setHidden(false), 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden transition-transform duration-200 ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const isEnabled = hasTeam || ALWAYS_ACTIVE.includes(item.href);

          if (!isEnabled) {
            return (
              <span
                key={item.href}
                aria-label={`${item.label}（チーム参加後に利用可能）`}
                className="flex flex-1 flex-col items-center py-3 text-gray-300 cursor-not-allowed"
              >
                <item.icon size={24} strokeWidth={1.5} aria-hidden="true" />
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex flex-1 flex-col items-center py-3 ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`}
            >
              <item.icon size={24} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav({ hasTeam }: { hasTeam: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block">
      <ul className="space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const isEnabled = hasTeam || ALWAYS_ACTIVE.includes(item.href);

          if (!isEnabled) {
            return (
              <li key={item.href}>
                <span
                  title={`${item.label}（チーム参加後に利用可能）`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 cursor-not-allowed"
                >
                  <item.icon size={20} strokeWidth={1.5} aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon size={20} strokeWidth={1.5} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
