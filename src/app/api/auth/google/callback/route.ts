import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const teamId = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = req.nextUrl.origin;

  if (error || !code || !teamId) {
    return NextResponse.redirect(
      `${baseUrl}/settings?google_error=cancelled`
    );
  }

  // 管理者チェック
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const { data: teamMember } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .eq("role", "admin")
    .single();

  if (!teamMember) {
    return NextResponse.redirect(
      `${baseUrl}/settings?google_error=forbidden`
    );
  }

  // 認証コードをトークンに交換
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:3000/api/auth/google/callback";

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Google token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(
      `${baseUrl}/settings?google_error=token_failed`
    );
  }

  const tokenData = await tokenRes.json();
  const refreshToken = tokenData.refresh_token as string | undefined;

  if (!refreshToken) {
    return NextResponse.redirect(
      `${baseUrl}/settings?google_error=no_refresh_token`
    );
  }

  // DBに保存
  const { error: updateError } = await supabase
    .from("teams")
    .update({
      google_refresh_token: refreshToken,
      google_sync_enabled: true,
    })
    .eq("id", teamId);

  if (updateError) {
    console.error("Failed to save refresh token:", updateError);
    return NextResponse.redirect(
      `${baseUrl}/settings?google_error=db_failed`
    );
  }

  return NextResponse.redirect(`${baseUrl}/settings?google_success=1`);
}
