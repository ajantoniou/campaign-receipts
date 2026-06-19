/* ─── Supabase Client for Cliros ─── */
/* Uses @supabase/ssr for cookie-based auth that works with Next.js middleware */

import { createBrowserClient, createServerClient as createSSRServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const SCHEMA = "cliros";

// ─── Browser client (used in "use client" components) ───
// This client automatically handles auth cookies in the browser.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _browserClient: any = null;

export function getSupabase() {
  if (!_browserClient) {
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { db: { schema: SCHEMA } }
    );
  }
  return _browserClient;
}

// Backward-compat: named export that lazily initializes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = new Proxy({}, {
  get(_target, prop) {
    return getSupabase()[prop];
  },
});

// ─── Server client (API routes, with service_role key) ───
// Uses service_role for admin operations (bypasses RLS).
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: SCHEMA } }
  );
}

// ─── Middleware client (reads cookies from request, sets on response) ───
// Used in middleware.ts to validate auth and pass session through.
export function createMiddlewareClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // We need to create a response that we can modify
  const response = new Response();

  return {
    supabase: createSSRServerClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: SCHEMA },
      cookies: {
        getAll() {
          // Parse cookies from request
          const cookieHeader = request.headers.get("cookie") || "";
          const cookies: { name: string; value: string }[] = [];
          cookieHeader.split(";").forEach((c) => {
            const [name, ...rest] = c.trim().split("=");
            if (name) {
              cookies.push({ name, value: rest.join("=") });
            }
          });
          return cookies;
        },
        setAll() {
          // Middleware doesn't set cookies — the browser client handles this
        },
      },
    }),
    response,
  };
}
