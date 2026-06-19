---
name: claude-hedra
description: |
  Hedra Character-3 lip-synced talking-head video for the AgentCompanies
  portfolio. Trigger when a video needs a real character delivering VO
  on-camera — intro hooks, presenter beats, outro CTAs, anywhere a viewer
  benefits from seeing a face speak the line. Generates from a single
  portrait reference + an audio clip; ~$0.50-1.00 per 8s clip.

  When NOT to use this skill:
  - Atmospheric / cinematic scenes without a named character → fal Sora 2 / Kling 3 Pro
  - Animated info-design (charts, timelines, money-flow) → claude-remotion
  - Real political figures (Trump, Obama, Adelson, etc.) → Wikimedia photo + ken-burns

  Canonical CR narrator portrait: companies/campaign-receipts/brand/betsy-portrait.png
---

# claude-hedra — Lip-synced talking-head pipeline

Hedra Character-3 (API: `https://api.hedra.com/web-app/public`) generates
~8-second lip-synced talking-head clips from a single portrait reference
+ an audio file. This is the "viral production value" upgrade — it's what
makes CR look like a show with a host, not a slideshow with AI voice.

## When to trigger

A storyboard clip should use Hedra (vendor: "hedra-character3") when:
- A named recurring character delivers a VO line on-camera
- The viewer's retention depends on seeing a face (first 8 seconds of
  any video — Hedra intro hook is non-negotiable for the CR channel)
- The line is a "pivot moment" — donor reveal, verdict announcement,
  CTA — that needs more weight than a static photo + VO can provide

For CR specifically, the four canonical Hedra beats per long-form:
1. **Intro hook (0:00-0:08)** — Betsy delivers the headline shock
2. **Mid-1 (~30-40% mark)** — Betsy reveals the donor / culprit
3. **Mid-2 (~60-70% mark)** — Betsy delivers the verdict line
4. **Outro CTA (last 5-8s)** — Betsy points viewer to sealed2016.com

## API contract (driver invocation)

The `produce-from-storyboard.py` driver supports `vendor: "hedra-character3"`
storyboard clips with these required fields:

```json
{
  "id": "s1-01-hook",
  "vendor": "hedra-character3",
  "duration_s": 8,
  "portrait": "companies/campaign-receipts/brand/betsy-portrait.png",
  "audio": "_build/<slug>/vo-hook.mp3",
  "aspect": "16:9"
}
```

The audio chunk must be pre-extracted from the long-form `vo.mp3` via
ffmpeg so Hedra has just the VO segment for this beat (Hedra derives
output duration from audio length).

## Standalone CLI

```bash
python3 companies/campaign-receipts/scripts/pipeline/hedra-character3.py \
  --portrait companies/campaign-receipts/brand/betsy-portrait.png \
  --audio _build/<slug>/vo-hook.mp3 \
  --duration 8 \
  --out _build/<slug>/clips/betsy-hook.mp4 \
  --aspect 16:9
```

Writes the mp4 + a `.hedra.json` sidecar with the generation_id for cost
tracking.

## Auth

Reads `HEDRA_API_KEY` from `/Applications/DrAntoniou Projects/AgentCompanies/.env`.
Falls back to legacy `NT_HEDRA_API_KEY` (same key, shared portfolio-wide).
Never commit the key — `.env` is gitignored.

## House-style rules (CR brand)

- **Portrait is canonical.** For CR, always use `brand/betsy-portrait.png`.
  Never re-roll a new portrait per video. Brand consistency across all
  145 promise videos depends on Betsy looking like the same person every
  time.
- **No campaign-rally aesthetic.** Hedra's text_prompt should describe
  subtle delivery: "warm conversational, slight head movement, eye
  contact, natural micro-expressions." Avoid: theatrical gestures,
  dramatic emphasis, anchor-stiff posture.
- **Speed matches storytelling cadence.** The audio chunk should be
  ElevenLabs Bella at teacher-cadence settings (stability=0.55,
  similarity=0.75, style=0.15, speed=0.93).

## Cost discipline

- ~$0.50-1.00 per 8s clip (Hedra credits, rough estimate)
- Per long-form video: 4 Hedra beats × $0.80 = ~$3.20
- Per promise video budget: ≤$5 Hedra spend (the other clips are free
  Remotion + ken-burns Wikimedia)
- Hard cap: $13/promise video total
- $500/company cumulative cap (portfolio rule)

## Skill location

Canonical: `shared/skills/claude-hedra/` in the monorepo (travels with
the repo).
Mirror: `~/.claude/skills/claude-hedra/` for harness auto-discovery.

If you edit the skill, edit the repo copy and `cp -R` to `~/.claude/skills/`.
