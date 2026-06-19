# SEALED Imprint Plan — CON-40 Deliverable

**Status:** APPROVED BY CEO (under expanded pivot authority granted 2026-05-03 ~18:00 ET via CON-40)
**Founder approval needed:** NO (no paid domain in this phase)
**Owner of execution:** CTO (via child issue, see § 7)
**Pipeline Validator:** Verifies deployed result matches this plan

---

## 1. Imprint name

**`SEALED Press`**

- Why this name: The product title "SEALED" was already locked and CEO-approved on
  CN-12 (2026-05-03 13:25 ET). Promoting it to the imprint name creates brand
  continuity: the imprint is named after its first title, the way "Crooked Media"
  is named after the show that birthed it. Future titles published under SEALED
  Press inherit the "archive of suppressed/forbidden record" positioning — works
  for any future political, historical, or whistleblower-adjacent title.
- Why NOT "Grabit Nation": founder explicitly rejected on 2026-05-03 ~09:00 ET as
  "a TERRIBLE title." Documented in `personas/ceo.md` STRATEGIC PIVOT section.
- Why NOT a brand-new name: avoids spending another Brand/Design cycle re-litigating
  what's already locked. CN-12 closure is the source of truth for SEALED naming.
- Why NOT "Concise": founder's verbatim direction in CON-40 — "Brand is NOT
  'Concise'." Cross-brand contamination is the entire problem this issue exists
  to fix.

Tagline (working): *"The archives they sealed for a reason."* Brand & Design
agent may refine via a follow-up issue if needed; not a blocker for shipping.

**No founder approval needed for the name** per CON-40 § "What you need to
deliver." This is decision #1 under expanded pivot authority.

---

## 2. Subdirectory plan

**`companies/concise-sealed/`** (sibling to `companies/concise/`).

Recommended over the sub-app option (`companies/concise/sealed/`) for these reasons:

- **Cleaner brand isolation.** A sibling directory means SEALED Press has its own
  `app/`, `app/layout.tsx`, `app/page.tsx`, `next.config.js`, `package.json`,
  `globals.css`, public assets, env vars, and node_modules surface. No risk of
  Concise Books metadata or styling leaking via shared layout.
- **Independent deploy lifecycle.** A Render service can be configured with a
  `rootDirectory` set to `companies/concise-sealed/` so a Concise Books deploy does
  not trigger a SEALED Press deploy and vice versa. Faster iteration, no
  cross-blast-radius regressions.
- **Clear ownership semantics in the monorepo.** Future agents (CTO, Brand,
  Pipeline Validator) immediately see two distinct companies-style directories
  rather than burying SEALED inside Concise's tree where it visually reads as
  "another section of Concise."
- **Reversible.** If we later want to consolidate, a sibling directory is trivial
  to fold back into a parent. The reverse is harder.

The directory is NOT a new Paperclip company (no separate `personas/`, no
separate `vision.md`, no separate Chief Accountant). It is a sub-brand sharing
Concise's CEO, agents, KPIs, $250 budget cap, and Goal `ddcba1d3` ("First $100
in direct-PDF revenue by 2026-06-15"). The Concise CEO (this agent) continues
to own SEALED Press as a product line. This satisfies founder's "separate
service inside the existing Concise Render project" framing without spinning
up a new agent team.

---

## 3. Domain plan

**Phase 1 (NOW, until first 5 direct sales):** Free `sealed-press.onrender.com`
(or whatever Render auto-assigns; `sealed-press` is the requested service slug).

- Zero spend. Preserves $250 cap headroom for actual marketing tests.
- Founder pivot direction (2026-05-03 ~09:00 ET) treats every dollar before
  product-market-fit as wasted. A free Render subdomain is sufficient to test
  whether the SEALED landing page converts traffic to email signups + sales.
- The domain string `sealed-press.onrender.com` reads as a publisher, not as
  "another Concise section." Brand isolation goal is achieved without spend.

**Phase 2 (TRIGGER: 5 direct sales OR $100 cumulative direct revenue from
SEALED, whichever comes first):** Buy `sealedpress.com` (or `sealed.press` /
`sealedpress.co` if .com unavailable) via
`infrastructure/scripts/buy-domain.py`. Founder pre-approved the $25/yr ceiling
in CON-40 § 3 — no further confirmation required at purchase time, but the
Chief Accountant must log the spend to the company P&L and the CEO must update
this document with the registered domain + DNS configuration.

Phase 2 is NOT in scope for this CON-40 deliverable. Recorded here so future
agents don't re-decide.

---

## 4. Migration plan (zero-downtime)

Goal: move the working SEALED page out of the Concise Books service without
breaking the live `https://concise-8jmf.onrender.com/sealed` URL during the
transition. Lemon Squeezy buy buttons stay functional throughout.

### Step 1 — COPY (do not move) the SEALED tree

Source files (Concise repo):
- `companies/concise/app/sealed/page.tsx`
- `companies/concise/app/sealed/email-form.tsx`
- `companies/concise/app/sealed/public/hero/*` (all hero assets)
- `companies/concise/app/api/email/subscribe/route.ts` (SEALED-shared API
  endpoint; needs to be either copied or replaced with a SEALED-specific
  handler — CTO's call)
- `companies/concise/app/api/lemon-squeezy/products/route.ts` (if SEALED uses it)

Destination tree to create (`companies/concise-sealed/`):
```
concise-sealed/
├── app/
│   ├── layout.tsx          # SEALED-specific metadata: "SEALED Press — The Archives"
│   ├── page.tsx            # MOVED from companies/concise/app/sealed/page.tsx, becomes the root
│   ├── email-form.tsx      # MOVED from companies/concise/app/sealed/email-form.tsx
│   ├── globals.css         # SEALED-specific Tailwind base (no Concise styles)
│   └── api/
│       ├── email/subscribe/route.ts          # COPY (writes to same Supabase schema is fine)
│       └── lemon-squeezy/products/route.ts   # COPY if SEALED uses it
├── public/
│   └── hero/                                  # MOVED from app/sealed/public/hero/
├── package.json            # NEW: name "sealed-press", deps mirror concise/package.json
├── next.config.js          # NEW: mirror of concise/next.config.js
├── tailwind.config.ts      # NEW
├── postcss.config.js       # NEW
├── tsconfig.json           # NEW
└── README.md               # NEW: 1-paragraph imprint description + how-to-deploy
```

CRITICAL during this step: **do not delete the old `companies/concise/app/sealed/`
tree yet.** The current `/sealed` URL must keep working until the new service
is live and verified.

### Step 2 — Create the Render service

CoS or CTO runs the API call in § 5 below. The service deploys from
`companies/concise-sealed/`, gets a free `sealed-press.onrender.com` (or
similar) URL, and serves the new root page at `/`.

### Step 3 — Verify the new service

CTO smoke-tests:
- `https://sealed-press.onrender.com/` loads the SEALED hero page (no
  "Concise Books" text anywhere).
- Email capture form POSTs successfully (existing Supabase pipeline).
- Lemon Squeezy "Buy Now" buttons open the existing checkout URLs and
  complete a test purchase if LS variant IDs are still pending (CON-25
  external blocker — separate issue, doesn't block CON-40).
- `/robots.txt`, `/favicon.ico` defaults work.
- Lighthouse score reasonable (no regressions vs the current `/sealed` page).

### Step 4 — Cut over

Once the new service is verified green:
1. Add a permanent (301) redirect from `https://concise-8jmf.onrender.com/sealed`
   → `https://sealed-press.onrender.com/`. Implementation: a `redirects()`
   entry in `companies/concise/next.config.js`.
2. Delete `companies/concise/app/sealed/` from the Concise repo.
3. Concise Books root page (`/`) continues to serve the existing
   "Coming Soon" Concise marketing page unchanged.
4. Update CN-12 closure document, `eng/sealed-launch-flip-checklist.md`, and any
   marketing copy that references the old URL.

Founder will see two distinct services in the Render dashboard: `concise`
(Concise Books) and `sealed-press` (SEALED Press). Both auto-deploy from `main`
on path-scoped triggers (Render's `rootDirectory` handles this).

### Step 5 — Communicate to other agents

- Brand & Marketing: SEALED imprint locked, can build SEALED-specific social
  content (TikTok, Reddit, Twitter) without Concise framing.
- Head of Growth: update Reddit/email outreach to point at the new URL.
- Chief Accountant: track SEALED Press revenue as a sub-line on Concise's P&L
  (sub-brand, not a separate company, so it rolls up under Concise's $250 cap
  and Concise's Goal `ddcba1d3`).
- Pipeline Validator: run verification once new URL is live; confirm zero
  Concise branding, zero broken links, redirect from old `/sealed` works.

---

## 5. Render service spec (API call)

**Service to create:**

| Field             | Value                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `name`            | `sealed-press`                                                                                                  |
| `repo`            | (same repo as `concise` service — AgentCompanies monorepo)                                                      |
| `branch`          | `main`                                                                                                          |
| `runtime`         | `node`                                                                                                          |
| `rootDirectory`   | `companies/concise-sealed`                                                                                      |
| `buildCommand`    | `npm install && npm run build`                                                                                  |
| `startCommand`    | `npm start`                                                                                                     |
| `plan`            | `free`                                                                                                          |
| `region`          | `oregon` (matches concise service for latency parity)                                                           |
| `autoDeploy`      | `yes`                                                                                                           |
| `envVars`         | mirror SEALED-relevant vars from concise service (Supabase URL/key, Lemon Squeezy keys, NEXT_PUBLIC vars)       |

**Note on the `rootDirectory` field:** the `mcp__render__create_web_service` tool
exposed to this CEO does NOT include a `rootDirectory` parameter (verified in
its JSON schema — only `name`, `runtime`, `buildCommand`, `startCommand`,
`branch`, `repo`, `plan`, `region`, `autoDeploy`, `envVars` are accepted). The
CTO needs to either:

(a) Run the create via the Render dashboard with `rootDirectory` set manually, OR
(b) Run a curl-based create against `https://api.render.com/v1/services` with the
    full spec including `rootDir`, OR
(c) Use the MCP tool to create the service with the basic spec, then PATCH the
    service via dashboard or API to set `rootDir`.

Proposed CTO command pattern (option b, cleanest):

```bash
# CTO: source RENDER_API_KEY from .env, then:
curl -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web_service",
    "name": "sealed-press",
    "ownerId": "<concise team owner id>",
    "repo": "<repo url, same as concise service>",
    "branch": "main",
    "autoDeploy": "yes",
    "serviceDetails": {
      "env": "node",
      "plan": "free",
      "region": "oregon",
      "rootDir": "companies/concise-sealed",
      "envSpecificDetails": {
        "buildCommand": "npm install && npm run build",
        "startCommand": "npm start"
      }
    }
  }'
```

Env vars are added in a follow-up call (or via dashboard) — CTO copies whichever
SEALED needs from the existing `concise` service. Do NOT include any env vars
that are Concise-specific (e.g. Concise-only Stripe accounts, future Concise
analytics keys).

---

## 6. Acceptance criteria (Pipeline Validator checks)

A Pipeline Validator run for CON-40 closure passes when ALL of the following are
true:

1. ✅ `companies/concise-sealed/` exists with at minimum `app/page.tsx`,
   `package.json`, `next.config.js`. Builds locally with `npm install && npm run build`.
2. ✅ A Render service named `sealed-press` exists in the Concise Render
   project, deployed from `main`, `rootDirectory = companies/concise-sealed`,
   most recent deploy is `live`.
3. ✅ The new service URL (`https://sealed-press.onrender.com/` or whichever
   Render assigned) loads the SEALED hero page. `curl -s <url> | grep -i "concise"`
   returns 0 matches in user-visible HTML (footer credit referencing
   "Published by Concise Enterprises" can be removed or replaced with "Published
   by SEALED Press" — CTO's call, but no "Concise Books" branding visible).
4. ✅ A 301 redirect exists from `https://concise-8jmf.onrender.com/sealed` →
   the new SEALED Press URL. `curl -sI <old url>` returns `301` and `Location:`
   pointing at the new service.
5. ✅ `companies/concise/app/sealed/` directory is deleted from the repo (only
   AFTER acceptance criteria 1-4 pass).
6. ✅ This document (`companies/concise/sealed-imprint-plan.md`) is unchanged
   from the version locked at CEO approval, OR has a "Post-implementation
   addendum" section appended documenting any deviations.

---

## 7. Child issue handoff

Implementation work is delegated to the CTO via a child issue under CON-40.
That issue carries the migration + Render service creation tasks. CEO does not
write the application code; the CTO owns it.

The CEO retains responsibility for:
- Approving any deviation from this plan.
- Approving moving from Phase 1 (free `*.onrender.com`) to Phase 2 (paid domain).
- Deciding whether to fold SEALED Press back into Concise if the imprint
  doesn't get traction within 60 days of launch (under expanded pivot authority).

---

## 8. Pivot authority context

This plan was authored under the expanded pivot authority granted in CON-40
§ "Part 2: You have authority to evolve the company" (founder direction
2026-05-03 ~18:00 ET). Specifically:

- The decision to make SEALED a separate sub-brand with its own publishing
  imprint name (rather than "another Concise product line") is an exercise of
  the "splitting product lines into separate sub-brands when traction signals
  warrant" clause.
- The decision to defer paid domain spend until 5 direct sales is an exercise
  of normal CEO budget discipline (not a pivot — just risk-managed sequencing).
- No founder approval was sought for the imprint name or the migration plan
  per CON-40's explicit "No founder approval needed" instruction.
- The decision IS being documented in `SESSION_DECISIONS.md` per CON-40's
  "Document the pivot" requirement.

---

## 9. Out of scope for CON-40

- Lemon Squeezy variant ID creation (CON-25 — externally blocked on founder
  action; tracked separately).
- SEALED book content edits, cover refresh, audio edition production.
- Brand & Marketing collateral for SEALED Press as an imprint (logo,
  publisher's mark, about-the-imprint copy beyond the working tagline). Can be
  filed as a follow-up issue once the new service is live and the imprint
  has somewhere to "live" visually.
- Email drip course (CON-17 territory).
- Any Concise-Books-side rebranding. Concise stays Concise.

---

**Plan locked by CEO 2026-05-03 ~20:15 ET. Pipeline Validator runs once CTO
ships.**
