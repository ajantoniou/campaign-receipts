// /api/card/donor?view=big-money|company-money — the viral DONOR LEDGER
// share card. Unlike app/leaderboard/opengraph-image.tsx (a metadata
// image route that does NOT receive query params in Next 14), a normal
// route handler DOES get the Request URL, so this card can actually vary
// by view. This is the screenshot-bait surface a journalist saves:
// big donor name, giant dollar figure, then a stamped list of the exact
// candidates they BACKED (green) or FOUGHT (red), with amounts.
//
// Brand: parchment paper, navy ink, civic-red (fought), green (backed),
// amber accent. 1200x630 — Twitter/X large-summary card size.

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
const RED = '#B23A3A'
const RED_BG = 'rgba(178, 58, 58, 0.12)'
const GREEN = '#2F6B4F'
const GREEN_BG = 'rgba(47, 107, 79, 0.12)'
const AMBER = '#B8862F'

function fmtMoney(n: number): string {
  if (!n) return '$0'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${Math.round(n).toLocaleString()}`
}

type Sponsored = { name: string; amount: number; side: 'backed' | 'fought' }
type Donor = { name: string; affiliation: string | null; total: number; sponsored: Sponsored[] }

async function topDonor(view: 'big-money' | 'company-money'): Promise<Donor | null> {
  if (view === 'big-money') {
    const { data: races } = await supabaseService.from('cr_races').select('top_pacs, candidates').limit(200)
    // Build the set of real candidate names so we can prefer cards that
    // name an actual person (the iconic "fought Cori Bush" receipt) over
    // vague targets like "Two TX seats".
    const realNames = new Set<string>()
    for (const r of (races as any[]) || []) {
      for (const c of r.candidates || []) {
        if (c?.name) realNames.add(String(c.name).toLowerCase())
      }
    }
    const byPac = new Map<string, Donor>()
    for (const r of (races as any[]) || []) {
      for (const pac of r.top_pacs || []) {
        if (!pac?.name || !pac?.total_usd) continue
        const key = String(pac.name).trim()
        const row: Donor = byPac.get(key) || { name: key, affiliation: pac.affiliation ?? null, total: 0, sponsored: [] }
        row.total += Number(pac.total_usd) || 0
        const target = String(pac.target_candidate || '').trim()
        if (target && target.toLowerCase() !== 'multi-race') {
          row.sponsored.push({
            name: target,
            amount: Number(pac.total_usd) || 0,
            side: typeof pac.support_oppose === 'string' && pac.support_oppose.startsWith('against') ? 'fought' : 'backed',
          })
        }
        byPac.set(key, row)
      }
    }
    // Headline the card on a donor with NAMED targets (the receipts), not
    // a "Multi-race" line that would render an empty name list. Fall back
    // to raw total only if nothing has named targets.
    const all = [...byPac.values()]
    const namesPerson = (d: Donor) => d.sponsored.some((s) => realNames.has(s.name.toLowerCase()))
    const withPerson = all.filter(namesPerson).sort((a, b) => b.total - a.total)
    const withAnyName = all.filter((d) => d.sponsored.length > 0).sort((a, b) => b.total - a.total)
    return withPerson[0] || withAnyName[0] || all.sort((a, b) => b.total - a.total)[0] || null
  }

  const { data } = await supabaseService
    .from('cr_top_donors')
    .select('donor_name, total_contributed, industry_label, politician_id')
    .limit(20000)
  const ARTIFACTS = new Set(['retired', 'self', 'self employed', 'self-employed', 'homemaker', 'not employed', 'none', 'information requested', 'information requested per best efforts', 'requested', 'n/a'])
  const polsQ = await supabaseService.from('cr_politicians').select('id, name').limit(2000)
  const polById = new Map<string, string>()
  for (const p of ((polsQ.data as any[]) || [])) polById.set(p.id, p.name)
  const map = new Map<string, { total: number; pols: Map<string, number> }>()
  for (const d of (data as any[]) || []) {
    const raw = String(d.donor_name || '').trim()
    if (!raw || ARTIFACTS.has(raw.toLowerCase()) || isFecArtifact(d.industry_label)) continue
    const e = map.get(raw) || { total: 0, pols: new Map<string, number>() }
    e.total += Number(d.total_contributed) || 0
    e.pols.set(d.politician_id, (e.pols.get(d.politician_id) || 0) + (Number(d.total_contributed) || 0))
    map.set(raw, e)
  }
  const rows = [...map.entries()]
    .map(([name, e]) => ({
      name,
      affiliation: null as string | null,
      total: e.total,
      sponsored: [...e.pols.entries()]
        .map(([pid, amt]) => ({ name: polById.get(pid) || 'Unknown', amount: amt, side: 'backed' as const }))
        .sort((a, b) => b.amount - a.amount),
      reach: e.pols.size,
    }))
    .filter((r) => r.reach >= 2)
    .sort((a, b) => b.reach - a.reach || b.total - a.total)
  return rows[0] || null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const view = url.searchParams.get('view') === 'company-money' ? 'company-money' : 'big-money'
  const isBig = view === 'big-money'
  const donor = await topDonor(view)
  const sponsored = (donor?.sponsored || []).slice(0, 5)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: PAPER,
          padding: '48px 56px',
          fontFamily: 'serif',
          color: NAVY,
          borderLeft: `10px solid ${AMBER}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts · Follow the money</div>
          <div style={{ display: 'flex' }}>FEC receipts</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 700 }}>
            <div style={{ display: 'flex', fontSize: donor && donor.name.length > 26 ? 44 : 56, fontWeight: 700, lineHeight: 1.02 }}>
              {donor?.name || 'No data yet'}
            </div>
            {donor?.affiliation && (
              <div style={{ display: 'flex', fontSize: 18, color: NAVY_2, marginTop: 8, fontFamily: 'monospace' }}>{donor.affiliation}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: AMBER, lineHeight: 1 }}>{fmtMoney(donor?.total || 0)}</div>
            <div style={{ display: 'flex', fontSize: 14, color: NAVY_3, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>
              {isBig ? 'spent on races' : 'across campaigns'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', height: 2, background: PAPER_2, marginTop: 22, marginBottom: 18 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {sponsored.map((s, i) => {
            const fought = s.side === 'fought'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 15,
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: fought ? RED : GREEN,
                      background: fought ? RED_BG : GREEN_BG,
                      border: `1px solid ${fought ? RED : GREEN}`,
                      borderRadius: 4,
                      padding: '4px 10px',
                      width: 92,
                      justifyContent: 'center',
                    }}
                  >
                    {fought ? 'fought' : 'backed'}
                  </div>
                  <div style={{ display: 'flex', fontSize: 30, fontWeight: 600 }}>{s.name}</div>
                </div>
                <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: NAVY_2, fontFamily: 'monospace' }}>{fmtMoney(s.amount)}</div>
              </div>
            )
          })}
          {sponsored.length === 0 && (
            <div style={{ display: 'flex', fontSize: 22, color: NAVY_3 }}>See the full money trail on the site.</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, color: NAVY_2, marginTop: 16 }}>
          <div style={{ display: 'flex' }}>Money the candidate never touches.</div>
          <div style={{ display: 'flex', fontWeight: 700, color: NAVY }}>campaignreceipts.com/leaderboard</div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    },
  )
}
