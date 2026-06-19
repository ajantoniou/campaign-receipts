// /trump — SEALED Trump-2016 promise dashboard v1.
// Verdict scorecard masthead + filter chips (Chapter / Verdict) +
// stacked promise rows. Inherits CR parchment+ink design system.
// No 5-column tables; rows follow the methodology StatTile pattern.

import Link from 'next/link'
import TrustSurface from '@/app/components/TrustSurface'
import {
  getAllPromises,
  CHAPTERS,
  SCORECARD_TOTALS,
  VERDICT_HEX,
  VERDICT_LABEL,
  type Verdict,
} from '@/lib/sealed-promises'

export const dynamic = 'force-static'
export const revalidate = 3600

export const metadata = {
  title: 'Trump 2016 — Promise Scorecard | CampaignReceipts',
  description:
    '145 campaign promises from the 2016 cycle, graded against the 2017-2021 record. A receipt on every verdict.',
}

const VERDICTS: Verdict[] = ['KEPT', 'PARTIAL', 'BROKEN', 'YOU_DECIDE']

export default function TrumpDashboardPage({
  searchParams,
}: {
  searchParams?: { chapter?: string; verdict?: string }
}) {
  const all = getAllPromises()
  const filterChapter = searchParams?.chapter ?? null
  const filterVerdict = (searchParams?.verdict as Verdict | undefined) ?? null

  const visible = all.filter((p) => {
    if (p.category === 'Chapter overview') return false // chapters surface as group headers below
    if (filterChapter && p.chapter_slug !== filterChapter) return false
    if (filterVerdict && p.verdict !== filterVerdict) return false
    return true
  })

  // Group visible pledges by chapter for stacked rendering
  const grouped = CHAPTERS
    .filter((c) => !filterChapter || c.slug === filterChapter)
    .map((ch) => ({
      chapter: ch,
      pledges: visible.filter((p) => p.chapter_slug === ch.slug),
    }))
    .filter((g) => g.pledges.length > 0)

  const trumpDatasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Trump 2016 Campaign Promises — Graded',
    description:
      '145 campaign promises from the Trump 2016 cycle, graded against the 2017-2021 first term using only primary sources (executive orders, agency reports, federal-register filings, FEC data). 81 of 145 promises link to a primary-source URL.',
    url: 'https://campaignreceipts.com/trump',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: { '@type': 'Organization', name: 'CampaignReceipts' },
    publisher: { '@type': 'Organization', name: 'CampaignReceipts' },
    isAccessibleForFree: true,
    keywords: [
      'campaign promises',
      'political accountability',
      'Trump 2016',
      'executive orders',
      'citation archive',
      'primary sources',
    ],
  }

  return (
    <TrustSurface>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(trumpDatasetJsonLd) }}
      />
      {/* Masthead */}
      <section className="border-b border-parchment-200">
        <div className="section-shell pt-16 pb-10">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
            2016 cycle audit
          </div>
          <h1 className="font-editorial text-display-lg text-ink-950 text-balance">
            Trump 2016 — every promise, graded.
          </h1>
          <p className="mt-5 text-lg text-ink-700 max-w-3xl leading-relaxed font-editorial">
            145 promises from the 2016 campaign, graded against the 2017–2021 term. Citation density: every
            verdict here links to its primary-source receipts.
          </p>
          <p className="mt-4 text-[15px] text-ink-700 max-w-3xl leading-relaxed font-editorial">
            The 2016 audit below is free. It also includes 52 preserved commitments from the deleted
            2024 platform. See how we grade:{' '}
            <Link
              href="/methodology"
              className="text-authority-600 hover:text-authority-700 underline-offset-4 underline font-medium"
            >
              methodology →
            </Link>
          </p>
          <p className="mt-4 text-sm text-ink-600 max-w-3xl leading-relaxed">
            82% of 2016 promises link to a primary source; the remaining 18% link to two independent
            contemporaneous reports. See{' '}
            <Link href="/methodology" className="text-authority-600 hover:text-authority-700 underline-offset-4 hover:underline font-medium">
              methodology
            </Link>
            .
          </p>

          {/* Scorecard tiles — canonical totals */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            <ScoreTile verdict="KEPT"       count={SCORECARD_TOTALS.KEPT} total={SCORECARD_TOTALS.TOTAL} />
            <ScoreTile verdict="PARTIAL"    count={SCORECARD_TOTALS.PARTIAL} total={SCORECARD_TOTALS.TOTAL} />
            <ScoreTile verdict="BROKEN"     count={SCORECARD_TOTALS.BROKEN} total={SCORECARD_TOTALS.TOTAL} />
            <ScoreTile verdict="YOU_DECIDE" count={SCORECARD_TOTALS.YOU_DECIDE} total={SCORECARD_TOTALS.TOTAL} />
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-ink-600">
            <span>Total: <strong className="text-ink-950 font-mono">{SCORECARD_TOTALS.TOTAL}</strong></span>
            <span>·</span>
            <Link href="/trump/scorecard.pdf" className="text-authority-600 hover:text-authority-700 underline-offset-4 hover:underline font-medium">
              Print scorecard (PDF) →
            </Link>
          </div>
        </div>
      </section>

      {/* Filter chips */}
      <section className="border-b border-parchment-200 bg-parchment-100/40">
        <div className="section-shell py-5 space-y-3">
          <FilterRow label="Verdict">
            <Chip href="/trump" active={!filterVerdict && !filterChapter}>All</Chip>
            {VERDICTS.map((v) => (
              <Chip
                key={v}
                href={`/trump?${new URLSearchParams({ ...(filterChapter ? { chapter: filterChapter } : {}), verdict: v }).toString()}`}
                active={filterVerdict === v}
                color={VERDICT_HEX[v]}
              >
                {VERDICT_LABEL[v]}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Chapter">
            <Chip href={filterVerdict ? `/trump?verdict=${filterVerdict}` : '/trump'} active={!filterChapter}>All</Chip>
            {CHAPTERS.map((c) => (
              <Chip
                key={c.slug}
                href={`/trump?${new URLSearchParams({ chapter: c.slug, ...(filterVerdict ? { verdict: filterVerdict } : {}) }).toString()}`}
                active={filterChapter === c.slug}
              >
                {c.number}. {c.short}
              </Chip>
            ))}
          </FilterRow>
        </div>
      </section>

      {/* Promise rows, grouped by chapter */}
      <section className="section-shell py-12 space-y-12">
        {grouped.length === 0 && (
          <p className="text-ink-600 italic">No promises match this filter.</p>
        )}
        {grouped.map(({ chapter, pledges }) => (
          <div key={chapter.slug}>
            <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-parchment-200 pb-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600">
                  Chapter {chapter.number}
                </div>
                <h2 className="font-editorial text-2xl text-ink-950 mt-1">{chapter.title}</h2>
              </div>
              <ChapterVerdictTag verdict={chapter.verdict} />
            </div>
            <ul className="divide-y divide-parchment-200 ring-1 ring-parchment-200 rounded-lg bg-white overflow-hidden">
              {pledges.map((p) => (
                <li key={p.promise_slug}>
                  <Link
                    href={p.permalink}
                    className="flex items-stretch gap-0 hover:bg-parchment-50/60 transition-colors"
                  >
                    {/* Verdict color block on the left */}
                    <div
                      className="w-2 shrink-0"
                      style={{ backgroundColor: VERDICT_HEX[p.verdict] }}
                      aria-hidden
                    />
                    <div className="flex-1 grid sm:grid-cols-[1fr_auto] gap-3 items-center px-5 py-4">
                      <div>
                        <div className="text-[15px] font-editorial text-ink-950 leading-snug">
                          {p.promise_text}
                        </div>
                        <div className="mt-1 text-xs text-ink-600 leading-relaxed">
                          {p.verdict_reasoning?.replace(/Full receipts in the book.*$/, '').trim() || ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <VerdictStamp verdict={p.verdict} small />
                        <span className="font-mono text-[10px] text-ink-500">#{String(p.promise_number).padStart(3, '0')}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </TrustSurface>
  )
}

function ScoreTile({ verdict, count, total }: { verdict: Verdict; count: number; total: number }) {
  const pct = ((count / total) * 100).toFixed(0)
  const hex = VERDICT_HEX[verdict]
  return (
    <div
      className="rounded-lg ring-1 ring-parchment-200 bg-white p-4 relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: hex }} aria-hidden />
      <div className="pl-3">
        <div
          className="text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: hex }}
        >
          {VERDICT_LABEL[verdict]}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-editorial text-4xl text-ink-950">{count}</span>
          <span className="font-mono text-xs text-ink-500">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-600 mr-1 w-16 shrink-0">
        {label}
      </span>
      {children}
    </div>
  )
}

function Chip({
  href,
  active,
  color,
  children,
}: {
  href: string
  active: boolean
  color?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ' +
        (active
          ? 'bg-ink-950 text-parchment-50 ring-ink-950'
          : 'bg-white text-ink-700 ring-parchment-200 hover:ring-ink-400')
      }
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {children}
    </Link>
  )
}

function ChapterVerdictTag({ verdict }: { verdict: Verdict }) {
  const hex = VERDICT_HEX[verdict]
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold ring-1 bg-white"
      style={{ color: hex, borderColor: hex }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: hex }} aria-hidden />
      Chapter verdict: {VERDICT_LABEL[verdict]}
    </span>
  )
}

function VerdictStamp({ verdict, small }: { verdict: Verdict; small?: boolean }) {
  const hex = VERDICT_HEX[verdict]
  return (
    <span
      className={
        'inline-flex items-center font-mono font-bold uppercase tracking-[0.12em] ring-2 ' +
        (small ? 'text-[10px] px-2 py-1 rounded' : 'text-sm px-3 py-1.5 rounded-md')
      }
      style={{ color: hex, borderColor: hex }}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  )
}
