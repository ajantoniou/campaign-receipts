/* ─── Verify Beta Feedback Email Flow (one-shot QA) ───
   Reuses the magic-link → verifyOtp pattern from capture_hero_image.ts to
   mint a session for alex@antoniou.net, posts a thumbs-up feedback to
   /api/reports/[id]/feedback, then polls the database to confirm
   cliros.beta_feedback row landed with email_sent_at populated (Resend
   accepted the message).

   Don't add bloat scripts for one-off tests — extend this one or delete it
   once the verification is done.

   Usage:
     npx tsx scripts/test_feedback_email.ts
*/

import { createClient } from "@supabase/supabase-js";

const TARGET = process.env.CLIROS_TARGET_URL || "https://cliros.ai";
const SIGNIN_EMAIL = process.env.CLIROS_HERO_USER || "alex@antoniou.net";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) throw new Error("Missing env. Source root .env first.");

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const clirosAdmin = createClient(url, serviceKey, { db: { schema: "cliros" }, auth: { persistSession: false } });
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  console.log("Finding latest ready report…");
  const { data: report, error: rErr } = await clirosAdmin
    .from("search_reports")
    .select("id, property:properties(full_address)")
    .eq("pipeline_stage", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (rErr || !report) throw new Error(`No ready report: ${rErr?.message}`);
  const prop = Array.isArray(report.property) ? report.property[0] : report.property;
  console.log(`  → report ${report.id} (${prop?.full_address})`);

  console.log(`Minting session for ${SIGNIN_EMAIL}…`);
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: SIGNIN_EMAIL,
  });
  if (linkErr || !linkData?.properties?.hashed_token) throw new Error(linkErr?.message);
  const { data: sessionData, error: vErr } = await anon.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });
  if (vErr || !sessionData?.session) throw new Error(`verifyOtp: ${vErr?.message}`);
  const accessToken = sessionData.session.access_token;
  console.log(`  → session minted`);

  const comment = `[automated test] Beta feedback email routing check — ${new Date().toISOString()}`;
  console.log(`POSTing feedback to ${TARGET}/api/reports/${report.id}/feedback…`);
  const res = await fetch(`${TARGET}/api/reports/${report.id}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ rating: "up", comment }),
  });
  const body = await res.text();
  console.log(`  → ${res.status} ${body.slice(0, 200)}`);
  if (!res.ok) process.exit(1);

  console.log("Polling beta_feedback row for email_sent_at…");
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const { data } = await clirosAdmin
      .from("beta_feedback")
      .select("id, rating, comment, email_sent_at, created_at")
      .eq("report_id", report.id)
      .eq("comment", comment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) continue;
    console.log(`  attempt ${i + 1}: row ${data.id}, email_sent_at=${data.email_sent_at ?? "NULL"}`);
    if (data.email_sent_at) {
      console.log("");
      console.log("================================================================");
      console.log("PASS — Resend accepted the message. Check the gmail forwarder.");
      console.log("  Inbox:  alex@cliros.ai (forwards to antonioualfred-cliros@gmail.com)");
      console.log("  Look for subject: [Cliros beta] 👍 …");
      console.log("================================================================");
      return;
    }
  }
  console.log("WARN — row inserted but email_sent_at still NULL after 15s.");
  console.log("Check Render logs for [feedback] resend failed: …");
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
