// Full paginated directory of all politicians.
// Migrated to benchmark audit-document tokens (rev 5b).

import Link from 'next/link'
import { supabaseService, type Politician } from '@/lib/supabase'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import ScorecardBar from '@/app/components/ScorecardBar'
import ScorecardAnchor from '@/app/components/ScorecardAnchor'
import { Tag, partyVariant } from '@/app/components/cr'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Politician Directory — search donors & promises for 585 politicians | CampaignReceipts',
  description: 'Search every U.S. politician we track — who funds them and which promises they kept. Filter by Live tracking or Graded scorecards. Free.',
  alternates: { canonical: '/directory' },
}

const PAGE_SIZE = 50

type Predecessor = Pick<Politician, 'slug' | 'name' | 'scorecard_percentage_kept' | 'scorecard_graded_total'>

async function getPoliticiansPage(
  page: number,
  q: string,
): Promise<{
  rows: Politician[]
  total: number
  preds: Map<string, Predecessor>
  topDonors: Map<string, { industry: string; total: number }>
}> {
  // Per founder rev-7 batch C #3: merge live + graded into a single
  // ranked list (current-term-in-progress and graded-term-ended share
  // one paginated view, distinguished by an inline "live" badge).
  let query = supabaseService.from('cr_politicians').select('*', { count: 'exact' })

  if (q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`)
  }

  query = query
    .order('scorecard_percentage_kept', { ascending: false, nullsFirst: false })
    .order('scorecard_graded_total', { ascending: false })
    .order('scorecard_pending', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

  const { data, count } = await query
  const rows = (data as Politician[]) || []

  const predSlugs = Array.from(new Set(rows.map((r) => r.predecessor_slug).filter(Boolean) as string[]))
  let preds = new Map<string, Predecessor>()
  if (predSlugs.length > 0) {
    const { data: predRows } = await supabaseService
      .from('cr_politicians')
      .select('slug, name, scorecard_percentage_kept, scorecard_graded_total')
      .in('slug', predSlugs)
    preds = new Map((predRows || []).map((p: any) => [p.slug, p as Predecessor]))
  }

  // Mine each row's #1 donor industry so we can show "Paid for by X"
  // inline. cr_industry_breakdown has rank=1 entries per politician.
  const polIds = rows.map((r) => r.id)
  const topDonors = new Map<string, { industry: string; total: number }>()
  if (polIds.length > 0) {
    const { data: donorRows } = await supabaseService
      .from('cr_industry_breakdown')
      .select('politician_id, industry_label, total_contributions')
      .eq('rank', 1)
      .in('politician_id', polIds)
    for (const r of (donorRows as any[]) || []) {
      topDonors.set(r.politician_id, {
        industry: r.industry_label,
        total: Number(r.total_contributions || 0),
      })
    }
  }

  return { rows, total: count || 0, preds, topDonors }
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string }
}) {
  // Single merged list (rev-7 batch C #3). Live + graded share one
  // sorted view; a per-row "Live" pill marks rows still in-term.
  const page = Math.max(0, parseInt(searchParams.page || '0', 10) || 0)
  const q = searchParams.q || ''
  const { rows, total, preds, topDonors } = await getPoliticiansPage(page, q)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <>
      {/* Masthead band */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-10 pb-8 sm:pt-14 sm:pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors mb-6"
          >
            ← Back to home
          </Link>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
            Full directory · paginated
          </div>
          <h1 className="font-display text-[40px] sm:text-[52px] leading-[1.0] tracking-[-0.01em] text-ink text-balance">
            All politicians — {total} on file
          </h1>
          <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed max-w-2xl">
            Every politician we track, in one ranked list. Live trackers (term
            in progress) carry a <span className="font-mono text-[11px] uppercase tracking-[0.14em] bg-paper-3 border border-line rounded px-1.5 py-0.5">live</span> tag.
            Each row shows the top donor industry by FEC contributions.
          </p>

          {/* Search */}
          <form className="mt-5 flex gap-2 max-w-xl" method="get">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name…"
              className="flex-1 bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-md px-4 py-2 font-sans text-[14px] text-ink placeholder:text-ink-3 transition"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2 transition-colors border border-ink"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Directory list */}
      <article className="section-shell py-10">
        <ol className="grid gap-2.5 list-none p-0 m-0">
          {rows.map((p, idx) => {
            const isLive = p.current_term_end && p.current_term_end > todayStr
            const donor = topDonors.get(p.id)
            return (
              <li key={p.id}>
                <Link
                  href={`/politician/${p.slug}`}
                  className="group flex items-center gap-3 sm:gap-4 rounded-lg border border-line bg-paper hover:bg-paper-2 hover:border-ink-3 transition-all duration-200 p-3 sm:p-4"
                >
                  <span className="font-mono text-[11px] text-ink-3 w-8 tabular-nums text-center shrink-0">
                    {String(page * PAGE_SIZE + idx + 1).padStart(3, '0')}
                  </span>
                  <PoliticianAvatar name={p.name} party={p.party} photoUrl={p.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans text-[15px] font-medium text-ink truncate">{p.name}</span>
                      <Tag variant={partyVariant(p.party)}>
                        {p.party?.[0] || '?'} · {p.state || '—'} · {p.branch}
                      </Tag>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] bg-kept/[0.1] text-kept border border-kept/40 rounded px-1.5 py-0.5">
                          <span className="size-1.5 rounded-full bg-kept animate-pulse" aria-hidden />
                          Live
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <ScorecardBar
                        kept={p.scorecard_kept}
                        partial={p.scorecard_partial}
                        broken={p.scorecard_broken}
                        youDecide={p.scorecard_you_decide}
                        total={p.scorecard_graded_total || p.scorecard_total}
                        size="sm"
                      />
                    </div>
                    {donor && (
                      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 truncate">
                        Paid for by: <span className="text-ink-2">{donor.industry}</span>
                        {donor.total > 0 && <span className="text-ink-3"> · {fmtMoney(donor.total)}</span>}
                      </div>
                    )}
                  </div>
                  <ScorecardAnchor
                    politician={p}
                    predecessor={p.predecessor_slug ? preds.get(p.predecessor_slug) ?? null : null}
                    size="sm"
                  />
                  <span
                    className="hidden sm:inline font-mono text-[14px] text-ink-3 group-hover:text-ink transition-colors shrink-0"
                    aria-hidden
                  >
                    →
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>

        {rows.length === 0 && (
          <div className="rounded-lg border border-line bg-paper-2 p-12 text-center font-sans text-[14px] text-ink-2">
            No politicians match these filters.
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-between" aria-label="Pagination">
            <Link
              href={`/directory?page=${Math.max(0, page - 1)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              aria-disabled={page === 0}
              className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors ${page === 0 ? 'opacity-40 pointer-events-none' : ''}`}
            >
              ← Previous
            </Link>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
              Page {page + 1} of {totalPages}
            </div>
            <Link
              href={`/directory?page=${Math.min(totalPages - 1, page + 1)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              aria-disabled={page >= totalPages - 1}
              className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors ${page >= totalPages - 1 ? 'opacity-40 pointer-events-none' : ''}`}
            >
              Next →
            </Link>
          </nav>
        )}
      </article>

    </>
  )
}
