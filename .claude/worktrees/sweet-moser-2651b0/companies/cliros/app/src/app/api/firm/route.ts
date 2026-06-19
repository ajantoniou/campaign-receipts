/* ─── Firm Profile API ───
   GET  /api/firm — load the current user's firm (creates a stub if none)
   POST /api/firm — upsert firm fields (E&O, IOLTA, underwriters, logo, etc.)

   Per Harrington persona feedback (MUST-ADD items):
   - Firm name + address + logo + phone + website (basic letterhead)
   - E&O carrier + policy # + limits + expiration (lender requirement)
   - Title underwriter affiliations (multi-select)
   - IOLTA bank + disclosure paragraph (GA Bar Rule 1.15)
   - Custom exclusions paragraph (negotiated boilerplate)
   - Responsible-attorney address for GA Bar 7.x advertising compliance
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDocumentUrl } from "@/lib/document-storage";

async function getUserId(request: NextRequest): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const c = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data } = await c.auth.getUser();
    if (data?.user) return data.user.id;
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
        return data?.user?.id || null;
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
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const d = db();
  const { data: user } = await d.from("users")
    .select("default_firm_id, firm_name, firm_address, phone")
    .eq("id", userId).single();

  let firm = null;
  if (user?.default_firm_id) {
    const { data } = await d.from("firms").select("*").eq("id", user.default_firm_id).single();
    firm = data;
  }

  // Load primary attorney row if any
  let attorney = null;
  if (firm?.id) {
    const { data: a } = await d.from("firm_attorneys")
      .select("*").eq("firm_id", firm.id).eq("is_default", true).maybeSingle();
    attorney = a;
  }

  return NextResponse.json({
    firm,
    attorney,
    user_basic: { firm_name: user?.firm_name, firm_address: user?.firm_address, phone: user?.phone },
  });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json();
  const d = db();

  // Get or create firm
  const { data: user } = await d.from("users").select("default_firm_id, email").eq("id", userId).single();
  let firmId = user?.default_firm_id;

  const firmFields = {
    firm_name: body.firm_name || "",
    firm_address: body.firm_address || null,
    firm_phone: body.firm_phone || null,
    firm_website: body.firm_website || null,
    firm_logo_path: body.firm_logo_path || null,
    eo_carrier: body.eo_carrier || null,
    eo_policy_no: body.eo_policy_no || null,
    eo_limits: body.eo_limits || null,
    eo_expiration: body.eo_expiration || null,
    iolta_bank: body.iolta_bank || null,
    iolta_disclosure_text: body.iolta_disclosure_text || null,
    title_underwriters: body.title_underwriters || [],
    custom_exclusions_block: body.custom_exclusions_block || null,
    responsible_attorney_address: body.responsible_attorney_address || null,
    spanish_summary_enabled: !!body.spanish_summary_enabled,
    updated_at: new Date().toISOString(),
  };

  if (firmId) {
    await d.from("firms").update(firmFields).eq("id", firmId);
  } else {
    const { data: newFirm } = await d.from("firms")
      .insert({ ...firmFields, owner_user_id: userId })
      .select("id").single();
    if (newFirm) {
      firmId = newFirm.id;
      await d.from("users").update({ default_firm_id: firmId }).eq("id", userId);
    }
  }

  // Upsert primary attorney (name alone is enough — bar # can be added later)
  if (firmId && (body.attorney_name || body.bar_number || body.attorney_email || body.attorney_direct_dial)) {
    const { data: existing } = await d.from("firm_attorneys")
      .select("id").eq("firm_id", firmId).eq("is_default", true).maybeSingle();

    const attorneyFields = {
      name: body.attorney_name || "",
      bar_number: body.bar_number || "",
      state: body.attorney_state || "GA",
      direct_dial: body.attorney_direct_dial || null,
      email: body.attorney_email || null,
    };

    if (existing) {
      await d.from("firm_attorneys").update(attorneyFields).eq("id", existing.id);
    } else {
      await d.from("firm_attorneys").insert({
        ...attorneyFields,
        firm_id: firmId,
        user_id: userId,
        is_default: true,
      });
    }
  }

  return NextResponse.json({ ok: true, firm_id: firmId });
}
