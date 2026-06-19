/* ─── Resend webhook ───
   POST /api/resend/webhook
   Resend dashboard → Webhooks → register this URL with these events:
     email.delivered, email.opened, email.clicked, email.bounced,
     email.complained, email.delivery_delayed

   Each event ships `data.email_id` which matches the row we stored in
   `cliros.outreach_emails.external_id` at send-time. We just look up by
   that and stamp the appropriate timestamp.

   Signature verification: Resend uses Svix signatures. If
   RESEND_WEBHOOK_SECRET is set, verify; otherwise accept (dev mode).
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );
}

/* Svix signature: header `svix-signature` = "v1,<base64>". Computed as
   HMAC-SHA256 of `<id>.<timestamp>.<rawBody>` using the secret (base64
   after stripping the `whsec_` prefix). See https://docs.svix.com/receiving/verifying-payloads/how-manual */
function verifySvix(raw: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // dev — accept everything
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sig = headers.get("svix-signature");
  if (!id || !ts || !sig) return false;
  const keyB64 = secret.replace(/^whsec_/, "");
  const keyBytes = Buffer.from(keyB64, "base64");
  const signedPayload = `${id}.${ts}.${raw}`;
  const expected = createHmac("sha256", keyBytes).update(signedPayload).digest("base64");
  // svix-signature may contain multiple "v1,sig v1,sig2" space-separated
  for (const part of sig.split(" ")) {
    const [, value] = part.split(",");
    if (!value) continue;
    try {
      if (timingSafeEqual(Buffer.from(value), Buffer.from(expected))) return true;
    } catch { /* length mismatch — try next */ }
  }
  return false;
}

const EVENT_TO_COLUMN: Record<string, string> = {
  "email.delivered": "delivered_at",
  "email.opened": "opened_at",
  "email.clicked": "clicked_at",
  "email.bounced": "bounced_at",
  "email.complained": "bounced_at", // treat complaint as terminal
};

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifySvix(raw, request.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let payload: { type?: string; data?: { email_id?: string; to?: string[] } };
  try { payload = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const type = payload.type || "";
  const emailId = payload.data?.email_id;
  const column = EVENT_TO_COLUMN[type];
  if (!emailId || !column) {
    return NextResponse.json({ ok: true, skipped: type });
  }
  const sb = db();
  const { error } = await sb
    .from("outreach_emails")
    .update({ [column]: new Date().toISOString() })
    .eq("external_id", emailId)
    .is(column, null); // idempotent: only stamp the first event
  if (error) {
    console.error("[resend-webhook]", type, emailId, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, type, email_id: emailId });
}
