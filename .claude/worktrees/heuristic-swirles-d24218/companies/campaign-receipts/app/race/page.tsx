// /race — Active Campaign Races index.
//
// Per founder rev-7 batch C+ (2026-05-17): "no body care about old
// races, i would remove those, and if anything add upcoming elections
// or Active Campaign Races and show the candidates and their donors
// for free."
//
// Pivot: this surface was originally /race post-mortems for MO-01 and
// NY-16 2024. Both pages deleted. New surface is forward-looking only.
// Data lives in cr_races (seeded with KY-04 2026-05-19 as marquee,
// plus TX runoff and CA statewide as stubs). A nightly cron will
// repopulate IE figures from FEC and flip is_active=false the day
// after each primary, so this page is self-maintaining.
//
// Per founder: candidates and their donor data are FREE on this surface.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Campaign Finance by Race — who funds the 2026 races | CampaignReceipts',
  description:
    'Who funds every U.S. House, Senate, governor, and statewide race — live super PAC spending and candidate donor data. Free, primary-source, party-blind.',
  alternates: { canonical: '/race' },
  openGraph: {
    title: 'Campaign Finance by Race · CampaignReceipts',
    description:
      'Who funds the 2026 races — live super PAC spending and candidate donor data. Free.',
  },
}

type Race = {
  slug: string
  race_type: string
  state: string | null
  district: string | null
  cycle: string
  primary_date: string | null
  election_date: string | null
  headline: string
  blurb: string | null
  candidates: Candidate[]
  total_ie_usd: number | null
  total_spend_usd: number | null
  top_pacs: TopPac[]
  is_active: boolean
}

type Candidate = {
  slug?: string
  name: string
  party: string
  incumbent?: boolean
  endorsed_by?: string[]
  ie_for_usd?: number
  ie_against_usd?: number
  campaign_raised_usd?: number
  polling_pct?: number | null
  notes?: string | null
}

type TopPac = {
  name: string
  affiliation: string
  total_usd: number
  support_oppose: string
  target_candidate?: string
}

async function getActiveRaces(): Promise<Race[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabaseService
    .from('cr_races')
    .select('*')
    .eq('is_active', true)
    .or(`primary_date.gte.${today},election_date.gte.${today},primary_date.is.null`)
    .order('primary_date', { ascending: true, nullsFirst: false })
  return ((data as Race[]) || [])
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${n.toLocaleString()}`
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T12:00:00Z').getTime()
  const now = Date.now()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function partyTintCls(party: string): string {
  if (party === 'Republican') return 'bg-broken/[0.08] text-broken border-broken/30'
  if (party === 'Democratic') return 'bg-pending/[0.08] text-pending border-pending/30'
  if (party === 'Independent') return 'bg-kept/[0.08] text-kept border-kept/30'
  return 'bg-paper-3 text-ink-2 border-line'
}

export default async function RaceIndexPage() {
  const races = await getActiveRaces()
  const totalActiveIE = races.reduce((sum, r) => sum + (Number(r.total_ie_usd) || 0), 0)

  return (
    <>
      {/* ───── MASTHEAD ──────────────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors mb-6"
          >
            ← Home
          </Link>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3 inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
            Active campaign races · live
          </div>
          <h1 className="font-display text-[44px] sm:text-[60px] leading-[0.96] tracking-[-0.015em] text-ink text-balance m-0 max-w-3xl">
            The races. The candidates. The donors. Free.
          </h1>
          <p className="mt-5 font-sans text-[17px] text-ink-2 leading-[1.55] max-w-2xl">
            Upcoming U.S. primaries and general elections with live super
            PAC spending and candidate donor data — pulled from FEC
            filings, kept current as new reports land. Free for everyone.
            Free forever.
          </p>
          <div className="mt-7 flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-[44px] sm:text-[56px] tabular-nums tracking-[-0.01em] text-broken leading-none">
              {fmtMoney(totalActiveIE)}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Outside-money IE across {races.length} active race{races.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>

      {/* ───── RACE LIST ─────────────────────────────────────── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-12 sm:py-16">
          <div className="max-w-[1100px] mx-auto">
            {races.length === 0 && (
              <div className="rounded-lg border border-line bg-paper-2 p-12 text-center">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-3">
                  Between cycles
                </div>
                <p className="font-sans text-[15px] text-ink-2 leading-relaxed max-w-md mx-auto m-0">
                  No active primaries on file right now. We add the next
                  round as filings land.
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {races.map((r) => {
                const days = daysUntil(r.primary_date || r.election_date)
                const isImminent = days !== null && days <= 7 && days >= 0
                return (
                  <Link
                    key={r.slug}
                    href={`/race/${r.slug}`}
                    className={`block rounded-lg border bg-paper hover:bg-paper-2 transition-all p-6 no-underline group ${
                      isImminent
                        ? 'border-2 border-broken/40 hover:border-broken'
                        : 'border-line hover:border-ink-3'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
                        {r.district || r.state || '—'} · {fmtDate(r.primary_date || r.election_date)}
                      </div>
                      {days !== null && days >= 0 && (
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border ${
                            isImminent
                              ? 'bg-broken/[0.10] text-broken border-broken/30'
                              : 'bg-paper-3 text-ink-2 border-line'
                          }`}
                        >
                          {days === 0 ? 'Today' : `In ${days}d`}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-[24px] sm:text-[28px] leading-[1.05] tracking-[-0.005em] text-ink m-0 mb-3">
                      {r.headline}
                    </h2>
                    {r.blurb && (
                      <p className="font-sans text-[14px] text-ink-2 leading-[1.55] m-0 mb-4">
                        {r.blurb.length > 220 ? r.blurb.slice(0, 217) + '…' : r.blurb}
                      </p>
                    )}

                    {/* Candidate chips */}
                    {r.candidates.length > 0 && (
                      <div className="pt-3 border-t border-dotted border-line space-y-2 mb-3">
                        {r.candidates.map((c, i) => (
                          <div key={i} className="flex items-baseline justify-between gap-2 flex-wrap">
                            <div className="flex items-baseline gap-2 min-w-0">
                              <span className="font-sans text-[13px] font-medium text-ink truncate">
                                {c.name}
                              </span>
                              <span
                                className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded border shrink-0 ${partyTintCls(c.party)}`}
                              >
                                {c.party[0]}
                                {c.incumbent ? ' · inc' : ''}
                              </span>
                            </div>
                            {c.ie_for_usd != null && c.ie_for_usd > 0 && (
                              <span className="font-mono text-[10px] tabular-nums text-kept shrink-0">
                                +{fmtMoney(c.ie_for_usd)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Spend totals */}
                    {(r.total_ie_usd != null || r.total_spend_usd != null) && (
                      <div className="pt-3 border-t border-dotted border-line flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em]">
                        <span className="text-ink-3">
                          {r.total_ie_usd != null && (
                            <>
                              IE total: <span className="text-broken tabular-nums">{fmtMoney(r.total_ie_usd)}</span>
                            </>
                          )}
                        </span>
                        <span className="text-ink-3">
                          {r.total_spend_usd != null && (
                            <>
                              All-in: <span className="text-ink tabular-nums">{fmtMoney(r.total_spend_usd)}</span>
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink group-hover:text-broken transition-colors">
                      Open race receipt →
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ───── METHODOLOGY ───────────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell py-12">
          <div className="max-w-[760px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
              How this page works
            </div>
            <ul className="m-0 p-0 list-none space-y-3 font-sans text-[15px] text-ink-2 leading-[1.55]">
              <li>
                <strong className="text-ink">Active only.</strong> Once a
                primary or general date passes, the race auto-archives
                from this index. No retrospectives clutter the live view.
              </li>
              <li>
                <strong className="text-ink">FEC-sourced.</strong> IE
                figures come from FEC independent-expenditure filings.
                Each race page lists the specific FEC committee IDs and
                publication date of each source we cite.
              </li>
              <li>
                <strong className="text-ink">Free, always.</strong>{' '}
                Candidate and donor data on active races is part of the
                public-interest tier and stays free even after CR's Pro
                surfaces (correlation engines, exports, alerts) go live.
              </li>
              <li>
                <strong className="text-ink">Nonpartisan by construction.</strong>{' '}
                We surface IE money flows regardless of which side the
                spending favors. The same standard applies to intra-party
                primaries (e.g. Trump-aligned PACs against incumbent
                Republicans) and inter-party general elections.
              </li>
            </ul>
          </div>
        </div>
      </section>

    </>
  )
}
