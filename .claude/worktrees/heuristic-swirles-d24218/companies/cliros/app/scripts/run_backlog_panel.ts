/* ─── Cliros backlog panel ───
   Runs 6 personas + orchestrator on HANDOFF pending work (not a title report).
   Usage (from app/):
     export $(grep -E '^(ANTHROPIC_API_KEY|ANTHROPIC_FAST_MODEL)=' .env.local | xargs)
     npx tsx scripts/run_backlog_panel.ts
*/

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { runBacklogPanelReview } from "../src/lib/pipeline/panel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const BACKLOG_BRIEF = `
Cliros GA title-search SaaS — live on Render (cliros.ai). Lemon Squeezy billing (1/5/25 packs).
Pending backlog from HANDOFF 2026-05-21:

P0 candidates:
- Verify first paying customer E2E (LS checkout → webhook → reports_remaining → queue report → decrement)
- Enable RLS on cliros.report_documents

P1 candidates:
- GSCCCA parseDeedResults: merge grantor/grantee index rows (fix grantor=grantee self-deeds)
- Re-run EIKHOFF demo report until panel ship

P2 candidates:
- Welcome video (currently missing report detail in walkthrough)
- Homepage hero CTA for alex@cliros.ai + support@cliros.ai
- Harrington firm-profile Settings UI (E&O, IOLTA, logo, multi-attorney) — API exists
- Landing page sample PDF embed

Known EIKHOFF panel: orchestrator fix @ 15% ship confidence — parser/lien pairing.

Parked: Stripe, multi-state, Spanish, white-label, MarketCheck.

Question: What should engineering do FIRST before taking money from attorneys?
`;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY required in .env.local");
    process.exit(1);
  }

  console.log("[backlog-panel] running 6 personas + orchestrator…");
  const result = await runBacklogPanelReview(BACKLOG_BRIEF);

  const outPath = path.join(__dirname, "..", "..", "BACKLOG_PANEL_2026-05-21.md");
  const lines: string[] = [
    "# Cliros backlog panel — 2026-05-21",
    "",
    `**Orchestrator verdict:** \`${result.orchestratorVerdict}\` · ship confidence **${result.shipConfidencePct}%**`,
    "",
    "## Orchestrator blocking issues",
    ...result.orchestratorBlockingIssues.map((i) => `- ${i}`),
    "",
    "## Per persona",
    "| Persona | Verdict | Severity | Top 3 backlog |",
    "|---------|---------|----------|---------------|",
  ];

  for (const r of result.reviews) {
    if (r.persona === "orchestrator") continue;
    const top = result.backlogByPersona[r.persona] || [];
    lines.push(
      `| ${r.persona} | ${r.verdict} | ${r.severity} | ${top.slice(0, 3).join("; ") || r.notes.slice(0, 80)} |`
    );
    if (r.blockingIssues.length) {
      lines.push("", `### ${r.persona} blocking`, ...r.blockingIssues.map((b) => `- ${b}`), "");
    }
  }

  const totalCents = result.reviews.reduce((s, r) => s + r.costCents, 0);
  lines.push("", `*Estimated API cost: ~$${(totalCents / 100).toFixed(2)}*`);

  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`[backlog-panel] wrote ${outPath}`);
  console.log(`verdict=${result.orchestratorVerdict} confidence=${result.shipConfidencePct}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
