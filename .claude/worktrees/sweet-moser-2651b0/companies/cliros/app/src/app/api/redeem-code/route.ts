/* ─── Beta code redemption ───
   POST /api/redeem-code { code }
   Header: Authorization: Bearer <supabase access token>

   Valid codes (case-insensitive):
     FOUNDING5  → 10 credits + role=founding_attorney + 3-month expiry
     (Future codes go here as the cohort expands.)

   Idempotent: a user can hit redeem multiple times but only the FIRST
   valid call mints credits. Subsequent calls return { already_redeemed: true }.

   Public default: anyone who signs up WITHOUT a code lands on the existing
   5-credit free trial (free_reports_total=5 column default). This endpoint
   is the ONLY way to bump above that.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CodeDefinition {
  credits: number;
  role: string;
  expiryMonths: number;
  notes: string;
}

const CODES: Record<string, CodeDefinition> = {
  FOUNDING5: {
    credits: 10,
    role: "founding_attorney",
    expiryMonths: 3,
    notes: "Founding-attorney beta — 10 free title-closing dossiers, 3-month expiry.",
  },
};

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );
}

async function getUserIdFromAuthHeader(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${match[1]}` } } },
  );
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromAuthHeader(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to redeem a code." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const codeRaw = String((body as { code?: string }).code || "").trim().toUpperCase();
  const def = CODES[codeRaw];
  if (!def) {
    return NextResponse.json(
      { error: "That code isn't recognized. Email alex@cliros.ai if you believe it should be valid." },
      { status: 400 },
    );
  }

  const db = adminDb();

  // Idempotency — has this user redeemed already? Re-using the
  // report_packages table with ls_order_id="code:<CODE>:<userId>".
  const orderTag = `code:${codeRaw}:${userId}`;
  const { data: existing } = await db
    .from("report_packages")
    .select("id")
    .eq("ls_order_id", orderTag)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, already_redeemed: true, credits: def.credits });
  }

  // Read current user row (created by signup-time upsert).
  const { data: u } = await db
    .from("users")
    .select("reports_remaining, reports_purchased_total, role, name")
    .eq("id", userId)
    .maybeSingle();
  if (!u) {
    return NextResponse.json({ error: "User profile not found. Sign in again then retry." }, { status: 404 });
  }

  // 1. Grant the comp package.
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + def.expiryMonths);
  const { error: pkgErr } = await db.from("report_packages").insert({
    user_id: userId,
    ls_order_id: orderTag,
    size: def.credits,
    amount_cents: 0,
    reports_remaining: def.credits,
    expires_at: expiresAt.toISOString(),
  });
  if (pkgErr) {
    return NextResponse.json({ error: `Could not grant credits: ${pkgErr.message}` }, { status: 500 });
  }

  // 2. Bump user balance + role.
  const { error: userErr } = await db
    .from("users")
    .update({
      reports_remaining: (u.reports_remaining as number | null ?? 0) + def.credits,
      reports_purchased_total: (u.reports_purchased_total as number | null ?? 0) + def.credits,
      role: def.role,
    })
    .eq("id", userId);
  if (userErr) {
    return NextResponse.json({ error: `Could not update profile: ${userErr.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    credits: def.credits,
    role: def.role,
    expires_at: expiresAt.toISOString(),
    notes: def.notes,
  });
}
