// /foreign-donors — foreign-influence transparency surface.
//
// Per founder rev-6 spec: 4 categories (illegal contributions / FARA
// registrants / foreign SOE employees / foreign-policy-aligned PACs).
// Every row links to fec.gov, justice.gov, efile.fara.gov, or
// govinfo.gov. Foreign-policy-aligned PACs are explicitly framed as
// DOMESTIC U.S. PACs advocating positions favoring a foreign country
// — not as foreign agents — per the brand-discipline lock-in.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import { Tag } from '@/app/components/cr'
import CompRequestForm from '@/app/components/CompRequestForm'
import SealedBookBand from '@/app/components/SealedBookBand'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Foreign influence in U.S. campaign finance — CampaignReceipts',
  description:
    'Illegal foreign-national contributions (FEC MUR + DOJ enforcement), FARA-registered lobbyist contributions, foreign state-owned-enterprise employee donors, and U.S. domestic PACs advocating foreign-policy positions for specific countries. Every row links to a government-database primary source.',
}

type ForeignDonorRow = {
  id: string
  category: 'illegal_contribution' | 'fara_registrant' | 'foreign_soe_employee' | 'foreign_policy_pac'
  recipient_name: string
  donor_name: string
  donor_employer: string | null
  donor_origin_country: string | null
  donor_origin_code: string | null
  amount_usd: number | null
  cycle: string | null
  contribution_date: string | null
  source_url: string
  source_publication: string | null
  source_date: string | null
  source_type: string
  short_summary: string
  long_explanation: string | null
  outcome: string | null
  notes: string | null
  politician_id: string | null
}

function flagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const cc = countryCode.toUpperCase()
  const A = 'A'.charCodeAt(0)
  const RIS_A = 0x1F1E6
  return String.fromCodePoint(
    cc.charCodeAt(0) - A + RIS_A,
    cc.charCodeAt(1) - A + RIS_A,
  )
}

function fmtUSD(n: number | null): string {
  if (n == null || !isFinite(n)) return 'n/a'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n)}`
}

function outcomeTone(outcome: string | null): 'kept' | 'partial' | 'broken' | 'pending' | 'decide' {
  switch (outcome) {
    case 'convicted': return 'broken'
    case 'settled': return 'partial'
    case 'dismissed': return 'pending'
    case 'pending': return 'pending'
    default: return 'decide'
  }
}

// Per rev-7 founder: foreign-policy PACs at TOP of page — that's
// where the dollar-amount juice lives ($87M UDP cycle receipts).
// Illegal-contribution / FARA / SOE-employee follow in descending
// editorial weight.
const CATEGORY_META: Record<ForeignDonorRow['category'], { label: string; eyebrow: string; intro: string }> = {
  foreign_policy_pac: {
    label: 'Foreign-policy-aligned PACs (DOMESTIC)',
    eyebrow: 'FEC committee filings · the biggest dollar amounts',
    intro:
      "DOMESTIC U.S. PACs registered with the FEC, not foreign agents. Listed here because their advocacy is specifically focused on U.S. policy positions favoring a single foreign country. All contributions are legal domestic contributions. The dollars are the juice: AIPAC's super PAC (UDP) raised $87.2M in the 2023-2024 cycle alone. Cumulative since founding (2022): $176M+. We tie every foreign-policy PAC dollar to its influence on U.S. votes and U.S. lives.",
  },
  illegal_contribution: {
    label: 'Illegal foreign-national contributions',
    eyebrow: '52 U.S.C. § 30121 enforcement',
    intro:
      "Foreign nationals are prohibited by federal law (52 U.S.C. § 30121) from contributing to U.S. federal elections. These rows document FEC enforcement actions or DOJ criminal cases in which the prohibition was found violated. Every row links to the DOJ press release, indictment, or FEC Matter Under Review.",
  },
  fara_registrant: {
    label: 'FARA-registered lobbyist contributions',
    eyebrow: 'Foreign Agents Registration Act',
    intro:
      "Lobbyists registered under the Foreign Agents Registration Act (FARA) may legally contribute to U.S. federal campaigns as individuals. The story is the alignment: a lobbyist working for a foreign government's interests contributed to politicians while those interests were being lobbied. Every row links to the efile.fara.gov registration and the contribution record.",
  },
  foreign_soe_employee: {
    label: 'Foreign state-owned-enterprise employee donors',
    eyebrow: 'FEC individual contribution records',
    intro:
      "FEC individual-contribution filings where the donor's listed employer is a foreign state-owned enterprise (Saudi Aramco, China National Petroleum, Gazprom, etc.). Legal under U.S. campaign-finance law (the donor is a U.S. person or permanent resident), but a transparency signal worth surfacing. Empty at launch — we have not yet verified specific FEC records meeting the bar.",
  },
}

async function getData(categoryFilter?: string) {
  let query = supabaseService
    .from('cr_foreign_donor_records')
    .select('*')
    .order('cycle', { ascending: false })
    .order('amount_usd', { ascending: false, nullsFirst: false })

  if (categoryFilter && categoryFilter in CATEGORY_META) {
    query = query.eq('category', categoryFilter)
  }

  const { data } = await query
  return (data as ForeignDonorRow[]) || []
}

export default async function ForeignDonorsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const categoryFilter = searchParams.category
  const rows = await getData(categoryFilter)

  // Group by category for section rendering. If filter is set, we'll
  // only see that category's rows anyway, but the UI shape stays the
  // same — sections appear or are empty as appropriate.
  const byCategory: Record<string, ForeignDonorRow[]> = {
    illegal_contribution: [],
    fara_registrant: [],
    foreign_soe_employee: [],
    foreign_policy_pac: [],
  }
  for (const r of rows) byCategory[r.category]?.push(r)

  const totalRows = rows.length

  return (
    <>
      {/* MASTHEAD */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
              Investigation · Open dossier
            </div>
            <h1 className="font-display text-[44px] sm:text-[60px] leading-[0.96] tracking-[-0.01em] text-ink text-balance">
              Foreign influence in U.S. campaign finance.
            </h1>
            <p className="mt-5 font-sans text-[17px] text-ink-2 leading-relaxed max-w-2xl">
              Foreign nationals are legally prohibited from contributing to U.S. federal
              elections (52 U.S.C. § 30121). Foreign-agent lobbyists must register under FARA.
              Foreign-policy-aligned PACs are domestic but advocate specific foreign-country
              positions. This page tracks all four — every row links to a government primary
              source.
            </p>
          </div>
        </div>
      </section>

      {/* EXPLAINER */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            How to read this page
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            Four distinct categories — not one undifferentiated "foreign money" story.
          </h2>
          <div className="mt-5 space-y-4 font-sans text-[15px] text-ink-2 leading-relaxed">
            <p>
              "Foreign donor" is a phrase that does heavy lifting in political discourse, often
              collapsing four very different stories. We separate them on purpose:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mt-3">
              <li>
                <strong className="font-medium text-ink">Illegal foreign-national contributions</strong>{' '}
                — documented FEC or DOJ enforcement. Bulletproof.
              </li>
              <li>
                <strong className="font-medium text-ink">FARA-registered lobbyist contributions</strong>{' '}
                — legal, but the politician was funded by lobbyists paid to advance a foreign
                government's interests.
              </li>
              <li>
                <strong className="font-medium text-ink">Foreign state-owned-enterprise employees as donors</strong>{' '}
                — legal contributions from U.S. residents whose employer is a foreign government's
                business arm.
              </li>
              <li>
                <strong className="font-medium text-ink">Foreign-policy-aligned PACs (DOMESTIC)</strong>{' '}
                — these are U.S. domestic PACs, NOT foreign agents. Their contributions are legal.
                They are listed here because their advocacy is focused on U.S. policy toward a
                specific foreign country.
              </li>
            </ol>
            <p>
              Source bar: every row links to fec.gov, justice.gov, efile.fara.gov, or govinfo.gov.
              Where a row covers an FEC Matter Under Review that resulted in a 2-2 deadlock, we
              say so — a deadlock is a procedural dismissal, not a finding of innocence.
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER PILLS */}
      <section className="section-shell pt-10 pb-2">
        <div className="flex items-center gap-2 flex-wrap font-sans text-[13px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 mr-2">
            Filter:
          </span>
          <FilterPill href="/foreign-donors" active={!categoryFilter}>
            All ({totalRows})
          </FilterPill>
          {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map((cat) => (
            <FilterPill
              key={cat}
              href={`/foreign-donors?category=${cat}`}
              active={categoryFilter === cat}
            >
              {CATEGORY_META[cat].label} ({byCategory[cat].length})
            </FilterPill>
          ))}
        </div>
      </section>

      {/* CATEGORY SECTIONS */}
      <section className="section-shell py-10 sm:py-12 space-y-16">
        {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map((cat) => {
          if (categoryFilter && cat !== categoryFilter) return null
          const catRows = byCategory[cat]
          const meta = CATEGORY_META[cat]
          return (
            <div key={cat} id={cat} className="scroll-mt-20">
              <div className="max-w-[760px] mx-auto mb-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
                  {meta.eyebrow}
                </div>
                <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
                  {meta.label} <span className="text-ink-3 font-mono text-[16px] tracking-[0.12em] uppercase">· {catRows.length}</span>
                </h2>
                <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
                  {meta.intro}
                </p>
              </div>

              {catRows.length === 0 ? (
                <div className="max-w-[760px] mx-auto rounded-lg border border-line bg-paper-2 p-8 text-center">
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
                    No records yet
                  </div>
                  <p className="font-sans text-[14px] text-ink-2 leading-relaxed">
                    No verified records in this category at launch.{' '}
                    <Link
                      href="#submit-citation"
                      className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
                    >
                      Send us a primary-source citation →
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-[1000px] mx-auto">
                  {catRows.map((r) => (
                    <RecordCard key={r.id} row={r} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* SUBMIT A CITATION — feedback-form-to-DB pattern. Daily cron
          reviewer parses + LLM-screens + only credible entries land in
          the corpus. Replaces the prior mailto:alex@ flow. */}
      <section id="submit-citation" className="section-shell py-12 sm:py-16 bg-paper-2 border-t border-line scroll-mt-20">
        <div className="max-w-[760px] mx-auto">
          <CompRequestForm mode="feedback" feedbackTopic="foreign-donors-citation" />
        </div>
      </section>

      <SealedBookBand placement="foreign-donors" />
    </>
  )
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full border transition-colors no-underline ${
        active
          ? 'bg-ink text-paper border-ink'
          : 'bg-paper text-ink-2 border-line hover:border-ink hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}

function RecordCard({ row }: { row: ForeignDonorRow }) {
  const tone = outcomeTone(row.outcome)
  const isPACCategory = row.category === 'foreign_policy_pac'
  return (
    <article className="rounded-lg border border-line bg-paper p-5 sm:p-6 grid gap-4 sm:grid-cols-[1fr_auto] items-start">
      <div className="min-w-0">
        {/* Top line: donor + origin flag */}
        <div className="flex items-baseline flex-wrap gap-2 mb-2">
          <h3 className="font-display text-[20px] sm:text-[22px] leading-[1.2] text-ink m-0">
            {row.donor_name}
          </h3>
          {row.donor_origin_code && (
            <span
              className="font-display text-[20px] leading-none ml-1"
              aria-label={`Origin: ${row.donor_origin_country}`}
            >
              {flagEmoji(row.donor_origin_code)}
            </span>
          )}
        </div>

        {/* Origin + employer mono caption */}
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 mb-3">
          {row.donor_origin_country && <>Origin: {row.donor_origin_country}</>}
          {row.donor_employer && (
            <>
              {row.donor_origin_country && <span className="mx-1.5">·</span>}
              <span>{row.donor_employer}</span>
            </>
          )}
        </div>

        {/* Summary */}
        <p className="font-sans text-[15px] text-ink leading-relaxed mb-3">
          {row.short_summary}
        </p>

        {/* Recipient line — sometimes long, render as block */}
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 mb-3">
          Recipient: <span className="text-ink normal-case font-sans text-[14px]">{row.recipient_name}</span>
        </div>

        {/* Important caveats / long explanation */}
        {row.long_explanation && (
          <p className="font-sans text-[13px] text-ink-2 leading-relaxed border-l-2 border-line pl-3 mb-3 max-w-3xl">
            {row.long_explanation}
          </p>
        )}

        {/* Source line — required */}
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 mt-2">
          <a
            href={row.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
          >
            {row.source_publication || 'Primary source'} →
          </a>
          {row.source_date && <span className="text-ink-3"> · {row.source_date}</span>}
        </div>
      </div>

      {/* Right rail: amount + outcome chip */}
      <div className="sm:w-44 flex-shrink-0 sm:text-right">
        <div className="font-display text-[28px] sm:text-[32px] leading-none text-ink tabular-nums tracking-[-0.01em]">
          {fmtUSD(row.amount_usd)}
        </div>
        {row.cycle && (
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            cycle {row.cycle}
          </div>
        )}
        {!isPACCategory && row.outcome && row.outcome !== 'n/a' && (
          <div className="mt-3 inline-flex">
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border ${
                tone === 'broken'
                  ? 'bg-broken-bg text-broken border-broken/30'
                  : tone === 'partial'
                    ? 'bg-partial-bg text-partial border-partial/30'
                    : tone === 'pending'
                      ? 'bg-pending-bg text-pending border-pending/30'
                      : 'bg-paper-3 text-ink-2 border-line'
              }`}
            >
              {row.outcome === 'convicted' ? 'Convicted' :
               row.outcome === 'settled' ? 'Settled' :
               row.outcome === 'dismissed' ? 'Dismissed' :
               row.outcome === 'pending' ? 'Pending' :
               row.outcome}
            </span>
          </div>
        )}
        {isPACCategory && (
          <div className="mt-3 inline-flex">
            <Tag>Domestic PAC</Tag>
          </div>
        )}
      </div>
    </article>
  )
}
