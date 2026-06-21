import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import type { Metadata } from 'next'

// Pro-Israel money tracker. Ranks politicians by money from pro-Israel PACs, kept
// strictly split into SUPPORTED (PAC contributions + super-PAC IEs spent for them)
// vs OPPOSED (super-PAC IEs spent to DEFEAT them). The split is the whole point:
// AIPAC's super PAC (UDP) spends most of its money OPPOSING its targets (Bowman,
// Bush), so counting that as "funding" them would be false and libelous. Data is
// FEC Schedule E + committee contributions. Sourced; no causation asserted.

export const revalidate = 3600
export const metadata: Metadata = {
  title: 'Pro-Israel PAC Money Tracker | Campaign Receipts',
  description: 'Which politicians pro-Israel PACs (AIPAC, UDP, DMFI) spent to elect — and which they spent to defeat. Sourced to FEC independent expenditures and contributions.',
}

const usd = (n: number) => {
  const x = Number(n) || 0
  if (x >= 1e6) return `$${(x / 1e6).toFixed(1)}M`
  if (x >= 1e3) return `$${Math.round(x / 1e3)}K`
  return `$${Math.round(x)}`
}

type Row = {
  candidate_id: string; politician_id: string | null; name: string | null
  office: string | null; state: string | null; party: string | null
  camp: string; supported_usd: number; opposed_usd: number; top_spender: string | null
}

async function getRows(): Promise<Row[]> {
  const { data } = await supabaseService
    .from('cr_pro_israel_money')
    .select('candidate_id, politician_id, name, office, state, party, camp, supported_usd, opposed_usd, top_spender')
    .eq('camp', 'aipac')
  return (data || []) as Row[]
}

// politician slugs for linking
async function getSlugs(ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map()
  const out = new Map<string, string>()
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await supabaseService.from('cr_politicians').select('id, slug').in('id', ids.slice(i, i + 300))
    for (const p of data || []) out.set(p.id, p.slug)
  }
  return out
}

function fmtName(n: string | null) {
  if (!n) return '—'
  // "BOWMAN, JAMAAL REP." → "Jamaal Bowman"
  const clean = n.replace(/\b(REP|SEN|MR|MRS|MS|DR)\.?\b/gi, '').trim()
  const [last, first] = clean.split(',').map((s) => s.trim())
  const tc = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  return first ? `${tc(first)} ${tc(last)}` : tc(clean)
}

export default async function ProIsraelMoneyPage() {
  const rows = await getRows()
  const slugs = await getSlugs(rows.map((r) => r.politician_id).filter(Boolean) as string[])

  const supported = [...rows].filter((r) => r.supported_usd > 0).sort((a, b) => b.supported_usd - a.supported_usd).slice(0, 25)
  const opposed = [...rows].filter((r) => r.opposed_usd > 0).sort((a, b) => b.opposed_usd - a.opposed_usd).slice(0, 25)

  const totalSup = rows.reduce((s, r) => s + r.supported_usd, 0)
  const totalOpp = rows.reduce((s, r) => s + r.opposed_usd, 0)

  const nameCell = (r: Row) => {
    const slug = r.politician_id ? slugs.get(r.politician_id) : null
    const label = `${fmtName(r.name)}${r.party ? ` (${r.party[0]})` : ''}${r.office ? ` · ${r.office === 'S' ? 'Sen' : r.office === 'H' ? 'House' : r.office}-${r.state || ''}` : ''}`
    return slug ? <Link href={`/politician/${slug}`} className="text-primary hover:underline">{label}</Link> : <span className="text-text-main">{label}</span>
  }

  const Table = ({ title, sub, data, field, accent }: { title: string; sub: string; data: Row[]; field: 'supported_usd' | 'opposed_usd'; accent: string }) => (
    <div className="glass-panel p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-display font-bold text-primary">{title}</h2>
        <p className="text-sm text-text-muted">{sub}</p>
      </div>
      <div className="flex flex-col divide-y divide-white/5">
        {data.map((r, i) => (
          <div key={r.candidate_id} className="flex items-center justify-between py-2.5 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs text-text-muted w-5 shrink-0">{i + 1}</span>
              <span className="truncate text-sm">{nameCell(r)}</span>
            </div>
            <div className="text-right shrink-0">
              <div className={`font-display font-bold ${accent}`}>{usd(r[field])}</div>
              {r.top_spender && <div className="text-[10px] font-mono text-text-muted truncate max-w-[160px]">{r.top_spender}</div>}
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="py-8 text-center text-text-muted text-sm">No data yet.</div>}
      </div>
    </div>
  )

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-16 flex flex-col gap-10">
      <div className="flex flex-col gap-4 max-w-3xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">Follow the money</div>
        <h1 className="text-4xl md:text-5xl font-display font-[800] tracking-[-0.03em] text-primary leading-[1.05]">
          Pro-Israel PAC money: who they <span className="text-success">backed</span> and who they <span className="text-warning">targeted</span>
        </h1>
        <p className="text-lg text-text-muted leading-relaxed">
          Pro-Israel PACs — AIPAC&apos;s PAC and its super PAC the United Democracy Project (UDP),
          plus DMFI and U.S. Israel PAC — both fund favored candidates and spend to defeat others.
          We separate the two, because they are not the same thing: money spent <em>against</em> a
          candidate is not support for them.
        </p>
        <div className="flex gap-6 font-mono text-xs text-text-muted">
          <span>Total spent <span className="text-success font-bold">supporting</span>: {usd(totalSup)}</span>
          <span>Total spent <span className="text-warning font-bold">opposing</span>: {usd(totalOpp)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Table title="Most backed" sub="PAC contributions + super-PAC money spent to elect them" data={supported} field="supported_usd" accent="text-success" />
        <Table title="Most targeted" sub="Super-PAC money spent to defeat them" data={opposed} field="opposed_usd" accent="text-warning" />
      </div>

      <div className="text-xs text-text-muted leading-relaxed border-t border-white/5 pt-6 max-w-3xl">
        <p className="mb-2"><strong className="text-text-main">Method.</strong> Figures are from FEC filings: independent expenditures (Schedule E, which records whether money was spent supporting or opposing a candidate) and itemized PAC contributions. &ldquo;Pro-Israel PACs&rdquo; here means UDP, AIPAC PAC, DMFI PAC, and U.S. Israel PAC. J Street PAC (which backs two-state candidates) is tracked separately and not included above.</p>
        <p>Campaign spending is legal and disclosed. The presence of support or opposition spending does not establish that any vote or position was caused by it; donors and PACs typically spend on races where the candidates&apos; existing positions already align with or oppose their goals. We report the documented financial record and invite readers to draw their own conclusions.</p>
      </div>
    </section>
  )
}
