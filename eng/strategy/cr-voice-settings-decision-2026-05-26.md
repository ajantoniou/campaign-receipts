# CR Voice Settings Decision — 2026-05-26

**Question (founder):** HealthBrew is moving to `0.55 / 0.82 / 0.20`. Does CR adopt the same?

**Specialists in the room:** Cadence Director + Score Composer.
**Verdict:** Partial match. Lift similarity from 0.75 → 0.82, hold stability at 0.55, hold style at 0.20.
**Ship: `stability=0.55, similarity_boost=0.82, style=0.20` on `eleven_multilingual_v2`.**

---

## 1. Current CR settings (sources)

The CR-canonical Sarah/Jessica long-form triple is **0.55 / 0.75 / 0.20** on `eleven_multilingual_v2`. Verified across:

- `companies/campaign-receipts/brand/voice-writing.md:38` — "`stability=0.55`, `similarity_boost=0.75`, `style=0.15`, `speed=0.93`, `model=eleven_multilingual_v2`"
- `companies/campaign-receipts/brand/betsy-character-bible.md:13` — "Teacher cadence (long-form): stability=0.55, similarity=0.75, style=0.20"
- `companies/campaign-receipts/scripts/longform/produce-explainer.mjs:125` — `const stability = 0.55, similarity = 0.75, style = 0.20`
- All storyboards (`eng/storyboards/cr-bell-bush-aipac-primary.json`, `cr-rabb-pa3-aipac-defeat.json`, `cr-massie-gallrein-primary.json`, `sealed-aipac-iran-deal-v[2,4,6,7].json`, `_template-cr-new-news.json`) — `stability: 0.55, similarity_boost: 0.75, style: 0.20`
- `companies/campaign-receipts/scripts/shorts/produce-viral-001.mjs:261` — `const stability = 0.55` (with similarity 0.75, style 0.15)

**Outlier (not production-binding):** `scripts/pipeline/elevenlabs-tts.py:307` has default `stability=0.7, similarity=0.85, style=0.0`. These are bare-CLI defaults; every production caller (`produce-explainer.mjs`, `produce-viral-001.mjs`, storyboard-driven `produce-from-storyboard.py`) supplies the canonical triple explicitly. The CLI default is stale — see migration step 2.

**HealthBrew is moving to:** `0.55 / 0.82 / 0.20` (warmer / more emotional presence).

---

## 2. Per-axis decision

### Stability — KEEP at 0.55 (no change)

| Lane | Value |
|---|---|
| CR current | **0.55** |
| HealthBrew new | 0.55 |
| **CR recommended** | **0.55** |

**Cadence Director:** 0.55 is already the locked CR teacher-cadence value. It gives Sarah enough variation to feel human across a 4-minute receipt read without drifting into pace inconsistency (NTO/Brian sits at 0.35 — too expressive for receipts). Bush/Massie/Rabb episodes scan correctly at 0.55. No reason to move.

**Score Composer:** Agrees. Stability governs prosodic anchoring; raising it flattens, lowering it sing-songs. 0.55 is the canonical CR center.

### Similarity boost — RAISE 0.75 → 0.82

| Lane | Value |
|---|---|
| CR current | **0.75** |
| HealthBrew new | 0.82 |
| **CR recommended** | **0.82** |

**Cadence Director:** Higher similarity tightens voice-print fidelity between renders. CR's pain point isn't warmth — it's that Sarah drifts subtly across chunked renders (5–10 blocks per episode get concatenated). 0.82 reduces inter-block timbre wobble, which is a clarity win for an investigative read. This is not an emotional move; it's a fingerprint move.

**Score Composer:** Strong yes. similarity_boost ≈ voice fidelity to the reference clone. 0.82 is firmly inside the "true to source" band without crossing into the over-locked, robotic territory (>0.90). It will also reduce the QC re-render rate on chunked VO.

### Style — KEEP at 0.20

| Lane | Value |
|---|---|
| CR current | **0.20** |
| HealthBrew new | 0.20 |
| **CR recommended** | **0.20** |

**Cadence Director:** 0.20 is the CR-locked value already in every storyboard and `produce-explainer.mjs`. Founder's stated guardrail — "shouldn't go as far as NTO (0.40)" — is honored at 0.20. No change.

**Score Composer:** Style is the emotional-expressiveness dial. 0.20 lets Sarah inflect on the receipt-reveal beats without performing them. Holding here keeps the warm-but-clinical register the persona doctrine requires ("Calm. Methodical. Slightly dry. Never sneering. Never gleeful").

**Note on the brand/voice-writing.md `style=0.15` value:** that's a stale lower setting from the v6 audition era. The production code, storyboards, character bible, and longform script all standardized to 0.20. Migration step 3 closes this drift.

---

## 3. Final triple to ship

```
stability=0.55, similarity_boost=0.82, style=0.20, model=eleven_multilingual_v2
```

(Shorts inherit the same triple unless `produce-viral-001.mjs` is intentionally diverged — see step 4.)

---

## 4. Migration steps

| # | File | Change | Validation |
|---|---|---|---|
| 1 | `companies/campaign-receipts/scripts/longform/produce-explainer.mjs:125` | `const stability = 0.55, similarity = 0.75, style = 0.20` → `similarity = 0.82` | Re-render 200-word test from `eng/longform-scripts/sealed-iran-deal.md` lede; A/B against current Rabb VO; ear-check for warmth + timbre consistency across two consecutive paragraphs |
| 2 | `companies/campaign-receipts/scripts/pipeline/elevenlabs-tts.py:307` | `def synthesize(text, voice_id, model="eleven_turbo_v2_5", stability=0.7, similarity=0.85)` → `stability=0.55, similarity=0.82`; update the PRODUCTION-LOCKED comment block (lines 309–315) to reference 2026-05-26 change and `style=0.20` | Run `python3 elevenlabs-tts.py --text "Promise on the left. Vote on the right. You decide. Here is the receipt." --out /tmp/cr-voice-2026-05-26.mp3 --piece voice-test`; scribe-verify passes |
| 3 | `companies/campaign-receipts/brand/voice-writing.md:38` and `brand/betsy-character-bible.md:13` | Update both to `stability=0.55, similarity_boost=0.82, style=0.20` (and remove the stale `style=0.15` from voice-writing.md) | grep for `similarity_boost=0.75` across `companies/campaign-receipts/brand/` returns zero hits |
| 4 | All `eng/storyboards/*.json` `voice_settings` blocks | `"similarity_boost": 0.75` → `"similarity_boost": 0.82` (style stays 0.20 / 0.15 per file; do NOT touch style this pass) | grep `"similarity_boost": 0.75` across `eng/storyboards/` returns zero hits |
| 5 | `companies/campaign-receipts/scripts/shorts/produce-viral-001.mjs:261` and `:1020` | `similarity_boost: 0.75` → `0.82` | Re-render a 33s test hook; viral cadence still snaps; no over-locked metallic tone |
| 6 | `eng/PRODUCTION-PIPELINE-RUNBOOK.md:276-277` and `eng/plans/2026-05-20-ship-2-promises-tonight.md:137` | Doc-only: update similarity number | Doc grep clean |

**Test render to validate (one short paragraph, ~$0.05 ElevenLabs):**

```bash
python3 companies/campaign-receipts/scripts/pipeline/elevenlabs-tts.py \
  --text "Here is the receipt. AY-pack gave Eric Bell three hundred and forty thousand dollars between twenty fourteen and twenty sixteen. Then Bell voted yes on the Iran Deal resolution. Promise on the left. Vote on the right. You decide." \
  --out /tmp/cr-voice-2026-05-26-validate.mp3 \
  --piece voice-settings-2026-05-26
```

Listen for: (a) Sarah identity still present, (b) timbre stays even across the dollar-amount + verdict line, (c) no robotic over-lock, (d) emotional register still calm (not breathy/wellness-warm — that would mean similarity over-rotated).

---

## 5. Apply-to-Rabb / retrofit question

**Decision: forward-only. Do NOT re-render the published Rabb VO.**

Rationale:
- Founder's standing direction is "apply forward only" for prior episodes (NTO precedent).
- The current Rabb render is published, has analytics attached, and the 0.75 → 0.82 lift is a fidelity refinement, not a defect fix. It would not be audible to a viewer who hasn't heard the new version.
- Re-rendering costs ElevenLabs credits + a full QC pass (audio-qc + scribe verify + visual sync re-check) for negligible viewer-perceptible delta.
- We've spent the 2026-05 quarter stabilizing the pipeline; gratuitous re-renders of shipped assets re-introduce regression risk.

**Exception (explicit):** If a v2 of the Rabb episode is cut for *any* reason (errata, new evidence, thumbnail re-test, length re-cut for Shorts), re-render the VO under the new settings as part of that pass — don't ship a v2 with the old 0.75 fingerprint sitting next to new-settings B-roll VO from sibling episodes.

The next *new* episode (Stanford → 314 Action Fund → Kimbark, per founder's pipeline queue) ships on `0.55 / 0.82 / 0.20` from first render.
