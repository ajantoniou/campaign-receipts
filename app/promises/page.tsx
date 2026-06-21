// /promises — the free, browsable index of EVERY graded promise.
//
// Founder direction 2026-05-30: "People won't pay for campaign promises
// kept or broken — so show them ALL FREE, each with a brief case study."
// Promises = free credibility + traffic. The paywall is the
// donor-influence product, NOT promises.
//
// CARVE-OUT: Trump's promises stay PAID (the SEALED book / sealed2016.com).
// This index excludes Trump's politician_id and never touches /trump.
//
// Brief case study = case_study_narrative where it exists (44 rows),
// else verdict_reasoning (always present on graded promises). Never empty.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import { Stamp } from '@/app/components/cr'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Every promise, graded — free | CampaignReceipts',
  description:
    'Search every campaign promise we graded. Kept, partial, or broken — each with the receipt. All free.',
  alternates: { canonical: '/promises' },
}

// Trump stays paid (SEALED book / sealed2016.com). Hard-exclude here —
// never give away free, it would cannibalize the book.
// TWO records exist: the 2024 live tracker (slug donald-trump) AND the
// 2016-cycle SEALED book promises (slug donald-trump-2016, 81 promises).
// BOTH must be excluded from this free index.
const TRUMP_IDS = [
  'e2d860f4-a0fa-4a70-b18d-c1c4205296ef', // donald-trump (2024 live tracker)
  '93ce9ea2-16c9-4517-b951-7a25ac812be8', // donald-trump-2016 (SEALED book — paid)
]

const PAGE_SIZE = 30

type Verdict = 'kept' | 'partial' | 'broken' | 'decide'

const VK: Record<string, Verdict> = {
  KEPT: 'kept',
  PARTIAL: 'partial',
  BROKEN: 'broken',
  YOU_DECIDE: 'decide',
  'YOU DECIDE': 'decide',
}

function vk(v: string | null | undefined): Verdict {
  if (!v) return 'decide'
  return VK[v.toUpperCase()] ?? 'decide'
}

// Plain-English filter chips (3rd-grade labels, not DB codes).
const FILTERS: { key: string; label: string; db: string | null }[] = [
  { key: 'all', label: 'All promises', db: null },
  { key: 'kept', label: 'Kept', db: 'KEPT' },
  { key: 'partial', label: 'Half-kept', db: 'PARTIAL' },
  { key: 'broken', label: 'Broken', db: 'BROKEN' },
  { key: 'decide', label: 'You decide', db: 'YOU_DECIDE' },
]

type PromiseRow = {
  id: string
  politician_id: string
  promise_number: number
  promise_text: string
  category: string | null
  verdict: string | null
  verdict_reasoning: string | null
  case_study_narrative: string | null
}

type PolMeta = { slug: string; name: string; party: string | null; state: string | null }

async function getData(page: number, filterDb: string | null, q: string) {
  let query = supabaseService
    .from('cr_promises')
    .select(
      'id, politician_id, promise_number, promise_text, category, verdict, verdict_reasoning, case_study_narrative',
      { count: 'exact' },
    )
    // Hard carve-out: never surface Trump's promises here (paid product).
    .not('politician_id', 'in', `(${TRUMP_IDS.join(',')})`)
    .not('verdict', 'is', null)

  if (filterDb) query = query.eq('verdict', filterDb)
  if (q.trim()) query = query.ilike('promise_text', `%${q.trim()}%`)

  query = query
    .order('case_study_narrative', { ascending: false, nullsFirst: false })
    .order('promise_number', { ascending: true })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

  const { data, count } = await query
  const rows = (data as PromiseRow[]) || []

  // Resolve politician name/slug for each row in one batch query.
  const polIds = Array.from(new Set(rows.map((r) => r.politician_id)))
  const pol = new Map<string, PolMeta>()
  if (polIds.length > 0) {
    const { data: pols } = await supabaseService
      .from('cr_politicians')
      .select('id, slug, name, party, state')
      .in('id', polIds)
    for (const p of (pols as any[]) || []) {
      pol.set(p.id, { slug: p.slug, name: p.name, party: p.party, state: p.state })
    }
  }

  return { rows, total: count || 0, pol }
}

function cleanName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

export default async function PromisesIndexPage({
  searchParams,
}: {
  searchParams?: { v?: string; q?: string; page?: string }
}) {
  const filterKey = searchParams?.v && FILTERS.some((f) => f.key === searchParams.v) ? searchParams.v : 'all'
  const filterDb = FILTERS.find((f) => f.key === filterKey)?.db ?? null
  const q = (searchParams?.q || '').slice(0, 80)
  const page = Math.max(0, parseInt(searchParams?.page || '0', 10) || 0)

  const { rows, total, pol } = await getData(page, filterDb, q)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Build a querystring preserving filter + search for pagination links.
  const qs = (p: number) => {
    const u = new URLSearchParams()
    if (filterKey !== 'all') u.set('v', filterKey)
    if (q) u.set('q', q)
    if (p > 0) u.set('page', String(p))
    const s = u.toString()
    return s ? `/promises?${s}` : '/promises'
  }

  return (
    <>
      {/* ───── MASTHEAD ───── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            Every promise · free to read
          </div>
          <h1 className="font-display text-[40px] sm:text-[52px] leading-[0.98] tracking-[-0.01em] text-ink text-balance">
            Did they keep their promise?
          </h1>
          <p className="mt-4 font-sans text-[16px] text-ink-2 leading-relaxed max-w-2xl">
            We graded every promise. Each one shows the verdict and the receipt.
          </p>
          <p className="mt-2 font-sans text-[15px] text-ink-2 leading-relaxed max-w-2xl">
            Search a topic. Or pick kept, broken, or half-kept below.
          </p>
        </div>
      </section>

      {/* ───── SEARCH + FILTERS ───── */}
      <section className="section-shell pt-8 pb-4 border-b border-line">
        <form method="get" action="/promises" className="flex gap-2 flex-wrap mb-5">
          {filterKey !== 'all' && <input type="hidden" name="v" value={filterKey} />}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search a topic — like jobs, border, taxes"
            aria-label="Search promises by topic"
            className="bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-md px-3.5 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-3 flex-1 min-w-[240px] transition"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by verdict">
          {FILTERS.map((f) => {
            const active = f.key === filterKey
            const u = new URLSearchParams()
            if (f.key !== 'all') u.set('v', f.key)
            if (q) u.set('q', q)
            const href = u.toString() ? `/promises?${u.toString()}` : '/promises'
            return (
              <Link
                key={f.key}
                href={href}
                aria-current={active ? 'true' : undefined}
                className={`font-mono text-[11px] uppercase tracking-[0.14em] px-3.5 py-2 rounded-full border transition-colors ${
                  active
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper text-ink-2 border-line hover:border-ink hover:text-ink'
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          {total.toLocaleString()} promises {q ? `match "${q}"` : 'on file'} · all free
        </p>
      </section>

      {/* ───── PROMISE LIST ───── */}
      <section className="section-shell py-8 sm:py-10">
        {rows.length === 0 ? (
          <div className="max-w-[640px] py-12">
            <h2 className="font-display text-[24px] text-ink">No promises match.</h2>
            <p className="mt-3 font-sans text-[15px] text-ink-2">
              Try a different word, or{' '}
              <Link href="/promises" className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink">
                see all promises
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="max-w-[820px] mx-auto space-y-4">
            {rows.map((p) => (
              <PromiseCard key={p.id} promise={p} pol={pol.get(p.politician_id)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="max-w-[820px] mx-auto mt-10 flex items-center justify-between gap-3">
            {page > 0 ? (
              <Link
                href={qs(page - 1)}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:underline underline-offset-4"
              >
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
              Page {page + 1} of {totalPages}
            </span>
            {page < totalPages - 1 ? (
              <Link
                href={qs(page + 1)}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:underline underline-offset-4"
              >
                More →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </section>

      {/* ───── PAID PRODUCT CTA (the real product is donor influence) ───── */}
      <section className="section-shell pb-16">
        <aside className="max-w-[820px] mx-auto rounded-md border border-line bg-paper-2 px-5 py-5">
          <p className="font-serif text-[15px] text-ink-2 leading-relaxed">
            Promises are free. The money behind the vote is the paid part.
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <Link href="/leaderboard" className="text-authority-700 underline-offset-4 hover:underline font-sans text-[14px]">
              See who paid for the vote →
            </Link>
            <span className="text-ink-3">or</span>
            <Link href="/#newsletter" className="text-authority-700 underline-offset-4 hover:underline font-sans text-[14px]">
              Get the weekly bill email →
            </Link>
          </div>
        </aside>
      </section>
    </>
  )
}

function PromiseCard({ promise, pol }: { promise: PromiseRow; pol?: PolMeta }) {
  const verdict = vk(promise.verdict)
  const fullCase = promise.case_study_narrative?.trim() || ''
  const brief = fullCase || promise.verdict_reasoning?.trim() || ''
  const hasLongCase = fullCase.length > 0
  const teaserLimit = 240
  const needsExpand = brief.length > teaserLimit
  const teaser = needsExpand ? brief.slice(0, teaserLimit).trimEnd() + '…' : brief

  const name = pol ? cleanName(pol.name) : 'Politician'
  const meta = pol ? [pol.party, pol.state].filter(Boolean).join(' · ') : ''

  return (
    <article className="receipt">
      <div className="receipt-head">
        <div className="min-w-0 flex-1">
          <div className="receipt-id">
            {pol ? (
              <Link href={`/politician/${pol.slug}`} className="hover:text-ink underline-offset-4 hover:underline">
                {name}
                {meta ? ` · ${meta}` : ''}
              </Link>
            ) : (
              name
            )}
          </div>
          <h3 className="font-display text-[21px] leading-[1.25] tracking-[-0.005em] text-ink mt-1">
            {promise.promise_text}
          </h3>
        </div>
        <Stamp kind={verdict} />
      </div>
      <div className="receipt-body">
        {promise.category && (
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 mb-2">
            {promise.category}
          </div>
        )}
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2 mb-1">
          {hasLongCase ? 'The receipt' : 'Why this verdict'}
        </div>
        {brief ? (
          needsExpand ? (
            <details className="group">
              <summary className="cursor-pointer list-none select-none font-sans text-[14px] text-ink-2 leading-relaxed">
                <span className="group-open:hidden whitespace-pre-line">{teaser}</span>
                <span className="hidden group-open:inline whitespace-pre-line">{brief}</span>
                <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:text-ink-2">
                  <span className="group-open:hidden">Read the full receipt →</span>
                  <span className="hidden group-open:inline">Show less ↑</span>
                </span>
              </summary>
            </details>
          ) : (
            <p className="font-sans text-[14px] text-ink-2 leading-relaxed whitespace-pre-line m-0">{brief}</p>
          )
        ) : (
          <p className="font-sans text-[14px] text-ink-3 leading-relaxed m-0">Under review.</p>
        )}
      </div>
      {pol && (
        <div className="receipt-foot">
          <span>See {name}'s full record</span>
          <Link href={`/politician/${pol.slug}`} className="text-ink hover:underline underline-offset-4">
            campaignreceipts.com
          </Link>
        </div>
      )}
    </article>
  )
}
