# Campaign Receipts YouTube Audit — 2026-05-29 (delisting/appeal day)

Pulled live via YouTube Data API (read-only) the morning after YouTube
delisted the channel for suspected "scam posting" (automated classifier).
Founder appealed.

## Channel

- Channel: CampaignReceipts
- Channel ID: `UC4NINNbjaoy2PTKxbY5an-g`
- Subscribers: 9
- Channel views: 4,993 (up from 4,735 on 2026-05-28)

## The "video count drop" is suppression, NOT deletion

| Metric | 2026-05-28 | 2026-05-29 | Note |
|---|---|---|---|
| Channel-reported `videoCount` | 33 | **5** | YouTube-side public count |
| Founder-screen visible count | — | ~21 | partial/cached public view |
| Upload-playlist items (actual) | 35 | **35** | unchanged — nothing deleted |
| Public-status videos | — | 34 | all still `public` |
| Private | 1 (`Oked3HdtROA`) | 1 (`Oked3HdtROA`) | unchanged |

**Finding:** No videos were removed, deleted, or struck. All 35 uploads the
founder ever posted are still on the account (34 public + 1 intentionally
private). The drop the founder saw is YouTube **suppressing the public
visibility/count** while the channel is flagged — videos stop appearing in
the channel grid, search, and the public `videoCount`, but remain on the
account. Restoring visibility is exactly what the appeal is for.

**`SSuO2KOXr0Y` (live embassy LF v1) confirmed intact** — do not delete
before the v2 replacement upload (`--replace-id SSuO2KOXr0Y`).

## Action taken

Pushed the appeal-focused channel description (959 chars) to
`brandingSettings.channel.description` via `channels.update`. Field was
empty (0 chars) before; an empty description likely contributed to the
classifier's "scam" read. Source text:
`eng/youtube-meta/channel-description-2026-05-29.md`.

## Full inventory (35 upload-playlist items, all retained)

All public except `Oked3HdtROA` (private). Live LF v1 to replace later:
`SSuO2KOXr0Y`. Live campus Short to not duplicate: `CNmFoUgK4ls`.
