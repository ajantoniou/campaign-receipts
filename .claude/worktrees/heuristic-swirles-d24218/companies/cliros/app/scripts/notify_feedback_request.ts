#!/usr/bin/env npx tsx
/* ─── Post-report feedback nudge ───
   Cron every 30 min. Finds ready/delivered reports >2h old where:
     - the user hasn't already left feedback for THIS report, AND
     - we haven't already sent them a nudge.
   Emails the user a short ask with a thumbs-up/down + comment box that
   links back to the report's feedback widget. Stamps
   search_reports.feedback_email_sent_at so the next tick is a no-op.

   Idempotent. No-op when there's nothing to send.
*/

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });
dotenv.config({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cliros.ai";
const FROM = process.env.RESEND_FROM || "alex@cliros.ai";
const MIN_AGE_MINUTES = 120; // wait 2h after the report ships
const BATCH_LIMIT = 50; // safety cap per tick

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

interface DueReport {
  id: string;
  user_id: string;
  address: string;
  completed_at: string;
}

async function findDueReports(): Promise<DueReport[]> {
  const d = db();
  const cutoff = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await d
    .from("search_reports")
    .select(`
      id, user_id, completed_at,
      properties(full_address)
    `)
    .in("pipeline_stage", ["ready", "delivered"])
    .is("feedback_email_sent_at", null)
    .lte("completed_at", cutoff)
    .order("completed_at", { ascending: true })
    .limit(BATCH_LIMIT);
  if (error) {
    console.error("[feedback-nudge] query failed:", error.message);
    return [];
  }
  if (!data?.length) return [];

  // Filter out any reports that ALREADY have feedback (user submitted via
  // the dashboard widget). Single query — cheap at 50.
  const ids = data.map((r) => r.id);
  const { data: existing } = await d
    .from("beta_feedback")
    .select("report_id")
    .in("report_id", ids);
  const haveFeedback = new Set((existing || []).map((r) => r.report_id));

  return data
    .filter((r) => !haveFeedback.has(r.id))
    .map((r) => {
      const prop = (r.properties as { full_address?: string } | { full_address?: string }[] | null) || null;
      const propRow = Array.isArray(prop) ? prop[0] : prop;
      return {
        id: r.id as string,
        user_id: r.user_id as string,
        address: propRow?.full_address || "your property search",
        completed_at: r.completed_at as string,
      };
    });
}

async function userEmail(userId: string): Promise<{ email: string; name?: string } | null> {
  const auth = adminAuth();
  const { data } = await auth.auth.admin.getUserById(userId);
  if (!data?.user?.email) return null;
  return {
    email: data.user.email,
    name: (data.user.user_metadata?.name as string) ||
      (data.user.user_metadata?.full_name as string) ||
      undefined,
  };
}

async function sendNudge(r: DueReport, to: { email: string; name?: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[feedback-nudge] RESEND_API_KEY not set — skipping send");
    return false;
  }
  const firstName = to.name?.split(/\s+/)[0] || "Counselor";
  const reportUrl = `${APP_URL}/dashboard/reports/${r.id}#feedback`;
  const subject = `Quick feedback on your Cliros report — ${r.address.split(",")[0]}`;
  const html = `<p>Hi ${firstName},</p>
<p>You ran a Cliros report a couple hours ago on <strong>${r.address}</strong>. While it's fresh, we'd love a quick read.</p>

<p style="font-size:15px;font-weight:600;margin:24px 0 8px">Did this report save you time?</p>
<p style="margin:0 0 24px">
  <a href="${reportUrl}&fb=up"
     style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:10px 22px;border-radius:6px;font-weight:600;margin-right:8px">
    👍 Yes, it was useful
  </a>
  <a href="${reportUrl}&fb=down"
     style="display:inline-block;background:#dc2626;color:white;text-decoration:none;padding:10px 22px;border-radius:6px;font-weight:600">
    👎 No — here's what was wrong
  </a>
</p>

<p>Either way, one sentence is gold. Reply to this email, or drop a note in the green feedback box at the bottom of the report — it routes straight to me.</p>

<p style="font-size:14px;color:#666;margin-top:24px">Common things we want to know:</p>
<ul style="font-size:14px;color:#444;margin-top:0">
  <li>Did the chain look right vs. your usual abstractor?</li>
  <li>Was anything missing? Wrong?</li>
  <li>Would the draft AOL or warranty deed actually save you time, or did you have to rewrite from scratch?</li>
  <li>What document or check do you wish Cliros also produced?</li>
</ul>

<p>Thank you for helping a small business owner build this thing.</p>

<p>— Alex<br>
alex@cliros.ai · founder, Cliros</p>

<p style="font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px;margin-top:24px">
You're receiving this once per report you run during the founding beta. You will not get a second email about this specific report.
</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: `Alex Antoniou <${FROM}>`,
      to: to.email,
      reply_to: "alex@cliros.ai",
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.warn(`[feedback-nudge] send to ${to.email} failed (${res.status}): ${t.slice(0, 200)}`);
    return false;
  }
  console.log(`[feedback-nudge] ✓ asked ${to.email} for feedback on ${r.id}`);
  return true;
}

async function stamp(reportId: string) {
  await db()
    .from("search_reports")
    .update({ feedback_email_sent_at: new Date().toISOString() })
    .eq("id", reportId);
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const due = await findDueReports();
  if (due.length === 0) {
    console.log("[feedback-nudge] no reports due");
    return;
  }
  console.log(`[feedback-nudge] ${due.length} report(s) due for nudge`);
  for (const r of due) {
    const u = await userEmail(r.user_id);
    if (!u) {
      console.warn(`[feedback-nudge] no auth email for user ${r.user_id} — stamping anyway to avoid retry`);
      await stamp(r.id);
      continue;
    }
    const sent = await sendNudge(r, u);
    // Stamp on success only — if Resend hiccups, next tick retries.
    if (sent) await stamp(r.id);
  }
  console.log("[feedback-nudge] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
