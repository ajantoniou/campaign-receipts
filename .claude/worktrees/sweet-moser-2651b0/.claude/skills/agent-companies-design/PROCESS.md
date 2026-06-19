# Design Process — AgentCompanies

The workflow for designing any surface in the AgentCompanies portfolio. Read this once; reuse for every project.

## Stage 1 — Ask

Before writing any code, ask the user a focused round of questions. Adapt the set below to the situation. Skip only for genuinely trivial tweaks.

### Canonical question set

**Always ask:**
1. **Context** — what does this product actually do, in one paragraph? Who's the user? What's the core action?
2. **Scope** — which surface(s)? (Landing? Full marketing site? Product UI? Share graphics? Email? Pitch deck?)
3. **Viral artifact** — what's the screenshot-worthy moment? (Big stat? Receipt card? Leaderboard row? Quote tile? Before/after?)
4. **Trust signals** — which prominent? (Press, customer logos, concrete numbers, testimonials, security badges, founder note, sample receipt above fold, corrections log?)
5. **References** — which sites' look do they admire? (Mercury, Linear, Ramp, Stripe, Vercel docs, NYT, ProPublica, etc.)
6. **Variations** — how many directions to explore? Which axes (color, type, layout, interaction, copy)?
7. **Voice** — dry-witty / warm-human / bold-confident / earnest-expert?

**Ask when relevant:**
8. **Palette direction** — warm paper / cool grey / sage / rose / blue tint?
9. **Sibling sites** — any other companies in the portfolio this should match?
10. **Copy** — placeholder OK, or do they have real copy?
11. **Logo** — existing wordmark, or design one?

### Question UX

Use the `questions_v2` tool (or Claude Code's equivalent) with:
- `text-options` with multi-select for trust signals + viral artifacts
- `svg-options` for palette direction (render swatch SVGs ~80×56)
- `slider` for variation count (1–5, default 3)
- `freeform` for context, references, sibling sites
- `file` for logo upload

Always include "Decide for me" + "Explore a few options" + "Other" for text-options. **Ask 8–12 questions, never just 3.** The cost of one extra question is far less than the cost of a wrong direction.

## Stage 2 — Declare the system

Before writing code, write a 3–5 line paragraph in your reply stating the specific choices you're committing to. Format:

> **The system I'm committing to:**
> - **Metaphor**: <one line — what mental model anchors the design>
> - **Palette**: <named tokens + the 4–5 verdict/accent colors>
> - **Type**: <display + body + mono pairing>
> - **Viral surface**: <how the screenshot moment works>

This is the contract. The user can red-flag a wrong direction before you've spent 30 minutes building.

For the AgentCompanies family, the default declarations are:
- **Metaphor**: paper audit document (perforated edges, dotted leaders, dashed dividers, verdict stamps)
- **Palette**: warm cream paper + deep ink + 5-color verdict spectrum (sage/amber/coral/slate/olive, nonpartisan)
- **Type**: Instrument Serif (display) + Geist (body) + Geist Mono (data/meta)
- **Viral surface**: every notable stat/quote/verdict is also a 1080-sized share tile with wordmark+URL baked into the crop

## Stage 3 — Build with the family components

Use the primitives in `COMPONENTS.md`. Don't invent new card patterns when an existing one covers it. Anatomy signature details (perforation, dashed dividers, tilted stamps) are non-negotiable.

### File structure for a new site

```
<site-folder>/
├── styles.css       — Tokens + all component CSS (port from references/)
├── components.jsx   — Primitives (Wordmark, Nav, Stamp, Receipt, StatTile, Leaderboard, MethodCard, Footer)
├── landing.jsx      — Landing composition
├── pricing.jsx      — Pricing composition
├── about.jsx        — About / methodology composition
├── share-tiles.jsx  — Social share tile renderers
└── Redesign.html    — Composite document hosting all surfaces in a design canvas
```

For an existing codebase, port tokens into the user's theme system (Tailwind config, CSS-in-JS theme, design-tokens.json) **before** building components.

## Stage 4 — Iterate visibly

Show the user the WIP file early (after declaring the system + scaffolding the landing hero). Don't wait until everything is "done." Iteration is faster on a half-built page than a finished one.

Use a design canvas (`design_canvas.jsx` starter) to host multiple variations side-by-side. Wrap each variation in a `<DCArtboard>` inside a `<DCSection>`.

Use Tweaks (`tweaks_panel.jsx` starter) to expose live design knobs — palette swap, font pairing, density, copy variants. The user can mix and match without round-tripping a change request through chat.

## Stage 5 — Handoff

When the user wants to take a design to engineering (Claude Code or human dev team), produce a folder:

```
design_handoff_<feature_name>/
├── README.md       — Full spec (see template below)
└── source/         — HTML/JSX/CSS reference files (copy of WIP)
```

Then call `present_fs_item_for_download` so the user can drop the zip into their codebase.

### README template (Handoff)

```markdown
# Handoff: <Feature Name>

## Overview
<one paragraph — what this is, who it's for, the value prop>

## About the Design Files
The files in `source/` are design references created in HTML — high-fidelity prototypes
showing intended look and behavior. They are NOT production code to copy directly.
Recreate these designs in the target codebase using its existing framework and patterns.

## Fidelity
High-fidelity. Reproduce pixel-faithfully. Data shown is placeholder.

## Design Tokens
<full token table — Palette, Verdict colors, Typography, Spacing, Radii>

## Typography
<families + scale: hero/section/card/body/meta>

## Screens / Views
For each screen:
- Name
- Purpose
- Layout (grid, flex, dimensions)
- Components, in reading order, with anatomy details

## Components
<each primitive with anatomy, props, modifiers, states>

## Interactions & Behavior
<hover/active/focus states, animations, navigation flows, keyboard shortcuts>

## State Management
<state variables, transitions, data fetching>

## Responsive Behavior
<breakpoints + per-component fallbacks>

## Assets
<images, icons, fonts, logos — what's in the prototype vs what to swap>

## Files
<list every file in source/ with one-line description>

## Implementation Order Suggestion
<recommended build order — tokens → primitives → pages → server-side renders>

## Open Questions for Your Engineering Lead
<framework choices, infra decisions, DB shape, etc.>
```

## Stage 6 — Verify

Call your environment's verification (e.g. `fork_verifier_agent`) for layout and console checks. Don't proactively screenshot everything — rely on the verifier to catch issues without cluttering context.

---

## Launching a sibling site

When the user wants a new agent-company site to match the family benchmark:

1. **Lock the variables** before building:
   - Paper palette (warm / cool / sage — one per site)
   - Wordmark (typeset in Instrument Serif; create a glyph mark if appropriate)
   - Receipt field names (rename "Promise" → "Estimate" / "Claim" / "Pledge")
   - Verdict label set (rename "Kept/Partial/Broken" if domain calls for it; keep the 5-tier structure)
   - Hero document metaphor (Book? Ledger? Worksheet? Invoice? Court filing?)
2. **Copy the Campaign Receipts files** into a new folder, rename, swap variables.
3. **Run the canonical question set** with the user to confirm the new site's specific context.
4. **Build → iterate → handoff** as above.

Each new site takes ~70% reuse from the previous. The remaining 30% is the per-company voice and metaphor.

---

## Anti-patterns

- **Designing without a declared system.** Always state the bones first. This is what separates senior from junior design.
- **Adding "AI sparkle"** — gradient meshes, neon accents, animated particles, glassmorphism. The portfolio's value prop is structural trust, not novelty.
- **Reaching for an icon set as filler.** Iconography appears only when functionally necessary. Type + mono labels + paper texture do the heavy lifting.
- **Skipping the share-tile question.** If the product makes claims, those claims are screenshot artifacts. Design them as such.
- **Generic SaaS landing tropes** — testimonial carousels with floating dots, three-column features with circle icons, gradient hero meshes, sticky-CTA overlays.
- **Asking three questions and starting to build.** Ask 8–12. The user has more context than you do.
