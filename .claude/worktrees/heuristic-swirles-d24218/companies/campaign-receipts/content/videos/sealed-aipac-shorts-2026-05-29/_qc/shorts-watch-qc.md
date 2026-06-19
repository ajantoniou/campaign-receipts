# SEALED/AIPAC Shorts — /watch QC pass (2026-05-29)

QC engineer (Campaign Receipts). Pre-publish gate on three carved 9:16 Shorts.

**Method note — audio is checked STRUCTURALLY, not by listening.** No audio
playback available to the agent. Continuity verified via `ffprobe` +
`silencedetect` (noise=-50dB) + per-window `volumedetect` RMS, and VO/beat
match confirmed against `shorts-cuts-v2.json` → `vo_text_lifted`. Visuals
checked by reading extracted frames (head/tail/body) with `ffmpeg -frames:v 1`.

Files inspected (all 1080×1920 h264 + aac stereo 48k):
- `embassy-e2-four-presidents.mp4` — 33.12 s
- `campus-c1-two-ledgers.mp4` — 40.16 s
- `campus-c2-would-you-count-it.mp4` — 40.12 s

---

## A cross-cutting FAIL on all three: dead-air under intro/outro

The carve plan `notes[]` is explicit: *"Music must carry UNDER both silent
cards — extend the master's music bed under the intro/outro, do not let audio
drop to silence."*

Measured RMS (`volumedetect`):

| Short | head 0–2.0 s (intro) | tail last 3.0 s (outro) | body 15–17 s |
|---|---|---|---|
| embassy-e2 | **-91.0 dB (digital silence)** | **-91.0 dB** | -21.3 dB |
| campus-c1 | **-91.0 dB** | **-91.0 dB** | -21.5 dB |
| campus-c2 | **-91.0 dB** | **-91.0 dB** | -20.3 dB |

-91.0 dB = the AAC silence floor, i.e. true dead air, not a low music bed.
`silencedetect` confirms `silence_start: 0` (~2.1–2.3 s) at every head and a
3–4.5 s silence at every tail. The music bed was NOT extended under the cards.
This is criterion 4 FAIL on all three.

---

## Short 1 — embassy-e2-four-presidents (33.1 s)

Beat: "Four presidents signed it. One stopped." (KEPT promise #74). Center-crop.

| # | Criterion | Verdict | Notes |
|---|---|---|---|
| 1 | Intro/outro present + on-brand | SHIP-OK | Intro: THE RECORD → Campaign Receipts → "Receipts, not vibes." Outro: SUBSCRIBE + bell + `@campaignreceipts` (correct handle). |
| 2 | No clipped/sliced text | **FAIL** | Center-crop slices wide Remotion timeline + receipt cards on BOTH edges. @5s/9s: "SIGNED THE WAIVER"→"D THE WAIVER"; "Signed the six-month w…"; "…d the six-month waiver"; CLINTON/BUSH labels half-cut. @24s: "DEC 6, 201[8]" year cut. @27s: "[PR]OCLAMATION 9683 · SIGNED DEC 6, [2017]" and "[United Sta]tes recognizes Jerusalem as the [capital]" both edges cut. |
| 3 | Reframe integrity | **FAIL** | Same root cause: these are full-width cards, not centered big-words. Trump portrait @20s frames cleanly (centered subject) — that beat is fine. |
| 4 | Audio continuity | **FAIL** | Dead air (-91 dB) under intro AND outro. Body VO intact, lands on clean boundary at the "one stopped / somebody signed" turn (matches `vo_text_lifted`). No mid-word clip at body cut points. |
| 5 | Factual/visual match | SHIP-OK | Embassy = KEPT framing correct. Clinton/Bush/Obama cross-party cadence is nonpartisan. Real-politician photos are the live praised master's own approved b-roll. |
| 6 | Duration sane | SHIP-OK | 33.1 s, in the 25–45 s sweet spot. |

**Verdict: FIX.** Re-render with the wide timeline/receipt-card beats on
`scale_fit` (letterbox), not center_crop — same per-segment treatment C1 got.
And extend the music bed under intro + outro.

---

## Short 2 — campus-c1-two-ledgers (40.2 s)

Beat: "One paper, two ledgers" donor-vs-voter (EO 13899 BROKEN). PER-SEGMENT reframe.

| # | Criterion | Verdict | Notes |
|---|---|---|---|
| 1 | Intro/outro present + on-brand | SHIP-OK | Intro + outro on-brand; handle `@campaignreceipts` correct. |
| 2 | No clipped/sliced text | SHIP-OK | The per-segment fix WORKS. "ONE ACT. TWO LEDGERS.", "People fought and died for the right to speak.", "AND SHE NEVER GOT A VOTE." all on `scale_fit` (letterbox) and fully readable — no edge words sliced. |
| 3 | Reframe integrity | SHIP-OK | B-roll segment (girl in lecture hall, ~03:56–04:09) `center_crop`s to FILL the 9:16 frame edge-to-edge — no tiny-letterbox-island bug. Text-card letterbox is intentional and clean. The fix landed. |
| 4 | Audio continuity | **FAIL** | Dead air (-91 dB) under intro AND outro. Body VO intact, donor-ledger chain lands on clean boundary ~04:25 (matches `vo_text_lifted`). |
| 5 | Factual/visual match | SHIP-OK | BROKEN framing correct; donor-vs-voter reveal matches VO. Nonpartisan. |
| 6 | Duration sane | SHIP-OK | 40.2 s, under 60 s. |

**Verdict: FIX.** Reframe and text are correct — the ONLY blocker is the
intro/outro dead air. Fix the music bed and this ships.

---

## Short 3 — campus-c2-would-you-count-it (40.1 s)

Beat: ends on "Would you count this promise as kept?" (EO 13899 BROKEN). Center-crop.

| # | Criterion | Verdict | Notes |
|---|---|---|---|
| 1 | Intro/outro present + on-brand | SHIP-OK | Intro + outro on-brand; handle `@campaignreceipts` correct. |
| 2 | No clipped/sliced text | **FAIL** | Carve plan assumed centered big-words; the actual cards are WIDE and center-crop slices both edges. @10s: the punchline "WOULD YOU COUNT IT?" reads "[W]OULD YO[U] / [A]COUNT IT[?]". @20s: "[PE]OPLE DIED / [WH]EN THAT L…". @30–36s footer/CTA: "…l receipt + free new[s]" / "…ed below · Campaign Rece[ipts]" both edges cut. |
| 3 | Reframe integrity | **FAIL** | Same root cause as e2 — wide cards center-cropped. The comment-bait verdict card is the worst hit. |
| 4 | Audio continuity | **FAIL** | Dead air (-91 dB) under intro AND outro. Body VO intact through the "would you count this promise as kept?" close (matches `vo_text_lifted`). |
| 5 | Factual/visual match | SHIP-OK | BROKEN verdict framing correct; the closing question matches VO. Nonpartisan. |
| 6 | Duration sane | SHIP-OK | 40.1 s, under 60 s. |

**Verdict: FIX.** Apply per-segment `scale_fit` to the wide text cards
(esp. the "WOULD YOU COUNT IT?" payoff and the footer/CTA card) and extend
the music bed under intro + outro.

---

## Summary

| Short | Verdict | Blocking FAILs |
|---|---|---|
| embassy-e2-four-presidents | **FIX** | clipped text (#2), reframe (#3), intro/outro dead air (#4) |
| campus-c1-two-ledgers | **FIX** | intro/outro dead air (#4) only — reframe/text correct |
| campus-c2-would-you-count-it | **FIX** | clipped text (#2), reframe (#3), intro/outro dead air (#4) |

### What to fix (precise)

1. **Music bed under intro/outro (all 3).** The silent branded cards currently
   carry true digital silence (-91 dB). Extend the master's music bed under the
   ~2 s head card and ~3 s tail card so audio never drops out.

2. **Per-segment `scale_fit` for wide text cards (e2 + c2).** C1's per-segment
   reframe is the proven pattern — extend it to e2 and c2. Every wide
   Remotion/text card (timeline name-beats, "PROCLAMATION 9683…" receipt,
   "WOULD YOU COUNT IT?", "PEOPLE DIED…", footer/CTA) must letterbox
   (`scale_fit`), not center_crop. Center_crop stays only for
   genuinely-centered full-frame imagery (e.g. the Trump portrait, the C1
   lecture-hall b-roll).

The carve-plan premise that e2 and c2 were "centered big-words that survive a
center-crop" is wrong — same misdiagnosis C1 already corrected. C1 is one
music-bed fix away from shipping.

---

# RE-QC PASS (2026-05-29, after fixes) — FINAL VERDICTS

Method unchanged: audio checked **STRUCTURALLY** (`ffprobe` + `volumedetect` +
`silencedetect`), visuals by reading extracted frames (~every 3–5 s across each
body). All three re-confirmed 1080×1920 h264 + aac; durations e2=33.07 s,
c1=40.07 s, c2=40.07 s (all <60 s).

## Fix 1 — Edge-clipping (was #2/#3 FAIL on e2 + c2)

**RESOLVED on both.** Wide cards now render via `scale_fit` (letterboxed center
band, cream/dark margins) — every word fully on-screen, NOTHING sliced at frame
edges:

- **e2:** "FOUR PRESIDENTS SIGNED THE WAIVER" header + all four timeline labels
  (1995 / CLINTON / BUSH / OBAMA, each with full "Signed the six-month waiver")
  fully visible; date/receipt card "PRESIDENTIAL PROCLAMATION 9683 · SIGNED
  DEC 6, 2017" + full quote "The United States recognizes Jerusalem as the
  capital of Israel." + SOURCE badge all intact, no edge cut.
- **c2:** "Protect campus free speech (widen the debate)" + BROKEN stamp +
  "EO 13899, Dec 11, 2019" attribution; "WOULD YOU COUNT IT?", "PEOPLE DIED TO
  WIDEN THAT LINE.", and "The full receipt + free newsletter · linked below"
  CTA — all fully readable, no slice.
- Full-frame centered b-roll (e2 Trump portrait @18–21 s) fills 9:16 cleanly
  via center_crop — no tiny-letterbox island. The dark text-on-black c2 cards
  ARE the scale_fit band (intentional), not a mis-framed b-roll.

## Fix 2 — Dead air under intro/outro (was #4 FAIL on all 3)

**RESOLVED on all three.** Branded stings now muxed — no longer -91 dB:

| Short | intro 0–2 s | outro last 3 s | body 5–8 s |
|---|---|---|---|
| embassy-e2 | -34.2 dB | -36.5 dB | -21.0 dB |
| campus-c1 | -34.2 dB | -36.5 dB | -20.6 dB |
| campus-c2 | -34.2 dB | -37.9 dB | -21.9 dB |

`silencedetect` shows only normal inter-sentence VO beats in the body (all
<2 s, none at head/tail). Card↔body seams measure ~-20 dB (audio continuous,
no abrupt drop). Body VO intact throughout.

## On-brand intro/outro (criterion #1) — confirmed all 3

Intro: "THE RECORD → Campaign Receipts → Receipts, not vibes." Outro:
"Follow the money with us" + SUBSCRIBE + bell + `@campaignreceipts`.

## Regressions

None. Durations <60 s, KEPT (embassy) vs BROKEN (campus) framing correct, no
new clipping, no audio discontinuity.

## FINAL VERDICTS

| Short | Verdict |
|---|---|
| embassy-e2-four-presidents | **SHIP** |
| campus-c1-two-ledgers | **SHIP** |
| campus-c2-would-you-count-it | **SHIP** |

Both blockers held fixed; no remaining FAIL. All three clear the gate.
