# Production QC — 8 gates + Video-QC loop (portfolio standard)

**Status:** Implemented for **Campaign Receipts** (`companies/campaign-receipts/scripts/pipeline/production-qc.py`).  
**Goal:** Every channel prints the same pass lines before upload:

```
✅ PRODUCTION QC PASS (8 gates)
✅ MASTER VISUAL QC PASS
✅ VIDEO QC WATCH PASS  (no BLOCKERs from /watch lane)
```

---

## Gate list (binding)

| # | Gate ID | Check | Tool | Fail example |
|---|---------|-------|------|--------------|
| **G1** | `script_hygiene` | No stage directions in upload copy; banned phrases; reading level | `script-qc.py` | `[pause]` in description |
| **G2** | `vo_verify` | No `voiceover.verify-FAILED.txt` | filesystem | ElevenLabs WER fail |
| **G3** | `storyboard_policy` | Clip shapes, Remotion flags, on-screen text spec | `validate-storyboard.py` | Missing `expected_on_screen_text` |
| **G4** | `ship_checklist` | Clip durations, master/VO length ratio, audio stream | `ship-checklist.py` | 12s drift on beat 7 |
| **G5** | `vo_spoken_qc` | Scribe + banned phrases on VO | scribe + `qc_spoken.py` | “Martian” mis-transcribe loop |
| **G5b** (NTO only) | `vo_audio_qc` | **Pre-video:** Scribe vs ElevenLabs source (rules 26+27) | `vo-audio-qc.py` before `render-batch` | “called Dad” hallucination; garble at 11:58 |
| **G6** | `master_spoken_qc` | Scribe on assembled master | scribe + `qc_spoken.py` | Missing final sentence |
| **G7** | `audio_technical` | LUFS, clipping, voice ID | `audio-qc.py --strict` | Music over voice |
| **G8** | `master_visual` | OCR, safe zone, jitter, wrong template, **pillarbox/letterbox** (`shared/scripts/pillarbox_qc.py`) | `master-visual-qc.py` + `pillarbox_qc.py` | Wrong verdict stamp · **>10% black-bar canvas** (Ep1 failure mode) |
| **G8b** (NTO) | `visual_fatigue_qc` | Same clip appears once only, same-family b-roll fatigue, slow/hanging motion, stale filler sources | `validate-storybook.py` hard fails + contact sheets from complaint windows | Same jar/scroll/walking/oil-lamp visual repeated across minutes |
| **G9** | `video_qc_watch` | Claude actually **watches** the master via `shared/skills/watch` (frames + transcript), persona `20-video-qc-watcher` emits WINS / LOSSES / RETRY PLAN and loads NTO visual QC snippets | `council-review.py --video master.mp4` | “Martian” at 0:42; lip-drift 1:13–1:18; repeated loop 2:00–3:30; dead air 3:05 |

**Pass rule:** All 8 `pass: true` in `production-qc.json` **AND** G9 returns exit 0 (no `BLOCKER` lines in `20-video-qc-watcher` section of the council report).

**G9 loop semantics:** any `BLOCKER` → exit 2 → producer reruns named beats/VO chunks → re-call `--video <new master>` → repeat until 0 blockers. Reuses the same `reports/council/<slug>-<date>.md` file; no separate artifact.

**Memory promotion semantics:** when founder finds a new failure after a PASS, the repair is not complete until the lesson is promoted from one-off `_review/` notes into the active persona snippet or deterministic gate. For NTO visual failures, update `companies/NTO/personas/qc-snippets/visual-qc-learning-locks.md` and cite it in the next G9 report.

---

## Artifacts

```
<build>/
  production-qc.json      # G1–G8 summary
  master-visual-qc.json   # G8 detail
  ship-checklist.json     # G4 detail
  pacing-qc.json          # shorts: narration sync
  visual-qc.json          # shorts: overlay margins
```

---

## Channel overrides

| Channel | G5/G6 banned phrases | G8 extras |
|---------|---------------------|-----------|
| **CR** | “Jessica” drift, wrong politician name | FEC numbers on screen |
| **NTO** | “Martian”, “two gods” without fix, Marcion miss; **G5b** blocks video spend | James lip-sync drift, theology lower-thirds, **9:16 Hedra pillarboxed into 16:9 (Ep1 Postmortem 2026-05-22)** |
| **SEALED** | Iran/embassy copy bleed | Lulu watermark, chapter title |

### Pillarbox gate (G8 sub-check, all channels)

`shared/scripts/pillarbox_qc.py <master.mp4>` — uses ffmpeg cropdetect **AND** direct edge-slice brightness probe (cropdetect alone missed Ep1 because bars were RGB 26, just above the default threshold of 24). Refuses upload if any side is >10% black bar.

`youtube-upload.py` runs this automatically as a pre-upload gate on NTO and CR. Override only with `--skip-pillarbox-check` after founder review for intentional cinematic letterbox (e.g. 2.35:1).
| **EstimateProof** | “Carfax”, “NMVTIS title today”, “$25 report”, “Texas-only” | On-screen $ must match `listing.json`; CTA = free VIN check |

---

## When to run

| Moment | Command |
|--------|---------|
| After longform assemble | `production-qc.py --storyboard … --piece …` |
| After each Short | `production-qc.py --mode short --build …` |
| **After G1–G8 pass** | `council-review.py --script … --slug …-video-qc --video master.mp4` (G9 watch loop) |
| Before `youtube-upload.py` | Upload script **refuses** if not PASS (incl. G9 exit 0) |

---

## Relation to story score 100/100

- **Copy score 100** → before step 6a (TTS)  
- **NTO VO audio QC PASS (G5b)** → after VO render, **before** `render-batch` / Hedra / splice  
- **Production QC PASS** → after step 8 (master)  
- **Master score 100** → human dims 9–10 after spot-watch + G8  

Both required to publish.
