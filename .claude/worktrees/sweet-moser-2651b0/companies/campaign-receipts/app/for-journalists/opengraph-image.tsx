// OG card for /for-journalists — the journalist-facing landing for the
// Donor Intelligence search. Newsroom-credibility framing: sourced FEC data.
// Brand: parchment paper, navy ink, civic-red accent, serif headline + mono labels.
// Matches the visual system of app/leaderboard/opengraph-image.tsx.

import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Campaign Receipts — name a bill, see who paid for it'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#F4EFE6'
const PAPER_2 = '#EBE3D0'
const NAVY = '#16263D'
const NAVY_3 = '#6E7891'
const RED = '#B23A3A'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PAPER, padding: '52px 60px', fontFamily: 'serif', color: NAVY }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts · For Reporters</div>
          <div style={{ display: 'flex' }}>The donor database</div>
        </div>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, marginTop: 30, lineHeight: 0.98 }}>Name a bill.</div>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: RED, lineHeight: 0.98, marginTop: 4 }}>See who paid for it.</div>
        <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: PAPER_2, borderRadius: 8, padding: '14px 20px' }}>
            <div style={{ display: 'flex', fontFamily: 'monospace', color: NAVY_3, fontSize: 15, width: 40 }}>BILL</div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 600 }}>Every donor, tied to every vote, tied to every bill.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: PAPER_2, borderRadius: 8, padding: '14px 20px' }}>
            <div style={{ display: 'flex', fontFamily: 'monospace', color: NAVY_3, fontSize: 15, width: 40 }}>SRC</div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 600 }}>Sourced to FEC and Congress.gov. Updated daily.</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: NAVY, marginTop: 20 }}>
          <div style={{ display: 'flex' }}>A citation that survives an editor · $45/mo</div>
          <div style={{ display: 'flex', fontWeight: 700 }}>campaignreceipts.com/for-journalists</div>
        </div>
      </div>
    ),
    size,
  )
}
