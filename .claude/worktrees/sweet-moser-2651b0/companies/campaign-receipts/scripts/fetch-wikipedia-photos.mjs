#!/usr/bin/env node
// Photo coverage: fetch Wikipedia thumbnail portraits for politicians who
// have a null photo_url. Wikipedia's pageimages API returns the page's
// canonical thumbnail — typically the official portrait, which is
// public-domain for federal officeholders and CC-licensed for state/local
// figures.
//
// Strategy:
//   1. Pull every politician where photo_url IS NULL.
//   2. For each, try Wikipedia title = full_name.replace(' ', '_').
//      If the page has a pageimage thumbnail, update photo_url with it.
//   3. Rate-limit at ~10 req/sec (Wikipedia's stated policy) and stop
//      on 429 / network errors so we don't hammer.
//   4. Skip politicians whose name contains "placeholder" (skip-stubs).
//
// Run: npm run fetch:photos

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

const USER_AGENT = 'CampaignReceipts/1.0 (https://campaignreceipts.com; ops@campaignreceipts.com)'
const THUMB_SIZE = 400

async function fetchAllNeedy() {
  // Paginate past Supabase 1000-row default.
  const out = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('cr_politicians')
      .select('id, slug, name, photo_url')
      .is('photo_url', null)
      .range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    out.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return out
}

// Try a few title transforms to maximize hit rate.
function titleCandidates(name) {
  const base = name.trim()
  const candidates = new Set()
  candidates.add(base.replace(/\s+/g, '_'))
  // Strip parenthetical suffixes like "(2025)", "(Senate)"
  const noParens = base.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (noParens && noParens !== base) candidates.add(noParens.replace(/\s+/g, '_'))
  // Strip generation suffixes like "Jr.", "III", "II"
  const noSuffix = noParens.replace(/\s+(Jr\.|Sr\.|II|III|IV)\.?\s*$/i, '').trim()
  if (noSuffix && noSuffix !== noParens) candidates.add(noSuffix.replace(/\s+/g, '_'))
  // First + last name only (drop middle names)
  const parts = noSuffix.split(/\s+/)
  if (parts.length > 2) {
    candidates.add(`${parts[0]}_${parts[parts.length - 1]}`)
  }
  return Array.from(candidates)
}

async function fetchThumb(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=${THUMB_SIZE}&piprop=thumbnail&redirects=1`
  const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const json = await resp.json()
  const pages = json?.query?.pages || {}
  for (const id of Object.keys(pages)) {
    if (id === '-1') continue // missing page
    const thumb = pages[id]?.thumbnail?.source
    if (thumb) return thumb
  }
  return null
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const needy = await fetchAllNeedy()
  console.log(`Found ${needy.length} politicians without a photo`)

  let hits = 0
  let misses = 0
  let errors = 0

  for (let i = 0; i < needy.length; i++) {
    const p = needy[i]
    if (/placeholder/i.test(p.name)) {
      misses += 1
      continue
    }
    let thumb = null
    for (const cand of titleCandidates(p.name)) {
      try {
        thumb = await fetchThumb(cand)
        if (thumb) break
      } catch (e) {
        errors += 1
        await sleep(500)
      }
      await sleep(100) // ~10 req/sec respect
    }
    if (thumb) {
      const { error } = await supabase
        .from('cr_politicians')
        .update({ photo_url: thumb })
        .eq('id', p.id)
      if (error) {
        console.error(`  ! update failed for ${p.name}: ${error.message}`)
        errors += 1
      } else {
        hits += 1
        if (hits % 10 === 0) console.log(`  ✓ ${hits} updated · ${i + 1}/${needy.length}`)
      }
    } else {
      misses += 1
    }
  }

  console.log(`\nDone. hits=${hits} misses=${misses} errors=${errors}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
