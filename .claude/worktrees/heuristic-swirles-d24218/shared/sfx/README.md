# Shared SFX library — portfolio sound design assets

Subtle SFX cues for CR / SEALED / NT Ministry / other portfolio video
pipelines. All assets MUST be CC-BY or CC0 with a sibling
`<name>.attribution.json` file preserving the source URL + license.

## Sources

- **Freesound.org** — primary library. Curate cues at CC0 only (no
  attribution-required cues for portfolio scale).
- **Incompetech "Impact Cinematic Hits"** (Kevin MacLeod, CC-BY) —
  tonal stings, tuned to F minor to match the existing music bed.
- **Adobe Audition built-in foley** — where licensed (paper, fabric,
  pen). Document the license per cue.

## DO NOT use

- Epidemic Sound (license excludes our use case)
- YouTube Audio Library (cues are too obviously YT-canon)
- AI-generated SFX (ElevenLabs / Stable Audio) without watermark

## Cue inventory (to be populated)

Each cue lives at `shared/sfx/<name>.wav` (or .mp3) with a sibling
`shared/sfx/<name>.attribution.json`:

```json
{
  "asset": "moneyflow-whoosh-1.wav",
  "license": "CC0",
  "source_url": "https://freesound.org/...",
  "author": "freesound user",
  "downloaded_at": "2026-05-21"
}
```

## Storyboard usage

See `companies/campaign-receipts/personas/sfx-specialist.md` for the
cue rulebook + storyboard JSON shape:

```json
{
  "clip_id": "s5-02b-moneyflow",
  "sfx": [
    {"asset": "moneyflow-whoosh-1.wav", "at_s": 1.2, "gain_db": -26}
  ]
}
```

Apply via:
```bash
node scripts/pipeline/apply-sfx.mjs \
  --storyboard eng/storyboards/<slug>.json \
  --master _build/<slug>/master.mp4 \
  --out _build/<slug>/master-with-sfx.mp4
```

## Hard rules (from SFX specialist persona)

- No cue above -18 dB
- ≤1 cue per second on average
- Banned: cable-news stings, "DUN-DUN" intervals, MrBeast chimes,
  reverb tails > 400ms

## TBD — to curate

- `verdict-stamp-hit.wav` — rubber stamp on paper, dry single hit
- `subbass-drop-{1,2}.wav` — for big-number reveals ($82M, 60%)
- `moneyflow-whoosh-{1,2,3}.wav` — short whooshes for MoneyFlow arrows
- `paper-rustle-loop.wav` — under source-card reveals
- `tick-click.wav` — for CountUp / ChartBar increments
- `room-tone-cinematic.wav` — bed under Sora 2 atmospheric clips
- `scene-sting-f-minor.wav` — quarter-second tonal sting for major
  scene transitions, F minor key
