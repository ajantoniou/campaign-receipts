// /2024-trump-campaign-promises — preservation-archive landing.
//
// Civic-publication register (CRO panel + design persona consensus):
// quiet headlines, Wayback timestamps in mono, perforated-receipt motif
// on the donate-shell vs archived side-by-side comparison artifact.
//
// Surfaces:
//   - 17 issue-page cards backed by /public/sources/trump-2024-issues-*.html
//   - 52 preserved commitments from ../concise-sealed/artifacts/sealed-ch10-2024-commitments.json
//     (re-shipped as ./commitments.json so we can read it via static import
//      without crossing package boundaries at build time)
//
// Free archive dominant; paid SKU (SEALED book) recessive per panel guidance.

import Link from 'next/link'
import TrustSurface from '@/app/components/TrustSurface'
import commitmentsData from './commitments.json'

export const dynamic = 'force-static'
export const revalidate = 86400

export const metadata = {
  title: 'The Deleted 2024 Trump Platform — Preserved | CampaignReceipts',
  description:
    '17 issue pages. Agenda47. The full RNC platform. Captured by the Internet Archive. Removed from donaldjtrump.com by January 2025 — the campaign domain now serves only a donation page.',
  openGraph: {
    title: 'The Deleted 2024 Trump Platform — Preserved',
    description:
      '17 issue pages, Agenda47, and the full RNC platform. Removed from donaldjtrump.com by January 2025. We kept them.',
    url: 'https://campaignreceipts.com/2024-trump-campaign-promises',
    type: 'article',
  },
}

type Status = 'KEPT' | 'IN_PROGRESS' | 'PENDING' | 'BROKEN'
type Commitment = {
  id: string
  verbatim_quote: string
  source_page: string
  source_section: string
  source_url: string
  captured_date: string
  deleted_after: string | null
  category: string
  outcome_status: Status
  outcome_notes: string
}

const COMMITMENTS = (commitmentsData as { commitments: Commitment[] }).commitments
const CAPTURE_DATE = '2026-02-21' // canonical Wayback capture across the trump-2024 snapshots
const DELETION_DATE = '2025-01-20'

// 17 issue surfaces preserved at /public/sources/. Slugs map to filenames:
//   /sources/trump-2024-issues-{slug}-snapshot.html
const ISSUES: { slug: string; label: string; sourcePageHints: string[] }[] = [
  { slug: 'index',       label: 'Issues — Index',       sourcePageHints: ['trump-2024-platform-snapshot.html'] },
  { slug: 'borders',     label: 'Borders',              sourcePageHints: ['trump-2024-issues-immigration-snapshot.html'] },
  { slug: 'immigration', label: 'Immigration',          sourcePageHints: ['trump-2024-issues-immigration-snapshot.html'] },
  { slug: 'cartels',     label: 'Cartels',              sourcePageHints: ['trump-2024-agenda47-snapshot.html'] },
  { slug: 'trade',       label: 'Trade',                sourcePageHints: ['trump-2024-issues-trade-snapshot.html'] },
  { slug: 'economy',     label: 'Economy',              sourcePageHints: ['trump-2024-platform-snapshot.html'] },
  { slug: 'energy',      label: 'Energy',               sourcePageHints: ['trump-2024-platform-snapshot.html'] },
  { slug: 'education',   label: 'Education',            sourcePageHints: ['trump-2024-platform-snapshot.html'] },
  { slug: 'healthcare',  label: 'Healthcare',           sourcePageHints: [] },
  { slug: 'safety',      label: 'Public Safety',        sourcePageHints: ['trump-2024-platform-snapshot.html'] },
  { slug: 'dismantle',   label: 'Dismantle the Deep State', sourcePageHints: ['trump-2024-agenda47-snapshot.html'] },
  { slug: 'rights',      label: 'Rights & Liberties',   sourcePageHints: ['trump-2024-platform-snapshot.html'] },
  { slug: 'speech',      label: 'Free Speech',          sourcePageHints: ['trump-2024-rnc-platform.pdf'] },
  { slug: 'strength',    label: 'Strength Abroad',      sourcePageHints: ['trump-2024-platform-snapshot.html'] },
  { slug: 'veterans',    label: 'Veterans',             sourcePageHints: [] },
  { slug: 'integrity',   label: 'Election Integrity',   sourcePageHints: ['trump-2024-platform-snapshot.html'] },
  // 17th: the agenda47 surface is a separately-preserved issue page.
  { slug: 'agenda47',    label: 'Agenda47 (full)',      sourcePageHints: ['trump-2024-agenda47-snapshot.html'], altPath: 'trump-2024-agenda47-snapshot.html' } as any,
]

function badgeFor(hints: string[]): { kept: number; inProgress: number } {
  let kept = 0
  let inProgress = 0
  for (const c of COMMITMENTS) {
    if (!hints.includes(c.source_page)) continue
    if (c.outcome_status === 'KEPT') kept++
    else if (c.outcome_status === 'IN_PROGRESS') inProgress++
  }
  return { kept, inProgress }
}

// Featured commitments — high-impact KEPT + IN_PROGRESS, mixing categories.
const FEATURED_IDS = [
  'borders-remain-in-mexico',         // KEPT
  'platform-promise-02-largest-deportation', // IN_PROGRESS
  'platform-promise-04-energy-dominance',    // IN_PROGRESS
  'rnc-platform-j6-pardon',           // KEPT
  'cartels-naval-embargo-fto',        // KEPT
  'agenda47-deep-state-firing',       // IN_PROGRESS
  'platform-promise-15-ev-mandate',   // KEPT
]
const FEATURED = FEATURED_IDS
  .map((id) => COMMITMENTS.find((c) => c.id === id))
  .filter((c): c is Commitment => Boolean(c))

const KEPT_COUNT = COMMITMENTS.filter((c) => c.outcome_status === 'KEPT').length
const IP_COUNT = COMMITMENTS.filter((c) => c.outcome_status === 'IN_PROGRESS').length

export default function ArchiveLandingPage() {
  return (
    <TrustSurface>
      {/* ─── 1. Hero band ─── */}
      <section className="border-b border-parchment-200">
        <div className="section-shell pt-20 pb-16">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
            Preservation Archive
          </div>
          <h1 className="font-editorial text-display-lg text-ink-950 text-balance leading-[1.05]">
            They deleted the 2024 platform.<br />
            <span className="text-authority-700">We kept it.</span>
          </h1>
          <p className="mt-6 text-lg text-ink-700 max-w-2xl leading-relaxed font-editorial">
            17 issue pages. Agenda47. The full RNC platform. Captured by the Internet Archive.
            Removed from donaldjtrump.com by January 2025 — the campaign domain now serves only
            a donation page.
          </p>

          {/* Side-by-side receipt artifact */}
          <div className="mt-10 grid md:grid-cols-2 gap-0 max-w-3xl border border-parchment-300 bg-white shadow-sm relative">
            {/* perforated divider on md+ */}
            <div
              aria-hidden
              className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, #c8bfae 0, #c8bfae 4px, transparent 4px, transparent 9px)',
              }}
            />
            {/* LEFT: donate-only shell */}
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r-0 border-parchment-300">
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 font-mono">
                donaldjtrump.com — today
              </div>
              <div className="mt-1 text-[11px] font-mono text-ink-3">
                {new Date().toISOString().slice(0, 10)}
              </div>
              <div className="mt-10 mb-12 flex flex-col items-center text-center">
                <div className="text-ink-950 font-editorial text-2xl mb-6">
                  Help save America.
                </div>
                <button
                  type="button"
                  disabled
                  className="bg-authority-700 text-white px-8 py-3 text-sm uppercase tracking-wider font-semibold cursor-default"
                  aria-label="Donate (illustrative; live site no longer serves policy)"
                >
                  Donate
                </button>
              </div>
              <div className="text-[11px] text-ink-3 font-mono border-t border-parchment-200 pt-3">
                no policy pages
              </div>
            </div>

            {/* RIGHT: archived list of 17 */}
            <div className="p-6 md:p-8">
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 font-mono">
                donaldjtrump.com — archived
              </div>
              <div className="mt-1 text-[11px] font-mono text-ink-3">
                Wayback capture · {CAPTURE_DATE}
              </div>
              <ol className="mt-4 space-y-1 text-[13px] text-ink-900 columns-1">
                {ISSUES.map((i) => (
                  <li key={i.slug} className="font-editorial">
                    · {i.label}
                  </li>
                ))}
              </ol>
              <div className="text-[11px] text-ink-3 font-mono border-t border-parchment-200 pt-3 mt-4">
                17 pages · deleted after {DELETION_DATE}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row sm:items-baseline gap-4">
            <a
              href="#archive"
              className="inline-flex items-center justify-center bg-authority-700 hover:bg-authority-800 text-white px-6 py-3 text-sm uppercase tracking-wider font-semibold transition-colors"
            >
              Read the archive (free)
            </a>
            <span className="text-[13px] text-ink-700">
              <a
                href="https://sealed2016.com/?utm_source=campaignreceipts&utm_medium=cross-link&utm_content=2024-preservation-hero"
                target="_blank"
                rel="noopener noreferrer"
                className="text-authority-700 underline-offset-4 hover:underline"
              >
                Read more about <strong className="text-broken-600">SEALED</strong> →
              </a>
              <span className="text-ink-500">&nbsp;or&nbsp;</span>
              <a
                href="https://creativelabs2016.lemonsqueezy.com/checkout/buy/90308e58-3e24-40fa-b9be-269480ef8767?utm_source=campaignreceipts&utm_medium=cross-link-buy&utm_content=2024-preservation-hero"
                target="_blank"
                rel="noopener noreferrer"
                className="text-authority-700 underline-offset-4 hover:underline"
              >
                get the book — $15 →
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* ─── 2. Evidence band: 17 issue cards ─── */}
      <section id="archive" className="bg-white border-b border-parchment-200">
        <div className="section-shell py-16">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
            The Evidence
          </div>
          <h2 className="font-editorial text-display-sm text-ink-950 mb-2">
            17 issue pages, preserved verbatim
          </h2>
          <p className="text-[15px] text-ink-700 max-w-2xl mb-10">
            Click any card to open the preserved HTML capture. Each was live on donaldjtrump.com
            during the 2024 campaign and removed by {DELETION_DATE}.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ISSUES.map((i) => {
              const b = badgeFor(i.sourcePageHints)
              const href =
                (i as any).altPath
                  ? `/sources/${(i as any).altPath}`
                  : `/sources/trump-2024-issues-${i.slug}-snapshot.html`
              return (
                <a
                  key={i.slug}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border border-parchment-300 bg-parchment-50 hover:bg-white hover:border-authority-400 transition-colors p-4 relative"
                >
                  <div className="absolute top-2 right-2 text-[9px] font-mono text-ink-3">
                    {CAPTURE_DATE}
                  </div>
                  <div className="font-editorial text-[15px] text-ink-950 leading-tight pr-12 mb-3">
                    {i.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.kept > 0 && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-kept-600 border border-kept-600/40 px-1.5 py-0.5">
                        {b.kept} kept
                      </span>
                    )}
                    {b.inProgress > 0 && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-partial-600 border border-partial-600/40 px-1.5 py-0.5">
                        {b.inProgress} in motion
                      </span>
                    )}
                    {b.kept === 0 && b.inProgress === 0 && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3 border border-parchment-300 px-1.5 py-0.5">
                        preserved
                      </span>
                    )}
                  </div>
                </a>
              )
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 text-[13px]">
            <a
              href="/sources/trump-2024-platform-snapshot.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-authority-700 hover:text-authority-800 underline-offset-4 hover:underline font-medium"
            >
              → Full 2024 Trump Platform (preserved HTML)
            </a>
            <a
              href="/sources/trump-2024-rnc-platform.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-authority-700 hover:text-authority-800 underline-offset-4 hover:underline font-medium"
            >
              → 2024 RNC Platform (PDF, download)
            </a>
          </div>
        </div>
      </section>

      {/* ─── 3. Commitments band ─── */}
      <section className="border-b border-parchment-200">
        <div className="section-shell py-16">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
            What was promised
          </div>
          <h2 className="font-editorial text-display-sm text-ink-950 mb-2">
            {COMMITMENTS.length} commitments preserved.{' '}
            <span className="text-kept-600">{KEPT_COUNT} already executed.</span>{' '}
            <span className="text-partial-600">{IP_COUNT} in motion.</span>
          </h2>
          <p className="text-[15px] text-ink-700 max-w-2xl mb-10">
            Every quote below was pulled verbatim from a preserved donaldjtrump.com snapshot or
            the 2024 RNC platform PDF before the campaign pages went dark.
          </p>

          <div className="space-y-6 max-w-3xl">
            {FEATURED.map((c) => (
              <figure
                key={c.id}
                className="bg-white border border-parchment-300 p-6 md:p-7 relative"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">
                    {c.category}
                  </span>
                  <span className="text-ink-3">·</span>
                  <StatusStamp status={c.outcome_status} />
                </div>
                <blockquote className="font-editorial text-lg text-ink-950 leading-snug">
                  &ldquo;{c.verbatim_quote}.&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-[12px] text-ink-3 font-mono leading-relaxed">
                  <div>
                    Source: {c.source_page} · captured {c.captured_date}
                    {c.deleted_after ? ` · deleted after ${c.deleted_after}` : ' · still live'}
                  </div>
                  <div className="mt-2 text-ink-700 font-sans text-[13px] leading-relaxed">
                    {c.outcome_notes}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 text-[14px]">
            <Link
              href="/trump"
              className="text-authority-700 hover:text-authority-800 underline-offset-4 hover:underline font-medium"
            >
              → See all 52 commitments graded in real time at campaignreceipts.com/trump
            </Link>
            <p className="cr-sealed-cta rounded-md border border-line bg-parchment-50 px-4 py-3 text-sm font-serif text-ink-700">
              This is one of 145 promises in <strong className="text-broken-600">SEALED</strong> — the 144-page book that grades them all.{' '}
              <a
                href="https://sealed2016.com/?utm_source=campaignreceipts&utm_medium=cross-link&utm_content=2024-preservation-commitments"
                target="_blank"
                rel="noopener noreferrer"
                className="text-authority-700 underline-offset-4 hover:underline"
              >
                Read more →
              </a>
              <span className="text-ink-500">&nbsp;or&nbsp;</span>
              <a
                href="https://creativelabs2016.lemonsqueezy.com/checkout/buy/90308e58-3e24-40fa-b9be-269480ef8767?utm_source=campaignreceipts&utm_medium=cross-link-buy&utm_content=2024-preservation-commitments"
                target="_blank"
                rel="noopener noreferrer"
                className="text-authority-700 underline-offset-4 hover:underline"
              >
                get the book — $15 →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ─── 4. Email capture band ─── */}
      <section className="bg-parchment-100 border-b border-parchment-200">
        <div className="section-shell py-16">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
              The deletion timeline
            </div>
            <h2 className="font-editorial text-display-sm text-ink-950 mb-3">
              Get the deletion timeline — free one-pager
            </h2>
            <p className="text-[15px] text-ink-700 leading-relaxed mb-6">
              Which pages went down, when, and what was on them. Plus the SEALED reading list
              (the 2016 promise scorecard and a Chapter 10 preview).
            </p>
            <SubscribeForm />
            <p className="text-[11px] text-ink-3 mt-3 font-mono">
              Double opt-in via Mailchimp. Unsubscribe in one click.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 5. Methodology footnote ─── */}
      <section className="bg-white">
        <div className="section-shell py-12">
          <div className="max-w-2xl text-[13px] text-ink-700 leading-relaxed">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-3 mb-2 font-mono">
              Methodology footnote
            </div>
            <p>
              Pages mirrored from donaldjtrump.com via Internet Archive captures around{' '}
              {CAPTURE_DATE}. Live URLs returned 404 or redirected to the donation shell by{' '}
              {DELETION_DATE}. We make no claim about why the pages were removed — only that
              they were. Read our full methodology at{' '}
              <Link
                href="/methodology"
                className="text-authority-700 hover:text-authority-800 underline-offset-4 hover:underline font-medium"
              >
                /methodology
              </Link>
              . Spot an error?{' '}
              <a
                href="mailto:corrections@campaignreceipts.com?subject=2024%20Archive%20correction"
                className="text-authority-700 hover:text-authority-800 underline-offset-4 hover:underline font-medium"
              >
                Report it →
              </a>
            </p>
          </div>
        </div>
      </section>
    </TrustSurface>
  )
}

function StatusStamp({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    KEPT:        { label: 'Kept',        cls: 'text-kept-600 border-kept-600/50' },
    IN_PROGRESS: { label: 'In motion',   cls: 'text-partial-600 border-partial-600/50' },
    PENDING:     { label: 'Pending',     cls: 'text-ink-3 border-parchment-300' },
    BROKEN:      { label: 'Broken',      cls: 'text-broken-600 border-broken-600/50' },
  }
  const v = map[status]
  return (
    <span
      className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border ${v.cls}`}
    >
      {v.label}
    </span>
  )
}

function SubscribeForm() {
  return (
    <form
      action="/api/email/subscribe"
      method="POST"
      className="flex flex-col sm:flex-row gap-3 max-w-md"
    >
      <input type="hidden" name="source_book_id" value="2024-archive-landing" />
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="flex-1 px-4 py-3 bg-white border border-parchment-300 focus:border-authority-600 focus:outline-none text-[14px] text-ink-950 font-editorial"
        aria-label="Email address"
      />
      <button
        type="submit"
        className="bg-authority-700 hover:bg-authority-800 text-white px-5 py-3 text-sm uppercase tracking-wider font-semibold transition-colors"
      >
        Send it
      </button>
    </form>
  )
}
