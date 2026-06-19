# SEALED Press — Issues / Backlog

**App root:** [companies/concise-sealed/](.)  
**Launch tracker (100 steps):** [../portfolio-hq/delegations/2026-05-06-100-step-launch-tracker.md](../portfolio-hq/delegations/2026-05-06-100-step-launch-tracker.md)  
**Parent company backlog:** [../concise/issues-backlog.md](../concise/issues-backlog.md)

**Status legend:** TODO / IN PROGRESS / BLOCKED / DONE

---

## SEAL-001 — Site funnel + content polish

- **Owner:** Designer + Brand & Design + Literary Agent (split per tracker)
- **Status:** DONE _(marketing persona pack: steps 38–41 + persona runbook)_
- **Notes:** Steps 1–23, 34–41 of the 100-step tracker — closed for this cycle.

## SEAL-002 — SEO + performance

- **Owner:** CTO
- **Status:** IN PROGRESS
- **Notes:** Steps 24–33 (partially shipped: JSON-LD, canonical, sitemap extensions).

## SEAL-003 — Sample PDF + `/sample` asset

- **Owner:** CTO + Literary Agent
- **Status:** DONE
- **Acceptance:** Hosted **5-page** manuscript-derived sample PDF linked from `/sample` (`public/sample/sealed-sample-preview.pdf`). After `COPY_FROZEN_v1`, run `npm run publish:editorial-sample` so the public download mirrors the final typeset proof instead of the placeholder generator.

## SEAL-005 — VotingCitizen trial + LS checkout disclosure

- **Owner:** Head of Growth + Legal reviewer + CTO
- **Assignee (Paperclip):** Head of Growth (**CON-167**) — CoS routed 2026-05-07; CTO pairs on wiring
- **Status:** TODO (**Paperclip:** **CON-167**)
- **Goal:** Optional **1-month VotingCitizen** newsletter/dashboard trial surfaced on SEALED **LS thank-you / confirmation** (not bundled into the SEALED file deliverable). Validate Lemon Squeezy merchant terms for cross-promotional partner perks; disclosure copy that VC is a separate service.

## SEAL-006 — 5-page sample editorial handoff

- **Owner:** Literary Agent
- **Assignee (Paperclip):** Literary Agent (**CON-168**) — CoS routed 2026-05-07
- **Status:** TODO (**Paperclip:** **CON-168**)
- **Notes:** Replace generated sample bytes with typeset proof when `COPY_FROZEN_v1`.

## SEAL-004 — Founder-gated launch flip

- **Owner:** Founder + CEO + Chief Accountant (sign-offs)
- **Status:** BLOCKED (expected)
- **Notes:** Lemon Squeezy live mode, variant IDs, `NEXT_PUBLIC_STORE_APPROVED` — see [../concise/eng/sealed-launch-flip-checklist.md](../concise/eng/sealed-launch-flip-checklist.md).
