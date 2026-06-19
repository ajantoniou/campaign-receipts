import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Auth callback handler — processes email confirmation & password recovery links
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "recovery" | "invite";
  const requestedNext = searchParams.get("next");
  const fallbackNext = type === "recovery" ? "/reset-password" : "/dashboard";
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : fallbackNext;
  const redirectTo = new URL(next, request.url);
  let response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get("cookie") || "";
          return cookieHeader
            .split(";")
            .map((cookie) => cookie.trim())
            .filter(Boolean)
            .map((cookie) => {
              const [name, ...value] = cookie.split("=");
              return { name, value: value.join("=") };
            });
        },
        setAll(cookiesToSet) {
          response = NextResponse.redirect(redirectTo);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type === "signup" ? "email" : type,
    });

    if (!error) {
      return response;
    }
  }

  if (searchParams.get("access_token") && searchParams.get("refresh_token")) {
    const { error } = await supabase.auth.setSession({
      access_token: searchParams.get("access_token")!,
      refresh_token: searchParams.get("refresh_token")!,
    });

    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
}
