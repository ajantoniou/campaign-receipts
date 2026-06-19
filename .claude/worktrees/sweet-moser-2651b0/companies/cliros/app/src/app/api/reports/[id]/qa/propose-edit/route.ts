/* POST /api/reports/[id]/qa/propose-edit — attorney-in-the-loop drafting.
 *
 *  The assistant PROPOSES an edited version of one document (the AOL draft or the
 *  client report) from the attorney's instruction, grounded on the report's own
 *  dossier. It NEVER writes — the response is a proposal the attorney approves
 *  (POST /drafts/apply) or sends back for a rewrite. Same UPL posture as the
 *  read-only Q&A: grounded facts + attorney-directed language only, no new legal
 *  conclusions of the assistant's own.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import {
  buildDraftProposalPrompt,
  parseProposalOutput,
  type ReportQaInput,
} from "@/lib/report-qa/prompt-builder";

export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 4096; // a full edited AOL can be long
const MAX_INSTRUCTION_CHARS = 1200;
const INPUT_PRICE_PER_MTOK = 1.0;
const OUTPUT_PRICE_PER_MTOK = 5.0;
const AI_SPEND_CAP_CENTS_DEFAULT = 250;

type Target = "aol_draft" | "client_report_draft";
const TARGET_LABELS: Record<Target, string> = {
  aol_draft: "the Attorney Opinion Letter (AOL) draft",
  client_report_draft: "the client report draft",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  let body: { instruction?: unknown; target?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
  const target = body.target === "client_report_draft" ? "client_report_draft" : "aol_draft";
  if (!instruction) {
    return NextResponse.json({ error: "Missing 'instruction'" }, { status: 400 });
  }
  if (instruction.length > MAX_INSTRUCTION_CHARS) {
    return NextResponse.json(
      { error: `Instruction too long (max ${MAX_INSTRUCTION_CHARS} characters).` },
      { status: 400 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Assistant unavailable" }, { status: 503 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );

  const { data: row } = await db
    .from("search_reports")
    .select(
      `id, user_id, summary, risk_score, chain_of_title, chain_breaks, years_searched,
       search_start_date, search_end_date, liens, defects, aol_draft, attorney_action_plan,
       client_report_draft, ai_spend_cents,
       property:properties(full_address, street, city, state, zip, county, parcel_id, legal_description)`,
    )
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const cap = Number(process.env.CLIROS_AI_SPEND_CAP_CENTS || AI_SPEND_CAP_CENTS_DEFAULT);
  const spent = Number((row as { ai_spend_cents?: number }).ai_spend_cents || 0);
  if (spent >= cap) {
    return NextResponse.json(
      { error: "This report has reached its assistant usage limit." },
      { status: 429 },
    );
  }

  const currentText = String((row as Record<string, unknown>)[target] || "");
  if (!currentText.trim()) {
    return NextResponse.json(
      { error: `There is no ${target === "aol_draft" ? "AOL" : "client report"} draft to edit yet.` },
      { status: 409 },
    );
  }

  const rawProp = (row as { property?: Record<string, unknown> | Record<string, unknown>[] }).property;
  const property = (Array.isArray(rawProp) ? rawProp[0] : rawProp) || {};
  const r = row as Record<string, unknown>;
  const p = property as Record<string, unknown>;
  const qaInput: ReportQaInput = {
    id: String(r.id),
    address: { fullAddress: String(p.full_address ?? ""), county: String(p.county ?? ""), state: String(p.state ?? "GA") },
    parcel: {
      parcelId: String(p.parcel_id ?? ""),
      county: String(p.county ?? ""),
      state: String(p.state ?? "GA"),
      legalDescription: String(p.legal_description ?? ""),
    },
    chain_of_title: r.chain_of_title as ReportQaInput["chain_of_title"] as never,
    liens: r.liens as ReportQaInput["liens"],
    defects: r.defects as ReportQaInput["defects"],
    aol_draft: r.aol_draft ? String(r.aol_draft) : undefined,
    attorney_action_plan: r.attorney_action_plan as ReportQaInput["attorney_action_plan"],
    client_report_draft: r.client_report_draft ? String(r.client_report_draft) : undefined,
    summary: r.summary ? String(r.summary) : undefined,
    riskScore: Number(r.risk_score) || 0,
  };

  const { system, messages } = buildDraftProposalPrompt({
    report: qaInput,
    targetLabel: TARGET_LABELS[target as Target],
    currentText,
    instruction,
  });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let resp;
  try {
    resp = await anthropic.messages.create({ model: MODEL, max_tokens: MAX_OUTPUT_TOKENS, system, messages });
  } catch (err) {
    console.error(`[propose-edit] Anthropic error for ${reportId}:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Assistant failed to propose. Try again." }, { status: 502 });
  }

  const raw = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  const parsed = parseProposalOutput(raw);
  const { proposed, rationale, malformed } = parsed;
  let flags = parsed.flags;

  // DETERMINISTIC PROVENANCE BACKSTOP. The prompt asks the model to flag any
  // attorney-supplied fact (a lender, an amount) that it inserts but that is not
  // in the index. The model does not always emit that flag — so we detect, in
  // code, dollar amounts that appear in the PROPOSED text but in neither the
  // CURRENT document nor the grounding dossier, and append an explicit
  // "not verified against the index" flag. This guarantees the attorney always
  // sees that a money figure in the proposal did not come from Cliros's search.
  const dossierBlob = `${currentText}\n${JSON.stringify(qaInput)}`;
  const dossierLower = dossierBlob.toLowerCase();
  const norm = (s: string) => s.replace(/[\s,]/g, "");

  // (a) Dollar amounts in the proposal absent from current+dossier.
  const dossierAmounts = new Set(
    [...dossierBlob.matchAll(/\$\s?[\d,]{2,}/g)].map((m) => norm(m[0])),
  );
  const newAmounts = [...new Set(
    [...proposed.matchAll(/\$\s?[\d,]{4,}/g)].map((m) => m[0].trim()),
  )].filter((a) => !dossierAmounts.has(norm(a)));

  // (b) Named entities in the proposal absent from current+dossier. Catches an
  // attorney-supplied lender / party / institution name (e.g. "Wells Fargo
  // Bank, N.A.") so its provenance is flagged with the same code guarantee as a
  // dollar amount — not left to the model. Two detectors, union'd:
  //   • institution suffix: "<Caps...> Bank|Mortgage|Trust|Financial|N.A.|LLC|..."
  //   • capitalized multi-word run (≥2 Title-Case tokens), to catch party names.
  // We deliberately over-flag (an extra "confirm this name" is cheap; a silently
  // unverified secured party on a signed AOL is not) but suppress all-UPPERCASE
  // runs (the AOL's own section headers / existing party names are upper-cased)
  // and anything already present in the dossier.
  const STOP = new Set([
    "attorney", "opinion", "letter", "fannie", "mae", "selling", "guide", "georgia",
    "schedule", "book", "page", "county", "real", "estate", "security", "deed",
    "title", "report", "cliros", "closing", "lender", "name", "address", "required",
    "before", "signature", "examination", "effective", "date", "the", "and",
  ]);
  const candidates = new Set<string>();
  for (const m of proposed.matchAll(/\b([A-Z][a-zA-Z.&]+(?:\s+[A-Z][a-zA-Z.&,]*){1,5})\b/g)) {
    const phrase = m[1].replace(/[,.]+$/, "").trim();
    const tokens = phrase.split(/\s+/);
    const meaningful = tokens.filter((t) => !STOP.has(t.toLowerCase().replace(/[.,&]/g, "")));
    if (meaningful.length < 2) continue;             // needs ≥2 non-stopword Title tokens
    if (dossierLower.includes(phrase.toLowerCase())) continue; // already in record
    const looksInstitution = /\b(bank|mortgage|trust|financial|savings|credit union|N\.?A\.?|LLC|L\.?P\.?|company|corp)\b/i.test(phrase);
    const titleCaseRun = meaningful.length >= 2;
    if (looksInstitution || titleCaseRun) candidates.add(phrase);
  }
  const newEntities = [...candidates].slice(0, 8);

  const alreadyFlaggedProvenance = flags.some((f) => /attorney-supplied|not verified/i.test(f));
  if ((newAmounts.length > 0 || newEntities.length > 0) && !alreadyFlaggedProvenance) {
    const parts: string[] = [];
    if (newAmounts.length) parts.push(newAmounts.join(", "));
    if (newEntities.length) parts.push(newEntities.join("; "));
    flags = [
      ...flags,
      `ATTORNEY-SUPPLIED (not verified against the index): ${parts.join(" · ")} — ` +
        `not found in Cliros's search results; confirm before signing.`,
    ];
  }

  // Meter spend onto the shared per-report ceiling (best-effort).
  const inTok = resp.usage?.input_tokens ?? 0;
  const outTok = resp.usage?.output_tokens ?? 0;
  const costCents = Math.ceil(
    ((inTok / 1_000_000) * INPUT_PRICE_PER_MTOK * 100 + (outTok / 1_000_000) * OUTPUT_PRICE_PER_MTOK * 100) * 100,
  ) / 100;
  try {
    await db.from("search_reports").update({ ai_spend_cents: spent + costCents }).eq("id", reportId);
  } catch {
    /* metering is best-effort */
  }

  return NextResponse.json({
    target,
    proposed,        // the COMPLETE proposed text — NOT yet saved
    rationale,
    flags,
    malformed,       // true if the model didn't follow the section format
    current: currentText, // echo so the UI can diff
    usage: { input_tokens: inTok, output_tokens: outTok, cost_cents: costCents },
  });
}
