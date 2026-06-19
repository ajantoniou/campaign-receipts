#!/usr/bin/env node
/* ─── Support Ticket AI Triage ───
   Runs every 5 minutes via Render cron. For each ticket with status='new':
     1. Loads context (user profile, latest report if attached)
     2. Calls Claude to classify + diagnose + suggest fix
     3. Writes ai_triage_response, ai_suggested_fix, category, status='triaged'
     4. Emails support@cliros.ai with the ticket + AI annotation

   Strict rule: AI never auto-replies to the user. Output is internal-only
   so Alex sees diagnosed tickets in his inbox ready to respond.
*/

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const MODEL = process.env.ANTHROPIC_FAST_MODEL || "claude-opus-4-7";
const SUPPORT_EMAIL = "support@cliros.ai";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface TicketRow {
  id: string;
  user_id: string;
  report_id: string | null;
  subject: string;
  body: string;
  page_context: string | null;
  attachment_paths: string[];
  created_at: string;
}

const TRIAGE_TOOL = {
  name: "emit_triage",
  description: "Classify and diagnose this support ticket.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        enum: ["bug", "feature", "question", "billing", "data_quality", "other"],
      },
      diagnosis: {
        type: "string",
        description: "Plain-English diagnosis of what the user is reporting and your best hypothesis of the root cause. 3-6 sentences.",
      },
      suggested_fix: {
        type: "string",
        description: "If this is a bug or data-quality issue and you can name the fix, describe it concretely (which file, which function, what change). For non-bugs, suggest a response framing or next step. Leave as 'n/a' if no fix applies.",
      },
      severity: {
        type: "string",
        enum: ["p0", "p1", "p2", "p3"],
        description: "p0 = blocking real-money flow, p1 = user-visible bug, p2 = quality issue, p3 = enhancement / question",
      },
    },
    required: ["category", "diagnosis", "suggested_fix", "severity"],
  },
};

const SYSTEM_PROMPT = `You are the Cliros engineering support triage AI. Cliros is an AI-powered title-search platform for Georgia closing attorneys. The codebase: Next.js 16 + Supabase + Claude AI + Playwright (GSCCCA browser agent) + CourtListener federal search + Stripe billing.

Common ticket patterns:
- Bug: search returns false positives, GSCCCA login issues, missing liens, PDF generation errors
- Data quality: railway companies in chain of title (FIXED — was keyword-name-search fallback), wrong parcel ID, lien duplicates
- Billing: paralegal can't enter card, free trial counter wrong, charge appears twice
- Question: "how do I bulk-upload addresses", "can I white-label", "what counties do you support"
- Feature: permits, AOL export to Word, multi-state expansion

Your job: classify the ticket, diagnose what's likely happening, and if it's a bug suggest a concrete code-level fix. NEVER write user-facing language — this is internal triage for the human engineer (Alex) to review. Be specific. Reference file paths when relevant (e.g. src/lib/agents/parcel.ts).`;

async function loadContext(db: ReturnType<typeof clirosDb>, ticket: TicketRow) {
  let userProfile: Record<string, unknown> | null = null;
  let report: Record<string, unknown> | null = null;
  try {
    const { data } = await db.from("users").select("name, email, role, state, bar_number").eq("id", ticket.user_id).single();
    userProfile = data;
  } catch { /* ignore */ }
  if (ticket.report_id) {
    try {
      const { data } = await db
        .from("search_reports")
        .select("id, summary, risk_score, status, pipeline_stage, last_error, properties(full_address, county)")
        .eq("id", ticket.report_id)
        .single();
      report = data;
    } catch { /* ignore */ }
  }
  return { userProfile, report };
}

function clirosDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );
}

async function emailViaInstantly(subject: string, body: string): Promise<void> {
  // We have instantly.ts already wired for cold email; reuse for transactional too.
  // For now log to stderr and rely on Render log forwarding. Wiring SES/Resend
  // is a separate piece; not blocking the triage loop.
  console.log(`[support-triage] → ${SUPPORT_EMAIL}\nSubject: ${subject}\n${body.slice(0, 4000)}`);
}

async function triageOne(db: ReturnType<typeof clirosDb>, ticket: TicketRow): Promise<void> {
  const ctx = await loadContext(db, ticket);
  const ctxBlock = JSON.stringify(
    {
      user: ctx.userProfile,
      report: ctx.report,
      page_context: ticket.page_context,
    },
    null,
    2
  );

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [TRIAGE_TOOL],
    tool_choice: { type: "tool", name: "emit_triage" },
    messages: [
      {
        role: "user",
        content:
          `Ticket subject: ${ticket.subject}\n\n` +
          `Ticket body:\n${ticket.body}\n\n` +
          `Context (user + linked report if any):\n${ctxBlock}\n\n` +
          `Classify and diagnose.`,
      },
    ],
  });

  const tu = resp.content.find((c: { type: string }) => c.type === "tool_use");
  if (!tu || tu.type !== "tool_use") {
    console.error(`[triage] no tool_use for ticket ${ticket.id}`);
    return;
  }
  const out = tu.input as {
    category: string;
    diagnosis: string;
    suggested_fix: string;
    severity: string;
  };

  await db
    .from("support_tickets")
    .update({
      status: "triaged",
      category: out.category,
      ai_triage_response: out.diagnosis,
      ai_suggested_fix: out.suggested_fix,
      triaged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);

  await emailViaInstantly(
    `[Cliros support: ${out.severity}/${out.category}] ${ticket.subject}`,
    `Ticket ID: ${ticket.id}\nUser: ${(ctx.userProfile?.email as string) || ticket.user_id}\nLinked report: ${ticket.report_id || "(none)"}\nPage: ${ticket.page_context || "(none)"}\n\n` +
      `=== User said ===\n${ticket.body}\n\n` +
      `=== AI diagnosis ===\n${out.diagnosis}\n\n` +
      `=== Suggested fix ===\n${out.suggested_fix}\n\n` +
      `Review in Supabase: cliros.support_tickets WHERE id='${ticket.id}'`
  );
}

async function main() {
  const db = clirosDb();
  const { data: tickets } = await db
    .from("support_tickets")
    .select("id, user_id, report_id, subject, body, page_context, attachment_paths, created_at")
    .eq("status", "new")
    .order("created_at", { ascending: true })
    .limit(20);

  if (!tickets || tickets.length === 0) {
    console.log("[support-triage] no new tickets");
    return;
  }

  console.log(`[support-triage] processing ${tickets.length} tickets`);
  for (const t of tickets) {
    try {
      await triageOne(db, t as TicketRow);
      console.log(`[support-triage] triaged ${t.id}`);
    } catch (err) {
      console.error(`[support-triage] failed ${t.id}:`, err);
    }
  }
}

main().catch((e) => {
  console.error("[support-triage] fatal:", e);
  process.exit(1);
});
