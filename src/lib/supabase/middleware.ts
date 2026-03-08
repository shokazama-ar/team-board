import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_KEY
        ? { storageKey: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_KEY }
        : undefined,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicPaths = ["/login", "/signup", "/auth/callback", "/forgot-password", "/reset-password", "/contact"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Check if authenticated user has a team (skip for setup and settings pages)
  const skipTeamCheck = ["/teams/setup", "/settings", "/onboarding"];
  const shouldCheckTeam =
    user &&
    !isPublicPath &&
    !skipTeamCheck.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

  if (shouldCheckTeam) {
    const { data: teamId } = await supabase.rpc("get_my_team_id");

    if (!teamId) {
      const url = request.nextUrl.clone();
      url.pathname = "/teams/setup";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
