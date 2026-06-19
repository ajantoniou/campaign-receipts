# YouTube Monetization — sealed-drain-the-swamp-v1

ROLE: YouTube Monetization
MODE: REVIEW
YPP RISK: **GREEN-EXPECTED**
VERDICT: **SHIP**

## TL;DR

Policy/ethics content with documented EO numbers and a defensible delta ($3.15B → $3.53B from public OpenSecrets / lobbying-disclosure data). No sensitive-events trigger. No death-verbs in title. Should monetize normally once YPP unlocks.

## Evidence

| Surface | Element | Policy bucket | Severity |
|---------|---------|---------------|----------|
| Title (ship) | `LOBBYING ROSE $400M WHILE TRUMP DRAINED THE SWAMP` | Political — neutral framing of public-record delta | Low |
| Thumb headline | `$3.53B` over parchment + `BROKEN` stamp | Number, not a slur or graphic | None |
| Description | EO 13770 + EO 13983 + lobbying-spend delta | Public-record cites | None |
| Tags | `drain the swamp`, `lobbying`, `ethics pledge`, `fact check` | Civic/newsworthy | None |
| Fair-use clips | None (storyboard is remotion + text-card) | n/a | None |

## Specific fixes

- **title:** ship as picked. No revision.
- **description:** include lobbying spend delta + both EO numbers; already in `youtube-meta` description.
- **mid-roll placement:** if LF runtime ≥ 8:00, natural slot is between the EO 13770 beat and the lobbying-delta chart beat — clean scene break.
- **content-id sidecar:** n/a (no third-party footage in storyboard).

## Pipeline state

- Persona: `personas/viral-panel/07-youtube-monetization.md`
- Meta object: `eng/youtube-meta/sealed-drain-the-swamp-v1.json` → `monetization.qc_report` to point at this file; `ad_friendly_call: "green-expected"`.
- Channel still pre-YPP; this review is forward-looking. Re-audit after YPP unlocks.
