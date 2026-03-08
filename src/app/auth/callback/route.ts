import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type");

  // `next` may be a path like "/onboarding" but additional query params
  // (e.g. `invite=CODE`) may have been parsed out separately when the
  // emailRedirectTo URL was constructed without encoding the inner query string.
  // Reconstruct the full redirect path by re-appending any extra params.
  const excludedParams = new Set(["code", "next", "type"]);
  const extraParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (!excludedParams.has(key)) {
      extraParams.set(key, value);
    }
  }
  const extraQuery = extraParams.toString();
  const nextWithExtra = extraQuery
    ? `${next}${next.includes("?") ? "&" : "?"}${extraQuery}`
    : next;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      return NextResponse.redirect(`${origin}${nextWithExtra}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
