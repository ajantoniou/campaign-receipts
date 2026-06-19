// OG share-card for /politician/[slug]/correlations.
// The screenshot every journalist + influencer posts.
// Per design lead's wireframe + watermark spec.

import { ImageResponse } from 'next/og'
import { supabaseService, type Politician } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const alt = 'Donor-to-vote alignment'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK_950 = '#0a0a0a'
const INK_900 = '#171717'
const INK_800 = '#262626'
const INK_500 = '#737373'
const INK_400 = '#a3a3a3'
const INK_300 = '#d4d4d4'
const INK_50 = '#fafafa'
const KEPT = '#22C55E'
const PARTIAL = '#D97706'
const BROKEN = '#DC2626'
const AUTHORITY = '#4E6390'

function pctColor(pct: number): string {
  if (pct >= 70) return KEPT
  if (pct >= 40) return PARTIAL
  return BROKEN
}

export default async function Image({ params }: { params: { slug: string } }) {
  const { data: polData } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle()
  const p = polData as Politician | null

  // Pull alignment scores
  const { data: alignment } = p
    ? await supabaseService
        .from('cr_donor_vote_alignment')
        .select('industry_label, alignment_score')
        .eq('politician_id', p.id)
    : { data: null }

  const rows: { industry: string; aligned: number; total: number }[] = []
  if (alignment) {
    const byInd = new Map<string, { a: number; t: number }>()
    for (const r of alignment) {
      if (!byInd.has(r.industry_label)) byInd.set(r.industry_label, { a: 0, t: 0 })
      const v = byInd.get(r.industry_label)!
      v.t++
      if (r.alignment_score === 1) v.a++
    }
    for (const [industry, v] of byInd) {
      if (v.t >= 2) rows.push({ industry, aligned: v.a, total: v.t })
    }
    rows.sort((a, b) => b.aligned / b.total - a.aligned / a.total)
  }

  const hero = rows[0]
  const heroPct = hero ? Math.round((hero.aligned / hero.total) * 100) : 0

  if (!p || rows.length === 0) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            background: INK_950,
            color: INK_50,
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', fontSize: 32, color: INK_400 }}>
            CampaignReceipts · Donor → Vote Alignment
          </div>
          <div style={{ display: 'flex', marginTop: 20, fontSize: 20, color: INK_500 }}>
            Computing alignment data…
          </div>
        </div>
      ),
      size,
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: INK_950,
          padding: '56px 64px',
          fontFamily: 'sans-serif',
          color: INK_50,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: pctColor(heroPct),
              }}
            />
            <div style={{ display: 'flex', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: INK_500 }}>
              CampaignReceipts · Donor → Vote
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: 13, color: INK_500, fontFamily: 'monospace' }}>
            {p.party[0]} · {p.state} · {p.branch}
          </div>
        </div>

        {/* Politician name */}
        <div style={{ display: 'flex', marginTop: 24, fontSize: 44, fontWeight: 700, color: INK_50, letterSpacing: '-0.02em' }}>
          {p.name}
        </div>

        {/* Hero number */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 28 }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'monospace',
              fontSize: 140,
              fontWeight: 700,
              lineHeight: 1,
              color: pctColor(heroPct),
              letterSpacing: '-0.04em',
            }}
          >
            {heroPct}%
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 24, color: INK_300 }}>
              voted with <strong style={{ color: INK_50, marginLeft: 8 }}>{hero.industry}</strong>
            </div>
            <div style={{ display: 'flex', marginTop: 8, fontSize: 16, color: INK_500 }}>
              donors across {hero.total} roll-call votes (119th Congress)
            </div>
          </div>
        </div>

        {/* Up to 4 more industries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 28, flex: 1 }}>
          {rows.slice(1, 5).map((r) => {
            const pct = Math.round((r.aligned / r.total) * 100)
            const c = pctColor(pct)
            return (
              <div
                key={r.industry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: INK_900,
                  border: `1px solid ${INK_800}`,
                  borderRadius: 8,
                  padding: '10px 16px',
                }}
              >
                <div style={{ display: 'flex', width: 200, fontSize: 16, color: INK_300 }}>{r.industry}</div>
                <div style={{ display: 'flex', flex: 1, height: 12, background: INK_950, borderRadius: 4 }}>
                  <div style={{ display: 'flex', width: `${pct}%`, background: c, borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', width: 100, justifyContent: 'flex-end', fontSize: 18, fontWeight: 700, color: c, fontVariantNumeric: 'tabular-nums' }}>
                  {pct}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          <div style={{ display: 'flex', fontSize: 14, color: INK_500 }}>
            Primary-source receipts on every roll-call
          </div>
          <div style={{ display: 'flex', fontSize: 16, color: INK_300, fontWeight: 600 }}>
            campaignreceipts.com
          </div>
        </div>
      </div>
    ),
    size,
  )
}
