/* ─── Per-step QC scorer ───
   TypeScript port of shared/scripts/step_qc.py — same rubric shape, same
   PASS condition (composite >= 9.0 AND every dim >= 8), same redo
   semantics (verdict: "FAIL" means the cron should retry the stage).

   GRADES ABSOLUTE QUALITY of CURR (is the artifact correct/complete/sourced
   per its rubric), NOT the improvement delta over PREV. PREV is context only.
   A high-quality artifact that needs no change from PREV must PASS — grading
   the delta caused already-good artifacts to fail forever (the 2026-05-28
   MAX_ATTEMPTS systemic-block bug).

   WHY (no bloat): one shared scorer with a STEP_RUBRIC dict. Add a new step
   by adding a rubric entry — do NOT create a sibling file. Mirrors the
   YouTube pipeline contract documented in
   shared/portfolio-hub/youtube-production-pipeline.md.

   USAGE
     const qc = await stepQc({ step: "defect-specialist", prev, curr, slug });
     if (qc.verdict !== "PASS") { ...retry with qc.fixes... }
*/

import Anthropic from "@anthropic-ai/sdk";

const QC_MODEL = process.env.ANTHROPIC_QC_MODEL || "claude-sonnet-4-5";

// Sonnet 4.5 pricing (May 2026): $3/M input, $15/M output. We use Sonnet
// for the scorer because (a) it's good enough to compare two structured
// JSON artifacts and (b) it keeps per-step QC under $0.05.
const PRICE_PER_M = { input: 3.0, output: 15.0 };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface RubricDim {
  key: string;
  description: string;
}

export interface RubricEntry {
  owner: string;
  dims: RubricDim[];
}

export const STEP_RUBRIC: Record<string, RubricEntry> = {
  "chain-analyst": {
    owner: "Chain-of-title analyst persona (post panel_review)",
    dims: [
      {
        key: "dates_complete",
        description:
          "Every chain entry in CURR has a non-empty recordedDate that parses to a real date.",
      },
      {
        key: "parties_resolved",
        description:
          "Every entry has both grantor and grantee. 'Unknown' is allowed only when the source row was missing it; the persona has explained each case in notes[].",
      },
      {
        key: "breaks_real_not_unknown",
        description:
          "Chain breaks in CURR exclude any pair where either side is 'Unknown' (those are GSCCCA index gaps, not real defects).",
      },
      {
        key: "book_page_present",
        description:
          "Every entry has bookPage populated (deed book-page) — the citation the AOL has to print.",
      },
      {
        key: "vesting_deed_eligible",
        description:
          "Judges ONLY whether the chain correctly identifies a valid vesting/legal-description source — it does NOT govern the chain_breaks[] array (that is breaks_real_not_unknown's job; never push a finding into chain_breaks[] to satisfy this dim). " +
          "PASS (10) when the most-recent CONVEYANCE's grantee is resolved (not 'Unknown') and IS the current owner, and that conveyance (or, if it is a bare spousal-quitclaim/corrective, the most-recent full warranty in-deed to that same owner) is available as the legal-description source. A quitclaim whose grantee matches the owner by surname-and-one-other-token (e.g. 'CHAD E' ≈ 'CHAD E') is a VALID vesting source — a middle-token variant on an EARLIER deed ('CHAD EDWARD' vs 'CHAD E') does NOT disqualify the later matching in-deed. " +
          "FAIL only if the chain names as its vesting/legal-description source an instrument that is an OUT-deed relative to the current owner (owner is grantor), an 'Unknown'-grantee row, or a non-conveyance (security_deed/cancellation/assignment/plat/lien). " +
          "Out-deed handling (does NOT block this dim by itself): an out-deed running FROM the current owner's CURRENT indexed identity that is unreconciled should be captured as a finding in notes[]/findings[] — NOT in chain_breaks[]. An out-deed from a PRIOR indexed identity of the owner (e.g. 'CHAD EDWARD' when the owner is now indexed 'CHAD E') is a notes-level reconciliation, not a hard fail. Score this dim on the vesting-source correctness above; the finding's placement is informational.",
      },
    ],
  },
  "lien-analyst": {
    owner: "Lien-pairing analyst persona",
    dims: [
      {
        key: "liens_not_dropped",
        description:
          "DATA-INTEGRITY: If PREV contains lien rows but CURR contains ZERO liens, that is a dropped-data failure — score 0 and FAIL. The persona's job is to clean/annotate/pair the lien set, never to empty it. A genuinely lien-free property has PREV empty too (then score 10). Only score 10 when CURR's lien count is consistent with PREV (same rows, possibly re-statused released/active), NOT when a populated PREV became an empty CURR. Quote PREV and CURR lien counts in evidence[].",
      },
      {
        key: "sd_canc_paired",
        description:
          "If CURR contains any cancellation rows: each one references the security deed it cancels (referencedBookPage set) and that SD's status is 'released'. If CURR has zero cancellation rows (none in source), score 10 — there is no pairing to enforce.",
      },
      {
        key: "active_unreleased_flagged",
        description:
          "Every active SD/mortgage in CURR has status:'active' and a recordedDate; the persona's defect_flags_for_specialist mentions any unexpectedly old ones (>20yr SDs, >7yr dormant judgments, >10yr federal tax liens). If there are no active SDs/mortgages, this dim scores 10.",
      },
      {
        key: "amount_present_or_explained",
        description:
          "Each active SD or mortgage has either an amount, or notes saying 'amount not in index — pull deed image'. Tax liens, judgment liens, and UCC filings often have no amount in the source index — for those types missing amount is acceptable without a pull-image note.",
      },
      {
        key: "borrower_or_pull_image",
        description:
          "Each active SD or mortgage names the borrower OR carries notes 'borrower not in index — pull deed image' OR has pull_image_required:true. Tax liens use the indexed taxpayer/debtor name from the source — no fallback needed. If there are no active SDs/mortgages, this dim scores 10.",
      },
    ],
  },
  "defect-specialist": {
    owner: "Title defect specialist persona",
    dims: [
      {
        key: "marketability_grounded",
        description:
          "Every defect in CURR explains the marketability impact in one sentence (e.g. 'unreleased SD blocks fee-simple conveyance until cancelled per OCGA §44-14-3').",
      },
      {
        key: "severity_calibrated_to_GA_law",
        description:
          "Severity (critical/major/minor) matches Georgia title-examination practice — true clouds = critical, latent gaps = major, recording typos = minor.",
      },
      {
        key: "recommendation_actionable",
        description:
          "Each defect has a recommendation that names the action and the responsible party ('attorney to obtain quitclaim from the gap party, or file quiet title under OCGA §23-3-60', not 'review with attorney'). Do NOT reward a recommendation that offers a recorded affidavit under OCGA §44-2-20 as a CURE — that affidavit gives record notice only, it is not a conveyance and does not cure a defect.",
      },
      {
        key: "cites_statute_or_record",
        description:
          "Defects cite an OCGA section, a recorded instrument book-page, or both. Generic 'consult counsel' without citation fails.",
      },
    ],
  },
  "aol-quality": {
    owner: "AOL drafter persona",
    dims: [
      {
        key: "exception_schedule_complete",
        description:
          "AOL draft lists every active lien + every real chain break + every critical/major defect as a numbered exception. " +
          "ANTI-HALLUCINATION: Judge ONLY the literal text present in CURR (the assembled letter). The 'LIENS AND ENCUMBRANCES' section is assembled deterministically from the report's liens array — READ it before scoring. Do NOT claim the letter says 'No active liens were found' unless that exact phrase literally appears in CURR; if CURR's LIENS section enumerates numbered mortgage/lien entries with Book/Page, the liens ARE present — score accordingly. Do NOT require active liens to be DUPLICATED into the TITLE DEFECTS section to count as scheduled; a lien listed under 'LIENS AND ENCUMBRANCES' (and/or referenced in the qualified opinion) is properly scheduled. Quote the exact CURR line you rely on in evidence[]; if you cannot quote it, do not assert it.",
      },
      {
        key: "b7_206_format",
        description:
          "AOL follows Fannie Mae B7-2-06 structure: property, search period, parties examined, exceptions, opinion paragraph, signature block.",
      },
      {
        key: "effective_date_correct",
        description:
          "Effective date matches the search end date in the report; not the date the AOL was generated.",
      },
      {
        key: "no_unsupported_opinion",
        description:
          "The opinion states no ownership, lien-priority, or marketability conclusion " +
          "that the chain_of_title / liens entries do not support. IMPORTANT — the " +
          "CORRECT form when ANY exception, defect, or unresolved index gap exists is the " +
          "QUALIFIED opinion: 'subject to the curative actions enumerated in Schedule B, " +
          "title is reasonably expected to be marketable upon completion of those actions.' " +
          "That qualified conclusion is fully supported and is a PASS — do NOT penalize it, " +
          "and do NOT demand a flat / categorical 'title is unmarketable' or 'cannot be " +
          "conveyed' (that would itself be an UNSUPPORTED overreach). A GSCCCA name-index " +
          "gap or an 'Unknown' party is a reconciliation task, not a proven chain break, " +
          "unless chain_of_title.breaks actually lists one. Judge ONLY the text present in " +
          "CURR (the assembled letter); do NOT invent, paraphrase, or assume marketability- " +
          "assessment wording that is not literally in CURR. Fail only when the opinion " +
          "asserts something the data does not support (e.g. unqualified 'marketable' " +
          "despite open exceptions, a vesting owner absent from the chain, or a categorical " +
          "unmarketable/withheld conclusion).",
      },
    ],
  },
};

export interface StepQcInput {
  step: keyof typeof STEP_RUBRIC | string;
  /** The artifact before this persona pass — text or JSON-stringified. */
  prev: string;
  /** The artifact after this persona pass — text or JSON-stringified. */
  curr: string;
  /** Report ID or slug for logging. */
  slug: string;
}

export interface StepQcResult {
  step: string;
  scores: Record<string, number>;
  composite: number;
  verdict: "PASS" | "FAIL";
  fixes: string[];
  evidence: string[];
  costUsd: number;
  costCents: number;
  promptTokens: number;
  completionTokens: number;
}

function buildPrompt(stepId: string): string {
  const rub = STEP_RUBRIC[stepId];
  if (!rub) {
    throw new Error(`Unknown step "${stepId}". Add a STEP_RUBRIC entry first.`);
  }
  const dimsMd = rub.dims
    .map((d) => `- **${d.key}** — ${d.description}`)
    .join("\n");
  return [
    `You are an audit reviewer for pipeline step **${stepId}** owned by: ${rub.owner}.`,
    "Your only job: judge whether CURR is correct and complete on its own terms",
    "against this step's rubric. Score the ABSOLUTE quality of CURR — is the",
    "artifact right, complete, and well-sourced per each dimension below?",
    "Do NOT grade how much CURR changed relative to PREV: PREV is provided only",
    "as context (it is the upstream/prior artifact CURR was derived from). If",
    "CURR is already correct and needs no change from PREV, that is a PASS, not a",
    "failure — a high-quality artifact must score high even when it is identical",
    "or nearly identical to PREV.",
    "",
    "## Rubric (score 0–10 each) — score CURR's absolute correctness on each dim",
    dimsMd,
    "",
    "## Output (mandatory JSON, no prose around it)",
    "```json",
    '{"scores":{"<dim_key>":<int>}, "composite":<float 0-10>, ' +
      '"verdict":"PASS"|"FAIL", "fixes":["..."], "evidence":["short line refs"]}',
    "```",
    "Rules:",
    "- composite = mean of dim scores rounded to 1dp",
    "- verdict PASS requires composite >= 9.0 AND every dim >= 8",
    "- fixes: empty if PASS, else 1-3 actionable bullets pointing at lines/sections",
  ].join("\n");
}

function extractJson(text: string): Record<string, unknown> {
  // Strip ``` fences and lift the last balanced {...} block.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON in response: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(10, Math.round(v)));
}

export async function stepQc(input: StepQcInput): Promise<StepQcResult> {
  const { step, prev, curr, slug } = input;
  const rub = STEP_RUBRIC[step];
  if (!rub) {
    throw new Error(`Unknown step "${step}". Add a STEP_RUBRIC entry first.`);
  }

  // Hard token budget for the scorer — Sonnet handles ~16K chars per side
  // and we don't need more for these structured artifacts.
  const trim = (s: string) => (s.length > 16_000 ? s.slice(0, 16_000) + "\n[truncated]" : s);

  const systemPrompt =
    "You audit pipeline persona passes. Return ONE json object. No preamble, no commentary.";
  const userPrompt = `${buildPrompt(step)}\n\nPREV:\n${trim(prev)}\n\nCURR:\n${trim(curr)}`;

  const resp = await client.messages.create({
    model: QC_MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = resp.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");
  const obj = extractJson(text);

  const rawScores = (obj.scores || {}) as Record<string, unknown>;
  const scores: Record<string, number> = {};
  for (const dim of rub.dims) {
    scores[dim.key] = clampScore(rawScores[dim.key]);
  }
  const dimValues = Object.values(scores);
  const composite =
    dimValues.length > 0
      ? Math.round((dimValues.reduce((a, b) => a + b, 0) / dimValues.length) * 10) / 10
      : 0;
  // Independent verdict computation — don't trust the model's verdict field
  // since the rubric contract is unambiguous: composite >= 9.0 AND every dim >= 8.
  const allDimsClear = dimValues.every((v) => v >= 8);
  const verdict: "PASS" | "FAIL" = composite >= 9.0 && allDimsClear ? "PASS" : "FAIL";

  const fixes = Array.isArray(obj.fixes)
    ? (obj.fixes as unknown[]).map(String).slice(0, 5)
    : [];
  const evidence = Array.isArray(obj.evidence)
    ? (obj.evidence as unknown[]).map(String).slice(0, 5)
    : [];

  const inTok = resp.usage?.input_tokens || 0;
  const outTok = resp.usage?.output_tokens || 0;
  const costUsd =
    (inTok / 1_000_000) * PRICE_PER_M.input +
    (outTok / 1_000_000) * PRICE_PER_M.output;
  const costCents = Math.round(costUsd * 100);

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[step-qc] ${step} slug=${slug} composite=${composite} verdict=${verdict} cost=$${costUsd.toFixed(
        4
      )}`
    );
  }

  return {
    step,
    scores,
    composite,
    verdict,
    fixes,
    evidence,
    costUsd,
    costCents,
    promptTokens: inTok,
    completionTokens: outTok,
  };
}
