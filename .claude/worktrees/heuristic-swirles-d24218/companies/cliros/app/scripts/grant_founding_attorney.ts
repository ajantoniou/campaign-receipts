#!/usr/bin/env npx tsx
/* ─── Grant founding-attorney status ───
   Comp 10 title-closing dossiers + flip role='founding_attorney' on a user account
   that's already signed up at https://cliros.ai. Sends a welcome email via
   Resend so the attorney knows what they got and how to redeem.

   Usage:
     npx tsx scripts/grant_founding_attorney.ts <email> "<Firm Name>"

   The user MUST already have a cliros.users row (i.e. they signed up). If
   they haven't, ask them to sign up first then re-run this script.

   See companies/cliros/FOUNDING_ATTORNEY_PROGRAM.md for the full offer
   structure + outreach email template.
*/

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });
dotenv.config({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

const CREDIT_COUNT = 10;
const EXPIRY_MONTHS = 3;
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

async function findUserIdByEmail(email: string): Promise<string | null> {
  const auth = adminAuth();
  const { data } = await auth.auth.admin.listUsers({ perPage: 200 });
  const u = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return u?.id || null;
}

async function sendWelcomeEmail(args: {
  toEmail: string;
  firstName: string;
  firmName: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[grant] RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  const subject = `${args.firmName}: your 10 Cliros title-closing dossiers are live`;
  const html = `<p>Hi ${args.firstName},</p>
<p>You're in. ${CREDIT_COUNT} Cliros title-closing dossiers just hit your account — no card required,
no code required, no expiration for 3 months.</p>
<p><strong>How to use them:</strong></p>
<ol>
  <li>Sign in at <a href="https://cliros.ai/login">cliros.ai/login</a></li>
  <li>Click <strong>New Search</strong> and run any GA property you'd normally send to your abstractor.</li>
  <li>Open <strong>Improve accuracy (optional)</strong> and paste the seller name from the P&amp;S — this single field makes our results dramatically sharper.</li>
  <li>After the report runs (~3 minutes), use the green Feedback widget at the bottom to tell us if we got it right. Even a thumbs up + "looks good" is gold.</li>
</ol>
<p><strong>What we ask:</strong> one quick feedback note per dossier you run. That's it. We'll book a 20-minute call at the end of the beta to walk through what you'd change.</p>
<p>Reports are informational research — you remain the attorney of record on every closing.
Every PDF says so.</p>
<p>Reply to this email any time with bugs, ideas, or "this saved me 90 minutes today." Direct
to me.</p>
<p>— Alex<br>
alex@cliros.ai · founder, Cliros</p>
<hr>
<p style="font-size:11px;color:#888">Founding cohort grant: ${CREDIT_COUNT} dossiers, expires
${new Date(Date.now() + EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
After expiry: founding firms get preferred pricing before public launch.</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: args.toEmail,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.warn(`[grant] welcome email failed (${res.status}): ${txt.slice(0, 200)}`);
  } else {
    console.log(`[grant] welcome email sent to ${args.toEmail}`);
  }
}

async function main() {
  const [, , emailArg, firmArg] = process.argv;
  if (!emailArg || !firmArg) {
    console.error('Usage: npx tsx scripts/grant_founding_attorney.ts <email> "<Firm Name>"');
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  const firmName = firmArg.trim();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY required in .env.local or monorepo .env");
    process.exit(1);
  }

  // 1. Find the user in Supabase Auth.
  const userId = await findUserIdByEmail(email);
  if (!userId) {
    console.error(`[grant] no auth user found for ${email}`);
    console.error("Ask the attorney to sign up at https://cliros.ai/login first, then re-run this script.");
    process.exit(2);
  }

  const d = db();

  // 2. Read current state.
  const { data: u } = await d
    .from("users")
    .select("email, name, role, reports_remaining, reports_purchased_total")
    .eq("id", userId)
    .single();
  if (!u) {
    console.error(`[grant] auth user ${userId} exists but no cliros.users row — login at least once to bootstrap`);
    process.exit(3);
  }
  if (u.role === "founding_attorney") {
    console.warn(`[grant] ${email} already has role=founding_attorney. Granting again will ADD ${CREDIT_COUNT} more credits.`);
  }

  // 3. Insert the comp package.
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + EXPIRY_MONTHS);
  const orderTag = `founding_attorney_${userId}_${Date.now()}`;
  const { error: pkgErr } = await d.from("report_packages").insert({
    user_id: userId,
    ls_order_id: orderTag,
    size: CREDIT_COUNT,
    amount_cents: 0,
    reports_remaining: CREDIT_COUNT,
    expires_at: expiresAt.toISOString(),
  });
  if (pkgErr) {
    console.error(`[grant] package insert failed: ${pkgErr.message}`);
    process.exit(4);
  }

  // 4. Bump user balance + flip role.
  const { error: userErr } = await d
    .from("users")
    .update({
      reports_remaining: (u.reports_remaining ?? 0) + CREDIT_COUNT,
      reports_purchased_total: (u.reports_purchased_total ?? 0) + CREDIT_COUNT,
      role: "founding_attorney",
      name: u.name || firmName,
    })
    .eq("id", userId);
  if (userErr) {
    console.error(`[grant] user update failed: ${userErr.message}`);
    process.exit(5);
  }

  console.log(`[grant] ✓ ${email} (${firmName}) — granted ${CREDIT_COUNT} credits, role=founding_attorney, expires ${expiresAt.toISOString().slice(0, 10)}`);

  // 5. Welcome email (best-effort).
  const firstName = (u.name || firmName).split(/[\s,]+/)[0] || "Counselor";
  await sendWelcomeEmail({ toEmail: email, firstName, firmName });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
