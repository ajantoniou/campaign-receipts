---
name: agent-companies-design
description: Design system, methodology, and component vocabulary for the AgentCompanies portfolio (Campaign Receipts, SEALED 2016, EstimateProof, and sibling agent-company sites). Invoke when the user asks to build, redesign, restyle, or extend any marketing page, product surface, share graphic, or component for any of these sites — or to launch a new sibling agent-company site that should match the family aesthetic. Provides the "audit document / paper-receipt" benchmark, drop-in design tokens, type pairing, component anatomies (Receipt, Stamp, StatTile, Leaderboard, MethodCard, ShareTile, etc.), screenshot-share artifact patterns, and the design-exploration workflow (questions → declared system → build → handoff).
---

# AgentCompanies — Design System & Methodology Skill

A reusable Claude Code skill that encodes the design language, component vocabulary, and design-exploration workflow used across the AgentCompanies portfolio (Campaign Receipts, SEALED 2016, EstimateProof, …).

The goal: **every agent company in the portfolio should look modern, friendly, and structurally trustworthy** — not a generic SaaS landing page. The shared metaphor is the **audit document** (paper receipt, methodology worksheet, source ledger). Trust comes from looking like primary-source paperwork. Virality comes from designing every stat, quote, and verdict as a self-contained social-share artifact with attribution baked into the crop.

---

## When to invoke this skill

Invoke automatically whenever the user is working on **any AgentCompanies site** and asks to:

- Build, redesign, or restyle a **page** (landing, pricing, about, methodology, profile, detail, corrections log, dashboard)
- Build or extend any **component** in the family vocabulary (Receipt-style cards, verdict Stamps, StatTiles, Leaderboards, MethodCards, QuoteTiles, ShareTiles)
- Generate **OG/social share images** or "screenshot-worthy" stat/quote graphics
- Launch a **new sibling agent-company site** that should match the family benchmark
- Add a feature that needs to feel consistent with the rest of the portfolio

Also invoke when the user mentions:
- *"audit document"*, *"paper receipt"*, *"verdict stamp"*, *"primary source"* aesthetic cues
- *"benchmark"*, *"family"*, *"sibling sites"*, *"design system across agent companies"*
- Any of: **Campaign Receipts**, **SEALED 2016**, **EstimateProof**, **AgentCompanies**

---

## Workflow — how to design like the benchmark

Follow this in order. The methodology matters as much as the visual output.

### 1. Ask first, design second

Before writing any code, ask the user the **core design-exploration questions**. See `PROCESS.md` for the canonical question set. At minimum confirm:

- Which surface (landing? full marketing site? product UI? share tiles?)
- What the screenshot-worthy moment is (the viral artifact)
- Which trust signals matter (press, customer logos, sample receipt, methodology, founder note, corrections log)
- Whether they want variations and on which dimensions

Don't skip this for "small" changes — even a hero rewrite benefits from a 30-second question round.

### 2. Declare the system out loud

Before building, write a short paragraph in your reply stating the specific choices you're committing to: palette, type pairing, metaphor, visual rhythm. Treat it like a junior designer pitching to a manager. This lets the user catch a wrong direction in 10 seconds instead of after you've built six artboards.

For sites in the family, the default declarations are:
- **Metaphor**: paper audit document (perforated edges, dotted leaders, dashed dividers, verdict stamps)
- **Palette**: warm cream paper (`--paper #FAF6EF`) + deep ink + the 5-color verdict spectrum (sage / amber / coral / slate / olive — explicitly nonpartisan)
- **Type**: Instrument Serif (display) + Geist (body) + Geist Mono (data/meta)
- **Voice**: editorial, dry, source-cite-y. Never partisan. Never moralizing.

Vary tints and copy per company, but keep the bones.

### 3. Build with the family components

Use the component vocabulary in `COMPONENTS.md`. Don't invent new card patterns when a Receipt or StatTile already covers the use case. Anatomy details (perforated edges, dashed dividers, the tilted-stamp variant) are signature — preserve them in every implementation.

### 4. Design every viral surface as a self-contained share artifact

Any stat, quote, leaderboard row, or verdict that's notable enough to be a hero element on a page is **also** a candidate for a 1080-sized share tile. When you build one, build both. The share tile must include the wordmark + URL inside the crop area. See `share-tile` patterns in `references/campaign-receipts-share-tiles.jsx`.

### 5. Produce a handoff document

When the user wants to take the design to Claude Code or an engineering team, produce a `design_handoff_<feature>/` folder containing:
- `README.md` with tokens, component anatomies, screen specs, responsive rules
- `source/` copies of the HTML/JSX/CSS reference files
- A note that the HTML is a **specification**, not production code

See `PROCESS.md` § Handoff for the canonical README structure.

---

## Hard rules (non-negotiable across the family)

These are the rules that make the portfolio feel like a portfolio. Break them only with explicit user override.

1. **Type pairing is fixed**: Instrument Serif + Geist + Geist Mono. Load from Google Fonts. Avoid Inter, Roboto, Arial, Fraunces, system fonts.
2. **Verdict palette stays nonpartisan** — sage/amber/coral/slate/olive. Never use saturated red/blue political coding.
3. **Mono micro-caps everywhere** — eyebrows, IDs, dates, table headers, footer marks. 10–11px, uppercase, 0.14–0.18em letter-spacing, `--ink-3`. This is the recurring "audit document" texture.
4. **No emoji. No gradients** (besides the dotted-grid hero pattern). **No saturated brand color.** Chroma stays under 0.07 across the palette.
5. **Receipts always have perforated edges** (`radial-gradient` pseudo-elements) and **dashed dividers** between sections. Stamps always have a **tilted, double-border "rubber stamp"** variant available. Keep these signature details.
6. **Every share artifact carries its own attribution** — wordmark + URL inside the crop. The whole point is that an influencer's screenshot still says where it came from.
7. **All politician/customer data shown is placeholder** unless wired to a real DB. Voice stays editorial — never editorialize, always cite.
8. **CSS grid/flex with `gap`** for all layout. Never bare inline siblings with whitespace.
9. **Mobile hit targets ≥ 44px. Body text never under 14px.**

---

## Files in this skill

```
SKILL.md                — This file (entry point + workflow + rules)
PROCESS.md              — Design-exploration methodology: question set, system-declaration template, handoff README template
DESIGN_BENCHMARK.md     — The full audit-document benchmark: tokens, type scale, palette rationale, voice cues
COMPONENTS.md           — Component anatomies (Receipt, Stamp, StatTile, Leaderboard, MethodCard, QuoteTile, ShareTile)
tokens.css              — Drop-in CSS custom properties for every design token
references/             — Canonical visual references from Campaign Receipts (treat as spec, not code)
  campaign-receipts-styles.css       — All component CSS (most accurate source for spacing/anatomy)
  campaign-receipts-components.jsx   — Reusable React primitives
  campaign-receipts-landing.jsx      — Landing page composition
  campaign-receipts-pricing.jsx      — Pricing page composition
  campaign-receipts-about.jsx        — About / methodology composition
  campaign-receipts-share-tiles.jsx  — 1080-sized social share tile renderers
```

**Reading order on first use:** `SKILL.md` (this file) → `DESIGN_BENCHMARK.md` (the visual system) → `COMPONENTS.md` (anatomies) → `PROCESS.md` (workflow) → reference files as needed.

---

## Per-company customization

Each agent company keeps the bones (type pairing, perforated receipts, mono micro-caps, share-tile philosophy) and varies:

| Aspect | Vary per company? | Notes |
|---|---|---|
| Paper palette (warm / cool / sage)     | ✓ | Pick one per site, never mix within a site |
| Verdict colors                          | ✗ | Keep the same 5 across the portfolio |
| Type pairing                            | ✗ | Family-wide |
| Wordmark style                          | ✓ | Each site has its own wordmark — share the typography |
| Receipt copy / field names              | ✓ | "Promise" → "Estimate" → "Pledge" per company |
| Verdict labels                          | ✓ | "Kept / Partial / Broken" → "Met / Off / Over" per use case |
| Hero metaphor (book? ledger? worksheet?)| ✓ | Use the audit-document family; pick the right document |
| Voice                                   | mostly ✗ | Stay dry, editorial, source-citing; humor is rare and ironic |

When starting a new sibling site, run `PROCESS.md` § "Launching a sibling site" — it walks through the variables to lock per company before building.

---

## Anti-patterns — what NOT to do

- Don't add hero gradients, neon colors, or "AI sparkle" effects.
- Don't reach for an icon set (Lucide/Heroicons/etc.) as filler. The system runs on **type + mono labels + paper texture**. Iconography appears only when functionally necessary.
- Don't recreate generic SaaS landing tropes (testimonial carousels with floating dots, multi-step animated CTAs, gradient mesh backgrounds, three-column "Features" with circle icons).
- Don't shrink the Receipt below 320px wide — render the simple-list fallback instead.
- Don't editorialize copy on political content. The product's whole value prop is non-partisanship through structure.
- Don't invent new card patterns when an existing primitive covers it. New primitives need explicit user buy-in.
