/* POST /api/reports/[id]/qa — grounded, read-only Q&A over ONE title report.
 *
 *  Wires the audit-gated report-qa prompt builder to Haiku. The assistant
 *  restates / locates / explains what the report ALREADY says and refuses to
 *  opine beyond it (UPL guard lives in SYSTEM_PROMPT). Strictly grounded on the
 *  single owned report's stored dossier — no other property, no web, no county
 *  document images (those aren't retrieved yet; v1 grounds on the index-derived
 *  chain/liens/defects + AOL + action plan).
 *
 *  Not yet linked from the report UI — reachable only by direct call until the
 *  adversarial UPL audit signs off (code-state gate, not an env flag).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import { buildReportQaPrompt, type ReportQaInput } from "@/lib/report-qa/prompt-builder";

export const dynamic = "force-dynamic";

// Canonical per the prompt-builder header; matches action-plan-narrative.ts.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 700;
const MAX_QUESTION_CHARS = 600;
// Haiku 4.5 pricing (per Anthropic): $1.00/MTok input, $5.00/MTok output.
const INPUT_PRICE_PER_MTOK = 1.0;
const OUTPUT_PRICE_PER_MTOK = 5.0;
// Per-report cumulative AI spend ceiling shared with the pipeline's ai_spend_cents.
const AI_SPEND_CAP_CENTS_DEFAULT = 250;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  let body: { question?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "Missing 'question'" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return NextResponse.json(
      { error: `Question too long (max ${MAX_QUESTION_CHARS} characters).` },
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

  // Ownership-scoped load — the user can only Q&A their own report.
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

  // Per-report spend ceiling — refuse cleanly rather than run up cost.
  const cap = Number(process.env.CLIROS_AI_SPEND_CAP_CENTS || AI_SPEND_CAP_CENTS_DEFAULT);
  const spent = Number((row as { ai_spend_cents?: number }).ai_spend_cents || 0);
  if (spent >= cap) {
    return NextResponse.json(
      { error: "This report has reached its assistant usage limit." },
      { status: 429 },
    );
  }

  const rawProp = (row as { property?: Record<string, unknown> | Record<string, unknown>[] }).property;
  const property = (Array.isArray(rawProp) ? rawProp[0] : rawProp) || {};

  // The prompt builder accepts a raw jsonb row OR a TitleSearchReport. Feed it
  // the row plus the joined property fields it expects under address/parcel.
  const r = row as Record<string, unknown>;
  const qaInput: ReportQaInput = {
    id: String(r.id),
    address: {
      fullAddress: String((property as Record<string, unknown>).full_address ?? ""),
      county: String((property as Record<string, unknown>).county ?? ""),
      state: String((property as Record<string, unknown>).state ?? "GA"),
    },
    parcel: {
      parcelId: String((property as Record<string, unknown>).parcel_id ?? ""),
      county: String((property as Record<string, unknown>).county ?? ""),
      state: String((property as Record<string, unknown>).state ?? "GA"),
      legalDescription: String((property as Record<string, unknown>).legal_description ?? ""),
    },
    chain_of_title: (r.chain_of_title as ReportQaInput["chain_of_title"]) as never,
    liens: r.liens as ReportQaInput["liens"],
    defects: r.defects as ReportQaInput["defects"],
    aol_draft: r.aol_draft ? String(r.aol_draft) : undefined,
    attorney_action_plan: r.attorney_action_plan as ReportQaInput["attorney_action_plan"],
    client_report_draft: r.client_report_draft ? String(r.client_report_draft) : undefined,
    summary: r.summary ? String(r.summary) : undefined,
    riskScore: Number(r.risk_score) || 0,
  };

  const { system, messages } = buildReportQaPrompt(qaInput, question);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let resp;
  try {
    resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
      messages,
    });
  } catch (err) {
    console.error(`[report-qa] Anthropic error for ${reportId}:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Assistant failed to answer. Try again." }, { status: 502 });
  }

  const answer = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Meter the spend onto the report's shared ai_spend_cents ceiling.
  const inTok = resp.usage?.input_tokens ?? 0;
  const outTok = resp.usage?.output_tokens ?? 0;
  const costCents =
    (inTok / 1_000_000) * INPUT_PRICE_PER_MTOK * 100 +
    (outTok / 1_000_000) * OUTPUT_PRICE_PER_MTOK * 100;
  const costCentsRounded = Math.ceil(costCents * 100) / 100;
  try {
    await db
      .from("search_reports")
      .update({ ai_spend_cents: spent + costCentsRounded })
      .eq("id", reportId);
  } catch {
    // Metering is best-effort; never fail the answer on a metering write.
  }

  return NextResponse.json({
    answer,
    usage: { input_tokens: inTok, output_tokens: outTok, cost_cents: costCentsRounded },
  });
}
