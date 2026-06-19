# Cliros founder deliverable — 2026-05-22

**Account:** alex@antoniou.net  
**Demo property:** 1394 Peachtree Battle Ave NW, Atlanta, GA 30318 (EIKHOFF / Fulton)  
**Report ID:** `87648f5f-c691-4198-8b4a-fe5f6859ae74`

## What you can open now

| Artifact | URL |
|----------|-----|
| Dashboard (report + defects + chain) | https://cliros.ai/dashboard/reports/87648f5f-c691-4198-8b4a-fe5f6859ae74 |
| Title Search Report PDF | https://cliros.ai/api/reports/87648f5f-c691-4198-8b4a-fe5f6859ae74/pdf |
| Attorney Opinion Letter PDF | https://cliros.ai/api/reports/87648f5f-c691-4198-8b4a-fe5f6859ae74/aol |
| Source documents vault | https://cliros.ai/api/reports/87648f5f-c691-4198-8b4a-fe5f6859ae74/sources |

**Vault (Supabase storage):**

- `Title_Search_Report.pdf`
- `Attorney_Opinion_Letter.pdf`
- `Homeowner_Summary.pdf`

**Pipeline:** `ready` · panel override `fix` @ 72% ship confidence (founder demo bypass after engine `kill` on unreleased SD count) · risk score 75.

**Credit:** `report_packages` row `founder-grant-*` with `reports_remaining = 1` on your account (simulates first paid pack without Lemon Squeezy).

---

## Engine: EIKHOFF SD ↔ CANC pairing (shipped)

**Problem:** Cancellations cited the cancellation instrument’s own BOOK/PAGE from the index header, not the originating security deed — so pairing matched 0 SDs and left 4+ “active” mortgages.

**Fix:**

1. `gsccca-http.ts` — `extractReferencedBookPage(text, ownBookPage)` collects all BOOK/PAGE hits, excludes the instrument’s own book-page, prefers the last non-self match.
2. `search-orchestrator.ts` — pairing skips `referencedBookPage === cancellation bookPage` (self-ref guard).

**After rerun (live GSCCCA):**

- **8** cancellations paired to SDs by referenced book/page  
- **3** security deeds still active (down from 4+; Chad E index now returns 18 deed rows vs 0 on partial session)  
- Chain: **4** conveyances, **22** SD/CANC rows routed to liens

Panel still returns **kill** on strict attorney persona (unreleased SDs + bankruptcy/FTL narrative). Production should not charge until panel ship > ~80% without founder override.

---

## Billing: first paid pack

**Code verified** (`scripts/verify_billing_e2e.ts`, `BILLING_E2E_VERIFICATION.md`):

- Webhook idempotency on `ls_order_id`
- Queue `is_free_trial` only when `billingMode === "free"`
- Buy → webhook → `report_packages` → queue decrement paths wired

**Not yet proven in DB:** zero rows from a real Lemon Squeezy `order_created` (no live $250 card run). Your account uses **founder-grant** credit instead.

**Production gate:** one real purchase at https://cliros.ai/dashboard/billing → re-run `npx tsx scripts/verify_billing_e2e.ts` → expect `report_packages` + `reports_remaining=1` → run search → balance 0.

---

## Welcome video

**Regenerated** `companies/cliros/app/public/welcome-video.mp4` (0.42 MB) via `node scripts/record-walkthrough.mjs` against localhost:3000 + ffmpeg. Script uses `WALKTHROUGH_REPORT_ID` / fallback Peachtree report for frames.

---

## Remaining before Harrington / paid GA closings

1. Live LS 1-pack purchase to populate `report_packages` from production webhook.
2. Panel ship without founder override (target >80%): likely need SD image pull or stronger CANC↔SD heuristics for the 3 remaining active SDs.
3. Federal tax lien / bankruptcy defects: tighten debtor match so narrative matches `liens[]` payload.
4. Deploy welcome MP4 if marketing site serves from production build (commit/deploy when ready).

---

## Commands

```bash
cd companies/cliros/app
npx tsx scripts/founder_deliver_report.ts
npx tsx scripts/verify_billing_e2e.ts
node scripts/record-walkthrough.mjs   # needs npm run dev + ffmpeg
```
