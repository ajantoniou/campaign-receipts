# CR video → full AI-motion (frankusa-style) — build spec (BLOCKED on Gemini credits)

Founder direction 2026-06-27: make the video INTERIOR look like the viral faceless-AI
channels (Veo/Imagen motion on every beat), NOT the current static "premium-newsletter"
cards. The thumbnail already matches the viral packaging (make-vote-thumbnail.mjs).

## HARD CONSTRAINT (reconciling the two directives)
- 2026-06-25: founder said the OLD Veo "looked cheap" — because it was ONE 8s clip ON A
  LOOP. That is why a prior session stripped Veo to static cards (produce-cr-weekly.mjs
  line ~374 "No Veo … Static cards only", veo_heroes:0).
- 2026-06-27: "go full frankusa-style AI motion."
- RESOLUTION: re-add Veo as **one FRESH generated clip per scene, NEVER looped**. Each
  scene gets its own prompt (the scene's subject — e.g. "slow cinematic push across the
  US Capitol at dusk, documentary grade" / "abstract money-flow particles, navy + gold").
  If a clip is shorter than the scene hold, DO NOT loop it — freeze-frame + continue the
  Ken-Burns on the last frame, or hard-cut to the branded card for the remainder.

## BLOCKER (founder action)
GEMINI_API_KEY is OUT OF CREDITS → every Veo/Gemini call = HTTP 429 "prepayment credits
depleted." CANNOT generate or verify a single clip until funded at ai.studio/projects.
DO NOT ship unverified AI-motion code into the live Friday pipeline — render + WATCH a real
clip first (founder + CLAUDE.md "never assume" rule).

## BUILD (once funded)
1. Re-enable Veo in produce-cr-weekly.mjs:
   - Per scene i, call scripts/pipeline/veo-generate.mjs (already exists) with a scene-
     specific prompt derived from scene.label / scene.subjectHint. Cap total via --max-veo
     (cost guard) — but target is "every beat", so raise the cap and gate on budget.
   - veo-3.1-fast-generate-preview, 16:9, ~6-8s. Download → mp4.
   - Compose: Veo clip as the moving BACKGROUND, the branded card elements (eyebrow, money,
     photo, logos, disclaimer) overlaid ON TOP with a scrim for legibility. This keeps
     sourced/credible text while the bg moves = best of both.
   - NO LOOP: if veo_dur < hold, freeze last frame (tpad=stop_mode=clone) + slow zoom.
2. Imagen/Nano-Banana option for non-Veo beats (stills that animate via Ken Burns) when a
   Veo clip isn't worth the credits — cheaper motion.
3. Cold-open: drop the "Welcome back to Friday Receipts…" warm-up. Open on the PUNCHLINE
   (the lead bloc story headline) in the first 2 seconds. (build-audio-briefing.mjs prompt.)
4. Caption overlap: the LIVE video (11P_N-Oq7LM, rendered by OLDER code) showed captions
   over the photo + disclaimer. Current renderer says "No captions" — VERIFY current code
   doesn't reintroduce overlap once Veo bg + overlays are added (render a scene to PNG and
   eyeball — "layout math is a gate").
5. Cost guard: log Veo $ per run; assert under per-run ceiling. Veo Fast ~20 credits/clip.

## VERIFY (mandatory before live)
- Render ONE scene with a real Veo bg locally, WATCH it (Read the frame), confirm: bg moves,
  text legible over it, NO loop seam, money/photo not clipped.
- Then full --no-upload render, watch open + 2 mid frames.
- Only then let the Thursday cron ship it.

Relates: project_cr_viral_format_and_gemini_stack (memory), eng/CR-PRODUCTION-PIPELINE-v4.md.
