// Default OG card for /leaderboard (the politician top-5 list).
//
// NOTE: Next 14 metadata image routes do NOT receive query params, so this
// card always renders the "Most broken promises" view. The DONOR LEDGER
// viral card (which DOES vary by ?view=) lives at /api/card/donor and is
// wired into the donor views via generateMetadata in page.tsx.
//
// Brand: parchment paper, navy ink, civic-red (broken), amber accent.

import { ImageResponse } from 'next/og'
import { supabaseService, type Politician } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const alt = 'CampaignReceipts leaderboard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#F4EFE6'
const PAPER_2 = '#EBE3D0'
const NAVY = '#16263D'
const NAVY_3 = '#6E7891'
const RED = '#B23A3A'

export default async function Image() {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('name, scorecard_broken, scorecard_graded_total')
    .gt('scorecard_graded_total', 0)
    .order('scorecard_broken', { ascending: false })
    .limit(5)
  const rows = (data as Politician[]) || []

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PAPER, padding: '52px 60px', fontFamily: 'serif', color: NAVY }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts · Leaderboard</div>
          <div style={{ display: 'flex' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, marginTop: 24, lineHeight: 1.05 }}>Most Broken Promises</div>
        <div style={{ display: 'flex', fontSize: 22, color: RED, marginTop: 8, fontWeight: 600 }}>Federal politicians ranked by broken verdicts</div>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {rows.slice(0, 5).map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: PAPER_2, borderRadius: 8, padding: '12px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', fontFamily: 'monospace', color: NAVY_3, fontSize: 16, width: 26 }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 600 }}>{p.name}</div>
              </div>
              <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: RED }}>{p.scorecard_broken} broken</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: NAVY, marginTop: 18 }}>
          <div style={{ display: 'flex' }}>Primary-source receipts on every verdict</div>
          <div style={{ display: 'flex', fontWeight: 700 }}>campaignreceipts.com/leaderboard</div>
        </div>
      </div>
    ),
    size,
  )
}
