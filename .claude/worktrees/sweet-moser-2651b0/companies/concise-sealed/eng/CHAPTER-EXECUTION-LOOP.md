# SEALED — end-to-end loop per chapter (until TOC complete)

**Purpose:** Repeat this checklist for **every chapter** (and each **section** inside it) listed in [`artifacts/SEALED-CHAPTER-OUTLINE-V1.md`](../artifacts/SEALED-CHAPTER-OUTLINE-V1.md) until the manuscript spine matches the outline row-for-row.

**Working file:** [`artifacts/sealed-v1-content.md`](../artifacts/sealed-v1-content.md)  
**Who does what (review lanes):** [`MANUSCRIPT-PROGRESS-TRACKER.md`](MANUSCRIPT-PROGRESS-TRACKER.md) § Review & feedback RACI

---

## Phase 0 — Spine alignment (once per chapter, before heavy writing)

| Step | Owner | Output |
|------|--------|--------|
| 0.1 | **Literary Agent** | Chapter title + §A/§B/§C headings in `sealed-v1-content.md` match the outline (or CEO-approved rename logged in outline file). |
| 0.2 | **CEO / CoS** | Optional: Paperclip sub-issue or comment naming the chapter goal for the week. |

---

## Phase 1 — Research in (before prose freeze)

| Step | Owner | Output |
|------|--------|--------|
| 1.1 | **Pipeline Validator** | Research packet in `research/` (or issue-attached doc): primary transcript URLs, dates, agency pointers, “stress test” gaps. |
| 1.2 | **Literary Agent** | Read packet; request fills for blockers before drafting. |

---

## Phase 2 — Draft (section-by-section)

| Step | Owner | Output |
|------|--------|--------|
| 2.1 | **Literary Agent** | For each **section**: margin rail discipline + verbatim block + comparison body (~6th-grade bar + diagram notes per persona). Merge into `sealed-v1-content.md`. |
| 2.2 | **Pipeline Validator** | Quote cross-check: audio/transcript vs manuscript attribution lines. |

---

## Phase 3 — Voice & reader gates

| Step | Owner | Output |
|------|--------|--------|
| 3.1 | **Literary Agent** | Second pass: cut jargon, shorten sentences, flag anything that sounds like a dissertation. |
| 3.2 | **Head of Growth** | Optional **shareability pass**: one “forward-worthy” line per section *only if* it does not break neutrality (angles, not verdicts). |
| 3.3 | **CEO** | **VoC sweep:** support inbox / founder notes → if the same confusion appears twice, open a fix issue or inline edit. |

---

## Phase 4 — Art & assembly (when chapter structure is stable)

| Step | Owner | Output |
|------|--------|--------|
| 4.1 | **Book Illustrator** | Plates for promise clusters in chapter (paths in `public/` + manifest rows). Can start style exploration earlier; **placement-final** after 2.1 stabilizes. |
| 4.2 | **CTO** | Chapter proof PDF slice or full-book build step; script notes in `scripts/` or milestone doc. |

---

## Phase 5 — Done criteria for this chapter

| Gate | Check |
|------|--------|
| **Copy** | No `TBD` / `pending` quote rows intended for retail in this chapter (or each flagged with explicit deferral). |
| **Facts** | Pipeline Validator sign-off on transcript dates and URLs. |
| **Outline** | `MANUSCRIPT-PROGRESS-TRACKER.md` completion grid row updated. |

---

## Order of attack (recommended)

1. **Finish Part I Ch.1** (proof-close entries 4–5 → CON-176 proof PDF).  
2. **Part I Ch.2–Ch.5** — same loop per chapter (research packet → draft → review gates → art → tracker row).  
3. **Parts II–III–IV** — add outline rows to manuscript as you go; repeat loop.

---

## Paperclip orchestration (Concise company)

**Yes — the manuscript run is coordinated through Paperclip** by tying repo work to the **Concise** epic and milestone issues, plus **comments** that Literary Agent / Pipeline Validator / CTO pick up on their next heartbeat.

| Piece | Paperclip | Repo anchor |
|-------|-----------|---------------|
| Epic (visibility + goal link) | **CON-171** — SEALED manuscript + illustration track | [`SEALED-V1-DELIVERY-MILESTONES.md`](SEALED-V1-DELIVERY-MILESTONES.md) |
| Part I Ch.1 draft / proof-close | **CON-174** — M3 (assignee: **Literary Agent**) | `artifacts/sealed-v1-content.md` |
| Ch.1 research packet (template for Ch.2+) | **CON-173** — M2 (assignee: **Pipeline Validator**) | `research/ch*-*.md` |
| Ch.1 plates | **CON-175** — M4 (**Book Illustrator**) | `public/` + manifests |
| Ch.1 proof PDF | **CON-176** — M5 (**CTO**) | scripts / milestone doc |

**CoS playbook (admin token, no synthetic run id on PATCH):**

1. Post a **single orchestration comment** on the active milestone issue (e.g. CON-174) with the next 3 concrete repo steps and who owns them — signed `— CoS (Cursor session)` so agents know it is coordination, not peer chatter.
2. For each **new chapter**, either reuse one issue per chapter (`backlog` → promote to `todo`) or rely on this doc + tracker only if you want less ticket noise.
3. **Close stranded-recovery children** (e.g. “Recover missing next step CON-174”) once the parent has a valid continuation comment — otherwise they stay attached as junk blockers.
4. **Stale `blocked` / `blockedStatusLock` on local Paperclip (`127.0.0.1:3100`):** Same portfolio fix as CON-112 / NTM-37 — `PATCH /api/issues/{id}` with **`blockedStatusLock: false`**, **`blockedByIssueIds: []`** when appropriate, and **`status`** (`in_progress` or `done`). For **productivity-review** tickets, include **`blockedStatusLock: false`** on the review issue when closing it (`status: done`). No separate cloud dashboard — this is your local API + admin token from repo root `.env`.

**Dispatch:** Agents run on **heartbeat adapters** (Cursor local-cli, etc.). CoS does not replace heartbeats — CoS **orients** issues so the next wake lands on the right file paths.

---

## Cadence (standing meeting — optional)

| When | Who | What |
|------|-----|------|
| Weekly (15 min) | CEO + Literary Agent + Pipeline Validator | Next chapter, blockers, VoC themes. |
| Monthly | CEO + Head of Growth | Virality / launch angles; no manuscript rewrite unless CEO pulls a thread. |
