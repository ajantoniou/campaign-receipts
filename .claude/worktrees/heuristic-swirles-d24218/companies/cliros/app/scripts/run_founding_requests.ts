#!/usr/bin/env npx tsx
/* ─── Founding-request worker (do-it-for-them free reports) ──────────────────
 *
 * Caroline captures a firm email + a GA property address on the call; the
 * call-webhook validates the address and queues a cliros.founding_report_requests
 * row. THIS worker turns each valid request into a finished report that lives in
 * the attorney's own dashboard, then emails them "it's ready, sign in."
 *
 * Two passes per tick:
 *   PASS A (start): for each `address_valid` request (oldest first), up to the
 *     remaining cap: create-or-find the firm's Cliros account, grant 10 founding
 *     credits, anchor the parcel, create the property + a queued report tied to
 *     that user, link it on the request, mark request `running`. The existing
 *     pipeline-tick cron then advances the report queued→…→ready.
 *   PASS B (finish): for each `running` request whose report reached:
 *       ready   → send the "report ready, sign in" email, mark `emailed`.
 *       blocked → mark `qc_held` (holds for founder; no email to the attorney).
 *
 * HARD CAP: FOUNDING_RUN_CAP (default 10) total reports STARTED. Once reached,
 * remaining valid requests are marked `capped` and the worker stops starting new
 * ones (PASS B still finishes in-flight ones). Reset by raising the cap / clearing.
 *
 * Idempotent + safe to run on a cron. Mirrors the proven queue-route + grant
 * scripts; no new account/report logic invented.
 *
 * Usage:  npx tsx scripts/run_founding_requests.ts [--limit=N] [--dry]
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "url";
import { randomBytes } from "node:crypto";
import { resolveParcelAnchor } from "../src/lib/agents/parcel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });
dotenv.config({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

const CAP = Number(process.env.FOUNDING_RUN_CAP || 10);
const FROM = process.env.RESEND_FROM || "Alex Antoniou <alex@cliros.ai>";
const SITE = process.env.CLIROS_SITE_URL || "https://cliros.ai";
const FOUNDER_PHONE = "(770) 404-7590";
const FOUNDING_CREDITS = 10;
const DRY = process.argv.includes("--dry");
const LIMIT = Number((process.argv.find((a) => a.startsWith("--limit=")) || "--limit=99").split("=")[1]);

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    db: { schema: "cliros" },
    auth: { persistSession: false },
  });
}
function adminAuth() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/** Create-or-find a Cliros account for the firm email. Returns the user id.
 *  New accounts get a random password (the attorney uses "forgot password" to
 *  set their own) + a cliros.users profile + 10 founding credits. */
async function ensureFoundingUser(d: ReturnType<typeof db>, email: string, firmName: string): Promise<string> {
  const auth = adminAuth();
  const lower = email.trim().toLowerCase();

  // Find existing auth user.
  const { data: list } = await auth.auth.admin.listUsers({ perPage: 200 });
  let userId = list?.users?.find((u) => u.email?.toLowerCase() === lower)?.id || null;

  if (!userId) {
    const { data: created, error } = await auth.auth.admin.createUser({
      email: lower,
      password: randomBytes(18).toString("base64url"), // attorney resets via "forgot password"
      email_confirm: true,
      user_metadata: { full_name: firmName, source: "founding_caroline" },
    });
    if (error || !created?.user) throw new Error(`createUser failed: ${error?.message}`);
    userId = created.user.id;
  }

  // Ensure cliros.users profile.
  const { data: profile } = await d
    .from("users")
    .select("id, name, role, reports_remaining, reports_purchased_total, free_reports_total")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    // NOTE: cliros.users.role is constrained to attorney|agent|investor|
    // title_company|other — there is NO 'founding_attorney' role. Founding
    // status is tracked by the comp report_packages row + credits, role stays
    // 'attorney'. Throw on any insert error — a silent failure here causes the
    // downstream report_insert FK violation we hit in testing.
    const { error: profErr } = await d.from("users").insert({
      id: userId,
      email: lower,
      name: firmName,
      role: "attorney",
      reports_remaining: FOUNDING_CREDITS,
      reports_purchased_total: FOUNDING_CREDITS,
      signup_ref: "FOUNDING-CAROLINE",
    });
    if (profErr) throw new Error(`cliros.users insert failed: ${profErr.message}`);
    await grantPackage(d, userId);
  } else if ((profile.reports_purchased_total ?? 0) === 0) {
    // Existing account with no purchased credits — top up the founding grant once.
    const { error: upErr } = await d
      .from("users")
      .update({
        reports_remaining: (profile.reports_remaining ?? 0) + FOUNDING_CREDITS,
        reports_purchased_total: (profile.reports_purchased_total ?? 0) + FOUNDING_CREDITS,
        name: profile.name || firmName,
      })
      .eq("id", userId);
    if (upErr) throw new Error(`cliros.users top-up failed: ${upErr.message}`);
    await grantPackage(d, userId);
  }
  return userId;
}

async function grantPackage(d: ReturnType<typeof db>, userId: string) {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 3);
  await d.from("report_packages").insert({
    user_id: userId,
    ls_order_id: `founding_caroline_${userId}_${Date.now()}`,
    size: FOUNDING_CREDITS,
    amount_cents: 0,
    reports_remaining: FOUNDING_CREDITS,
    expires_at: expires.toISOString(),
  });
}

/** Create the property + a queued report for a validated address, tied to the
 *  founding user. Mirrors the /api/search/queue insert path. Returns report id
 *  or null if the parcel can't be anchored (request flagged for review). */
async function createQueuedReport(
  d: ReturnType<typeof db>,
  userId: string,
  address: string,
): Promise<{ reportId: string } | { error: string }> {
  const parts = address.split(",").map((s) => s.trim());
  const countyGuess = address.match(/(\w+)\s+county/i)?.[1];
  const anchor = await resolveParcelAnchor(address, countyGuess);
  if (!anchor) return { error: "parcel_not_found" };

  const street = parts[0] || address;
  const city = parts[1] || "";
  const stateZip = (parts[2] || "").trim().split(/\s+/);
  const stateCode = stateZip[0] || "GA";
  const zip = stateZip[1] || "";

  const { data: propRow, error: propErr } = await d
    .from("properties")
    .upsert(
      {
        full_address: address,
        street,
        city,
        state: stateCode,
        zip,
        county: anchor.county || countyGuess || null,
        parcel_id: anchor.parcelId,
        legal_description:
          [anchor.subdivision, anchor.subdivisionLot, anchor.subdivisionBlock].filter(Boolean).join(" / ") || null,
        acreage: anchor.landAcres || null,
        assessed_value: anchor.totalAssessedValue || null,
        tax_year: anchor.taxYear || null,
      },
      { onConflict: "full_address" },
    )
    .select("id")
    .single();
  if (propErr || !propRow?.id) return { error: `property_upsert: ${propErr?.message}` };

  const { data: report, error: repErr } = await d
    .from("search_reports")
    .insert({
      user_id: userId,
      property_id: propRow.id,
      tier: "full_search",
      status: "pending",
      pipeline_stage: "queued",
      is_free_trial: true, // founding comp — not billed
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (repErr || !report?.id) return { error: `report_insert: ${repErr?.message}` };
  return { reportId: report.id };
}

async function sendReadyEmail(email: string, firmName: string, formattedAddress: string) {
  if (!process.env.RESEND_API_KEY) return false;
  const firstName = (firmName || "").split(/[\s,]+/)[0] || "Counselor";
  const text = `Hi ${firstName},

Your free Cliros title report is ready — it's waiting in your dashboard.

Property: ${formattedAddress}

Inside you'll find the chain of title, the lien schedule, the curative action plan, and a draft Fannie Mae B7-2-06 attorney opinion letter — on your letterhead, for your review and signature.

Sign in to see it:
${SITE}/login

It's under this email address (${email}). If you haven't set a password yet, just click "Forgot password" on the sign-in page and you'll be in.

You're a Cliros Founding Attorney, so you have ten more free reports on your account — run any GA closing you'd normally send to your abstractor. All we ask is a quick note of feedback after each.

A quick honest note: Cliros is informational title research and document assembly — a draft for your review and signature, not title insurance and not a substitute for your legal judgment. You're the attorney of record on every closing.

Questions? Just reply or call me at ${FOUNDER_PHONE}.

— Alex
Founder, Cliros`;
  const html = text
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55;color:#2A2622;font-size:15px">${p.replace(/\n/g, "<br>").replace(`${SITE}/login`, `<a href="${SITE}/login" style="color:#BA4A1F">${SITE}/login</a>`)}</p>`)
    .join("");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      reply_to: "alex@cliros.ai",
      subject: "Your Cliros title report is ready",
      text,
      html,
      tags: [{ name: "campaign", value: "founding-report-ready" }],
    }),
  });
  return r.ok;
}

async function main() {
  const d = db();

  // How many have we already STARTED (running/ready/qc_held/emailed)? Enforce cap.
  const { count: startedCount } = await d
    .from("founding_report_requests")
    .select("*", { count: "exact", head: true })
    .in("status", ["running", "ready", "qc_held", "emailed"]);
  let remaining = Math.max(0, CAP - (startedCount ?? 0));
  console.log(`[founding] cap ${CAP}, already started ${startedCount ?? 0}, remaining ${remaining}`);

  // ── PASS B: finish in-flight runs (do this first so cap frees up correctly) ──
  const { data: running } = await d
    .from("founding_report_requests")
    .select("id, firm_email, report_id, formatted_address, raw_address, user_id")
    .eq("status", "running")
    .not("report_id", "is", null)
    .limit(LIMIT);

  for (const req of running ?? []) {
    const { data: rep } = await d
      .from("search_reports")
      .select("pipeline_stage")
      .eq("id", req.report_id as string)
      .maybeSingle();
    const stage = rep?.pipeline_stage as string | undefined;
    if (stage === "ready" || stage === "delivered") {
      // Pull firm name from the user profile for the greeting.
      const { data: u } = await d.from("users").select("name").eq("id", req.user_id as string).maybeSingle();
      const addr = (req.formatted_address as string) || (req.raw_address as string);
      console.log(`[founding] ${req.id} report READY → emailing ${req.firm_email}`);
      if (!DRY) {
        const sent = await sendReadyEmail(req.firm_email as string, (u?.name as string) || "", addr);
        await d
          .from("founding_report_requests")
          .update({ status: sent ? "emailed" : "ready", emailed_at: sent ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
          .eq("id", req.id as string);
      }
    } else if (stage === "blocked") {
      console.log(`[founding] ${req.id} report BLOCKED → qc_held (founder review, no attorney email)`);
      if (!DRY) {
        await d
          .from("founding_report_requests")
          .update({ status: "qc_held", status_detail: "report blocked by pipeline QC — needs founder review", updated_at: new Date().toISOString() })
          .eq("id", req.id as string);
      }
    } // else still in flight — leave as running
  }

  // ── PASS A: start new runs up to the remaining cap ──
  if (remaining <= 0) {
    // Mark any waiting valid requests as capped so they surface for review.
    const { data: waiting } = await d
      .from("founding_report_requests")
      .select("id")
      .eq("status", "address_valid")
      .limit(LIMIT);
    for (const w of waiting ?? []) {
      if (!DRY) await d.from("founding_report_requests").update({ status: "capped", status_detail: `cap of ${CAP} reached`, updated_at: new Date().toISOString() }).eq("id", w.id as string);
    }
    console.log(`[founding] cap reached — marked ${waiting?.length ?? 0} waiting requests as capped.`);
    return;
  }

  const { data: valid } = await d
    .from("founding_report_requests")
    .select("id, firm_email, raw_address, formatted_address")
    .eq("status", "address_valid")
    .order("created_at", { ascending: true })
    .limit(Math.min(remaining, LIMIT));

  for (const req of valid ?? []) {
    if (remaining <= 0) break;
    const email = req.firm_email as string;
    const addr = (req.formatted_address as string) || (req.raw_address as string);
    const firmName = email.split("@")[0].replace(/[._]/g, " ");
    console.log(`[founding] starting ${req.id} → ${email} :: ${addr}`);
    if (DRY) { remaining--; continue; }

    try {
      const userId = await ensureFoundingUser(d, email, firmName);
      const result = await createQueuedReport(d, userId, addr);
      if ("error" in result) {
        await d
          .from("founding_report_requests")
          .update({ status: "failed", status_detail: result.error, user_id: userId, updated_at: new Date().toISOString() })
          .eq("id", req.id as string);
        console.warn(`[founding] ${req.id} could not start: ${result.error}`);
        continue;
      }
      await d
        .from("founding_report_requests")
        .update({ status: "running", report_id: result.reportId, user_id: userId, ran_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", req.id as string);
      remaining--;
      console.log(`[founding] ${req.id} → report ${result.reportId} queued (user ${userId})`);
    } catch (err) {
      await d
        .from("founding_report_requests")
        .update({ status: "failed", status_detail: err instanceof Error ? err.message : String(err), updated_at: new Date().toISOString() })
        .eq("id", req.id as string);
      console.error(`[founding] ${req.id} threw:`, err);
    }
  }

  console.log(`[founding] done. remaining cap budget: ${remaining}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
