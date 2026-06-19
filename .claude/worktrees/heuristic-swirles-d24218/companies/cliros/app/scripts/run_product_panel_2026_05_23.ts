/* ─── Cliros product panel — 2026-05-23 ───
   Re-runs the 6-persona panel against today's state (post-launch hardening
   sprint) to answer: are we ready to mail the 804 prospects in
   cliros.prospects, or what's still in the way?

   Usage (from app/):
     export $(grep -E '^(ANTHROPIC_API_KEY|ANTHROPIC_FAST_MODEL)=' .env.local | xargs)
     npx tsx scripts/run_product_panel_2026_05_23.ts
*/

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { runBacklogPanelReview } from "../src/lib/pipeline/panel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

const BRIEF = `
Cliros — GA real estate title-search SaaS for closing attorneys.
Live: https://cliros.ai · Render auto-deploy from main · Lemon Squeezy billing.
Pricing: 1 report = $250, 5 = $1,100, 25 = $5,000. Beta mode currently FREE for everyone.

═══ State as of 2026-05-23 (post launch-hardening sprint) ═══

Signups today: 1 (the founder). 804 prospects loaded in cliros.prospects, 0 emails sent.

PIPELINE (Render cron every 1 min, atomic claim, 3-attempt retry):
  queued → searching → permits → panel_review → chain_analysis → lien_analysis
       → defect_review → aol_lock → drafting → ready → delivered
       (any stage can route to 'blocked' on kill)

SHIPPED IN THIS SPRINT (all on main, deployed):

1. RAW SOURCE VAULT — every report run uploads structured JSON snapshots
   of the GSCCCA name-index hits (deeds, liens, UCC, PT-61), federal-court
   pulls (CourtListener / PACER), and the county-GIS parcel anchor into the
   report-documents bucket under deeds/, liens/, court_records/, other/.
   /sources JSON endpoint now surfaces a rawSourceArtifacts array.

2. PARCEL-SCOPED DEED FILTER — drops GSCCCA name-index hits whose
   subdivision/lot/block disagree with the county GIS anchor, when both
   sides have legal-description data. Doesn't fire when parcel has no
   subdiv data (most older Atlanta lots).

3. PT-61 ADDRESS SEARCH ALWAYS RUNS — previously skipped when external
   owner names were provided. PT-61 is the GA Real Estate Transfer Tax
   index, keyed by ADDRESS, returns the most recent SALE with the PRIOR
   OWNER's surname. That surname is what the vesting deed is indexed
   under. Without this fix the orchestrator was missing vesting deeds for
   long-tenured owners with many refinancings.

4. LENDER CLUSTERING (attorney action plan) — previously emitted one
   "obtain release" item per active lien. A founder report had 727 active
   liens across only 4 distinct creditors — 636 visible checklist items,
   useless. Now: cluster by normalized creditor name → one verify_release
   per lender with consolidated payoff letter covering up to 5 book/pages.
   Tax liens: 1 item per parcel. Pull-image needs: 1 cluster.
   Aged-released: 1 underwriter_exception per lender. Auto-resolved
   counter shows "N already handled by Cliros".

5. NO-CHARGE OUTCOME — when pipeline blocks (PARCEL_NOT_FOUND, panel
   kill, MAX_ATTEMPTS retries, billing failure), refundReport() runs:
   - Mark search_reports.billed=false, refund_reason=<slug>.
   - Package rail: +1 to report_packages.reports_remaining (FIFO mirror
     of the debit), +1 to users.reports_remaining.
   - Metered rail: post offsetting LemonSqueezy decrement usage record.
   - Free trial / BETA_MODE: audit-only, no credit movement needed.
   Idempotent via report_refunds.UNIQUE(report_id). UI: green
   "Address could not be fully verified — no charge applied" banner +
   Refunded counter on Billing.

6. OPTIONAL ACCURACY HINTS — collapsed expander on /dashboard/new with
   three optional fields: prior owner name (free-text — handles "John &
   Jane Smith", "Smith, John R.", "The Smith Family Trust", "Peachtree
   1314 LLC" via parsePriorOwnerHint), recent sale date (narrows GSCCCA
   search window), buyer's loan amount (sanity-check on lien total).
   All three persisted to search_reports.search_hints jsonb. Cron re-
   loads them at stageSearching time.

7. MARKETABILITY LABELS — replaced the 0-100 risk score everywhere
   (search page, report detail, dashboard new, PDF route, AOL template,
   founder email pack). Now driven by computeTitleMetrics() showing
   clustered checklist count + "N already auto-resolved by Cliros" credit.
   Explicit "not a numeric title opinion" disclaimer.

8. STALE ACTION PLAN CLEARED ON RE-QUEUE — re-queueing a report or
   landing in blocked now nulls attorney_action_plan so the dashboard
   banner doesn't show yesterday's numbers under today's run.

9. RLS on report_documents — verified live, policy
   users_see_own_report_docs (user_id via search_reports join).

10. RAW GSCCCA INDEX PARSER is instrument-type-agnostic — captures every
    row regardless of WD/QCD/SD/CANC. Earlier panel concern (parseDeedResults
    self-deed merge) was investigated and confirmed working as designed.

ARCHITECTURAL ITEMS NOT YET ADDRESSED:
- Welcome video on landing page (still missing demo report)
- Homepage hero CTAs (alex@cliros.ai, support@cliros.ai)
- Firm-profile Settings UI for E&O / IOLTA / multi-attorney
- Landing page sample PDF embed (depends on a successful "ship" report)
- Billing E2E proof against a real card+webhook — still unproven outside
  founder account
- E&O / tech professional liability insurance — not yet bound
- Terms of Service updates explicit "informational only, not a title
  opinion, attorney is responsible" — present in PDFs, status on
  marketing site TBD

KNOWN OUTSTANDING ISSUES:
- Peachtree demo c53fc39b: pipeline_stage=blocked. Re-run after PT-61 fix
  improved but vesting deed still not found because we didn't supply the
  prior-owner-name hint. With the hint this would likely ship.
- Rebel Forest 11e5a465: pipeline_stage=blocked. Same root cause. PT-61
  fix took lien overmatch from 729 → 3 but chain=0 → panel killed
  correctly (data inconsistency).
- Pre-existing untracked CompanyPhoneLink import breaks local Turbopack
  build; Render builds clean despite it. Out of scope for title-engine.

GO-TO-MARKET STATE:
- 804 prospects in cliros.prospects, 0 emails sent.
- scripts/send_beta_invites.ts exists local-uncommitted, never run.
- Beta mode = free for everyone. Payment path is set up but unproven on
  real attorney money.

═══ QUESTIONS FOR THE PANEL ═══

1. Are we ready to mail the 804 prospects, or what's still in the way?
2. Of the 5-10 highest-fit names we'd want to email first by hand, what
   do we tell them about what Cliros does TODAY (not next month)?
3. The Peachtree + Rebel Forest demos both block on the same root cause
   (vesting deed not surfacing without prior-owner-name hint). Is fixing
   this fully automatically (e.g. parcel-anchor seller-name lookup) a
   launch-blocker or a "ship + monitor" item?
4. The hint expander shifts some accuracy burden to the attorney
   ("you knew the seller's name from the P&S, paste it"). Does that
   change the product positioning? Is it acceptable for $200/report?
5. What's the FIRST customer success story / case study you'd want
   recorded before bulk outbound? What does it need to demonstrate?
`;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY required in .env.local or monorepo .env");
    process.exit(1);
  }

  console.log("[product-panel] running 6 personas + orchestrator on 2026-05-23 state…");
  const result = await runBacklogPanelReview(BRIEF);

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.join(__dirname, "..", "..", `PANEL_${today}.md`);
  const lines: string[] = [
    `# Cliros product panel — ${today}`,
    "",
    "Post launch-hardening sprint. Question: are we ready to mail the 804 prospects?",
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
    if (r.notes && r.notes.length > 80) {
      lines.push("", `### ${r.persona} notes`, r.notes, "");
    }
  }

  const totalCents = result.reviews.reduce((s, r) => s + r.costCents, 0);
  lines.push("", `*Estimated API cost: ~$${(totalCents / 100).toFixed(2)}*`);

  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`[product-panel] wrote ${outPath}`);
  console.log(`verdict=${result.orchestratorVerdict} confidence=${result.shipConfidencePct}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
