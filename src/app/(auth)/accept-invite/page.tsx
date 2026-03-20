"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const join = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const teamId = user.user_metadata?.team_id as string | undefined;
      if (!teamId) {
        router.push("/");
        return;
      }

      const { error } = await supabase.rpc("accept_team_invite", {
        p_team_id: teamId,
      });
      if (error) console.error(error);

      // プロファイル作成画面へ
      router.push("/teams/join-profile");
    };

    join();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">チームに参加しています…</p>
    </div>
  );
}
