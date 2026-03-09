"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white md:hidden">
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

