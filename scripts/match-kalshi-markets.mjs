#!/usr/bin/env node
//
// scripts/match-kalshi-markets.mjs  —  optional Stage E.5 of Friday Receipts.
//
// For this week's story candidates, find a GENUINELY related live Kalshi political
// market and attach it to the candidate (cr_story_candidates.kalshi_match jsonb).
// The newsletter build then renders a "Related prediction market" line under a
// story — but ONLY when a real match exists. No match => nothing renders.
//
// This is CONTENT, not trading: we link the donor-money story to the live market
// for the same race/figure so readers can see what the market thinks. We do NOT
// place trades or imply an edge.
//
// MATCHING IS DELIBERATELY CONSERVATIVE (a forced/loose match looks worse than
// none). A candidate matches a market only when:
//   - the politician's LAST NAME appears in the event title or a market's
//     yes_sub_title (word-boundary, length>=4 to avoid short-name false hits), OR
//   - the candidate's STATE + CHAMBER matches an event title (e.g. "Texas Senate").
// Markets must be open and have real liquidity (volume_24h or open_interest > 0).
//
// Idempotent: rewrites kalshi_match for this week's candidates. No-op-safe.
//
// Usage:
//   node scripts/match-kalshi-markets.mjs [--dry-run] [--week-of=YYYY-MM-DD]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const KALSHI = 'https://api.elections.kalshi.com/trade-api/v2'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const weekArg = args.find((a) => a.startsWith('--week-of='))?.split('=')[1]

function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
const WEEK_OF = weekArg || isoMonday()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const STATE_NAME = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}
const norm = (s) => String(s || '').toLowerCase()
const lastName = (full) => {
  // "Rafael Edward Cruz" -> "cruz"; "Donald John Trump (2016-cycle)" -> "trump"
  const clean = String(full || '').replace(/\(.*?\)/g, '').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  return norm(parts[parts.length - 1] || '')
}
const chamberWord = (branch) => branch === 'Senate' ? 'senate' : branch === 'House' ? 'house' : null

// Pull open political markets once (events + nested markets), keep tradeable ones.
async function fetchPoliticalMarkets() {
  const out = []
  let cursor = '', pages = 0
  do {
    const p = new URLSearchParams({ limit: '200', status: 'open', with_nested_markets: 'true' })
    if (cursor) p.set('cursor', cursor)
    const r = await fetch(`${KALSHI}/events?${p}`, { headers: { accept: 'application/json' } })
    if (!r.ok) break
    const d = await r.json()
    for (const ev of (d.events || [])) {
      if (!['Politics', 'Elections'].includes(ev.category)) continue
      for (const m of (ev.markets || [])) {
        const vol = Number(m.volume_24h_fp || 0), oi = Number(m.open_interest_fp || 0)
        if (vol <= 0 && oi <= 0) continue // skip dead markets
        out.push({
          event_title: ev.title || '',
          event_ticker: ev.event_ticker,
          ticker: m.ticker,
          sub_title: m.yes_sub_title || '',
          yes_bid: Number(m.yes_bid_dollars), yes_ask: Number(m.yes_ask_dollars),
          volume_24h: vol, open_interest: oi,
        })
      }
    }
    cursor = d.cursor || ''; pages++
    await sleep(150)
  } while (cursor && pages < 40)
  return out
}

// Conservative match: returns the best matching market for a candidate or null.
function matchFor(cand, markets) {
  const ref = (cand.source_refs && cand.source_refs[0]) || {}
  const name = ref.politician_name
  const ln = name ? lastName(name) : null
  const state = ref.state
  const stateName = state ? norm(STATE_NAME[state] || '') : null
  const chamber = chamberWord(cand.branch)

  // A market is only "related" if it's plausibly ABOUT this person/race — not a
  // throwaway longshot leg (e.g. everyone is a <2% name in "2028 nominee"). So a
  // NAME match on a sub_title is only credible when that leg has a non-trivial YES
  // price (the market treats them as a real contender) AND the event isn't a giant
  // open-field "nominee/next X" market.
  const MIN_NAME_YES = Number(process.env.KALSHI_MIN_NAME_YES ?? 0.05) // 5%
  const OPEN_FIELD = /(nominee|next (speaker|president|prime minister|pope|chair|leader)|who will (be|win))/i

  const scored = []
  for (const m of markets) {
    const et = norm(m.event_title), st = norm(m.sub_title)
    let how = null, strength = 0
    // Use the BID as the liveness signal — a market with yes_bid=0 has no one
    // willing to buy, i.e. effectively dead, even if an ask exists. Skip those.
    const yes = Number(m.yes_bid) || 0
    const openField = OPEN_FIELD.test(m.event_title)
    // ONLY accept unambiguous matches. Fuzzy sub-title-leg matching produced
    // cross-name false positives (a different "Cruz" in TX-15) and open-field
    // longshot noise, so we drop it entirely. Two accepted signals:
    //
    // (1) The EVENT TITLE is literally about this person AND is not an open-field
    //     "who will win/run/next X" market: e.g. "Mike Johnson out as Speaker?",
    //     "Donald Trump announces departure?". Live price required.
    if (!how && ln && ln.length >= 4 && !openField) {
      const re = new RegExp(`\\b${ln}\\b`)
      if (re.test(et) && yes > 0) { how = 'name'; strength = 3 }
    }
    // (2) A specific race market for this candidate's STATE + CHAMBER:
    //     "Wisconsin Senate winner?". Live price required.
    if (!how && stateName && chamber && et.includes(stateName) && et.includes(chamber) && yes > 0) {
      how = 'race'; strength = 2
    }
    if (how) scored.push({ m, how, strength, liq: m.volume_24h + m.open_interest })
  }
  if (!scored.length) return null
  scored.sort((a, b) => (b.strength - a.strength) || (b.liq - a.liq))
  const best = scored[0]
  return {
    matched_by: best.how,
    event_title: best.m.event_title,
    market_ticker: best.m.ticker,
    sub_title: best.m.sub_title,
    yes_bid: best.m.yes_bid,
    yes_ask: best.m.yes_ask,
    url: `https://kalshi.com/markets/${best.m.event_ticker}`,
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Matching Kalshi markets for week_of=${WEEK_OF}${DRY ? ' (DRY RUN)' : ''}`)
  const { data: cands, error } = await supabase
    .from('cr_story_candidates').select('*').eq('week_of', WEEK_OF).order('rank')
  if (error) { console.error(error.message); process.exit(1) }
  if (!cands?.length) { console.log('No candidates this week.'); return }

  const markets = await fetchPoliticalMarkets()
  console.log(`Fetched ${markets.length} tradeable political markets.`)

  let matched = 0
  for (const c of cands) {
    const match = matchFor(c, markets)
    if (match) {
      matched++
      const ref = (c.source_refs && c.source_refs[0]) || {}
      console.log(`  ✓ ${ref.politician_name || c.headline} → "${match.event_title.slice(0, 50)}" (${match.matched_by}, YES ${match.yes_bid})`)
    }
    if (!DRY) {
      await supabase.from('cr_story_candidates').update({ kalshi_match: match }).eq('id', c.id)
    }
  }
  console.log(`${matched}/${cands.length} candidates matched a live market.${DRY ? ' (dry run — nothing written)' : ''}`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
