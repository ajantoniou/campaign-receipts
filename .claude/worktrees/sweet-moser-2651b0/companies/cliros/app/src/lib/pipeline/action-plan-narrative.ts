/* ─── Action-plan LLM narrative composer ───
   The deterministic clustering pass (attorney-action-plan.ts) turns 600+
   raw lien rows into ~15 visible items grouped by lender. This helper
   adds ONE paragraph of plain-English narrative on top: "Cliros already
   handled X automatically; here's what you still need to do, in priority
   order." Helps the attorney scan the checklist in 10 seconds.

   Constraints:
     - Haiku 4.5 — cheap + fast (target <2¢ per report).
     - Budget cap: NARRATIVE_BUDGET_CENTS env, default 5¢. If the persona
       pipeline already burned through CLIROS_AI_SPEND_CAP_CENTS, skip.
     - Falls back to a deterministic 1-line summary on any LLM failure.
*/

import Anthropic from "@anthropic-ai/sdk";
import type { AttorneyActionPlan } from "../attorney-action-plan";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_INPUT_TOKENS_APPROX = 4_000;
const MAX_OUTPUT_TOKENS = 400;
const BUDGET_CENTS_DEFAULT = 5;
// Haiku 4.5: $1.00/MTok input, $5.00/MTok output (per Anthropic pricing).
const INPUT_PRICE_PER_MTOK = 1.0;
const OUTPUT_PRICE_PER_MTOK = 5.0;

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function deterministicFallback(plan: AttorneyActionPlan, address: string): string {
  const s = plan.summary;
  const autoLine = (s.autoResolvedReleased ?? 0) > 0
    ? `Cliros auto-resolved ${s.autoResolvedReleased} released liens for you (paired SDs cancelled in the index). `
    : "";
  const critLine = s.critical > 0
    ? `${s.critical} critical item${s.critical === 1 ? "" : "s"} need attention before closing`
    : s.major > 0
      ? `${s.major} major item${s.major === 1 ? "" : "s"} to verify before closing`
      : "no critical or major items flagged";
  return `${address}: ${autoLine}${critLine}. Estimated curative window: ${s.estDaysCurative} days.`;
}

interface NarrativeResult {
  text: string;
  costCents: number;
  source: "llm" | "deterministic";
  /** True when LLM call was attempted (success or fail). */
  attempted: boolean;
}

/**
 * Compose a 1-paragraph attorney-facing narrative on top of the clustered
 * action plan. NEVER throws — caller can render `result.text` blindly.
 *
 * @param plan - already-clustered AttorneyActionPlan from buildAttorneyActionPlan
 * @param address - property full address for context
 * @param remainingBudgetCents - how much AI budget is left on this report
 */
export async function composeActionPlanNarrative(
  plan: AttorneyActionPlan,
  address: string,
  remainingBudgetCents: number,
): Promise<NarrativeResult> {
  const budgetCap = Number(process.env.CLIROS_NARRATIVE_BUDGET_CENTS || BUDGET_CENTS_DEFAULT);
  const fallbackText = deterministicFallback(plan, address);

  if (remainingBudgetCents < budgetCap) {
    return { text: fallbackText, costCents: 0, source: "deterministic", attempted: false };
  }
  const anthropic = client();
  if (!anthropic) {
    return { text: fallbackText, costCents: 0, source: "deterministic", attempted: false };
  }

  // Top 8 items only — keeps input tokens tiny and the narrative focused.
  const topItems = plan.items.slice(0, 8).map((i) => ({
    priority: i.priority,
    type: i.actionType,
    title: i.title,
    description: i.description.slice(0, 200),
    responsibleParty: i.responsibleParty,
  }));

  const prompt = `You are writing ONE paragraph (3-5 sentences max) of plain-English narrative for a Georgia closing attorney reviewing a Cliros title search report.

Property: ${address}

Cliros already did this work automatically:
- Auto-resolved ${plan.summary.autoResolvedReleased ?? 0} released liens (paired with recorded cancellations in the GSCCCA index — no attorney action needed).
- Clustered ${plan.summary.activeLienCount ?? 0} active lien records into ${plan.summary.lenderClusterCount ?? 0} lender groups (one consolidated payoff letter per lender, not per recorded SD).

Top items remaining for the attorney to handle:
${topItems.map((i, n) => `${n + 1}. [${i.priority.toUpperCase()}] ${i.title} — ${i.description} (responsible: ${i.responsibleParty})`).join("\n")}

Total: ${plan.summary.total} clustered items (${plan.summary.critical} critical, ${plan.summary.major} major, ${plan.summary.minor} minor). Estimated curative window: ${plan.summary.estDaysCurative} days.

Write the paragraph for the attorney. Open with what Cliros already handled (give them the credit so they know the system did real work). Then say what they need to do in priority order. End with the time estimate. No bullet points — just flowing prose. Don't use marketing language or fluff. Don't repeat the address. Don't sign it.`;

  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();
    if (!text) {
      return { text: fallbackText, costCents: 0, source: "deterministic", attempted: true };
    }
    const usage = resp.usage;
    const costCents = Math.ceil(
      ((usage.input_tokens / 1_000_000) * INPUT_PRICE_PER_MTOK +
        (usage.output_tokens / 1_000_000) * OUTPUT_PRICE_PER_MTOK) *
        100,
    );
    return { text, costCents, source: "llm", attempted: true };
  } catch (err) {
    console.warn("[action-plan-narrative] LLM call failed, falling back:", err instanceof Error ? err.message : err);
    return { text: fallbackText, costCents: 0, source: "deterministic", attempted: true };
  }
}

// Re-export for type discovery
export type { NarrativeResult };
// Re-export for tests
export const _internal = { deterministicFallback, MAX_INPUT_TOKENS_APPROX };
