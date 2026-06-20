// OG card for /investigate — the Donor Intelligence search product.
// Brand: parchment paper, navy ink, civic-red accent, serif headline + mono labels.
// Matches the visual system of app/leaderboard/opengraph-image.tsx.

import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Campaign Receipts — follow the money behind any vote'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#F4EFE6'
const PAPER_2 = '#EBE3D0'
const NAVY = '#16263D'
const NAVY_3 = '#6E7891'
const RED = '#B23A3A'

const SEARCHABLE = ['Politician', 'Donor', 'Bill', 'Vote']

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PAPER, padding: '52px 60px', fontFamily: 'serif', color: NAVY }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts · Donor Intelligence</div>
          <div style={{ display: 'flex' }}>Follow the money</div>
        </div>
        <div style={{ display: 'flex', fontSize: 68, fontWeight: 700, marginTop: 28, lineHeight: 1.02 }}>Follow the money behind any vote</div>
        <div style={{ display: 'flex', fontSize: 24, color: RED, marginTop: 12, fontWeight: 600 }}>Search any politician, donor, bill, or vote.</div>
        <div style={{ marginTop: 34, display: 'flex', gap: 12, flex: 1, alignItems: 'flex-start' }}>
          {SEARCHABLE.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: PAPER_2, borderRadius: 8, padding: '16px 22px' }}>
              <div style={{ display: 'flex', fontFamily: 'monospace', color: NAVY_3, fontSize: 16 }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', fontSize: 18, color: NAVY, marginTop: 4 }}>
          See who funds whom — sourced from FEC and Congress data. Free.
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: NAVY, marginTop: 22 }}>
          <div style={{ display: 'flex' }}>A citation on every line</div>
          <div style={{ display: 'flex', fontWeight: 700 }}>campaignreceipts.com/investigate</div>
        </div>
      </div>
    ),
    size,
  )
}
