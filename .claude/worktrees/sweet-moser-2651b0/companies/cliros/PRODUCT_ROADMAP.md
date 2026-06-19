# Cliros Product Roadmap

**Owner:** Alex (founder) · **Updated:** 2026-05-29
**North-star milestone:** sign up the first 10 Georgia closing attorneys to run Cliros free, gather feedback, convert to paying clients.

> **The gate that governs everything below (founder direction, 2026-05-29):**
> We do NOT put Cliros in front of a single real attorney until the AI-attorney
> audit comes back **100% — zero defects**. Fix → re-audit → fix again → loop
> until perfect. "Sign only after material rework" is not shippable. There is
> no room for error: the product asks an attorney to stake a closing on it.

---

## Where we are today (2026-05-29)

The pipeline produces a **complete, end-to-end report** for the first time.
Test report `c53fc39b` (1394 Peachtree Battle Ave NW, Fulton) traversed every
stage — search → panel → chain/lien/defect → AOL lock → drafting → **ready** —
with all gates passing (panel verdict `fix` not `kill`; AOL-quality QC 10/10;
citation gate clean).

An independent **GA real-estate-attorney-proxy audit** then graded the AOL
draft: **verdict (b) — "would sign only after material rework."** The legal
architecture is sound (OCGA cites correct, qualified-opinion posture correct,
genuinely sharp on the Christina-H-isn't-the-grantee reasoning). Four issues
block it from being a real time-saver. Those four are Phase 1.

Full audit findings: memory `project_cliros_attorney_audit_verdict_b.md`.

---

## Phase 1 — Fix the audit blockers (→ audit verdict (a), zero defects)

**Gate to exit Phase 1:** re-run the AI-attorney-proxy audit on a freshly
regenerated report and get a clean **(a) "would sign after routine image
verification"** with NO must-fix items. If anything comes back, fix and
re-audit. Loop until 100%.

| # | Task | Audit finding | Severity |
|---|------|---------------|----------|
| 13 | Fix AOL data-reconciliation errors | Liens block prints "Instrument: N/A" for security deeds whose Book/Pages appear elsewhere in the SAME letter; deed dates print "3/27/2011" vs "2011-03-28". Lien table + defect narrative must derive from one reconciled record set with consistent formatting. | **Blocker — credibility-killer.** Two findable inconsistencies on one read force the attorney to re-verify the whole parse → kills the time-saving pitch. |
| 14 | Condition §44-14-80 cure on maturity date, not deed age | Defect #3 claims 2001 SDs "qualify for presumption" because >23yr old; the OCGA §44-14-80 presumption runs from MATURITY date (unknown until image pull — could be 2031). Reframe as "may qualify, subject to maturity confirmed on image." | **Blocker — legal overstatement.** Careful reviewer won't sign over a misstated availability of statutory relief. Overlaps task #11. |
| 15 | Make B7-2-06 deliverable gaps hard blocking placeholders | `[LENDER NAME]` addressee and tax-parcel-only legal description ("refer to vesting deed for M&B") are not sign-able. Convert to explicit blocking fields ("[M&B FROM Bk___ — REQUIRED BEFORE SIGNATURE]") the workflow can't ship without. | **Blocker — completeness.** A Fannie AOL without a named lender + real metes-and-bounds is a template, not a draft. |
| 16 | Link 50217-66 Unknown conveyance to the 2001–2011 chain break | Tool presents the bridging gap and the Bk 50217-66 "Unknown" out-conveyance as two independent defects. An examiner first tests whether they're the same transaction / round-trip. Add cross-defect synthesis so related items are linked. | **Quality — missed synthesis.** Not wrong, but reads mechanical; raises the analytical bar toward (a). |

**Keep (audit praised — do not regress):**
- Opinion item #4 correctly refuses to let the 2024 QCD from CHRISTINA H "cure"
  the 50217-66 gap (she's not the unidentified grantee). Real title reasoning.
- Disciplined epistemic honesty: "index alone is not a title opinion"; routes
  uncertainty to image pulls instead of guessing; qualified-marketability posture.

---

## Phase 2 — Prove it statewide (→ pipeline "ready" across GA)

**Gate to exit Phase 2:** **statewide spot-check** (founder direction) — run
5–8 reports spread across metro + rural counties; each must produce a clean
report that would pass the Phase-1 audit bar. Surfaces county-specific
GSCCCA index/format breakage before any attorney sees it.

- Pick the county set: Fulton + Cobb + DeKalb + Gwinnett (metro, best-tested)
  plus 2–4 rural/small counties with different index formatting.
- Run each through the full pipeline; audit a sample; log any county-specific
  parser/resolver failures as tasks.
- Update FOUNDING_ATTORNEY_PROGRAM.md "Coverage" section with the *verified*
  county list, not the aspirational "all 159."

---

## Phase 3 — Launch assets (parallelizable with Phase 1–2)

### 3a. "GA title-closing requirements → what Cliros covers" matrix
Founder ask: pull, from **official GA state sources**, the list of what's
actually required to close title on a GA property, and match each item to what
Cliros produces / assists vs. what only a licensed attorney can do. Doubles as
a **website visual** (credibility + honest scoping of the product).
→ *Research in progress (state-source-cited). Matrix table lands in §Appendix A below.*

### 3b. Explainer video — "how it's done today vs. Cliros"
Founder concept:
- **Before:** how a title closing is done today (paralegal pulls the chain by
  hand, rebuilds the AOL template per file, stores source docs, bills admin hours).
- **After:** Cliros completes the same process **in minutes** (NOT "seconds" —
  reads scammy), producing fully-generated documentation **with the firm's logo
  and info, ready to review and sign**, plus **all raw source documents included**
  so there are no extra admin hours.
- Route through the company's video-production pipeline + brand voice rules; no
  direct script/asset invocation.

### 3c. Founding-attorney program reconciliation (task #5)
Reconcile the offer from **20 credits → 10** across the whole doc set: offer
section, outreach email body + subject lines, pricing table, the grant script
(`grant_founding_attorney.ts` hardcodes `size=20`), and the "how to grant"
instructions. Currently 20 is threaded end-to-end.

### 3d. Report Q&A assistant (Haiku, grounded-retrieval only) — DEFERRED to Phase 3
Founder asked (2026-05-29) whether to add a small LLM to answer questions about a
delivered report. **Decision: build in Phase 3, gated behind the same AI-attorney
audit, with a hard UPL guardrail. Not on the Phase-1 critical path.**

- **What it is:** Haiku-backed Q&A over a *single, already-delivered* report
  (`search_reports` row: chain, liens, defects, AOL draft, action plan). Cheap;
  fits the $500 cap.
- **Grounding contract (non-negotiable):** answers only restate / locate what the
  stored report already says, quoting the field ("the report flags defect-1 as a
  chain break at Bk 30998-573"). Same discipline as the AOL citation gate — never
  asserts a fact not in the stored report.
- **UPL guardrail (the whole reason this is gated):** Cliros is a **data product,
  not a legal opinion** (see Appendix A row 3 — *Cliros feeds the AOL, never issues
  it*). The assistant **refuses to opine** beyond the report — no "is this title
  marketable?", no "should you require quiet title?" → "that's your call as the
  signing attorney." A chatbot that gives legal advice crosses the UPL line and
  would *fail* the AI-attorney audit, so it must pass that audit before any real
  attorney sees it.
- **Regeneration: OUT.** Free-form "regenerate this document" is rejected.
  Re-running the persona pipeline costs ~$0.40–1.00 Opus/pass AND can change the
  legal characterizations in a document an attorney may already have relied on — a
  versioning/liability problem, not a feature. The attorney-owned editable path
  already exists by design: `client_report_draft` is a separate, attorney-edited
  field, NOT pipeline-generated. Pipeline produces the source draft once; the
  attorney edits their own copy.

---

## Phase 4 — First 10 attorneys (the milestone)

**Entry gate:** Phase 1 audit = (a) zero-defect AND Phase 2 statewide spot-check
clean AND Phase 3 assets ready. Only then recruit.

- Hand-pick 10 from `cliros.prospects` (804 loaded), metro-first.
- Grant 10 free credits each; outreach via the reconciled email.
- Per-report feedback widget + 20-min exit call (already specced in the program doc).
- Convert to paying after the founding period.

---

## Naming / brand line (LOCKED 2026-05-29)

Canonical line for all public copy, the requirements-matrix visual (§3a), and
the explainer video (§3b):

> **From the Greek *klēros* — the allotment of land passed from one generation
> to the next. We make sure it passes clear.**

Why this and not "Greek for clear title": **κλήρος (klḗros / kliros)** means
**"lot, allotment, portion, inheritance"** (the root of "clergy/cleric") — it
does NOT translate to "clear" or "cleared title." Printing "Cliros = Greek for
clear/cleared title" would be a false translation claim on a product whose whole
pitch is accuracy; a detail-oriented attorney would catch it. The
allotment-of-land meaning is accurate AND resonates harder with what a closing
attorney actually protects.

---

## Appendix A — GA title-closing requirements matrix

Source-cited 2026-05-29. **Legend:** PRODUCE = an automated tool reading GSCCCA +
court indexes can generate it; ASSIST = tool can surface/flag/draft but a human
must judge; ATTORNEY-ONLY = UPL-restricted, a licensed GA attorney must perform it.

| # | Requirement (plain) | Controlling authority | Cliros role |
|---|---------------------|----------------------|-------------|
| 1 | Examine the chain + identify all encumbrances (deeds, security deeds, liens, judgments, tax, UCC, lis pendens) sufficient to establish marketable title | Good-record-title presumption **OCGA §44-2-22 (40 yr)**; prescription **§44-5-160 et seq.**; search period set by underwriter standards + attorney judgment (NOT one statute) | **PRODUCE/ASSIST** — tool builds the documentary chain from GSCCCA + flags open SDs/liens/judgments. The "marketable" *conclusion* is ATTORNEY-ONLY |
| 2 | The closing, and deed preparation/execution, must be done under a licensed GA attorney's supervision and physical presence | **In re UPL Advisory Opinion 2003-2, 277 Ga. 472 (2003)** | **ATTORNEY-ONLY** — tool assembles the package; the closing act + opinion are reserved |
| 3 | Loan title covered by title insurance OR an eligible Attorney Title Opinion Letter with all required components | **Fannie Mae Selling Guide B7-2-06** (v. 12/10/2025); baseline **B7-2-01**; lender reports SFC 155 | **ATTORNEY-ONLY to issue/sign**; tool **ASSISTS** by producing the search + draft exception schedule. *This is the core Cliros wedge — Cliros feeds the AOL, never issues it* |
| 4 | Cure defects before marketable title passes (unreleased/ancient SDs, paid-off-but-uncancelled SDs, chain breaks, clouds, index gaps) | Reversion **§44-14-80**; cancellation **§44-14-3**; reconveyance **§44-14-67**; affidavit-of-notice **§44-2-20**; quiet title **§23-3-40 / §23-3-60** | Detection = **PRODUCE/ASSIST**; execution (payoff affidavit, reconveyance, quiet-title suit) = **ATTORNEY-ONLY** |
| 5 | Record the deed/SD with the county Clerk of Superior Court; reflected in GSCCCA statewide index; transfer tax paid before recording | **OCGA §44-2-1 et seq.**; GSCCCA indexing | **ASSIST** — tool verifies recording post-closing + pre-fills metadata; the act is the attorney/clerk's |
| 6 | File a PT-61 transfer-tax declaration electronically for every recorded deed; pay transfer tax (prerequisite to recording) | **OCGA §48-6-1** ($1.00 first $1k + $0.10/additional $500) | **ASSIST** — tool computes the tax + pre-populates PT-61 |
| 7 | Intangible recording tax on the security deed (long-term notes) | **OCGA §48-6-60 et seq.** ($1.50/$500 note, $25k cap; >62-month threshold per HB 586 eff. 2025-07-01 — verify) | **ASSIST** (compute/flag) |
| 8 | Pay off existing liens/SDs; prepare deed; settlement statement + IOLTA disbursement; survey (NOT always required) | Payoff ties to §44-14-3; deed prep + settlement = practice of law per *In re UPL 2003-2*; no statute mandates a residential resale survey | Payoff/plat detection = **ASSIST**; deed prep + disbursement = **ATTORNEY-ONLY**; survey = **ASSIST (flag plat)**, not mandatory |

**Cliros covers (its lane):** the search package from GSCCCA + federal court
indexes — chain, open SDs (with §44-14-80 reversion flagging), liens, judgments,
UCC, lis pendens, PT-61 history; transfer/intangible-tax math; PT-61 pre-fill;
recording verification.

**Cliros must DISCLOSE these gaps (honesty = the website's credibility):**
- GSCCCA real-estate index **begins 1999** — pre-1999 needs the county Clerk's books.
- **Federal** liens/judgments/bankruptcy are NOT in GSCCCA (require PACER).
- The "marketable" *conclusion* is an opinion (ATTORNEY-ONLY).

**Cliros must NOT claim (the UPL line):** conducting the closing, preparing/executing
deeds, issuing the title opinion or AOL, signing the §44-14-3 payoff affidavit,
or filing quiet-title suits. Position Cliros as the diligence engine that **feeds**
the closing attorney and the AOL/title policy — never a replacement.

### ⚠ Three corrections this research surfaced in our CURRENT shipped AOL (feeds Phase 1)
1. **§44-14-80 is a *reversion* statute, not a "presumption of payment."** Title
   *reverts* to grantor 7 years after the debt's stated **maturity** (20 yr if
   perpetual; 7 yr from recording if undated). Our AOL defect #3 mislabels it
   "presumption of payment." → folds into task #14, now broader.
2. **A §44-2-20 affidavit is NOT a cure** — GA case law: it gives *notice* only,
   it is not a conveyance and does not cure a defect. Our AOL offers
   "quitclaim plus affidavit of possession under §44-2-20" *as a cure path* —
   misstatement an attorney will catch. → new task.
3. **Drop "Marketable Title Act = §44-5-160."** Use **§44-2-22** for the 40-year
   good-record-title concept; §44-5-160 is prescription/adverse possession.

### Re-verify before any of this goes on a public page
- Exact **§48-6-1** transfer-tax rate language.
- Full enumerated component list in **Fannie Mae B7-2-06** (specific, version-dated).
- The HB 586 intangible-tax 62-month threshold (eff. 2025-07-01).

*Sources: Justia GA Code (§44-2-22, §44-5-160, §44-14-80, §44-14-3, §44-14-67,
§44-2-20, §23-3-40, §23-3-60, §48-6-1, §48-6-60 et seq.), In re UPL Advisory
Opinion 2003-2 (Ga. 2003), Fannie Mae Selling Guide B7-2-06 / B7-2-01, GSCCCA.org,
Georgia DOR.*
