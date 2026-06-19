# CoS sprint — Concise / SEALED + CarStack (30-minute cadence)

**Focus (founder-confirmed):** **only these two** — **Concise + SEALED** and **CarStack**. CoS is **this Cursor agent** on a repeating checkpoint (not Paperclip worker spam).

**Started:** 2026-05-05 (repo time).

---

## How “every 30 minutes, just you” works

This model **does not** stay alive between ticks. **You** set a **30-minute repeating alarm** (Calendar, Shortcuts, watch). When it fires: open this repo in Cursor and send **one line**:

`CoS 30m checkpoint — SEALED + CarStack`

That wakes **this agent** to run the tables below—no PAT, no Paperclip required for the cadence itself.

---

## North stars

| Lane | One sentence |
|------|----------------|
| **SEALED** | Stranger pays → `SEALED-v1-before-the-deals.pdf` arrives within ~60s → share link works with **`GIFT50`** pre-applied. |
| **CarStack** | Week-1 engineering path **CAR-4 → CAR-6** advances (LubeLogger in Docker on Render; separate **`POST /report`** skeleton calling it); Brand blockers (**CAR-1…3**) tracked until CEO locks name/pricing. |

---

## Concise / SEALED — blocker stack (order matters)

1. Real **variant IDs** replace `PLACEHOLDER_*` in `companies/concise/config/sealed-products.json`.
2. **Lemon Squeezy:** PDF attached to product; prices match intent ($22 / $27).
3. **`GIFT50`** exists and applies at checkout URL query pattern in `sealed-products.json`.
4. **`app/sealed`** buy buttons use real checkout URLs.
5. Smoke: test purchase → PDF link works.

---

## CarStack — Week 1 checkpoint rails

| Track | What “green” looks like |
|-------|-------------------------|
| Brand | `research/01-naming-research.md` exists (CEO decision pending); **`02-pricing-research.md`**, **`03-identity-hook-validation.md`** filed when CAR-2/CAR-3 promoted. |
| Engineering | **CAR-4:** private LubeLogger fork + Render Docker URL internal-only. **CAR-5:** NHTSA pull by VIN (cron or stub with 5 test VINs). **CAR-6:** separate service repo or `companies/estimateproof/` service with `POST /report` JSON + HTTP to LubeLogger. |

No edits to **LubeLogger source** — MIT fork runs unmodified per CTO charter.

---

## 30-minute checkpoint — run both lanes (≤10 minutes total)

Spend **~5 min SEALED**, **~5 min CarStack**. If either lane is red, **only** unstick that lane next tick.

### SEALED (A–E)

| # | Check |
|---|--------|
| A | `sealed-products.json` — no `PLACEHOLDER` variant IDs? |
| B | LS — product live, digital asset attached, prices right? |
| C | `GIFT50` — applies at checkout? |
| D | Next.js sealed routes point at real URLs? |
| E | Delivery path — test inbox or supporter watching failures? |

### CarStack (F–K)

| # | Check |
|---|--------|
| F | **CAR-1** — naming doc present; CEO picked a finalist or still pending? |
| G | **CAR-2 / CAR-3** — pricing + identity docs started or explicitly queued? |
| H | **CAR-4** — fork + Render deploy exists (URL or ticket comment)? |
| I | **CAR-5** — NHTSA integration branch or cron spec checked in? |
| J | **CAR-6** — report service skeleton exists (`package.json` + `POST /report` stub)? |
| K | No drift into banned moves (LubeLogger forks inside OSS repo, paid APIs without CEO, etc.). |

**Rule:** No feature creep. **Ship the pipe** (SEALED) and **cut engineering milestones** (CarStack).

---

## End state (when you stop the sprint)

**SEALED:** Live or sandbox checkout ×2 + automatic PDF + one paste-ready gift URL line.

**CarStack:** CAR-4 deploy smoke passes OR documented blocker with owner; CAR-6 returns JSON for ≥1 VIN path (even mocked LL maintenance).

---

## CoS note

If `.cos-pause` exists at monorepo root: keep filing checkpoints in `briefings/`; skip auto-promote side effects until pause lifts.
