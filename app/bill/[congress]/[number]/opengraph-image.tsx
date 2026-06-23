// Dynamic OG card per bill — so shared bill links render a real "money behind this
// bill" preview instead of a blank card. Brand: parchment paper, navy ink,
// civic-red accent, serif + mono. Matches app/for-journalists/opengraph-image.tsx.

import { ImageResponse } from 'next/og'
import { supabaseService } from '@/lib/supabase'

export const runtime = 'nodejs'
export const alt = 'Campaign Receipts — the money behind this bill'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#F4EFE6'
const PAPER_2 = '#EBE3D0'
const NAVY = '#16263D'
const NAVY_3 = '#6E7891'
const RED = '#B23A3A'

function parseSlugParts(slug: string): { type: string; number: number } | null {
  const m = slug.match(/^([a-z]+)-?(\d+)$/i)
  if (!m) return null
  return { type: m[1].toLowerCase(), number: Number(m[2]) }
}
const usd = (n: number) => {
  const x = Number(n) || 0
  if (x >= 1e6) return `$${(x / 1e6).toFixed(1)}M`
  if (x >= 1e3) return `$${Math.round(x / 1e3)}K`
  return `$${Math.round(x)}`
}

export default async function Image({ params }: { params: { congress: string; number: string } }) {
  const congress = Number(params.congress)
  const parts = parseSlugParts(params.number)

  let billLabel = 'Bill'
  let title = 'The money behind this bill'
  let topLine: string | null = null

  try {
    if (parts && congress) {
      const { data: b } = await supabaseService
        .from('cr_bills')
        .select('id, title, short_title, bill_type, bill_number')
        .eq('congress', congress).eq('bill_type', parts.type).eq('bill_number', parts.number)
        .maybeSingle()
      if (b) {
        billLabel = `${(b.bill_type || '').toUpperCase()} ${b.bill_number} · ${congress}th Congress`
        title = b.short_title || b.title || title
        // Headline figure: the top industry behind the bill's sponsors.
        const { data: trail } = await supabaseService
          .from('cr_bill_money_trail')
          .select('industry_label, total_from_industry')
          .eq('bill_id', b.id).order('total_from_industry', { ascending: false }).limit(1)
        const t = trail && trail[0]
        if (t && Number(t.total_from_industry) > 0) topLine = `${usd(t.total_from_industry)} from ${t.industry_label} to its sponsors`
      }
    }
  } catch { /* fall back to defaults */ }

  const t = title.length > 120 ? title.slice(0, 117).trimEnd() + '…' : title
  const titleSize = t.length > 80 ? 46 : t.length > 50 ? 56 : 66

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PAPER, padding: '52px 60px', fontFamily: 'serif', color: NAVY }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts · Bill Money Trail</div>
          <div style={{ display: 'flex' }}>{billLabel}</div>
        </div>
        <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 700, marginTop: 28, lineHeight: 1.04, flex: 1 }}>{t}</div>
        {topLine && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: PAPER_2, borderRadius: 8, padding: '16px 22px', marginBottom: 18 }}>
            <div style={{ display: 'flex', fontFamily: 'monospace', color: RED, fontSize: 15, width: 56 }}>$$$</div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 600 }}>{topLine}</div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, color: NAVY, borderTop: `2px solid ${PAPER_2}`, paddingTop: 18 }}>
          <div style={{ display: 'flex', color: RED, fontWeight: 700 }}>Who paid the sponsors — sourced to FEC</div>
          <div style={{ display: 'flex', fontWeight: 700 }}>campaignreceipts.com</div>
        </div>
      </div>
    ),
    size,
  )
}
