# THE BIBLE — Curated Wisdom for the Portfolio

**Read this before doing anything customer-facing.** Evergreen rules
for any Claude session operating in the AgentCompanies portfolio.

> **Note 2026-05-21:** The Paperclip + Chief-of-Staff multi-agent layer
> was deprecated. Sections referencing CoS authority, CEO-per-company
> heartbeats, hourly cron, briefing discipline, and model-assignment-by-role
> have been removed. The operating model is now one Claude Code session
> per work block + subagent experts on demand. The *rules* below are
> independent of the orchestration model and still apply.

---

## 1. Hard rules (NEVER violate without explicit founder approval)

### 1a. FACELESS

The founder is a private person. Across the entire portfolio:

❌ NEVER founder face/voice/real name in any video, voice content,
about page, podcast, livestream, or social profile.

✅ AI avatars (HeyGen / Synthesia), AI voiceover (ElevenLabs / Claude
audio), text-on-screen, animation, b-roll voiceover-only, branded
handles (`@concise_reads`, not `@alex_antoniou`).

If a deliverable proposes founder's face, voice, or real name → BLOCK.
Default answer is NO.

This is a differentiator, not a limitation. Most indie hackers must
be the face. We don't.

### 1b. PSEUDONYM (Concise specifically)

Founder identity is ALWAYS pseudonym in any Concise marketing,
product, copy, or design. Especially the Trump book. If a deliverable
proposes "let's add MD credentials for trust" → BLOCK.

About-page copy describes BRAND mission, not founder bio. No author
photos.

### 1c. NO HIPAA / no medical advice (HealthBrew specifically)

Educational, NOT medical. No diagnoses. No "you have X" language. Use
"your value is in/out of typical reference range" framing. Avatar-
based — never collect PII (no first/last name, SSN, address). Email +
chosen avatar name only.

### 1d. NO anti-Semitic framings (Campaign Receipts specifically)

AIPAC / lobby-funding content presents campaign-finance data as facts;
readers draw conclusions. Don't editorialize. Don't cherry-pick to
support a narrative. No Twitter dunks on specific politicians.

### 1e. NT-only theology (NT Ministry specifically)

NT-only theology — no OT-driven talking points except as a deliberate
"contrast / love-based reframe" wedge. No medical or investment
advice.

### 1f. Trademark

Founder paid for trademark cert SECT08-5159424 (Concise Reads, valid
2022-2027) but it's a sunk asset, NOT sacred. Brand assets can be
replaced if better positioning exists. Don't over-anchor on existing
covers.

---

## 2. Hard money rules

| Rule | Cap | Trigger |
|---|---|---|
| Default Anthropic plan | Pro flat-rate (covers all Claude tokens) | n/a |
| Per-company monthly cap | $500 | Tier 1 ($200 Concise/VC), Tier 2 ($300 NTM), Tier 3 ($50 HB) |
| Domain purchases (Cloudflare) | $25/yr/domain max, 1/day cap without explicit founder approval | Use `infrastructure/scripts/buy-domain.py --confirm` |
| Image-gen API spend | $5/day across portfolio (until founder raises) | Logged at `infrastructure/scripts/.image-gen-costs.jsonl` |
| Render plan | Free tier always; Starter ($7/mo) only with founder approval | n/a |
| Supabase | $10/mo Pro tier shared (already paid); upgrade requires founder approval | n/a |
| Lemon Squeezy fees | Built into per-sale (5%); no additional spend | n/a |
| New paid SaaS | $0 without founder approval | Ask founder explicitly |

**Pro plan does NOT cover image-gen API calls** — those route through
Anthropic / OpenAI / Grok APIs and ARE metered. Track every call.

---

## 3. Anti-patterns banned

### 3a. Recovery loops

When you self-block on an issue, do NOT:
- ❌ Create child issue called "Recover stalled issue X"
- ❌ Write multiple files (`X_CLOSURE.md`, `X_CLOSURE_VERIFICATION.md`,
  `X_FINAL_CLOSURE.md`, `X_RECOVERY.md`...) about the same blocker
- ❌ Mark blocked then re-run as if blocker self-resolves

INSTEAD:
- ✅ One-line note on what's blocking
- ✅ Move to next unblocked task
- ✅ Surface real blockers to founder in `FOUNDER_ACTIONS.md`

### 3b. "Founder action required" docs

If you have credentials in `.env` and the API works, you do the work.
Don't write a 200-line doc explaining what founder should do. Run
the pre-blocker checklist first:

1. Is the credential in `.env`?
2. Does the resource already exist? (Hit the API.)
3. Different tool / different approach available?
4. What would a senior engineer just do?

If genuinely blocked on founder, ONE LINE in `FOUNDER_ACTIONS.md`.

### 3c. Markdown narration instead of action

Don't write closure/status documents in lieu of doing the work.
Ship the change; document only what's load-bearing for future-you.

---

## 4. Image-gen workflow

Claude.ai's image generation requires human-in-the-loop. Midjourney
requires Discord. Both can't be called from agent code.

**Two paths:**

### 4a. Founder-loop (preferred when not time-critical)
1. Drop image prompt to `companies/<co>/design/image-prompt-queue.md`
2. Founder runs in Claude.ai or Midjourney → drops images in `companies/<co>/design/assets/`
3. Wire images into pages

### 4b. API-loop (when automation needed)

`infrastructure/scripts/generate-image.py` routes through Anthropic /
OpenAI / Grok APIs (keys in `.env`). Cost-tracked. Capped at $5/day
portfolio-wide.

**Always check the cost log before queueing dozens of generations.**

---

## 5. Browser access

Three tools available — pick by context:

### WebFetch (always available)
Built-in Claude Code tool. Fetch any public URL → returns rendered markdown. Zero setup. **Use this for:** competitor research, reading articles/docs/announcements, scraping public content.

### Playwright MCP (headless, always-on)
Installed at user scope (`mcp__playwright__*` tools). Real browser automation: navigation, click, type, scroll, screenshot, form-fill. Headless. **Use this for:** multi-step flows, JS-heavy pages WebFetch can't render, automated form-fill, screenshot a page state.

### Claude in Chrome MCP (extension-driven, rarely used)
Only works when founder's Chrome is open with the extension installed. **Use only when** founder is actively at the desk reviewing a page in real-time with you, or for multi-step OAuth flows requiring founder click-through.

**Default workflow:** Playwright MCP for everything. Founder gives async feedback later.

---

## 6. Goal-first thinking

Bucket every issue under a goal. Lead with **"this week's goal + progress"**, NOT "list of in-flight issues." 10 goals × 100 issues each is comprehensible. 1000 raw issues is not.

---

## 7. Brand handles + email aliases

Brand social handles use `antonioualfred+<company>@gmail.com` aliases:
- `antonioualfred+concise@gmail.com`
- `antonioualfred+ntministry@gmail.com`
- `antonioualfred+healthbrew@gmail.com`

Email-verification counts as "human" verification per founder. Some
platforms (TikTok / Reddit / X) may strip `+aliases` — test one
platform end-to-end before standardizing.

Founder action required: set up Gmail filter rules to label
incoming alias mail per company.

---

## 8. Faceless content references (visual style guides)

When designing NT Ministry / Concise / VC content for video:
- **After Skool** — animated philosophy/theology (NT Ministry model)
- **Pursuit of Wonder** — text-on-screen poetic narration (NT Ministry alt)
- **Kurzgesagt** — bright animation + complex topics (HealthBrew educational reference)

When designing Trump book / political imagery (Concise):
- Vintage 2016-era campaign poster aesthetic
- "Time capsule" / sealed-envelope archive imagery
- Document/redacted-reveal aesthetic
- American iconography reframed as historical artifact
- NEVER founder face

---

## 9. Founder behavior signals

Founder pushes back HARD on:
- Hand-wavy reasoning, "should work," numbers without source
- Treating his decisions as up-for-debate after he made them
- Bundling unrelated changes into one commit
- Token-burning agentic loops with no signal
- "Founder action required" docs for things you can do yourself

Founder approves of:
- Concrete recommendations with explicit trade-offs and a recommendation
- "Here's what I'd do, here's why, your call"
- Conversational tone, treating him like a colleague
- Self-discipline and admitting uncertainty
- Specific evidence (file paths, line numbers, API responses)

Founder has 9 prior startups, 8 failures. Real money on the line. Don't burn his money. Don't burn his time. Don't condescend.

---

## 10. Portfolio thesis

Pieter Levels-style "many shots." Founder watched a video of an indie hacker generating $850K/yr from 35 apps where only 4 are profitable.

- Per-company variable cost: ~$10/yr (domain only) until revenue justifies more
- Shared infrastructure: one Supabase project + per-company schemas; one Lemon Squeezy store + per-company products; one Gmail with aliases per brand
- Scale up an individual company ONLY when it shows real customer signal

The active companies are early shots. Not all will succeed. The system is designed to spin up new shots cheaply when a current one proves dead.

---

## 11. Open source licensing + IP protection playbook

When building on AGPLv3 or other copyleft OSS foundations (Ghostfolio, Comp AI, Metabase, etc.):

### Architecture rule (do this always)
Build the proprietary agent/billing/UX layer as a **separate service** that calls the OSS via its own HTTP API. Never modify the OSS codebase directly. AGPL copyleft only covers modifications to the licensed code — a separate service communicating via API is not a modification. This is free forever and requires no commercial license.

### Commercial license trigger: 10 paying customers
At 10 customers, email the OSS maintainer and negotiate a commercial license. Typical cost: $500–5K/yr depending on project. At that revenue level it's <1 month of MRR. Contact pattern: GitHub maintainer DM or project website "Enterprise" link.

### Your proprietary IP is always yours
AGPLv3 does not affect your agent logic, prompts, customer schema, billing code, or UX. Those are trade secrets from day 1. No registration needed — just don't publish them.

### Trademark the brand name at ~$5K MRR
USPTO filing: ~$250–350/class. File when you have a real product with traction. Do not file speculatively — wasted money pre-revenue.

### Copyright registration (optional)
Automatic on creation, but register at copyright.gov (~$65/filing) once you have a shipping product if you want litigation standing. Not urgent pre-revenue.

---

## 12. North star

> **Acquire customers. Be profitable.**

If a task doesn't ladder back to a paying customer, push it later.
Move fast, learn from the market, channel work toward revenue.
Be one of the four winners.

---

## 13. Security audit & hardening

All customer-facing sites must pass the security checklist before launch and quarterly thereafter.

**Reference:** [`SecurityAudit/README.md`](SecurityAudit/README.md) — findings, self-audit checklist, and hardening guide.

Key rules (see [`SecurityAudit/HARDENING_GUIDE.md`](SecurityAudit/HARDENING_GUIDE.md) for details):
- Health endpoints return `{"status":"ok"}` only — no buildId, service name, or env inventory.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never in `NEXT_PUBLIC_*` vars. Never imported in client components.
- All webhook handlers validate HMAC signatures with `timingSafeEqual` + reject events older than 5 minutes.
- All public POST endpoints (subscribe, waitlist, contact) must be rate-limited.
- All `next.config.js` files must use `withSecurityHeaders()` from `shared/config/security-headers.js`.
- robots.txt and sitemaps use public domain URLs, never internal/origin URLs.
- Redirect targets from user input must be validated (no open redirects).

---

*Last curated: 2026-05-21 (Paperclip + CoS layer deprecation — orchestration sections removed; evergreen rules preserved).*
