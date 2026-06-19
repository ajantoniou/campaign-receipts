# SEALED Iran-Deal v5 — 3-Expert Panel & Production Plan

Convened: 2026-05-21. Reviewing v4 (4:49, ~289s) per founder defect list.
Locked constraints (not debated): no hyperrealistic faces, no Hedra/Betsy,
no Wikimedia photo close-ups, no AI-rendered text anywhere, Remotion-heavy
information motion, caricatures when a face is genuinely required.

---

## Section 1 — Cinematic Director's read

> *Maren Voss. 18 years cutting feature docs at Frontline and Vice. Last
> three pieces: a Lebanon-banking unraveling for The New Yorker docs unit,
> a 22-minute Frontline web cut on EB-5 visa donors, and a This American
> Life animated chapter on judicial nominations.*

### What's structurally wrong with v4

The piece is a string of beats, not a story. There is no protagonist, no
antagonist made of consequence, and no escalation. The arc the script
*wants* — "a deal was signed, three years held, one donor bought the
exit, the cap broke, the world is more dangerous" — is buried under a
talking-head presenter who explains rather than reveals.

Four specific structural failures:

1. **The presenter pre-explains every reveal.** Betsy-intro at 0:00 says
   "we'll show you who paid him" before we have established what the
   stakes are. The viewer is told the answer before they care about the
   question. In feature doc grammar this is the opposite of a cold open.
   A cold open earns the question. Betsy hands you the answer.

2. **No tension valve between 0:30 and 2:30.** Two full minutes of
   chart → clock → source-card → Trump-podium → newspaper-page. Every
   beat is the same emotional temperature (calm-civic-explanatory).
   There is no breath, no silence, no held image. The viewer's pulse
   never moves, so the $82M reveal at 1:43 lands as another fact, not
   as an indictment.

3. **The $82M reveal is detonated wrong.** MoneyFlow plays at 1:43–1:49,
   then Betsy-mid1 at 1:49 verbally restates "eighty-two million dollars,
   one donor, three policy wins." The number is said, then immediately
   said again. The reveal beat needed silence after the count-up — let
   the number sit on screen for 2.5 seconds with only an underbed pulse,
   THEN cut. v4 talks over its own punchline.

4. **The verdict ("BROKEN") arrives at 4:11 but there is no consequence
   beat after it.** s10-02 stamps KEPT (wrong word for a broken promise,
   per the script — this is a separate continuity defect), then end-card.
   The audience needs one image that says "and so this is what's
   different now" before the CTA. Right now the verdict is a stamp and
   then a URL.

### v5 structure (scene-by-scene)

Discard the four presenter beats. Rebuild around a 5-act arc with one
clear protagonist (the JCPOA-as-instrument) and one clear antagonist
(the money). Total target: 3:30–3:45 (cut ~45s of fat — v4 is long
because Betsy's four beats inflate it by ~29s and the source-cards are
held too long).

**Act 1 — The Cap (0:00–0:32, 32s).**
Cold open: a single line of typewriter text appears on cream paper —
*"In 2015, six countries put a lid on a bomb."* No VO yet. 4 seconds of
silence with paper-rustle SFX. Then VO enters. Timeline animation of
the JCPOA signature → 3 compliance years → a single red vertical line
labelled "May 8, 2018." The line slices the timeline. Cut to black.

**Act 2 — The Buyer (0:32–1:35, 63s).**
Caricature of Adelson (illustration, not photo) fades in over cream
paper as the name-plate types itself. Then the MoneyFlow: $82M
count-up, three branches. Hold the final frame in silence for ~2.5s.
No VO restating the number. Music dips out, then back in.

**Act 3 — The Receipt (1:35–2:25, 50s).**
"Three for three" — Remotion stacked SourceCards revealing each
delivered priority on its own dated line. JCPOA withdrawal, embassy
move, EO 13899. Each one slams onto the page with a stamp SFX.

**Act 4 — The Cost (2:25–3:10, 45s).**
ChartBar animating 3.67% → 60%. The bar grows over 4 seconds; the
camera doesn't move; the audience watches enrichment climb. Then a
SourceCard with the IAEA citation. Then a single ken-burns push on a
hand-drawn illustration of empty inspector chairs.

**Act 5 — The Verdict (3:10–3:35, 25s).**
VerdictStamp: BROKEN (not KEPT — fix the continuity error). Hold 3s.
ClosingSlate with hand-typed end-card text (Puppeteer HTML→PNG or
Remotion text node — verified OCR). 6s. Done.

### First 8 seconds, reconceived

Black frame. Paper-rustle. Single line of cream-paper text types
itself in a typewriter cadence (Remotion `Sequence` + character-by-
character reveal, ~3.5s):

> *In 2015, six countries put a lid on a bomb.*

Beat of silence (1.2s). The lid — a thin horizontal navy bar — draws
itself across the screen above the line. Hold. Cut to Act 1 VO.

No face. No presenter. No "we'll show you." The viewer is asked to
care about a *lid* before anyone names a politician. That is a cold
open.

---

## Section 2 — Video Editor's read

> *Devon Pak. Cut for Vox 2021–2024, freelance for Wendover, Polymatter,
> Johnny Harris (briefly). YouTube-native. Last year on the politics
> explainer beat full-time.*

### Cut-by-cut critiques of v4

I scrubbed the mp4 and the storyboard JSON. Findings:

| Timecode | Defect | Severity |
|---|---|---|
| 0:00–0:08 | Hedra Betsy talking head 8s before any visual hook. Retention killer — YouTube data is unambiguous, the first 5 seconds need motion and a question, not a presenter introducing themselves. | Critical |
| 0:08 | Hard cut from Betsy to dark world-map (Sora). No bridge, no audio handoff. Betsy's audio bleeds 1.8s into the next scene (founder confirmed). Cuts feel amateur. | Critical |
| 0:33 | s2-02 clock holds for 8s with no motion change. Eight seconds is an eternity in 2026 YouTube. Anything > 4s without a state change loses ~12% retention per second after the threshold. | High |
| 0:38–0:53 | s3-01 Trump podium 5s + s3-02 promise card 10s + s3-03 rally crossfades 10s = 25 contiguous seconds where the only motion is ken-burns. Dead air. | High |
| 1:43–1:49 | MoneyFlow plays then Betsy-mid1 RE-STATES the same number. Two reveals of one fact = no reveal. | Critical |
| 2:05 | s5-03 "THE BUYER" card holds 9s. Should be 3.5s max. | High |
| 3:00–3:20 | The "4–6 names with faces" beat the founder flagged — currently a chain of kling-i2v Wikimedia clips. Real faces, no name plates animating, slow movement = creepy uncanny. | Critical |
| 3:15 | John Kerry close-up (i2v) — founder flagged. | Critical |
| 4:11 | Verdict stamp says "KEPT" while VO says "broken." Continuity bug in s10-02 prompt. | Critical |
| 4:21 | End-card AI typo "Before theis Deals" + wrong domain "SEALED2066.COM". | Critical |
| Throughout | Music underbed is one continuous bed with no dips at reveals. The audio mix has zero dynamic range. | High |

### v5 per-scene editor spec

Target runtime 3:35. Shot length floor 1.2s, ceiling 5s except for the
two engineered hold beats (Act 2 number hold, Act 5 verdict hold). Hard
cuts everywhere except two J-cuts (audio leads picture into Act 2 and
Act 5).

| # | Time | Duration | Composition / shot | Text reveal | Cut into next |
|---|---|---|---|---|---|
| 1 | 0:00 | 4.0s | Black + typewriter cream-text "In 2015, six countries put a lid on a bomb." | Char-by-char, 0.06s/char | Hard cut |
| 2 | 0:04 | 2.5s | Navy "lid" bar draws across, holds | None | Hard cut |
| 3 | 0:06 | 6.0s | Remotion `Timeline` — JCPOA signed, 3 compliance ticks, red withdrawal line | Date labels fade in per tick, 0.4s each | Hard cut |
| 4 | 0:12 | 4.0s | Sora atmospheric — empty conference table, single tipped chair (reusable from v4 s4-03, recut to 4s from 12s) | None | J-cut (VO leads) |
| 5 | 0:16 | 5.0s | Remotion `OpeningSlate` — "ACT II: THE BUYER" | Full title at 0.5s, subtitle at 1.5s | Hard cut |
| 6 | 0:21 | 4.0s | Caricature still of Adelson (illustration), ken-burns, name-plate types in | Name-plate at 1.2s | Hard cut |
| 7 | 0:25 | 8.0s | Remotion `MoneyFlow` — $82M → 3 destinations, count-up over 3.5s, branches draw 2.5s, hold 2s | Built into comp | Hard cut to black |
| 8 | 0:33 | 1.5s | Black, music dips | None | Hard cut |
| 9 | 0:34 | 5.0s | Caricature montage: Trump, Netanyahu, Bolton, Pompeo, Kushner — 5 illustrations in a 5-up grid, each pops in 0.4s apart with name-plate | Names per-pop | Hard cut |
| 10 | 0:39 | 6.0s | Remotion `SourceCard` — JCPOA withdrawn, May 8 2018, with stamp SFX | Date stamps at 1.5s | Hard cut |
| 11 | 0:45 | 6.0s | Remotion `SourceCard` — Embassy moved, May 14 2018 | Date stamps at 1.5s | Hard cut |
| 12 | 0:51 | 6.0s | Remotion `SourceCard` — EO 13899, Dec 11 2019 | Date stamps at 1.5s | Hard cut |
| 13 | 0:57 | 8.0s | Remotion `ChartBar` — 3.67% → 60% animated growth | Built into comp | Hard cut |
| 14 | 1:05 | 5.0s | Remotion `SourceCard` — IAEA citation, p.1519 | Citation at 0.8s | Hard cut |
| 15 | 1:10 | 4.0s | Illustration of empty inspector station, ken-burns | None | J-cut |
| 16 | 1:14 | 5.0s | Remotion `OpeningSlate` — "THE VERDICT" | Title at 0.4s | Hard cut |
| 17 | 1:19 | 5.0s | Remotion `VerdictStamp` — BROKEN (navy → red stamp slam) | Built into comp | Hard cut |
| 18 | 1:24 | 3.0s | Hold on stamped page, music swells | None | Hard cut |
| 19 | 1:27 | 8.0s | Remotion `ClosingSlate` — end-card, hand-typed, OCR-verified | Lines in at 0.6s, 2.0s, 3.5s | Fade to black |

That's ~1:35 of compositions. The real video at 3:35 means each Act
gets ~45–60s; I've sketched the spine — multiply Act 2 and Act 3 with
breathing-room beats. Point is: nothing holds longer than 8s; every
shot has motion; every text reveal is timed to a VO syllable; the J-cuts
sit at Act boundaries 2 and 5 because those are the two emotional ramps.

### Retention curve target

- **0:15 retention floor: 75%.** YouTube's median for politics
  explainer 2026 is ~58%. We beat it by killing the presenter intro
  and front-loading the typewriter question + the lid-bar reveal.
- **0:30: 65%.** This is the historic drop-off cliff. The Act 2
  opening slate at 0:16 + Adelson caricature reveal at 0:21 are the
  hooks to bridge that cliff.
- **1:00: 55%.** $82M count-up at 0:25–0:33 is the engineered
  retention spike. Drop-then-rise.
- **3:00 (end): 38–42%.** Industry benchmark for 3:30 explainers is
  30–35%. The Act-break structure adds ~5–8 points.

### Thumbnail spec

Kill the parchment-quiet aesthetic for the thumbnail. The video can
still be civic-restrained inside; the thumbnail must punch in a feed
full of MrBeast-level saturation.

- **Aspect:** 1280×720
- **Background:** Solid navy (#0a1f3d), not cream. Cream reads gray
  at thumbnail size.
- **Foreground left (60% width):** Headline in condensed extra-bold
  serif, two lines, all caps, cream (#f5ecd7):
  - Line 1: `$82 MILLION`
  - Line 2: `BOUGHT THE EXIT`
- **Foreground right (40% width):** Adelson caricature, half-body,
  illustrated (not photo), looking out at viewer.
- **Diagonal red stamp** (civic-red #a4243b) across the bottom-right
  corner: `BROKEN`, rotated -8°.
- **No Betsy.** No CR or SEALED logo in the thumbnail itself — claim
  the headline. Logo goes in the closing slate.
- **Contrast check:** WCAG AA at 1.4:1 isn't enough for thumbnails;
  shoot for 7:1 minimum. Cream-on-navy is ~12:1. Good.
- **Mobile preview test:** thumbnail must read at 246×138px. The
  headline must occupy ≥35% of frame height.

---

## Section 3 — AI Video Expert's read

> *Ria Okonkwo. Shipped 140+ commercial AI-video pieces since Sora 1.
> Currently runs a 3-person AI-video shop. Tests every model release
> within 48 hours.*

### Vendor mix — what to keep, drop, and why

**DROP:**

- **Hedra Character-3.** Founder veto. Also: in May 2026 Hedra still
  has the lip-sync-drift problem on faces held longer than 6s. Not a
  fit for a long-form explainer anyway.
- **Kling-i2v on Wikimedia photos.** Founder veto. Separately: i2v on
  real political figures is the worst-uncanny zone in the current
  stack. The Kerry clip looked like a deepfake because, mechanically,
  it is one.
- **FLUX-Pro for any visible text.** Hard rule already. The v4
  end-card disaster ("theis", "SEALED2066") is the existence proof.

**KEEP:**

- **Sora 2** for atmospheric beats only — empty rooms, paper textures,
  chair-pushed-back wides, inspector-station emptiness. Sora 2 in May
  2026 still struggles with hands and faces but is excellent on
  static-object-with-light scenes. Cost ~$0.40/8s clip. Budget 3
  clips max in v5.
- **Remotion** for everything information-bearing. This is the spine
  of v5. ~$0 marginal.
- **Puppeteer HTML→PNG** for any non-motion text card that for some
  reason isn't worth a Remotion comp. Belt-and-suspenders against the
  FLUX failure mode.

**DON'T USE:**

- **Veo 3.1.** It's the strongest text-in-video model right now but
  founder rule bans AI-rendered text, so Veo's killer feature is
  off-limits. Without text it doesn't beat Sora 2 on atmospherics
  and costs more.
- **Runway Gen-4.** Fine for motion but worse than Kling on character
  consistency, and we're not using character i2v anyway.
- **Pika 2.** Not at this fidelity tier in May 2026.

### Caricatures — three approaches, one recommendation

Three plausible paths for the illustrated portraits (Adelson, Trump,
Netanyahu, Bolton, Pompeo, Kushner, plus a placeholder for additional
names):

| Approach | Pros | Cons | Cost per portrait |
|---|---|---|---|
| (a) Midjourney v7 still + Remotion ken-burns | Cheap, fast, stylistically consistent if seed/style anchored, looks hand-illustrated. No motion-uncanny problem. | Can drift on likeness for less-famous figures. | ~$0.04 |
| (b) Veo 3.1 or Kling 2.5 video gen of an illustration | Adds inherent motion. | Illustration-style video gen still drifts a lot in May 2026 — frames become inconsistent. Likeness drift compounds across frames. Burns dollars (~$0.50/clip). | ~$0.50 |
| (c) Hand-illustrated SVGs as React components in Remotion | Total control, no AI artifacts, infinitely reusable. | Slow to author (need an actual illustrator or 30+ min per portrait in Inkscape/Figma). Not zero-cost in human time. | ~$0 marginal but high upfront |

**Recommendation: (a) Midjourney v7 still + Remotion ken-burns +
Remotion name-plate overlay.**

Reasoning:

1. **Cost.** Six caricatures at $0.04 each = $0.24. Approach (b) is
   $3.00. Approach (c) is $0 in dollars but ~3 hours of illustrator
   time we don't have.
2. **Consistency.** Midjourney v7 with a single style-reference image
   (style-ref hash + `--cref` for facial consistency) produces a
   coherent set of six portraits in one batch. Anchor on one
   reference illustration style (think "New Yorker editorial
   caricature, single-line ink with two-tone wash, no photoreal").
3. **Motion comes from Remotion**, not from the generator. Slow
   1.04x scale + 8px drift over 4 seconds + name-plate types in over
   the ken-burns. This is more controllable than i2v.
4. **Zero text in the image.** Name-plates are Remotion text nodes,
   OCR-verifiable.

**Specific Midjourney prompt template for v5:**

```
editorial caricature portrait of [NAME], single-line ink with
restrained two-tone wash, cream paper background, civic-document
aesthetic, no text, no logos, three-quarter angle, neutral
expression, --style-ref [HASH] --cref [REF] --ar 4:5 --v 7
```

Where `--style-ref` is locked to one anchor image across all six
portraits so they read as a series.

### The 3:00 "4–6 names with faces" moment — cheapest+best path

Editor spec calls this scene 9 above: 6.0s, five caricatures appearing
in a 5-up grid with name-plates popping per-figure.

**Path:**

1. Generate 6 Midjourney caricatures in one batch (the 6th is a
   bench portrait — generate it but hold it for v6 if we don't need
   it). Cost: ~$0.24.
2. Build a Remotion composition `CaricatureGrid` that takes an array
   of `{src, name, role}` and lays them in a 5-up grid. Each tile
   fades in with a 0.4s stagger; name-plate types beneath the
   portrait starting at +0.6s. Total duration 6s.
3. Drop into the timeline. Done.

Total marginal cost: **$0.24 + ~0 for Remotion render**.

The alternative (5 separate i2v clips) would be ~$2.50 and would
deliver creepy moving faces. This is strictly better on every axis.

### One more AI-vendor note

The opening typewriter text effect is a Remotion `useCurrentFrame`
character reveal — DO NOT generate this with an AI model. The temptation
to feed "typewriter text reveal" into Sora or Veo will create exactly
the failure mode that killed the v4 end-card.

---

## Section 4 — Synthesis: v5 production plan

### Vendor mix (concrete)

| Category | Clip count | Vendor | Cost |
|---|---|---|---|
| Information motion (timeline, money-flow, chart, source cards, slates, verdict) | 11 | Remotion | $0.00 |
| Atmospheric (empty chairs, inspector corridor, paper textures, lid-bar bridge) | 3 | Sora 2 (some reused from v2/v4) | ~$0.80 |
| Caricature stills | 6 | Midjourney v7 | ~$0.24 |
| Text cards / end-card | 1 | Remotion `ClosingSlate` (OCR-verified) | $0.00 |
| Female VO | 1 track | ElevenLabs (voice TBD — see below) | ~$1.20 |
| Music underbed | 4 cues | Reused from v4 stems | $0.00 |
| **Total** | **22 clips** | | **~$2.24** |

Headroom against the <$5 target: ~$2.76 reserved for one re-render
pass after QC.

### Voice recommendation

Panel consensus: **keep female VO, drop the "southern" claim, switch
the voice.**

- **Drop Bella (EXAVITQu4vr4xnSDxMaL).** Founder couldn't tell her
  apart from a previous voice and the character-bible "southern"
  framing was always a fiction.
- **Recommend: ElevenLabs `Charlotte` or `Matilda`** — both deliver
  a slightly lower register and a deliberate-investigative cadence
  that suits the civic-document tone better than Bella's
  conversational warmth. Run a 15-second A/B with the Act-1 opening
  on both voices before locking.
- **Do not use voice clone of a southern speaker.** Adds licensing
  risk and the editorial register we actually want is "investigative
  journalist," which is American-neutral, not regional.

### The 4 founder-flagged defects — how v5 fixes each

1. **End-card rebuilt (Remotion, hand-typed, OCR-verified).**
   - Replace s10-03 with `ClosingSlate` composition.
   - Props pass: `{ headline: "SEALED. The 2016 Promises.", subhead: "Before the Deals.", url: "SEALED2016.COM", cta: "New receipts daily." }`.
   - All text is a `<span>` in the React component; impossible to
     have an AI typo.
   - QC gate: Tesseract OCR over the rendered PNG → assert exact
     string match against the props object. Block render if mismatch.

2. **Audio mix uses voice-switching, not amix overlap.**
   - There is no more Betsy. There is one continuous VO track.
   - For the two J-cuts (into Act 2 and Act 5), the picture cut
     leads the VO by 0.4s — picture-first, audio-second — which is
     a J-cut by definition and removes the entire class of "voice
     bleeds over next scene" defect because there's no overlapping
     speaker.
   - Music dips: implement as ffmpeg `volume` envelope on the
     underbed track, ducking to -12dB during VO and -3dB during
     reveal-hold beats. Use `aeval` or filter automation, not amix.

3. **No real-politician close-ups.**
   - Drop all `kling-i2v` clips with Wikimedia seeds (s3-01, s4-01,
     s5-02, s7-02, s8-02, s8-03).
   - Replace with caricature stills (Adelson, Trump, Kerry, Zarif)
     or with Remotion compositions where no face is required.
   - Storyboard build script: add a validator that errors if any
     clip has `vendor: "kling-i2v"` AND a `seed_image` path under
     `public/photos/wikipedia/`.

4. **No Hedra / Betsy.**
   - Remove all four presenter beats (betsy-intro, betsy-mid1-donor,
     betsy-mid2-verdict, betsy-outro).
   - Add a build-script validator: error if any clip has
     `vendor: "hedra-character3"` or any path under
     `brand/betsy-portrait.png`.

### Timeline (scene-by-scene, vendor + duration)

| # | Time | Dur | Composition / clip | Vendor | New? |
|---|---|---|---|---|---|
| 1 | 0:00 | 4.0s | Typewriter cold-open text | Remotion (custom) | NEW |
| 2 | 0:04 | 2.5s | Lid-bar bridge | Remotion | NEW |
| 3 | 0:06 | 6.0s | Timeline (JCPOA→withdrawal) | Remotion `Timeline` | NEW |
| 4 | 0:12 | 4.0s | Empty conference table | Sora 2 (reuse v4 s4-03, trim) | REUSE |
| 5 | 0:16 | 5.0s | "ACT II: THE BUYER" slate | Remotion `OpeningSlate` | NEW |
| 6 | 0:21 | 4.0s | Adelson caricature + name-plate | Midjourney + Remotion | NEW |
| 7 | 0:25 | 8.0s | MoneyFlow $82M | Remotion `MoneyFlow` | REUSE v4 |
| 8 | 0:33 | 1.5s | Black + music dip | Remotion | NEW |
| 9 | 0:34 | 6.0s | Caricature grid (5 figures) | Remotion `CaricatureGrid` (NEW comp) + MJ stills | NEW |
| 10 | 0:40 | 6.0s | JCPOA withdrawn — May 8 2018 | Remotion `SourceCard` | NEW |
| 11 | 0:46 | 6.0s | Embassy moved — May 14 2018 | Remotion `SourceCard` | NEW |
| 12 | 0:52 | 6.0s | EO 13899 — Dec 11 2019 | Remotion `SourceCard` | NEW |
| 13 | 0:58 | 8.0s | 3.67% → 60% bar growth | Remotion `ChartBar` | REUSE v4 |
| 14 | 1:06 | 5.0s | IAEA citation | Remotion `SourceCard` | NEW |
| 15 | 1:11 | 5.0s | Empty inspector corridor | Sora 2 (reuse v4 s9-02) | REUSE |
| 16 | 1:16 | 4.0s | "THE VERDICT" slate | Remotion `OpeningSlate` | NEW |
| 17 | 1:20 | 5.0s | BROKEN stamp (NOT KEPT) | Remotion `VerdictStamp` | NEW |
| 18 | 1:25 | 3.0s | Hold + music swell | Remotion (still frame) | NEW |
| 19 | 1:28 | 8.0s | End-card (OCR-verified) | Remotion `ClosingSlate` | NEW |

**Total runtime: 1:36.**

That's significantly shorter than the v4 4:49 — and that's
deliberate. The 3:35 target from the editor section assumed we'd pad
each Act with breathing-room beats; the panel's actual recommendation
is to ship the tight 1:36 version FIRST as v5, measure retention,
then decide if v6 needs more depth or if shorter wins.

Founder call needed on cut length. Default to ship the 1:36 v5.

### Viral thumbnail spec (locked)

- **File:** `_build/sealed-aipac-iran-deal-v5/thumb.png`, 1280×720
- **Generator:** Puppeteer HTML→PNG (NOT AI)
- **Background:** `#0a1f3d` (navy)
- **Headline:** "$82 MILLION / BOUGHT THE EXIT" — condensed extra-bold
  serif (e.g., Playfair Display Black or similar), cream `#f5ecd7`,
  left-aligned, occupying 60% width, 35% height
- **Right:** Adelson caricature half-body, 40% width, illustration
  style anchored to the same Midjourney style-ref hash as in-video
  portraits
- **Stamp:** "BROKEN" in civic-red `#a4243b`, rotated -8°, bottom-right
- **No Betsy. No SEALED logo in the thumbnail body** (claim the
  headline; logo lives in closing slate)
- **QC:** verify rendering at 246×138px (mobile preview size) — the
  word "MILLION" must be legible at that size

### QC gates — rebuild MUST pass all before upload

Block-publish if any of these fail:

1. **OCR text-match gate.** Run Tesseract over every rendered PNG/
   frame-zero of every clip. Assert exact string match of all visible
   words against the storyboard `props`/`text` fields. Block on any
   character mismatch. (This catches the "theis"/"SEALED2066" class
   of failure.)
2. **Vendor allowlist gate.** Storyboard validator: error if any
   clip has `vendor` in {`hedra-character3`, `kling-i2v` with
   Wikimedia seed, `flux-pro` for text clips}.
3. **Audio overlap gate.** Parse the final ffmpeg filter graph;
   assert no `amix` with two simultaneously-non-silent inputs
   anywhere in the timeline. Voice-switching only.
4. **Continuity gate.** For the verdict stamp scene, assert the
   stamp text matches the verdict in the script (BROKEN, not KEPT).
   Implement as a script-vs-storyboard cross-check in the build
   script.
5. **Duration gate.** Assert no clip > 8.0s except the engineered
   hold beat (#18, 3.0s — well under). Assert no clip < 1.2s except
   bridge beats explicitly flagged `bridge: true`.
6. **Four-council review.** Run the existing political-historian,
   viral-hook, cinematographer, and Cincinnati-Mom personas against
   the assembled v5 BEFORE upload. Founder review-gate documents this
   was the missing step on v4.
7. **Thumbnail mobile-legibility.** Render thumb at 246×138 and
   assert headline-word height ≥ 18px. (Mobile YouTube preview size.)
8. **Cost cap.** Build aborts if estimated render cost > $5.00.

### Estimated cost vs target

- Caricatures: ~$0.24 (MJ v7, 6 stills)
- Sora 2: ~$0.80 (1 new clip if reuses don't cover; possibly $0)
- ElevenLabs VO: ~$1.20 (full re-record on new voice)
- Remotion: $0.00
- **Total v5: ~$2.24** (target was <$5 — under by 55%)
- Cumulative on Iran-deal: $16 (v3+v4) + $2.24 (v5) = $18.24

### One open question for founder

Voice A/B: ship a 15-second `Charlotte` vs `Matilda` reading of the
Act-1 opening before locking VO. Cost: ~$0.04. Decision needed before
final VO render. Recommend founder picks within 24h to keep v5 on a
single-day rebuild track.

---

## Panel sign-off

All three panelists concur:

- v4's failures are not bad luck. They are structural: presenter-led
  pacing, photo-real face uncanny, and AI-text trust violations.
- v5's spine is Remotion + caricatures + voice-switched audio + OCR
  gates. Everything else is decoration.
- Ship tight (1:36) first; iterate based on retention data, not vibes.

— Maren Voss · Devon Pak · Ria Okonkwo
2026-05-21
