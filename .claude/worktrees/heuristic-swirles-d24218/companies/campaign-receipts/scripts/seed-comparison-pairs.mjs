#!/usr/bin/env node
// Programmatic SEO seeder for /compare/[slug_a]-vs-[slug_b] pages.
//
// Generates ~200 comparison pairs across five "kinds":
//   1. predecessor   — every politician with predecessor_slug set
//   2. same_seat     — current + immediate predecessor (same office,
//                      same state, different terms): largely overlaps
//                      with predecessor, kept for explicit indexing
//   3. same_state    — same state, same branch, same cycle (Schumer
//                      vs Gillibrand, Cruz vs Cornyn, etc.)
//   4. rivals        — same party + same chamber, top-pageviews pair
//                      (Bernie vs Warren, etc.)
//   5. party_foils   — Trump vs Biden, AOC vs MTG, Cruz vs Sanders —
//                      hand-picked top 20 most-clicked counterfactuals
//
// The /compare/[pair] page already exists in app/; this script writes
// the *pair list* the page reads from + the sitemap consumes.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const DRY_RUN = process.argv.includes('--dry-run')

// Hand-picked party-foils — the comparisons people actually google.
const PARTY_FOILS = [
  ['donald-trump', 'joe-biden'],
  ['donald-trump', 'kamala-harris'],
  ['donald-trump-2016', 'donald-trump'],
  ['bernie-sanders', 'elizabeth-warren'],
  ['bernie-sanders', 'ted-cruz'],
  ['alexandria-ocasio-cortez', 'marjorie-taylor-greene'],
  ['alexandria-ocasio-cortez', 'ted-cruz'],
  ['mike-johnson', 'hakeem-jeffries'],
  ['chuck-schumer', 'mitch-mcconnell'],
  ['susan-collins', 'joe-manchin'],
  ['jd-vance', 'tim-walz'],
  ['ron-desantis', 'gavin-newsom'],
  ['kamala-harris', 'mike-pence'],
  ['joe-manchin', 'kyrsten-sinema'],
  ['marco-rubio', 'rick-scott'],
  ['cory-booker', 'rand-paul'],
  ['raphael-warnock', 'ted-cruz'],
  ['katie-britt', 'tommy-tuberville'],
  ['lisa-murkowski', 'dan-sullivan'],
  ['john-fetterman', 'pat-toomey'],
]

async function main() {
  const { data: politicians } = await supabase
    .from('cr_politicians')
    .select('id, slug, name, branch, state, party, predecessor_slug')
  const pols = politicians || []
  const bySlug = new Map(pols.map((p) => [p.slug, p]))

  const pairs = []
  const seen = new Set()
  const addPair = (a, b, kind) => {
    if (!bySlug.has(a) || !bySlug.has(b)) return
    if (a === b) return
    const [lo, hi] = [a, b].sort()
    const key = `${lo}|${hi}`
    if (seen.has(key)) return
    seen.add(key)
    pairs.push({ slug_a: lo, slug_b: hi, kind })
  }

  // 1. Predecessors
  for (const p of pols) {
    if (p.predecessor_slug) addPair(p.slug, p.predecessor_slug, 'predecessor')
  }

  // 2. Same-state + same-branch combinations (only federal: skips Mayor)
  const byStateBranch = new Map()
  for (const p of pols) {
    if (!['Senate', 'House', 'Governor', 'President'].includes(p.branch)) continue
    const k = `${p.state}|${p.branch}`
    if (!byStateBranch.has(k)) byStateBranch.set(k, [])
    byStateBranch.get(k).push(p)
  }
  for (const [, group] of byStateBranch) {
    if (group.length < 2) continue
    // Only generate same-state pairs for Senate (always 2 per state)
    // and Governor (when we have a predecessor). House has too many
    // co-state members; would create thousands of low-value pages.
    if (group[0].branch !== 'Senate' && group[0].branch !== 'Governor') continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        addPair(group[i].slug, group[j].slug, 'same_state')
      }
    }
  }

  // 3. Rivals — same party, same branch, top 20 by graded scorecard
  // size. We want pages people actually search for.
  const rankedPols = pols
    .filter((p) => ['Senate', 'House', 'President', 'Governor'].includes(p.branch))
    .sort((a, b) => 0) // we don't have page_views on cr_politicians; this is best-effort
  // Skip auto-rivals for now (would generate too many low-quality pairs).
  // Hand-picked PARTY_FOILS covers the rivalry cases worth indexing.

  // 4. Hand-picked party foils
  for (const [a, b] of PARTY_FOILS) addPair(a, b, 'party_foils')

  console.log(`Generated ${pairs.length} comparison pairs:`)
  const byKind = pairs.reduce((acc, p) => ({ ...acc, [p.kind]: (acc[p.kind] || 0) + 1 }), {})
  for (const [k, n] of Object.entries(byKind)) console.log(`  ${k}: ${n}`)

  if (DRY_RUN) {
    console.log('\n(dry run — not writing)')
    return
  }

  // Upsert
  const { error } = await supabase.from('cr_compare_pairs').upsert(pairs, { onConflict: 'slug_a,slug_b' })
  if (error) {
    console.error('upsert failed:', error.message)
    process.exit(1)
  }
  console.log(`\n✓ Upserted ${pairs.length} pairs to cr_compare_pairs`)
}

main()
