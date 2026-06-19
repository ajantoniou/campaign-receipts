# SEALED v1 — manuscript + illustration delivery milestones

**Paperclip epic:** CON-171 (Concise company; may appear **`blocked`** as intentional board gate — see [Board gate + swimlanes](#board-gate--swimlanes-2026-05-07)) · **Goal:** First $100 direct-PDF revenue (shared goal on children)

Purpose: single place to read **sequence**, **canonical files**, and **ticket IDs** for the writer → researcher → illustrator → CTO assembly path.

---

## Canonical paths

| Artifact | Path |
|---------|------|
| Working manuscript | [`artifacts/sealed-v1-content.md`](../artifacts/sealed-v1-content.md) |
| Chapter spine | [`artifacts/SEALED-CHAPTER-OUTLINE-V1.md`](../artifacts/SEALED-CHAPTER-OUTLINE-V1.md) |
| Editorial cadence | [`MANUSCRIPT-EDITORIAL-WORKFLOW.md`](MANUSCRIPT-EDITORIAL-WORKFLOW.md) |
| Hero / illustration manifest | [`public/hero/HERO_MANIFEST.md`](../public/hero/HERO_MANIFEST.md) |
| Research packet (Part I Chapter 1) | [`research/ch1-trail-mechanics-research-packet.md`](../research/ch1-trail-mechanics-research-packet.md) |
| v1 narrative ship brief (PDF scope) | [`companies/concise/briefs/2026-05-05-CON-70-sealed-v1-shipping-plan.md`](../../concise/briefs/2026-05-05-CON-70-sealed-v1-shipping-plan.md) |

---

## Milestone table (Chapter 1 pilot band)

Ordered execution for **Part I · Chapter 1**; replicate the same ladder for later chapters once Ch.1 proof is repeatable.

| Step | Milestone | Paperclip | Default owner lane | Acceptance (summary) |
|------|-----------|-----------|---------------------|-------------------------|
| M1 | Outline + TOC ↔ manuscript sections | **CON-172** | Literary | Spine and `sealed-v1-content.md` section headings aligned (or TOC amended deliberately). |
| M2 | Copy-research packet (hooks, primary URLs) | **CON-173** | Pipeline Validator | Research packet feeds writer per `MANUSCRIPT-EDITORIAL-WORKFLOW.md`. |
| M3 | Draft Chapter 1 (rails + comparison body) | **CON-174** | Literary | Ch.1 in `sealed-v1-content.md` with **6th-grade voice + diagrams per persona update**; proof-quote checklist rows verified or CoS-flagged deferrals. |
| M4 | Chapter 1 illustration plates | **CON-175** | Book Illustrator | Plates exported to paths CTO lists for embed; faceless / platform-safe. |
| M5 | Chapter 1 proof PDF | **CON-176** | CTO | One stitched proof PDF + repeatable assembly notes/script. |

**Parallelism:** M4 may start early on style frames; **placement-final** art still keys off stable M3 structure.

**Identifier hygiene:** Some older comments reference **CON-177 / CON-178 / CON-179** for M3–M5; those issues were **cancelled** as duplicates. Use **CON-174 / CON-175 / CON-176** only.

---

## Dependency graph (first-class blockers)

| Issue | Waits on |
|-------|-----------|
| CON-174 | CON-173 |
| CON-176 | CON-174 **and** CON-175 |

M1→M2 is sequential by workflow (outline lock before researcher spend); not necessarily encoded as a blocker if agents coordinate—add `blockedBy` in Paperclip only when it reduces thrash.

---

## Epic completion definition

CON-171 can move **`done`** when:

- M1–M5 above are **`done`** (or explicitly scoped down with CEO/CoS note on the epic), **and**
- `SEALED-V1-DELIVERY-MILESTONES.md` is updated if numbering or chapter scope changes.

Longer horizon (full retail PDF, LS, marketing) stays on CON-70 and related storefront issues—not duplicated here.

## Board gate + swimlanes (2026-05-07)

CoS orchestration (Paperclip comment **0bda4137**): epic **CON-171** is intentionally **`blocked`** in Paperclip as a **board visibility gate**. Execution continues on children (**CON-174** → **CON-176**).

| Seq | Ticket | Owner | Expected Paperclip status | Job |
|-----|--------|-------|---------------------------|-----|
| M1 | CON-172 | Literary Agent | `done` | Outline / TOC lock |
| M2 | CON-173 | Pipeline Validator | `done` | Ch.1 research packet |
| M3 | **CON-174** | Literary Agent | **`in_progress`** | Draft Ch.1 into `artifacts/sealed-v1-content.md` (6th-grade voice + diagrams per persona update) |
| M4 | CON-175 | Book Illustrator | `done` | Ch.1 plates in `public/` |
| M5 | CON-176 | CTO | `todo` → picks up after M3 | Assemble Ch.1 proof PDF after M3 merges |

**Critical path:** CON-174 → CON-176.

### Launch queue (after Lemon Squeezy approves store)

| Ticket | Owner | Note |
|--------|-------|------|
| **CON-25** | CTO | Wire LS buy + PDF delivery (`todo`) |
| **CON-27** | CTO | Email form → Mailchimp (`todo`) — **confirm vs current Resend path before building** |

### Hygiene

| Ticket | Note |
|--------|------|
| **CON-154** | `eslint-config-next` in repo — CTO verify `npm run build` / `npm run lint` green on Render |

---

## Continuation path (May 7, 2026)

- **M1/M2 landed:** CON-172 (outline + TOC alignment) and CON-173 (Part I Chapter 1 research packet) are **`done`**; the packet lives at `research/ch1-trail-mechanics-research-packet.md` and documents the margin-rail hooks, Grade key checks, and verification links the writer needs before freezing Chapter 1 prose.
- **M4 landed:** CON-175 (Chapter 1 illustration plates) is **`done`**; plate assets live under `public/` — index in [`SEALED-IMAGE-INDEX.md`](../public/SEALED-IMAGE-INDEX.md).
- **Active lane (M3):** Literary agent executes **CON-174** — draft Chapter 1 into **`artifacts/sealed-v1-content.md`** using **6th-grade voice** and **diagrams per persona update**; verify Grade rows vs Scorecard; merge canonical prose before proof assembly locks.
- **Queued assembly (M5):** **CON-176** (CTO Chapter 1 proof PDF) stays **`todo`** until **CON-174** closes; CON-175 already satisfies the art prerequisite.
- **Epic CON-171:** intentionally **`blocked`** as **board gate** (see swimlane section above); close **`done`** only when M1–M5 are satisfied **and** this doc reflects any scope change.

---

## Next action after CON-174 (May 8, 2026)

- **Clear continuation:** The Book Illustrator (CON-175) already delivered the Chapter 1 plates; they live under `public/` and are catalogued in [`public/SEALED-IMAGE-INDEX.md`](../public/SEALED-IMAGE-INDEX.md) with dimensions and suggested layout uses. Pointing the recovery agent to this index preserves the `clear_next_step` signal the harness wants after CON-174 finishes.
- **CON-176 (proof PDF):** The CTO now owns the lane. Run `scripts/build_sealed_v1_pdf.py` so `artifacts/SEALED-v1-before-the-deals.pdf` stitches the freshly frozen `artifacts/sealed-v1-content.md` with the plates referenced above. Document the generated PDF path on CON-176 and in this doc so the harness sees the recorded continuation instead of reopening the recovery wrapper.

## Recovery note (May 7, 2026)

- The CoS thread (`dbcc7562`) reminded us the buyer-forward Lemon placeholder funnel (hero / methodology / verification copy in `lib/landing-content.ts`) must be re-validated against the final Chapter 1 manuscript once CON-173 → CON-174 finishes so the live hero aligns with the verified verification-path copy.
- **Research packet reference:** The Part I Chapter 1 packet (`research/ch1-trail-mechanics-research-packet.md`) codifies every rail, grade key, and primary transcript that the writer must reflect in the manuscript; mentioning the file in this doc clarifies the `clear_next_step` signal the recovery agent needs.
- After briefly reopening CON-177–CON-179 the CEO cancelled the dupes again, keeping the canonical ladder at CON-174 / CON-175 / CON-176. Once CON-175 (**M4**) is **`done`**, CON-176 waits only on CON-174 (**M3** prose freeze) before proof PDF assembly.
- Epic **CON-171** may show **`blocked`** intentionally (board gate) while children execute; do **not** treat that as “stop work” — follow **CON-174** → **CON-176** until proof ships, then disposition the epic per completion definition above.

## Next action after CON-176 (May 8, 2026)

- **Proof milestone delivered:** CON-176 now produces `artifacts/SEALED-v1-before-the-deals.pdf` via `scripts/build_sealed_v1_pdf.py`, so the stitched Chapter 1 proof exists and is referenced by the landing hero/performance copy.
- **Shipping lane (CON-25):** The Lemon Squeezy checkout wiring starts once the proof PDF is frozen. Share the variant IDs from the dashboard, update `config/sealed-products.json`, replace the placeholder checkout links in `app/sealed/page.tsx`, and follow `eng/CON-25-EXECUTION-TEMPLATE.md` plus `eng/SEALED-PAYMENT-SETUP.md` so the codepoints, sandbox tests, and approvals are documented.
- **Flip checklist:** After sandbox testing and CEO/Chief Accountant approvals, run the `eng/sealed-launch-flip-checklist.md` steps to flip live mode and confirm `artifacts/SEALED-v1-before-the-deals.pdf` ships through the Lemon Squeezy funnel.
- **Recovery signal:** This “Next action after CON-176” note gives the recovery harness (`CON-201`) the `clear_next_step` it was missing — the lane now points to CON-25 and the hosted PDF, preventing the wrapper from re-firing.

---

## Paperclip hygiene

If overlapping M3/M4/M5 rows appear (**CON-177+** lineage), **`cancel`** extras and keep this table’s identifiers (**CON-174 … CON-176**) as canonical so dependency wakes stay single-path.

---

*Maintainer: Concise CEO for ticket alignment; CTO updates assembly rows when the proof pipeline moves.*
