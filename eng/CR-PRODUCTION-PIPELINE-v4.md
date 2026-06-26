# Campaign Receipts Production Pipeline v4 — canonical, dual-program doctrine

**Status:** LOCKED 2026-05-25. Supersedes both `eng/PRODUCTION-PIPELINE-v1.md` (38-step LF doctrine) and `SEALED-PRODUCTION-PIPELINE-v3.md` (35-step SEALED doctrine). Single source of truth for the @CampaignReceiptsYoutube channel.

**Why one doctrine:** Same channel, same brand voice, same gates, same QC. The only differences between SEALED 2016 (parchment, 145-promise audit) and CR new-news (navy, single-race finance receipts) are cosmetic + playlist + thumb template. Two doctrines = two ways to drift = two ways to ship broken content. Founder lock 2026-05-25.

**Skill wrapper:** `companies/campaign-receipts/.claude/skills/cr-production-pipeline/SKILL.md` orchestrates all 31 stages end-to-end via Agent subagents and the `scripts/pipeline/pipeline-state.py` state machine.

**Stage source of truth (machine-readable):** `.claude/skills/cr-production-pipeline/stages.yaml`. This doc is the prose; stages.yaml is what the orchestrator reads.

---

## Doctrine in 9 lines

1. **One persona, one job, one artifact.** No persona "consults" — each one PRODUCES one named file on disk.
2. **Hard-fail gates between every stage.** Bad output blocks the next stage. No silent loosening.
3. **Verify before quoting.** Every number (FEC total, vote margin, %) must cite source URL + retrieval date. Hallucinated numbers kill the channel.
4. **Shorts are TEXT + B-ROLL + MUSIC — NO VO.** Founder lock 2026-05-24. Voice-clip shorts always fail one of {mid-sentence cut, letterbox gutter, on-screen overflow, muted-viewer-can't-follow}. NEVER-OVERRIDABLE.
5. **9:16 vertical is the default render aspect for shorts.** All Remotion compositions detect `height > width` and switch to vertical-aware layout (`k = isVertical ? 2.2 : 1.0` scale multiplier). See `remotion/src/compositions/SourceCard.tsx` + `Timeline.tsx` for the pattern.
6. **Single-narrator (Betsy / ElevenLabs Jessica) for long-form only.** Per-speaker voice settings locked in `personas/betsy-the-narrator.md`. Force-pronounce acronyms via `A.I.P.A.C.` style spelling in script copy.
7. **Visuals serve the receipt.** Wikipedia photos + Remotion charts FIRST. Generative AI (fal Sora/Kling) only for non-character atmosphere beats. NEVER an AI face of a real politician.
8. **Per-episode Remotion isolation.** `remotion/src/episodes/<slug>/` lock from 2026-05-23. No bare composition IDs across episodes (`{slug}__{composition}` only).
9. **The skill is the only entry point.** Direct invocation of `cut-shorts-v2.py`, `produce-from-storyboard.py`, `youtube-upload.py`, `render-remotion.mjs` — forbidden when a downstream hard-fail gate exists for that stage. Founder lock 2026-05-24 (the 3-broken-shorts incident).

---

## Two programs, one pipeline

The skill is invoked with `--program sealed | cr-new-news`. Stage list is identical; per-program deltas table:

| Step | SEALED 2016 | CR new-news |
|------|-------------|-------------|
| Thumb template | parchment `sealed-short` (9:16) / `sealed` (16:9) | navy `cr-new-news-short` (9:16) / `cr-new-news` (16:9) |
| CTA card | `145 PROMISES · SEALED2016.COM` | `campaignreceipts.com/race/<slug>` |
| Playlist | `Sealed2016` | `CR new-news` |
| Slug prefix | `sealed-NNN-<topic>` (e.g. `sealed-018-china-currency`) | `cr-<race>-<politician>-<seat>` (e.g. `cr-massie-gallrein-primary`) |
| Frame | 145-promise audit, KEPT/PARTIAL/BROKEN verdict stamp | Single-race finance receipts, $X-bought-N-points framing |
| Voice | Betsy (parchment narration cadence) | Betsy (newsroom-receipts cadence — same voice, same settings) |
| Council 04 (Cincinnati Mom) | Swing-voter check | Swing-voter check (same) |
| Shorts NO-VO rule | HARD FAIL | HARD FAIL (same) |
| Story-investigator angle | "What did this promise cost or deliver, line-item?" | "Who paid for this race? What did they buy?" |

Everything else — gates, personas, validators, render scripts, splice, QC `/watch` passes, post-Studio metadata push — is identical.

---

## Pronunciation + brand banlist (HARD-FAIL gates apply pre-TTS)

Stage 13 (`elevenlabs-tts.py --lint-only --strict-lint`) refuses to render if script copy contains:

- `AIPAC` (bare) → must be `A.I.P.A.C.` so Jessica reads "AY pack" not "AI pac"
- `AIPC` (anywhere) — never the right form
- `RJC` → `R.J.C.` (Republican Jewish Coalition)
- `UDP` → `U.D.P.` (United Democracy Project)
- `FEC` → `F.E.C.` (Federal Election Commission, in VO copy only; on-screen text stays "FEC")
- `SCOTUS` → `the Supreme Court` (Jessica reads "SCOTUS" as "skoh-tus")
- Numbers >999 without word form ($82 million, not $82M) in VO copy
- Sentences >30 words (Jessica cadence collapses)
- `Marcion` → `MAR-see-on` (NTO learning, carries over for any future religious-history pieces)
- `Rep.` → `Representative`, `Sen.` → `Senator`, `Gov.` → `Governor` (founder 2026-06-25: the voice mangled "Rep."). On-screen card keeps the short form; only the spoken VO is expanded. `(D-NY)`/`(R-TX)` → "Democrat of New York"/"Republican of Texas". `HR 4371` → "H R 4371". Handled in `produce-cr-weekly.mjs::normalizeSpoken()`.

This is the linter, not the writer's checklist. The writer is responsible for getting it right; the linter is the safety net.

---

## Weekly money-trail video (`produce-cr-weekly.mjs`) — editorial thesis + craft lessons

This is the LEAN weekly path (NOT the 31-stage SEALED pipeline below): static brand
cards, no storyboard, no b-roll-first. Detector → articles → storyteller script →
`produce-cr-weekly.mjs` → `produce-weekly-video.mjs` → YouTube. Runs autonomously on the
`cr-video-worker` Render Docker service, triggered by cron Thu 14:00.

**THE EDITORIAL THESIS (the moat — founder 2026-06-25):** *How lawmakers voted relative
to their donor influence is NOT reported anywhere.* "Donor X gave $Y" is everywhere and
boring; "X **voted for** the bill that benefits the industry that funds them" is the story
no outlet runs at scale because no human reads every bill + roll-call + donor list. We do.
The vote/sponsor → bill-effect (read from full text) → matched named-industry donors chain
IS the product. Lead with it. (Built in `detect-new-connections.mjs::computeVoteExposes` +
`classify-bill-effect.mjs` reading full congress.gov text + `classify-donor-industry.mjs`.)

**CRAFT LESSONS (accumulate here as we learn — founder feedback 2026-06-24/25):**
1. **DO LESS per scene.** Politician PHOTO + the MONEY figure + the BILL/VOTE line is
   *enough*. No paragraph dumps, no busy motion. (founder: "you're doing too much.")
2. **NO LOOPING.** Never `-stream_loop`/ken-burns-repeat a short clip to fill time — it
   reads cheap and "the video sucks because you looped for one minute." Static card held
   for the VO duration. One scene = one held frame.
3. **Captions: keywords/numbers only, ≤1 idea per frame.** NOT paragraph subtitles. "If
   it's more than one sentence per frame it's TOO MUCH." (Currently we ship NO burned
   captions on the long-form — the photo+money+bill card carries it. Add running keyword
   captions only, never sentences.)
4. **Photo must not cover text.** Reserve the right zone for the photo (x≈W-580); keep all
   text in the left column. Verify the money block doesn't collide with its label or the
   footer bar (the 2026-06-25 "$205K over FROM BIG TECH DONORS" overlap). LAYOUT MATH IS A
   GATE: render one card to PNG and eyeball before a full render.
5. **Company LOGOS when money is named** (`scripts/pipeline/donor-logo.mjs`, Clearbit) — on
   the video card AND in the blog article ("the players" block). Huge. Skip gracefully when
   no logo resolves.
6. **Expand abbreviations pre-TTS** (Rep./Sen./Gov./party codes) — see banlist above.
7. **QC before publish:** UploadCheck MCP (`@drantoniou/uploadcheck-mcp`, `.mcp.json`) runs
   `/check` on the master — catches garbled speech / frozen frames / pauses. Text-overlap
   is a layout bug, fix at source (lesson 4), not via QC.
8. **CINEMATIC, never cheap:** Veo cold-open + outro (hybrid); story cards get ONE slow
   eased push-in (≤3% over the hold) + faint film grain + a fade-in. No looping, no busy
   motion. Add a music bed via `CR_MUSIC_PATH` when one exists.
9. **EVERY ISSUE HAS A THEME** (founder 2026-06-25): the lead story's dominant industry/
   company is the week's theme. The cold-open names it ("This week it's Wall Street…"); the
   newsletter subject and the video title both cohere to it. One theme = one clean hook.

**VIRAL PACKAGING (auto-filled every week — copywriter system 2026-06-25):**
- **TITLE FORMULA** (`generate-youtube-meta.mjs`, rotates by ISO-week so the feed varies):
  1. `{COMPANY} Gave {$AMOUNT}. Then {N} Lawmakers Passed Their Bill.`
  2. `{N} Lawmakers Took {COMPANY} Money. All Voted for the Bill.`
  3. `{$AMOUNT} From {COMPANY}, One Bill, {N} Yes Votes`
  4. `{N} Lawmakers, {COMPANY}'s Bill, {$AMOUNT} in Donations — Coincidence?`
  `{COMPANY}` = most recognizable named donor (Blackstone), NOT the industry. ≤100 chars.
  **Compliance firewall:** reject any title containing bought/bribe/in exchange/paid for/
  purchased/because/in return → fall back to the question form (#4). Asserts nothing.
- **THUMBNAIL** (`generate-thumbnail.mjs` variant `cr-vote-vs-donor`, TODO): navy canvas,
  3 politician FACES fanned on the right + a "+{N−3}" gold badge, the company LOGO knockout
  top-left, the `{$AMOUNT}` huge in cream, a ≤6-word overlay (`{COMPANY} PAID / THEY VOTED
  YES`), civic-red RECEIPT stamp. Faces + logo are the click drivers. Founder: show the
  politician faces + the recognizable company.

---

## The 31-stage pipeline (28 main + 3 sub-pipeline + LF-only branches)

Each row: **Step | Stage | Persona | JOB | TASK | OUTPUT**. "Persona" points at the `.md` the skill loads as subagent prompt. "TASK" is the literal command (with `<slug>`, `<mode>`, `<master>`, `<date>` placeholders). Reuses existing scripts; new ones marked **(NEW)**.

| # | Stage | Persona | JOB (decision they own) | TASK | OUTPUT |
|---|-------|---------|------------------------|------|--------|
| 1 | Analytics review (prior piece) | `personas/analytics-tracker.md` | What worked / what didn't from prior piece. CTR, AVD, traffic source. Feeds Stage 2. | `python3 scripts/pipeline/youtube-analytics-snapshot.py --slug PREV` **(NEW — TODO task #41)** | `reports/episodes/<prev-slug>-72hr.md` |
| 2 | Story extraction | `personas/story-investigator.md` | Central tension, transformation arc, key reveal, emotional stakes, 5-9 narrative beats. NO visuals, NO prompts, NO script. | Agent loads persona, reads `briefs/<date>-<slug>-topic-brief.md` | `briefs/<date>-<slug>-story-extraction.md` |
| 3 | Audience demand validation | `personas/audience-demand-strategist.md` | GO/HOLD/KILL verdict + CTR/retention scores + 5 hook variations + must-click framing | Agent persona pass | `briefs/<date>-<slug>-validation.md` |
| 4 | Viral packaging lens | `personas/viral-panel/06-mrbeast-packaging.md` | MrBeast packaging — score hook strength, pick title direction, set thumbnail brief | Agent persona pass | `briefs/<date>-<slug>-virality.md` |
| 5 | Content research | `personas/series-architect.md` + memory grep | Primary-source receipts: FEC, Federal Register, book page, certified results. NO secondary news as primary cite. | Agent persona pass | `research/<date>-<slug>-sources.md` |
| 6 | **Fact-check pre-script (HARD FAIL)** | `personas/council/05-fact-check-qc.md` | Verify every claim has a primary source. BLOCK if any claim can't be sourced. | Agent persona `--gate-mode pre-script` | `research/<date>-<slug>-fact-check-pre.md` PASS marker |
| 7 | First-draft script | `personas/cr-new-news-writer.md` | Writes FROM story-extraction beats, not from topic. Three rules: one-fact + one-reason-why per sentence; A.I.P.A.C. pronunciation form; receipts named (FEC IDs, EO numbers, dates) | Agent persona with `--story-extraction` input | `content/scripts/<slug>-v1.md` |
| 8 | Story structure pass | `personas/storyline-editor.md` | Structure + receipt-narrative sequence + required `<!-- RECEIPTS: ... -->` header | Agent + `step_qc.py --step storyline-editor --lint-script` | `content/scripts/<slug>-v2-structure.md` |
| 9 | Plot beats + emotion | `personas/jk-rowling-storyteller.md` (shared from NTO) | Suspense, story-question cold open. **MUST NOT raise complexity above EP voice (waitress-just-graduated-college).** | Agent + `step_qc.py --step jk-rowling` | `content/scripts/<slug>-v3-jk.md` |
| 10 | Retention hook pass (COPY mode) | `personas/viral-panel/06-mrbeast-packaging.md` | First-30s framing + re-hooks every 60-90s WITHOUT raising reading level | Agent + `step_qc.py --step mrbeast-copy` | `content/scripts/<slug>-v4-mrbeast.md` |
| 11 | **Council ship-gate on script (HARD FAIL)** | `personas/council/*` (8-member panel) | All council members 10/10 on COPY pass OR founder override (logged) | `python3 scripts/pipeline/council-review.py --script content/scripts/<slug>-v4-mrbeast.md --gate-mode` | `reports/council/<slug>-<date>.md` PASS marker |
| 12 | Empathy flag (FLAG-ONLY) | `personas/empathy-editor.md` | List "missing empathy at line X with reason." Does NOT edit script. | Agent persona `--mode flag-only` | `content/scripts/<slug>-v4-empathy-flags.md` |
| 12.5 | Empathy re-pass | `personas/storyline-editor.md` OR `personas/jk-rowling-storyteller.md` | Apply empathy flags by adding humanizing beats. Preserves voice. | Agent persona `--mode empathy-rewrite --flags-file <v4-flags>` | `content/scripts/<slug>-v5-locked.md` |
| 13 | **TTS readability lint (HARD FAIL, NEVER OVERRIDABLE)** | `personas/qc-engineer.md` (auto via script) | Lint banlist (above): bare AIPAC, mid-word abbreviations, numbers >999 unspelled, sentences >30 words | `python3 scripts/pipeline/elevenlabs-tts.py --lint-only --strict-lint content/scripts/<slug>-v5-locked.md` | exit 0 PASS or fail list |
| 14 | Long-form VO (Betsy/Jessica) | `personas/betsy-the-narrator.md` + `personas/video-producer.md` | Render chunked VO per LF script. **DOES NOT RUN for shorts (Doctrine line 4).** | `python3 scripts/pipeline/elevenlabs-tts.py --voice betsy --chunked content/scripts/<slug>-v5-locked.md` | `_build/<slug>/vo-v2.mp3` |
| 15 | VO pronunciation QC | `personas/qc-engineer.md` (Scribe verify) | Cross-ASR each chunk: A.I.P.A.C. heard as "AY pack", named politicians pronounced right, no garble | `python3 scripts/pipeline/qc_spoken.py --episode _build/<slug>/` | `vo-audio-qc.json` PASS |
| 16 | VO WER + garble | `personas/qc-engineer.md` | Per-chunk WER ≤12%, no garble | `python3 scripts/pipeline/qc_spoken.py --cross-asr` | PASS marker |
| 17 | Visual planning / storyboard | `personas/video-producer.md` | Translate script → shot list. B-ROLL-FIRST. Tag each beat: `youtubeBroll` > `remotion` > `fal-still`. | Agent persona `--mode storyboard` | `eng/storyboards/<slug>.json` |
| **17.5** | **Per-clip prompt generation (GENERATIVE beats only)** | `personas/visual-prompt-engineer.md` | Generate fal/Kling/Higgsfield prompts per generative shot. Knows each tool's unique strength (matrix below). Decoupled from b-roll selection. | Agent persona `--storyboard <slug>.json` | `eng/storyboards/<slug>-prompts.json` |
| **18** | **YouTube b-roll selection (REAL-FOOTAGE beats)** | `personas/cinematic-broll-director.md` | Pick BEST in/out from cached + new YouTube sources. Per-beat fair-use envelope (≤6s/beat, ≤30s/clip, ≤90s/source/episode). Verify via yt-dlp probe + frame inspect. C-SPAN beats need `cropTopPct=0.75` to kill burn-in. | Agent persona `--storyboard <slug>.json` | `eng/storyboards/<slug>-broll-selections.json` |
| 19 | **Storyboard validator (HARD FAIL, NEVER OVERRIDABLE)** | `personas/qc-engineer.md` | Refuse if: beat missing visual source, youtubeBroll without `cropTopPct` on C-SPAN, face-character ≠ speaker, AI-where-real-footage-exists, URANIUM/ENRICHMENT strings in CR slugs (the 2026-05-23 leak detector), generative beat without `cinema_mode`, prompt missing locked camera/lens/filtration/grade block | `python3 scripts/pipeline/validate-storyboard.py eng/storyboards/<slug>.json` **(TODO task #42)** | exit 0 PASS |
| 20 | Thumbnail prompt + render | `personas/viral-panel/02-thumbnail-designer.md` + `personas/viral-panel/06-mrbeast-packaging.md` | One thumb per piece. Per-program template (table above). Number-first headline + verdict stamp. No portrait on SEALED shorts. | `node scripts/pipeline/generate-thumbnail.mjs --template <per-program> --headline "..." --subline "..." --verdict KEPT --out <thumb>` | `_build/<slug>/thumbnail.jpg` |
| 21 | Atmosphere generative beats (LF only) | TOOL: `gen-router.py` (Higgsfield-preferred, fal fallback) | Non-character atmosphere only. Never faces of real politicians. Router probes Higgsfield credits then picks backend; see "Generation backend routing" below. | `python3 scripts/pipeline/gen-router.py still --prompt "..." --out <p>.png --piece <slug>` / `... i2v --image <seed>.png --prompt "..." --out <p>.mp4 --piece <slug>` | `_build/<slug>/clips/*.mp4` |
| 22 | Remotion text cards (per-episode scoped) | TOOL: `render-remotion.mjs` | Quotes, citation slates, chapter breaks, election margins. Episode-scoped per `remotion/src/episodes/<slug>/` lock 2026-05-23. 9:16 vertical-aware (doctrine line 5). | `node scripts/pipeline/render-remotion.mjs --slug <slug> --composition <name>` | `_build/<slug>/_rem-*.mp4` |
| 23 | Music bed (once per episode) | TOOL: `bake-music.py` | Loop-ready instrumental. SEALED tone: parchment + slight unease. CR new-news tone: newsroom-receipts urgency. | `python3 scripts/pipeline/bake-music.py --slug <slug>` | `_build/<slug>/music_bed.m4a` |
| 24 | Master splice — **LF or short branch** | `personas/video-producer.md` (auto) | LF: produce-from-storyboard.py (full VO + b-roll + Remotion + sync_public_master). Short: produce-short-generic.mjs (text cards + music + b-roll, NO VO). Both have hard-fail validators inside. | LF: `python3 scripts/pipeline/produce-from-storyboard.py --slug <slug>`. Short: `node scripts/shorts/produce-short-generic.mjs --episode <slug>` | `public/longform/<slug>.mp4` OR `public/shorts/<slug>.mp4` |
| 24.5 | **Dark/blank-frame gate (HARD FAIL, NEVER OVERRIDABLE)** | TOOL: `qc-black-frames.py` | Deterministic single-pass `signalstats` brightness+spread scan over the WHOLE master, one frame every 2s. FAIL if >10% of sampled frames are dark/blank OR any contiguous dark run >3s. Catches dark-vignette "atmosphere" clips that ffmpeg `blackdetect` (pure-#000 only) and stills-QC MISS — the 2026-05-31 "60% black master passed QC 3×" failure. Runs BEFORE the /watch passes so a dark master never reaches a human. | `python3 scripts/pipeline/qc-black-frames.py --master <master>` | exit 0 PASS or exit 2 FAIL + `_review/qc-black-<stem>.json` (bad %, longest run, bad timestamps) |
| 25 | **Master visual QC — Pass 1 (HARD FAIL, NEVER OVERRIDABLE)** | `personas/qc-engineer.md` via `/watch` skill | Lips match speaker (LF only), images match story, no garble, no hallucinated speech, no broll-content mismatch (the 2026-05-23 cache-id bug), no URANIUM-leak (Stage 19 catches but Pass 1 re-verifies) | `python3 scripts/pipeline/qc-visual-master.py --master <master> --slug <slug>` + `/watch <master>` + checklist | `_review/qc-visual-<slug>-pass1.md` |
| 26 | Master visual QC — Pass 2 (independent re-run) | `personas/qc-engineer.md` via `/watch` | Re-verify hot zones: hook frame, verdict stamp moment, CTA card transitions, b-roll cuts | `/watch --start <hot-zone>` + `qc-visual-master.py --pass 2` | `_review/qc-visual-<slug>-pass2.md` |
| 27 | **Shorts-only no-VO gate (HARD FAIL, NEVER OVERRIDABLE)** | `personas/qc-engineer.md` | Run on every short master. Fail if VO chunk file referenced in build dir OR if audio track has speech-band content above threshold. Doctrine line 4. | `python3 scripts/pipeline/qc-shorts-no-vo.py --master public/shorts/<slug>.mp4` | exit 0 PASS or violation |
| 28 | Pre-ship council panel | `personas/council/*` via `council-review.py --gate-mode` | All 10/10 on the MASTER. Reuses existing council infrastructure. | `python3 scripts/pipeline/council-review.py --artifact <master> --gate-mode` | `reports/council/<slug>-master.md` |
| 28.5 | **Cross-video prep (BEFORE upload)** | `personas/viral-panel/06-mrbeast-packaging.md` | Author the WATCH-NEXT picks, the topic-playlist assignment, AND the end-screen row (el.1 best-for-you/LF counterpart · el.2 topic sibling · el.3 Subscribe) for this video — using the live channel inventory — so they're ready IN HAND at upload, not reconstructed after. End screens MUST be decided before upload (founder lock 2026-05-30). | Agent persona pass + append row to `eng/youtube-meta/end-screen-plan-<date>.md` | end-screen row + watch-next picks + playlist id staged for Stage 30 |
| 29 | **Founder upload (manual, PAUSES PIPELINE)** | Founder (YouTube Studio drag-drop) | NEVER `videos.insert` from agent — burns the daily-uploads cap (~6/day). Founder uploads via Studio at Unlisted. **At upload, founder also sets the end screen from the Stage-28.5 row** (API can't set it). | (manual) | new YouTube video ID pasted into `eng/youtube-meta/studio-uploads-pending.json` |
| 30 | Post-Studio metadata push | TOOL: `post-studio-upload.py` | After founder pastes new ID(s), batch-apply title + description + thumbnail + program-playlist + delete `--replace-id`. ~250 quota units/piece. | `python3 scripts/pipeline/post-studio-upload.py --batch eng/youtube-meta/studio-uploads-pending.json` | YouTube metadata live + `eng/PUBLISHED-YOUTUBE.md` updated |
| 31 | 72-hour analytics measure | `personas/analytics-tracker.md` | CTR, retention curve, traffic source → feeds Stage 1 of next piece | `python3 scripts/pipeline/youtube-analytics-snapshot.py --video-id <ID>` **(TODO task #41)** | `reports/episodes/<slug>-72hr.md` |

### Shorts sub-pipeline (Stage 24 short-branch expanded)

**NO VO. EVER. Doctrine line 4.**

**SHORTS ARE AUTHORED, NOT CARVED. Founder lock 2026-05-29.** A Short is an
*original* piece built FROM the LF's story — its own complete arc with a real
punchline — NOT a window lifted off the LF timeline. Splicing a raw in/out
range from the master (`splice-shorts-from-master.py`, `cut-shorts-v2.py`)
ALWAYS cuts off mid-sentence and lands with no punchline, because the LF's
sentences don't end on Short-length boundaries. Carving the LF timeline for
Shorts is FORBIDDEN. The clip-cutter writes a fresh self-contained text-card
script (setup → turn → **punchline that lands inside the Short**) and the AI
b-roll is generated/selected for THAT script, not inherited from the LF cut.

| # | Stage | Owner | Task | Output |
|---|-------|-------|------|--------|
| 24.a | Author the Short from the LF story | `personas/viral-panel/05-clip-cutter.md` | Read the LF body for the *story*, then **write a fresh 20-40s text-card script** with a complete arc and a punchline that fully resolves inside the Short. NEVER snap an in/out window off the LF master. Output is **on-screen text + music + b-roll** plan, NEVER VO, and MUST end on a standalone punchline card (not a trailing fragment). | `content/shorts-scripts/<slug>.md` (text-card lines only, last line = the punchline) |
| 24.b | Build 9:16 from the authored script | `produce-short-generic.mjs` (auto) | Text-card-driven concat; AI b-roll generated/selected FOR this script. Real-footage b-roll > Remotion. Music bed under, sub-bus at -22 LUFS. **No VO track. No lifted LF window.** Mandatory `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`. Final mux: `yuv420p` + BT.709 + 48kHz AAC + `+faststart` (Studio rejects yuvj420p). | `public/shorts/<slug>.mp4` |
| 24.c | **No-VO gate (HARD FAIL)** | `qc-shorts-no-vo.py` | Reject if any speech detected (Whisper VAD threshold) OR if `_build/<short>/vo-v2.mp3` exists. | exit 0 PASS |
| 24.d | Text-card sync + punchline-landing gate | `text-card-sync-qc.py` + `qc-shorts-sentence-boundary.py` | Every text card visible ≥1.2s; no card cut mid-sentence; **last card is a complete punchline sentence (not a trailing fragment); script source must be `content/shorts-scripts/<slug>.md`, NOT a master in/out range** (carve detector) | exit 0 PASS |
| 24.e | Thumbnail | `personas/viral-panel/02-thumbnail-designer.md` + `generate-thumbnail.mjs --template <per-program>-short` | Number-first parchment/navy 9:16, verdict stamp angled bottom-center | `_build/<slug>/thumbnail.jpg` |
| 24.f | Founder uploads each short (manual via Studio) | Founder | Drag-drop Unlisted | new YouTube short ID |
| 24.g | Metadata push + LF cross-link | `post-studio-upload.py` | Title, description with `▶️ Full audit:` → parent LF URL or sealed2016.com/campaignreceipts.com page | metadata live |

---

## Hard-fail gates summary

Non-negotiable PASS/FAIL checkpoints. Founder override requires explicit human intervention; no AI may loosen them.

| Gate | At Step | Script | What it checks | Overridable? |
|------|---------|--------|----------------|-------------|
| Fact-check pre-script | 6 | Council 05 persona | Every claim has a primary source | NO |
| Council script ship | 11 | `council-review.py --gate-mode` | All 8 members 10/10 | `--founder-override-script-council` |
| TTS readability lint | 13 | `elevenlabs-tts.py --lint-only` | A.I.P.A.C. form, sentence length, numbers spelled | NO |
| Storyboard validator | 19 | `validate-storyboard.py` (TODO) | All beats sourced, no character-mismatch, no URANIUM-leak | NO |
| Dark/blank-frame gate | 24.5 | `qc-black-frames.py` | `signalstats` brightness+spread: FAIL if >10% frames dark/blank or any dark run >3s | NO |
| Master visual QC ×2 | 25, 26 | `qc-visual-master.py` + `/watch` | No mismatched broll, no garble, no wrong-cache content | NO |
| Shorts no-VO gate | 27 / 24.c | `qc-shorts-no-vo.py` | No speech in shorts audio track | NO |
| Pre-ship council | 28 | `council-review.py --gate-mode` | All 10/10 on final master | `--founder-override-master-council` |

---

## Tool-strength matrix

Founder lock 2026-05-24: each tool used ONLY for what it's uniquely good at. The persona who owns prompt-craft for a tool understands its strength signature and won't ask it to do something it's mediocre at.

| Tool | UNIQUE strength | What it loses to others | Persona owner | Pipeline stage |
|---|---|---|---|---|
| **ElevenLabs TTS + Scribe** | Single-narrator Jessica VO + word-timestamped back-transcript for QC | Not music. Not video. Garbles `$8M` unless pre-linted; mispronounces AIPAC ("AI pac"). | `personas/betsy-the-narrator.md` + `personas/video-producer.md` + `personas/qc-engineer.md` | 13, 14, 15 |
| **Wikipedia/Wikimedia photos** | Real photos of real politicians. ALWAYS preferred for any named human. | Not motion. Coverage gaps flagged at Stage 18 for founder fallback. | `personas/cinematic-broll-director.md` | 18 |
| **YouTube b-roll (yt-dlp fair-use)** | Real archival footage of speeches, signings, ceremonies, hearings. Cited fair-use envelope. | Not for atmosphere. Per-beat ≤6s, per-clip ≤30s, per-source ≤90s/episode. | `personas/cinematic-broll-director.md` | 18 |
| **Remotion (React video)** | Programmatic charts, money-flow diagrams, count-ups, citation slates, chapter cards, verdict stamps. Per-episode isolation mandatory (`remotion/src/episodes/<slug>/`). 9:16 vertical-aware. | Anything photoreal. Anything with people. | `personas/council/09-remotion-expert.md` + `personas/video-producer.md` + `claude-remotion` skill | 22 |
| **fal Sora 2** | Cinematic atmosphere — capitol exterior, money-on-table, mailbox stack, election-night crowd. Documentary B-roll look. | Cost ($$$). Never faces of real politicians. | `personas/visual-prompt-engineer.md` (cost-gated) | 21 |
| **fal Kling 3.0 Pro** | Slow cinematic motion on a still image. Push-in on FEC filing, dolly across mailer, particles. | Talking heads (lips drift, BANNED for politicians). | `personas/visual-prompt-engineer.md` | 21 (i2v on Flux still) |
| **fal Wan 2.5** | Cheap atmospheric motion — lamp flicker, smoke, water, weather. | Character anything. >10s loses coherence. | `personas/visual-prompt-engineer.md` | 21 fallback |
| **fal Flux Pro / Flux 2** | Photoreal stills for thumbnails + seeds for img2vid. NEVER a face of a real politician. | Motion. Real-person likeness (banned). | `personas/viral-panel/02-thumbnail-designer.md` (thumbs); `personas/visual-prompt-engineer.md` (seeds) | 20, 21 |
| **YouTube Data API** | Metadata updates — title, desc, thumbnail, playlist, privacy, delete. ~50-150 quota units each. | File uploads (1,600 units; **BANNED — founder manual only**). | `personas/viral-panel/04-algorithm-strategist.md` via `youtube-upload.py --update-meta` | 30 |
| **YouTube Analytics API** | Per-video CTR, retention, traffic source. Separate quota pool. | Anything else. | `personas/analytics-tracker.md` | 1, 31 |
| **Higgsfield** | Prepaid cinematic studio for polished non-character CR atmosphere, receipt macro, empty podium, and generic crowd/setting plates. | Remotion for information; Wikimedia/real b-roll for politicians; fal for cheap scripted retries. Never real politicians or readable claims. | `personas/visual-prompt-engineer.md` | 17.5, 21 |
| **Hedra Character-3** | Founder-approved fictional Betsy intro/outro experiment only. | Normal CR production, Shorts, real politicians, evidence claims, or any implied public-figure speech. | `personas/visual-prompt-engineer.md` + `personas/qc-engineer.md` | Disabled by default |
| **ElevenLabs music / fal stable-audio** | Instrumental beds. No vocals (banned in cue). | Not VO. | `personas/sfx-specialist.md` (selection) + `personas/video-producer.md` (operator) | 23 |
| **Banana Pro / Cinema Worldbuilder skills** | 5 named cinema modes (locked camera + lens + grade per beat); photoreal-stack closing; diegetic-audio rule. | Not standalone tools — they govern how the personas write prompts FOR Sora/Kling/Flux. | `personas/visual-prompt-engineer.md` defers to these as authoritative | 17.5, 21 |

### Adding a new tool

1. Define UNIQUE strength (one sentence — best in class at what?)
2. Define what it LOSES to other tools
3. Assign owning persona
4. Slot it into a stage
5. Add a row above
6. Add a hard-fail rule to `visual-prompt-engineer.md` rejecting wrong-tool use

### Generative-video doctrine

Higgsfield is now available as the preferred paid cinematic studio when prepaid credits exist. Use it for 0-3 high-impact non-character beats per long-form: receipt-table macro shots, empty podiums, Capitol/statehouse atmosphere, generic election-night crowd plates, and cinematic transitions. Do not use Higgsfield for readable text, numbers, charts, source citations, real politician faces, or claims evidence. Prepaid credits are finite; log credit use per beat and keep the per-episode generative budget visible.

fal.ai remains the automated fallback and patch layer: FLUX for cheap seed stills, Kling/Sora/Wan for scripted atmosphere, and Seedance R2V for 1-4s watch-QC visual repairs. Prefer fal when the pipeline needs repeatable CLI execution, cached outputs, or a cheap retry. Prefer Higgsfield when the beat needs higher cinematic polish and does not contain readable claims or real-person likeness.

#### Generation backend routing — Higgsfield-preferred-with-fal-fallback (verified 2026-05-30)

**The premise, stated honestly.** The founder's Higgsfield *unlimited / free generations* tier is **NOT** accessible via the MCP/CLI — only via higgsfield.ai in the browser. The CLI bills **per generation in credits** (`higgsfield account` shows the balance, `higgsfield generate cost <model>` returns a per-call credit estimate). So "use Higgsfield to get unlimited free generations from automation" is **false**. What IS true: the ultra subscription is a **prepaid monthly credit pool that is already sunk cost**, so spending it on CR beats is **$0 incremental cash** until the pool runs out — whereas every fal call is fresh metered cash against the $500 cap. That, plus per-unit price parity on video, is the real reason to prefer it.

**Verified credit costs (2026-05-30, `higgsfield generate cost`):**

| Beat | Higgsfield (credits ≈ prepaid) | fal cash | Route |
|---|---|---|---|
| Atmosphere / seed still | `nano_banana_2` 2 cr | FLUX Pro $0.04 | Higgsfield (in-pool = $0 cash) |
| No-people environment plate | `soul_location` 0.12 cr | FLUX Pro $0.04 | Higgsfield (cheapest by far) |
| Image-to-video motion (5s) | `kling3_0` ~10 cr flat | fal Kling $0.35 (0.07/s) | Higgsfield (flat beats per-sec) |
| Premium multi-char video | `seedance_2_0` ~22.5 cr | fal Sora/Veo $0.10–0.40/s | case-by-case; fal for repeatable cached retries |
| Readable text / chart / real face | — FORBIDDEN — | — FORBIDDEN — | Remotion / Wikimedia only |

**Router.** `scripts/pipeline/gen-router.py` implements prefer-MCP-when-available-else-fal. Availability is **probed, never an env-var toggle** (portfolio rule): the router checks `higgsfield` is on PATH → `account status` authenticates → credit balance ≥ the model's estimated cost. If all true it generates via the CLI and logs the credit draw (cash $0) to `.external-costs.jsonl`; otherwise it shells out to the existing `fal-stills-gen.py` / `fal-kling-i2v.py` **unchanged**. Both backends keep every gate around them — the router only changes WHERE a still/clip comes from, not the storyboard validator (Stage 19) or watch QC (Stages 25/26). Prompts still come from visual-prompt-engineer / banana-pro-director / cinema-worldbuilder. Pass `--force-fal` for repeatable cached retries. Probe with `python3 scripts/pipeline/gen-router.py probe`.

**Scope.** Wired for CR (stills + Kling i2v) first. NTO/HealthBrew keep their own fal scripts; same pattern applies — point their generative stages at a sibling `gen-router.py` when those pipelines are next touched. The credit pool is shared across the founder's account, so log credits everywhere to keep the pool visible.

Remotion is the source of truth for information. Any readable number, donor amount, vote margin, date, source URL, chart, map, timeline, money-flow diagram, verdict stamp, quote card, chapter card, CTA, or Shorts text card must be Remotion/HTML-rendered, never generated by Higgsfield, Hedra, fal, Sora, Kling, Wan, Flux, or Seedance.

Hedra is forbidden in normal CR/SEALED production. Allowed only with explicit founder approval for a clearly fictional/non-founder/non-politician Betsy intro or outro experiment. Never use Hedra for real politicians, donor figures, alleged speech, source claims, Shorts, or anything that could imply a public figure said words they did not say. If used, add AI-presenter disclosure and run lip-sync/watch QC before upload.

### Reusable brand cards — intro/outro (founder lock 2026-05-29)

Every published piece gets branded head/tail cards spliced on. These are
one-time reusable Remotion assets — render once, splice onto every future
piece. Never regenerate per-episode.

| Card | Aspect | Asset | Remotion comp |
|------|--------|-------|---------------|
| Shorts intro | 9:16 1080×1920 ~2s | `brand/shorts-intro.mp4` | `ShortsIntro` |
| Shorts subscribe outro | 9:16 1080×1920 ~3s | `brand/shorts-subscribe-outro.mp4` | `ShortsSubscribeOutro` |
| **Long-form subscribe outro** | **16:9 1920×1080 ~5s** | **`brand/longform-subscribe-outro.mp4`** | **`LongformSubscribeOutro`** |

**Long-form tail is now a STANDING HABIT:** every LF gets the horizontal
subscribe outro (`SUBSCRIBE` button + bell + **newsletter signup**
campaignreceipts.com/weekly) appended at the tail, after the CTA card and the
`closing_silence_s` music-bed tail. Same sober ledger aesthetic as the Shorts
cards. Silent cards ride a brand sting so audio never drops to dead air (see
`brand/shorts-stings-README.md`). Do not ship an LF without it.

### Cross-video discovery — WATCH NEXT + playlist + end screen (founder lock 2026-05-29)

Every newly published video must ship with cross-links wired, so the channel
binges instead of dead-ends. This is now a STANDING HABIT, not a one-time sweep
(the 39-video backfill ran 2026-05-29). Three levers, applied at publish:
(1) a **▶ WATCH NEXT** block in the description — 2–3 picks via `youtube-upload.py
--update-meta`, inserted above the growth-triad footer (never replacing it),
idempotent (replace an existing block, never stack); Shorts point at their full
LF + a same-cluster sibling, LFs point at their best Short + a sibling LF.
(2) **add the video to its topic playlist** (`add_to_playlist`) — AIPAC & Outside
Money `PL9xPOHXdYWw_p3_Nb-_PwlX871hUsYOL-`, Foreign Policy Receipts
`PL9xPOHXdYWw_ecxrvQzAnkMbzS7DxW0EZ`, or Sealed2016
`PL9xPOHXdYWw81KrNr7QBCIy6lBIYXM3tm`.
(3) **end screen** (API cannot set this — founder does it by hand in Studio):
element 1 = best-for-you / LF counterpart, element 2 = topic sibling, element 3 =
Subscribe; log the row in `eng/youtube-meta/end-screen-plan-<date>.md`. Do not
mark a video "published" until all three are wired.

**End screens are decided BEFORE upload (Stage 28.5), not after (founder lock
2026-05-30).** The end-screen row (which 2 videos + Subscribe) is authored as
part of pre-upload prep so the founder sets it during the same Studio session as
the upload — never a separate later pass. WATCH-NEXT picks and the playlist
assignment are staged at 28.5 too, then pushed at Stage 30 once the video ID exists.

---

## Failure modes locked into doctrine

Each row is a real failure that shipped (or nearly did). The gate listed prevents recurrence.

| Date | Failure | Symptom | Root cause | Hard-fail gate |
|------|---------|---------|-----------|----------------|
| 2026-05-23 | Bush LF showed "URANIUM ENRICHMENT %" on MO-1 election chart | Iran-deal text-card under Bush VO at 3:20 | `bar2` template inherited from `sealed-aipac-iran-deal-v7`; Remotion comps not isolated per episode | Stage 19 `validate-storyboard.py` rejects URANIUM in CR slugs; Stage 22 Remotion isolation `remotion/src/episodes/<slug>/`; Stage 24 text-card OCR against per-slug expected data |
| 2026-05-23 | `public/longform/cr-bell-bush-aipac-primary.mp4` stale at upload | Upload pushed OLD broken master | Manual `_build/` → `public/` copy step | Stage 24 `produce-from-storyboard.py` calls `sync_public_master()` on PASS; upload runner re-checks mtime |
| 2026-05-23 | Bush + Massie LFs uploaded BEFORE final QC | Live video has broken chart; local fixed but never re-uploaded | Upload triggered before Stage 25/26 finished | Stages 25, 26 must SHIP-OK BEFORE Stage 29 manual upload; Stage 30 post-Studio re-verifies live URL |
| 2026-05-22 | 3 of top 9 Bush shorts shipped with mid-sentence cut | `"...They—"`, `"...and—"` etc. | `cut-shorts-v2.py` snapped to clip-window edge | Doctrine line 4 (NO VO on shorts) eliminates the class. Legacy script requires founder override flag. |
| 2026-05-23 | Shipped Massie LF read "Aypack" throughout | Jessica reads `AIPAC` as a word | Script wrote `AIPAC` not `A.I.P.A.C.` | Stage 13 `--strict-lint`; Stage 15 `qc_spoken.py --pronunciation-only` cross-checks back-transcript |
| 2026-05-23 | Bush title shipped as `MILLION Beat Cori Bush…` (`$8 ` dropped) | YouTube title missing first 3 chars | Shell-escaping bug — `--title "$8 ..."` expanded `$8` | Stage 30 `--meta-from FILE` flag (reads JSON, no CLI string expansion) |
| 2026-05-24 | Agent invoked `cut-shorts-v2.py` directly, skipping format + visual QC | Shipped 3 broken shorts | Agent shortcut, bypassed orchestrator | Doctrine line 9: skill is ONLY entry. Direct script invocation forbidden when a hard-fail gate exists downstream. |
| 2026-05-29 | 3 SEALED Shorts carved off LF masters cut off mid-sentence, no punchline | embassy-e2 / campus-c1 / campus-c2 spliced via `splice-shorts-from-master.py` | Shorts lifted as raw LF windows; LF sentences don't end on Short boundaries | **Shorts are AUTHORED, not carved** (Stage 24.a rewrite). Carving the LF timeline for Shorts FORBIDDEN. 24.d punchline-landing + carve-detector gate added. |
| 2026-05-24 | Re-uploaded Bush verdict short, duplicating `wKHoHfv4DaY` | Two of the same short live | Runner didn't check live state | Stage 24.b checks `eng/PUBLISHED-YOUTUBE.md` for slug-keyed live ID, skips if public |
| 2026-05-24 | SEALED short 9:16 vertical render had SourceCard + Timeline floating in middle | Massive empty top/bottom on phone | Compositions tuned for 1280×720 only | Doctrine line 5: all compositions detect `height > width` and apply `k = 2.2` scale multiplier. `SourceCard.tsx` + `Timeline.tsx` patched 2026-05-24. |
| 2026-05-24 | yuvj420p shorts rejected by YouTube Studio | "We can't process this video" | ffmpeg final mux output yuvj420p | Stage 24.b mandatory final mux: `yuv420p` + BT.709 + 48kHz AAC + `+faststart` baked into `produce-short-generic.mjs` |
| 2026-05-24 | youtube-broll-clip.py returned mtime-newest cache file instead of id-matched | b-roll content mismatched the script beat | `download_source()` glob bug | Fixed with `_yt_video_id()` URL parser; Stage 25 Pass 1 catches via OCR + frame-match |
| 2026-05-31 | TX-Senate LF master ~60% visually BLACK (dark generative "atmosphere" clips) yet QC "PASSED" 3× | ~50 of 80 sampled frames dark/blank | ffmpeg `blackdetect` flags only near-PURE-#000 sustained; dark-vignette atmosphere has very low mean luma but is not pure black, so it slips through. Stills-QC also missed it. **Visual QC must use brightness/variance stats + `/watch`, NEVER `blackdetect` alone.** | Stage 24.5 `qc-black-frames.py` (HARD FAIL, NEVER OVERRIDABLE): `signalstats` mean-luma + spread over the whole file; FAIL if >10% frames dark/blank or any dark run >3s. Calibrated so #F4EFE6 parchment passes, dark atmosphere fails. |

| 2026-06-01 | Generative i2v clips silently black-rendered (dark-vignette), no per-clip gate | Dark Kling clips written to disk + spliced; only caught at master-level QC | `fal-kling-i2v.py` used `queue.fal.run` (masks silent server failures), had no post-generation luma check, no start-frame brightness check, no prompt-length cap | `fal-kling-i2v.py` hardened: sync `fal.run` endpoint (surfaces 422/403 immediately), per-clip post-gen luma gate (reject YAVG<70 or flat+dark, mirrors `qc-black-frames.py`), start-frame brightness gate, 2400-char prompt cap. AI plates must be briefed BRIGHT/high-key (dark/dusk/golden-hour briefs black-render). |
| 2026-06-01 | Count-up rolling digits/percentage distracting | Founder feedback: "numbers running up is distracting, just show the number and underline" | `CountUp.tsx` animated value 0→to | `CountUp.tsx`: number renders STATIC at full value (fade-in) + underline draw-in; no roll. `from`/`easing` kept for back-compat, unused. |
| 2026-06-01 | VO re-render blocked + truncated on a 1-word edit | `--force-vo` failed: `script-qc.py` ran on nonexistent `_build/<slug>/vo-v2.txt`; storyteller gate "no VO content"; quoted-VO extractor grabbed only 1 of N blocks (194 chars) | (1) storyboard `vo_script_path` pointed at a derived `_build/.../vo-v2.txt` that was cleaned; (2) `extract_vo_blocks` regex `"([^"]+)"` breaks on INNER quotes (e.g. "Ohio Works"); (3) storyteller gate is advisory but `check=True` hard-blocks | For surgical 1-line VO edits: re-TTS only the affected chunk (`_vo_chunk_parts/block_NN`) or just the changed sentence, splice via ffmpeg at a silence boundary, re-concat — keeps the other clips' sync. FIXED 2026-06-01: (1) canonical `vo_script_path` is now `eng/scripts/cr-new-news/<slug>-vo.txt` plain narration (TX repointed; `-vo.txt` auto-skips the storyteller gate + uses the plain TTS branch); (2) `extract_vo_blocks` now captures the whole VO line + strips only WRAPPING quotes (inner quotes like "Ohio Works" preserved); (3) `script-qc.py` storyteller gate is ADVISORY (no `check=True`) so it can't hard-block a re-render. |
| 2026-06-01 | "Free newsletter" claim shipped on cards/VO after founder said newsletter is NOT free | QC found "free newsletter" surviving in 4 places after a partial scrub | The claim lived in: VO script, `LongformSubscribeOutro.tsx`, the `txsen-cta` text-card def in `render-text-cards.mjs`, AND the description — scrubbing one missed the others | Growth-triad gate in `youtube-upload.py` no longer REQUIRES `campaignreceipts.com/weekly`; newsletter is not called "free" portfolio-wide; outro = bare `campaignreceipts.com`. When changing a recurring CTA claim, grep ALL of: storyboard, `render-text-cards.mjs` card defs, the outro Remotion comp, the VO script, the description. |

### Adding to this table

When a failure ships:
1. Add a row with date, symptom, root cause, gate that should've caught it
2. If no existing gate would've caught: add a new gate stage + new script
3. Update relevant persona `.md` with a "DO NOT" clause mapping to this failure
4. New gate must be hard-fail (exit ≠ 0), never a warning

---

## Cost discipline (per-stage budgets)

| Stage tier | Per-piece cap | Source |
|------------|---------------|--------|
| Persona stages (Opus) | ≤ $5 soft | `scripts/.external-costs.jsonl` |
| Persona stages (Haiku) | ≤ $1 soft | same |
| Render (Remotion + ffmpeg) | ≤ $1 (local CPU) | n/a |
| TTS (ElevenLabs LF) | ≤ $2.50 | per-stage cap in stages.yaml |
| Generative (fal Sora/Kling) | ≤ $3 | Stage 21 cap |
| YouTube API (metadata only) | ~250 quota units / piece | quota log |
| **Per-piece hard cap** | **≤ $20 render + ≤ $5 personas** | Chief Accountant gate (`shared/portfolio-hub`) |

If a stage exceeds its soft cap by >2x without founder override, the pipeline pauses for review.

---

## How an agent runs this pipeline

Invoke `/cr-production-pipeline` and pass the topic brief. The skill:

1. Confirms 4 inputs: topic brief, slug, program (`sealed | cr-new-news`), mode (`longform | short`).
2. Reads `eng/CR-PRODUCTION-PIPELINE-v4.md` (this doc) as prose source-of-truth.
3. Reads `.claude/skills/cr-production-pipeline/stages.yaml` as machine-readable stage list.
4. Runs `scripts/pipeline/pipeline-state.py init --slug <X> --program <Y> --mode <Z> --brief <path>`.
5. Loops: `pipeline-state.py next --slug <X>` → spawn Agent subagent (kind=persona) OR run Bash command (kind=tool) → verify output artifact exists → `pipeline-state.py mark --slug <X> --stage N --verdict PASS|FAIL|SKIPPED`.
6. On hard-fail gate trip with `never_overridable: true`: STOP, surface violation, escalate to founder.
7. On hard-fail with `override_flag` set: ASK founder for explicit override; log to council report.
8. At Stage 29 (`kind: manual`, `pause_reason` set): pause and ask founder for new video ID(s).
9. Logs persona + render spend to `scripts/.external-costs.jsonl` per stage.
10. Idempotent: stages with OUTPUT existing on disk are auto-marked PASS (cache hit) on `next` walk.

---

## What's expressly forbidden (auto-fail)

- AI-generated face of a real politician (any tool — fal, Higgsfield, Hedra)
- Looping a clip to fill a longer beat window
- Calling `videos.insert` to upload (founder manual only)
- Shipping a short with spoken VO (after 2026-05-24 lock) without founder override
- Shipping a master that hasn't passed 2x `/watch` checklist (Stages 25, 26)
- Skipping `text-card-sync-qc.py` — the URANIUM-leak detector
- Re-uploading a slug with live ID in `PUBLISHED-YOUTUBE.md` without `--replace-id`
- Writing `AIPAC` (not `A.I.P.A.C.`) in any VO copy line
- Bare composition IDs across episodes in Remotion (must be `{slug}__{composition}`)
- Any persona producing an artifact outside its declared OUTPUT column

---

## Verification (the pipeline is "done" when)

- One end-to-end run produces a master that PASSES 2x `/watch` checklist on first try
- Wall time per LF ≤ 6 hours; per short ≤ 45 min
- Total cost per LF + 3 shorts ≤ $20 (render + personas)
- An idiot AI agent cannot take a shortcut because every gate exits non-zero on violation
- Each persona has ONE job, no overlap
- Both programs (SEALED + CR new-news) run through the same skill with `--program` only

---

## Provenance

- Merged from `eng/PRODUCTION-PIPELINE-v1.md` (38-step LF doctrine, 2026-05-24) + `SEALED-PRODUCTION-PIPELINE-v3.md` (35-step SEALED doctrine, 2026-05-24).
- Author of merge: Claude session 2026-05-25, after founder lock "build the production pipeline in campaign receipts and share it — your work will be done once you finish the Sealed receipts, and the rest of the year we'll be posting viral news in campaign receipts."
- Both source docs deleted after merge. Their failure-mode tables, tool matrix, and dual-program selector are folded into the relevant sections above.

---

## Cross-references

- **Skill wrapper:** `.claude/skills/cr-production-pipeline/SKILL.md`
- **Machine-readable stage list:** `.claude/skills/cr-production-pipeline/stages.yaml`
- **State machine:** `scripts/pipeline/pipeline-state.py` (init / status / next / mark / resume)
- **Personas:** `personas/` + `personas/council/` + `personas/viral-panel/`
- **Pipeline scripts:** `scripts/pipeline/`
- **Live ID ledger:** `eng/PUBLISHED-YOUTUBE.md`
- **Cost log:** `scripts/.external-costs.jsonl`
- **Visual prompting authority:** `shared/skills/external-prior-art/cinema-worldbuilder/SKILL.md` + `shared/skills/external-prior-art/banana-pro-director/SKILL.md`
- **Narrative background runbook:** `eng/PRODUCTION-PIPELINE-RUNBOOK.md` (kept for context, not source of truth)
