# Production ship checklist (pipeline-enforced)

**Full QC list (copy + visuals + audio):** `eng/PRODUCTION-QC-CHECKLIST.md`  
**Binding runner:** `scripts/pipeline/production-qc.py` (8 gates — includes `master-visual-qc.py`)  
**Clip timing / OCR:** `scripts/pipeline/ship-checklist.py`

Upload is blocked unless **`production-qc.json`** and **`ship-checklist.json`** both show `"pass": true`.

---

## Shorts (`--mode short`)

| # | Question | Check ID |
|---|----------|----------|
| 1 | Do images line up with narration? | `narration_sync` — Scribe anchors + min 3.8s hold (`pacing-qc.json`) |
| 2 | Is overlay text correctly placed? | `overlay_safe_zone` — 48px margin (`visual-qc.json`) |
| 3 | Is VO on disk and master has audio? | `vo_present`, `master_audio` |
| 4 | Master valid length? | `master_duration` (20–60s) |

---

## Long-form (`--mode longform`)

| # | Question | Check ID |
|---|----------|----------|
| 1 | Storyboard policy (no Hedra / wiki faces / FLUX text)? | `storyboard_policy` |
| 2 | Every clip rendered? | `clips_rendered` — `state.json` |
| 3 | Remotion / text-card / ken-burns clips probed? | `remotion_and_clips` — duration ±1s |
| 4 | On-screen text OCR clean? | `on_screen_text_ocr` |
| 5 | Master ≈ VO length (narration sync)? | `narration_sync` |
| 6 | Master has audio? | `master_audio` |

---

## Council personas (detail)

- `personas/council/07-visual-qc.md` — overlays
- `personas/council/08-pacing-qc.md` — narration ↔ picture
- `personas/council/06-audio-qc.md` — voice / levels (separate gate)

---

## Manual run

```bash
# Short
python3 scripts/pipeline/ship-checklist.py --mode short \
  --master public/shorts/sealed-001-aipac-iran-deal.mp4 \
  --build scripts/shorts/_build/001

# Long-form
python3 scripts/pipeline/ship-checklist.py --mode longform \
  --storyboard eng/storyboards/sealed-aipac-iran-deal-v7.json \
  --build _build/sealed-aipac-iran-deal-v7
```
