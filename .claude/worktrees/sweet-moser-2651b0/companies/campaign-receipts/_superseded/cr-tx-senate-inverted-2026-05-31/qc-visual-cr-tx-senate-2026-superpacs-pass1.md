# Master Visual QC — Pass 1 — cr-tx-senate-2026-superpacs

**Master:** public/longform/cr-tx-senate-2026-superpacs.mp4 (1280x720, 238.9s, 15.9MB)
**Method:** qc-visual-master.py tool pass + qc-engineer /watch (80 frames + full transcript)
**Date:** 2026-05-31

## History
- First splice FAILED pass 1: A/V desync — clip durations summed to ~300s vs 238.9s VO, so visuals ran ahead of narration and drift compounded (Schwarzman line showed the Receipt-2 card).
- FIX: re-timed every clip's `duration` so each beat's clips sum to that beat's VO block duration (9 VO blocks measured from chunk parts: 26.9/34.1/42.6/21.5/26.7/29.2/23.3/18.8/15.4s). Re-rendered + re-spliced. Re-watched.

## 4-criteria verdict (after fix)

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Speaker/lips (no AI-face talking head) | SHIP-OK | Faceless channel. No AI talking head. Named people are editorial ink caricatures (book lane), not photoreal/AI faces. |
| 2 | Image matches narration at that moment | SHIP-OK | Verified at every receipt: Nau/Schwarzman/Paxton $24.1M card during Receipt-1 narration (1:21–1:40); Truth&Courage $22M during Yass line (1:54); Lone Star Rising $8.5M/Hoffman during Receipt-3 (2:16); "Whose voice is louder?" comparison during voter pivot (2:42); RECEIPT verdict stamp at punchline (3:37); outro at cold close (3:55). Residual lead ≤ one short clip — within tolerance. |
| 3 | No garble / looping / mangled audio | SHIP-OK | Transcript clean end-to-end; all numbers correct ($15.6M, $4M, $24M, $22M, $2M, $1.5M, $10M, $5M). |
| 4 | No b-roll/text-card contradicting spoken content | SHIP-OK | Every card's data matches the spoken claim AND its committee ID: $24.1M=C00542217 (Nau $15.6M, Schwarzman $4M Blackstone, vs Paxton); $22M=C00796045 (Yass $2M, vs Allred); $8.5M=C00918268 (Hoffman $1.5M, vs Crockett). Verdict stamp cites FEC Schedule E+A. |

## qc-visual-master.py tool pass 1: PASS (one safe-zone WARN at 41.8s; V3 empty-frames PASS, V7 runtime 238.9s PASS, V8 no-vo n/a; remaining checks are unimplemented TODOs)

**PASS 1 RESULT: SHIP-OK on all 4 criteria.**
