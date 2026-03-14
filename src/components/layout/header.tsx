"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const router = useRouter();
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
    <header className="shrink-0 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-gray-900">
          TeamBoard
        </Link>
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
