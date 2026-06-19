# Campaign Receipts YouTube Metadata Audit — 2026-05-28

Pulled live channel metadata through the YouTube Data API.

## Scope

- Channel: CampaignReceipts
- Channel ID: `UC4NINNbjaoy2PTKxbY5an-g`
- API upload-playlist items reviewed: 35
- Channel-level public video count reported by YouTube: 33
- Subscribers at audit: 9
- Channel views at audit: 4,735

## Live Fixes Applied

1. Fixed vague Trump Short title.
   - Video: `GKx4y5hplqM`
   - Old title: `Trump Kept One Promise. It Broke Another. #shorts`
   - New title: `Trump Kept Iran Deal Promise. Then B-2s Flew. #shorts`
   - Reason: "It" had no clean antecedent and made the title read machine-written.

2. Backfilled missing description CTA/disclosure lines across all 35 reviewed uploads.
   - `campaignreceipts.com`
   - `campaignreceipts.com/weekly`
   - `sealed2016.com`
   - `Narration: ElevenLabs Jessica (synthesized voice). Research, scripts, and commentary by Campaign Receipts.`

## Verification

Post-update YouTube Data API verification:

- Missing CampaignReceipts.com links: 0
- Missing weekly signup links: 0
- Missing SEALED2016.com links: 0
- Missing narration disclosure: 0

## Remaining Editorial Risks

- Several older SEALED Shorts still use all-caps titles. Keep if they are legacy/test-batch artifacts; revise only if we decide to actively revive that batch.
- Two older titles include advertiser-risk words around death/kill language. Not urgent while the channel is pre-YPP, but avoid that pattern in future uploads.
- Upload playlist returned 35 items while channel statistics reported 33 videos. Treat YouTube Studio as source of truth for final visible inventory.
