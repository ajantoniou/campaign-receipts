---
name: claude-remotion
description: |
  React-based programmatic video for the AgentCompanies portfolio.
  Trigger when a video needs animated information design — count-ups,
  money-flow diagrams, timelines, verdict stamps, bar charts, source
  cards — rather than a fal generative still + ken-burns. $0 marginal
  per render via local node; portable to a Render web service when
  daily volume justifies it. Canonical project lives at the monorepo
  root `/remotion/`.
triggers:
  - "remotion"
  - "animated chart"
  - "money flow"
  - "count up animation"
  - "timeline animation"
  - "verdict stamp"
  - "programmatic video"
  - "animated infographic"
  - "source card animation"
---

# claude-remotion

**For when information must MOVE.**

The fal generative pipeline (Sora, Veo, Kling, FLUX-stills+ken-burns)
is the wrong tool for animated information design — charts, timelines,
money flow, count-ups. Use Remotion for those. $0 per render.

## When to invoke

Use Remotion (this skill) when the storyboard clip is:
- An animated chart (bars filling, lines drawing)
- A money-flow / org-chart / network diagram
- A timeline with sequential event reveals
- A count-up of a dollar / stat figure
- A verdict stamp (KEPT / BROKEN / PARTIAL) reveal
- A citation / source pull-quote card

Use **fal** (not this skill) when the clip is:
- Photoreal human-looking video (Sarah anchor, talking head)
- Atmospheric b-roll
- Anything where the realism of generative video matters

## What's available

Canonical project: `/Applications/DrAntoniou Projects/AgentCompanies/remotion/`

Compositions in `src/compositions/`:

| ID            | Required props                       | Default duration |
| ------------- | ------------------------------------ | ---------------- |
| `CountUp`     | `to`                                 | 5s               |
| `MoneyFlow`   | `source`, `destinations[]`           | 6s               |
| `Timeline`    | `events[]`                           | 8s               |
| `VerdictStamp`| `verdict`                            | 4s               |
| `ChartBar`    | `bars[]`                             | 6s               |
| `SourceCard`  | `citation`, `quote`                  | 5s               |

All accept optional `brand`:
`"sealed" | "campaign-receipts" | "nt-ministry" | "estimateproof"`.

Full prop schemas in `reference/COMPOSITIONS.md`.

## How to render (from any company pipeline)

```bash
node scripts/pipeline/render-remotion.mjs \
  --composition MoneyFlow \
  --duration 6 \
  --props '{"source":{"name":"Adelson","amount":82000000},"destinations":[{"label":"Iran deal killed"}]}' \
  --out _build/<slug>/clips/<id>.mp4
```

Outputs 1280×720 @ 30fps h264 mp4 → drops into
`produce-from-storyboard.py` with no further normalization.

If the calling company doesn't have an adapter yet, copy
`companies/campaign-receipts/scripts/pipeline/render-remotion.mjs`
to the sibling company. The adapter is generic — only the directory
depth to monorepo root differs.

## How to pick a composition

1. **What's the storyboard clip trying to communicate?**
   - "X dollars went somewhere" → `MoneyFlow`
   - "this big number" → `CountUp`
   - "things happened in this order" → `Timeline`
   - "did they keep the promise" → `VerdictStamp`
   - "compare these N things" → `ChartBar`
   - "here's what the book / FEC filing said" → `SourceCard`

2. **Read the prop schema in `reference/COMPOSITIONS.md`.**

3. **Render via the adapter.** Inspect the mp4. If it doesn't fit, edit
   props and re-render (idempotent, free).

## Adding a new composition

If you need a shape that doesn't exist yet:

1. Add `/remotion/src/compositions/<Name>.tsx` (or
   `cr-<name>.tsx` / `sealed-<name>.tsx` if brand-specific).
2. Register in `/remotion/src/Root.tsx`.
3. Update `reference/COMPOSITIONS.md` here.
4. Update the catalog table in `/remotion/README.md`.

Use Remotion hooks (`useCurrentFrame`, `useVideoConfig`,
`interpolate`) and the brand tokens at `/remotion/src/brand/tokens.ts`.
Never hard-code colors / fonts — pass through `resolveBrand(brand)`.

## Storyboard wiring

In `eng/storyboards/<slug>.json`:

```json
{
  "id": "s6-02",
  "duration_s": 6,
  "vo_text": "...",
  "model": "remotion",
  "composition": "MoneyFlow",
  "props": { "source": {...}, "destinations": [...] }
}
```

When `model: "remotion"`, `produce-from-storyboard.py` routes to
`render-remotion.mjs` instead of fal.

## Hard rules

- **No hard-coded colors / fonts** in compositions — go through brand tokens.
- **No `npm install` inside companies/** — install only in `/remotion/`.
- **No new compositions without a Root.tsx registration** — orphan
  components break studio + CLI.
- **Cited numbers MUST appear in storyboard `cited_figures[]`** even
  for Remotion clips. Fact-check QC still runs.
