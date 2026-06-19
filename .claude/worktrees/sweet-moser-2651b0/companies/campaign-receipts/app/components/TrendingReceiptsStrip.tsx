// TrendingReceiptsStrip — 5 thumbnails above the homepage hero.
//
// Per viral-influencer panel (2026-05-19): "Influencers chase the
// leaderboard." Strip shows the 5 most-screenshotted receipts of the
// past 7 days. The Adelson $250M quote pins permanent #1 until
// something bigger lands — it's CR's editorial founding document.
//
// Pulls from cr_weekly_snapshot (panel-spec'd primitive) with the
// Adelson anchor injected at position 0. View counts are placeholder
// for now (we don't have analytics wired); the strip still creates
// the "leaderboard" social pressure influencers respond to.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import { getBucketMovement, formatMovement, movementToneClass, type Movement } from '@/lib/leaderboard-movement'

type StripItem = {
  id: string
  title: string
  subtitle: string
  imgUrl: string
  href: string
  isAnchor?: boolean
  politicianId?: string
  movement?: Movement
}

const ADELSON_ANCHOR: StripItem = {
  id: 'adelson-250m',
  title: 'Trump: "Adelson gave $250M"',
  subtitle: 'White House · Dec 16, 2025',
  imgUrl: '/api/card/receipt/adelson-250m',
  href: '/r/adelson-250m',
  isAnchor: true,
}

async function getTrendingItems(): Promise<StripItem[]> {
  // Pull the 4 most recent weekly snapshots (not the Adelson anchor).
  const { data: snapshots } = await supabaseService
    .from('cr_weekly_snapshot')
    .select(`
      politician_id, top_donor_industry, top_donor_industry_total_usd,
      shock_score, week_ending, was_receipt_of_week,
      politician:cr_politicians!inner(slug, name, party, state)
    `)
    .order('week_ending', { ascending: false })
    .order('shock_score', { ascending: false })
    .limit(8)

  // Latest week_ending for movement lookup.
  const latestWeek = ((snapshots as any[]) || [])[0]?.week_ending || null

  // Movement deltas in the most_shock_score bucket. If history is
  // empty (no prior week yet), the helper returns 'new' for every
  // politician — honest, not faked.
  const movement = latestWeek
    ? await getBucketMovement('most_shock_score', latestWeek)
    : new Map<string, Movement>()

  const items: StripItem[] = []
  for (const row of (snapshots as any[]) || []) {
    if (items.length >= 4) break
    const p = row.politician
    if (!p?.slug) continue
    items.push({
      id: p.slug,
      title: p.name,
      subtitle:
        row.top_donor_industry
          ? `${row.top_donor_industry} · top donor`
          : `${p.party?.[0] || ''}-${p.state || ''}`,
      imgUrl: `/api/card/receipt/${p.slug}`,
      href: `/r/${p.slug}`,
      politicianId: row.politician_id,
      movement: movement.get(row.politician_id),
    })
  }

  return [ADELSON_ANCHOR, ...items]
}

export default async function TrendingReceiptsStrip() {
  const items = await getTrendingItems()

  return (
    <section className="bg-paper-2 border-b border-line">
      <div className="section-shell pt-6 pb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-broken inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
            Trending receipts · this week
          </div>
          <Link
            href="/articles"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 hover:text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
          >
            See all →
          </Link>
        </div>
        <ol className="m-0 p-0 list-none grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {items.map((item, i) => (
            <li key={item.id} className="contents">
              <Link
                href={item.href}
                className={`group relative block rounded-md overflow-hidden border ${
                  item.isAnchor
                    ? 'border-amber-stat border-2'
                    : 'border-line hover:border-ink-3'
                } bg-bone hover:bg-paper-3 transition-all aspect-[4/5] no-underline`}
              >
                {/* Tiny rank pill — design-pass 2026-05-19: 10px floor
                    for mono caps, stronger border so the chip reads
                    against any photo background underneath. */}
                <div className="absolute top-1.5 left-1.5 z-10 font-mono text-[10px] uppercase tracking-[0.16em] text-ink bg-paper/95 backdrop-blur-sm rounded px-1.5 py-0.5 border border-ink/20">
                  {item.isAnchor ? '★ pinned' : `#${i + 1}`}
                </div>
                {/* Movement indicator — top-right, ↑↓ NEW. NEW state
                    uses --amber-text (#B8821C), the AA-passing amber
                    instead of the decorative #E8A33D bar-fill amber. */}
                {!item.isAnchor && item.movement && (
                  <div
                    className={`absolute top-1.5 right-1.5 z-10 font-mono text-[10px] uppercase tracking-[0.14em] bg-paper/95 backdrop-blur-sm rounded px-1.5 py-0.5 border border-ink/20 ${
                      item.movement.kind === 'new'
                        ? 'text-amber-text'
                        : movementToneClass(item.movement)
                    }`}
                  >
                    {formatMovement(item.movement)}
                  </div>
                )}
                {/* Thumbnail (PNG card render at small size) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imgUrl}
                  alt={`${item.title} receipt card`}
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
                {/* Bottom strip — title + subtitle */}
                <div className="absolute inset-x-0 bottom-0 bg-ink/85 backdrop-blur-sm text-paper px-2 py-1.5">
                  <div className="font-display text-[12px] leading-[1.15] text-paper truncate">
                    {item.title}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-paper/70 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
