#!/usr/bin/env node
//
// scripts/mirror-weekly-to-articles.mjs
//
// Mirrors cr_weekly rows into cr_articles as kind='weekly_receipt'.
// Runs daily via Render cron after the Monday pick-weekly job lands;
// idempotent (ON CONFLICT DO NOTHING) so re-runs are safe.
//
// Per founder rev-7 batch C+ (2026-05-17): Friday Receipts == cr_weekly
// (free tier highlight reel). Deeper-dive paid newsletters live
// separately. This script mirrors the highlight reel into /articles so
// each weekly pick gets a permanent SEO surface and shareable URL.
//
// Usage:
//   node scripts/mirror-weekly-to-articles.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const DRY = process.argv.includes('--dry-run')

function articleSlug(week) {
  return `friday-receipts-${week.iso_year}-w${String(week.iso_week).padStart(2, '0')}`
}

function buildBody(week, politicianSlug) {
  const polLink = politicianSlug
    ? `[Open ${politicianSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}'s page →](/politician/${politicianSlug})`
    : '[See the full CR directory →](/directory)'
  return `## The verdict

${week.blurb}

## Read the full receipt

The canonical scorecard with primary-source citations is on the politician's CR profile page.

${polLink}

[Read the SEALED book →](https://sealed2016.com)`
}

function buildSources(week, politicianSlug) {
  const refs = []
  if (politicianSlug) {
    refs.push({
      publication: 'CampaignReceipts — Politician page',
      url: `https://campaignreceipts.com/politician/${politicianSlug}`,
      retrieved_at: week.picked_at?.slice(0, 10),
    })
  }
  refs.push({
    publication: 'SEALED — The 2016 Promises',
    url: 'https://sealed2016.com',
    retrieved_at: week.picked_at?.slice(0, 10),
  })
  refs.push({
    publication: 'CampaignReceipts — Weekly archive',
    url: 'https://campaignreceipts.com/weekly',
    retrieved_at: week.picked_at?.slice(0, 10),
  })
  return refs
}

async function main() {
  // Pull every cr_weekly row + its politician slug.
  const { data: weeks } = await supabase
    .from('cr_weekly')
    .select(
      'iso_year, iso_week, picked_at, headline, blurb, politician_id, politician:cr_politicians!inner(slug)',
    )
    .order('iso_year', { ascending: false })
    .order('iso_week', { ascending: false })

  if (!weeks || weeks.length === 0) {
    console.log('No cr_weekly rows to mirror')
    return
  }

  console.log(`Mirroring ${weeks.length} cr_weekly row(s)${DRY ? ' (DRY RUN)' : ''}...\n`)

  let inserted = 0
  let skipped = 0

  for (const w of weeks) {
    const slug = articleSlug(w)
    const polSlug = w.politician?.slug || null

    // Check existence first so dry-run can report accurately.
    const { data: existing } = await supabase
      .from('cr_articles')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()
    if (existing) {
      console.log(`[exists] ${slug}`)
      skipped++
      continue
    }

    const headlineTail = w.headline?.split(' — ').slice(1).join(' — ') || w.headline || ''
    const payload = {
      slug,
      kind: 'weekly_receipt',
      title: `Friday Receipts · Week ${w.iso_week}, ${w.iso_year} — ${headlineTail}`,
      dek: w.blurb,
      body_md: buildBody(w, polSlug),
      source_refs: buildSources(w, polSlug),
      status: 'published',
      published_at: w.picked_at,
      generator: 'cr-weekly-mirror',
      generator_version: 'v1',
      last_regenerated_at: w.picked_at,
    }

    if (DRY) {
      console.log(`[dry-run] would insert ${slug}: ${payload.title}`)
      inserted++
      continue
    }

    const { error } = await supabase.from('cr_articles').insert(payload)
    if (error) {
      console.error(`[error] ${slug}:`, error.message)
      continue
    }
    console.log(`[ok] ${slug}`)
    inserted++
  }

  console.log(`\n── Summary ──`)
  console.log(`Inserted: ${inserted}`)
  console.log(`Skipped (already mirrored): ${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
