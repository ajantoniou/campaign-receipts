#!/usr/bin/env node
// Seed the cr_outreach_targets table from a curated JSON file.
//
// Why JSON-driven, not Apify scraping: the launch needs ~25 hand-picked
// journalists for D1, not a 380-target firehose. Quality > volume at
// this stage. Apify can ride in for round 2 (Day 30+) once we know
// which cohorts converted.
//
// Usage:
//   node scripts/seed-outreach.mjs scripts/outreach-seed.json
//   node scripts/seed-outreach.mjs scripts/outreach-seed.json --enrich-missing-emails
//
// Optional Hunter.io enrichment: for any row with `handle` or `outlet`
// but no `email`, fetch via Hunter Email Finder. Requires
// HUNTER_API_KEY in env.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HUNTER_KEY = process.env.HUNTER_API_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const path = args.find((a) => !a.startsWith('--'))
const ENRICH = args.includes('--enrich-missing-emails')
if (!path) {
  console.error('Usage: node scripts/seed-outreach.mjs <seed.json> [--enrich-missing-emails]')
  process.exit(1)
}

const seed = JSON.parse(readFileSync(path, 'utf8'))
if (!Array.isArray(seed)) {
  console.error('Seed file must be a JSON array')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Hunter Email Finder: given first_name + last_name + domain, returns
// a guessed email + confidence score. We accept anything ≥80.
async function hunterFindEmail({ firstName, lastName, domain }) {
  if (!HUNTER_KEY) return null
  if (!firstName || !lastName || !domain) return null
  const url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${HUNTER_KEY}`
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data = await resp.json()
    const email = data?.data?.email
    const score = Number(data?.data?.score || 0)
    return email && score >= 80 ? email : null
  } catch {
    return null
  }
}

function splitName(displayName) {
  const parts = (displayName || '').trim().split(/\s+/)
  if (parts.length < 2) return { firstName: parts[0] || null, lastName: null }
  return { firstName: parts[0], lastName: parts[parts.length - 1] }
}

function inferDomain(outlet) {
  if (!outlet) return null
  const map = {
    politico: 'politico.com',
    axios: 'axios.com',
    'the hill': 'thehill.com',
    propublica: 'propublica.org',
    bloomberg: 'bloomberg.com',
    wapo: 'washpost.com',
    'washington post': 'washpost.com',
    nyt: 'nytimes.com',
    'new york times': 'nytimes.com',
    cnn: 'cnn.com',
    msnbc: 'msnbc.com',
    fox: 'foxnews.com',
    'fox news': 'foxnews.com',
    npr: 'npr.org',
    pbs: 'pbs.org',
    semafor: 'semafor.com',
    'the atlantic': 'theatlantic.com',
    vox: 'vox.com',
    motherjones: 'motherjones.com',
    'mother jones': 'motherjones.com',
  }
  const k = outlet.toLowerCase().trim()
  return map[k] || null
}

let enriched = 0
let inserted = 0
let skipped = 0

for (const row of seed) {
  if (!row.cohort || !row.channel) {
    console.warn('skip — missing cohort/channel:', row)
    skipped++
    continue
  }

  let email = row.email || null
  if (!email && ENRICH && row.outlet && row.display_name) {
    const { firstName, lastName } = splitName(row.display_name)
    const domain = row.domain || inferDomain(row.outlet)
    if (firstName && lastName && domain) {
      const found = await hunterFindEmail({ firstName, lastName, domain })
      if (found) {
        email = found
        enriched++
        console.log(`  + ${row.display_name} → ${email}`)
      }
      await sleep(250) // Hunter free tier is ~25 calls/day; pace
    }
  }

  const payload = {
    email,
    handle: row.handle || null,
    display_name: row.display_name || null,
    channel: row.channel,
    cohort: row.cohort,
    beat_tags: row.beat_tags || [],
    follower_count: row.follower_count ?? null,
    outlet: row.outlet || null,
    source_list: row.source_list || path.split('/').pop(),
  }

  const { error } = await supabase
    .from('cr_outreach_targets')
    .insert(payload)
    .select('id')
    .single()
  if (error) {
    // Unique violation = already loaded; that's fine.
    if (error.code === '23505') {
      skipped++
      continue
    }
    console.warn(`  ! ${row.display_name || row.handle}: ${error.message}`)
    skipped++
    continue
  }
  inserted++
}

console.log(`\nDone. inserted=${inserted}, enriched_emails=${enriched}, skipped=${skipped}`)
