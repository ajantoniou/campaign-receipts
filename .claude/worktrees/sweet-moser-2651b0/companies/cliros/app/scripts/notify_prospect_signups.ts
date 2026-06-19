#!/usr/bin/env npx tsx
/* ─── Notify Alex when a contacted prospect signs up ───
   Run by Render cron every 5 minutes. Finds new cliros.users rows whose
   email matches a prospect we already mailed (outreach_emails) and where
   prospects.signup_notified_at IS NULL. Emails Alex one summary per
   signup with the firm name + grant command, then stamps notified_at so
   the next tick is a no-op.

   Idempotent. Safe to run repeatedly. Catches up across any backlog of
   missed ticks. No-op when there's nothing to send.
*/

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });
dotenv.config({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

const NOTIFY_TO = process.env.CLIROS_FOUNDER_EMAIL || "alex@antoniou.net";
const FROM = process.env.RESEND_FROM || "alex@cliros.ai";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );
}

function adminAuth() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

interface MatchedSignup {
  prospect_id: string;
  prospect_email: string;
  business_name: string;
  attorney_first_name: string | null;
  city: string | null;
  user_id: string;
  user_created_at: string;
  user_name: string | null;
  outreach_delivered_at: string;
}

async function findNewSignups(): Promise<MatchedSignup[]> {
  const d = db();

  // Get all contacted prospects who haven't been signup-notified yet.
  const { data: prospects, error } = await d
    .from("prospects")
    .select(`
      id, email, business_name, attorney_first_name, city, last_contacted_at,
      outreach_emails(delivered_at)
    `)
    .eq("outreach_status", "contacted")
    .is("signup_notified_at", null)
    .not("email", "is", null);
  if (error) {
    console.error("[notify] prospect query failed:", error.message);
    return [];
  }
  if (!prospects?.length) return [];

  // Get all signed-up users to match against.
  const auth = adminAuth();
  const { data: usersPage } = await auth.auth.admin.listUsers({ perPage: 200 });
  const userByEmail = new Map<string, { id: string; created_at: string; name?: string }>();
  for (const u of usersPage?.users || []) {
    if (!u.email) continue;
    userByEmail.set(u.email.toLowerCase(), {
      id: u.id,
      created_at: u.created_at,
      name: (u.user_metadata?.name as string) || (u.user_metadata?.full_name as string) || undefined,
    });
  }

  const out: MatchedSignup[] = [];
  for (const p of prospects as unknown as Array<Record<string, unknown>>) {
    const email = String(p.email || "").toLowerCase();
    if (!email) continue;
    const user = userByEmail.get(email);
    if (!user) continue;
    const oe = (p.outreach_emails as Array<{ delivered_at: string }> | null) || [];
    out.push({
      prospect_id: String(p.id),
      prospect_email: email,
      business_name: String(p.business_name || "Unknown firm"),
      attorney_first_name: (p.attorney_first_name as string | null) || null,
      city: (p.city as string | null) || null,
      user_id: user.id,
      user_created_at: user.created_at,
      user_name: user.name || null,
      outreach_delivered_at: oe[0]?.delivered_at || (p.last_contacted_at as string) || "",
    });
  }
  return out;
}

async function sendNotification(s: MatchedSignup): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[notify] RESEND_API_KEY not set — skipping send");
    return false;
  }

  const firstName = s.attorney_first_name || s.user_name?.split(/\s+/)[0] || "Counselor";
  const subject = `🎯 Cliros founding signup: ${s.business_name} (${firstName})`;
  const html = `<h2>One of our 5 founding-attorney prospects just signed up.</h2>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td style="padding:4px 12px 4px 0;color:#666">Firm</td><td><strong>${s.business_name}</strong></td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666">Attorney</td><td>${firstName}${s.user_name ? ` (signed up as ${s.user_name})` : ""}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${s.prospect_email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666">City</td><td>${s.city || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666">We emailed them</td><td>${new Date(s.outreach_delivered_at).toLocaleString("en-US")}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666">They signed up</td><td>${new Date(s.user_created_at).toLocaleString("en-US")}</td></tr>
</table>

<p><strong>Grant their 20 founding credits + welcome email:</strong></p>
<pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto">cd companies/cliros/app
npx tsx scripts/grant_founding_attorney.ts ${s.prospect_email} "${s.business_name}"</pre>

<p style="color:#888;font-size:11px">Automated notification from <code>scripts/notify_prospect_signups.ts</code>.
You will not get a second email about this signup.</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: FROM, to: NOTIFY_TO, subject, html }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.warn(`[notify] resend send failed (${res.status}): ${t.slice(0, 200)}`);
    return false;
  }
  console.log(`[notify] ✓ emailed Alex re: ${s.business_name} (${s.prospect_email})`);
  return true;
}

async function markNotified(prospectId: string): Promise<void> {
  const d = db();
  const { error } = await d
    .from("prospects")
    .update({ signup_notified_at: new Date().toISOString() })
    .eq("id", prospectId);
  if (error) console.warn(`[notify] mark-notified failed for ${prospectId}: ${error.message}`);
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const signups = await findNewSignups();
  if (signups.length === 0) {
    console.log("[notify] no new prospect signups");
    return;
  }
  console.log(`[notify] found ${signups.length} new prospect signup(s)`);

  for (const s of signups) {
    const sent = await sendNotification(s);
    // Stamp regardless — if Resend hiccupped, the next tick re-tries
    // ONLY if we leave notified_at NULL. Trade-off: stamp on success
    // path = no spam if Resend has a transient failure on tick N, but
    // we silently lose the notification. Choose stamp-on-success: a
    // missed notification beats spamming you with the same signup
    // every 5 min for hours if the API key rotates.
    if (sent) await markNotified(s.prospect_id);
  }
  console.log("[notify] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
