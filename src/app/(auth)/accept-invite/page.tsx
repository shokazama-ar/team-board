"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // PKCE・implicit flow 両方に対応するため onAuthStateChange でセッション確立を待つ
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        subscription.unsubscribe();

        const teamId = session.user.user_metadata?.team_id as string | undefined;
        if (!teamId) { router.push("/"); return; }

        const { error } = await supabase.rpc("accept_team_invite", { p_team_id: teamId });
        if (error) console.error(error);

        router.push("/teams/join-profile");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">チームに参加しています…</p>
    </div>
  );
}
