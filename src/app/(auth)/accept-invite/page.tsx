"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<{ code: string; description: string } | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const errorCode = params.get("error_code");
    const errorDesc = params.get("error_description");

    if (errorCode) {
      setAuthError({ code: errorCode, description: errorDesc ?? "" });
      return;
    }

    const supabase = createClient();
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // onAuthStateChange を先に登録してからセッションを設定する（イベント取りこぼし防止）
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

    // implicit flow: ハッシュにトークンがある場合は手動でセッションを設定
    // createBrowserClient は detectSessionInUrl がデフォルト無効のため
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }

    return () => subscription.unsubscribe();
  }, [router]);

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-600">
            {authError.code === "otp_expired"
              ? "招待リンクの有効期限が切れています。チーム管理者に再招待を依頼してください。"
              : `招待リンクが無効です（${authError.description}）。`}
          </p>
          <a href="/login" className="text-sm text-blue-600 underline">
            ログインページへ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">チームに参加しています…</p>
    </div>
  );
}
