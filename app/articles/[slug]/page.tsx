// /articles/[slug] — single article detail page.
//
// Renders cr_articles row. Markdown body via marked. Source-refs block
// at the bottom is mandatory for race_funding articles (the generator
// refuses to publish without it).

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { supabaseService } from '@/lib/supabase'
import ShareButtons from '@/app/components/ShareButtons'
import SealedBookBand from '@/app/components/SealedBookBand'
import NewsletterCapture from '@/app/components/NewsletterCapture'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Source = {
  publication: string
  url: string
  retrieved_at?: string
}

type Article = {
  slug: string
  kind: 'race_funding' | 'weekly_receipt' | 'editorial' | 'video_companion' | 'weekly_story'
  title: string
  dek: string | null
  body_md: string
  hero_image_url: string | null
  source_refs: Source[]
  related_race_id: string | null
  politician_ids: string[] | null
  published_at: string | null
  generator: string | null
  status: string
  youtube_id: string | null
}

type PoliticianChip = {
  slug: string
  name: string
}

type RaceLink = {
  slug: string
  headline: string
  district: string | null
  state: string | null
}

async function getArticle(slug: string): Promise<Article | null> {
  const { data } = await supabaseService
    .from('cr_articles')
    .select(
      'slug, kind, title, dek, body_md, hero_image_url, source_refs, related_race_id, politician_ids, published_at, generator, status, youtube_id',
    )
    .eq('slug', slug)
    .in('status', ['published', 'archived'])
    .maybeSingle()
  return (data as Article) || null
}

async function getRaceLink(raceId: string | null): Promise<RaceLink | null> {
  if (!raceId) return null
  const { data } = await supabaseService
    .from('cr_races')
    .select('slug, headline, district, state')
    .eq('id', raceId)
    .maybeSingle()
  return (data as RaceLink) || null
}

/** Look up politician chip data for the article's politician_ids array.
 *  Only returns chips for slugs that actually exist in cr_politicians —
 *  the chip renders as a link; unmatched slugs are silently dropped so
 *  the page never ships a chip that 404s. */
async function getPoliticianChips(
  slugs: string[] | null,
): Promise<PoliticianChip[]> {
  if (!slugs || slugs.length === 0) return []
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('slug, name')
    .in('slug', slugs)
  const found = (data as PoliticianChip[]) || []
  // Preserve the order specified in the article's politician_ids array.
  const bySlug = new Map(found.map((p) => [p.slug, p]))
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as PoliticianChip[]
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const a = await getArticle(params.slug)
  if (!a) return { title: 'Article not found · CampaignReceipts' }
  const canonical = `/articles/${a.slug}`
  const ogImages = a.hero_image_url ? [{ url: a.hero_image_url }] : undefined
  return {
    title: `${a.title} · CampaignReceipts`,
    description: a.dek || '',
    alternates: { canonical },
    openGraph: {
      title: a.title,
      description: a.dek || '',
      type: 'article',
      url: canonical,
      ...(a.published_at ? { publishedTime: a.published_at } : {}),
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: a.hero_image_url ? 'summary_large_image' : 'summary',
      title: a.title,
      description: a.dek || '',
      ...(ogImages ? { images: ogImages } : {}),
    },
  }
}

const KIND_LABEL = {
  race_funding: 'Race funding',
  weekly_receipt: 'Bill Donor Influence',
  editorial: 'Editorial',
  video_companion: 'Video companion',
  weekly_story: 'Weekly Receipt',
} as const

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const a = await getArticle(params.slug)
  if (!a) notFound()
  const race = await getRaceLink(a.related_race_id)
  const politicianChips = await getPoliticianChips(a.politician_ids)

  // Render markdown server-side. `marked` is synchronous and safe for
  // our own LLM-generated copy (no user input); we don't need DOMPurify
  // because the source is curated.
  const bodyHtml = marked.parse(a.body_md || '', { async: false }) as string

  // schema.org/Article JSON-LD — makes the page eligible for news/article
  // rich results and gives Google a datePublished signal for freshness.
  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    ...(a.dek ? { description: a.dek } : {}),
    ...(a.hero_image_url ? { image: [a.hero_image_url] } : {}),
    ...(a.published_at ? { datePublished: a.published_at, dateModified: a.published_at } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://campaignreceipts.com/articles/${a.slug}`,
    },
    author: { '@type': 'Organization', name: 'CampaignReceipts' },
    publisher: {
      '@type': 'Organization',
      name: 'CampaignReceipts',
      url: 'https://campaignreceipts.com',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* ───── MASTHEAD ──────────────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors mb-6"
          >
            ← All articles
          </Link>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3 flex items-baseline gap-3 flex-wrap">
            <span>{KIND_LABEL[a.kind]}</span>
            {a.published_at && (
              <span className="text-ink-3">
                ·{' '}
                {new Date(a.published_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
          <h1 className="font-display text-[40px] sm:text-[56px] leading-[0.98] tracking-[-0.015em] text-ink text-balance m-0 max-w-3xl">
            {a.title}
          </h1>
          {a.dek && (
            <p className="mt-5 font-sans text-[18px] sm:text-[20px] text-ink-2 leading-[1.5] max-w-2xl">
              {a.dek}
            </p>
          )}
          {race && (
            <div className="mt-6">
              <Link
                href={`/race/${race.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-broken/30 bg-broken/[0.06] text-broken hover:bg-broken/[0.12] font-mono text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 transition-colors no-underline"
              >
                Race page: {race.district || race.state} · {race.headline} →
              </Link>
            </div>
          )}
          {politicianChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 self-center mr-1">
                People in this story:
              </span>
              {politicianChips.map((p) => (
                <Link
                  key={p.slug}
                  href={`/politician/${p.slug}`}
                  className="inline-flex items-center rounded-full border border-line bg-paper text-ink hover:bg-broken/[0.08] hover:text-broken hover:border-broken/30 font-mono text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 transition-colors no-underline"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───── VIDEO EMBED (video_companion + weekly_story once youtube_id lands) ───────────── */}
      {(a.kind === 'video_companion' || a.kind === 'weekly_story') && a.youtube_id && (
        <section className="bg-paper border-b border-line">
          <div className="section-shell py-8 sm:py-10">
            <div className="max-w-[860px] mx-auto">
              <div className="relative w-full overflow-hidden rounded-lg border border-line bg-black" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${a.youtube_id}`}
                  title={a.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
                Watch on YouTube ·{' '}
                <a
                  href={`https://www.youtube.com/watch?v=${a.youtube_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 decoration-line hover:decoration-ink text-ink"
                >
                  open in new tab
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───── BODY ─────────────────────────────────────────── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-12 sm:py-16">
          <article
            className="article-body max-w-[720px] mx-auto"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          <div className="max-w-[720px] mx-auto mt-10">
            <NewsletterCapture
              variant="inline-receipt"
              surface="article"
              sourceSlug={a.slug}
              heading="See who paid to write the bill."
              body="Each week we name the donors behind a bill — and the votes they bought."
              buttonLabel="Get the newsletter"
            />
          </div>

          <div className="max-w-[720px] mx-auto mt-10 pt-8 border-t border-dotted border-line">
            <ShareButtons
              title={a.title}
              tagline={a.dek || undefined}
              source={`article-${a.kind}`}
            />
          </div>
        </div>
      </section>

      {/* ───── PRIMARY SOURCES ──────────────────────────────── */}
      {a.source_refs && a.source_refs.length > 0 && (
        <section className="bg-paper-2 border-b border-line">
          <div className="section-shell py-12">
            <div className="max-w-[720px] mx-auto">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
                Primary sources
              </div>
              <h2 className="font-display text-[24px] sm:text-[28px] leading-[1.1] tracking-[-0.005em] text-ink m-0 mb-5">
                Every link, every publication.
              </h2>
              <ol className="m-0 p-0 list-none space-y-2">
                {a.source_refs.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-line bg-paper p-4 flex items-baseline justify-between gap-4 flex-wrap"
                  >
                    <div className="min-w-0">
                      <div className="font-sans text-[14px] text-ink font-medium">
                        {s.publication}
                      </div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-ink-2 hover:text-ink underline underline-offset-2 decoration-line hover:decoration-ink break-all"
                      >
                        {s.url}
                      </a>
                    </div>
                    {s.retrieved_at && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 shrink-0">
                        retrieved {s.retrieved_at}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* ───── METHODOLOGY FOOTNOTE ─────────────────────────── */}
      {a.kind === 'race_funding' && (
        <section className="bg-paper border-b border-line">
          <div className="section-shell py-10">
            <div className="max-w-[720px] mx-auto font-sans text-[14px] text-ink-2 leading-[1.55]">
              <strong className="text-ink">How this article was generated:</strong>{' '}
              Race-funding articles on CR are written by an LLM
              (Claude Haiku) from structured FEC data and published
              sources only. The pipeline refuses to publish without
              primary-source citations. Articles re-generate in place
              as FEC filings update. We don't predict winners — we
              surface money flows. Read{' '}
              <Link
                href="/methodology"
                className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                the full methodology
              </Link>
              .
            </div>
          </div>
        </section>
      )}

      <SealedBookBand placement={`article-${a.kind}`} />
    </>
  )
}
