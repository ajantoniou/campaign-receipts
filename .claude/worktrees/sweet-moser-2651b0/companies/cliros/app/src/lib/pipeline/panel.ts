/* ─── Expert Panel Review ───
   Runs each completed search through 6 persona reviewers in parallel, then
   1 orchestrator that synthesizes the consensus. Records each review in
   cliros.report_qa_reviews and emits the final ship/fix/kill verdict back
   to the pipeline.

   Personas live as Markdown files at companies/cliros/personas/ — read once
   at module load (cached in-process).

   Cost: ~$0.07/persona call (Opus 4.7 with short prompt + small report
   payload), ~$0.50 per report all-in.
*/

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const MODEL = process.env.ANTHROPIC_FAST_MODEL || "claude-opus-4-7";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Persona registry ── */

const PERSONAS_DIR = path.resolve(
  process.cwd(),
  "..", // app -> cliros
  "personas"
);

interface PersonaConfig {
  key: string;
  file: string;
  shortName: string;
}

const PERSONA_CONFIGS: PersonaConfig[] = [
  { key: "attorney", file: "re-attorney.md", shortName: "David Harrington (closing attorney)" },
  { key: "title_co", file: "title-company-owner.md", shortName: "Barb Kowalski (title co owner)" },
  { key: "compliance", file: "compliance-counsel.md", shortName: "Compliance counsel" },
  { key: "design", file: "design-lead.md", shortName: "Design lead" },
  { key: "growth", file: "saas-growth-lead.md", shortName: "Growth lead" },
  { key: "vc", file: "legal-tech-vc.md", shortName: "Priya Krishnamurthy (legal-tech VC)" },
];

let _personaCache: Map<string, string> | null = null;
function loadPersonas(): Map<string, string> {
  if (_personaCache) return _personaCache;
  const map = new Map<string, string>();
  for (const cfg of PERSONA_CONFIGS) {
    try {
      const text = fs.readFileSync(path.join(PERSONAS_DIR, cfg.file), "utf-8");
      map.set(cfg.key, text);
    } catch (e) {
      console.warn(`[panel] could not read persona ${cfg.file}:`, e);
    }
  }
  _personaCache = map;
  return map;
}

/* ── Types ── */

export interface PersonaReview {
  persona: string;
  verdict: "ship" | "fix" | "kill" | "review";
  severity: number;            // 0-100
  blockingIssues: string[];
  notes: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costCents: number;
}

export interface PanelResult {
  reviews: PersonaReview[];
  orchestratorVerdict: "ship" | "fix" | "kill";
  shipConfidencePct: number;
  orchestratorBlockingIssues: string[];
}

/* ── Tool schema ── */

const REVIEW_TOOL = {
  name: "emit_review",
  description: "Emit your verdict on the title-search report you just examined.",
  input_schema: {
    type: "object" as const,
    properties: {
      verdict: {
        type: "string",
        enum: ["ship", "fix", "kill"],
        description: "ship = deliverable as-is; fix = deliver with attention banner; kill = hold report, manual review required.",
      },
      severity: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "Severity of issues found, 0 (none) to 100 (catastrophic).",
      },
      blocking_issues: {
        type: "array",
        items: { type: "string" },
        description: "List the specific issues that, if present, must be addressed before this report leaves the building. Empty array if ship-ready.",
      },
      notes: {
        type: "string",
        description: "1–3 sentence summary of your reasoning in your own voice.",
      },
    },
    required: ["verdict", "severity", "blocking_issues", "notes"],
  },
};

/* ── Single persona review call ── */

async function runPersona(personaKey: string, personaText: string, reportPayload: string): Promise<PersonaReview> {
  const cfg = PERSONA_CONFIGS.find((c) => c.key === personaKey)!;
  const systemPrompt =
    personaText +
    "\n\n---\n\nYou are reviewing a title-search report Cliros just produced for a Georgia closing attorney. " +
    "Apply YOUR domain lens (don't shift personas mid-review). Be concise. Emit your verdict via the emit_review tool. " +
    "ship = quality is good enough to put my name on. " +
    "fix = deliverable but attorney must see specific issues before sending to lender. " +
    "kill = quality is unacceptable; this report must not be released as-is.";

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [REVIEW_TOOL],
    tool_choice: { type: "tool", name: "emit_review" },
    messages: [
      {
        role: "user",
        content: `Here is the report payload to review:\n\n${reportPayload}\n\nEmit your verdict now.`,
      },
    ],
  });

  // Find the tool_use block
  const toolUse = resp.content.find((c: { type: string }) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`[panel:${personaKey}] no tool_use in response`);
  }
  const input = toolUse.input as {
    verdict: "ship" | "fix" | "kill";
    severity: number;
    blocking_issues: string[];
    notes: string;
  };

  const inTok = resp.usage?.input_tokens || 0;
  const outTok = resp.usage?.output_tokens || 0;
  // Opus 4.7 pricing (May 2026): $15/M input, $75/M output
  const costCents = Math.round(((inTok / 1_000_000) * 15 + (outTok / 1_000_000) * 75) * 100);

  return {
    persona: personaKey,
    verdict: input.verdict,
    severity: Math.max(0, Math.min(100, input.severity)),
    blockingIssues: input.blocking_issues || [],
    notes: input.notes || "",
    model: MODEL,
    promptTokens: inTok,
    completionTokens: outTok,
    costCents,
  };
}

/* ── Orchestrator: synthesize all 6 reviews into one final verdict ── */

const ORCHESTRATOR_TOOL = {
  name: "emit_consensus",
  description: "Synthesize the 6 persona reviews into a final verdict.",
  input_schema: {
    type: "object" as const,
    properties: {
      verdict: {
        type: "string",
        enum: ["ship", "fix", "kill"],
        description: "Final verdict, taking the worst case but not over-weighting any single persona.",
      },
      ship_confidence_pct: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "0–100 confidence that this report is safe to deliver as-is.",
      },
      blocking_issues: {
        type: "array",
        items: { type: "string" },
        description: "Deduplicated, prioritized list of the most important blocking issues. Empty if ship-ready.",
      },
    },
    required: ["verdict", "ship_confidence_pct", "blocking_issues"],
  },
};

async function runOrchestrator(reviews: PersonaReview[]): Promise<{
  verdict: "ship" | "fix" | "kill";
  shipConfidencePct: number;
  blockingIssues: string[];
  promptTokens: number;
  completionTokens: number;
  costCents: number;
}> {
  const reviewSummary = reviews
    .map(
      (r) =>
        `### ${r.persona} → verdict=${r.verdict} severity=${r.severity}\n` +
        `Notes: ${r.notes}\n` +
        `Blocking issues: ${r.blockingIssues.length === 0 ? "(none)" : r.blockingIssues.map((i) => `• ${i}`).join(" ")}`
    )
    .join("\n\n");

  const systemPrompt =
    "You are the Cliros quality orchestrator. Six domain experts just reviewed a title-search report. " +
    "Synthesize their reviews into a final verdict. Rules:\n" +
    "1. Only the three LEGAL personas (attorney, title_co, compliance) can force a 'kill'. " +
    "If any of them returns 'kill' with severity ≥80, the verdict is 'kill'.\n" +
    "2. A 'kill' from a NON-legal persona (design, growth, vc) does NOT kill the report — " +
    "treat it as at most 'fix' (the attorney reviews and decides). Non-legal lenses cannot block a legally-sound report.\n" +
    "3. If ≥3 personas return 'fix' OR 'kill', the verdict is at least 'fix'.\n" +
    "4. Otherwise, prefer 'ship' but only if no LEGAL persona flagged critical blocking issues.\n" +
    "5. Deduplicate blocking issues across personas. Keep the top 5 most important.\n" +
    "6. ship_confidence_pct: 100 = unanimous ship. 0 = unanimous kill. Use your judgement in between.";

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [ORCHESTRATOR_TOOL],
    tool_choice: { type: "tool", name: "emit_consensus" },
    messages: [
      {
        role: "user",
        content: `Persona reviews:\n\n${reviewSummary}\n\nEmit your consensus verdict.`,
      },
    ],
  });

  const toolUse = resp.content.find((c: { type: string }) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`[panel:orchestrator] no tool_use in response`);
  }
  const input = toolUse.input as {
    verdict: "ship" | "fix" | "kill";
    ship_confidence_pct: number;
    blocking_issues: string[];
  };

  const inTok = resp.usage?.input_tokens || 0;
  const outTok = resp.usage?.output_tokens || 0;
  const costCents = Math.round(((inTok / 1_000_000) * 15 + (outTok / 1_000_000) * 75) * 100);

  return {
    verdict: input.verdict,
    shipConfidencePct: Math.max(0, Math.min(100, input.ship_confidence_pct)),
    blockingIssues: input.blocking_issues || [],
    promptTokens: inTok,
    completionTokens: outTok,
    costCents,
  };
}

/* ── Public entry point ── */

/**
 * Run the full 6-persona panel + orchestrator on a report.
 * `reportPayload` should be a serialized JSON or markdown summary of the
 * report — keep it under ~5K tokens for cost control.
 */
export async function runPanelReview(
  reportPayload: unknown
): Promise<PanelResult> {
  const personas = loadPersonas();
  const payload =
    typeof reportPayload === "string"
      ? reportPayload
      : JSON.stringify(reportPayload, null, 2);

  // Truncate report payload aggressively if huge — protects token budget
  const MAX = 20_000; // chars (~5K tokens)
  const trimmedPayload = payload.length > MAX ? payload.slice(0, MAX) + "\n\n[... truncated ...]" : payload;

  // 1. Run all 6 personas in parallel
  const personaPromises = PERSONA_CONFIGS.map((cfg) => {
    const text = personas.get(cfg.key);
    if (!text) {
      return Promise.resolve<PersonaReview>({
        persona: cfg.key,
        verdict: "review",
        severity: 0,
        blockingIssues: [`Persona file ${cfg.file} not found`],
        notes: "",
        model: MODEL,
        promptTokens: 0,
        completionTokens: 0,
        costCents: 0,
      });
    }
    return runPersona(cfg.key, text, trimmedPayload).catch((err) => {
      console.error(`[panel] persona ${cfg.key} failed:`, err);
      return {
        persona: cfg.key,
        verdict: "review" as const,
        severity: 0,
        blockingIssues: [`Persona call failed: ${err instanceof Error ? err.message : String(err)}`],
        notes: "",
        model: MODEL,
        promptTokens: 0,
        completionTokens: 0,
        costCents: 0,
      };
    });
  });

  const reviews = await Promise.all(personaPromises);

  // 2. Run orchestrator on the synthesized reviews
  let orchestrator;
  try {
    orchestrator = await runOrchestrator(reviews);
  } catch (err) {
    console.error("[panel] orchestrator failed:", err);
    // Fallback: pick worst verdict from personas
    const worst = reviews.reduce<"ship" | "fix" | "kill">((acc, r) => {
      if (r.verdict === "kill" || acc === "kill") return "kill";
      if (r.verdict === "fix" || acc === "fix") return "fix";
      return "ship";
    }, "ship");
    orchestrator = {
      verdict: worst,
      shipConfidencePct: worst === "ship" ? 50 : worst === "fix" ? 25 : 0,
      blockingIssues: [...new Set(reviews.flatMap((r) => r.blockingIssues))].slice(0, 5),
      promptTokens: 0,
      completionTokens: 0,
      costCents: 0,
    };
  }

  // Save the orchestrator as a 7th review row so it's visible alongside the personas.
  reviews.push({
    persona: "orchestrator",
    verdict: orchestrator.verdict,
    severity: 100 - orchestrator.shipConfidencePct,
    blockingIssues: orchestrator.blockingIssues,
    notes: `Synthesis of 6 reviews. Ship confidence: ${orchestrator.shipConfidencePct}%`,
    model: MODEL,
    promptTokens: orchestrator.promptTokens,
    completionTokens: orchestrator.completionTokens,
    costCents: orchestrator.costCents,
  });

  return {
    reviews,
    orchestratorVerdict: orchestrator.verdict,
    shipConfidencePct: orchestrator.shipConfidencePct,
    orchestratorBlockingIssues: orchestrator.blockingIssues,
  };
}

/* ── Backlog panel (product go-live, not report QA) ── */

const BACKLOG_REVIEW_TOOL = {
  name: "emit_backlog_review",
  description: "Emit go-live readiness verdict and ranked backlog priorities.",
  input_schema: {
    type: "object" as const,
    properties: {
      verdict: {
        type: "string",
        enum: ["ship", "fix", "kill"],
        description: "ship = safe to acquire paying customers now; fix = ship after listed items; kill = not ready.",
      },
      severity: { type: "integer", minimum: 0, maximum: 100 },
      top_backlog_items: {
        type: "array",
        items: { type: "string" },
        description: "Top 3 backlog items for Cliros engineering, ranked.",
      },
      blocking_issues: {
        type: "array",
        items: { type: "string" },
        description: "What blocks first paying customer or E&O-safe delivery.",
      },
      notes: { type: "string" },
    },
    required: ["verdict", "severity", "top_backlog_items", "blocking_issues", "notes"],
  },
};

async function runBacklogPersona(
  personaKey: string,
  personaText: string,
  backlogPayload: string
): Promise<PersonaReview & { topBacklogItems: string[] }> {
  const systemPrompt =
    personaText +
    "\n\n---\n\nYou are advising Cliros founders on PRODUCT BACKLOG priority before first paying customers. " +
    "You are NOT reviewing a title report. Review the backlog brief and emit emit_backlog_review. " +
    "verdict: ship = take money now; fix = fix top items first; kill = stop outbound sales.";

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [BACKLOG_REVIEW_TOOL],
    tool_choice: { type: "tool", name: "emit_backlog_review" },
    messages: [
      {
        role: "user",
        content: `Backlog brief:\n\n${backlogPayload}\n\nEmit your backlog review.`,
      },
    ],
  });

  const toolUse = resp.content.find((c: { type: string }) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`[backlog-panel:${personaKey}] no tool_use`);
  }
  const input = toolUse.input as {
    verdict: "ship" | "fix" | "kill";
    severity: number;
    top_backlog_items: string[];
    blocking_issues: string[];
    notes: string;
  };

  const inTok = resp.usage?.input_tokens || 0;
  const outTok = resp.usage?.output_tokens || 0;
  const costCents = Math.round(((inTok / 1_000_000) * 15 + (outTok / 1_000_000) * 75) * 100);

  return {
    persona: personaKey,
    verdict: input.verdict,
    severity: Math.max(0, Math.min(100, input.severity)),
    blockingIssues: input.blocking_issues || [],
    notes: input.notes || "",
    topBacklogItems: input.top_backlog_items || [],
    model: MODEL,
    promptTokens: inTok,
    completionTokens: outTok,
    costCents,
  };
}

export interface BacklogPanelResult extends PanelResult {
  backlogByPersona: Record<string, string[]>;
}

export async function runBacklogPanelReview(backlogPayload: unknown): Promise<BacklogPanelResult> {
  const personas = loadPersonas();
  const payload =
    typeof backlogPayload === "string"
      ? backlogPayload
      : JSON.stringify(backlogPayload, null, 2);
  const trimmed = payload.length > 20_000 ? payload.slice(0, 20_000) + "\n\n[... truncated ...]" : payload;

  const reviews = await Promise.all(
    PERSONA_CONFIGS.map((cfg) => {
      const text = personas.get(cfg.key);
      if (!text) {
        return Promise.resolve({
          persona: cfg.key,
          verdict: "review" as const,
          severity: 0,
          blockingIssues: [`Persona file ${cfg.file} not found`],
          notes: "",
          topBacklogItems: [] as string[],
          model: MODEL,
          promptTokens: 0,
          completionTokens: 0,
          costCents: 0,
        });
      }
      return runBacklogPersona(cfg.key, text, trimmed).catch((err) => ({
        persona: cfg.key,
        verdict: "review" as const,
        severity: 0,
        blockingIssues: [`Call failed: ${err instanceof Error ? err.message : String(err)}`],
        notes: "",
        topBacklogItems: [] as string[],
        model: MODEL,
        promptTokens: 0,
        completionTokens: 0,
        costCents: 0,
      }));
    })
  );

  const personaOnly = reviews.map(({ topBacklogItems: _, ...r }) => r);
  const orchestrator = await runOrchestrator(personaOnly);
  personaOnly.push({
    persona: "orchestrator",
    verdict: orchestrator.verdict,
    severity: 100 - orchestrator.shipConfidencePct,
    blockingIssues: orchestrator.blockingIssues,
    notes: `Backlog synthesis. Ship confidence: ${orchestrator.shipConfidencePct}%`,
    model: MODEL,
    promptTokens: orchestrator.promptTokens,
    completionTokens: orchestrator.completionTokens,
    costCents: orchestrator.costCents,
  });

  const backlogByPersona: Record<string, string[]> = {};
  for (const r of reviews) {
    if (r.topBacklogItems?.length) backlogByPersona[r.persona] = r.topBacklogItems;
  }

  return {
    reviews: personaOnly,
    orchestratorVerdict: orchestrator.verdict,
    shipConfidencePct: orchestrator.shipConfidencePct,
    orchestratorBlockingIssues: orchestrator.blockingIssues,
    backlogByPersona,
  };
}
