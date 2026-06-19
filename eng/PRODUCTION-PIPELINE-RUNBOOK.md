# CampaignReceipts Video Production Pipeline — Runbook

> Audience: any future CR agent session asked to ship a promise video to
> `@CampaignReceiptsYoutube` (channel `UC4NINNbjaoy2PTKxbY5an-g`).
> Last verified: 2026-05-18.

This runbook is the complete handoff. Read it top to bottom before
spawning subagents or running any pipeline script.

---

## 1. The mental model

**One long-form per promise (3-5 min) → 2-4 shorts written FRESH, not auto-spliced.**

- The long-form carries the *insight* (6th-grade language, every figure
  cited to the SEALED book). Founder confirmed 2026-05-21 that
  long-form storytelling cadence is working — don't change the long-form
  VO register.
- The shorts carry the *shock* (headline figure, reveal, CTA). Shorts use
  **the same Jessica/Sarah voice** as long-form — tighter sentences, not a
  second character (`brand/voice-writing.md`). **Do NOT compress long-form
  VO into a short**; write the short script from scratch.
- **Voice (long + short):** Jessica → **Sarah** (kitchen-table receipt reader).
  `CR_ELEVENLABS_SARAH_VOICE_ID` / `--voice jessica`.
- **Packaging (founder lock 2026-05-22):** Every CR new-news upload runs `personas/viral-panel/06-mrbeast-packaging.md` — title + thumbnail + first spoken line are one unit. Thumbnail uses `--template cr-new-news` (navy/high-contrast). Description opens with the verbatim first VO line + chapter timestamps. See `MRBEAST-HOW-TO-GO-VIRAL.md`.
- **Growth links (founder lock 2026-05-27):** Every long-form and Short description includes CampaignReceipts.com, SEALED2016.com, and the free newsletter signup at `campaignreceipts.com/weekly`. `youtube-upload.py` blocks upload/metadata update if any of those links are missing.
- **Monetization (founder lock 2026-05-22):** Every CR new-news upload (LF + shorts) AND every SEALED long-form runs `personas/viral-panel/07-youtube-monetization.md` — YPP eligibility + maintenance, AI-content authenticity (mass-produced policy effective 2025-07-15), ad-friendly icon (green / yellow-expected / red-risk), mid-roll placement + length-unlock strategy, Content ID risk by clip source, and flagging direct revenue opportunities (Super Thanks, channel memberships) when thresholds unlock. AIPAC / Israel-funding episodes are flagged **yellow-expected** by default; appeal Studio's *Limited or no ads* after 7 days at >1k views. AI-narration disclosure line goes in `eng/youtube-meta/<slug>.json → monetization.ai_disclosure_line` and is appended to `description.md` by `pre-upload-pack.py`. Per-slug QC report path goes in `monetization.qc_report` (warn-only today in `pre-upload-pack.py`; hard-fail next session).
- **Phase = audience-build (founder lock 2026-05-23):** Yellow-icon (`Limited or no ads`) is **not a ship-blocker**. Channel is sub-YPP threshold; subscribers + watch-time take priority over AdSense. AIPAC / Israel-funding / foreign-policy episodes ship even when 07 predicts yellow icon. Apply yellow-icon optimization **only** to lift videos out of red-icon (`No ads`) territory or to recover from policy strikes. The HARD NO list in `07-youtube-monetization.md` stays binding regardless of phase. Re-evaluate at ~25k subs OR YPP unlock (whichever first).
- **Visuals:** Remotion explainers (maps, arrows, tables) + text-cards +
  book-style caricatures (`brand/visual-explainer-policy.md`). Higgsfield
  is available for prepaid polished atmosphere only; fal.ai remains the
  repeatable CLI fallback/patch layer. **No Hedra in normal production,**
  no real-politician AI faces, and no Wikimedia→kling-i2v hyperreal close-ups.
  Jessica is **voice-only** on new SEALED v5+ and all CR new-news episodes.

**Audience anchor:** "Cincinnati Mom" — 38yo Cincinnati accountant.
She is the binding reviewer (`personas/council/04-cincinnati-mom.md`).
If she doesn't get it in 5 seconds, it doesn't ship.

---

## 2. Hard rules (do not violate)

1. **DO NOT MODIFY `companies/nt-ministry/`** — read-only reference for
   premium video stack patterns. Never fork via git, never import. Our
   pipeline scripts live in `companies/campaign-receipts/scripts/pipeline/`
   as self-contained copies.
2. **No AI-generated faces of named real living politicians.** Use
   Wikimedia photos from `public/photos/wikipedia/` (each has a
   `.attribution.json` sibling — preserve attribution).
3. **Jessica is voice-only.** No Hedra lip-sync, no presenter face on
   new long-forms or CR new-news without explicit founder approval.
   Hedra is allowed only for a clearly fictional/non-politician Betsy
   intro/outro experiment with disclosure and lip-sync/watch QC. See
   `brand/visual-explainer-policy.md`.
4. **Politician visuals:** `politician-caricature` + `caricature_slug` (Trump/Adelson book lane — `scripts/pipeline/politician-caricature.py`, manifest `public/brand/caricatures.manifest.json`, ~$0.04/face FLUX Pro, cached). Legacy: `image-kenburns` + static `image_path`.
   static art — **not** kling-i2v on Wikimedia portraits (uncanny on mobile).
5. **NEVER render readable text via image models (FLUX/Sora/Kling).**
   Text on stills MUST be Puppeteer HTML→PNG. Image models garble
   numbers ("3.6.1%", "iiv6", "withrawal" — confirmed 2026-05-20 and
   2026-05-21). Image models do imagery (faces, scenes, atmosphere);
   HTML does text (figures, dates, source citations, verdict stamps,
   any callout the viewer must read).
4. **$500/company hard cap.** ~$10 per long-form is the target. Use
   `--dry-run` to preview cost before any render.
5. **Founder is binding reviewer at upload gate** unless explicitly
   relaxed for a given batch.
6. **OAuth secrets live in `/Applications/DrAntoniou Projects/AgentCompanies/.env`**
   (gitignored). Never commit. Token key: `CR_YOUTUBE_REFRESH_TOKEN`.
7. **Copy before pixels.** Screenwriter → JK → MrBeast → storyline editor → **story score 100/100**
   → council SHIP → `eng/copy-locks/<slug>.json` before TTS.
   **Canon:** `docs/CR-PRODUCTION-PIPELINE.md` · **Rubric:** `personas/storyteller-score-rubric.md`
   · **Gate:** `story-score-lock.py` + `copy-lock.py` at produce stage 0.
8. **Binding QC is automated, not persona theater.** Post-render upload blocked unless
   `production-qc.py` exits 0 (wired into `produce-from-storyboard.py`,
   `produce-video.py`, and `youtube-upload.py --storyboard`). Council / viral markdown
   on the **master** is still required for founder upload — but script council runs **before** render.

### Binding QC stack (2026-05-21 — ep1 metadata leak fix)

| Stage | Script | When |
|-------|--------|------|
| Pre-TTS | `script-qc.py` | Before `elevenlabs-tts` (also in `stage_vo`) |
| TTS verify | `elevenlabs-tts.py` | Scribe + `qc_spoken` on `vo.mp3`; deletes bad audio |
| Post-assemble | `production-qc.py` | After `master.mp4` exists |
| Pre-upload | `production-qc.py` | `youtube-upload.py --storyboard …` |

**Canonical producer (use this, not raw assemble + manual upload):**

```bash
cd companies/campaign-receipts
python3 scripts/pipeline/produce-video.py \
  --storyboard eng/storyboards/<slug>.json \
  --piece <piece-id> \
  --upload private
```

`production-qc.py` runs: script hygiene → no `vo.verify-FAILED.txt` →
`validate-storyboard.py` → `ship-checklist.py` → Scribe banned-phrase scan
on `vo.mp3` + `master.mp4` → `audio-qc.py --strict`.

Escape hatches (`--skip-production-qc`, `--skip-audio-qc`) are for
emergency debugging only — not normal shipping.

---

## 3. File map

```
companies/campaign-receipts/
├── brand/
│   ├── betsy-portrait.png              # CANONICAL. Seed for all Betsy clips.
│   └── betsy-character-bible.md        # Voice + visual + DO/DON'T
├── personas/
│   ├── betsy-the-narrator.md           # Voice anchor (ElevenLabs voice EXAVITQu4vr4xnSDxMaL)
│   ├── video-producer.md               # Vendor-pick decision tree
│   ├── series-architect.md             # Long-arc plan across 145 promises
│   ├── the-lay-viewer.md               # Cincinnati Betsy (audience composite)
│   ├── council/                        # editorial integrity
│   │   ├── 01-political-historian.md … 06-audio-qc.md
│   └── viral-panel/                    # YouTube CTR + metadata
│       ├── 01-title-strategist.md … 05-clip-cutter.md
├── scripts/pipeline/
│   ├── produce-from-storyboard.py      # Orchestrator. --dry-run / --resume
│   ├── fal-video-premium.py            # Sora 2 / Veo 3.1 / Seedance / Kling 3 Pro
│   ├── fal-kling-i2v.py                # Image-to-video (Betsy anchor + portrait shots)
│   ├── fal-stills-gen.py               # FLUX Pro stills
│   ├── bake-music.py                   # stable-audio cues
│   ├── cut-shorts-v2.py                # Auto-splicer (long-form → shorts)
│   ├── elevenlabs-tts.py               # Betsy VO + scribe-verify gate
│   ├── youtube-upload.py               # YouTube Data API uploader
│   └── fetch-wikipedia-photos.mjs      # Wikimedia photo fetcher (preserves attribution)
├── eng/
│   ├── longform-scripts/               # Canonical scripts (every figure cited to book)
│   ├── storyboards/                    # JSON v3 storyboards (vendor-aware)
│   └── PRODUCTION-PIPELINE-RUNBOOK.md  # THIS FILE
├── public/
│   ├── photos/wikipedia/               # Real-politician photos + attribution
│   ├── shorts/                         # Final shorts (committed if <10MB)
│   └── longform/                       # Long-form .mp4 (gitignored, >100MB)
└── _build/<slug>/                      # Per-video render state
    ├── state.json                      # Resume checkpoint
    ├── vo.mp3                          # Betsy VO
    ├── betsy-anchor-{hook,verdict,cta}.mp4
    ├── clips/                          # Per-clip renders
    └── driver.log
```

---

## 4. End-to-end workflow

### Step 0 — Script hygiene (mandatory)

- **Only `**VO:**` lines are synthesized.** Metadata (`Slug`, `Voice`, `Pillar`) lives in `<!-- HTML comments -->`, never bold `**Voice:**` at the top — ElevenLabs will read it aloud if `**VO:**` blocks are missing.
- `elevenlabs-tts.py` **refuses** scripts with no `**VO:**` lines and **rejects** spoken text containing `slug`, `on screen`, `elevenlabs`, etc.
- Failed scribe verify **deletes** `vo.mp3`; re-run with `produce-from-storyboard.py --resume --force-vo`.

### Step 1 — Write the long-form script

`eng/longform-scripts/<slug>.md`. 10 scenes, ~700 words VO, ~4 min.
**Every figure must cite a line in the SEALED book** (`companies/concise-sealed/manuscript/`).
Reference: `eng/longform-scripts/sealed-iran-deal.md` — verified
$82M Adelson (line 749), JCPOA May 8 2018 (740), EO 13899 Dec 11 2019 (744).

### Step 2 — Storyboard the long-form (JSON v3, vendor-aware)

`eng/storyboards/<slug>.json`. Per-clip:
```json
{
  "id": "s3-01",
  "duration_s": 6,
  "vo_text": "...",
  "prompt": "...",
  "model": "fal-ai/sora-2 | fal-ai/veo-3.1-fast | fal-ai/kling-video/v2.5-pro/image-to-video | fal-ai/flux-pro/v1.1 | puppeteer-html-png",
  "model_args": { ... },
  "characters_count": 0,
  "has_dialogue": false,
  "image_seed": "brand/betsy-portrait.png",   // only for Kling i2v
  "cited_figures": [                          // REQUIRED for Fact-Check QC
    {
      "figure": "$82 million",                 // exact form on-screen
      "vo_form": "eighty-two million dollars", // exact form spoken
      "source": "companies/concise-sealed/scripts/build-retail-pdf.mjs:675",
      "note": "Adelson 2016-cycle Republican-aligned committees (FEC/OpenSecrets)"
    }
  ],
  "sfx": [                                    // optional, layered at assembly Step 9.5
    {"asset": "moneyflow-whoosh-1.wav", "at_s": 1.2, "gain_db": -26},
    {"asset": "moneyflow-whoosh-1.wav", "at_s": 2.4, "gain_db": -26},
    {"asset": "moneyflow-whoosh-1.wav", "at_s": 3.6, "gain_db": -26}
  ]
}
```

Every cited number, date, percentage, dollar figure, or proper-noun
title MUST appear in `cited_figures` with its source line. The
Fact-Check QC role (Section 7) consumes this field — without it, QC
auto-fails.

**Vendor-pick decision tree** (from `personas/video-producer.md`):
- **Animated info-design (charts, timelines, money-flow, count-ups, verdict stamps, source cards)** → **Remotion** ($0/clip, self-hosted). See `/remotion/README.md` and the `claude-remotion` skill. **Prefer this for any clip whose job is to MOVE information** — not for clips whose job is to look like real video.
- 1 character (Betsy) → **kling-i2v** anchored from canonical PNG ($0.07/s)
- 2+ chars no dialogue → **sora2** ($0.10/s)
- On-screen dialogue → **veo3-fast** ($0.15/s)
- No characters atmospheric → **wan-2.5** ($0.05/s) or **FLUX still + ken-burns** ($0.04)
- Cinematic hero/climax → **kling3-pro** ($0.17/s)
- Avoid Seedance — currently broken on fal backend.

**Hard rule (added 2026-05-21):** Animated info-design (charts,
timelines, money flow, count-ups, verdict stamps) **MUST** use Remotion,
not fal stills + ken-burns. Information must MOVE. Ken-burns on a static
chart is slop.

**Remotion storyboard schema** — when `model: "remotion"`:
```json
{
  "id": "s6-02",
  "duration_s": 6,
  "vo_text": "...",
  "model": "remotion",
  "composition": "MoneyFlow",   // one of CountUp | MoneyFlow | Timeline | VerdictStamp | ChartBar | SourceCard
  "props": { "source": {...}, "destinations": [...] },
  "cited_figures": [ ... ]      // still required — fact-check QC still runs
}
```

### Step 3 — Cost preview

```bash
cd companies/campaign-receipts
python scripts/pipeline/produce-from-storyboard.py \
  --storyboard eng/storyboards/<slug>.json \
  --dry-run
```

Target: ≤$10 clips. If higher, downgrade Sora 2 → FLUX stills + ken-burns.

### Step 4 — Generate VO

**Pre-process the VO text BEFORE sending to ElevenLabs:**

1. **Pre-phoneticize years.** ElevenLabs reads "2016" as "twenty
   thousand 16" (regression confirmed 2026-05-21). Replace ALL year
   tokens with spelled-out form:
   - `2016` → `twenty sixteen`
   - `2017` → `twenty seventeen`
   - `2018` → `twenty eighteen`
   - `2019` → `twenty nineteen`
   - `2020` → `twenty twenty`
   - `2024` → `twenty twenty-four`
2. **Pre-phoneticize dollar figures with M/B suffixes.** `$82M` →
   `eighty-two million dollars`. `$3.5B` → `three point five billion`.
3. **Pre-phoneticize Roman numerals + abbreviations.** `EO 13899` →
   `Executive Order one-three-eight-nine-nine`.

```bash
python scripts/pipeline/elevenlabs-tts.py \
  --voice EXAVITQu4vr4xnSDxMaL \
  --cadence teacher \
  --speed 0.93 \                          # 10% slower than default
  --text-file eng/longform-scripts/<slug>.md \
  --out _build/<slug>/vo.mp3
```

**Naming convention (locked 2026-05-21):**
- **Betsy** = the on-screen CHARACTER (Georgia farm, early 40s, the face
  in `brand/betsy-portrait.png`)
- **Bella** = the ElevenLabs VOICE (voice_id `EXAVITQu4vr4xnSDxMaL`)
  currently casting as Betsy for the long-form
- Two different things, two different names. Don't conflate. If you
  write "Betsy voice" anywhere, you're wrong — it's "Bella voice" or
  "Betsy's voice (cast: Bella)".
- The short voice may switch to an A/B winner (Aria/Grace/Charlotte/
  Lily/Matilda) — that becomes "Bella for long-form, <winner> for
  shorts" until/unless we unify.

**Canonical Bella teacher-cadence voice settings (verified 2026-05-21
on the SEALED-001 v2 short):**
```
stability=0.55
similarity_boost=0.82
style=0.20
speed=0.93
model=eleven_multilingual_v2
```
Add `<break time="0.4-0.6s"/>` SSML between sections for natural pauses.

> **Driver-script gap as of 2026-05-21:** `scripts/pipeline/elevenlabs-tts.py`
> hardcodes `stability=0.7, similarity=0.85, style=0.0` and does NOT
> expose `--speed` or `--style`. The SEALED-001 short v2 was generated
> via a one-shot bypass script. Patch the production script before
> shipping the next short — add `--speed`, `--style`, and a
> `--cadence teacher` preset that locks in the canonical values above.

> **Scribe-verify caveat:** ElevenLabs Scribe normalizes spoken-out years
> back to digits in its transcript. If you wrote "twenty sixteen" in the
> input text and Scribe returns "2016", that is CORRECT — the audio
> says "twenty sixteen", the transcript just rewrites it. Don't grep
> for "twenty sixteen" expecting a hit; grep the INPUT text instead, and
> grep the audio Scribe output for "twenty thousand" (which IS the
> regression signal).

**Critical:** pass ONLY the VO lines, not the full memo. The
scribe-verify gate flags >5% WER. (We blew $2.08 once by sending the
whole memo — caught by the gate.)

### Step 5 — Betsy anchor clips (3 × ~10s)

```bash
for ROLE in hook verdict cta; do
  python scripts/pipeline/fal-kling-i2v.py \
    --image brand/betsy-portrait.png \
    --prompt "Betsy, warm smile, subtle head turn, slight nod, $ROLE energy" \
    --duration 10 \
    --out _build/<slug>/betsy-anchor-$ROLE.mp4
done
```

### Step 5.5 — Render Remotion animations (animated info-design)

For any storyboard clip with `model: "remotion"`, the driver calls
the adapter below. The adapter shells out to `npx remotion render`
against the monorepo-root project at `/remotion/`.

```bash
node scripts/pipeline/render-remotion.mjs \
  --composition MoneyFlow \
  --duration 6 \
  --props '{"source": {"name": "Adelson", "amount": 82000000}, "destinations": [{"label": "Iran deal killed"}, {"label": "Embassy moved"}, {"label": "EO 13899"}]}' \
  --out _build/<slug>/clips/<id>.mp4
```

Outputs 1280×720 @ 30fps h264 mp4 — drops directly into the assembly
step (Step 7) with no re-normalization.

Available compositions (full prop schemas in
`~/.claude/skills/claude-remotion/reference/COMPOSITIONS.md`):

- `CountUp` — animated number $0 → $X
- `MoneyFlow` — source → destinations with arrows
- `Timeline` — horizontal timeline with sequential reveals
- `VerdictStamp` — stamp drop with rotation + shake
- `ChartBar` — bar-by-bar fill chart
- `SourceCard` — citation pull-quote card

All accept `brand`: `"campaign-receipts" | "sealed" | "nt-ministry" | "estimateproof"`.

**Cost:** $0 per render (local node). Switches to Render-hosted
service when daily volume >10 clips/day (`render-remotion-renderer.yaml`).

### Step 6 — Render storyboard (with resume)

```bash
python scripts/pipeline/produce-from-storyboard.py \
  --storyboard eng/storyboards/<slug>.json \
  --build-dir _build/<slug> \
  --resume
```

`state.json` is checkpointed per clip. If a clip fails (Sora content
filter on politically sensitive imagery is the common case), the driver
writes state and exits. Recover by:
1. Rewriting the prompt with abstract framing in the storyboard JSON
2. Re-running with `--resume`
3. If it fails twice, fall back to FLUX still + ken-burns

### Step 7 — Assemble long-form

The driver assembles to `_build/<slug>/master.mp4` once all clips are
`status: ok` in `state.json`.

### Step 8 — Apply Betsy presenter beats (NOT corner anchor — deprecated)

> Founder feedback 2026-05-21: the 180×180 corner anchor is gone.
> Betsy appears full-frame at four beats, blended with the scene + the
> text overlay she's pointing to. The recipe below is preserved only
> for the legacy block-quote text further down (do not use it).

For each of the four presenter beats (intro / mid-1 / mid-2 / outro):

1. Generate the Betsy clip via Kling i2v from the canonical portrait,
   ~6-8s, with prompt describing her gesture ("Betsy, warm smile,
   gestures toward graphic on her right, slight head turn")
2. Overlay her clip into the scene with a soft alpha mask (left third
   or right third of the frame, ~60% width, feathered edge)
3. Render the text callout she's pointing to as a Puppeteer HTML→PNG,
   composite over the remaining frame area
4. Crossfade in/out (~0.5s each side)

The four beats replace the master.mp4 segments at those timestamps —
they're not overlays on top of pre-rendered clips. Storyboard those
beats as first-class clips with `model: "fal-ai/kling-video/v2.5-pro/image-to-video"`
and `image_seed: "brand/betsy-portrait.png"`.

#### Legacy corner-anchor recipe (DEPRECATED — do not use for new videos)

```bash
LONG=$(ffprobe -v error -show_entries format=duration -of csv=p=0 \
  _build/<slug>/master.mp4 | awk '{printf "%d",$1}')
VS=$(echo "$LONG - 20" | bc); VE=$(echo "$LONG - 10" | bc)
CS=$(echo "$LONG - 8" | bc);  CE=$(echo "$LONG - 2" | bc)

ffmpeg -y \
  -i _build/<slug>/master.mp4 \
  -i _build/<slug>/betsy-anchor-hook.mp4 \
  -i _build/<slug>/betsy-anchor-verdict.mp4 \
  -i _build/<slug>/betsy-anchor-cta.mp4 \
  -filter_complex "
    [1:v]scale=180:180,format=yuva420p,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=7.5:d=0.5:alpha=1[a1];
    [2:v]scale=180:180,format=yuva420p,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=9.5:d=0.5:alpha=1[a2];
    [3:v]scale=180:180,format=yuva420p,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=5.5:d=0.5:alpha=1[a3];
    [0:v][a1]overlay=W-200:20:enable='between(t,0,8)'[v1];
    [v1][a2]overlay=W-200:H-200:enable='between(t,$VS,$VE)'[v2];
    [v2][a3]overlay=W-200:20:enable='between(t,$CS,$CE)'[v]" \
  -map "[v]" -map 0:a -c:a copy -c:v libx264 -preset medium -crf 19 \
  _build/<slug>/master-with-betsy.mp4
```

Anchor windows: hook (0-8s top-right), verdict (-20s to -10s
bottom-right), CTA (-8s to -2s top-right).

### Step 9 — Audio mix sanity (v6 recipe — post audio-bug fix)

**Bug history (fixed 2026-05-21):** the v5 recipe concat'd raw clips
and tried `[0:a][1:a]sidechain`. Some vendors (kling-i2v in
particular) emit *video-only* mp4s, which crashed the concat demuxer
and led to a silent upload (v2 of the Iran-deal long-form). The v6
driver normalizes every clip to a uniform spec with a *silent* audio
track, concats video-only, then synthesizes the audio bed from VO +
ducked music. A post-flight `volumedetect` gate aborts publish if
`mean_volume < -60 dB` so a silent master can never ship again.

- Voice -16 LUFS (loudnorm I=-16:TP=-1.5:LRA=11)
- Music -22 LUFS (loudnorm I=-22:TP=-1.5)
- Music mixed at weight 0.7 vs VO weight 1.0
- Sidechain compressor: threshold=0.03 ratio=20 attack=120 release=500
- Final limiter: alimiter limit=0.97
- VO padded with silence to match full video length (end-card music tail)
- Post-flight: ffmpeg volumedetect; abort if mean_volume < -60 dB

Music asset (CC-BY): `companies/concise-sealed/public/movie/_build_v4/music.mp3`
(Incompetech "Impact Prelude").

**Text-card stills:** any clip whose visual is text-heavy (source
cards, scorecards, big-number reveals, dates, headlines) routes to
`scripts/pipeline/render-text-cards.mjs` (Puppeteer HTML → 1280×720
PNG) instead of FLUX-Pro. FLUX is unreliable at small typography
("iiv6" instead of "p.1519", "withrawal" instead of "withdrawal").
The HTML renderer uses the SEALED book design tokens (parchment + navy
+ gold, Lora serif + IBM Plex Mono).

### Step 9.5 — Apply subtle SFX layer (NEW, 2026-05-21)

Persona: `personas/sfx-specialist.md` (documentary-trained, "subtle
wins"). Founder flag 2026-05-21: v3 sounded like a slideshow because
nothing punctuated the beats. SFX is the difference between
"AI explainer" and "show."

Storyboards may declare per-clip cues:
```json
{ "clip_id": "s5-02b-moneyflow",
  "sfx": [
    {"asset": "moneyflow-whoosh-1.wav", "at_s": 1.2, "gain_db": -26}
  ]
}
```

Run:
```bash
node scripts/pipeline/apply-sfx.mjs \
  --storyboard eng/storyboards/<slug>.json \
  --master _build/<slug>/master.mp4 \
  --out _build/<slug>/master-with-sfx.mp4
```

Hard rules:
- No cue above -18 dB
- ≤1 cue per second on average — sparse is the goal
- Only assets from `shared/sfx/` (CC-BY / CC0, attribution preserved)
- Banned: cable-news stings, "DUN-DUN" intervals, MrBeast chimes,
  reverb tails > 400ms

If the storyboard has no `sfx[]` entries the script no-ops and copies
master through. Backward-compatible with v1-v3.

### Step 10 — Splice shorts

```bash
python scripts/pipeline/cut-shorts-v2.py \
  --master _build/<slug>/master-with-betsy.mp4 \
  --storyboard eng/storyboards/<slug>.json \
  --out-dir public/shorts/
```

Auto-detects shock moments (verdict reveals, figure-drop scenes) and
exports 30-60s vertical 1080×1920 crops.

### Step 11 — Dual panel review (council + viral panel)

**Council** (`personas/council/`) — spawn in order, write `eng/qc-reports/<slug>/council.md`:
1. `01-political-historian.md` — factual defensibility
2. `02-viral-hook-specialist.md` — first 3 seconds (in-video)
3. `03-cinematographer.md` — visual quality (Remotion + text-cards)
4. `04-cincinnati-mom.md` — **BINDING** lay comprehension
5. `05-fact-check-qc.md` — **BINDING** three-way numeric reconciliation
6. `06-audio-qc.md` — mix / VO level

**Viral panel** (`personas/viral-panel/`, see `docs/CR-VIRAL-PANEL-RUNBOOK.md`) —
write `eng/qc-reports/<slug>/viral-panel.md` in parallel:
1. Title strategist → 3 title variants
2. Thumbnail designer → feed legibility spec
3. First-three-seconds → cold open
4. Algorithm strategist → description, tags, chapters, playlist
5. Clip cutter → fair-use + Remotion overlay (CR new-news)

Ship only when council binding roles PASS **and** viral panel has zero HARD VETO.

### Step 11.5 — Generate viral thumbnail (required)

YouTube auto-picks a random frame if you don't supply a custom thumbnail
— and the random frame is almost always the worst possible one (mid-blink,
mid-transition, low-contrast). Viral thumbnails are the difference
between 200 views and 20,000.

New script: `scripts/pipeline/generate-thumbnail.mjs`. For every video,
generate a 1280×720 JPEG (YouTube's recommended size) with:

- **Background:** solid navy `#0a1f3d` for CR new-news (cream in-video only)
- **Left 60%:** headline figure as huge serif ("$8M" / "LOST") — cream type
- **Right 40%:** caricature or illustrated mugshot — **not** Hedra, not photo i2v
- **Bottom-right:** civic-red stamp rotated −8°
- **No Jessica/Betsy face, no channel logo in thumbnail body**

Templates live in `scripts/pipeline/templates/thumbnail-*.html`. One
template per verdict. Driver passes `{headline, figure, verdict}` from
the storyboard's `thumbnail` block:

```json
"thumbnail": {
  "headline": "$82M",
  "subline": "bought 3 promises",
  "verdict": "BROKEN"
}
```

Save to `_build/<slug>/thumbnail.jpg` and upload via the YouTube Data
API `thumbnails.set` endpoint as part of the upload step. The uploader
already supports a `--thumbnail` flag (add it to `youtube-upload.py` if
not yet present).

**Viral thumbnail rules (canonical, from competitor channel teardowns):**
- ONE giant number or word, readable at 240×135 mobile size
- ONE visual anchor — caricature or giant number (not hyperreal AI face)
- HIGH contrast: cream-on-navy ≥7:1 at 246×138 mobile preview
- NO clickbait questions ("WHAT HAPPENED?") — the figure IS the hook
- NO arrows pointing at the face — feels MrBeast-knockoff
- NO YouTube-template generic — looks like SEALED, not Final Cut Pro

### Step 12 — Upload to YouTube

```bash
python scripts/pipeline/youtube-upload.py \
  --video _build/<slug>/master.mp4 \
  --thumbnail _build/<slug>/thumbnail.jpg \
  --title "How $82 Million Killed Obama's Iran Deal | SEALED" \
  --description-file eng/upload-descriptions/<slug>.md \
  --tags "trump,iran deal,sealed,campaign promises,2016" \
  --playlist "$CR_YOUTUBE_PLAYLIST_CR_NEW_NEWS" \
  --category 25 \
  --expect-voice jessica \
  --privacy public
```

The script reads `CR_YOUTUBE_REFRESH_TOKEN` from `.env` (parent monorepo
root), refreshes the access token via the OAuth client, uploads via
resumable upload, returns the watch URL.

---

## 5. OAuth credentials (already wired)

Stored in `/Applications/DrAntoniou Projects/AgentCompanies/.env`:

```
CR_YOUTUBE_CHANNEL_ID=UC4NINNbjaoy2PTKxbY5an-g
CR_YOUTUBE_CHANNEL_HANDLE=CampaignReceiptsYoutube
CR_YOUTUBE_OAUTH_CLIENT_ID=964042652225-9s8pbhb31vli86t488qi42oa7s1hnqev.apps.googleusercontent.com
CR_YOUTUBE_OAUTH_CLIENT_SECRET=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
CR_YOUTUBE_REFRESH_TOKEN=<103-char value, starts 1//01HMO>
```

If the refresh token ever expires, re-bootstrap with:
```bash
python scripts/pipeline/youtube-upload.py --auth
```
Then copy the new refresh_token from `scripts/.youtube-token.json` into
`.env` under `CR_YOUTUBE_REFRESH_TOKEN`.

---

## 6. Description / tag template

Every upload description ends with:

```
---
📖 Read the full receipt: https://sealed2016.com/?utm_source=youtube&utm_campaign=<slug>
📊 All 145 promises graded: https://campaignreceipts.com/trump

Every figure in this video is cited to a published, dated source. See
description for citations.

#Trump2016 #CampaignPromises #SEALED #PolicyReceipts
```

---

## 7. Cost discipline

Per-video target: **$10 clips + $1 VO + $0 music = ~$11**.

Running ledger: `infrastructure/scripts/.image-gen-costs.jsonl` +
`scripts/pipeline/.cost-log.jsonl` (auto-appended by `produce-from-storyboard.py`).

Hard cap: $20/video. If a render exceeds this in `--dry-run`,
downgrade Sora 2 clips to FLUX stills before kicking off real renders.

---

## 8. Common failure modes (and recoveries)

| Failure | Recovery |
|---|---|
| Sora 2 content filter on political imagery | Rewrite prompt with abstract framing ("dark industrial corridor," not "Iran nuclear lab"). Retry once. Fall back to FLUX still + ken-burns. |
| Scribe-verify WER >5% | Re-check VO input — did you pass the full memo instead of just VO lines? |
| Betsy looks different across clips | You re-rolled instead of seeding from canonical PNG. Delete and re-render with `--image brand/betsy-portrait.png`. |
| Music drowns voice | Re-mix with the v5 sidechain recipe (Section 4 Step 9). |
| Long-form >100MB blocks git | Already gitignored. Upload to YouTube, keep `_build/` local. |
| YouTube upload 401 | Refresh token expired — re-bootstrap (Section 5). |

---

## 9. The 145-promise queue

Source: `companies/concise-sealed/manuscript/` (9 chapters, 145 graded
promises). See `companies/campaign-receipts/lib/sealed-promises.ts` for
the structured corpus (slug, chapter, verdict).

Pull next promise:
```bash
node -e "
  const { getAllPromises } = require('./lib/sealed-promises.ts');
  console.log(getAllPromises().filter(p => !p.shipped_to_yt).slice(0, 5));
"
```

Production cadence: 1-5 shorts/day. Long-forms run in parallel.

### 9.1 SEALED shorts — required back-half visual beats

**Origin (2026-05-23 watch sweep):** 6 of 7 published SEALED shorts ended
with 15-23 s of the static `145 PROMISES / SEALED2016.COM` outro card
playing while the VO was still delivering substantive content (May 14
dates, $350B tariff figures, McCain thumbs-down, etc.). 3 of 7 also shipped
AI-rendered text typos (`EXESICUTIVE ORDER`, `HAAD COMNAP UN TARRIT`,
corrupted `EURAEN` map). Both are now gated; this section is the contract.

**Rule 1 — One Remotion picture per VO beat.**
Episode JSONs at `scripts/shorts/episodes/<slug>.json` must list a
`sync_specs` entry for **every** substantive VO beat (date, dollar amount,
verdict transition, named actor, source citation). The old 4-segment
shape — hook → receipt → verdict → cta — is forbidden. Working examples:

| Slug | Segments | Beats covered |
| --- | --- | --- |
| sealed-002-aipac-embassy | 6 | hook → ribbonDate (May 14 2018) → aipacPriority → gazaSameDay → KEPT stamp → cta |
| sealed-004-drain-the-swamp | 7 | hook → enforcePaper → EO 13770 → EO 13983 → lobby ChartBar → BROKEN stamp → cta |
| sealed-005-china-tariffs | 6 | hook → $350B CountUp → Section 301 ChartBar → receiptMatters → KEPT stamp → cta |
| sealed-007-repeal-obamacare | 7 | hook → 49-51 ChartBar → chamberPicture → THREE REPUBLICAN NOS Timeline → AFTER THE VOTE Timeline → BROKEN stamp → cta |

Each segment uses a Remotion composition (`SourceCard`, `Timeline`,
`ChartBar`, `CountUp`, `VerdictStamp`) for any readable text. The motion
receipt card is reserved for the **final** CTA segment only.

**Rule 2 — Banned vendors for readable text.**
`flux-pro` / `kling3-pro` / `sora-2` are banned for any asset that needs
on-screen text: dates, dollar amounts, EO numbers, verdict stamps,
"executive order"/"stamp"/"document"/"headline"/"caption"/"tariff
code"/vote tally. These models garble small typography (confirmed
2026-05-21 `withrawal`/`iiv6`; 2026-05-23 `EXESICUTIVE ORDER`/`HAAD
COMNAP UN TARRIT`). All such text MUST live in Remotion or motion-card.
`scripts/pipeline/validate-shorts-episode.py` enforces this at the start
of `produce-short-generic.mjs` — it scans every `illustration.prompt` and
`broll.prompt` for text-trigger tokens and exits non-zero before any
fal.ai spend.

**Rule 3 — CTA tail is clamped to 2.8-5.0 s.**
`produce-short-generic.mjs` defines `MAX_CTA_SEC = 5.0` and
`MIN_CTA_SEC = 2.8`. Whenever scribe anchors place the CTA outside that
window, `buildSegmentsFromScribe` redistributes time into / out of the
preceding (verdict) segment. The previous bug (unbounded CTA filling
15-23 s while VO continued) is no longer possible at the segment-build
stage.

**Rule 4 — Motion card uses frame-based `zoompan`.**
`motionFromPng` in the driver renders motion cards with
`zoompan=z=f(on):d=1` (output-frame-indexed, one output frame per input
frame). The old `d=frames` form blew up a 6 s card into 1080 s of frozen
first-frame footage — also fixed.

**Rule 5 — Anchor matching is phrase-by-phrase.**
`findAnchor()` iterates the `startAnchors`/`endAnchors` list and accepts
the first phrase that matches consecutive scribe tokens (with non-word
tokens filtered). The old "all words in one phrase, all consecutive" path
matched nothing in real scripts and silently collapsed every non-CTA
segment to `MIN_SEG_SEC=3.8 s`.

### 9.2 SEALED shorts — the new ship-checklist gate

`scripts/pipeline/ship-checklist.py --mode short` runs after the master is
written. Two binding checks are specific to shorts:

- **`shorts_back_half_filled`** — FAILS if any single segment occupies
  more than 60 % of total runtime (`SINGLE_ASSET_LIMIT = 0.60`). Catches
  static-CTA-eats-the-short and any future driver regression that
  silently no-ops a segment.
- **`shorts_no_ai_text_garble`** — OCRs one middle frame of every segment
  and FAILS on the curated AI-garble dictionary
  (`EXESICUTIVE`, `EURAEN`, `COMNAP`, `CCORN`, `iiv6`, `withrawal`,
  `TARRIT`, `EXEC ORDER 13.*\d`, …). Treat any new garble pattern as a
  blocker and add it to `SHORTS_OCR_MISSPELL` in `ship-checklist.py`.

Both gates are wired into the driver: it shells `ship-checklist.py
--mode short --master ... --build ...` and exits non-zero on failure
before the master is promoted to `public/shorts/<slug>.mp4`.

### 9.3 SEALED shorts — checklist before adding a new episode

- [ ] `scripts/shorts/episodes/<slug>.json` declares one `sync_specs`
      entry per VO beat (not the old hook/receipt/verdict/cta shape)
- [ ] Every `composition` is a Remotion component, not a fal.ai prompt
- [ ] No `illustration`/`broll` blocks for readable text (validator
      will reject)
- [ ] `cta` segment is the final entry with `vendor: motion-card`
- [ ] `node scripts/shorts/produce-short-generic.mjs --episode <slug>
      --skip-tts` (after VO is on disk) runs to completion and prints
      `✅ SHIP CHECKLIST PASS` with both new checks PASS

---

## 10. Sanity checklist before any `youtube-upload.py --privacy public`

- [ ] **Custom thumbnail uploaded** — never let YouTube auto-pick a
      frame. Use the Step 11.5 generator. 1280×720 JPEG.
- [ ] **Audio QC PASS** (`personas/council/06-audio-qc.md` — BINDING).
      Voice identity (cost log scan for unexpected voices), audio
      stream present, mean_volume > -60dB. Wired into `youtube-upload.py`
      automatically; blocks upload on FAIL. Override with `--skip-audio-qc`.
      (Origin: founder caught a male voice on v4 of Iran-deal 2026-05-21.
      The visual QC passed because the picture was fine. Audio QC closes
      that gap.)
- [ ] **Fact-Check QC PASS** (`personas/council/05-fact-check-qc.md` —
      BINDING). Every cited figure reconciles three ways: SEALED book
      source line == VO transcript == on-screen OCR. If any one diverges,
      the video does NOT ship. (Origin: $26M vs $86M vs $82M Adelson
      mismatch caught by founder 2026-05-21 — every prior gate missed it.)
- [ ] **`ffprobe -show_streams <file>` shows an audio stream** (silent-mp4
      bug shipped 2026-05-20 — never again)
- [ ] **`ffmpeg -i <file> -af volumedetect -f null -` shows non-silent
      audio** (mean_volume > -60 dB)
- [ ] **Scribe-verify transcript does NOT contain "twenty thousand"**
      (that means a year token slipped through unphoneticized — see
      Step 4)
- [ ] **Opening has ≥0.5s breath beat** before the first VO word
- [ ] **Subscribe CTA is in the END card, not the opening**
- [ ] **Background music present and ducked** (-22 LUFS during speech)
- [ ] **Text-heavy stills rendered via Puppeteer HTML→PNG**, not FLUX
      (FLUX garbles small typography — "withrawal", "iiv6")
- [ ] Cincinnati Mom approved (or founder explicitly relaxed the gate)
- [ ] Every figure cited to a SEALED book line number
- [ ] Betsy anchor visible in hook + verdict + CTA windows
- [ ] sealed2016.com CTA on final frame
- [ ] Audio: voice -16 LUFS, music -22 LUFS during speech
- [ ] Description has utm-tagged sealed2016.com + campaignreceipts.com/trump
- [ ] No AI-rendered faces of real living politicians
- [ ] Wikimedia photos used carry attribution in description footer
- [ ] Cost under $20

---

End of runbook. When in doubt: read `personas/video-producer.md` and
`brand/betsy-character-bible.md` before improvising.
