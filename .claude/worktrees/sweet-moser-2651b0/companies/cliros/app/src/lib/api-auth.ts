/* Session auth for API route handlers — uses @supabase/ssr + request cookies (chunked tokens). */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

const SCHEMA = "cliros";

export function createRequestSupabase(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: SCHEMA },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          /* read-only in route handlers; middleware refreshes tokens on dashboard */
        },
      },
    }
  );
}

export async function getUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const { createClient } = await import("@supabase/supabase-js");
    const c = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await c.auth.getUser(authHeader.slice(7));
    return data.user ?? null;
  }

  const supabase = createRequestSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export function authRequiredResponse(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}
