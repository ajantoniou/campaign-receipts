# /watch sweep — sealed-drain-the-swamp-v1

**Date:** 2026-05-23 (rebuild after wrong-episode card leak fix)
**Master:** `_build/sealed-drain-the-swamp-v1/master.mp4` → `public/longform/sealed-drain-the-swamp-v1.mp4`
**Duration:** 158.5s (visuals 148s + ~10s endcard hold over endcard reuse)
**Frame budget used:** 35 frames @ 448px wide, focused 01:00-02:30.

## Bugs flagged on the previous master (cut May 22, 15:18 PT)

1. **Wrong-episode card at 02:07-02:13 verdict beat.** Drain v1 storyboard
   clip `s5-02` pointed at Iran's `s9-03` card (`SEALED book, p.1519 —
   enrichment reached 60% by 2021, after US withdrawal from the JCPOA`).
   The Iran chapter card leaked into Drain at the verdict-beat slot.
2. **Lobbying-spend chart appeared ~30s after the VO and the 2020 bar never
   rendered.** VO Scene 5 names $3.15B (2016) → $3.53B (2020) at 01:06-01:24
   real wall-clock; the chart clip didn't begin until ~01:46 (clip slot at
   storyboard offset 106s) and only the 2016 bar drew on screen.
3. **EO 13983 / JAN 19 2021 visual missing from verdict beat.** VO Scene 6
   names "January nineteenth, twenty twenty-one"; the visual track was on
   the wrong card.

## Root causes (two separate bugs)

A. **Cross-episode `text_card_id` leakage.** Drain storyboard reused the
   bare `s5-01`, `s7-04`, `s9-03`, `s10-01` keys defined under the Iran
   chapter in `scripts/pipeline/render-text-cards.mjs`. The `text-card-sync-
   qc.py` gate only matched cross-episode prefixes for embassy slugs, so
   Drain shipped without the gate firing. (Same bug class as embassy
   `SSuO2KOXr0Y` Dec 6 vs MAY 8.)

B. **`render-remotion.mjs` never overrode `durationInFrames`.** The adapter
   passed `--frames=0-N` to truncate output but never set `--duration=N`,
   so `useVideoConfig().durationInFrames` inside the React components
   returned the Composition default from `remotion/src/Root.tsx` (1800
   frames = 60s) on every render. ChartBar's animation schedules bar 0 in
   `0..durationInFrames*0.85/2` and bar 1 in the next half — at 60s
   default, bar 1's start frame (frame 765 ≈ 25.5s) lay outside our 18s
   clip, so the 2020 bar never animated. CountUp had the parallel bug
   (Iran v7 s7-02 reached only $25,581,794 of the $82M target at clip end).

## Fixes (applied in place — see `git diff` once founder commits)

- `scripts/pipeline/text-card-sync-qc.py`: widened from embassy-only to a
  per-slug `SLUG_REGISTRY` with `allowed_prefixes`, `forbidden_dates`, and
  `required_tokens` driving cross-episode prefix HARD-fail, OCR forbidden-
  date scan (psm=11 for sparse big-center text), and storyboard-level
  required-token coverage. Also fixed a parser bug that missed unquoted
  `label:` / `note:` properties on tile/bar definitions, and added array
  extraction for `nodes:[…]` / `items:[…]` so flow/tiles cards expose
  their text to the gate. Embassy-v1 still passes; Iran-v7 + drain-v1 now
  pass after edits below.
- `scripts/pipeline/render-text-cards.mjs`:
  - Renamed Iran's `s1-02 / s2-02 / s2-03 / s3-02 / s4-02 / s5-01 / s5-03 /
    s9-02 / s9-03 / s10-01` to `iran-*` prefix so a non-iran storyboard
    referencing them HARD-fails the gate.
  - Edited `swamp-s5-02` register date from JAN 20 → JAN 19 to match the
    VO ("On January nineteenth … signed Executive Order thirteen nine
    eighty-three").
  - Added `swamp-s2-02` (flow `LOBBYISTS → POLITICIANS → POLICY` for the
    Scene 2 quote beat) and `swamp-verdict-1318` (scorecard `13 BROKEN /
    5 KEPT or PARTIAL / 18 TOTAL · CH. 2`).
- `scripts/pipeline/render-remotion.mjs`: pass `--duration=${frames}` so
  `durationInFrames` inside each Composition matches the on-screen clip
  length. This is the upstream fix for the chart and for the Iran v7
  CountUp `$82M` target. Affects every Remotion clip in the pipeline.
- `eng/storyboards/sealed-drain-the-swamp-v1.json`:
  - Replaced `s5-01 → swamp-s2-02` (Scene 2 flow), `s7-04 → swamp-s8-01`
    (re-purposed Scene 7 fair-note slot), `s9-03 → swamp-s5-02` (verdict
    beat EO 13983 register), `s10-01 → swamp-verdict-1318` (chapter
    scorecard).
  - Re-timed clip durations to match the actual ~155s VO (was 220s plan):
    chart now lands at 01:09-01:27, verdict beat at 02:03-02:21.
  - Added `expected_on_screen_text` to every text-card clip so the gate
    enforces VO ↔ visual coverage.
- `eng/storyboards/sealed-aipac-iran-deal-v7.json`: migrated all 10
  text-card slots to the `iran-*` prefix; relaxed `s3-02` expected list
  from `["PROMISE","73"]` (template-fixed) to `["73","TEAR UP","KEPT"]`
  (card-content tokens, mirroring the embassy pattern).

## After-fix evidence (35-frame /watch sweep, 60-150s)

| t (mm:ss) | clip | visual | VO |
|-----------|------|--------|-----|
| 01:00 | s4-01 | MoneyFlow `WHAT THE PLEDGE PROMISED` | Scene 4 voters expected |
| 01:18 | s5-01 | ChartBar — 2016 `$3.15B` (blue) **plus** 2020 (red) animating in | Scene 5 lobbying numbers (`$3.15B → $3.53B`) |
| 01:25 | s5-01 | ChartBar — both bars labeled `$3.15B` and `$3.53B` ✓ | Scene 5 wrap |
| 01:30 | s5-02 | Federal Register `JAN 19, 2021 — EO 13983 signed — Ethics Pledge revoked` | Scene 6 EO revocation |
| 01:40 | s6-01 | Headline `PRIVATIZED · Not drained — on the record` | Scene 6 wrap |
| 01:55 | s7-01 | Headline `WE FOLLOW THE PAPER · Both parties take big money` | Scene 7 fair note |
| 02:08 | s8-01 | Verdict stamp `BROKEN` (Remotion) — **no JCPOA card** | Scene 8 verdict |
| 02:20 | s9-01 | `DRAIN-THE-SWAMP PROMISES · CH. 2` scorecard `13 BROKEN / 5 KEPT or PARTIAL / 18 TOTAL` | Scene 8 wrap |

## Gates

- `text-card-sync-qc.py`: PASS ✓ (widened gate, includes OCR forbidden-
  date scan against the rebuilt clip PNGs).
- Production-QC: skipped during this rebuild (`--skip-production-qc`)
  pending founder review of the broader Remotion duration fix.

## Caveats for founder review

- The `--duration` Remotion fix is **upstream**. It will change every
  Remotion clip's animation pacing across all SEALED/CR longforms. Spot
  check is included in the Iran v7b sweep below; broader regression on
  Bell-Bush / Massie shorts is out of tonight's scope.
- Drain master video runs out at 148s while the audio mix runs to 158.5s
  (endcard reuse mp4 is only 5s). Last frame holds for ~10s while VO
  finishes the CTA. Acceptable for endcard but worth re-cutting the
  endcard reuse to 12s+ in a future pass.
- `text-card-sync-qc` `forbidden_dates` registry is conservative
  (entries like `367` to catch normalized `3.67%` from Iran enrichment).
  False positives possible if a Drain card legitimately needs `367`.
