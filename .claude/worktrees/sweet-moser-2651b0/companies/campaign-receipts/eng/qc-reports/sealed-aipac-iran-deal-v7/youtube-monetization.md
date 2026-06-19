# YouTube Monetization — sealed-aipac-iran-deal-v7

ROLE: YouTube Monetization
MODE: REVIEW
YPP RISK: **YELLOW-EXPECTED**
VERDICT: **SHIP AS-IS**

## TL;DR

Campaign-finance content with a named major donor ($82M, Adelson). No sensitive-events trigger, no death-verbs, no slurs. The yellow tax comes from naming a private donor on a feed-classifier — documentary framing, sourced figure, neutral cadence all mitigate but don't fully exempt. Same posture as embassy LF.

## Evidence

| Surface | Element | Policy bucket | Severity |
|---------|---------|---------------|----------|
| Title | `$82M DONOR. 3 PROMISES KEPT. WHO PAID FOR THE IRAN EXIT?` | Political — campaign-finance framing | **MEDIUM — limited ads possible** |
| Thumb | `$82M` over parchment + `BROKEN` stamp + subline `3 PROMISES KEPT` | Number, not a person's face | Low |
| Description | Adelson named with sourced $82M figure + three EO/treaty dates | Public-record cites | LOW–MEDIUM |
| Tags | `iran deal`, `aipac`, `campaign finance`, `jcpoa`, `sheldon adelson` | Newsworthy | None |
| Fair-use clips | None in current storyboard (text-card + remotion) | n/a | None |

## Specific fixes

- **title:** ship as-is. The donor angle is the curiosity gap; softening it (e.g., removing `$82M`) tanks CTR more than the limited-ads tax tanks RPM at this channel size.
- **description:** keep neutral framing — "roughly $82M in the 2016 cycle," cite the SEALED book + OpenSecrets-style public source. No change.
- **mid-roll placement:** if LF runtime ≥ 8:00, place between the JCPOA-exit beat and the donor-table beat — clean scene break. Do not place mid-roll over Adelson's name.
- **content-id sidecar:** n/a today; if a future cut adds AIPAC convention footage, source from AIPAC's own webcast or C-SPAN.

## Pipeline state

- Persona: `personas/viral-panel/07-youtube-monetization.md`
- Meta object: `eng/youtube-meta/sealed-aipac-iran-deal-v7.json` → add `monetization.qc_report` pointer; `ad_friendly_call: "yellow-expected"`; `appeal_after: "7d / 1k views"`.
- Channel still pre-YPP. Re-audit when YPP unlocks.
