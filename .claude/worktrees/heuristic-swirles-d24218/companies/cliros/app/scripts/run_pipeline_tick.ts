#!/usr/bin/env node
/* ─── Cliros Production Pipeline Tick ───
   Runs every 3 minutes via Render cron (see render.yaml). Idempotent.

   Picks up the oldest non-terminal report and advances it one stage:

     queued → searching → permits → panel_review → drafting → ready → delivered
                                                                 ↓
                                                              blocked (kill verdict)

   Locking: SELECT FOR UPDATE SKIP LOCKED — only one cron run advances a
   given report at a time. Concurrent tick invocations cooperate.

   Failure handling: each stage failure bumps stage_attempts. After 3 retries
   the report goes to 'blocked' with last_error set. The attorney sees an
   error banner in the dashboard.
*/

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { executeFullTitleSearch } from "../src/lib/agents/search-orchestrator";
import { runPanelReview } from "../src/lib/pipeline/panel";
import { generateReportPDF, generateAOLPDF, generateHomeownerSummaryPDF } from "../src/lib/pipeline/pdf";
import { fetchPermitsForProperty } from "../src/lib/agents/permits";
import { runPersonaStage } from "../src/lib/pipeline/persona-stage-runner";
import { ensurePropertyImagery } from "../src/lib/agents/property-imagery";
import { uploadDocument } from "../src/lib/document-storage";
import { refundReport, type RefundReason } from "../src/lib/billing/refund";
import type { TitleSearchReport } from "../src/lib/types";

// New persona stages between panel_review and drafting — see
// shared/portfolio-hub/youtube-production-pipeline.md for the pattern.
const PERSONA_STAGES = ["chain_analysis", "lien_analysis", "defect_review", "aol_lock"] as const;
type PersonaStageName = (typeof PERSONA_STAGES)[number];

const MAX_ATTEMPTS = 3;
const STAGE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes per stage
const TICK_BUDGET_MS = 9 * 60 * 1000;   // Render cron limit safety: stop before 10 min

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );
}

interface ReportRow {
  id: string;
  user_id: string;
  property_id: string;
  pipeline_stage: string;
  stage_started_at: string | null;
  stage_attempts: number;
  panel_verdict: string | null;
  // Joined property fields
  full_address?: string;
  county?: string | null;
}

async function logEvent(
  db: SupabaseClient,
  reportId: string,
  stage: string,
  event: string,
  details?: Record<string, unknown>,
  durationMs?: number
) {
  await db.from("pipeline_events").insert({
    report_id: reportId,
    stage,
    event,
    details: details || null,
    duration_ms: durationMs ?? null,
  });
}

/** Atomically claim the next ready-to-advance report. */
async function claimNextReport(db: SupabaseClient): Promise<ReportRow | null> {
  // Use a Postgres function to atomically SELECT FOR UPDATE SKIP LOCKED.
  // The simpler equivalent via PostgREST: read candidates and try to update
  // the one with stage_attempts < MAX. We use the lock-free version below.
  const { data, error } = await db.rpc("cliros_claim_next_pipeline_report", {
    p_max_attempts: MAX_ATTEMPTS,
    p_stage_timeout_seconds: Math.floor(STAGE_TIMEOUT_MS / 1000),
  });
  if (error) {
    // Function may not be deployed yet — fall back to a soft claim.
    console.warn("[pipeline] rpc unavailable, falling back to soft claim:", error.message);
    return softClaim(db);
  }
  return (data?.[0] as ReportRow) || null;
}

async function softClaim(db: SupabaseClient): Promise<ReportRow | null> {
  // Soft fallback when the RPC isn't installed: read one candidate, try to
  // bump stage_started_at, succeed only if nobody else moved it.
  const { data } = await db
    .from("search_reports")
    .select("id, user_id, property_id, pipeline_stage, stage_started_at, stage_attempts, panel_verdict")
    .not("pipeline_stage", "in", "(delivered,blocked)")
    .lt("stage_attempts", MAX_ATTEMPTS)
    .order("stage_started_at", { ascending: true, nullsFirst: true })
    .limit(1);
  const row = data?.[0];
  if (!row) return null;

  // Hydrate property
  const { data: prop } = await db
    .from("properties")
    .select("full_address, county")
    .eq("id", row.property_id)
    .single();

  return { ...row, full_address: prop?.full_address, county: prop?.county };
}

async function bumpStageStarted(db: SupabaseClient, reportId: string) {
  await db
    .from("search_reports")
    .update({ stage_started_at: new Date().toISOString() })
    .eq("id", reportId);
}

async function advanceTo(db: SupabaseClient, reportId: string, newStage: string, extra?: Record<string, unknown>) {
  await db
    .from("search_reports")
    .update({
      pipeline_stage: newStage,
      stage_started_at: null,
      stage_attempts: 0,
      last_error: null,
      ...(extra || {}),
    })
    .eq("id", reportId);
}

async function failStage(db: SupabaseClient, reportId: string, err: unknown, attempts: number) {
  const msg = err instanceof Error ? err.message : String(err);
  const nextAttempts = attempts + 1;
  if (nextAttempts >= MAX_ATTEMPTS) {
    // Wipe stale attorney_action_plan so the dashboard banner doesn't read
    // the previous run's clustered counts on a fresh-then-blocked report.
    await db
      .from("search_reports")
      .update({
        pipeline_stage: "blocked",
        stage_attempts: nextAttempts,
        last_error: msg,
        failed_at: new Date().toISOString(),
        attorney_action_plan: null,
      })
      .eq("id", reportId);
    await logEvent(admin(), reportId, "pipeline", "blocked", { reason: msg, attempts: nextAttempts });
    // Founder policy (2026-05-23): don't charge for blocked reports.
    try { await refundReport(db, reportId, "MAX_ATTEMPTS"); }
    catch (e) { console.warn(`[failStage] refund failed for ${reportId}:`, e); }
  } else {
    await db
      .from("search_reports")
      .update({ stage_attempts: nextAttempts, last_error: msg, stage_started_at: null })
      .eq("id", reportId);
    await logEvent(admin(), reportId, "pipeline", "retried", { error: msg, attempts: nextAttempts });
  }
}

/* ─── Stage handlers ─── */

async function stageSearching(db: SupabaseClient, row: ReportRow) {
  if (!row.full_address) throw new Error("No address on property row");

  // Pull attorney-supplied hints (priorOwnerName, saleDate, loanAmount) so
  // the orchestrator can bias the GSCCCA search. NULL hints are fine —
  // executeFullTitleSearch falls back to its existing parcel-anchor path.
  const { data: hintRow } = await db
    .from("search_reports")
    .select("search_hints")
    .eq("id", row.id)
    .maybeSingle();
  const hints =
    (hintRow?.search_hints as {
      priorOwnerName?: string;
      saleDate?: string;
      loanAmount?: number;
      listingUrl?: string;
      buyerName?: string;
      buyerName2?: string;
      jointTenancy?: boolean;
    } | null) || null;

  const result = await executeFullTitleSearch(row.full_address, row.county || undefined, undefined, hints);
  if (result.blocked) {
    // Terminal block (don't burn retries). Covers PARCEL_NOT_FOUND and the
    // CHAIN_EMPTY_LIENS_PRESENT structural-impossibility guard (empty chain +
    // liens — see search-orchestrator.ts). Clear any stale action plan from a
    // prior successful run on this report ID. Refund uses the orchestrator's
    // own block reason so the no-charge ledger records WHY it was blocked.
    const blockReason = (result.blockedReason || "PARCEL_NOT_FOUND") as RefundReason;
    await db
      .from("search_reports")
      .update({
        pipeline_stage: "blocked",
        last_error: blockReason,
        summary: result.summary,
        attorney_action_plan: null,
      })
      .eq("id", row.id);
    try { await refundReport(db, row.id, blockReason); }
    catch (e) { console.warn(`[stageSearching] refund failed for ${row.id}:`, e); }
    return;
  }
  // Persist search output and advance
  await db
    .from("search_reports")
    .update({
      chain_of_title: result.chainOfTitle.entries,
      chain_breaks: result.chainOfTitle.breaks,
      years_searched: result.chainOfTitle.yearsSearched,
      search_start_date: result.chainOfTitle.startDate || null,
      search_end_date: result.chainOfTitle.endDate || null,
      liens: result.liens,
      easements: result.easements,
      defects: result.defects,
      summary: result.summary,
      risk_score: result.riskScore,
      data_sources: result.dataSources,
    })
    .eq("id", row.id);

  // Persist raw GSCCCA + federal-court snapshots to the vault so the
  // attorney can pull the underlying index records cited in the AOL
  // SOURCE SCHEDULE. JSON blobs (one per category) keep the upload small
  // and crawler-free; deed/lien images still require GSCCCA viewer pulls.
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const uploads: Array<Promise<unknown>> = [];
    if (result.rawData.gsccca) {
      const g = result.rawData.gsccca;
      if (g.deeds?.length) {
        uploads.push(
          uploadDocument(
            row.id,
            "deeds",
            `gsccca-deed-index-${ts}.json`,
            Buffer.from(JSON.stringify({ source: "GSCCCA name index", searchedAt: g.searchedAt, ownerNames: g.ownerNames, deeds: g.deeds }, null, 2)),
            "application/json",
            { type: "raw_index", source: "gsccca", count: g.deeds.length },
          ),
        );
      }
      if (g.liens?.length) {
        uploads.push(
          uploadDocument(
            row.id,
            "liens",
            `gsccca-lien-index-${ts}.json`,
            Buffer.from(JSON.stringify({ source: "GSCCCA lien index", searchedAt: g.searchedAt, ownerNames: g.ownerNames, liens: g.liens }, null, 2)),
            "application/json",
            { type: "raw_index", source: "gsccca", count: g.liens.length },
          ),
        );
      }
      if (g.uccs?.length || g.pt61s?.length) {
        uploads.push(
          uploadDocument(
            row.id,
            "other",
            `gsccca-ucc-pt61-${ts}.json`,
            Buffer.from(JSON.stringify({ source: "GSCCCA UCC + PT-61", searchedAt: g.searchedAt, uccs: g.uccs || [], pt61s: g.pt61s || [] }, null, 2)),
            "application/json",
            { type: "raw_index", source: "gsccca" },
          ),
        );
      }
    }
    const fed = result.rawData.courtlistener || result.rawData.pacer;
    if (fed) {
      uploads.push(
        uploadDocument(
          row.id,
          "court_records",
          `federal-court-${ts}.json`,
          Buffer.from(JSON.stringify({
            source: result.rawData.courtlistener ? "CourtListener (RECAP)" : "PACER",
            searchedAt: (fed as { searchedAt?: string }).searchedAt,
            data: fed,
          }, null, 2)),
          "application/json",
          { type: "raw_index", source: result.rawData.courtlistener ? "courtlistener" : "pacer" },
        ),
      );
    }
    if (result.rawData.parcel) {
      uploads.push(
        uploadDocument(
          row.id,
          "other",
          `parcel-anchor-${ts}.json`,
          Buffer.from(JSON.stringify(result.rawData.parcel, null, 2)),
          "application/json",
          { type: "parcel_anchor", source: "county_gis" },
        ),
      );
    }
    if (uploads.length) {
      await Promise.allSettled(uploads);
      console.log(`[searching] vaulted ${uploads.length} raw-source snapshot(s) for report ${row.id}`);
    }
  } catch (err) {
    // Non-fatal — vault is supplementary; the report still ships even if
    // Storage hiccups. Log so we can backfill later.
    console.warn(`[searching] raw-source vault upload failed for ${row.id}:`, err);
  }

  // Property update with parcel anchor data
  if (result.parcelAnchor) {
    const a = result.parcelAnchor;
    // Build a legal description from whatever fields the county GIS gave us.
    // Most platted Buckhead-era lots have no Subdiv populated — we then
    // fall back to a tax-parcel reference, which is the minimum acceptable
    // legal description per OCGA § 44-2-21 commentary when paired with the
    // recorded plat reference in the deed images.
    const platRef = [a.subdivision, a.subdivisionLot, a.subdivisionBlock]
      .filter(Boolean).join(" / ");
    let legalDesc: string;
    if (platRef) {
      legalDesc = `${platRef}, ${a.county} County, Georgia. Tax Parcel ${a.parcelId}.`;
    } else {
      legalDesc =
        `Tax Parcel ${a.parcelId}, ${a.county} County, Georgia` +
        (a.landAcres ? `, containing ${a.landAcres.toFixed(2)} acres more or less` : "") +
        ". Refer to most recent vesting deed of record for full metes-and-bounds " +
        "description. Survey recommended for boundary verification.";
    }

    await db.from("properties").update({
      parcel_id: a.parcelId,
      legal_description: legalDesc,
      acreage: a.landAcres || null,
      assessed_value: a.totalAssessedValue || null,
      tax_year: a.taxYear || null,
    }).eq("id", row.property_id);
  }

  // Hero imagery for the PDF + dashboard (Street View + Static Map).
  // Non-fatal — logs and skips if API key missing or property uncovered.
  if (row.full_address) {
    try {
      await ensurePropertyImagery(row.property_id, row.full_address);
    } catch (err) {
      console.warn(`[searching] property imagery failed for ${row.id}:`, err);
    }
  }

  await advanceTo(db, row.id, "permits");
}

async function stagePermits(db: SupabaseClient, row: ReportRow) {
  const { data: prop } = await db
    .from("properties")
    .select("id, full_address, county, parcel_id")
    .eq("id", row.property_id)
    .single();
  if (!prop) throw new Error("Property not found");
  const permits = await fetchPermitsForProperty(prop.full_address, prop.county || undefined);
  if (permits.length > 0) {
    await db.from("permits").insert(
      permits.map((p) => ({
        property_id: prop.id,
        report_id: row.id,
        source: p.source,
        permit_number: p.permitNumber,
        permit_type: p.permitType || null,
        work_description: p.workDescription || null,
        applied_date: p.appliedDate || null,
        issued_date: p.issuedDate || null,
        finaled_date: p.finaledDate || null,
        status: p.status || null,
        declared_value: p.declaredValue ?? null,
        applicant: p.applicant || null,
        contractor: p.contractor || null,
        contractor_license: p.contractorLicense || null,
        raw_attributes: p.rawAttributes || null,
      }))
    );
  }
  await logEvent(db, row.id, "permits", "succeeded", { count: permits.length });
  await advanceTo(db, row.id, "panel_review");
}

async function stagePanelReview(db: SupabaseClient, row: ReportRow) {
  // Load the full report from DB to feed the panel
  const report = await loadReport(db, row.id);
  // CHOSEN: Option 2 (lowest-risk; no state-machine reorder). panel.ts reads
  // NO aol/draft field — it judges report DATA by each persona's domain lens
  // (panel.ts runPanelReview ~274, persona prompt ~121). The stale-AOL kill
  // came from the PAYLOAD: loadReport injects aolDraft (line ~535) and
  // panel_review runs BEFORE aol_lock regenerates it, so r.aol_draft can be a
  // leftover hallucination from a prior run. We strip it here so the panel
  // judges the underlying records, not a stale draft. Final-AOL coherence is
  // already guaranteed downstream by the aol_lock citation gate
  // (assertAolCitationsGrounded) + deterministic AOL assembly.
  const panelPayload = { ...report, aolDraft: undefined };
  const panel = await runPanelReview(panelPayload);
  // Insert each persona row
  for (const r of panel.reviews) {
    await db.from("report_qa_reviews").upsert({
      report_id: row.id,
      persona: r.persona,
      verdict: r.verdict,
      severity: r.severity,
      blocking_issues: r.blockingIssues,
      notes: r.notes,
      model: r.model,
      prompt_tokens: r.promptTokens,
      completion_tokens: r.completionTokens,
      cost_cents: r.costCents,
    }, { onConflict: "report_id,persona" });
  }
  await db
    .from("search_reports")
    .update({
      panel_verdict: panel.orchestratorVerdict,
      panel_ship_confidence_pct: panel.shipConfidencePct,
    })
    .eq("id", row.id);

  if (panel.orchestratorVerdict === "kill") {
    await db
      .from("search_reports")
      .update({
        pipeline_stage: "blocked",
        last_error: "Panel verdict: kill — " + (panel.orchestratorBlockingIssues.join("; ") || "see qa reviews"),
        attorney_action_plan: null,
      })
      .eq("id", row.id);
    try { await refundReport(db, row.id, "PANEL_KILL"); }
    catch (e) { console.warn(`[panel_review] refund failed for ${row.id}:`, e); }
    return;
  }
  // Hand off to the specialist chain — Caleb (chain) → Reena (liens) →
  // Maggie (defects) → Tom (AOL) → drafting.
  await advanceTo(db, row.id, "chain_analysis");
}

async function stageDrafting(db: SupabaseClient, row: ReportRow) {
  const report = await loadReport(db, row.id);

  // Refresh attorney action plan before PDF render (uses final defects + liens)
  const { persistAttorneyActionPlan } = await import("../src/lib/attorney-action-plan");
  await persistAttorneyActionPlan(db, row.id, report);

  // Load attorney/firm profile
  const { data: user } = await db
    .from("users")
    .select("id, name, email, bar_number, state, default_firm_id")
    .eq("id", row.user_id)
    .single();
  let firm: Record<string, unknown> | null = null;
  let attorney: Record<string, unknown> | null = null;
  if (user?.default_firm_id) {
    const { data: f } = await db.from("firms").select("*").eq("id", user.default_firm_id).single();
    firm = f || null;
    const { data: a } = await db
      .from("firm_attorneys")
      .select("*")
      .eq("firm_id", user.default_firm_id)
      .eq("is_default", true)
      .maybeSingle();
    attorney = a || null;
  }

  // Generate both PDFs in parallel
  const [titleReportPdf, aolPdf, homeownerPdf] = await Promise.all([
    generateReportPDF(report, { user, firm, attorney }),
    generateAOLPDF(report, { user, firm, attorney }),
    generateHomeownerSummaryPDF(report, { user, firm, attorney }),
  ]);

  // Upload to vault
  const { uploadDocument, storeGeneratedPDF } = await import("../src/lib/document-storage");
  await storeGeneratedPDF(row.id, titleReportPdf, "title_report");
  const aolDoc = await uploadDocument(row.id, "generated", "Attorney_Opinion_Letter.pdf", aolPdf, "application/pdf", { type: "aol_letter" });
  const homeownerDoc = await uploadDocument(row.id, "generated", "Homeowner_Summary.pdf", homeownerPdf, "application/pdf", { type: "homeowner_summary" });

  await db
    .from("search_reports")
    .update({
      aol_pdf_path: aolDoc.storagePath,
      homeowner_pdf_path: homeownerDoc.storagePath,
    })
    .eq("id", row.id);

  await advanceTo(db, row.id, "ready", { completed_at: new Date().toISOString() });
}

async function loadReport(db: SupabaseClient, reportId: string): Promise<TitleSearchReport> {
  const { data: r } = await db
    .from("search_reports")
    .select(`
      id, summary, risk_score, chain_of_title, chain_breaks, years_searched,
      search_start_date, search_end_date, liens, easements, defects, aol_draft,
      property:properties(full_address, street, city, state, zip, county, parcel_id, legal_description, acreage, assessed_value, imagery)
    `)
    .eq("id", reportId)
    .single();
  if (!r) throw new Error("Report not found");
  const rawProp = (r as { property?: Record<string, unknown> | Record<string, unknown>[] }).property;
  const p = (Array.isArray(rawProp) ? rawProp[0] || {} : rawProp || {}) as Record<string, unknown>;

  // Standard disclaimer required on every report payload — surfaces to both
  // the panel and the PDFs so reviewers see we're not claiming to issue a
  // title opinion (which is the AOL's job).
  const disclaimer =
    "This Title Search Report is an informational compilation of public records " +
    "obtained from GSCCCA, federal courts, and county GIS systems. It is NOT a " +
    "title opinion, title abstract, or title insurance. The accompanying Attorney " +
    "Opinion Letter (AOL) issued by the licensed examining attorney is the only " +
    "document on which a lender, buyer, or third party may rely.";

  const indexGapCount = (r.chain_of_title || []).filter(
    (e: { grantor?: string; grantee?: string }) =>
      (e.grantor || "").toUpperCase() === "UNKNOWN" ||
      (e.grantee || "").toUpperCase() === "UNKNOWN"
  ).length;

  const dataQualityNote =
    indexGapCount > 0
      ? `\n\nDATA QUALITY (${indexGapCount} chain row(s)): GSCCCA name-index lists one party per row; ` +
        `"Unknown" grantor/grantee means the counterparty was not in the index row — pull deed images. ` +
        `This is not a proven chain break.`
      : "";

  const summary = r.summary
    ? `${r.summary}\n\n${disclaimer}${dataQualityNote}`
    : `${disclaimer}${dataQualityNote}`;

  return {
    id: r.id,
    address: { fullAddress: String(p.full_address ?? ""), street: String(p.street ?? ""), city: String(p.city ?? ""), state: String(p.state ?? "GA"), zip: String(p.zip ?? "") },
    parcel: { county: String(p.county ?? ""), state: String(p.state ?? "GA"), parcelId: String(p.parcel_id ?? ""), legalDescription: String(p.legal_description ?? "") },
    chainOfTitle: { entries: r.chain_of_title || [], breaks: r.chain_breaks || [], yearsSearched: r.years_searched || 0, startDate: r.search_start_date || "", endDate: r.search_end_date || "" },
    liens: r.liens || [],
    easements: r.easements || [],
    defects: r.defects || [],
    aolDraft: r.aol_draft || undefined,
    imagery: (p.imagery as Record<string, unknown> | undefined) || undefined,
    summary,
    riskScore: r.risk_score || 0,
  } as unknown as TitleSearchReport;
}

/* ─── Stage dispatch ─── */

async function processOne(db: SupabaseClient, row: ReportRow): Promise<void> {
  const stage = row.pipeline_stage;
  await bumpStageStarted(db, row.id);
  await logEvent(db, row.id, stage, "started", { attempts: row.stage_attempts });
  const t0 = Date.now();
  try {
    switch (stage) {
      case "queued":
        await advanceTo(db, row.id, "searching");
        break;
      case "searching":
        await stageSearching(db, row);
        break;
      case "permits":
        await stagePermits(db, row);
        break;
      case "panel_review":
        await stagePanelReview(db, row);
        break;
      case "chain_analysis":
      case "lien_analysis":
      case "defect_review":
      case "aol_lock":
        await runPersonaStage(db, row, stage as PersonaStageName);
        break;
      case "drafting":
        await stageDrafting(db, row);
        break;
      case "ready":
        // Terminal until attorney downloads/sends. Bump to delivered when they do.
        break;
      default:
        throw new Error(`Unknown stage: ${stage}`);
    }
    await logEvent(db, row.id, stage, "succeeded", undefined, Date.now() - t0);
  } catch (err) {
    await logEvent(db, row.id, stage, "failed", { error: err instanceof Error ? err.message : String(err) }, Date.now() - t0);
    await failStage(db, row.id, err, row.stage_attempts);
  }
}

async function main() {
  const db = admin();
  const forceId = process.env.CLIROS_FORCE_REPORT_ID;
  if (forceId) {
    const { data: row } = await db
      .from("search_reports")
      .select("id, user_id, property_id, pipeline_stage, stage_started_at, stage_attempts, panel_verdict")
      .eq("id", forceId)
      .single();
    if (!row) {
      console.error(`[pipeline-tick] force report not found: ${forceId}`);
      process.exit(1);
    }
    const { data: prop } = await db
      .from("properties")
      .select("full_address, county")
      .eq("id", row.property_id)
      .single();
    console.log(`[pipeline-tick] forced report=${forceId} stage=${row.pipeline_stage}`);
    await processOne(db, { ...row, full_address: prop?.full_address, county: prop?.county });
    return;
  }

  const deadline = Date.now() + TICK_BUDGET_MS;
  let processed = 0;

  while (Date.now() < deadline) {
    const row = await claimNextReport(db);
    if (!row) {
      console.log(`[pipeline-tick] no work; processed=${processed}; exiting`);
      return;
    }
    console.log(`[pipeline-tick] advancing report=${row.id} stage=${row.pipeline_stage} attempt=${row.stage_attempts + 1}`);
    await processOne(db, row);
    processed++;
  }
  console.log(`[pipeline-tick] budget exhausted; processed=${processed}`);
}

main().catch((e) => {
  console.error("[pipeline-tick] fatal:", e);
  process.exit(1);
});
