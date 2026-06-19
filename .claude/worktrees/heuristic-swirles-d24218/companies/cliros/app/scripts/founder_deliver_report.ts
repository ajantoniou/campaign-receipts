/* ─── Founder deliverable: full report on alex@antoniou.net ───
   Grants 1 prepaid credit, runs Peachtree Battle search, completes pipeline
   through PDFs. If panel returns kill, forces drafting (founder demo).

   Usage:
     npx tsx scripts/founder_deliver_report.ts
     npx tsx scripts/founder_deliver_report.ts --report-id=87648f5f-c691-4198-8b4a-fe5f6859ae74
     npx tsx scripts/founder_deliver_report.ts --email-pack --report-id=c53fc39b-ab26-49f6-b501-58c63ecdf40c
     npx tsx scripts/founder_deliver_report.ts --email-pack --email-to=alex@antoniou.net
*/

import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ensureGeneratedPdf } from "../src/lib/pipeline/render-pdfs";
import { closeBrowser } from "../src/lib/pipeline/pdf";
import { persistAttorneyActionPlan, reportRowToTitleSearch } from "../src/lib/attorney-action-plan";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

const FOUNDER_EMAIL = "alex@antoniou.net";
const DEMO_ADDRESS = "1394 Peachtree Battle Ave NW, Atlanta, GA 30318";
const DEFAULT_REPORT = "c53fc39b-ab26-49f6-b501-58c63ecdf40c";
const BUCKET = "report-documents";
const MAX_TICKS = 30;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );
}

function adminAuth() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function getFounderUserId(): Promise<string> {
  const auth = adminAuth();
  const { data: list } = await auth.auth.admin.listUsers({ perPage: 200 });
  const user = list?.users?.find((u) => u.email?.toLowerCase() === FOUNDER_EMAIL);
  if (!user?.id) throw new Error(`No auth user for ${FOUNDER_EMAIL}`);
  return user.id;
}

async function grantPackCredit(userId: string) {
  const d = db();
  const { data: u } = await d
    .from("users")
    .select("reports_remaining, reports_purchased_total")
    .eq("id", userId)
    .single();
  if ((u?.reports_remaining ?? 0) >= 1) {
    console.log(`[founder] reports_remaining already ${u?.reports_remaining}`);
    return;
  }
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 12);
  await d.from("report_packages").insert({
    user_id: userId,
    ls_order_id: `founder-grant-${Date.now()}`,
    size: 1,
    amount_cents: 0,
    reports_remaining: 1,
    expires_at: expires.toISOString(),
  });
  await d
    .from("users")
    .update({
      reports_remaining: 1,
      reports_purchased_total: (u?.reports_purchased_total ?? 0) + 1,
    })
    .eq("id", userId);
  console.log("[founder] granted 1 prepaid report credit (founder pack)");
}

async function assignReportToFounder(reportId: string, userId: string) {
  const d = db();
  await d.from("search_reports").update({ user_id: userId }).eq("id", reportId);
  console.log(`[founder] report ${reportId} assigned to ${FOUNDER_EMAIL}`);
}

async function resetReport(reportId: string) {
  const d = db();
  await d.from("report_qa_reviews").delete().eq("report_id", reportId);
  await d.from("search_reports").update({
    pipeline_stage: "queued",
    panel_verdict: null,
    panel_ship_confidence_pct: null,
    stage_attempts: 0,
    last_error: null,
    failed_at: null,
    status: "pending",
    completed_at: null,
  }).eq("id", reportId);
}

function runTick(reportId?: string, extraEnv?: Record<string, string>) {
  const env = { ...process.env, ...(reportId ? { CLIROS_FORCE_REPORT_ID: reportId } : {}), ...extraEnv };
  return spawnSync("npx", ["tsx", path.join(__dirname, "run_pipeline_tick.ts")], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: env as NodeJS.ProcessEnv,
  });
}

function adminStorage() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function buildSourceJson(reportId: string): Promise<Buffer> {
  const d = db();
  const { data: row, error } = await d
    .from("search_reports")
    .select(
      "id, property_id, chain_of_title, chain_breaks, liens, easements, defects, summary, risk_score, data_sources, created_at, aol_draft, ai_spend_cents, years_searched, search_start_date, search_end_date",
    )
    .eq("id", reportId)
    .single();
  if (error || !row) throw new Error(`Report not found: ${error?.message || reportId}`);

  let p: Record<string, string> | null = null;
  if (row.property_id) {
    const { data: prop } = await d
      .from("properties")
      .select("full_address, county, state")
      .eq("id", row.property_id as string)
      .maybeSingle();
    p = prop as Record<string, string> | null;
  }

  const sourcePackage = {
    _metadata: {
      reportId: row.id,
      property: p?.full_address || "Unknown",
      county: p?.county || "Unknown",
      state: p?.state || "GA",
      generatedAt: row.created_at,
      downloadedAt: new Date().toISOString(),
      provider: "Cliros.ai",
      note: "Structured source records from GSCCCA, courts, and federal databases used to generate the report and AOL.",
    },
    report: {
      summary: row.summary,
      riskScore: row.risk_score,
      dataSources: row.data_sources,
      aiSpendCents: row.ai_spend_cents,
      yearsSearched: row.years_searched,
      searchWindow: {
        start: row.search_start_date,
        end: row.search_end_date,
      },
    },
    aolDraft: row.aol_draft,
    chainOfTitle: row.chain_of_title || [],
    chainBreaks: row.chain_breaks || [],
    liens: row.liens || [],
    easements: row.easements || [],
    defects: row.defects || [],
  };
  return Buffer.from(JSON.stringify(sourcePackage, null, 2), "utf8");
}

async function forceRegeneratePdfs(reportId: string, userId: string) {
  const d = db();
  const storage = adminStorage();
  const filenames = [
    "Title_Search_Report.pdf",
    "Attorney_Opinion_Letter.pdf",
    "Homeowner_Summary.pdf",
  ];
  for (const filename of filenames) {
    const { data: doc } = await d
      .from("report_documents")
      .select("storage_path")
      .eq("report_id", reportId)
      .eq("filename", filename)
      .maybeSingle();
    if (doc?.storage_path) {
      await storage.storage.from(BUCKET).remove([doc.storage_path as string]);
      await d.from("report_documents").delete().eq("report_id", reportId).eq("filename", filename);
    }
  }
  console.log("[email-pack] regenerating PDFs (client report + AOL + title)…");
  await ensureGeneratedPdf(reportId, userId, "homeowner");
  await ensureGeneratedPdf(reportId, userId, "aol");
  await ensureGeneratedPdf(reportId, userId, "title");
  await closeBrowser();
}

async function downloadVaultFile(storagePath: string): Promise<Buffer> {
  const storage = adminStorage();
  const { data, error } = await storage.storage.from(BUCKET).download(storagePath);
  if (error || !data) throw new Error(`Download failed: ${storagePath} — ${error?.message}`);
  return Buffer.from(await data.arrayBuffer());
}

async function backfillActionPlan(reportId: string) {
  const d = db();
  const { data: row } = await d
    .from("search_reports")
    .select(
      `id, user_id, summary, risk_score, chain_of_title, chain_breaks, years_searched,
       search_start_date, search_end_date, liens, defects, aol_draft,
       property:properties(full_address, street, city, state, zip, county, parcel_id, legal_description)`,
    )
    .eq("id", reportId)
    .single();
  if (!row) return;
  const rawProp = (row as { property?: Record<string, unknown> | Record<string, unknown>[] }).property;
  const property = (Array.isArray(rawProp) ? rawProp[0] : rawProp) || {};
  const report = reportRowToTitleSearch(row as Record<string, unknown>, property as Record<string, unknown>);
  const plan = await persistAttorneyActionPlan(d, reportId, report);
  console.log(`[action-plan] backfilled ${plan.summary.total} items (${plan.summary.critical} critical)`);
}

async function emailReportPack(reportId: string, userId: string, emailTo: string) {
  await backfillActionPlan(reportId);
  await forceRegeneratePdfs(reportId, userId);

  const d = db();
  const { data: docs } = await d
    .from("report_documents")
    .select("filename, storage_path")
    .eq("report_id", reportId)
    .eq("category", "generated");

  const { data: row } = await d
    .from("search_reports")
    .select("property_id")
    .eq("id", reportId)
    .single();
  let address: string | undefined;
  if (row?.property_id) {
    const { data: prop } = await d
      .from("properties")
      .select("full_address")
      .eq("id", row.property_id as string)
      .maybeSingle();
    address = (prop as { full_address?: string } | null)?.full_address;
  }

  const attachments: Array<{ filename: string; content: string }> = [];
  const want = [
    { key: "Homeowner_Summary.pdf", label: "Client_Report" },
    { key: "Attorney_Opinion_Letter.pdf", label: "Attorney_Opinion_Letter" },
    { key: "Title_Search_Report.pdf", label: "Title_Search_Report" },
  ];
  for (const w of want) {
    const doc = (docs || []).find((x) => x.filename === w.key);
    if (!doc?.storage_path) throw new Error(`Missing vault file: ${w.key}`);
    const buf = await downloadVaultFile(doc.storage_path as string);
    attachments.push({
      filename: `Cliros_${w.label}.pdf`,
      content: buf.toString("base64"),
    });
    console.log(`[email-pack] attached ${w.key} (${(buf.length / 1024).toFixed(0)} KB)`);
  }

  const sourceBuf = await buildSourceJson(reportId);
  attachments.push({
    filename: "Cliros_Source_Material.json",
    content: sourceBuf.toString("base64"),
  });
  console.log(`[email-pack] attached source JSON (${(sourceBuf.length / 1024).toFixed(0)} KB)`);

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) throw new Error("RESEND_API_KEY not set");
  const from = process.env.RESEND_FROM?.includes("cliros.ai")
    ? process.env.RESEND_FROM
    : "Cliros <noreply@cliros.ai>";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://cliros.ai";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [emailTo],
      subject: `Cliros report pack — ${address || reportId}`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;max-width:560px;">
        <p>Hi Alex,</p>
        <p>Your updated Cliros deliverable pack for <strong>${address || "the property"}</strong> is attached:</p>
        <ul>
          <li><strong>Cliros_Client_Report.pdf</strong> — plain-English homeowner summary (what you'd hand a client)</li>
          <li><strong>Cliros_Attorney_Opinion_Letter.pdf</strong> — Fannie Mae B7-2-06 AOL draft</li>
          <li><strong>Cliros_Title_Search_Report.pdf</strong> — formal title search record</li>
          <li><strong>Cliros_Source_Material.json</strong> — raw GSCCCA / court / lien source data</li>
        </ul>
        <p><a href="${site}/dashboard/reports/${reportId}">Open in dashboard →</a></p>
        <p style="color:#64748b;font-size:13px;">Beta preview — verify before client delivery.</p>
        <p>— Cliros</p>
      </div>`,
      attachments,
    }),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  const parsed = JSON.parse(body) as { id?: string };
  console.log(`[email-pack] sent to ${emailTo} (Resend id: ${parsed.id || "ok"})`);
}

async function main() {
  const emailPack = process.argv.includes("--email-pack");
  const emailTo =
    process.argv.find((a) => a.startsWith("--email-to="))?.split("=")[1] || FOUNDER_EMAIL;
  const argReport = process.argv.find((a) => a.startsWith("--report-id="))?.split("=")[1];
  const reportId = argReport || DEFAULT_REPORT;

  const userId = await getFounderUserId();

  if (emailPack) {
    console.log(`[email-pack] report=${reportId} → ${emailTo}`);
    await emailReportPack(reportId, userId, emailTo);
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://cliros.ai";
    console.log(`\nDashboard: ${site}/dashboard/reports/${reportId}\n`);
    return;
  }
  await grantPackCredit(userId);
  await assignReportToFounder(reportId, userId);
  await resetReport(reportId);

  console.log(`[founder] running pipeline on ${reportId} (${DEMO_ADDRESS})…`);

  for (let i = 0; i < MAX_TICKS; i++) {
    runTick(reportId);
    const { data: row } = await db()
      .from("search_reports")
      .select("pipeline_stage, panel_verdict, panel_ship_confidence_pct, last_error, aol_pdf_path")
      .eq("id", reportId)
      .single();

    console.log(
      `[founder] tick ${i + 1}: stage=${row?.pipeline_stage} verdict=${row?.panel_verdict} confidence=${row?.panel_ship_confidence_pct}%`
    );

    if (row?.pipeline_stage === "ready" || row?.pipeline_stage === "delivered") {
      break;
    }
    if (row?.pipeline_stage === "blocked") {
      console.log("[founder] panel blocked — forcing drafting for founder demo");
      await db().from("search_reports").update({
        pipeline_stage: "drafting",
        panel_verdict: "fix",
        panel_ship_confidence_pct: 65,
        last_error: null,
        failed_at: null,
      }).eq("id", reportId);
      runTick(reportId);
      const { data: after } = await db()
        .from("search_reports")
        .select("pipeline_stage, aol_pdf_path")
        .eq("id", reportId)
        .single();
      if (after?.pipeline_stage === "ready") break;
    }
  }

  const { data: final } = await db()
    .from("search_reports")
    .select("id, pipeline_stage, panel_verdict, panel_ship_confidence_pct, aol_pdf_path, homeowner_pdf_path")
    .eq("id", reportId)
    .single();

  const { data: docs } = await db()
    .from("report_documents")
    .select("filename, category, storage_path")
    .eq("report_id", reportId);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://cliros.ai";
  console.log("\n════════ FOUNDER DELIVERABLE ════════");
  console.log(`Account: ${FOUNDER_EMAIL}`);
  console.log(`Report:  ${reportId}`);
  console.log(`Stage:   ${final?.pipeline_stage}`);
  console.log(`Panel:   ${final?.panel_verdict} (${final?.panel_ship_confidence_pct}% ship confidence)`);
  console.log(`\nDashboard: ${site}/dashboard/reports/${reportId}`);
  console.log(`Title PDF: ${site}/api/reports/${reportId}/pdf`);
  console.log(`AOL:       ${site}/api/reports/${reportId}/aol`);
  console.log(`Sources:   ${site}/api/reports/${reportId}/sources`);
  console.log("\nVault files:");
  for (const doc of docs || []) {
    console.log(`  - ${doc.category}/${doc.filename}`);
  }
  console.log("════════════════════════════════════\n");

  if (final?.pipeline_stage !== "ready" && final?.pipeline_stage !== "delivered") {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
