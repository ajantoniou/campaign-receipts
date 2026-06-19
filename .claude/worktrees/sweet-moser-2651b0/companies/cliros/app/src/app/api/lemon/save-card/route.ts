/* ─── LemonSqueezy "Save Card on File" ───
   POST /api/lemon/save-card → returns { url } for a $0 metered checkout
   that LS uses to capture card + start a metered subscription. Webhook
   handler stores ls_subscription_id + ls_subscription_item_id once the
   subscription_created event arrives.

   GET /api/lemon/save-card → returns current saved-card info (brand,
   last4, status) from the user's active subscription, or null.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMeteredCheckout, getSubscriptionCardInfo } from "@/lib/lemonsqueezy";

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

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data: row } = await db()
    .from("users")
    .select("ls_subscription_id, ls_card_brand, ls_card_last4, ls_subscription_status")
    .eq("id", user.id)
    .single();

  if (!row?.ls_subscription_id) {
    return NextResponse.json({ card: null });
  }

  // Refresh from LS in case status changed (paused, expired, etc.)
  let live = null;
  try {
    live = await getSubscriptionCardInfo(row.ls_subscription_id);
  } catch (err) {
    console.warn("[lemon/save-card GET] LS lookup failed", err);
  }

  // Persist any change
  if (live && (live.brand !== row.ls_card_brand || live.last4 !== row.ls_card_last4 || live.status !== row.ls_subscription_status)) {
    await db().from("users").update({
      ls_card_brand: live.brand,
      ls_card_last4: live.last4,
      ls_subscription_status: live.status,
    }).eq("id", user.id);
  }

  const display = live || {
    brand: row.ls_card_brand,
    last4: row.ls_card_last4,
    status: row.ls_subscription_status,
  };

  return NextResponse.json({ card: display });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cliros.ai";

  try {
    const { url } = await createMeteredCheckout({
      userId: user.id,
      userEmail: user.email!,
      successUrl: `${origin}/dashboard/billing?card_saved=1`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[lemon/save-card POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not start card setup" }, { status: 500 });
  }
}
