/* ─── Cliros deed-image fetch panel — 2026-05-24 ───
   Run 6 personas + orchestrator on the deed-image fetch decision.
   See the research summary embedded below for context.

   Usage (from app/):
     export $(grep -E '^(ANTHROPIC_API_KEY|ANTHROPIC_FAST_MODEL)=' .env.local | xargs)
     npx tsx scripts/run_deed_image_panel_2026_05_24.ts
*/

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { runBacklogPanelReview } from "../src/lib/pipeline/panel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });
dotenv.config({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

const BRIEF = `
Cliros — GA title-search SaaS for closing attorneys. Live on cliros.ai.
5 founding-attorney cold emails just went out (Nick Schnyder, Sarah White,
Eric Sterling, David Bell, Humberto Izquierdo). 20 free credits each.

═══ DECISION TO MAKE ═══

Should Cliros auto-fetch deed-image PDFs from GSCCCA, and if so, HOW?

Current state: our pipeline pulls the GSCCCA name-index JSON (book/page,
parties, dates) for every recorded instrument. Attorneys can download
those JSON files from the dashboard. They CANNOT see the actual deed PDF
images — those sit one layer deeper in GSCCCA's HTML5 viewer.

═══ RESEARCH SUMMARY (just completed, 2026-05-24) ═══

1. NO PUBLIC OSS solution for GSCCCA deed imaging exists. We'd be first.

2. GSCCCA ToS EXPLICITLY PROHIBITS automated access ("legal action will
   be taken" language). Pricing: $14.95-29.95/mo subscriber + $0.50/page
   for printing/downloading.

3. The imaging viewer URL is
   search.gsccca.org/Imaging/HTML5Viewer.aspx?id=<imageId>&key=<key>
   — session-cookie + referer + per-image key required. Backend file
   format is TIF; PDFs are rendered on demand.

4. RANKED OPTIONS:

   A. USER-CREDENTIAL PLAYWRIGHT BOT (eng=med, cost=$14.95/mo per
      attorney + $0.50/page, legal=Low-Med, ship=1-2 weeks)
      — Attorney provides their OWN GSCCCA login. We drive their session
        via Playwright to fetch + cache the deed PDFs they request.
      — "Plaid model": user authorizes their session, we automate it.
      — Materially safer than scraping with our own account.
      — Each closing attorney already has a GSCCCA account (license
        requirement to practice GA real estate law).

   B. SHARED-BOT SCRAPING WITH OUR GSCCCA ACCOUNT (eng=med, cost=cheap,
      legal=HIGH, ship=1 week)
      — Direct ToS violation. Account termination + CFAA-adjacent risk
        under O.C.G.A. § 16-9-93.
      — Currently how the orchestrator does name-search index pulls.
        Already in the grey zone; image fetch would be much more visible
        and per-page-charged.

   C. DATATREE API LICENSE (eng=low, cost=$5-25K/yr min + per-image,
      legal=Low, ship=4-8 weeks sales cycle)
      — First American's data product. JSON API. 7B+ recorded-doc
        images including GA.
      — Enterprise contract; "call for pricing." Cheapest doc-image
        plans typically $0.30-1.50 per image at volume.
      — Removes ALL GSCCCA legal risk. Removes our dependency on
        attorneys having GSCCCA subscriptions.

   D. HYBRID: DataTree primary, user-credential GSCCCA fallback
      (eng=med-high, cost=both, legal=low, ship=6-10 weeks)

   E. NEGOTIATE GSCCCA BULK-DATA LICENSE DIRECTLY (eng=low operational,
      cost=5-figure annual + per-image, legal=lowest, ship=2-4 months)

═══ ACCEPTED CONSTRAINTS ═══

- $500 hard-cap per company in beta (portfolio rule). DataTree minimum
  contract violates this until we have paying customers.
- Founding-attorney cohort is FREE for 3 months. No revenue covering
  image-fetch cost during the beta.
- Beta mode = free reports = we're spending our own money on every
  image fetched.

═══ QUESTIONS FOR THE PANEL ═══

1. Which option is the right v1 for the founding-attorney beta?
2. The orchestrator already scrapes the GSCCCA name index without
   attorney credentials. Should we audit/change that posture before
   adding image fetch, or do they get evaluated separately?
3. Is "user-authorized Playwright" actually defensible legal posture or
   self-deception? Cite specific framing if so.
4. For each shipped report, target deed-image count: just the vesting
   WD? Vesting WD + active SDs (1-4 docs)? Full chain (~10 docs)? Cost
   trade-off matters because we eat it during the free beta.
5. What's the FIRST thing to ship in this area? The right "minimum
   lovable product" for image access?
`;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY required in .env.local or monorepo .env");
    process.exit(1);
  }

  console.log("[deed-image-panel] running 6 personas + orchestrator…");
  const result = await runBacklogPanelReview(BRIEF);

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.join(__dirname, "..", "..", `PANEL_DEED_IMAGE_${today}.md`);
  const lines: string[] = [
    `# Cliros deed-image fetch panel — ${today}`,
    "",
    "Decision: how (and whether) to auto-fetch deed PDFs from GSCCCA.",
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
      `| ${r.persona} | ${r.verdict} | ${r.severity} | ${top.slice(0, 3).join("; ") || r.notes.slice(0, 80)} |`,
    );
    if (r.blockingIssues.length) {
      lines.push("", `### ${r.persona} blocking`, ...r.blockingIssues.map((b) => `- ${b}`), "");
    }
    if (r.notes && r.notes.length > 80) {
      lines.push("", `### ${r.persona} notes`, r.notes, "");
    }
  }

  const totalCents = result.reviews.reduce((s, r) => s + r.costCents, 0);
  lines.push("", `*Estimated API cost: ~$${(totalCents / 100).toFixed(2)}*`);

  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`[deed-image-panel] wrote ${outPath}`);
  console.log(`verdict=${result.orchestratorVerdict} confidence=${result.shipConfidencePct}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
