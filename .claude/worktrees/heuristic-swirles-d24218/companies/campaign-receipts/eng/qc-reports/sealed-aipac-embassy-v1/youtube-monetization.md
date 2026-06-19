# YouTube Monetization — sealed-aipac-embassy-v1

ROLE: YouTube Monetization
MODE: REVIEW
YPP RISK: **LIMITED ADS LIKELY**
VERDICT: **REVISE → FOUNDER OVERRIDE: SHIP AS-IS (2026-05-23)**

**Founder call:** ship the MrBeast title `60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT` and accept the limited-ads tax. Rationale: political content on @CampaignReceiptsYoutube runs limited-ads as baseline regardless of title; CTR is the binding constraint for a sub-500 channel. Re-litigate if/when YPP unlocks and a back-catalog audit shows meaningful RPM headroom on swapped titles. Do **not** auto-revise without the founder.

## TL;DR

The video is documentary-framed and the **count itself** is factually defensible (UN, Federal Register, SEALED book). The classifier won't strike it. But two surfaces push it into "limited ads":

1. **Title verb `KILLED`** — `60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT`. Death-verb in the feed (before the viewer hears any context) is the single biggest RPM tax on this upload.
2. **s4-01 beat "60 killed at the Gaza border"** (≈ 1:26–1:44) — "Controversial issues and sensitive events" bucket. Documentary framing mitigates but does not exempt.

Everything else is clean — thumbnail is a count not a verb, description has the contextualizing line, no doxxing, no election-integrity claim, no Hard NO trip.

## Evidence

| Surface | Element | Policy bucket | Severity |
|---------|---------|---------------|----------|
| Title (ship) | `60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT` | Controversial issues + sensitive events (feed-classified) | **HIGH — limited ads** |
| Thumb headline | `60` over parchment + `KEPT` stamp + subline `SAME DAY AS JERUSALEM / AY-PACK #2 KEPT` | Count, not death-verb — passes feed classification | Low |
| s4-01 VO + card | "Same day — 60 killed at the Gaza border" + card `SAME DAY / GAZA` (≈ 1:26–1:44) | Sensitive events — documentary contextualization (UN cite, Federal Register cite, neutral cadence) | **MEDIUM — limited ads** |
| Description line 2 | "Same afternoon: 60 killed at the Gaza border while the embassy opened in Jerusalem." | Sensitive events — neutral framing with same-day juxtaposition | MEDIUM |
| Description line 5 | UN GA roll-call 128–9 + Promise #74 KEPT grade | News record cite — clean | None |
| Tags | `gaza`, `jerusalem`, `un vote`, `fact check` | Newsworthy bucket — no `extremism` / `violence` tags | None |
| Fair-use clips | None in storyboard (all `text-card` or `remotion`) | n/a — no Content ID exposure on this LF | None |

## Specific fixes

- **title:** **REVISE recommended.** Ship one of:
  - **Ad-friendly ship (recommended):** `KEPT: EMBASSY MOVED — WHAT ELSE HAPPENED THAT DAY` (alt #3 from packaging — already in `title_alt`). Recovers full ads. Trade-off: ~10–15% CTR cost vs current — the curiosity gap is softer.
  - **As-is with founder signoff:** keep `60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT` — accept "limited ads" classification, optimize for CTR/AVD. SEALED's RPM ceiling on this episode is already capped by the s4 beat; the title only adds ~10–20% additional RPM tax. Could be the right call if the goal is reach over revenue.
  - **Do not ship:** alt #2 `4 PRESIDENTS SAID NOT YET. THEN JERUSALEM — 60 DEAD` — still a death-word in the feed, same tax as current with worse CTR.
- **description:** **no change.** Lines 1–2 are the expectations contract from packaging; the contextualizing language ("Before you cheer or curse that moment, you need the rest of the afternoon — because the book does not let you have the ceremony without the border.") is exactly the kind of documentary framing the suitability reviewer credits. Keep.
- **mid-roll placement:** **n/a today — runtime 3:25 < 8:00 minimum.** Pre-roll + post-roll only. **IF the LF is extended to ≥ 8:00** in a future cut, the natural slot is **t≈1:56**, between s4-02 (end of same-day Gaza beat) and s5-01 (UN vote 128–9) — clean scene break, viewer just finished the receipt payoff, about to start the international-vote context. **Do not** place a mid-roll inside s4-01 (over the death-count line) — reads as ad-mocking and tanks RPM and audience trust.
- **content-id sidecar:** **n/a** — this storyboard uses only `remotion` + `text-card` clips, zero fair-use third-party footage. If a future cut adds UN webcast footage of the May 14, 2018 vote, prefer the UN's own webcast clip (publicly licensed) over network rebroadcast, with a sidecar in `_build/sealed-aipac-embassy-v1/fair-use-clips/`.
- **length call:** **ship at 3:25 as-is** for this iteration. Extending to ≥ 8:00 to unlock mid-roll is **not recommended for this episode** — the receipt completes naturally at the verdict beat, and padding to chase one mid-roll slot would tank AVD (a worse RPM outcome than no mid-roll on a tight cut). Revisit on the next SEALED LF that has a natural fourth beat (donor-class table, follow-up vote, scorecard delta).

## Revenue opportunities (flag only — founder decides)

- **YPP not yet unlocked** for `@CampaignReceiptsYoutube` (channel is below the 500-subs + 3K-watch-hours threshold per `eng/PUBLISHED-YOUTUBE.md` sub count signal). This whole review is forward-looking — once YPP turns on, the suitability classification still applies retroactively to the back catalog, so revising the title now (or accepting the tax knowingly) protects future RPM on this evergreen.
- **Super Thanks** + **Channel memberships** — unlocks at YPP. Member-only perk candidate: **SEALED scorecard delta updates** (e.g. when promise #74's grade is reviewed). Don't add a description line for either until actually unlocked.
- **SEALED2016.com deep link** in description line 3 is correct, has UTM (`?utm_source=youtube&utm_medium=longform&utm_campaign=embassy-v1`). No fix needed.
- **No third-party tip vendors** recommended at this stage — Super Thanks on-platform first when YPP unlocks.

## Mitigations applied in the existing cut (credit to other personas)

- **No `extremism` / `violence` / `terror` tags** — packaging + algorithm-strategist already kept the tag list newsworthy
- **Documentary framing in description line 1** — provides the suitability-reviewer's "context" credit
- **No bare AIPAC in VO** — `AY-pack` spelled out per `brand/voice-writing.md`; on-screen card `AY-PACK PRIORITY` is fine
- **Verdict KEPT stamp on thumb** (not a death-graphic) — feed-classifier sees a checked-off fact, not a war image
- **No quoted slurs, no doxxing, no calls to action against named individuals** — clean across the Hard NO list

## Pipeline state

- Persona: `personas/viral-panel/07-youtube-monetization.md` (renamed 2026-05-22 from `07-monetization-expert.md` to honor the viral-panel naming convention; references updated in `upload-queue-runner.py` + `PRODUCTION-PIPELINE-RUNBOOK.md`)
- Meta object updated: `eng/youtube-meta/sealed-aipac-embassy-v1.json` → `monetization.qc_report` points at this report; `ai_disclosure_line` + `ad_friendly_call: "yellow-expected"` + `appeal_after: "7d / 1k views"` set parallel to the existing CR new-news set (Bush, Massie shorts/LF)
- `pre-upload-pack.py` warn-only on missing `monetization.qc_report` (parallel to `packaging` warn). Hard-fail flip next session once Iran v7, Bush, Massie also have reports on disk.
- AI-disclosure line will be auto-appended to `description.md` at pack time (pre-existing splice behavior; not changed by this review).
- **Founder decision (2026-05-23):** SHIP AS-IS with MrBeast title; accept `yellow-expected` ad_friendly_call. Title is **locked**.
