# CR new-news production pipeline — scope

**Status:** active 2026-05-21. **Copy pipeline:** `docs/CR-COPY-PIPELINE.md`
(storyline → panel → copy lock → storyboard → produce). Technical QC:
`production-qc.py` after assemble (includes **`watch-master-qc.py`** — `/watch` on `master.mp4` for readable text, portrait framing, clip/VO match).

**Lay storytelling (founder lock 2026-05-22):** Scripts must give **topic context** before receipts — audience 18–80, IQ ~100. No telegraph bullets ("The front is emotion. The back is…"). One spoken **aha/punchline**. See `personas/storyline-editor.md` § Lay audience.

## What CR new-news is

CampaignReceipts is now positioned as a political-media company. Its
YouTube output has **two distinct programming blocks** on the same
channel (@CampaignReceiptsYoutube):

1. **SEALED 145** — long-form (8-15 min) walking through the 145
   Trump 2016 promises, one episode per chapter. **Owned by the
   sealed agent.** This pipeline is NOT touched by CR new-news work.

2. **CR new-news** — shorter (3-6 min) current-events explainers
   tied to active political-money stories. **Owned by CR.** Cadence
   target: daily topic radar, with production ramping toward daily
   only after actual cost logs and QC prove the cadence is sustainable.

The two blocks share a channel + subscriber base + algorithmic
signal but distinguish themselves via playlists:
`/playlist?list=SEALED-145` and `/playlist?list=CR-new-news`.

## CR new-news episode format

A canonical CR new-news episode answers ONE of the four pillars:

| Pillar             | Episode pattern                                          |
| ------------------ | -------------------------------------------------------- |
| Donors → races     | "X lost to Y. Here's who funded each side, and here's    |
|                    | what Y's biggest donors want from him in Washington."    |
| Donors → votes     | "Senator X took $Y from industry Z, then voted W on      |
|                    | bill B. Here's the FEC filing + Congress.gov roll call." |
| Donors → bills     | "Bill HR-XXXX has Y co-sponsors funded by Z industry.    |
|                    | Here's the $-trail from PAC to sponsor to bill text."    |
| Donors → promises  | "Politician X promised Y on the campaign trail. Then     |
|                    | took $Z from industry Z. Then voted W. Here's the chain."|

Episode anatomy (rough beat plan):

1. **Hook (0:00–0:15)** — One sentence + one number on screen.
   *"Thomas Massie just lost his House primary. Outside groups spent
   $35M. Here's the FEC receipt trail."* (Fix typo: not "Charles Massey".)
2. **The receipt (0:15–1:30)** — FEC filing on screen. Specific
   donor, specific amount, specific recipient. Date-stamped.
3. **The trail (1:30–3:30)** — How the money moved + what the donor
   wants. Animated MoneyFlow (Remotion) showing PAC → sponsor →
   targeted seat → vote/bill.
4. **The clip (3:30–4:30)** — *Optional but powerful.* Fair-use
   political-commentary clip (Bernie Sanders on AIPAC infiltration,
   Liz Warren on pharma money, etc.) anchoring the receipt in
   pre-existing public discourse. Always cite source + air date.
5. **The verdict / what to watch (4:30–end)** — "If this is real,
   here's what to watch for next." Drives subscriber retention.
6. **CTA close** — No URLs spoken in VO. Say "The full receipt and
   free newsletter are linked below." Strip-PNG-style end card points
   to CampaignReceipts.com.

Target length: 3-6 minutes. Anything over 6 min should be moved to
SEALED 145 territory or split.

## What CR new-news shares with SEALED 145

Everything below is **shared infrastructure** at the monorepo or CR
folder level. No forking, no duplication:

- **`/remotion/`** (canonical animated info-design library at the
  monorepo root). Shared React components in `src/compositions/`.
  **Episode lock (2026-05-23):** each storyboard slug gets its own folder
  `remotion/src/episodes/<slug>/` — pipeline renders `{slug}__CountUp`,
  not bare `CountUp` (prevents Iran defaultProps leaking into CR videos).
  See `remotion/src/episodes/README.md`.
- **`scripts/pipeline/`** at CR folder level:
  - `fal-video-premium.py` (Sora 2 / Veo 3.1 / Kling 3 Pro)
  - `fal-kling-i2v.py` (Wikimedia photo animation)
  - `elevenlabs-tts.py` (Jessica VO — `--voice jessica`)
  - `render-remotion.mjs` (`--slug` + short `--composition` name)
  - `scaffold-remotion-episode.py` (new episode folder + manifest row)
  - `remotion-episode-qc.py` (production-qc gate 7c)
  - ~~`hedra-character3.py`~~ — **do not use** on CR new-news (founder veto)
  - `bake-music.py` (Stable Audio per-cue music)
  - `apply-sfx.mjs` (SFX layer per storyboard `sfx[]` array)
  - `youtube-upload.py` (single OAuth token, single channel)
- **`shared/sfx/`** — 11 CC0 cues sourced 2026-05-21. Same library,
  same persona constraints.
- **Jessica (Sarah)** — one ElevenLabs voice for SEALED 145 and CR
  new-news (`brand/voice-writing.md`). Voice-only by default. Hedra is
  disabled for normal CR production and allowed only with explicit founder
  approval for a clearly fictional/non-politician Betsy intro/outro test.
- **Remotion explainers** — maps, arrows, tables (`brand/visual-explainer-policy.md`)
- **Higgsfield / fal.ai cinematic plates** — Higgsfield is available
  when prepaid credits exist for polished non-character atmosphere,
  receipt macro shots, empty podiums, and generic crowd/setting plates.
  fal.ai remains the repeatable CLI fallback/patch layer. Remotion/HTML
  remains mandatory for every readable number, source, chart, CTA, and
  receipt.
- **YouTube channel + OAuth** — single channel, single token, single
  `CR_YOUTUBE_REFRESH_TOKEN` in monorepo `.env`.
- **SFX specialist persona** — same audit-document constraints
  apply.

## What CR new-news forks from SEALED 145

These are CR-specific and need their own scaffolding:

1. **Storyboard template** — SEALED 145 storyboards (under
   `eng/storyboards/`) follow a chapter-walk structure (promise →
   evidence → verdict). CR new-news needs a separate template
   following the 5-beat plan above (hook → receipt → trail → clip →
   verdict). New file: `eng/storyboards/_template-cr-new-news.json`
   when first episode lands.

2. **Content writer persona** — SEALED 145 content writer pulls
   from the locked SEALED book and 145 graded promises. CR new-news
   content writer pulls from current FEC filings, breaking-news
   feeds, and the cr_races / cr_bills / cr_donor_vote_alignment
   tables. New persona file: `personas/cr-new-news-writer.md` —
   spec'd but not written until first episode.

3. **Fair-use political-commentary clip handling** — SEALED 145 is
   self-contained (the only clips are Trump's own promises read
   aloud, no third-party commentary). CR new-news episodes will
   embed short clips from Bernie / Warren / etc. public statements.
   This needs:
   - **Clip-rights checklist** — fair-use only (commentary,
     criticism, news reporting); ≤30s per clip; cited source + air
     date; never the most-viral 5 sec from a paywalled show.
   - **`fair-use-clips/` directory** under each episode build with
     source URLs + air-date + fair-use rationale in a JSON sidecar.
   - **YouTube content-ID risk:** politicians' own clips on C-SPAN
     / committee feeds are typically clean. Commentary from
     network shows (MSNBC, Fox, CNN) is highest-risk — those almost
     always trigger content-ID. Prefer C-SPAN, podcasts (creator
     usually allows fair-use snippets), and the politician's own
     uploads.

4. **Episode metadata template** — title format already locked to
   "$X to Y senators → the Y vote that followed" pattern. Tags +
   description template TBD when first episode lands.

5. **Story-sourcing pipeline** — CR new-news needs a daily editorial
   inbox: which stories qualify as an episode? Step 0 in
   `eng/PIPELINE-STEPS-AND-OWNERS.md` is the daily topic radar run by
   `personas/viral-topic-researcher.md`. YouTube Studio Inspiration
   cards are allowed as packaging signals, but never as evidence. The
   `cr_homepage_pulse` table + the weekly Friday Receipts newsletter
   already track candidate stories — that's a good seed. No new
   database needed.

6. **Cadence + scheduling** — SEALED 145 is paced by chapter (one
   episode per Sealed chapter, ~145 episodes total over months).
   CR new-news is paced by the news cycle. The machine should produce
   daily candidates first; daily finished videos require verified cost
   and QC telemetry. Do not repeat a "<$10 per video" claim unless the
   actual production cost log proves it.

## What to build first (when greenlit)

In order, smallest to largest:

1. **`eng/storyboards/_template-cr-new-news.json`** (~30 min) —
   the 5-beat scaffold. Just an empty-shell JSON with placeholder
   clips for hook / receipt / trail / clip / verdict.
2. **`personas/cr-new-news-writer.md`** (~1 hr) — the content
   writer persona, including: source priority (FEC > Congress.gov >
   primary statements > commentary clips), beat-plan adherence,
   nonpartisan framing (treats AIPAC influence on D senators with
   the same skepticism as oil money on R senators).
3. **`docs/CR-NEW-NEWS-FAIR-USE.md`** — clip-rights checklist + content-ID matrix ✅
4. **`docs/CR-VIRAL-PANEL-RUNBOOK.md`** — YouTube CTR/metadata panel ✅
5. **`personas/viral-panel/`** — five reviewers ✅
6. **First episode storyboard** (~3-4 hrs) — pick a current story
   (Massey loss or another live one), write the storyboard end-to-end,
   run through `produce-from-storyboard.py`, council review, upload.
7. **YouTube playlist setup** (~10 min, founder) — create
   "SEALED 145" and "CR new-news" playlists in Studio. Upload
   script auto-adds to playlist via `--playlist=<id>` flag (already
   supported in `youtube-upload.py`).

## What NOT to do

- **Do not duplicate the SEALED storyboard template** for CR new-news.
  Forking creates drift. Use a separate template that points at the
  same shared scripts.
- **Do not introduce a second narrator voice.** Jessica reads both
  blocks. Different VO would split the brand.
- **Do not build a second YouTube channel.** Single channel,
  playlists. Decided 2026-05-21.
- **Do not embed paywalled-show clips** until the clip-rights
  checklist (item 3 above) is locked.
- **Do not have CR new-news touch SEALED's `_build/` directories.**
  Each episode gets its own `_build/<slug>/`.
- **Do not build new paywall or paid-tier UI before 10,000 YouTube
  subscribers** unless the founder explicitly overrides. Current
  conversion goal is free email capture into `cr_free_subscribers`.
- **Do not publish a video without the link habit:** CampaignReceipts.com,
  the episode companion article or dossier, free newsletter signup, and
  sealed2016.com when the episode uses SEALED / Trump-audit context.
- **Do not stop after the companion page.** Once the blog/article or
  landing page is live, create one YouTube Community post in Studio with
  a viral headline, the page link, and free newsletter CTA. YouTube Data
  API has no `communityPosts` write resource, so this stays a Studio/manual
  step until a supported API exists. No Facebook or other syndication until
  founder opens that channel.

## Open questions for founder when first episode is ready

- Specific story for episode 1? (Massey is one candidate; founder
  may have a hotter live story.)
- Release-day cadence — Tuesday + Friday? Wednesday only? Founder
  call.
- Length target — 3-4 min (TikTok-clippable) or 5-6 min (YouTube-
  algorithm-friendly)? Default to 4 min.
- Editorial inbox owner — founder for v1, future editorial hire later.

---

## Post-assemble QC (`/watch`)

After `master.mp4` exists:

```bash
python3 scripts/pipeline/watch-master-qc.py --build _build/<slug>
```

Agent **Read** frames listed in `_build/<slug>/watch-qc/watch-report.txt` — confirm portraits are head-and-shoulders (not nose-only crop), on-screen text is legible, news clips match the VO beat. Gate 9 runs automatically inside `production-qc.py`.

**Portrait stills:** storyboard `framing: "contain"` on `politician-caricature` clips (default in `produce-from-storyboard.py`).

---

**Updated:** 2026-05-27. **Owner:** founder + CR agent.
**Related docs:**
- `personas/betsy-the-narrator.md` (channel narrator, shared)
- `personas/sfx-specialist.md` (SFX rules, shared)
- `scripts/pipeline/README.md` (shared infra)
- `personas/video-producer.md` (pipeline orchestration, shared)
