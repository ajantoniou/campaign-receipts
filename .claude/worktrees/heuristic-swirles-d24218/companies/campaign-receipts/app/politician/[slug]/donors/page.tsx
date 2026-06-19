// Real FEC donor view. Replaces the stub. Pulls from cr_campaign_finance
// + cr_top_donors + cr_industry_breakdown. Sortable by amount, employer,
// or rank. If no FEC data exists yet, falls back to the "Sync queued"
// message and links to /methodology for context.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseService, type Politician } from '@/lib/supabase'
import { ArrowLeft, Database, ExternalLink, Building2, User } from 'lucide-react'
import { isFecArtifact } from '@/lib/fec-industry'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Cycle = '2024' | '2022' | '2020'

type CampaignFinance = {
  fec_candidate_id: string
  cycle: string
  total_raised: number | null
  total_spent: number | null
  cash_on_hand: number | null
  individual_pct: number | null
  pac_pct: number | null
  self_funded_pct: number | null
  large_donor_pct: number | null
  last_synced_at: string | null
}

type TopDonor = {
  id: string
  rank: number
  donor_name: string
  donor_employer: string | null
  donor_occupation: string | null
  total_contributed: number | null
  is_pac: boolean
  is_individual: boolean
  industry_label: string | null
}

type IndustryRow = {
  industry_label: string
  total_contributions: number | null
  rank: number | null
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('name')
    .eq('slug', params.slug)
    .single()
  if (!data) return { title: 'Donors — CampaignReceipts' }
  return {
    title: `${(data as any).name} — donors | CampaignReceipts`,
    description: 'Where the campaign money came from — FEC data for federal candidates, sortable by amount and industry.',
  }
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString()}`
}

function profileBadge(p: string | null | undefined) {
  if (!p || p === 'unknown') return null
  const tone =
    p === 'grassroots'
      ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
      : p === 'corporate'
        ? 'bg-rose-500/10 text-rose-300 ring-rose-500/30'
        : p === 'self-funded'
          ? 'bg-amber-500/10 text-amber-300 ring-amber-500/30'
          : 'bg-ink-800 text-ink-300 ring-ink-700'
  return (
    <span className={`text-[11px] font-mono uppercase tracking-wider rounded-full px-2 py-0.5 ring-1 ${tone}`}>
      {p}
    </span>
  )
}

export default async function DonorsPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { cycle?: string; sort?: string }
}) {
  const cycle = (searchParams.cycle as Cycle) || '2024'
  const sort = (searchParams.sort as 'amount' | 'rank' | 'name') || 'amount'

  const { data: pol } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('slug', params.slug)
    .single()
  if (!pol) notFound()
  const politician = pol as Politician & { fec_candidate_id?: string; donor_profile?: string }

  const [finanaceQ, donorsQ, indsQ] = await Promise.all([
    supabaseService
      .from('cr_campaign_finance')
      .select('*')
      .eq('politician_id', politician.id)
      .eq('cycle', cycle)
      .maybeSingle(),
    supabaseService
      .from('cr_top_donors')
      .select('id, rank, donor_name, donor_employer, donor_occupation, total_contributed, is_pac, is_individual, industry_label')
      .eq('politician_id', politician.id)
      .eq('cycle', cycle)
      .order(
        sort === 'amount' ? 'total_contributed' : sort === 'name' ? 'donor_name' : 'rank',
        { ascending: sort !== 'amount' && sort !== 'rank' ? true : sort === 'rank' },
      ),
    supabaseService
      .from('cr_industry_breakdown')
      .select('industry_label, total_contributions, rank')
      .eq('politician_id', politician.id)
      .eq('cycle', cycle)
      .order('rank'),
  ])

  const finance = (finanaceQ.data as CampaignFinance | null) || null
  const donors = ((donorsQ.data as TopDonor[]) || [])
  const industries = ((indsQ.data as IndustryRow[]) || [])

  const hasData = !!finance

  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-12 pb-8">
          <Link href={`/politician/${politician.slug}`} className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
            <ArrowLeft className="size-3.5" />
            Back to {politician.name}
          </Link>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <div className="eyebrow">FEC campaign finance</div>
            {profileBadge(politician.donor_profile)}
          </div>
          <h1 className="text-display-md text-ink-50">
            {politician.name} — who funded the campaign
          </h1>
          <p className="mt-3 text-ink-400 max-w-2xl text-[15px]">
            Public Federal Election Commission data, aggregated by contributor. Click a column header to re-sort. See <Link href="/methodology#donor-classification" className="text-amber-400 underline-offset-4 hover:underline">our methodology</Link> for how we classify donor profiles.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm">
            {(['2024', '2022', '2020'] as Cycle[]).map((c) => (
              <Link
                key={c}
                href={`/politician/${politician.slug}/donors?cycle=${c}${sort !== 'amount' ? `&sort=${sort}` : ''}`}
                className={`px-3 py-1.5 rounded-md transition-colors ${cycle === c ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' : 'text-ink-400 hover:text-ink-200 hover:bg-ink-900/60'}`}
              >
                {c} cycle
              </Link>
            ))}
          </div>
        </div>
      </section>

      {!hasData ? (
        <article className="section-shell py-12">
          <div className="rounded-xl ring-1 ring-amber-500/20 bg-amber-500/5 p-8 text-center max-w-2xl mx-auto">
            <Database className="size-8 text-amber-400 mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold text-ink-50">No FEC data for this politician yet</h2>
            <p className="mt-3 text-sm text-ink-300 leading-relaxed">
              The FEC sync runs on a rolling basis against the directory&rsquo;s most-visited politicians first. State and local candidates aren&rsquo;t covered (the FEC only regulates federal races). Check back, or read <Link href="/methodology#donor-classification" className="text-amber-300 underline-offset-4 hover:underline">how we classify donor profiles</Link>.
            </p>
          </div>
        </article>
      ) : (
        <article className="section-shell py-10 space-y-10">
          {/* Top stats */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl ring-1 ring-ink-800/80 bg-ink-800/60">
            <Stat label="Total raised" value={fmtMoney(finance!.total_raised)} accent="emerald" />
            <Stat label="From individuals" value={`${Math.round(finance!.individual_pct ?? 0)}%`} accent="emerald" />
            <Stat label="From PACs" value={`${Math.round(finance!.pac_pct ?? 0)}%`} accent="rose" />
            <Stat label="Self-funded" value={`${Math.round(finance!.self_funded_pct ?? 0)}%`} accent="amber" />
          </section>

          {industries.length > 0 && (
            <section>
              <div className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="eyebrow">Industry rollup (from top 20)</div>
                  {finance?.last_synced_at && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
                      Updated {new Date(finance.last_synced_at).toISOString().slice(0, 10)} · source: FEC
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-xl font-semibold text-ink-50 tracking-tight">Where the money clusters</h2>
                <p className="mt-2 text-xs text-ink-400 leading-relaxed max-w-2xl">
                  FEC classifies unitemized contributions and retiree donations under generic buckets
                  ("Individual / Retired"). These are not real industries — we surface them for
                  transparency but exclude them from top-industry summaries elsewhere on the site.
                </p>
              </div>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {industries.map((row) => {
                  const artifact = isFecArtifact(row.industry_label)
                  return (
                    <li
                      key={row.industry_label}
                      className={`rounded-lg ring-1 p-4 ${
                        artifact
                          ? 'ring-ink-800/40 bg-ink-900/20'
                          : 'ring-ink-800/80 bg-ink-900/40'
                      }`}
                    >
                      <div className="text-sm text-ink-200">
                        {row.industry_label}
                        {artifact && (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-ink-500 font-mono">
                            FEC unitemized
                          </span>
                        )}
                      </div>
                      <div className={`mt-1 text-lg font-bold tabular-nums ${artifact ? 'text-ink-400' : 'text-amber-300'}`}>
                        {fmtMoney(row.total_contributions)}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Sortable donor list */}
          <section>
            <div className="mb-4 flex items-end justify-between flex-wrap gap-3">
              <div>
                <div className="eyebrow">Top contributors</div>
                <h2 className="mt-1 text-xl font-semibold text-ink-50 tracking-tight">{donors.length} contributors aggregated by name + employer</h2>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-ink-500 mr-2">Sort by</span>
                {(['amount', 'rank', 'name'] as const).map((s) => (
                  <Link
                    key={s}
                    href={`/politician/${politician.slug}/donors?cycle=${cycle}&sort=${s}`}
                    className={`px-2.5 py-1 rounded-md transition-colors ${sort === s ? 'bg-ink-800 text-ink-100 ring-1 ring-ink-700' : 'text-ink-400 hover:text-ink-200 hover:bg-ink-900/60'}`}
                  >
                    {s === 'amount' ? 'Amount' : s === 'rank' ? 'FEC rank' : 'Name'}
                  </Link>
                ))}
              </div>
            </div>

            <ol className="divide-y divide-ink-800/60 rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 overflow-hidden">
              {donors.map((d) => (
                <li key={d.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-[11px] font-mono text-ink-600 w-6 tabular-nums shrink-0">#{d.rank}</span>
                  <div className="shrink-0">
                    {d.is_pac ? (
                      <Building2 className="size-4 text-rose-400" strokeWidth={2} />
                    ) : (
                      <User className="size-4 text-emerald-400" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-200 truncate">{d.donor_name}</div>
                    {(d.donor_employer || d.donor_occupation) && (
                      <div className="text-[11px] text-ink-500 truncate">
                        {[d.donor_employer, d.donor_occupation].filter(Boolean).join(' · ')}
                        {d.industry_label && <span className="ml-2 text-amber-400/80">[{d.industry_label}]</span>}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold tabular-nums text-emerald-400">{fmtMoney(d.total_contributed)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="text-xs text-ink-500 leading-relaxed max-w-2xl">
            Data source: FEC OpenAPI v1 (<a className="text-ink-400 hover:text-ink-200" href={`https://www.fec.gov/data/candidate/${finance!.fec_candidate_id}/`} target="_blank" rel="noopener noreferrer">FEC candidate {finance!.fec_candidate_id} <ExternalLink className="inline size-3 align-baseline" /></a>). Aggregated by contributor name + employer to deduplicate. The <strong className="text-ink-200">individual / PAC / self-funded</strong> breakdown is computed from the candidate&rsquo;s reported totals; the <strong className="text-ink-200">industry rollup</strong> uses a keyword classifier on contributor employer + occupation fields (small, conservative — false-positives hurt credibility more than missing tags). Last synced {finance!.last_synced_at ? new Date(finance!.last_synced_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'unknown'}.
          </section>
        </article>
      )}

    </>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: 'emerald' | 'rose' | 'amber' }) {
  const color = accent === 'emerald' ? 'text-emerald-400' : accent === 'rose' ? 'text-rose-400' : 'text-amber-400'
  return (
    <div className="bg-ink-950 p-5 sm:p-6">
      <div className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${color}`}>{value}</div>
      <div className="mt-1.5 text-[11px] uppercase tracking-wider font-semibold text-ink-500">{label}</div>
    </div>
  )
}
