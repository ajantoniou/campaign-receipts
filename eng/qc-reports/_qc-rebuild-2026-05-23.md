# QC Rebuild Log — 2026-05-23

**Trigger:** founder caught the QC stall. Ran a real /watch pass on the 6 shorts before publish and found two ship-blocking bugs in both LFs. Held the orchestrator (PID 75974 → killed) before quota reset.

## Bugs found

### Bug 1: `bar2` text-card template (HARD FAIL — both LFs)

`scripts/pipeline/render-text-cards.mjs` line 252 had:
- **Hardcoded eyebrow:** `<div class="eyebrow">URANIUM ENRICHMENT %</div>` — left over from `sealed-aipac-iran-deal-v4` and never genericized.
- **Hardcoded inverted heights:** `card.a` always 12%, `card.b` always 90% (or 60% for the legacy Iran case). For Bell-vs-Bush and Gallrein-vs-Massie this rendered the **winner shorter than the loser**.

Affected clips:
- Bush LF t=197–205s (`overlay-election-margin`, text-card, type=`bar2`)
- Massie LF t=227–234s (`overlay-election-margin` keyed to `massie-overlay-margin`, type=`bar2`)

**On-screen evidence (pre-fix):**
- Bush LF / 200s: `URANIUM ENRICHMENT %` header over `Bell 51%` (tiny) vs `Bush 46%` (huge). Footer correctly read MO-1.
- Massie LF / 232s: same pattern — `Gallrein 54%` (tiny) vs `Massie 45%` (huge), KY-4 footer.
- Same contamination then visible inside `cr-bush-short-03-verdict` and `cr-massie-short-03-verdict` because shorts are letterbox cuts of the LF.

### Bug 2: `VerdictStamp` empty portrait box (HARD FAIL — Massie LF only)

Massie's `verdict-01-stamp` storyboard candidates list named both Massie and Gallrein but only had `caricature_slug` for Massie. The Remotion `VerdictStamp` composition rendered an empty parchment box for Gallrein (no Wikipedia photo on file), which read as a broken image, not a stylistic placeholder.

## Fixes applied

1. **`scripts/pipeline/render-text-cards.mjs` `case "bar2"`:**
   - `card.eyebrow` now drives the header (default `"PRIMARY RESULT"`).
   - Heights derive from `card.a.value` / `card.b.value` (proportional to the larger; max 90% of bar zone). Falls back to legacy 12% / 60-or-90% when no `value` field is present, so the original Iran card still renders unchanged.
2. **Card data in `render-text-cards.mjs`:**
   - `overlay-election-margin` → `eyebrow: "MO-1 PRIMARY · CERTIFIED RESULT"`, `value: 51 / 46`.
   - `massie-overlay-margin` → `eyebrow: "KY-4 GOP PRIMARY · CERTIFIED RESULT"`, `value: 54 / 45`.
3. **`remotion/src/compositions/VerdictStamp.tsx`:**
   - Empty portrait slots now render the candidate's two-letter monogram on the parchment plate ("EG" for Ed Gallrein) instead of an empty bordered box.
4. **Re-render scope:** PNG re-render for the two fixed text-cards, ffmpeg encode to MP4 (8s Bush / 7s Massie) to drop into `_build/<slug>/clips/`. Remotion re-render of `verdict-01-stamp.mp4` for both LFs to pick up the VerdictStamp fix.
5. **Re-mux:** `produce-from-storyboard.py --assemble-only --skip-publish --skip-production-qc --skip-copy-lock` for both LFs.
6. **Re-cut shorts:** `cut-shorts-v2.py` over both LFs → 6 shorts re-cut from corrected sources.

## Visual verification (post-fix)

Sampled both fixed beats in both LFs and the two shorts most affected:

- Bush LF / 200s → "MO-1 PRIMARY · CERTIFIED RESULT" header, Bell taller than Bush, proportional. ✅
- Bush LF / 210s → Bush + Bell verdict-stamp portraits unchanged. ✅
- Massie LF / 232s → "KY-4 GOP PRIMARY · CERTIFIED RESULT" header, Gallrein taller, proportional. ✅
- Massie LF / 240s → Massie portrait + "EG" monogram for Gallrein, no empty box. ✅
- `cr-bush-short-03-verdict` t=5s/10s → clean. ✅
- `cr-massie-short-03-verdict` t=4s/8s → clean. ✅

Other 4 shorts (hooks, 95%, money-flow) cut from LF ranges that were not modified by the fix; spot-checked.

## Why this happened (and the cheap pipeline lesson)

`bar2` was authored once for `sealed-aipac-iran-deal-v4` (3.67% vs 60% uranium enrichment). When CR new-news reused the same `type: "bar2"` for election-margin overlays, no one re-read the template; the producer happily served the Iran header. The lesson is the same as the founder's no-bloat rule: **extend, don't fork**, and **read the template before reusing the type**. `bar2` is now data-driven, so the next reuse cannot inherit a previous topic's eyebrow.

## State after fix

- Orchestrator: dead. Will relaunch only after this log lands.
- Quota: still exhausted; reset at midnight Pacific (~01:45 ET window from this log).
- Queue (unchanged): Massie LF → Bush LF (`--replace-id gXxZHKWgZug`) → 6 shorts.
- `monetization` block still says SHIP-WITH-DISCLOSURE for all 8; AIPAC pieces still YELLOW-EXPECTED on ad-friendliness, audience-build phase lock applies.
