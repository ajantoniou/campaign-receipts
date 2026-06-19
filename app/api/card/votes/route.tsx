// /api/card/votes — viral share card for the "Votes that match the money"
// leaderboard. Screenshot-bait: the top politician's giant "matched the
// money" percent, then the top few names ranked under it.
//
// Brand: parchment paper, navy ink, civic-red (high match = the money won),
// green (low match), amber accent. 1200x630 — Twitter/X large card size.
// Mirrors app/api/card/donor/route.tsx composition.

import { ImageResponse } from 'next/og'
import { supabaseService } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SIZE = { width: 1200, height: 630 }
const PAPER = '#F4EFE6'
const PAPER_2 = '#EBE3D0'
const NAVY = '#16263D'
const NAVY_2 = '#33415C'
const NAVY_3 = '#6E7891'
const RED = '#B23A3A'
const GREEN = '#2F6B4F'
const AMBER = '#B8862F'

const MIN_VOTES = 5

type Row = { name: string; party: string; state: string; pct: number; aligned: number; total: number }

async function ranking(): Promise<Row[]> {
  const { data } = await supabaseService.from('cr_donor_vote_alignment').select('politician_id, alignment_score').limit(20000)
  const byPol = new Map<string, { aligned: number; total: number }>()
  for (const r of (data as any[]) || []) {
    const e = byPol.get(r.politician_id) || { aligned: 0, total: 0 }
    if (r.alignment_score === 1) e.aligned++
    e.total++
    byPol.set(r.politician_id, e)
  }
  const qualified = [...byPol.entries()].filter(([, e]) => e.total >= MIN_VOTES)
  if (qualified.length === 0) return []
  const ids = qualified.map(([id]) => id)
  const { data: pols } = await supabaseService.from('cr_politicians').select('id, name, party, state').in('id', ids)
  const polById = new Map<string, any>(((pols as any[]) || []).map((p) => [p.id, p]))
  return qualified
    .map(([id, e]) => {
      const p = polById.get(id)
      if (!p) return null
      return { name: p.name, party: p.party, state: p.state, pct: Math.round((e.aligned / e.total) * 100), aligned: e.aligned, total: e.total }
    })
    .filter(Boolean as any as (v: Row | null) => v is Row)
    .sort((a, b) => b.pct - a.pct || b.total - a.total)
}

export async function GET() {
  const rows = await ranking()
  const lead = rows[0] || null
  const rest = rows.slice(1, 5)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: PAPER, padding: '48px 56px', fontFamily: 'serif', color: NAVY,
          borderLeft: `10px solid ${AMBER}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts · Donor influence</div>
          <div style={{ display: 'flex' }}>FEC + roll-call receipts</div>
        </div>

        <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, marginTop: 18 }}>Votes that match the money</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
            <div style={{ display: 'flex', fontSize: lead && lead.name.length > 24 ? 44 : 56, fontWeight: 700, lineHeight: 1.02 }}>
              {lead?.name || 'No data yet'}
            </div>
            {lead && (
              <div style={{ display: 'flex', fontSize: 20, color: NAVY_2, marginTop: 8 }}>
                {lead.aligned} of {lead.total} votes went the money&apos;s way
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: 88, fontWeight: 800, color: lead && lead.pct >= 60 ? RED : GREEN, lineHeight: 1 }}>
              {lead ? `${lead.pct}%` : '—'}
            </div>
            <div style={{ display: 'flex', fontSize: 14, color: NAVY_3, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>
              matched the money
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', height: 2, background: PAPER_2, marginTop: 22, marginBottom: 18 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {rest.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', fontSize: 18, fontFamily: 'monospace', color: NAVY_3, width: 34 }}>#{i + 2}</div>
                <div style={{ display: 'flex', fontSize: 28, fontWeight: 600 }}>{r.name}</div>
              </div>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: NAVY_2, fontFamily: 'monospace' }}>{r.pct}%</div>
            </div>
          ))}
          {rest.length === 0 && <div style={{ display: 'flex', fontSize: 22, color: NAVY_3 }}>See the full ranking on the site.</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, color: NAVY_2, marginTop: 16 }}>
          <div style={{ display: 'flex' }}>How often they vote the money&apos;s way.</div>
          <div style={{ display: 'flex', fontWeight: 700, color: NAVY }}>campaignreceipts.com/leaderboard</div>
        </div>
      </div>
    ),
    { ...SIZE, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  )
}
