# Stage 1 — long-form producer + Iran-deal render

**Status:** Stage 1 COMPLETE. Stages 2 and 3 HELD at the binding-gate boundary
the prior agent identified in `eng/longform-scripts/sealed-iran-deal.md` (see
"Stage 1 boundary" footer).

## What shipped (Stage 1)

- `scripts/longform/produce-explainer.mjs` — 1920×1080 long-form producer
  adapted from `scripts/shorts/produce-viral-001.mjs`. Self-contained:
  parses VO from the canonical script, synthesizes per-scene VO via
  ElevenLabs (Sarah teacher cadence — stability 0.55, similarity 0.75,
  style 0.20, model `eleven_multilingual_v2`), renders 10 SVG scene cards
  to PNG via rsvg-convert, applies gentle ken-burns motion per scene,
  burns a persistent 100px SEALED2016.COM bottom bar, overlays a
  subscribe-bell at 0:30 for 5 seconds, sidechain-ducks music
  (threshold=0.03, ratio=20, attack=120, release=500), and verifies
  ≥8 dB voice/music differential at each scene's mid-VO window.

- `public/longform/sealed-aipac-iran-deal.mp4` (27 MB, **gitignored** —
  not committed). 1920×1080 @ 30fps, 241.22s (4:01), ffprobe verified.
- `public/longform/sealed-aipac-iran-deal.jpg` thumbnail (Adelson reveal
  frame, mid scene 7) — committed.

## Validation against script's hard requirements

| Requirement                       | Result                            |
|-----------------------------------|-----------------------------------|
| Duration 4:00-4:30                | 4:01 (241.22s) — PASS             |
| 1920×1080 30fps + audio + video   | PASS via ffprobe                  |
| File size ≤ 100 MB                | 27.2 MB — PASS                    |
| RMS ≥ 8 dB voice/music differential at all speech windows | PASS — worst diff +8.50 dB (scene 7); best +26.85 dB (scene 10) |
| No fal.ai                         | PASS — SVG/ffmpeg only            |

Per-scene RMS diffs (master vs music-only reference at each scene's mid-VO):

| Scene | Diff (dB) | Pass |
|-------|-----------|------|
| 1     | 16.85     | ✓    |
| 2     | 15.28     | ✓    |
| 3     | 12.40     | ✓    |
| 4     | 20.10     | ✓    |
| 5     | 11.31     | ✓    |
| 6     | 14.99     | ✓    |
| 7     | 8.50      | ✓    |
| 8     | 14.50     | ✓    |
| 9     | 22.69     | ✓    |
| 10    | 26.85     | ✓    |

Two audio fixes were applied during render (committed in producer):

1. Music bed post-loudnorm gain reduced from `volume=0.55` to `volume=0.18`
   and amix weights tuned to `1.4 0.5` (voice/music) — the original
   recipe's nominal -16/-22 LUFS targets didn't translate to ≥8 dB RMS
   differential in this material because both tracks loudnorm-collapsed to
   similar working levels; the music had to be dropped further to give
   voice the headroom the spec requires.
2. Music aloop flag corrected from `loop=0:size=2147483647` (which only
   runs the buffered samples once at that size cap) to `loop=-1:size=2e9`
   (true infinite loop). Source music is 203s, master is 241s — without
   the fix, scenes 9-10 had no music bed and the RMS scanner reported
   `null` music_ref on those windows.

## TTS spend

10 scenes × ~342 chars avg = 3416 chars total
~$1.03 at eleven_multilingual_v2 pricing (~$0.30/1k chars).
Logged to `scripts/longform/.external-costs.jsonl`.

Total spend this stage: ~$1.03 of $5 budget.

## Stage 2 — HELD (binding-gate honesty)

The 7-persona validation pass — and especially Cincinnati Sarah's
swipe-away verdict — cannot be honestly produced by an LLM-only agent
that has never watched the rendered mp4. Reading the script and the
SVG card source would be exactly the dishonest move the prior agent
flagged when they stopped at this same boundary
(`eng/longform-scripts/sealed-iran-deal.md`, "Stage 1 boundary" footer):

> "Cincinnati Sarah cannot honestly verdict a rendered video by reading
> a script. Render + Sarah pass in a session where the mp4 actually
> exists and her swipe-away timestamps can be grounded in the rendered
> cut, not roleplayed from prose."

The mp4 now exists. The next session can either:

- **(A) Founder review.** Watch the cut. Apply your own Cincinnati-Sarah
  test. Either greenlight Stage 3 or send surgical-fix notes.
- **(B) Vision-pass next session.** A future agent with multimodal frame
  inspection can score the rendered cut against the persona files,
  rather than score the script. (The producer is deterministic — re-runs
  with `--skip-tts` are free past the first VO synthesis.)

Either path preserves the binding gate. Auto-running personas against
my own VO text + SVG card source after I just built them is precisely
the assumption-flaw failure mode the founder's global CLAUDE.md
warns against.

## Stage 3 — NOT STARTED

Splicer (`scripts/shorts/splice-from-longform.mjs`) and the two
spliced shorts depend on Sarah's verdict on the long-form. Not built
in this session.

## Files committed this stage

- `companies/campaign-receipts/scripts/longform/produce-explainer.mjs`
- `companies/campaign-receipts/scripts/longform/STAGE-1-REPORT.md` (this file)
- `companies/campaign-receipts/scripts/longform/.external-costs.jsonl`
- `companies/campaign-receipts/public/longform/sealed-aipac-iran-deal.jpg`

Build artifacts (mp4, mp3 VOs, intermediate clips) are gitignored per the
repo's existing big-mp4 policy. To reproduce: re-run the producer.

## Reproduction

```bash
cd companies/campaign-receipts
node scripts/longform/produce-explainer.mjs              # full render
node scripts/longform/produce-explainer.mjs --skip-tts   # re-mix only
```

Requires `ELEVENLABS_API_KEY` in repo-root `.env`, plus `ffmpeg`,
`ffprobe`, `rsvg-convert` (homebrew).
