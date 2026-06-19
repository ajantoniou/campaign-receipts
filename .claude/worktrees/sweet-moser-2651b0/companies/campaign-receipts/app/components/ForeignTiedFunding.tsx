// ForeignTiedFunding — compact server component that surfaces any
// foreign-donor records linked to a specific politician.
//
// Renders nothing when zero records (so politician pages without
// surface-able foreign-tied funding stay clean). When records exist,
// renders a paper card with category-tagged rows + link to the full
// /foreign-donors page for context.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import { Tag } from '@/app/components/cr'

type Row = {
  id: string
  category: 'illegal_contribution' | 'fara_registrant' | 'foreign_soe_employee' | 'foreign_policy_pac'
  donor_name: string
  donor_origin_country: string | null
  donor_origin_code: string | null
  amount_usd: number | null
  cycle: string | null
  source_url: string
  source_publication: string | null
  source_type: string
  short_summary: string
  outcome: string | null
}

const CATEGORY_LABEL: Record<Row['category'], string> = {
  illegal_contribution: 'Illegal contribution',
  fara_registrant: 'FARA-registered lobbyist',
  foreign_soe_employee: 'Foreign-SOE employee',
  foreign_policy_pac: 'Foreign-policy-aligned PAC',
}

function flagEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return ''
  const A = 'A'.charCodeAt(0)
  const RIS_A = 0x1F1E6
  const cc = code.toUpperCase()
  return String.fromCodePoint(
    cc.charCodeAt(0) - A + RIS_A,
    cc.charCodeAt(1) - A + RIS_A,
  )
}

function fmtUSD(n: number | null): string {
  if (n == null || !isFinite(n)) return ''
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n)}`
}

export default async function ForeignTiedFunding({ politicianId, politicianLastName }: { politicianId: string; politicianLastName: string }) {
  const { data } = await supabaseService
    .from('cr_foreign_donor_records')
    .select('id, category, donor_name, donor_origin_country, donor_origin_code, amount_usd, cycle, source_url, source_publication, source_type, short_summary, outcome')
    .eq('politician_id', politicianId)
    .order('amount_usd', { ascending: false, nullsFirst: false })
    .limit(5)

  const rows = (data as Row[]) || []
  if (rows.length === 0) return null

  return (
    <section className="section-shell py-12 border-t border-line bg-paper-2">
      <div className="max-w-[760px] mx-auto mb-5 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
            Investigation · Foreign-tied funding
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            Foreign-tied funding linked to {politicianLastName}.
          </h2>
          <p className="mt-2 font-sans text-[14px] text-ink-2 leading-relaxed">
            {rows.length} record{rows.length === 1 ? '' : 's'} from the foreign-donors investigation
            on file for this politician. Every row links to a government-database primary source.
          </p>
        </div>
        <Link
          href="/foreign-donors"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:underline underline-offset-4 decoration-line hover:decoration-ink shrink-0"
        >
          See full investigation →
        </Link>
      </div>

      <div className="max-w-[760px] mx-auto space-y-3">
        {rows.map((r) => (
          <article key={r.id} className="rounded-lg border border-line bg-paper p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Tag>{CATEGORY_LABEL[r.category]}</Tag>
                {r.donor_origin_code && (
                  <span className="font-display text-[18px] leading-none" aria-label={`Origin: ${r.donor_origin_country}`}>
                    {flagEmoji(r.donor_origin_code)}
                  </span>
                )}
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
                  {r.donor_origin_country}
                </span>
              </div>
              <div className="font-display text-[18px] leading-[1.2] text-ink">{r.donor_name}</div>
              <p className="mt-1.5 font-sans text-[14px] text-ink-2 leading-relaxed">
                {r.short_summary}
              </p>
              <a
                href={r.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                {r.source_publication || 'Primary source'} →
              </a>
            </div>
            <div className="shrink-0 text-right">
              {r.amount_usd != null && (
                <div className="font-display text-[22px] leading-none text-ink tabular-nums tracking-[-0.005em]">
                  {fmtUSD(r.amount_usd)}
                </div>
              )}
              {r.cycle && (
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                  cycle {r.cycle}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
