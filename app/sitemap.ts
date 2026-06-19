import type { MetadataRoute } from 'next'
import { supabaseService } from '@/lib/supabase'
import { getAllPromises } from '@/lib/sealed-promises'

/**
 * CampaignReceipts sitemap.
 *
 * Static + dynamic routes:
 *  - hand-listed top-level pages
 *  - every politician slug
 *  - every comparison pair (cr_compare_pairs)
 *  - leaderboard tabs
 *  - state pages
 *
 * Dynamic = Next pulls from Supabase on each /sitemap.xml hit. Cached
 * by route revalidate (1h) to avoid hammering on every crawler request.
 */
export const revalidate = 3600

const BASE = 'https://campaignreceipts.com'

const STATIC: MetadataRoute.Sitemap = [
  { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE}/methodology`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE}/sources`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/2024-trump-campaign-promises`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/directory`, changeFrequency: 'weekly', priority: 0.8 },
  // Content index pages — entry points that spread crawl equity to the
  // race / article / bill detail pages added below.
  { url: `${BASE}/articles`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE}/race`, changeFrequency: 'daily', priority: 0.7 },
  { url: `${BASE}/bills`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/pricing`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/corrections`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/compare`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/leaderboard`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  { url: `${BASE}/disclaimer`, changeFrequency: 'yearly', priority: 0.2 },
]

const LEADERBOARD_TABS = [
  'most-corporate-funded',
  'most-grassroots',
  'most-broken',
  'most-kept',
  'highest-pct-pending',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const out: MetadataRoute.Sitemap = STATIC.map((r) => ({ ...r, lastModified: now }))

  // Leaderboard tabs (each is a unique indexable URL with its own OG card)
  for (const tab of LEADERBOARD_TABS) {
    out.push({
      url: `${BASE}/leaderboard?tab=${tab}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    })
  }

  // Every politician (state is also used to emit /state/<code> pages below).
  // Explicit .limit() above the PostgREST default-1000 cap so the sitemap never
  // silently truncates as the table grows (currently ~581; bills ~335).
  const { data: politicians } = await supabaseService
    .from('cr_politicians')
    .select('slug, last_refreshed_at, state')
    .limit(5000)
  for (const p of politicians || []) {
    out.push({
      url: `${BASE}/politician/${p.slug}`,
      lastModified: p.last_refreshed_at ? new Date(p.last_refreshed_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  // Every comparison pair
  const { data: pairs } = await supabaseService
    .from('cr_compare_pairs')
    .select('slug_a, slug_b')
  for (const p of pairs || []) {
    out.push({
      url: `${BASE}/compare?a=${p.slug_a}&b=${p.slug_b}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  // State pages — one per distinct state we track a politician in.
  const states = new Set<string>()
  for (const p of politicians || []) {
    if (p && (p as any).state) states.add((p as any).state)
  }
  for (const code of states) {
    out.push({
      url: `${BASE}/state/${String(code).toLowerCase()}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  }

  // Every published race (cr_races) — high-intent "[race] funding" pages.
  const { data: races } = await supabaseService
    .from('cr_races')
    .select('slug, updated_at')
  for (const r of races || []) {
    if (!r?.slug) continue
    out.push({
      url: `${BASE}/race/${r.slug}`,
      lastModified: (r as any).updated_at ? new Date((r as any).updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  // Every published article (video companions, weekly receipts, race-funding
  // pieces, editorial). Archived rows stay indexable (the article route serves
  // both 'published' and 'archived'), so include both.
  const { data: articles } = await supabaseService
    .from('cr_articles')
    .select('slug, published_at, status')
    .in('status', ['published', 'archived'])
  for (const a of articles || []) {
    if (!a?.slug) continue
    out.push({
      url: `${BASE}/articles/${a.slug}`,
      lastModified: (a as any).published_at ? new Date((a as any).published_at) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // Every bill with a money-trail page. URL is /bill/<congress>/<type><number>
  // (e.g. /bill/119/hr1), matching parseSlugParts in the bill route.
  const { data: bills } = await supabaseService
    .from('cr_bills')
    .select('congress, bill_type, bill_number, latest_action_at')
    .limit(5000)
  for (const b of bills || []) {
    if (!b?.congress || !b?.bill_type || !b?.bill_number) continue
    out.push({
      url: `${BASE}/bill/${b.congress}/${b.bill_type}${b.bill_number}`,
      lastModified: (b as any).latest_action_at ? new Date((b as any).latest_action_at) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // Every weekly receipt permalink (/receipt/<ISO-year>-W<ISO-week>).
  const { data: weeks } = await supabaseService
    .from('cr_weekly')
    .select('iso_year, iso_week')
  for (const w of weeks || []) {
    if (!w?.iso_year || !w?.iso_week) continue
    out.push({
      url: `${BASE}/receipt/${w.iso_year}-W${String(w.iso_week).padStart(2, '0')}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }

  // Every SEALED 2016-cycle promise (static corpus, 72 individual-pledge URLs).
  // Source: scripts/seed-trump-2016-cycle.json via lib/sealed-promises.ts.
  // Chapter-overview rows (category === 'Chapter overview') do NOT have
  // their own promise page — they're surfaced on /trump?chapter=… instead.
  const promiseUrls = getAllPromises()
    .filter((p) => p.category === 'Individual pledge')
  for (const p of promiseUrls) {
    out.push({
      url: `${BASE}${p.permalink}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return out
}
