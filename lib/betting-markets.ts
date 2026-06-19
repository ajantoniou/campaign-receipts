// betting-markets.ts — read-only fetcher for public political betting-market odds.
//
// Source: Polymarket Gamma API (https://gamma-api.polymarket.com) — public, no key.
// We pull POLITICS-tagged events and surface, per event, the candidate/outcome
// markets ranked by current YES price. We NEVER fabricate odds: if the fetch
// fails or returns nothing, the caller renders an honest empty state.
//
// This is MARKET SPECULATION, not CampaignReceipts data, not a prediction,
// not advice. The UI must say so.

import { matchMarketToDb, type EdgeResult } from './betting-edge'

const GAMMA = 'https://gamma-api.polymarket.com'

// Curated political topics to surface, grouped sensibly. Each entry is a
// Polymarket event slug (stable) plus the bucket we file it under.
const CURATED: { slug: string; group: BettingGroup }[] = [
  { slug: 'presidential-election-winner-2028', group: 'Elections' },
  { slug: 'democratic-presidential-nominee-2028', group: 'Elections' },
  { slug: 'republican-presidential-nominee-2028', group: 'Elections' },
]

// Politics-tag fallback fill (top events by volume) so the page stays populated
// even if a curated slug is retired. We tag-fetch and append any we don't have.
const POLITICS_TAG = 'politics'

export type BettingGroup = 'Elections' | 'Legislation' | 'World & Policy'

export interface BettingOutcome {
  label: string // e.g. candidate name or "Yes"
  yesPct: number // 0-100
}

export interface BettingMarket {
  id: string
  question: string
  group: BettingGroup
  outcomes: BettingOutcome[] // ranked, highest YES first, capped
  volumeUsd: number | null
  sourceUrl: string
  endDate: string | null
  slug: string
  edge: EdgeResult | null
}

export interface BettingSnapshot {
  ok: boolean
  source: 'polymarket' | null
  markets: BettingMarket[]
  fetchedAt: string
  error?: string
}

interface GammaMarket {
  id: string
  question: string
  groupItemTitle?: string
  outcomes?: string // JSON string like ["Yes","No"]
  outcomePrices?: string // JSON string like ["0.0105","0.9895"]
  volume?: string | number
  closed?: boolean
  active?: boolean
  slug?: string
}

interface GammaEvent {
  id: string
  title: string
  slug: string
  volume?: string | number
  endDate?: string
  closed?: boolean
  markets?: GammaMarket[]
}

function parseJsonArray(s: string | undefined): string[] {
  if (!s) return []
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

function num(v: string | number | undefined): number | null {
  if (v === undefined || v === null) return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : null
}

const MAX_OUTCOMES = 6

// Turn a Gamma event into a single display market.
// Multi-candidate events (e.g. a nominee race) have many sub-markets, each a
// Yes/No on one candidate — we surface the top candidates by YES price.
// Simple two-outcome events surface that one market's Yes/No.
export function eventToMarket(ev: GammaEvent, group: BettingGroup): BettingMarket | null {
  const subs = (ev.markets || []).filter((m) => !m.closed && m.active !== false)
  if (subs.length === 0) return null

  const eventUrl = `https://polymarket.com/event/${ev.slug}`

  // Candidate-style: many sub-markets, each labeled by groupItemTitle.
  if (subs.length > 1) {
    const outcomes: BettingOutcome[] = []
    for (const m of subs) {
      const labels = parseJsonArray(m.outcomes)
      const prices = parseJsonArray(m.outcomePrices)
      const yesIdx = labels.findIndex((l) => l.toLowerCase() === 'yes')
      const idx = yesIdx >= 0 ? yesIdx : 0
      const p = num(prices[idx])
      if (p === null) continue
      const label = m.groupItemTitle || m.question
      outcomes.push({ label, yesPct: Math.round(p * 1000) / 10 })
    }
    if (outcomes.length === 0) return null
    outcomes.sort((a, b) => b.yesPct - a.yesPct)
    return {
      id: ev.id,
      question: ev.title,
      group,
      outcomes: outcomes.slice(0, MAX_OUTCOMES),
      volumeUsd: num(ev.volume),
      sourceUrl: eventUrl,
      endDate: ev.endDate ?? null,
      slug: ev.slug,
      edge: null,
    }
  }

  // Single Yes/No market.
  const m = subs[0]
  const labels = parseJsonArray(m.outcomes)
  const prices = parseJsonArray(m.outcomePrices)
  const outcomes: BettingOutcome[] = []
  for (let i = 0; i < labels.length && i < prices.length; i++) {
    const p = num(prices[i])
    if (p === null) continue
    outcomes.push({ label: labels[i], yesPct: Math.round(p * 1000) / 10 })
  }
  if (outcomes.length === 0) return null
  return {
    id: ev.id,
    question: ev.title || m.question,
    group,
    outcomes: outcomes.slice(0, MAX_OUTCOMES),
    volumeUsd: num(ev.volume) ?? num(m.volume),
    sourceUrl: eventUrl,
    endDate: ev.endDate ?? m['endDate' as keyof GammaMarket] ?? null,
    slug: ev.slug,
    edge: null,
  } as BettingMarket
}

export async function fetchEventBySlug(slug: string): Promise<GammaEvent | null> {
  const res = await fetch(`${GAMMA}/events?slug=${encodeURIComponent(slug)}&closed=false`, {
    next: { revalidate: 600 },
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  const arr = (await res.json()) as GammaEvent[]
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : null
}

async function fetchPoliticsTagEvents(limit: number): Promise<GammaEvent[]> {
  const res = await fetch(
    `${GAMMA}/events?closed=false&limit=${limit}&order=volume&ascending=false&tag_slug=${POLITICS_TAG}`,
    { next: { revalidate: 600 }, headers: { Accept: 'application/json' } },
  )
  if (!res.ok) return []
  const arr = (await res.json()) as GammaEvent[]
  return Array.isArray(arr) ? arr : []
}

export function classify(title: string): BettingGroup {
  const t = title.toLowerCase()
  if (/(senate|house|congress|bill|shutdown|speaker|impeach|confirm|nominee for|cabinet)/.test(t))
    return 'Legislation'
  if (/(president|election|primary|governor|mayor|nominee|win the)/.test(t)) return 'Elections'
  return 'World & Policy'
}

export async function getBettingSnapshot(): Promise<BettingSnapshot> {
  const fetchedAt = new Date().toISOString()
  try {
    const seen = new Set<string>()
    const markets: BettingMarket[] = []

    // 1) Curated events first (stable, editorially chosen).
    const curated = await Promise.all(
      CURATED.map(async (c) => {
        const ev = await fetchEventBySlug(c.slug)
        return ev ? { ev, group: c.group } : null
      }),
    )
    for (const c of curated) {
      if (!c) continue
      const mk = eventToMarket(c.ev, c.group)
      if (mk && !seen.has(mk.id)) {
        seen.add(mk.id)
        markets.push(mk)
      }
    }

    // 2) Top politics-tagged events fill the rest.
    const tagged = await fetchPoliticsTagEvents(100)
    for (const ev of tagged) {
      if (markets.length >= 100) break
      const mk = eventToMarket(ev, classify(ev.title))
      if (mk && !seen.has(mk.id) && mk.outcomes.length > 0) {
        seen.add(mk.id)
        markets.push(mk)
      }
    }

    // 3) Resolve Edge Data for all markets concurrently
    await Promise.all(
      markets.map(async (m) => {
        try {
          m.edge = await matchMarketToDb(m.question, m.slug)
        } catch (e) {
          console.error(`Edge match error for ${m.id}:`, e)
        }
      })
    )

    if (markets.length === 0) {
      return { ok: false, source: null, markets: [], fetchedAt, error: 'No markets returned.' }
    }
    return { ok: true, source: 'polymarket', markets, fetchedAt }
  } catch (err) {
    return {
      ok: false,
      source: null,
      markets: [],
      fetchedAt,
      error: err instanceof Error ? err.message : 'fetch failed',
    }
  }
}
