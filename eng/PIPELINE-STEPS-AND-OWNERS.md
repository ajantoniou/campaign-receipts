# CR Production Pipeline — Steps × Owner Subagents × Tasks

**Locked 2026-05-25.** Source of truth for the `cr-production-pipeline` orchestrator skill.

**Doctrine (founder lock 2026-05-25):**
- Each step has ONE specialist subagent that owns the decision
- The specialist's persona IS the gate — its output IS the artifact
- No "council REVISE" loops, no "story-score 100/100 binding" gates
- Founder is the final gate. Founder reads + ships or revises.
- Growth lock 2026-05-27: no new paywall or paid-tier build until
  @CampaignReceiptsYoutube reaches 10,000 subscribers or founder
  explicitly overrides. Until then, every public surface optimizes for
  free email capture into `cr_free_subscribers`.
- Every long-form video, Short, and companion article must link:
  `https://campaignreceipts.com`, the relevant CR companion page or
  dossier, the free newsletter signup, and `https://sealed2016.com`
  when SEALED / Trump-audit methodology is relevant.
- YouTube Studio Inspiration cards are packaging signals only. They are
  never evidence for dollar figures, causation, or donor claims. Every
  number must be re-derived from CR data, FEC, Congress.gov, court, SOS,
  or other primary sources before script.
- See `feedback_no_council_gates_assign_to_experts.md` for the why.

## Inputs the founder supplies once per episode

- Topic brief (2-5 sentences on what happened + why now)
- Slug: `cr-<lastname>-<seat>-<context>` (e.g., `cr-rabb-pa3-aipac-defeat`)
- Program: `cr-new-news` or `sealed-2016`
- Optional: YouTube Inspiration screenshot/topic seed. Treat as viewer
  packaging inspiration, not a factual source.

## Step table

| # | Step | Owner persona | Task | Output |
|---|------|---------------|------|--------|
| **0** | Daily topic radar | `personas/viral-topic-researcher.md` | Scan YouTube Inspiration patterns, public news, CR database surfaces, FEC/Congress.gov/source layers, and prior channel analytics. Produce 5 ranked topic candidates with GO/HOLD/KILL. A GO candidate must have a voter-facing tension, central donor/money trail, at least one pinned primary-source receipt, a long-form angle, 3-8 Shorts angles, a companion-page plan, and CTA/link plan. | `eng/briefs/<date>-topic-radar.md` |
| **1** | Topic brief → story extraction | `personas/story-investigator.md` | Read founder brief or selected Step 0 topic slab. Surface: central tension, who benefits/who pays, the receipt that anchors the episode (specific dollar/vote/filing), 5-9 narrative beats, 3 hook variations. | `eng/briefs/<date>-<slug>-story-extraction.md` |
| **2** | Research pack (HARDENED) | general-purpose subagent loaded with fact-check-qc persona | For EVERY politician named: pull name spelling, role/title, outcome (won/lost), incumbent/challenger status, vote count, IE spent against, primary-source URL. ALL dollar/date/percentage claims get an FEC.gov / SOS / court URL + retrieval date. | `eng/research/<date>-<slug>-receipts.md` with politician table + Tier 1-5 receipts |
| **3** | Audience demand validation | `personas/audience-demand-strategist.md` | GO/HOLD/KILL on this topic for CR audience. If GO: 5 hook variations + CTR estimates + cluster fit with prior shipped LFs. | `eng/briefs/<date>-<slug>-validation.md` |
| **4** | Script draft v1 | `personas/cr-new-news-writer.md` | 6th-grade reading level. Single-narrator (Betsy/Jessica). 580-650 words. From story-investigator's beats, not the topic. Include `<!-- CONCEPTS: ... -->` header. | `content/scripts/<slug>-v1.md` |
| **5** | Story-structure pass (screenwriter) | `personas/screenwriter.md` (NTO equivalent if CR doesn't have it) | Add TURN comment. Embed receipts in scenes. Kill date-stamp chains. | `content/scripts/<slug>-v2.md` |
| **6** | Storytelling pass (JK Rowling) | `personas/jk-rowling-storyteller.md` | Picture-first beats. Jargon (FEC, IE, P.A.C.) glossed inline same sentence. | `content/scripts/<slug>-v3.md` |
| **7** | MrBeast retention pass (HARDENED) | `personas/council/11-mrbeast-viral-producer.md` or `shared/personas/mrbeast-viral-producer.md` | **PROMPT MUST INCLUDE VERBATIM:** "Line 1 of VO MUST contain (a) a specific dollar figure AND (b) the outcome of the episode. If either missing, rewrite Line 1 before returning." Add re-hooks every 60-90s. Add 2 open-loop phrases. | `content/scripts/<slug>-v4.md` |
| **8** | Empathy pass | `personas/empathy-editor.md` (flag-only) + `personas/council/04-cincinnati-mom.md` (apply) | Empathy-editor flags missing-empathy lines (FLAG-ONLY, no rewrites). Cincinnati-mom applies the flags with neighbor-voice rewrites. | `content/scripts/<slug>-empathy-flags.md` + `<slug>-v4-final.md` |
| **8.5** | Cadence director (NEW 2026-05-25) | `personas/cadence-director.md` | Insert `[pause:Xms]` tokens throughout the script: pre-punchline 600ms breath, post-reveal 1s silence, 300ms after each acronym first-mention, 200ms after politician names, 400ms between pattern items, 800ms scene transitions, 1.2s cold-close tail. Target effective wpm per section: hook 150-160, context 140-150, reveal setup 130-140, **punchline 110-120**, verdict 120-130, cold close 110-120. ONLY inserts pause markers — does NOT change words. "Slowness IS part of the 3rd-grade contract." Coordinates with score-composer for music-silence-VO alignment. | `content/scripts/<slug>-v6-cadence.md` |
| **9** | TTS readability lint | TOOL: `scripts/pipeline/script-qc.py` | Mechanical gate on `<slug>-v6-cadence.md`: A.I.P.A.C./F.E.C./P.A.C. spelled with periods, no banned phrases (`.com/`, brand names, URLs read literally), no `**ON SCREEN:**` markdown leaks. Also runs storyteller-gate (acronym-aware staccato detection + STORYLINE/RE-HOOKS comment requirements). | exit 0 PASS or fail list |
| **10** | Plain VO extract | `personas/video-producer.md` (mechanical extract) | Strip markdown headers + STORYLINE/RE-HOOKS comments; produce plain prose Jessica reads. | `eng/scripts/cr-new-news/<slug>-vo.txt` |
| **11** | ElevenLabs VO render | TOOL: `scripts/pipeline/elevenlabs-tts.py --chunked --no-verify` | Render Jessica VO with locked voice settings from `personas/betsy-the-narrator.md`. Pass `--no-verify` (WER verifier false-positives on number-word normalization; real QC at Step 12). | `_build/<slug>/vo.mp3` (~$0.90 / 4000 chars) |
| **12** | VO audio QC | `personas/qc-engineer.md` via TOOL: `scripts/pipeline/audio-qc.py --vo` | Voice-identity (Jessica fingerprint), volume (-20 to -26 dB mean), banned phrases via Scribe back-transcript. If FAIL: founder decides (re-render Step 11 or accept). | `_build/<slug>/qc-audio.md` |
| **13** | Storyboard | `personas/video-producer.md` + `personas/council/03-cinematographer.md` (consult) | Translate VO paragraphs into canonical CR storyboard schema (beats + clips + music_cues + text_cards). Every politician = `vendor: politician-caricature` (which FAL-skips to Wikipedia photo). Every chart = `vendor: remotion`. **Schema MUST match Bush/Massie LF storyboards (canonical reference).** | `eng/storyboards/<slug>.json` |
| **14** | Per-clip generative prompts (atmosphere beats only) | `personas/visual-prompt-engineer.md` | For every `generate: true` beat: pick cinema_mode (5 enum), write Kling/Sora/Wan prompt with locked camera/lens/grade block + photoreal stack + diegetic audio line. NEVER prompt a real-politician face. | `eng/storyboards/<slug>-clip-prompts.json` |
| **14.5** | Score composer (emotional audio arc — NEW 2026-05-25) | `personas/score-composer.md` | Read locked VO + storyboard. Identify the punchline sentence. Build a 4-6 music-cue arc: opener tense → establishing → sinister rise 60-90s before punchline → ta-da release on punchline + 2-3s after → verdict body → tail. Add 3-6 SFX hits (paper-flip on FEC reveal, pen-on-paper on money-flow, vote-count chime, verdict-stamp gavel). Coordinate with sfx-specialist for library asset picks. | `eng/storyboards/<slug>-score-plan.json` (then merged into the storyboard's `music_cues[]` + `sfx[]`) |
| **15** | Photo selection | `personas/cinematic-broll-director.md` | For every politician beat: pick Wikipedia portrait file, flag missing photos for fetch at Step 16. | `eng/storyboards/<slug>-photo-selections.json` |
| **16** | Wikipedia photo fetch | TOOL: `scripts/pipeline/fetch-wikipedia-photos.mjs` | Append new politicians to the TARGETS list; run script. Caches portraits + attribution JSON. | `public/photos/wikipedia/<slug>.jpg` + `.attribution.json` |
| **17** | Caricature manifest extension (one-time per new politician) | `personas/video-producer.md` (mechanical edit) | Append new politicians to `public/brand/caricatures.manifest.json` so `politician-caricature.py` dispatcher knows them. (Script's FAL-skip logic prefers Wikipedia photo if available; only generates FLUX if no Wikipedia page exists.) | `public/brand/caricatures.manifest.json` updated |
| **18** | Remotion episode scaffold | TOOL: `scripts/pipeline/scaffold-remotion-episode.py --slug <slug>` | Create `remotion/src/episodes/<slug>/compositions.ts` + manifest entry + registry.ts import. Required for per-episode isolation (prevents URANIUM-leak cross-episode bugs). | `remotion/src/episodes/<slug>/` |
| **19** | Text-card definitions (per-episode) | `personas/council/09-remotion-expert.md` | Hand-code per-episode text-cards in `scripts/pipeline/render-text-cards.mjs` (date stamps, headline mocks, CTA cards). 3-7 cards per episode typical. | `scripts/pipeline/render-text-cards.mjs` extended |
| **20** | Story score bootstrap (cache marker, not gate) | TOOL: `scripts/pipeline/story-score-lock.py --bootstrap-copy` | Creates `eng/story-scores/<slug>.json` so downstream scripts don't error. Score is rubric advisory, NOT a binding gate. | `eng/story-scores/<slug>.json` |
| **21** | Generative atmosphere clip (optional, 0-3 per episode) | `personas/visual-prompt-engineer.md` + TOOL | Higgsfield is now the preferred paid cinematic studio when prepaid credits exist; fal.ai remains the automated fallback/patch layer. Use only for non-character atmosphere, receipt macro shots, empty podiums, generic crowd/setting plates, or transitions. Remotion stays source of truth for every readable number, chart, source, CTA, and receipt. Never generate real politician faces or readable claims. | `_build/<slug>/clips/*.mp4` |
| **22** | Full pipeline run (clips + music + assemble) | TOOL: `scripts/pipeline/produce-from-storyboard.py --skip-vo --skip-copy-lock --skip-production-qc --resume` | Renders all 20+ clips (politician portraits via politician-caricature dispatcher, Remotion charts, text-cards) + music bed (bake-music.py) + master assembly (sync_public_master to public/longform/). | `_build/<slug>/master.mp4` + `public/longform/<slug>.mp4` |
| **23** | Master /watch QC (2x by qc-engineer) | `personas/qc-engineer.md` runs `watch` skill 2x | Pass 1 broad scan. Pass 2 focused on chart hot-zones + text-card hot-zones. 4-criteria SHIP-OK checklist. NOT a council; one specialist. | `_build/<slug>/watch-qc/pass1-pass2.md` |
| **24** | Title + 4 alternates (HARDENED with SEO keywords) | `personas/viral-panel/01-title-strategist.md` | **PROMPT MUST EMPHASIZE:** Title needs 2+ search keywords (politician name, AIPAC/lobby, district, dollar+verb). Pattern-match Bush/Massie LF titles for cluster cohesion. PICKED title is what ships. | `_build/<slug>/youtube-meta.json` `title` + `title_alt` |
| **25** | Thumbnail | `personas/viral-panel/02-thumbnail-designer.md` + `personas/viral-panel/06-mrbeast-packaging.md` (consult) | 1280×720 via `generate-thumbnail.mjs`. Big dollar headline + 2-line punch subline + verdict stamp (LOST/RECEIPT/BROKEN). Portrait = the LOSER per channel pattern (Bush + Massie LF precedent). | `_build/<slug>/thumbnail.jpg` |
| **26** | Description + growth CTA | `personas/viral-panel/07-youtube-monetization.md` | YouTube description with: 2-line viral hook (first 150 chars are SEO-critical), chapter markers, full source slate from receipts.md (FEC + news URLs), AI disclosure line, hashtags, and the required CTA block: CampaignReceipts.com, article/dossier link, newsletter signup link, and sealed2016.com when relevant. Do not add paid-tier/paywall CTAs before the 10k-subscriber gate. Set ad-friendly call (yellow-expected for AIPAC content). | `_build/<slug>/description.md` + `youtube-meta.json` `monetization` block |
| **27** | FOUNDER UPLOAD (manual) | Founder | Drag-drop `public/longform/<slug>.mp4` into YouTube Studio as Private. Paste new video ID back to orchestrator. | YouTube video ID |
| **28** | --update-meta + thumbnail + public | TOOL: `scripts/pipeline/youtube-upload.py --update-meta` | Set title/desc/tags/category, upload thumbnail, set public, add to CR new-news playlist, delete old/broken ID if replacing. ~150 quota units. | video live |
| **29** | Post-publish /watch QC (live URL) | `personas/qc-engineer.md` via `watch` skill | Confirm live YouTube URL renders the master correctly. ONE failure = unlist via `youtube-upload.py --set-privacy unlisted`. | `_build/<slug>/watch-qc/live-post-publish.md` |
| **30** | Update PUBLISHED-YOUTUBE.md | `personas/video-producer.md` (mechanical edit) | Append new live ID to the live-table; log any deleted/replaced IDs. | `eng/PUBLISHED-YOUTUBE.md` updated |
| **30.5** | Video companion article + newsletter capture | `personas/video-landing-page-generator.md` | Create or update the 1:1 SEO companion page/article for the long-form. Embed the final YouTube video, source receipts, related CR links, free newsletter capture, and SEALED cross-link when relevant. No paid-tier CTA before the 10k-subscriber gate. | `app/articles/<slug>/page.tsx` or `video_companion` article row |
| **30.6** | YouTube Community post | `personas/viral-panel/01-title-strategist.md` + `personas/viral-panel/07-youtube-monetization.md` | After the companion article or landing page is live, create one YouTube Community post in Studio with a viral headline, 2-4 sentence receipt hook, link to the latest article/page, and the free newsletter CTA. YouTube Data API has no `communityPosts` write resource, so this is a Studio/manual step until a supported API exists. No Facebook or other social syndication until founder opens that channel. No paid-tier/paywall CTA before 10k subscribers. | Live YouTube Community post + `eng/youtube-posts/<slug>.md` |
| **31** | 72-hour analytics measure | `personas/analytics-tracker.md` | CTR, retention curve, traffic source via YouTube Analytics API or Studio. Feeds Step 1 of next episode. | `eng/analytics/<slug>-72hr.md` |

## Shorts sub-pipeline (parallel — runs after Step 30)

Per `feedback_shorts_text_and_music_no_vo.md`: shorts are TEXT + B-ROLL + MUSIC, NOT VO clips.

| # | Step | Owner | Task | Output |
|---|------|-------|------|--------|
| S1 | Pick 3-5 short beats | `personas/viral-panel/05-clip-cutter.md` | Read script, identify 3-5 hook-question + stat + verdict beats. | `eng/storyboards/<slug>-shorts-plan.json` |
| S2 | Per-short b-roll/photo selection | `personas/cinematic-broll-director.md` | Pick Wikipedia ken-burns OR clean archival segment per short. | `eng/storyboards/<slug>-shorts-broll.json` |
| S3 | Render text-card shorts | TOOL: `scripts/pipeline/render-text-short.mjs` (TO BUILD) | 1080×1920 full-bleed b-roll + 3-4 text-card punches + footer CTA + music bed. NO VO. | `_build/<slug>/shorts/short-NN.mp4` |
| S4 | Shorts format QC | TOOL: `scripts/pipeline/qc-shorts-format.py` (TO BUILD) | Hard-fail letterbox gutters, VO sneak-in, missing text cards, wrong duration, wrong aspect. | exit 0 PASS or fix list |
| S5 | Per-short thumbnail | `personas/viral-panel/02-thumbnail-designer.md` | 1080×1920 hook-question + politician/receipt visual. | `_build/<slug>/shorts/short-NN-thumb.jpg` |
| S6 | Founder uploads each short (manual) | Founder | Drag-drop at Private; paste IDs back. | YouTube short IDs |
| S7 | Per-short --update-meta + public | TOOL: `scripts/pipeline/youtube-upload.py --update-meta` | Per short, with full episode link prepended and the same growth CTA block: CampaignReceipts.com, newsletter signup, article/dossier link, and sealed2016.com when relevant. No paid-tier CTA before the 10k-subscriber gate. | shorts live |
| S8 | Per-short live /watch QC | `personas/qc-engineer.md` via `watch` skill | Confirm full-bleed 9:16, text readable, music audible, no VO sneak-in. | per-short QC log |

## What is EXPLICITLY NOT in the pipeline anymore (removed 2026-05-25)

- Council ship-gate as a BLOCKER (Step 4 / Step 27 in old doctrine) → council reports are ADVISORY now; founder reads + decides
- Story-score 100/100 binding gate → optional self-check rubric
- Copy-lock with 4 upstream gate requirements → cache marker only (`--founder-ok` flag bypasses)
- Step 2.95 fact-check-as-blocking-gate (briefly added 2026-05-25, immediately removed) → moved into Step 2 research-pack subagent's job
- Step 2.9b hook-strength gate (briefly added, immediately removed) → moved into Step 7 MrBeast subagent's prompt
- Post-render council panel (11 personas voting REVISE on storyboard) → replaced by single Step 23 qc-engineer with /watch

## Hard mechanical gates that ARE allowed (catch defects no specialist can detect)

- Step 9 `script-qc.py` + `script-storyteller-gate.py` — catches periods-on-acronyms, banned phrases, URL leaks, dominant-staccato fragments. These check mechanical/syntactic defects, not subjective quality.
- Step S4 `qc-shorts-format.py` — catches letterbox gutters, VO sneak-in, wrong aspect ratio. Mechanical only.
- Future: `text-card-sync-qc.py` per-slug expansion to catch URANIUM-style cross-episode text-card leaks. Mechanical OCR check.

These are OK because they catch mechanical defects (regex matches, ffprobe-detectable issues), not subjective quality judgments.

## How the orchestrator skill uses this table

`/cr-production-pipeline` reads this doc as source-of-truth. For each Step row:
1. Read the owner persona's `.md` file
2. Spawn an `Agent` subagent (general-purpose) with the persona's content as system prompt
3. Pass the Task description verbatim + pointers to the input artifacts
4. Verify the Output artifact exists at the declared path
5. On Step 27, pause for founder upload + video ID paste-back
6. On Step S6 (per-short), pause per short

No "if council votes REVISE, loop back to Step N." The pipeline is one-way.
