// OG card for /pro-israel-money. Brand: parchment paper, navy ink, civic-red
// accent (oppose) + green (support), serif headline + mono labels. Matches
// app/for-journalists/opengraph-image.tsx.

import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Pro-Israel PAC money: who they backed and who they targeted'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#F4EFE6'
const PAPER_2 = '#EBE3D0'
const NAVY = '#16263D'
const NAVY_3 = '#6E7891'
const RED = '#B23A3A'
const GREEN = '#2E7D55'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PAPER, padding: '52px 60px', fontFamily: 'serif', color: NAVY }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts · Follow the Money</div>
          <div style={{ display: 'flex' }}>FEC independent expenditures</div>
        </div>
        <div style={{ display: 'flex', fontSize: 70, fontWeight: 700, marginTop: 28, lineHeight: 1.0 }}>Pro-Israel PAC money</div>
        <div style={{ display: 'flex', fontSize: 40, marginTop: 8, lineHeight: 1.0 }}>
          who they <span style={{ color: GREEN, fontWeight: 700, margin: '0 10px' }}>backed</span> — and who they <span style={{ color: RED, fontWeight: 700, marginLeft: 10 }}>targeted</span>
        </div>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: PAPER_2, borderRadius: 8, padding: '14px 20px' }}>
            <div style={{ display: 'flex', fontFamily: 'monospace', color: GREEN, fontSize: 15, width: 64 }}>BACKED</div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 600 }}>Money AIPAC, UDP &amp; DMFI spent to elect them.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: PAPER_2, borderRadius: 8, padding: '14px 20px' }}>
            <div style={{ display: 'flex', fontFamily: 'monospace', color: RED, fontSize: 15, width: 64 }}>TARGET</div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 600 }}>Money spent to defeat them — counted separately.</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: NAVY, marginTop: 20 }}>
          <div style={{ display: 'flex' }}>Sourced to FEC filings · correlation ≠ causation</div>
          <div style={{ display: 'flex', fontWeight: 700 }}>campaignreceipts.com/pro-israel-money</div>
        </div>
      </div>
    ),
    size,
  )
}
