// /articles — unified index for race-funding auto-gen + Friday
// Receipts archive + editorial.
//
// Per founder rev-7 batch C+ (2026-05-17): we wanted a blog/SEO surface
// that consolidates two content streams (auto-generated race funding
// analyses + Friday Receipts newsletter archive). One backend, one URL
// pattern, two writer pipelines.
//
// Free tier. Filterable by kind. Sorted by published_at desc.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import SealedBookBand from '@/app/components/SealedBookBand'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Money-in-Politics Investigations & Newsletter Archive | CampaignReceipts',
  description:
    'Race-funding investigations, the Bill Donor Influence newsletter archive, and long-form editorial — who pays whom in U.S. politics. Free. Primary-sourced.',
  alternates: { canonical: '/articles' },
  openGraph: {
    title: 'Money-in-Politics Investigations · CampaignReceipts',
    description:
      'Race-funding investigations + Bill Donor Influence archive + long-form editorial. Free.',
  },
}

type Article = {
  slug: string
  kind: 'race_funding' | 'weekly_receipt' | 'editorial' | 'weekly_story'
  title: string
  dek: string | null
  published_at: string | null
  hero_image_url: string | null
}

async function getArticles(filter?: string): Promise<Article[]> {
  let q = supabaseService
    .from('cr_articles')
    .select('slug, kind, title, dek, published_at, hero_image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(60)
  if (filter && filter !== 'all') q = q.eq('kind', filter)
  const { data } = await q
  return (data as Article[]) || []
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const KIND_LABEL: Record<Article['kind'], string> = {
  race_funding: 'Race funding',
  weekly_receipt: 'Bill Donor Influence',
  editorial: 'Editorial',
  weekly_story: 'Weekly Receipt',
}

const KIND_TINT: Record<Article['kind'], string> = {
  race_funding: 'bg-broken/[0.08] text-broken border-broken/30',
  weekly_receipt: 'bg-pending/[0.08] text-pending border-pending/30',
  editorial: 'bg-paper-3 text-ink-2 border-line',
  weekly_story: 'bg-broken/[0.08] text-broken border-broken/30',
}

export default async function ArticlesIndexPage({
  searchParams,
}: {
  searchParams: { kind?: string }
}) {
  const kind = searchParams.kind || 'all'
  const articles = await getArticles(kind)

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
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            Articles · the long form
          </div>
          <h1 className="font-display text-[44px] sm:text-[60px] leading-[0.96] tracking-[-0.015em] text-ink text-balance m-0 max-w-3xl">
            Race-funding analysis, weekly receipts, editorial.
          </h1>
          <p className="mt-5 font-sans text-[17px] text-ink-2 leading-[1.55] max-w-2xl">
            Auto-generated funding analyses for every active campaign
            race, the Bill Donor Influence newsletter archive, and long-form
            editorial. Every article cites primary sources by name.
          </p>

          {/* Filter chips */}
          <div className="mt-7 flex items-center gap-2 flex-wrap font-sans text-[13px]">
            <FilterChip href="/articles" active={kind === 'all'} label="All" />
            <FilterChip
              href="/articles?kind=race_funding"
              active={kind === 'race_funding'}
              label="Race funding"
            />
            <FilterChip
              href="/articles?kind=weekly_receipt"
              active={kind === 'weekly_receipt'}
              label="Bill Donor Influence"
            />
            <FilterChip
              href="/articles?kind=editorial"
              active={kind === 'editorial'}
              label="Editorial"
            />
          </div>
        </div>
      </section>

      {/* ───── ARTICLE LIST ──────────────────────────────────── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-12 sm:py-16">
          <div className="max-w-[860px] mx-auto">
            {articles.length === 0 && (
              <div className="rounded-lg border border-line bg-paper-2 p-12 text-center">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-3">
                  Nothing here yet
                </div>
                <p className="font-sans text-[15px] text-ink-2 leading-relaxed max-w-md mx-auto m-0">
                  First articles ship as we add active races and as the
                  Bill Donor Influence archive backfills. Subscribe to the
                  newsletter to catch them as they go out.
                </p>
              </div>
            )}

            <ol className="m-0 p-0 list-none space-y-3">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/articles/${a.slug}`}
                    className="block rounded-lg border border-line bg-paper hover:bg-paper-2 hover:border-ink-3 transition-all p-5 sm:p-6 no-underline group"
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border ${KIND_TINT[a.kind]}`}
                      >
                        {KIND_LABEL[a.kind]}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        {fmtDate(a.published_at)}
                      </span>
                    </div>
                    <h2 className="font-display text-[24px] sm:text-[30px] leading-[1.1] tracking-[-0.005em] text-ink m-0 mb-2">
                      {a.title}
                    </h2>
                    {a.dek && (
                      <p className="font-sans text-[15px] text-ink-2 leading-[1.55] m-0">
                        {a.dek}
                      </p>
                    )}
                    <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink group-hover:text-ink-2 transition-colors">
                      Read →
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <SealedBookBand placement="articles-index" />
    </>
  )
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-ink text-paper border-ink'
          : 'bg-paper text-ink-2 border-line hover:border-ink-3 hover:text-ink'
      }`}
    >
      {label}
    </Link>
  )
}
