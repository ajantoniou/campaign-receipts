// /dual-citizenship — standalone journalistic explainer page.
//
// Per founder rev-6 pivot: don't flag politician profiles directly
// (identity-coding risk); instead build a dedicated page that treats
// dual-citizenship as the topic being audited. Every row has a
// primary-source URL or it doesn't ship.
//
// Schema-backed (cr_citizenships joined to cr_politicians + donor
// rollups). Country filter via ?country=XX query param.

import Link from 'next/link'
import { supabaseService, type Politician } from '@/lib/supabase'
import { Tag, partyVariant } from '@/app/components/cr'
import CompRequestForm from '@/app/components/CompRequestForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Dual citizenship in U.S. politics — CampaignReceipts',
  description:
    'Which U.S. politicians hold dual citizenship — what the politician said publicly, what reputable journalism reported, and who funded their campaign. Every row requires a primary-source URL.',
}

type CitizenshipRow = {
  citizenship_id: string
  country_code: string
  country_name: string
  source_type: string
  source_url: string
  source_publication: string | null
  source_date: string | null
  source_quote: string | null
  notes: string | null
  disputed: boolean
  dispute_url: string | null
  politician_id: string
  politician_slug: string
  politician_name: string
  party: string
  branch: string
  state: string
  current_status: string | null
  professional_background: string | null
}

type TopDonor = {
  politician_id: string
  donor_name: string
  total_contributed: number
  is_pac: boolean
  cycle: string
}

type TopIndustry = {
  politician_id: string
  industry_label: string
  total_contributions: number
  cycle: string
}

// ISO 3166-1 alpha-2 → emoji flag. Works for all valid 2-letter codes
// via regional-indicator-symbol math. No country whitelist needed.
function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳'
  const cc = countryCode.toUpperCase()
  const A = 'A'.charCodeAt(0)
  const RIS_A = 0x1F1E6
  return String.fromCodePoint(
    cc.charCodeAt(0) - A + RIS_A,
    cc.charCodeAt(1) - A + RIS_A,
  )
}

function sourceTypeLabel(t: string): { label: string; tone: 'kept' | 'partial' | 'broken' | 'pending' } {
  switch (t) {
    case 'self_disclosed': return { label: 'Self-disclosed', tone: 'kept' }
    case 'official_record': return { label: 'Official record', tone: 'kept' }
    case 'court_filing': return { label: 'Court filing', tone: 'kept' }
    case 'reputable_journalism': return { label: 'Press-reported', tone: 'partial' }
    case 'debunked_by_factcheck': return { label: 'Debunked by fact-check', tone: 'broken' }
    default: return { label: t, tone: 'pending' }
  }
}

function isDebunked(t: string): boolean {
  return t === 'debunked_by_factcheck'
}

function fmtUSD(n: number | null | undefined): string {
  if (!n || !isFinite(n)) return 'n/a'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n)}`
}

async function getData(country?: string): Promise<{
  rows: CitizenshipRow[]
  donorsById: Map<string, TopDonor>
  industryById: Map<string, TopIndustry>
  countries: { code: string; name: string; count: number }[]
}> {
  // Pull every citizenship row joined to politician.
  // Sub-2-digit n at launch so we don't need pagination yet.
  let citizenshipQuery = supabaseService
    .from('cr_citizenships')
    .select(`
      id, country_code, country_name, source_type, source_url, source_publication,
      source_date, source_quote, notes, disputed, dispute_url, politician_id,
      politician:cr_politicians!inner ( id, slug, name, party, branch, state, current_status, professional_background )
    `)
    .order('country_name')

  if (country && /^[a-z]{2}$/.test(country)) {
    citizenshipQuery = citizenshipQuery.eq('country_code', country)
  }

  const { data: cz } = await citizenshipQuery
  const flat: CitizenshipRow[] = ((cz as any[]) || []).map((r) => ({
    citizenship_id: r.id,
    country_code: r.country_code,
    country_name: r.country_name,
    source_type: r.source_type,
    source_url: r.source_url,
    source_publication: r.source_publication,
    source_date: r.source_date,
    source_quote: r.source_quote,
    notes: r.notes,
    disputed: r.disputed,
    dispute_url: r.dispute_url,
    politician_id: r.politician.id,
    politician_slug: r.politician.slug,
    politician_name: r.politician.name,
    party: r.politician.party,
    branch: r.politician.branch,
    state: r.politician.state,
    current_status: r.politician.current_status,
    professional_background: r.politician.professional_background,
  }))

  // Donor rollups for the involved politicians.
  const politicianIds = Array.from(new Set(flat.map((r) => r.politician_id)))
  let donorsById = new Map<string, TopDonor>()
  let industryById = new Map<string, TopIndustry>()
  if (politicianIds.length > 0) {
    const [donorsResp, industryResp] = await Promise.all([
      supabaseService
        .from('cr_top_donors')
        .select('politician_id, donor_name, total_contributed, is_pac, cycle, rank')
        .in('politician_id', politicianIds)
        .eq('rank', 1),
      supabaseService
        .from('cr_industry_breakdown')
        .select('politician_id, industry_label, total_contributions, cycle, rank')
        .in('politician_id', politicianIds)
        .eq('rank', 1),
    ])
    for (const d of (donorsResp.data as any[]) || []) {
      donorsById.set(d.politician_id, d as TopDonor)
    }
    for (const i of (industryResp.data as any[]) || []) {
      industryById.set(i.politician_id, i as TopIndustry)
    }
  }

  // Country aggregate (independent of filter — always show all countries
  // in the filter dropdown).
  const { data: allCz } = await supabaseService
    .from('cr_citizenships')
    .select('country_code, country_name')
  const ccMap = new Map<string, { name: string; count: number }>()
  for (const r of (allCz as any[]) || []) {
    const k = r.country_code
    if (!ccMap.has(k)) ccMap.set(k, { name: r.country_name, count: 0 })
    ccMap.get(k)!.count++
  }
  const countries = Array.from(ccMap, ([code, v]) => ({ code, name: v.name, count: v.count }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { rows: flat, donorsById, industryById, countries }
}

export default async function DualCitizenshipPage({
  searchParams,
}: {
  searchParams: { country?: string }
}) {
  const country = (searchParams.country || '').toLowerCase()
  const { rows, donorsById, industryById, countries } = await getData(country || undefined)

  return (
    <>
      {/* ───── MASTHEAD ───────────────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
              Investigation · Open dossier
            </div>
            <h1 className="font-display text-[44px] sm:text-[60px] leading-[0.96] tracking-[-0.01em] text-ink text-balance">
              Dual citizenship in U.S. politics.
            </h1>
            <p className="mt-5 font-sans text-[17px] text-ink-2 leading-relaxed max-w-2xl">
              Which sitting and former U.S. politicians hold a second citizenship — what they
              said publicly, what reputable journalism reported, and who funded their campaign.
              Every row on this page requires a primary-source URL.
            </p>
          </div>
        </div>
      </section>

      {/* ───── EXPLAINER ─────────────────────────────────────── */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            Why this page exists
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            A topic where most of what circulates online is wrong.
          </h2>
          <div className="mt-5 space-y-4 font-sans text-[15px] text-ink-2 leading-relaxed">
            <p>
              U.S. members of Congress are not required to disclose foreign citizenship on
              financial-disclosure filings, and the federal government does not maintain a
              public list. That gap is filled mostly by viral social-media claims, partisan
              roundups, and assertions that rarely cite primary sources.
            </p>
            <p>
              Snopes <a
                href="https://www.snopes.com/news/2024/02/05/dual-citizenship-elected-representatives/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >surveyed several circulating lists in 2024</a> and concluded most are
              unreliable. The common pattern: a politician was born to immigrant parents from
              country X, the country X consulate reportedly considers them a citizen by descent,
              and an online list converts that into "Member of Congress X holds dual
              citizenship." Many of those countries don't permit dual citizenship at all
              (India, Japan, China, Somalia). Others require the holder to actively maintain
              it; many haven't.
            </p>
            <p>
              <strong className="font-medium text-ink">Our discipline on this page:</strong>{' '}
              every row links to one of (a) the politician's own public statement, (b)
              reporting by a reputable outlet, or (c) an official record (naturalization,
              court filing, government-issued retention permit). No row appears without a
              source URL. Where the politician has denied or declined to confirm, the page
              says so.
            </p>
            <p>
              The donor columns are the editorial reason this is one page instead of a
              checkbox: foreign citizenship is one transparency dimension; campaign-finance
              concentration is another. Reading them next to each other is the journalism.
            </p>
          </div>
        </div>
      </section>

      {/* ───── FILTER + TABLE ──────────────────────────────────
          Two-tier rendering per rev-7 founder + research-agent finding:
          - Confirmed: self-disclosed / official-record / court filing
          - Debunked: politicians commonly alleged as dual-citizen whose
            claims have been explicitly rejected by tier-1 fact-checkers
            (PolitiFact, JTA, Snopes). Renders BELOW confirmed so the
            corrective journalism is the page's editorial frame, not
            amplifying the genre. */}
      {(() => null)()}
      {/* eslint-disable @typescript-eslint/no-unused-expressions */}
      <section className="section-shell py-12 sm:py-16">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-kept mb-2">
              Confirmed
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
              {rows.filter((r) => !isDebunked(r.source_type)).length} politicians with verified dual citizenship
              {country ? ` · filtered to ${flagEmoji(country)} ${(countries.find((c) => c.code === country)?.name) || country.toUpperCase()}` : ''}
            </h2>
          </div>

          {/* Country filter */}
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="country-filter" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
              Filter by country
            </label>
            <select
              id="country-filter"
              name="country"
              defaultValue={country}
              className="bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-md px-3 py-2 font-sans text-[14px] text-ink"
            >
              <option value="">All</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {flagEmoji(c.code)} {c.name} ({c.count})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-4 py-2 transition-colors border border-ink"
            >
              Apply
            </button>
            {country && (
              <Link
                href="/dual-citizenship"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 hover:text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                Reset
              </Link>
            )}
          </form>
        </div>

        {/* Confirmed Table */}
        {rows.filter((r) => !isDebunked(r.source_type)).length === 0 ? (
          <div className="rounded-lg border border-line bg-paper-2 p-12 text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
              No confirmed records for this filter
            </div>
            <p className="font-sans text-[15px] text-ink-2 leading-relaxed max-w-md mx-auto">
              No politicians with verified dual citizenship match this filter.{' '}
              <Link
                href="#submit-citation"
                className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                Send us a primary source →
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b-2 border-ink">
                  <Th>Politician</Th>
                  <Th>Citizenship</Th>
                  <Th>Source</Th>
                  <Th>Top industry donor</Th>
                  <Th>Top named donor</Th>
                </tr>
              </thead>
              <tbody>
                {rows.filter((r) => !isDebunked(r.source_type)).map((r) => {
                  const src = sourceTypeLabel(r.source_type)
                  const ind = industryById.get(r.politician_id)
                  const don = donorsById.get(r.politician_id)
                  return (
                    <tr
                      key={r.citizenship_id}
                      className="border-b border-line align-top hover:bg-paper-2 transition-colors"
                    >
                      {/* Politician */}
                      <Td>
                        <Link
                          href={`/politician/${r.politician_slug}`}
                          className="font-display text-[18px] text-ink hover:underline underline-offset-4 decoration-line"
                        >
                          {r.politician_name}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <Tag variant={partyVariant(r.party)}>
                            {r.party[0]} · {r.state} · {r.branch}
                          </Tag>
                          {r.current_status === 'former' && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                              Former
                            </span>
                          )}
                        </div>
                        {r.professional_background && (
                          <p className="mt-2 font-sans text-[13px] text-ink-2 leading-relaxed max-w-md">
                            {r.professional_background}
                          </p>
                        )}
                      </Td>

                      {/* Citizenship */}
                      <Td>
                        <div className="font-display text-[22px] leading-none">
                          <span aria-label="United States flag">🇺🇸</span>
                          <span className="mx-1.5 text-ink-3 font-mono text-[14px] align-middle">+</span>
                          <span aria-label={`${r.country_name} flag`}>{flagEmoji(r.country_code)}</span>
                        </div>
                        <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
                          U.S. + {r.country_name} <span className="text-ink-3">(dual)</span>
                        </div>
                        {r.disputed && (
                          <div className="mt-2 inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] text-broken bg-broken-bg border border-broken/30 px-2 py-0.5 rounded-full">
                            Disputed
                          </div>
                        )}
                      </Td>

                      {/* Source */}
                      <Td>
                        <div className={`inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full mb-2 ${
                          src.tone === 'kept'
                            ? 'bg-kept-bg text-kept border border-kept/30'
                            : src.tone === 'partial'
                              ? 'bg-partial-bg text-partial border border-partial/30'
                              : 'bg-pending-bg text-pending border border-pending/30'
                        }`}>
                          {src.label}
                        </div>
                        {r.source_quote && (
                          <blockquote className="font-display italic text-[14px] leading-[1.45] text-ink m-0 mb-2 max-w-sm">
                            "{r.source_quote}"
                          </blockquote>
                        )}
                        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
                          <a
                            href={r.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
                          >
                            {r.source_publication || 'Primary source'} →
                          </a>
                          {r.source_date && (
                            <span className="text-ink-3"> · {r.source_date}</span>
                          )}
                        </div>
                      </Td>

                      {/* Top industry donor */}
                      <Td>
                        {ind ? (
                          <>
                            <div className="font-sans text-[14px] text-ink font-medium">
                              {ind.industry_label}
                            </div>
                            <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
                              {fmtUSD(ind.total_contributions)} · cycle {ind.cycle}
                            </div>
                          </>
                        ) : (
                          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
                            n/a — no FEC record
                          </span>
                        )}
                      </Td>

                      {/* Top named donor */}
                      <Td>
                        {don ? (
                          <>
                            <div className="font-sans text-[14px] text-ink font-medium">
                              {don.donor_name}
                              {don.is_pac && (
                                <span className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">PAC</span>
                              )}
                            </div>
                            <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
                              {fmtUSD(don.total_contributed)} · cycle {don.cycle}
                            </div>
                          </>
                        ) : (
                          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
                            n/a — no FEC record
                          </span>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 max-w-2xl">
          Donor columns use FEC top-donor + industry rollups for the politician's last federal cycle
          on file. "n/a" appears for politicians without federal-cycle FEC records (state-level
          offices, cabinet appointees, etc.).
        </p>
      </section>

      {/* ───── DEBUNKED TIER ────────────────────────────────────
          Per rev-7 founder + research-agent finding: every commonly-
          circulated "X is dual-Israeli/Somali/Indian citizen" claim
          about sitting U.S. politicians has been explicitly rejected
          by tier-1 fact-checkers (PolitiFact, JTA, Snopes). Listing
          the debunks turns the page into corrective journalism. */}
      {rows.filter((r) => isDebunked(r.source_type)).length > 0 && (
        <section className="section-shell py-12 sm:py-16 border-t border-line bg-paper">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2">
              Commonly alleged · DEBUNKED by tier-1 fact-checkers
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
              The claims that don't survive a fact-check.
            </h2>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed max-w-2xl">
              These politicians have been widely alleged online to hold dual citizenship — and
              every claim listed here has been explicitly rejected by a tier-1 fact-checker
              (PolitiFact, JTA, Snopes), by the politician's own public denial, or by the simple
              fact that the country in question statutorily bars dual citizenship. We surface
              the debunks here so the page corrects the record rather than amplifying claims
              the evidence does not support.
            </p>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b-2 border-broken/40">
                  <Th>Politician</Th>
                  <Th>Alleged citizenship</Th>
                  <Th>Why the claim fails</Th>
                </tr>
              </thead>
              <tbody>
                {rows.filter((r) => isDebunked(r.source_type)).map((r) => (
                  <tr key={r.citizenship_id} className="border-b border-line align-top hover:bg-paper-2 transition-colors">
                    <Td>
                      <Link
                        href={`/politician/${r.politician_slug}`}
                        className="font-display text-[18px] text-ink hover:underline underline-offset-4 decoration-line"
                      >
                        {r.politician_name.replace(/\s*\([^)]*\)\s*$/, '')}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <Tag variant={partyVariant(r.party)}>
                          {r.party[0]} · {r.state} · {r.branch}
                        </Tag>
                      </div>
                    </Td>
                    <Td>
                      <div className="font-display text-[20px] leading-none">
                        <span aria-label="United States flag">🇺🇸</span>
                        <span className="mx-1.5 text-ink-3 font-mono text-[14px] align-middle">+</span>
                        <span aria-label={`${r.country_name} flag`}>{flagEmoji(r.country_code)}</span>
                      </div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-broken bg-broken-bg border border-broken/30 px-2 py-0.5 rounded-full inline-flex">
                        Alleged · debunked
                      </div>
                      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        Allegation: U.S. + {r.country_name}
                      </div>
                    </Td>
                    <Td>
                      {r.source_quote && (
                        <blockquote className="font-display italic text-[14px] leading-[1.45] text-ink m-0 mb-2 max-w-md">
                          "{r.source_quote}"
                        </blockquote>
                      )}
                      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
                        >
                          Fact-check: {r.source_publication || 'Tier-1 source'} →
                        </a>
                        {r.source_date && <span className="text-ink-3"> · {r.source_date}</span>}
                      </div>
                      {r.notes && (
                        <p className="mt-2 font-sans text-[13px] text-ink-2 leading-relaxed max-w-md">
                          {r.notes}
                        </p>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 max-w-2xl">
            Inclusion here means the politician was widely alleged online + the claim was
            tier-1 debunked. Not all viral dual-citizenship claims appear here — we only list
            cases with a working fact-check URL.
          </p>
        </section>
      )}

      {/* ───── SUBMIT A CITATION — feedback-form-to-DB pattern ─── */}
      <section id="submit-citation" className="section-shell py-12 sm:py-16 bg-paper-2 border-t border-line scroll-mt-20">
        <div className="max-w-[760px] mx-auto">
          <CompRequestForm mode="feedback" feedbackTopic="dual-citizenship-citation" />
        </div>
      </section>

    </>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2 font-medium pb-3 pr-4 align-bottom"
    >
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-5 pr-4">{children}</td>
}
