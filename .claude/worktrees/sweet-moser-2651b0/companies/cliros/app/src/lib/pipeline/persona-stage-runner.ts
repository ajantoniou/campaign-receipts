/* ─── Persona stage runner ───
   The wrapper called by the cron tick for each of chain_analysis,
   lien_analysis, defect_review, aol_lock.

   Lifecycle per call:
     1. Load report + previous artifact + prior QC fixes (if retry attempt)
     2. Hard-cap check: refuse to start if cumulative ai_spend_cents would
        exceed CLIROS_AI_SPEND_CAP_CENTS (default 250¢ = $2.50/report)
     3. Run persona pass → payload + cost
     4. Run step_qc(prev, curr) → composite + verdict + fixes + cost
     5. Persist a persona_passes row (with attempt #)
     6. Bump search_reports.ai_spend_cents
     7. If PASS → applyPassOutput → advance to next stage
     8. If FAIL → throw so failStage() retries with these fixes attached
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import { stepQc } from "./step-qc";
import {
  runPersonaPass,
  PERSONA_PASSES,
  nextPersonaStage,
  type PersonaStage,
} from "./persona-passes";
import { persistAttorneyActionPlan, reportRowToTitleSearch } from "../attorney-action-plan";
import { generateAOLDraft, type AOLAuthorInfo } from "../aol-template";
import type { TitleSearchReport } from "../types";

const SPEND_CAP_CENTS = Number(process.env.CLIROS_AI_SPEND_CAP_CENTS || 250);
// Per-stage redo budget. Cron's MAX_ATTEMPTS=3 governs actual retries; we
// surface the cap in the error message so the dashboard reads the right
// number on the blocked toast.
const MAX_REDOS_PER_STAGE = 2;

interface ReportRowLite {
  id: string;
  user_id: string;
  property_id: string;
  pipeline_stage: string;
  stage_attempts: number;
}

interface FullReport {
  id: string;
  chain_of_title: unknown[];
  chain_breaks: string[];
  liens: unknown[];
  defects: unknown[];
  easements: unknown[];
  summary: string;
  risk_score: number;
  years_searched: number;
  search_start_date: string | null;
  search_end_date: string | null;
  aol_draft: string | null;
  ai_spend_cents: number;
  property: {
    full_address: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    parcel_id: string;
    legal_description: string;
  };
}

async function loadFullReport(db: SupabaseClient, reportId: string): Promise<FullReport> {
  const { data: r } = await db
    .from("search_reports")
    .select(
      `id, summary, risk_score, chain_of_title, chain_breaks, years_searched,
       search_start_date, search_end_date, liens, easements, defects, aol_draft,
       ai_spend_cents,
       property:properties(full_address, street, city, state, zip, county, parcel_id, legal_description)`
    )
    .eq("id", reportId)
    .single();
  if (!r) throw new Error(`Report ${reportId} not found`);
  const rawProp = (r as unknown as { property?: unknown }).property;
  const property = (Array.isArray(rawProp) ? rawProp[0] : rawProp) || {};
  return {
    ...(r as unknown as FullReport),
    property: property as FullReport["property"],
  };
}

/** Build the persona's prev-artifact for a given stage. */
function buildPrevArtifact(stage: PersonaStage, r: FullReport): string {
  switch (stage) {
    case "chain_analysis":
      return JSON.stringify(
        { chain_of_title: r.chain_of_title, chain_breaks: r.chain_breaks },
        null,
        2
      );
    case "lien_analysis":
      return JSON.stringify({ liens: r.liens }, null, 2);
    case "defect_review":
      return JSON.stringify({ defects: r.defects, risk_score: r.risk_score }, null, 2);
    case "aol_lock":
      return r.aol_draft || "(no prior AOL draft — produce the first cut)";
  }
}

/** Build a compact full-report payload that every persona sees. */
function buildReportPayload(r: FullReport): string {
  const compact = {
    property: r.property,
    search_window: { start: r.search_start_date, end: r.search_end_date, years: r.years_searched },
    chain_of_title: r.chain_of_title,
    chain_breaks: r.chain_breaks,
    liens: r.liens,
    defects: r.defects,
    easements: r.easements,
    risk_score: r.risk_score,
  };
  return JSON.stringify(compact, null, 2);
}

/** Normalize a citation token for set membership (trim + collapse). */
function normToken(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

interface Citation {
  bookPage?: unknown;
  instrumentNumber?: unknown;
}

/**
 * PART 2 — Hard validation gate for the AOL persona output.
 *
 * Builds the allowed-set of {bookPage, instrumentNumber} tokens from the
 * structured chainOfTitle.entries ∪ liens (DeedRecord.bookPage /
 * DeedRecord.instrumentNumber and LienRecord.bookPage /
 * LienRecord.referencedBookPage / LienRecord.instrumentNumber — exact field
 * names per src/lib/types.ts). Every bookPage / instrumentNumber the persona
 * cites in chain_citations / lien_citations MUST be a member, otherwise the
 * letter would recite a record that is not in the source data (malpractice).
 *
 * Throws on any violation — reusing the same fail/retry path as a QC FAIL.
 */
function assertAolCitationsGrounded(
  report: TitleSearchReport,
  payload: Record<string, unknown>
): void {
  const allowedBookPage = new Set<string>();
  const allowedInstrument = new Set<string>();

  for (const e of report.chainOfTitle.entries || []) {
    if (e.bookPage) allowedBookPage.add(normToken(e.bookPage));
    if (e.instrumentNumber) allowedInstrument.add(normToken(e.instrumentNumber));
  }
  for (const l of report.liens || []) {
    if (l.bookPage) allowedBookPage.add(normToken(l.bookPage));
    if (l.referencedBookPage) allowedBookPage.add(normToken(l.referencedBookPage));
    if (l.instrumentNumber) allowedInstrument.add(normToken(l.instrumentNumber));
  }

  const offending: string[] = [];

  // Internal array keys (e.g. "deed-24", "sd-lien-2") are NOT recordable
  // references and must never appear in a citation — catch them explicitly so
  // a drifted persona can't pass one off as an instrument number.
  const isSyntheticId = (t: string) => /^(deed|sd-lien|lien)-\d+$/i.test(t);

  const checkCitations = (raw: unknown, label: string) => {
    const arr = Array.isArray(raw) ? (raw as Citation[]) : [];
    for (const c of arr) {
      const bp = normToken(c.bookPage);
      const inst = normToken(c.instrumentNumber);
      if (isSyntheticId(bp) || isSyntheticId(inst)) {
        offending.push(
          `${label} cited internal id "${isSyntheticId(bp) ? bp : inst}" — that is an ` +
            `internal array key, not a recordable Book/Page or instrument number`
        );
        continue;
      }
      if (bp && !allowedBookPage.has(bp)) {
        offending.push(`${label} bookPage "${bp}" not in source data`);
      }
      if (inst && !allowedInstrument.has(inst)) {
        offending.push(`${label} instrumentNumber "${inst}" not in source data`);
      }
    }
  };

  checkCitations(payload.chain_citations, "chain_citations");
  checkCitations(payload.lien_citations, "lien_citations");

  // A vesting owner asserted against an empty chain is a phantom recital.
  const vestingOwner = normToken(payload.vesting_owner);
  if (vestingOwner && (report.chainOfTitle.entries || []).length === 0) {
    offending.push(
      `vesting_owner "${vestingOwner}" asserted but chain_of_title is empty`
    );
  }

  if (offending.length > 0) {
    throw new Error(
      `AOL citation gate FAIL: the persona cited records absent from the ` +
        `structured chain_of_title/liens. Offending: ${offending.join("; ")}. ` +
        `Re-draft using ONLY book/page and instrument numbers present in the source data.`
    );
  }
}

/**
 * Guard against silent data loss: refuse to overwrite a non-empty jsonb array
 * column with an empty one. A persona pass that drops the chain/lien data
 * (truncated tool call, model returned no array) must FAIL the stage loudly —
 * never blank a report that upstream search already populated. Throws so the
 * normal failStage/retry path runs instead of persisting the wipe.
 */
async function assertNotWipingArray(
  db: SupabaseClient,
  reportId: string,
  column: "chain_of_title" | "liens",
  newLength: number
): Promise<void> {
  if (newLength > 0) return; // non-empty payload — nothing to guard
  const { data } = await db
    .from("search_reports")
    .select(column)
    .eq("id", reportId)
    .maybeSingle();
  const existing = (data as Record<string, unknown> | null)?.[column];
  // Both columns store a bare array directly (chain_of_title is the entries
  // array, liens is the lien array). Defensively also handle a { entries: [] }
  // shape in case an older row used it.
  const existingLen = Array.isArray(existing)
    ? existing.length
    : Array.isArray((existing as { entries?: unknown[] } | null)?.entries)
      ? (existing as { entries: unknown[] }).entries.length
      : 0;
  if (existingLen > 0) {
    throw new Error(
      `[data-loss-guard] refusing to overwrite ${existingLen} existing ${column} ` +
        `record(s) with an EMPTY array — persona returned no ${column}. This is a ` +
        `dropped-data failure, not a clean result; failing the stage instead of wiping the report.`
    );
  }
}

/** Apply the persona's structured output back to search_reports. */
async function applyPassOutput(
  db: SupabaseClient,
  reportId: string,
  stage: PersonaStage,
  payload: Record<string, unknown>
): Promise<void> {
  switch (stage) {
    case "chain_analysis": {
      const chain = Array.isArray(payload.chain_of_title) ? payload.chain_of_title : [];
      const breaks = Array.isArray(payload.chain_breaks)
        ? (payload.chain_breaks as string[]).filter((b) => !/\bUnknown\b/i.test(b))
        : [];
      // DATA-LOSS GUARD: a persona pass that returns an EMPTY chain must NOT
      // silently overwrite a non-empty chain already on the report. An empty
      // payload here means the persona dropped the data (truncation, bad tool
      // call) — destroying the real chain is far worse than failing the stage.
      await assertNotWipingArray(db, reportId, "chain_of_title", chain.length);
      await db
        .from("search_reports")
        .update({ chain_of_title: chain, chain_breaks: breaks })
        .eq("id", reportId);
      return;
    }
    case "lien_analysis": {
      const liens = Array.isArray(payload.liens) ? payload.liens : [];
      // DATA-LOSS GUARD: same as chain — never let an empty persona payload
      // overwrite a non-empty liens array. (This is the exact silent-wipe that
      // blanked report c53fc39b: Reena returned 0 liens, applyPassOutput wrote
      // [] over 22 real liens, and the empty set still passed QC.)
      await assertNotWipingArray(db, reportId, "liens", liens.length);
      // The defect_flags_for_specialist string array is included on the persona
      // pass record (cliros.persona_passes.artifact) so Maggie reads it next
      // tick. We don't shove it into search_reports.
      await db.from("search_reports").update({ liens }).eq("id", reportId);
      return;
    }
    case "defect_review": {
      const defects = Array.isArray(payload.defects) ? payload.defects : [];
      const risk = typeof payload.risk_score === "number" ? payload.risk_score : undefined;
      const update: Record<string, unknown> = { defects };
      if (risk !== undefined) update.risk_score = Math.max(0, Math.min(100, Math.round(risk)));
      await db.from("search_reports").update(update).eq("id", reportId);
      const full = await loadFullReport(db, reportId);
      await persistAttorneyActionPlan(
        db,
        reportId,
        reportRowToTitleSearch(full as unknown as Record<string, unknown>, full.property as unknown as Record<string, unknown>),
      );
      return;
    }
    case "aol_lock": {
      const full = await loadFullReport(db, reportId);
      const titleReport = reportRowToTitleSearch(
        full as unknown as Record<string, unknown>,
        full.property as unknown as Record<string, unknown>,
      );

      // PART 2 — hard gate: reject any citation not grounded in the source data.
      assertAolCitationsGrounded(titleReport, payload);

      // PART 3 — assemble the AOL body DETERMINISTICALLY from the structured
      // arrays (same source as Schedule B), slotting the persona's
      // opinion_language into the OPINION section. The persisted aol_draft is
      // this assembled text, so the body and Schedule B can never contradict.
      const author: AOLAuthorInfo = {
        name: "[ATTORNEY NAME]",
        state: titleReport.parcel.state || "Georgia",
      };
      const opinionLanguage =
        typeof payload.opinion_language === "string" ? payload.opinion_language : "";
      const assembled = generateAOLDraft(titleReport, author, opinionLanguage);

      await db.from("search_reports").update({ aol_draft: assembled }).eq("id", reportId);
      await persistAttorneyActionPlan(db, reportId, { ...titleReport, aolDraft: assembled });
      return;
    }
  }
}

/** Pull the prior attempt's QC fixes if this is a retry. */
async function loadPriorFixes(
  db: SupabaseClient,
  reportId: string,
  stage: PersonaStage,
  attempt: number
): Promise<string[]> {
  if (attempt <= 1) return [];
  const { data: prior } = await db
    .from("persona_passes")
    .select("step_qc")
    .eq("report_id", reportId)
    .eq("stage", stage)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();
  const qc = prior?.step_qc as { fixes?: string[] } | undefined;
  return Array.isArray(qc?.fixes) ? qc!.fixes! : [];
}

/** The cron's per-stage entry point. Called once per tick per stage. */
export async function runPersonaStage(
  db: SupabaseClient,
  row: ReportRowLite,
  stage: PersonaStage
): Promise<void> {
  const cfg = PERSONA_PASSES[stage];
  if (!cfg) throw new Error(`Unknown persona stage: ${stage}`);
  const attempt = row.stage_attempts + 1;

  const report = await loadFullReport(db, row.id);

  if (report.ai_spend_cents >= SPEND_CAP_CENTS) {
    throw new Error(
      `AI spend cap reached: ${report.ai_spend_cents}¢ >= ${SPEND_CAP_CENTS}¢ before stage ${stage}`
    );
  }

  const prev = buildPrevArtifact(stage, report);
  const reportPayload = buildReportPayload(report);
  const priorFixes = await loadPriorFixes(db, row.id, stage, attempt);

  const pass = await runPersonaPass({
    stage,
    reportId: row.id,
    prevArtifact: prev,
    reportPayload,
    priorFixes,
  });

  // What the step-QC SEES.
  //
  // For every persona stage EXCEPT aol_lock, the QC reviews the raw structured
  // payload (chain/lien/defect arrays etc.). For aol_lock that's wrong: the
  // aol-quality rubric's b7_206_format + exception_schedule_complete dims
  // demand a FORMATTED LETTER, which only ever exists as the deterministic
  // generateAOLDraft() output — never in the raw persona JSON. So for aol_lock
  // we assemble the SAME letter applyPassOutput persists and hand THAT to the
  // QC. (We do not change the persisted artifact or the citation gate here;
  // only what the reviewer reads.)
  let currForQc = JSON.stringify(pass.payload, null, 2);
  if (stage === "aol_lock") {
    try {
      const full = await loadFullReport(db, row.id);
      const titleReport = reportRowToTitleSearch(
        full as unknown as Record<string, unknown>,
        full.property as unknown as Record<string, unknown>,
      );
      const author: AOLAuthorInfo = {
        name: "[ATTORNEY NAME]",
        state: titleReport.parcel.state || "Georgia",
      };
      const opinionLanguage =
        typeof pass.payload.opinion_language === "string"
          ? (pass.payload.opinion_language as string)
          : "";
      currForQc = generateAOLDraft(titleReport, author, opinionLanguage);
    } catch (e) {
      // If assembly fails, fall back to the raw payload so the QC still runs;
      // the citation gate in applyPassOutput will surface the real failure.
      console.warn(`[persona-stage] aol_lock QC assembly failed for ${row.id}, using raw payload:`, e);
    }
  }
  const qc = await stepQc({
    step: cfg.qcStep,
    prev,
    curr: currForQc,
    slug: row.id,
  });

  const totalCents = pass.costCents + qc.costCents;

  await db.from("persona_passes").upsert(
    {
      report_id: row.id,
      stage,
      attempt,
      artifact: pass.payload,
      step_qc: {
        step: qc.step,
        scores: qc.scores,
        composite: qc.composite,
        verdict: qc.verdict,
        fixes: qc.fixes,
        evidence: qc.evidence,
        cost_usd: qc.costUsd,
        prior_fixes_in: priorFixes,
      },
      cost_cents_total: totalCents,
    },
    { onConflict: "report_id,stage,attempt" }
  );

  await db
    .from("search_reports")
    .update({
      ai_spend_cents: (report.ai_spend_cents || 0) + totalCents,
    })
    .eq("id", row.id);

  if (qc.verdict !== "PASS") {
    // Bubble up — failStage in run_pipeline_tick.ts will bump attempts.
    // After MAX_ATTEMPTS_PER_STAGE attempts the report goes to 'blocked'.
    const fixSummary = qc.fixes.slice(0, 3).join("; ") || "qc composite < 9";
    throw new Error(
      `step_qc.${qc.step} composite=${qc.composite} attempt=${attempt}/${MAX_REDOS_PER_STAGE + 1}: ${fixSummary}`
    );
  }

  await applyPassOutput(db, row.id, stage, pass.payload);

  const next = nextPersonaStage(stage);
  await db
    .from("search_reports")
    .update({
      pipeline_stage: next,
      stage_started_at: null,
      stage_attempts: 0,
      last_error: null,
    })
    .eq("id", row.id);
}
