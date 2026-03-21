"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinError = searchParams.get("error");
  const invitationToken = searchParams.get("invitation_token");
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

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // hash にトークンがない = PKCE フロー（サーバー側で処理済み）→ パスワード設定へ
    if (!accessToken) {
      router.push("/set-password");
      return;
    }

    if (!invitationToken) {
      setAuthError({ code: "missing_token", description: "" });
      return;
    }

    // implicit flow: onAuthStateChange を先に登録してからセッションを設定する
    const supabase = createClient();
    let done = false;

    const acceptInvite = async () => {
      if (done) return;
      done = true;
      subscription.unsubscribe();

      const { error } = await supabase.rpc("accept_team_invite_by_token", {
        p_token: invitationToken,
      });
      if (error) {
        console.error(error);
        setAuthError({ code: "rpc_failed", description: error.message });
        return;
      }
      router.push("/set-password");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        acceptInvite();
      }
    });

    // setSession を await して、onAuthStateChange が発火しないケースにも対応する
    (async () => {
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? "",
      });
      if (sessionError) {
        if (!done) setAuthError({ code: "session_failed", description: sessionError.message });
        return;
      }
      // onAuthStateChange が発火しなかった場合のフォールバック
      if (data.session?.user && !done) {
        acceptInvite();
      }
    })();

    return () => {
      done = true;
      subscription.unsubscribe();
    };
  }, [router, invitationToken]);

  if (joinError === "join_failed") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-600">
            チームへの参加に失敗しました。チーム管理者に再招待を依頼してください。
          </p>
          <a href="/login" className="text-sm text-blue-600 underline">
            ログインページへ
          </a>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-600">
            {authError.code === "otp_expired"
              ? "招待リンクの有効期限が切れています。チーム管理者に再招待を依頼してください。"
              : "チームへの参加に失敗しました。チーム管理者に再招待を依頼してください。"}
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

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">チームに参加しています…</p>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
