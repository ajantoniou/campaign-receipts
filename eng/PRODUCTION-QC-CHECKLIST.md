# Production QC checklist (binding — no upload until PASS)

**Enforced by:** `scripts/pipeline/production-qc.py` (runs after assemble + before `youtube-upload.py`).

**Founder rule:** If any gate fails, fix the artifact and re-run produce — do **not** use `--skip-production-qc` except emergency debug.

---

## A. Copy (before TTS)

| # | Check | Tool | Fail if |
|---|--------|------|---------|
| A1 | Plain VO file only (no `**VO:**`, no stage directions) | `script-qc.py` | Markdown labels, `on screen`, `box N`, comma-millions |
| A2 | Story score **COPY 100/100** (dims 1–8 = 10) | `story-score-lock.py --phase copy` | Any copy dim &lt; 10 |
| A3 | Storyline editor + council + viral SHIP | panels + `storyline-editor-pass.md` | REVISE / HARD VETO |
| A4 | Copy lock exists | `copy-lock.py` | missing lock or scores &lt; 100 |

---

## B. Storyboard (before render)

| # | Check | Tool | Fail if |
|---|--------|------|---------|
| B1 | No Hedra / wiki faces / FLUX text stills | `validate-storyboard.py` | Policy violation |
| B2 | Every `text-card` + `remotion` clip has `expected_on_screen_text` | storyboard JSON | Missing expectations (visual gate) |
| B3 | Remotion `VerdictStamp` sets `promise: ""` when unused | storyboard props | Iran-deal studio defaults leak |
| B4 | SourceCard / ChartBar props match script figures | human + council | Placeholder committee line |

---

## C. Per-clip render

| # | Check | Tool | Fail if |
|---|--------|------|---------|
| C1 | All clips `status: ok` in `state.json` | `ship-checklist.py` | Missing or failed clip |
| C2 | Clip duration ±3s vs storyboard | `ship-checklist.py` | Timing drift |
| C3 | OCR: no forbidden cross-episode text | `audit-clip-ocr.py` + `qc_visual.py` | Iran deal, EO May 2018, placeholders |
| C4 | OCR: expected text present | `expected_on_screen_text` | Wrong episode on screen |
| C5 | Text cards: **static hold** (no zoompan tremor) | `master-visual-qc.py` | Jitter on parchment cards |

**Forbidden on-screen (hard fail):**

- `Withdraw from the Iran nuclear deal` / `Tear Up The Iran`
- `EO May 2018`
- `Committee name · date`
- `on screen` / `box one`
- Adelson / promise #73 (wrong episode)

---

## D. Audio

| # | Check | Tool | Fail if |
|---|--------|------|---------|
| D1 | Jessica voice (not Adam / male default) | `audio-qc.py --strict` | Wrong speaker |
| D2 | Master not silent | volumedetect in driver | mean_volume < -60 dB |
| D3 | VO scribe: no banned phrases | `production-qc.py` gate 5–6 | thousand thousand, VO---, URLs read aloud |
| D4 | Master ≈ padded VO length | `ship-checklist.py` | ratio outside 0.98–1.02 |

---

## E. Master (watch the file)

| # | Check | Tool | Fail if |
|---|--------|------|---------|
| E1 | Spot-watch hook (0:00–0:20): number + stakes first | human 60s | Civics lecture open |
| E2 | Spot-watch verdict clip: **RECEIPT** only, no Iran copy | `master-visual-qc.py` | Wrong Remotion defaults |
| E3 | No 7–23s trembling text cards | static PNG→mp4 | zoompan on text-card |
| E4 | Chart bars labeled; money flow readable | human | Unlabeled bars |
| E5 | Full master scribe once | gate 6 | Receipt-dump narration |

---

## F. Upload metadata

| # | Check | Tool | Fail if |
|---|--------|------|---------|
| F1 | Title matches hook ($8M / Bush / receipt) | viral panel | Cold-traffic bury |
| F2 | Description has FEC link + deep link | `eng/upload-descriptions/` | Missing source |
| F3 | Thumbnail shows $8M + face | `thumbnail.jpg` | Text-only thumb |
| F4 | `production-qc.json` pass true | `production-qc.py` | Any gate false |
| F5 | **Story score MASTER 100/100** | `story-score-lock.py --phase master` | composite ≠ 100 or dims 9–10 &lt; 10 |

---

## Commands (long-form)

```bash
cd companies/campaign-receipts

# After assemble:
python3 scripts/pipeline/production-qc.py \
  --storyboard eng/storyboards/cr-bell-bush-aipac-primary.json \
  --piece cr-bell-bush-aipac-primary

# Visual only:
python3 scripts/pipeline/master-visual-qc.py \
  --storyboard eng/storyboards/cr-bell-bush-aipac-primary.json \
  --build _build/cr-bell-bush-aipac-primary
```

---

## Incident log

| Date | Video | Failure | Fix |
|------|-------|---------|-----|
| 2026-05-21 | `SSlygpQQFM0` | Iran-deal `VerdictStamp` defaults + text-card zoompan tremor; upload without visual gate | Gate 8 `master-visual-qc.py`, static text-card, blank `promise` in render |

**Do not share or review private IDs until `production-qc.json` shows `"pass": true` after a fresh render.**
