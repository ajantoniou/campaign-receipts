// /api/card/race/[slug] — the RACE SCOREBOARD share card.
//
// The screenshot/thumbnail unit from the intelligence-engine strategy
// (brief §3a): one race, the two best-funded candidates, the outside-money
// each drew (for vs against), and the single biggest PAC stamped on it.
// "Someone spent $X to beat this person — here's who." This is what gets
// shared, ranks, and becomes the weekend Short's first frame.
//
// Brand: parchment paper, navy ink, civic-red, amber accent — matched to
// /api/card/donor. 1200x630 (Twitter/X large-summary card size).

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
const AMBER = '#B8862F'
const BAR_TRACK = '#E0D6C2'

function fmtMoney(n: number): string {
  if (!n || n <= 0) return '$0'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${Math.round(n).toLocaleString()}`
}

type Cand = {
  name: string
  party: string | null
  ie_for_usd: number | null
  ie_against_usd: number | null
}
type Pac = { name: string; total_usd: number; affiliation: string | null; target_candidate?: string | null }

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const { data: race } = await supabaseService
    .from('cr_races')
    .select('slug, headline, state, district, total_ie_usd, candidates, top_pacs')
    .eq('slug', params.slug)
    .maybeSingle()

  const cands: Cand[] = ((race?.candidates as Cand[]) || [])
    .map((c) => ({ ...c, _ie: (Number(c.ie_for_usd) || 0) + (Number(c.ie_against_usd) || 0) }))
    .sort((a: any, b: any) => b._ie - a._ie)
    .slice(0, 2)

  const topPac: Pac | null = ((race?.top_pacs as Pac[]) || [])
    .slice()
    .sort((a, b) => (Number(b.total_usd) || 0) - (Number(a.total_usd) || 0))[0] || null

  // The biggest single IE flow drives the punchline ("$X spent to beat Y").
  const total = Number(race?.total_ie_usd) || 0
  const maxBar = Math.max(
    1,
    ...cands.map((c) => Math.max(Number(c.ie_for_usd) || 0, Number(c.ie_against_usd) || 0)),
  )
  const stateLabel = race?.district && race.district !== `${race.state}-Statewide`
    ? race.district
    : `${race?.state || ''}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: PAPER,
          padding: '46px 56px',
          fontFamily: 'serif',
          color: NAVY,
          borderLeft: `10px solid ${AMBER}`,
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts · The money race</div>
          <div style={{ display: 'flex' }}>{stateLabel} · 2026</div>
        </div>

        {/* total outside money */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginTop: 18 }}>
          <div style={{ display: 'flex', fontSize: 78, fontWeight: 800, color: AMBER, lineHeight: 1 }}>{fmtMoney(total)}</div>
          <div style={{ display: 'flex', fontSize: 18, color: NAVY_3, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
            in outside money so far
          </div>
        </div>

        <div style={{ display: 'flex', height: 2, background: PAPER_2, marginTop: 20, marginBottom: 22 }} />

        {/* the two candidates, for/against bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, flex: 1 }}>
          {cands.map((c, i) => {
            const forUsd = Number(c.ie_for_usd) || 0
            const againstUsd = Number(c.ie_against_usd) || 0
            const forPct = Math.round((forUsd / maxBar) * 100)
            const againstPct = Math.round((againstUsd / maxBar) * 100)
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>
                    {c.name}{c.party ? ` · ${c.party[0]}` : ''}
                  </div>
                  <div style={{ display: 'flex', fontSize: 17, color: NAVY_3, fontFamily: 'monospace' }}>
                    {fmtMoney(forUsd)} for · {fmtMoney(againstUsd)} against
                  </div>
                </div>
                {/* FOR bar (green-ink navy) + AGAINST bar (red) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', width: '100%', height: 16, background: BAR_TRACK, borderRadius: 3 }}>
                    <div style={{ display: 'flex', width: `${forPct}%`, height: '100%', background: NAVY, borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', width: '100%', height: 16, background: BAR_TRACK, borderRadius: 3 }}>
                    <div style={{ display: 'flex', width: `${againstPct}%`, height: '100%', background: RED, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            )
          })}
          {cands.length === 0 && (
            <div style={{ display: 'flex', fontSize: 24, color: NAVY_3 }}>See the full money race on the site.</div>
          )}
        </div>

        {/* the named top PAC — the "here's who paid" stamp */}
        {topPac && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 10 }}>
            <div style={{ display: 'flex', fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, color: RED, border: `1px solid ${RED}`, borderRadius: 4, padding: '4px 10px' }}>
              Top spender
            </div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: NAVY }}>
              {topPac.name} — {fmtMoney(Number(topPac.total_usd) || 0)}
            </div>
            {topPac.affiliation && (
              <div style={{ display: 'flex', fontSize: 14, color: NAVY_3, fontFamily: 'monospace' }}>{topPac.affiliation}</div>
            )}
          </div>
        )}

        {/* footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, color: NAVY_2, marginTop: 4, borderTop: `2px solid ${PAPER_2}`, paddingTop: 14 }}>
          <div style={{ display: 'flex' }}>Every figure is a verified FEC independent expenditure.</div>
          <div style={{ display: 'flex', fontWeight: 700, color: NAVY }}>campaignreceipts.com/race/{race?.slug || ''}</div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' },
    },
  )
}
