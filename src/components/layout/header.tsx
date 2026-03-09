"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Home, Calendar, Megaphone, Users, Settings, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/events", label: "予定表", icon: Calendar },
  { href: "/announcements", label: "お知らせ", icon: Megaphone },
  { href: "/members", label: "メンバー", icon: Users },
  { href: "/settings", label: "設定", icon: Settings },
];

const ALWAYS_ACTIVE = ["/", "/settings"];

export function Header({ hasTeam }: { hasTeam: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();
      if (profile) {
        setDisplayName(profile.name || user.email?.split("@")[0] || "");
        setAvatarUrl(profile.avatar_url ?? null);
      }
    })();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-gray-900">
          TeamBoard
        </Link>
        {/* Desktop nav icons (md+ only) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const isEnabled = hasTeam || ALWAYS_ACTIVE.includes(item.href);
            if (!isEnabled) {
              return (
                <span
                  key={item.href}
                  title={`${item.label}（チーム参加後に利用可能）`}
                  className="p-2 rounded-lg text-gray-300 cursor-not-allowed"
                >
                  <item.icon size={20} strokeWidth={1.5} aria-hidden="true" />
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`p-2 rounded-lg ${isActive ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                <item.icon size={20} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="flex items-center gap-2 hover:opacity-80">
            {avatarUrl ? (
              <div className="h-8 w-8 overflow-hidden rounded-full border border-gray-200">
                <Image
                  src={`${avatarUrl}?t=cached`}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {displayName.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className="hidden text-sm text-gray-700 sm:block">{displayName}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className="hidden sm:block">ログアウト</span>
          </button>
        </div>
      </div>
    </header>
  );
}
