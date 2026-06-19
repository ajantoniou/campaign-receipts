# Production roster — who reviews what (binding)

Every ship uses **storyteller passes** (before TTS) + **council** (defensibility + lay comprehension) + **MrBeast viral producer** (`personas/council/11-mrbeast-viral-producer.md` → repo root playbook) + **viral panel** (CTR metadata) + **automated gates** (sync, OCR, audio).

## Storytelling (binding — before TTS)

**Canon:** `brand/storytelling-pipeline.md` · **Orchestrator:** `personas/storyline-editor.md` · **Gate:** `scripts/pipeline/script-storyteller-gate.py`

| Pass | Source | CR output |
|------|--------|-----------|
| A Screenwriter | `companies/NTO/personas/screenwriter.md` | Turn + protagonist; kill list-grammar |
| B JK clarity | `companies/NTO/personas/jk-rowling-storyteller.md` | Picture-first beats; 6th-grade gloss |
| C MrBeast retention | `shared/personas/mrbeast-viral-producer.md` | Hook + re-hooks 60–90s (LF) / turn in 15s (shorts) |
| D Storyline editor | `personas/storyline-editor.md` | `STORYLINE` HTML comment + mom-test |
| E Mechanical | `script-storyteller-gate.py` + `script-qc.py` | `qc-storyteller-*.md` PASS before ElevenLabs |

**Score:** `personas/storyteller-score-rubric.md` — **100/100 only** (every dimension 10). Enforced by `story-score-lock.py`.

**SEALED scripts:** `eng/longform-scripts/`, `eng/shorts-scripts/` — same passes; Iran LF (`sealed-iran-deal.md`) is the long-form template.

---

| Role | Persona file | Binding? | Gate / artifact |
|------|-------------|----------|-----------------|
| 6th-grade language | `personas/council/04-cincinnati-mom.md` | **YES** | Script + `upload-metadata.md` plain-English test |
| Political journalist | `companies/Sealed/subagents/political-journalist.md` | Advisory → council | `council.md` historian + journalist notes |
| Political historian | `personas/council/01-political-historian.md` | Advisory | `council.md` |
| Fact-check QC | `personas/council/05-fact-check-qc.md` | **YES** | Figures vs book / FEC |
| **MrBeast viral producer** | `personas/council/11-mrbeast-viral-producer.md` | **YES** (packaging) | Script + title/thumb + cold open; canon: `/MRBEAST-HOW-TO-GO-VIRAL.md` |
| Viral hook (in-video) | `personas/council/02-viral-hook-specialist.md` | Advisory | First 3s of master |
| Cinematographer | `personas/council/03-cinematographer.md` | Advisory | Clip quality |
| Video editor | `personas/council/10-video-editor.md` | Advisory | Pacing, cuts, grade |
| Remotion expert | `personas/council/09-remotion-expert.md` | Advisory | `remotion` clips in storyboard |
| Visual QC (overlays) | `personas/council/07-visual-qc.md` | **YES** | `visual-qc.json` |
| Pacing QC (narration sync) | `personas/council/08-pacing-qc.md` | **YES** | `pacing-qc.json` / scribe segments |
| Audio QC | `personas/council/06-audio-qc.md` | **YES** | `audio-qc.py` before upload |
| SFX | `personas/sfx-specialist.md` | Advisory | `apply-sfx.mjs` |
| **Title strategist** | `personas/viral-panel/01-title-strategist.md` | **YES** (metadata) | `youtube-meta.json` → title |
| **Thumbnail designer** | `personas/viral-panel/02-thumbnail-designer.md` | **YES** | `generate-thumbnail.mjs` |
| **First 3 seconds** | `personas/viral-panel/03-first-three-seconds.md` | Advisory | Short hook / long cold open |
| **Description / tags** | `personas/viral-panel/04-algorithm-strategist.md` | **YES** | `description.md` + tags |
| **Clip cutter** | `personas/viral-panel/05-clip-cutter.md` | CR new-news | Fair-use sidecars |
| **YouTube monetization** | `personas/viral-panel/07-youtube-monetization.md` | **YES (monetization)** — warn-only in `pre-upload-pack.py` today; hard-fail next session | `eng/qc-reports/<slug>/youtube-monetization.md` + `monetization.qc_report` field in `youtube-meta/<slug>.json` (object alongside `ai_disclosure_line` / `ad_friendly_call` / `appeal_after`) |
| **MrBeast packaging** | `personas/viral-panel/06-mrbeast-packaging.md` | **YES** (CTR/AVD/AVP) | thumbnail + title + description first-line |
| Series architect | `personas/series-architect.md` | Advisory | Playlist / episode order |
| Video producer | `personas/video-producer.md` | Orchestration | `produce-video.py` / runbook |

**Automated (no LLM):** `ship-checklist.py`, `validate-storyboard.py`, `audit-clip-ocr.py`, `produce-from-storyboard.py` volumedetect.

**Music:** CC-BY bed `companies/Sealed/public/movie/_build_v4/music.mp3` (Impact Prelude). Sidechain under Jessica; mood = investigative documentary.

**MrBeast packaging (binding before upload):** `personas/viral-panel/06-mrbeast-packaging.md` — title + thumbnail + description first lines are **one unit** with the cold-open VO. Write pass to `eng/qc-reports/<slug>/mrbeast-packaging.md`, then ship fields in `eng/youtube-meta/<slug>.json` (CR new-news: `--template cr-new-news`; SEALED long-form: parchment thumb — giant number + outcome, mirror hook).

**YouTube monetization (binding before upload — warn-only today, hard-fail next session):** `personas/viral-panel/07-youtube-monetization.md` — runs alongside MrBeast packaging. Different lens: MrBeast owns **CTR + AVD**, monetization owns **ad-suitability + RPM + Content ID risk + mid-roll/length strategy + AI-content authenticity**. When the two conflict (e.g. an extreme-word title that maxes CTR but trips ad-suitability), packaging yields. Write pass to `eng/qc-reports/<slug>/youtube-monetization.md`, then add `monetization.qc_report` to the existing `monetization` object in `eng/youtube-meta/<slug>.json` (the object also carries `ai_disclosure_line`, `ad_friendly_call`, `appeal_after` — pre-existing fields that `pre-upload-pack.py` and `upload-queue-runner.py` already consume to splice the AI-narration disclosure into the description). `pre-upload-pack.py` prints a warn line in `upload-metadata.md` when `qc_report` is missing — **does not block upload yet** (honest scope: gate 10 hardening lands next session once the canon set has reports on disk).

**Pre-upload bundle:** `python3 scripts/pipeline/pre-upload-pack.py --slug <slug> --mode short|longform` (reads `youtube-meta` — never upload with placeholder titles)

**Replace-on-upload (binding):** after `production-qc.py` passes (including gate 9 `/watch`), use `youtube-upload.py --replace-id OLD_ID` so the broken v1 is **only deleted after** the new master is live, in the right playlist, and the custom thumbnail is set. Then update `eng/PUBLISHED-YOUTUBE.md` with the new ID. Never let a buggy LF/short coexist with its fix.

**Playlist routing (binding):** the channel hosts SEALED + CR new-news. `youtube-upload.py` auto-routes by slug — `sealed-*` → **Sealed2016** playlist (auto-created on first use), `cr-*` → CR new-news playlist. Backfill helper: `python3 scripts/pipeline/sealed-publish-sync.py`. See `eng/PUBLISHED-YOUTUBE.md` § Playlists for the full recipe.

---

## Shorts visual stack (binding — 2026-05-22)

**Driver:** `scripts/shorts/produce-short-generic.mjs` · **Config:** `scripts/shorts/episodes/<slug>.json`

| Layer | Tool | When | Policy |
|-------|------|------|--------|
| Hook B-roll | **fal.ai** `kling3-pro` or `sora2`, 9:16, `--no-audio` | Every `segments.*.broll` | Atmospheric only — Capitol, border, port, campus wide. **No synthetic politician faces** (house-style suffix in `fal-video-premium.py`). |
| Lead-in still | **fal.ai** FLUX `flux-pro` portrait still + ken-burns | `segments.*.illustration` on receipt beats | Editorial line-art / maps — **no legible text** in prompt (numbers live in Remotion). |
| Explainer | **Remotion** 1080×1920 | `composition` on hook/receipt/verdict | Charts, timelines, `VerdictStamp`, `SourceCard`, `MoneyFlow`, `CountUp`. |
| CTA | Motion receipt card | `cta` segment only | SEALED2016.COM end slate. |
| Sync | ElevenLabs **Scribe** | `sync_specs` anchors | Picture changes when Sarah hits the receipt — not even-split slides. |
| Grade | ffmpeg `eq` + `unsharp` | Master concat | Match long-form documentary punch. |

**Premium template (Iran AIPAC):** `produce-viral-001.mjs` — richer SVG + word overlays; keep for `sealed-001`.

**Higgsfield:** optional Cinema Studio b-roll when `CR_HIGGSFIELD_*` is provisioned in root `.env`; until then fal kling3-pro is the automated cinematic layer. Do not skip fal/remotion and ship static cards.

**Produce command:**
```bash
node scripts/shorts/produce-short-generic.mjs --episode sealed-007-repeal-obamacare
# debug without fal spend:
node scripts/shorts/produce-short-generic.mjs --episode sealed-007-repeal-obamacare --skip-fal --skip-tts
```
