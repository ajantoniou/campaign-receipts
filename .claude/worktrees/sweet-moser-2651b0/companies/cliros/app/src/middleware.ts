/* ─── Cliros Auth Middleware ───
   Protects /dashboard and /api/search routes.
   /search is public (shows preview for unauth, full report for auth).
   Uses @supabase/ssr for cookie-based session validation.
*/

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PAGES = ["/dashboard"];
const PROTECTED_API = ["/api/search"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this path needs protection
  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // Check Authorization header first (API calls from non-browser clients)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ") && isProtectedApi) {
    const token = authHeader.slice(7);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await client.auth.getUser(token);
      if (data?.user) {
        return NextResponse.next();
      }
    } catch {
      // Token invalid
    }
  }

  // Create a response we can modify (to pass updated cookies through)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create SSR Supabase client that reads/writes cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Also set on the response (for the browser)
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validate session — this also refreshes the token if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    // Redirect to login for page routes
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/search/:path*"],
};
