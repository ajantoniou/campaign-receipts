// /api/card/bill-sponsors — viral share card for the "Who paid the
// sponsors" leaderboard. Screenshot-bait: the top bill's name, the giant
// dollar figure of donor-industry money behind its sponsors, then the
// next few bills ranked under it.
//
// Brand: parchment paper, navy ink, amber accent. 1200x630.
// Mirrors app/api/card/donor/route.tsx composition. FEC bucketing
// artifacts (Individual / Retired) are filtered out — same as the page.

import { ImageResponse } from 'next/og'
import { supabaseService } from '@/lib/supabase'
import { isFecArtifact } from '@/lib/fec-industry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SIZE = { width: 1200, height: 630 }
const PAPER = '#F4EFE6'
const PAPER_2 = '#EBE3D0'
const NAVY = '#16263D'
const NAVY_2 = '#33415C'
const NAVY_3 = '#6E7891'
const AMBER = '#B8862F'

function fmtMoney(n: number): string {
  if (!n) return '$0'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${Math.round(n).toLocaleString()}`
}

type Row = { label: string; tag: string; total: number; topIndustry: string | null }

async function ranking(): Promise<Row[]> {
  const { data: trail } = await supabaseService
    .from('cr_bill_money_trail')
    .select('bill_id, industry_label, total_from_industry')
    .limit(20000)
  const byBill = new Map<string, { total: number; top: { label: string; amt: number } | null }>()
  for (const r of (trail as any[]) || []) {
    if (isFecArtifact(r.industry_label)) continue
    const amt = Number(r.total_from_industry) || 0
    if (amt <= 0) continue
    const e = byBill.get(r.bill_id) || { total: 0, top: null }
    e.total += amt
    if (!e.top || amt > e.top.amt) e.top = { label: r.industry_label, amt }
    byBill.set(r.bill_id, e)
  }
  if (byBill.size === 0) return []
  const ids = [...byBill.keys()]
  const { data: bills } = await supabaseService.from('cr_bills').select('id, bill_type, bill_number, title, short_title').in('id', ids)
  const billById = new Map<string, any>(((bills as any[]) || []).map((b) => [b.id, b]))
  return [...byBill.entries()]
    .map(([id, e]) => {
      const b = billById.get(id)
      if (!b) return null
      return {
        label: b.short_title || b.title,
        tag: `${b.bill_type.toUpperCase()} ${b.bill_number}`,
        total: e.total,
        topIndustry: e.top?.label ?? null,
      }
    })
    .filter(Boolean as any as (v: Row | null) => v is Row)
    .sort((a, b) => b.total - a.total)
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
          <div style={{ display: 'flex' }}>FEC receipts</div>
        </div>

        <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, marginTop: 18 }}>Who paid the sponsors</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 680 }}>
            <div style={{ display: 'flex', fontSize: lead && lead.label.length > 30 ? 38 : 48, fontWeight: 700, lineHeight: 1.05 }}>
              {lead?.label || 'No data yet'}
            </div>
            {lead && (
              <div style={{ display: 'flex', fontSize: 18, color: NAVY_2, marginTop: 8, fontFamily: 'monospace' }}>
                {lead.tag}{lead.topIndustry ? ` · most money: ${lead.topIndustry}` : ''}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: AMBER, lineHeight: 1 }}>{fmtMoney(lead?.total || 0)}</div>
            <div style={{ display: 'flex', fontSize: 14, color: NAVY_3, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>
              behind the sponsors
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', height: 2, background: PAPER_2, marginTop: 22, marginBottom: 18 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {rest.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 880 }}>
                <div style={{ display: 'flex', fontSize: 16, fontFamily: 'monospace', color: NAVY_3, width: 64 }}>{r.tag}</div>
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 600 }}>{r.label.slice(0, 46)}</div>
              </div>
              <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: NAVY_2, fontFamily: 'monospace' }}>{fmtMoney(r.total)}</div>
            </div>
          ))}
          {rest.length === 0 && <div style={{ display: 'flex', fontSize: 22, color: NAVY_3 }}>See the full ranking on the site.</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, color: NAVY_2, marginTop: 16 }}>
          <div style={{ display: 'flex' }}>The money behind the bill.</div>
          <div style={{ display: 'flex', fontWeight: 700, color: NAVY }}>campaignreceipts.com/leaderboard</div>
        </div>
      </div>
    ),
    { ...SIZE, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  )
}
