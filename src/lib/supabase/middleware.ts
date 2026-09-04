import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth-redirect";
import { isAuthPath, isPrivateAppPath, isPublicPath } from "@/lib/public-routes";
import { supabasePublicDefaults } from "@/lib/supabase/public-config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || supabasePublicDefaults.url;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || supabasePublicDefaults.anonKey;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (user && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/home";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && isPrivateAppPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPath(pathname) && pathname !== "/reset-password") {
    const redirectUrl = request.nextUrl.clone();
    const requested = request.nextUrl.searchParams.get("next");
    const next = sanitizeNextPath(requested);
    redirectUrl.pathname =
      requested === "/setup/complete" || next.startsWith("/invite/") || next === "/setup/complete"
        ? requested === "/setup/complete"
          ? "/setup/complete"
          : next
        : "/home";
    redirectUrl.searchParams.delete("next");
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && !isPublicPath(pathname) && !isAuthPath(pathname) && !pathname.startsWith("/api")) {
    // Public marketing assets and generated metadata stay reachable.
  }

  return supabaseResponse;
}
