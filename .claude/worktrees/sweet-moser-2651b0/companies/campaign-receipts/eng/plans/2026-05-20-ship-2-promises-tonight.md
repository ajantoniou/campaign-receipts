# Ship 2 Promises Tonight — Panel + 20-Point Execution Plan

**Date:** 2026-05-20
**Author:** Panel coordinator (CR)
**Wall clock:** 8 hours
**Budget cap:** $50
**Goal:** Two videos LIVE on `@CampaignReceiptsYoutube` (channel `UC4NINNbjaoy2PTKxbY5an-g`) within 8 hours. First two of 145 SEALED promises shipped.

---

## Verified starting state (no assumptions)

- `main` is up-to-date (`git pull --ff-only origin main` returned "Already up to date").
- Stage-1 pipeline commit `9be21abd` is on main; 7 personas + 9 pipeline scripts present at `scripts/pipeline/` (incl. `produce-from-storyboard.py`, `fetch-wikipedia-photos.mjs`).
- `.env` (monorepo root) has `CR_YOUTUBE_REFRESH_TOKEN`, `FAL_KEY`, `ELEVENLABS_API_KEY` set.
- Iran-deal canonical script at `eng/longform-scripts/sealed-iran-deal.md` (147 lines, 10 scenes, book-cited).
- v1 long-form at `public/longform/sealed-aipac-iran-deal.mp4` (4:01, 27MB, SVG-card aesthetic — Cincinnati Mom likely rejects).
- v1 short at `public/shorts/sealed-001-aipac-iran-deal.mp4` (40s) — already failed council in `eng/shorts-review/sealed-001-persona-pass-2026-05-20.md`. Three required fixes documented.
- Wikimedia photos cached: `public/photos/wikipedia/donald-trump-2016.jpg`, `public/photos/wikipedia/sheldon-adelson.jpg`. **No Schumer / Cotton / Mexico-wall figures cached.**

---

## Panel debate (each member in voice)

### 1. Viral Hook Specialist — "Which 2 promises ship tonight"

We pick **Iran-deal (promise #73, KEPT)** and **the Mexico-wall promise (broken/partial)** is the obvious counterweight — but Mexico-wall requires fresh Wikimedia (Peña Nieto, AMLO) we haven't cached and a fresh script we haven't written. **The shortest path is NOT "two new topics." It is one new long-form + one new short, both built on the Iran-deal asset that already has a 147-line book-cited script and two cached Wikimedia photos.**

Specifically:
- **Video A — long-form (4:00–4:15):** "Who Paid To Kill The Iran Deal" — v2 of `sealed-iran-deal.md` script, rendered against the producer pipeline (kling-i2v on Adelson + Trump, wan-2.5 atmosphere, FLUX document mockups, FLUX stamps). This is a true v2 that beats the SVG-card v1 because the politicians get real anchored motion.
- **Video B — Short (32–34s):** "$82M. 3 Promises. Here's How It Worked" — recut from the new long-form using `cut-shorts-v2.py`, with the THREE REQUIRED FIXES from the 2026-05-20 council review baked in (insight-promise hook, consequence-not-EO-number focal point, story-completion CTA).

This is two videos, both on promise #73, but they are NOT the same artifact — different format, different audience, different YouTube performance curve. Shorts shop the long-form; that's the canonical Shorts→long-form algo loop on a new channel.

If the founder genuinely wants two DIFFERENT promises, we need +3h for Mexico-wall script + photo fetch + render. That blows the 8-hour window. **My recommendation: ship the pair on promise #73. Promise #2 (different topic) is tomorrow's batch.**

### 2. Video Producer (CR) — "Smallest-clip-count storyboard that still feels premium"

For a 4:00 long-form with 10 scenes from the locked script:

| # | Scene | Vendor | Duration | Asset | Cost |
|---|---|---|---|---|---|
| 1 | Hook — flags + red X | wan-2.5 t2v | 9s | new render | $0.45 |
| 2 | JCPOA explainer + bar chart | FLUX still + Ken Burns | 21s | new still | $0.04 |
| 3 | Trump 2016 promise | kling-i2v (Trump photo) | 25s | cached | $1.75 |
| 4 | May 8, 2018 withdrawal | FLUX doc mockup + Ken Burns | 25s | new still | $0.04 |
| 5 | AIPAC three priorities | FLUX still (3 cards) | 30s | new still | $0.04 |
| 6 | Three RECEIPT-KEPT stamps | FLUX stamp stills + kling3-pro climax | 30s | 1 hero | $1.02 |
| 7 | Adelson reveal + $82M count | kling-i2v (Adelson photo) | 40s | cached | $2.80 |
| 8 | Fairness note (Soros et al.) | FLUX split-screen still | 25s | new still | $0.04 |
| 9 | Enrichment bar chart re-anim | FLUX still + Ken Burns | 30s | new still | $0.04 |
| 10 | Verdict stamp + end card | kling3-pro hero | 25s | new render | $1.02 |
| | **Video clips subtotal** | | **4:00** | | **$7.24** |
| | ElevenLabs Sarah VO (~700w) | | 4:11 | | $2.00 |
| | stable-audio music (~5 cues × 25s) | | | | $2.50 |
| | FLUX thumbnail | | | | $0.04 |
| | **Long-form subtotal** | | | | **$11.78** |

Short reuses long-form clips — zero new render cost.

**Total estimated render spend: ~$12.** Well under the $50 cap.

### 3. Cinematographer — "Minimum-viable that beats v1 SVG-card look"

v1 was SVG cards. The visual upgrade lever that costs almost nothing but lands hard:

- **Two kling-i2v shots on real cached Wikimedia photos** (Trump 2016, Adelson). These two clips alone are the single biggest "this is not a slide deck" signal. Cost: $4.55 combined.
- **Two kling3-pro hero shots** for the stamp landing (Scene 6) and the verdict close (Scene 10). Cost: $2.04.
- **Everything else is FLUX stills + Ken Burns.** This is correct for documentary CR aesthetic — Sarah is voice-only, the documents are the show.

VETO list (would kick the storyboard back):
- No FLUX-generated face of Trump or Adelson. (Use cached Wikimedia + kling-i2v.)
- No sora2 named-politician anything.
- No campaign-rally aesthetic, no chyrons, no flags-waving stock footage.

### 4. YouTube Algo Engineer — "First-24h reach on a brand-new channel"

Brand-new channel = no audience signal. Algo serves to a 100-impression probe pool; CTR + AVD on that probe pool determines whether the next 1000 impressions happen. Concrete asks:

- **Long-form title (≤60 chars):** "Who Paid To Kill The Iran Deal? Follow The $82M." (53 chars)
- **Short title (≤60 chars):** "$82 Million Bought 3 Trump Promises — Here's How" (50 chars)
- **Thumbnail concept (long-form):** Adelson face left half, "$82M" in 240pt civic-red right half, SEALED book bottom-right. Mobile-feed legibility required.
- **Description first 2 lines (repeat hook + chapter markers):**
  - L1: "In 2015 seven countries signed a deal that froze Iran's nuclear program. Three years later, one American president tore it up — alone."
  - L2: "00:00 Hook · 00:09 What the deal did · 00:30 The 2016 promise · 00:55 May 8 2018 · 01:20 AIPAC's wish list · 01:50 Three-for-three · 02:20 The donor reveal · 03:00 Fairness note · 03:25 Aftermath · 03:55 Verdict"
- **Tags:** iran deal, jcpoa, sheldon adelson, aipac, trump 2016 promises, campaign finance, fec receipts, sealed 2016, political accountability
- **Upload timing:** 8–10pm ET (cold-traffic prime, Wed–Thu peaks).
- **End-screen:** Card to the Short. Short's end-screen → card to long-form. Bilateral session-time loop.
- **Predicted CTR 5–7%, AVD 45–55% on long-form, 60–70% on the Short.** Acceptable for a probe-pool launch on a 0-subscriber channel.

### 5. Mel Gibson Producer — "Can this actually ship in 8 hours?"

Yes — but only because the script exists, the photos are cached, and the pipeline is already wired. Render time is the only real wall.

Realistic clock:
- **2h:** storyboard JSON build + per-prompt VO render + music cues
- **3h:** parallel fal.ai renders (kling-i2v ~6 min/clip × 2 = ~15 min wall; kling3-pro 2 clips ~10 min wall; FLUX stills ~30s each × ~7 = fast; wan-2.5 hook ~3 min wall — total wall ~30 min if parallelized, budget 3h for retries/regenerations)
- **1.5h:** ffmpeg assembly + cut-shorts pass + thumbnail
- **1h:** Cincinnati Mom review on rendered cuts (BINDING) + any last-minute trim
- **0.5h:** YouTube upload × 2 + metadata + commit + push

**Total: 8h tight.** Corners I will cut without compromising quality:
- Skip the kling3-pro Scene 10 verdict-stamp hero (replace with FLUX stamp + Ken Burns punch-in) IF the wall clock runs hot at hour 6. Saves $1.02 and 10 min wall.
- Render at 1080p, not 4K. CR is a documentary-aesthetic channel; 4K is wasted.
- ONE retry budget per clip. If kling-i2v fails twice, swap to FLUX still + Ken Burns and move on.

What I will NOT cut: the Cincinnati Mom gate at step 17. If she fails it, we ship the short alone or we ship nothing and we publish the diagnosis. Non-negotiable.

### 6. Cincinnati Mom — "The ONE thing that makes me share"

**Long-form:** the moment at 2:20 when Sarah reads Adelson's $82M next to the three dated receipts — but ONLY if the on-screen graphic shows the dates and the dollar figure side by side so my brother-in-law can pause and read it himself. If it flashes by too fast or if she says "JCPOA" without translating it again, I scroll. Tell me "Joint Comprehensive Plan of Action — the Iran nuclear deal" every time, not just the first time. I forget.

**Short:** the insight promise in the first 3 seconds. "$82 million. Three promises. Here's exactly how it worked." If I hear "how it worked," I will keep watching for the answer. Without those four words, I'm gone at 0:03.

**My pre-render verdict on this PLAN (not the video):** CONDITIONAL PASS. Storyboard is sound, fixes from the May 20 council are baked in, my brother-in-law gets a sentence he can repeat ("$82 million bought three policy wins on a published wish list — in order, in 18 months"). But I reserve the binding veto for the rendered cut at step 17.

### 7. Performance Marketer — "YouTube view → sealed2016.com book sale"

The v1 short's CTA "SEALED2016.COM — 145 promises. Every receipt." reads as a database; rewrite as story-completion ("Want the full story of how $82M became 3 policy wins? sealed2016.com.") — already in the council fixes.

Long-form description CTA: include link to `sealed2016.com` in line 3 of the description, and pinned comment with the SEALED book link + a free "Iran-Deal one-pager PDF" lead magnet IF we have one (we don't yet — defer to next batch; don't block tonight's ship).

Conversion path tonight: YouTube view → description click → sealed2016.com landing → retail or free-chapter download. Acceptable for night one. v2: add a `linktr.ee`-style hub.

---

## 20-Point Execution Plan

> Owner = `agent` unless noted. Founder is asleep but reachable for OAuth-style blockers only.

| # | Step | Files / Commands | Wall | Cost | Owner | Acceptance |
|---|---|---|---|---|---|---|
| 1 | Pull main (already done at plan-write; re-run before exec). | `cd "/Applications/.../AgentCompanies" && git pull --ff-only origin main` | 1m | $0 | agent | "Already up to date" OR fast-forward applied |
| 2 | Confirm working branch is `main` (no feature branch for this — direct-to-main on a 0-sub channel; commit per artifact). | `git branch --show-current` | 1m | $0 | agent | Output = `main` |
| 3 | Verify env vars present and non-empty. | `grep -E "^(CR_YOUTUBE_REFRESH_TOKEN|FAL_KEY|ELEVENLABS_API_KEY|CR_YOUTUBE_CLIENT_ID|CR_YOUTUBE_CLIENT_SECRET)=" /Applications/.../AgentCompanies/.env \| wc -l` should be `≥5`. If `CR_YOUTUBE_CLIENT_ID` or `_SECRET` missing → **STOP, escalate to founder.** | 5m | $0 | agent | All 5 vars set; if not, founder-blocker note in summary |
| 4 | Build storyboard JSON v2 for `sealed-aipac-iran-deal-v2` from the locked script using video-producer persona. | Output: `eng/storyboards/sealed-aipac-iran-deal-v2.json` (10 clips, vendor picks per the table above, source citations on every clip). | 45m | $0 (Claude tokens internal) | agent | JSON parses; 10 clips; every clip has `source_citation`; kling-i2v clips reference cached photos in `public/photos/wikipedia/` |
| 5 | Write `vo-direction.md` and `music-cues.yaml` siblings to the storyboard. | `eng/storyboards/sealed-aipac-iran-deal-v2-vo.md`, `...-music.yaml` | 15m | $0 | agent | Files exist; music has ≥5 cues; VO has Sarah ElevenLabs params (stability 0.55, similarity 0.75, style 0.20) |
| 6 | Write the FLUX thumbnail prompt. | `eng/storyboards/sealed-aipac-iran-deal-v2-thumbnail.md` | 5m | $0 | agent | One paragraph; Adelson face L + "$82M" R + book; no chyron, no flag |
| 7 | Council pre-render review of the storyboard JSON (political-historian + cinematographer + viral-hook). | Write `eng/storyboards/sealed-aipac-iran-deal-v2-council.md`; pause if any HARD VETO | 20m | $0 | agent | All three roles render `STRENGTHS / RISKS / SPECIFIC FIX` blocks; no HARD VETO; or fixes applied to JSON and re-reviewed |
| 8 | Confirm Wikimedia photos exist and are PD-licensed; if any kling-i2v clip references a photo not in cache, fetch it now. | `ls public/photos/wikipedia/` (expect `donald-trump-2016.jpg`, `sheldon-adelson.jpg`); if missing, `node scripts/pipeline/fetch-wikipedia-photos.mjs --target adelson,trump`. | 10m | $0 | agent | Both files present; license is PD/CC-BY documented in a sibling `.license.txt` (create if missing) |
| 9 | Render Sarah VO for all 10 scenes with scribe verification. | `python scripts/pipeline/elevenlabs-tts.py --script eng/longform-scripts/sealed-iran-deal.md --voice $CR_ELEVENLABS_SARAH_VOICE_ID --out work/sealed-iran-deal-v2/vo.mp3 --verify` | 15m | $2.00 | agent | `vo.mp3` exists; `vo.verify.json` shows transcript match ≥0.95 against script |
| 10 | Bake music cues. | `python scripts/pipeline/bake-music.py --cues eng/storyboards/sealed-aipac-iran-deal-v2-music.yaml --out work/sealed-iran-deal-v2/music/` | 15m | $2.50 | agent | One mp3 per cue in `work/.../music/`; total duration covers 4:15 |
| 11 | Render Video 1 visual stack (parallel fal.ai jobs). | `python scripts/pipeline/produce-from-storyboard.py --storyboard eng/storyboards/sealed-aipac-iran-deal-v2.json --workdir work/sealed-iran-deal-v2/ --max-retries 1`. This dispatches `fal-stills-gen` (FLUX), `fal-kling-i2v` (Adelson + Trump), `fal-video-premium` (wan-2.5 + kling3-pro). | 60m (mostly wall on kling3-pro) | ~$7.24 | agent | All 10 clips in `work/sealed-iran-deal-v2/clips/` named `01.mp4`...`10.mp4`; durations match storyboard ±0.3s |
| 12 | Render the FLUX thumbnail. | `python scripts/pipeline/fal-stills-gen.py --prompt-file eng/storyboards/sealed-aipac-iran-deal-v2-thumbnail.md --out public/longform/sealed-aipac-iran-deal-v2.jpg --aspect 16:9` | 5m | $0.04 | agent | JPG exists; 1280×720 minimum; legible on mobile |
| 13 | Assemble long-form (ffmpeg concat + chyrons + Ken Burns + music mix + VO sidechain). Output `public/longform/sealed-aipac-iran-deal-v2.mp4`. | `python scripts/pipeline/produce-from-storyboard.py --workdir work/sealed-iran-deal-v2/ --assemble --out public/longform/sealed-aipac-iran-deal-v2.mp4` | 20m | $0 | agent | mp4 exists; duration 4:00–4:15; LUFS -16 ± 0.5 integrated; VO clearly above music (≥8 dB diff) |
| 14 | Cut Short v2 with the three required fixes from `eng/shorts-review/sealed-001-persona-pass-2026-05-20.md`. | `python scripts/pipeline/cut-shorts-v2.py --source public/longform/sealed-aipac-iran-deal-v2.mp4 --script-fixes eng/shorts-review/sealed-001-persona-pass-2026-05-20.md --target-duration 33 --out public/shorts/sealed-001-aipac-iran-deal-v2.mp4` | 20m | $0 | agent | mp4 exists; 32–34s; hook line includes "how it worked"; document focal at ~0:14 highlights "expanded federal definition of antisemitism" not "EO 13899"; outro CTA = story-completion phrasing |
| 15 | Render Short thumbnail (vertical 1080×1920). | `python scripts/pipeline/fal-stills-gen.py --prompt "$82M in 240pt civic-red over Adelson Wikimedia portrait, SEALED book bottom, vertical 9:16" --out public/shorts/sealed-001-aipac-iran-deal-v2.jpg --aspect 9:16` | 5m | $0.04 | agent | JPG exists |
| 16 | QC pass — manual playback of long-form + short; verify no broken cuts, no LUFS clipping, no synthetic-face slips. | `open public/longform/sealed-aipac-iran-deal-v2.mp4`; `open public/shorts/sealed-001-aipac-iran-deal-v2.mp4` | 15m | $0 | agent | Note any defects in `eng/longform-review/sealed-iran-deal-v2-qc.md`; if any HARD defect, loop to step 13 or 14 |
| 17 | **BINDING council review on rendered cuts** — Cincinnati Mom + political-historian + viral-hook + cinematographer. Document in `eng/longform-review/sealed-iran-deal-v2-council.md` and `eng/shorts-review/sealed-001-v2-council.md`. **If Cincinnati Mom FAILs either, that artifact does NOT upload.** Ship the passing one + ship the failure diagnosis as the final report. | Council review files | 45m | $0 | agent | Both files exist; Cincinnati Mom verdict explicit (PASS or FAIL with WOULD I CLICK/FINISH/SEND); shipping decision documented per artifact |
| 18 | Upload to YouTube (long-form first so the Short's end-screen card points to it). | `python scripts/pipeline/youtube-upload.py --video public/longform/sealed-aipac-iran-deal-v2.mp4 --thumbnail public/longform/sealed-aipac-iran-deal-v2.jpg --title "Who Paid To Kill The Iran Deal? Follow The $82M." --description-file eng/longform-scripts/sealed-iran-deal-description.md --tags "iran deal,jcpoa,sheldon adelson,aipac,trump 2016 promises,campaign finance,fec receipts,sealed 2016,political accountability" --visibility public --category 25` then repeat for Short with `--shorts` flag. | 25m (incl. YT processing wait) | $0 (YT API free) | agent | Two YouTube watch URLs returned; both videos visible on the channel page; Short flagged as Short by YT (has #Shorts in description + ≤60s + 9:16) |
| 19 | Commit + push: storyboards, council reviews, rendered assets, description files. One commit per artifact for clean git history. | `git add eng/storyboards/sealed-aipac-iran-deal-v2*.{json,md,yaml} eng/longform-review/sealed-iran-deal-v2-*.md eng/shorts-review/sealed-001-v2-council.md public/longform/sealed-aipac-iran-deal-v2.{mp4,jpg} public/shorts/sealed-001-aipac-iran-deal-v2.{mp4,jpg} eng/longform-scripts/sealed-iran-deal-description.md && git commit -m "feat(cr): ship SEALED-001 v2 long-form + short to YT — promise #73 Iran deal" && git push origin main` | 10m | $0 | agent | `git status` clean post-push; remote shows new commit on `main` |
| 20 | Final report to founder with both YouTube watch URLs, the rendered Cincinnati Mom verdicts, total spend, total wall clock, and any deferred-to-v2 items (e.g., Mexico-wall promise scheduled for next batch). | `eng/plans/2026-05-20-ship-2-promises-tonight-REPORT.md` | 10m | $0 | agent | Report file exists; contains 2 URLs (or 1 URL + diagnosis if step 17 vetoed one); spend ≤$50; wall clock recorded |

**Wall-clock total:** ~5h45m best case, ~7h45m with retries. **Within 8h window.**
**Cost total:** ~$11.78 render + ~$2 retry buffer = **~$14**. Well under $50 cap.

### Steps flagged >2h: none. Step 11 (render) is the longest at 60m and is parallelized.

### Deferral list (if budget or wall clock breaks)

- **Kill kling3-pro Scene 10 hero** if hour 6 is running hot (replaces with FLUX stamp + Ken Burns). Saves $1.02 + 10m.
- **Lead-magnet PDF** for performance-marketer flywheel — defer to next batch. Does not block tonight.
- **Second distinct promise (Mexico-wall etc.)** — defer to tomorrow's batch. Tonight is the pair on promise #73 (long-form + Short), which is two artifacts and two YouTube uploads but one topic. This is the founder's decision to make.

---

## Cincinnati Mom pre-render verdict on THIS PLAN (storyboard-level only)

**VERDICT: CONDITIONAL PASS** for plan approval; binding veto held for the rendered cuts at step 17.

- **WOULD I CLICK** (on the title "Who Paid To Kill The Iran Deal? Follow The $82M."): yes.
- **WOULD I FINISH** (predicted from storyboard, not rendered cut): probably — IF the JCPOA acronym is translated every time it appears (not just the first), and IF the on-screen graphic at 2:20 holds the dates + dollar figure long enough for me to pause and read.
- **WOULD I SEND IT** (predicted): yes — to my brother-in-law in Dayton, with the line "$82M bought three policy wins on a published wish list, in order, in 18 months." That's the sentence the storyboard earns.

**The one item I want pinned in the rendered cut at step 17:** every utterance of "JCPOA" gets the "Joint Comprehensive Plan of Action — the Iran nuclear deal" gloss. Not just the first. I forget by minute three. If the rendered cut drops the gloss after Scene 2, I will FAIL at step 17.

---

## Open founder decisions before execution

1. **One topic, two formats vs. two distinct topics?** Recommendation = one topic (promise #73), two formats (long-form + Short). Founder may override and ask for a second distinct promise; that adds +3h and breaks the 8h window.
2. **`CR_YOUTUBE_CLIENT_ID` and `CR_YOUTUBE_CLIENT_SECRET`** present in `.env`? If only the refresh token is set without client id/secret, the upload script will fail. Step 3 verifies this before any render spend.
3. **Direct-to-`main` commits vs. feature branch?** Recommendation = direct-to-`main` for a 0-subscriber channel where speed matters more than review. Founder may require a branch + self-review; adds ~10m.
