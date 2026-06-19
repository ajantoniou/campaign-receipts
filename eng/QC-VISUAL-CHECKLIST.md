# Visual QC Checklist — SEALED + CR Master Videos

**Status:** LOCKED 2026-05-24 by founder. Per `eng/CR-PRODUCTION-PIPELINE-v4.md` Doctrine line 8. Applies to **every** short and LF master before upload — no exceptions.

**Tool:** `scripts/pipeline/qc-visual-master.py` (runs `/watch` skill + structured-output rubric per check). Per-check verdict: PASS / FAIL / WARN. **Any FAIL halts the pipeline** at Stage 25-26.

---

## 10 binding checks (per-master)

### V1 — Text not cropped at frame edges
**Detect:** OCR every text-card frame; reject if any glyph bbox touches the outer 2% margin (top/right/bottom/left).
**Pass when:** all visible text sits within the safe-zone rectangle (1080×1920 → safe-zone 21px inset).
**Common fail:** SourceCard "SOURCE" stamp poking past right edge on vertical (pre-2026-05-24 bug). Long titles in Timeline events wrapping under the date.

### V2 — Text card visible ≥ 1.2 s
**Detect:** measure the on-screen duration of every text element using OCR frame-to-frame stability + the sync_specs declared per-segment duration.
**Pass when:** every distinct on-screen text string is visible for ≥ 1.2 s of continuous frames.
**Common fail:** mid-segment Remotion animation that swaps text faster than humans can read. Hook lines that get cut off by an early CTA.

### V3 — No empty-frame moments > 0.5 s mid-animation
**Detect:** OCR pass + scene-diff; flag any window of ≥ 15 frames (0.5 s at 30 fps) where the parchment background is >90% of pixel area AND there's no intentional design reason (e.g. SourceCard 0.3 s fade-in window is allowed; >0.5 s is not).
**Pass when:** every beat has visible content for at least 95% of its declared duration.
**Common fail:** Timeline title appears at t=0 but events don't animate in until 1+ s later, leaving 90% blank. (Fixed 2026-05-24 by `VerticalTimeline` faster `eventsStart`.)

### V4 — Verdict stamp lands at correct timestamp
**Detect:** parse the episode JSON `sync_specs` for the segment id matching `broken|kept|partial|verdict|stamp`; OCR the master to find the first frame where the verdict word appears; verify within ±0.5 s of declared segment start.
**Pass when:** verdict beat starts where the script anchors it.
**Common fail:** anchor-collapse bug (the 2026-05-23 scribe issue) producing CTA-card freeze with stamp at the wrong moment. NO-VO mode immune by design (declared durations) but verify anyway.

### V5 — B-roll content matches attribution sidecar
**Detect:** for every `_yt-broll-*.mp4` in the build dir, sample 3 frames and run `claude` vision against the sidecar's `notes` field. Reject if the frame description contradicts the notes (e.g. "Trump press statement at White House" vs sidecar note "Ivanka pulling cloth off plaque").
**Pass when:** every b-roll cut visually matches its attribution.
**Common fail:** the **2026-05-23 cache-id bug** where `download_source()` returned mtime-newest cached file instead of id-matched, so 007's mccainBeat got the Hanukkah footage. Fixed in `youtube-broll-clip.py` but worth verifying every rebuild.

### V6 — On-screen text spelling matches script text-cards
**Detect:** OCR every Remotion frame; diff against `eng/shorts-scripts/<slug>.md` text-card lines + episode JSON `segments.*.props.{quote,label,title,citation,source}`.
**Pass when:** every visible text string exists verbatim in the script or episode JSON.
**Common fail:** AI hallucination during Remotion render (the 2026-05-21 "EXESICUTIVE ORDER" / "HAAD COMNAP UN TARRIT" gibberish bug from FAL prompts). Already mitigated by removing FAL stills from SEALED shorts, but the gate stays.

### V7 — Total runtime ≤ 60 s for shorts (≤ 600 s for LFs)
**Detect:** `ffprobe -show_entries format=duration`.
**Pass when:** master duration within YouTube's mode constraint.
**Common fail:** declared durations summing wrong + animation tail-fades pushing past the cap. Hard fail because YouTube Shorts shelf demotes >60s.

### V8 — Audio: no speech in shorts (Doctrine line 4)
**Detect:** existing `qc-shorts-no-vo.py` Stage 27 gate. Already wired.
**Pass when:** music-band + no speech-band content per VAD.
**Common fail:** accidental TTS render that survived cleanup. Hard rule per 2026-05-24 lock.

### V9 — Text not occluded by stamp or CTA
**Detect:** for each frame containing the verdict stamp, verify no other text element overlaps its bbox by >10%. For the CTA card, verify no prior beat's text persists into the CTA's first frame.
**Pass when:** every on-screen text element is fully legible (no z-index collisions).
**Common fail:** Timeline event labels overlapping a late-arriving verdict stamp on horizontal Timeline (pre-vertical-fix). The 2026-05-23 "145 PROMISES" CTA bleeding into the final verdict beat.

### V10 — Hook beat readable in 5 s without context
**Detect:** spawn a vision-LLM subagent against the first 5 s of frames + ask "what is this video about, what's the verdict, in one sentence." Compare to `eng/youtube-meta/<slug>.json` `title`.
**Pass when:** vision-LLM single-sentence summary contains the title's key noun + verdict word.
**Common fail:** hook that requires context not yet on screen (e.g. "Then one didn't" without first showing "every president since Nixon released them").

---

## Pipeline integration

**Stage 25** (master visual QC Pass 1) and **Stage 26** (master visual QC Pass 2 independent re-run) in `eng/CR-PRODUCTION-PIPELINE-v4.md` both invoke:

```bash
python3 scripts/pipeline/qc-visual-master.py --master <path> --episode <slug> --pass {1|2}
```

The script returns exit 0 (PASS) or exit 2 (FAIL) with a JSON report at `_review/qc-visual-<slug>-pass{1|2}.json` listing per-check verdicts + offending frame paths + fix-it-yourself suggestions where deterministic.

**Pass 2 is structurally independent** — re-runs `/watch` with a different frame budget (denser sampling on hot zones: hook, verdict, CTA transitions) so it catches issues Pass 1's sparse sampling missed.

---

## Founder-override path

Only V8 (no-VO) and V5 (b-roll-content-mismatch) are NEVER override-able — both are doctrine, not preference. V1, V2, V3, V4, V6, V7, V9, V10 can be overridden with an `OVERRIDE: <one-line rationale>` markdown line appended to the QC report. Override is logged to `.external-costs.jsonl` for audit.

---

## What this checklist replaces

- Per-session ad-hoc spot-checks ("I looked at 3 frames")
- Founder time spent scrubbing 15 videos before declaring ready
- The 2026-05-24 incident where I shipped a doctrine that required `/watch` ×2 then skipped both passes on 15 shorts and only caught the SourceCard floating-card issue when the founder asked

---

## Provenance

- 2026-05-23: cache-id bug discovered + fixed in `youtube-broll-clip.py` → motivated V5
- 2026-05-23: ChartBar "Trump bar taller than Obama" frame-sampling bug → motivated V4 + V3 (animation-window awareness)
- 2026-05-24: SourceCard + Timeline floating-in-middle on 9:16 → motivated V1 + Doctrine line 7 9:16 vertical default
- 2026-05-24: founder direction "tasks of what you're looking for, text not cropped" → this checklist
