/* ─── Buy Report Package ───
   POST /api/lemon/buy-package { size: 5 | 20 | 50 }
   Returns: { url } — LS hosted checkout URL for the chosen package.

   Webhook order_created (custom_data.kind='package_N') credits the user's
   reports_remaining balance once payment lands.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPackageCheckout, type PackageSize } from "@/lib/lemonsqueezy";

const ALLOWED: PackageSize[] = [1, 5, 25];

async function getUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const c = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data } = await c.auth.getUser();
    if (data?.user) return data.user;
  }
  const ref = url.match(/https:\/\/([^.]+)/)?.[1] || "";
  const ck = request.headers.get("cookie") || "";
  const m = ck.match(new RegExp(`sb-${ref}-auth-token(?:\\.0)?=([^;]+)`));
  if (m) {
    try {
      const parsed = JSON.parse(decodeURIComponent(m[1]));
      if (parsed?.access_token) {
        const c = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${parsed.access_token}` } } });
        const { data } = await c.auth.getUser();
        return data?.user || null;
      }
    } catch { /* */ }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json();
  const size = Number(body.size) as PackageSize;
  if (!ALLOWED.includes(size)) {
    return NextResponse.json({ error: "size must be 1, 5, or 25" }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cliros.ai";

  try {
    const { url, priceCents } = await createPackageCheckout({
      size,
      userId: user.id,
      userEmail: user.email!,
      successUrl: `${origin}/dashboard/billing?package_purchased=${size}`,
    });
    return NextResponse.json({ url, priceCents });
  } catch (err) {
    console.error("[lemon/buy-package]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not start package checkout" }, { status: 500 });
  }
}
