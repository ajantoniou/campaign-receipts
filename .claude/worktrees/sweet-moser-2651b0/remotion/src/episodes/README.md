# Remotion episode folders (founder lock 2026-05-23)

**Rule:** One folder per storyboard slug under `remotion/src/episodes/<slug>/`.  
**Never** render CR or SEALED clips through bare `CountUp` / `ChartBar` ids in `Root.tsx` — those inherit wrong defaultProps from other episodes (Iran uranium labels, Adelson captions, etc.).

## Layout

```
remotion/src/episodes/
  _template/compositions.ts     ← copy for new episodes
  cr-bell-bush-aipac-primary/   ← MO-1 Bush episode
  cr-massie-gallrein-primary/   ← KY-4 Massie episode
  sealed-aipac-iran-deal-v7/    ← Iran LF (uranium ChartBar lives HERE only)
  lib/                          ← shared helpers, not episode-specific defaults
  registry.ts                   ← import every shipped episode
```

Shared React components stay in `remotion/src/compositions/`.  
Episode folders only **register** which components this slug may use and with what **empty** defaults.

## Pipeline

| Step | Tool |
|------|------|
| Scaffold new episode | `python3 scripts/pipeline/scaffold-remotion-episode.py --slug cr-foo` |
| Storyboard field | `"remotion_episode": "cr-foo"` (defaults to `slug` if omitted) |
| Render | `render-remotion.mjs --slug cr-foo --composition CountUp` → `cr-foo__CountUp` |
| QC gate | `remotion-episode-qc.py --storyboard …` (production-qc gate 7c) |

## Text cards

Same rule: election overlays use `cr-election-margin` in `render-text-cards.mjs`, not shared `bar2` (Iran-only).
