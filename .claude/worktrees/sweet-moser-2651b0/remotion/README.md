# /remotion — AgentCompanies portfolio Remotion pipeline

**Canonical React-based programmatic video for the whole portfolio.**
$0 marginal per render (local node) until daily volume justifies the
Render-hosted renderer.

## What this is

A single Remotion 4.x project at the monorepo root. Every portfolio
company (campaign-receipts, concise-sealed, nt-ministry, …) renders
animated information graphics by invoking compositions registered here.

Compositions accept props via Remotion's `inputProps` so they can be
driven from CLI or from any pipeline script. **All renders default to
1280×720 @ 30fps h264 mp4** — drops directly into the existing
`produce-from-storyboard.py` driver without re-encoding.

## Composition catalog

Each composition lives in `src/compositions/*.tsx` and is registered in
`src/Root.tsx`. Use `--props` (CLI) or `defaultProps` (studio) to drive
them.

| ID            | Purpose                                           | Required props                                  |
| ------------- | ------------------------------------------------- | ----------------------------------------------- |
| `CountUp`     | Animated $0 → $X with easing, prefix/suffix       | `to`                                            |
| `MoneyFlow`   | Source → multiple destinations with arrows        | `source`, `destinations[]`                      |
| `Timeline`    | Horizontal timeline, sequential event reveals     | `events[]`                                      |
| `VerdictStamp`| Stamp drop with rotation + impact shake           | `verdict`                                       |
| `ChartBar`    | Animated bar chart, bar-by-bar fill               | `bars[]`                                        |
| `SourceCard`  | Parchment citation card with pull-quote           | `citation`, `quote`                             |

All compositions accept an optional `brand` prop:
`"sealed" | "campaign-receipts" | "nt-ministry" | "estimateproof"`.
Defaults to `"sealed"`.

## How to render

### From any pipeline (recommended)

Each company gets a tiny adapter shell script that calls the root
project. For campaign-receipts:

```bash
cd companies/campaign-receipts
node scripts/pipeline/render-remotion.mjs \
  --composition MoneyFlow \
  --duration 6 \
  --props '{"source": {"name": "Adelson", "amount": 82000000}, "destinations": [{"label": "Iran deal killed"}]}' \
  --out _build/<slug>/clips/<id>.mp4
```

### Directly (debugging)

```bash
cd remotion
npm install   # first time only
npx remotion render src/Root.tsx MoneyFlow ../out.mp4 \
  --props='{"source":{"name":"Adelson","amount":82000000},"destinations":[{"label":"X"}]}' \
  --frames=180   # 6s @ 30fps
```

### Studio (interactive)

```bash
cd remotion
npm run studio
# Opens http://localhost:3000 with hot reload + composition picker
```

## Adding a new composition

1. Create `src/compositions/<Name>.tsx`. Use Remotion hooks
   (`useCurrentFrame`, `useVideoConfig`, `interpolate`) — never global
   browser APIs.
2. Register in `src/Root.tsx` with a `<Composition id="<Name>" …>` entry,
   default dimensions 1280×720 @ 30fps, and meaningful `defaultProps`
   for studio preview.
3. Update the catalog table in this README + the catalog in
   `~/.claude/skills/claude-remotion/reference/`.
4. If the composition is brand-specific (e.g. SEALED-only artwork),
   prefix the filename `cr-<name>.tsx` (campaign-receipts),
   `sealed-<name>.tsx` (sealed), etc.

## Brand tokens

`src/brand/tokens.ts` mirrors each company's brand book / tailwind
config. Keep in sync with the source — these are not duplicates, they
are the *video* expression of the same tokens.

## Why monorepo-canonical

- One install (`npm install` in `/remotion/`) covers every company.
- One place to upgrade Remotion when 4.5 ships.
- Cross-company composition reuse without symlinks.
- Per-company specifics still possible via `cr-*.tsx` / `sealed-*.tsx`
  prefixed compositions.

## Hosting on Render

See `/render-remotion-renderer.yaml` at the monorepo root for the
proposed Render web service. Free for now — local node renders are
fine until daily volume hits >10 clips/day.

When the threshold is hit, the adapter switches the URL from local
`npx remotion render` to an HTTP POST against the Render service.
Same JSON contract.
