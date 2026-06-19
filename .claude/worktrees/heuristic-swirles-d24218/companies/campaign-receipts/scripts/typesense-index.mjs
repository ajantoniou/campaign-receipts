#!/usr/bin/env node
/**
 * Typesense indexing script for CampaignReceipts.
 * Reads politicians + promises from Supabase, creates/updates Typesense collections.
 * Run: node scripts/typesense-index.mjs
 * Cron: nightly at 02:00 UTC on Render
 */

import { createClient } from '@supabase/supabase-js'
import Typesense from 'typesense'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TS_HOST = process.env.TYPESENSE_HOST
const TS_KEY = process.env.TYPESENSE_API_KEY
const TS_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https'
const TS_PORT = parseInt(process.env.TYPESENSE_PORT || '443', 10)

if (!SUPABASE_URL || !SUPABASE_KEY || !TS_HOST || !TS_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TYPESENSE_HOST, TYPESENSE_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const typesense = new Typesense.Client({
  nodes: [{ host: TS_HOST, port: TS_PORT, protocol: TS_PROTOCOL }],
  apiKey: TS_KEY,
  connectionTimeoutSeconds: 10,
})

const POLITICIANS_SCHEMA = {
  name: 'politicians',
  fields: [
    { name: 'slug', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'party', type: 'string', facet: true },
    { name: 'branch', type: 'string', facet: true },
    { name: 'state', type: 'string', facet: true },
    { name: 'ideology_label', type: 'string', optional: true },
    { name: 'professional_background', type: 'string', optional: true },
    { name: 'profile_narrative', type: 'string', optional: true },
    { name: 'scorecard_percentage_kept', type: 'float', optional: true },
    { name: 'scorecard_kept', type: 'int32', optional: true },
    { name: 'scorecard_broken', type: 'int32', optional: true },
    { name: 'scorecard_total', type: 'int32', optional: true },
    { name: 'photo_url', type: 'string', optional: true, index: false },
  ],
}

const PROMISES_SCHEMA = {
  name: 'promises',
  fields: [
    { name: 'promise_text', type: 'string' },
    { name: 'verdict', type: 'string', facet: true },
    { name: 'category', type: 'string', optional: true, facet: true },
    { name: 'politician_name', type: 'string' },
    { name: 'politician_slug', type: 'string' },
    { name: 'politician_party', type: 'string', facet: true },
    { name: 'case_study_narrative', type: 'string', optional: true },
    { name: 'verdict_reasoning', type: 'string', optional: true },
  ],
}

async function recreateCollection(schema) {
  try {
    await typesense.collections(schema.name).delete()
    console.log(`Dropped existing collection: ${schema.name}`)
  } catch (e) {
    if (e.httpStatus !== 404) throw e
  }
  await typesense.collections().create(schema)
  console.log(`Created collection: ${schema.name}`)
}

async function indexPoliticians() {
  const { data, error } = await supabase
    .from('cr_politicians')
    .select('slug, name, party, branch, state, ideology_label, professional_background, profile_narrative, scorecard_percentage_kept, scorecard_kept, scorecard_broken, scorecard_total, photo_url')

  if (error) throw error
  if (!data?.length) { console.log('No politicians found'); return }

  const docs = data.map(p => ({
    id: p.slug,
    slug: p.slug,
    name: p.name,
    party: p.party || 'Other',
    branch: p.branch || 'Other',
    state: p.state || '',
    ideology_label: p.ideology_label || '',
    professional_background: p.professional_background || '',
    profile_narrative: p.profile_narrative || '',
    scorecard_percentage_kept: p.scorecard_percentage_kept ?? 0,
    scorecard_kept: p.scorecard_kept ?? 0,
    scorecard_broken: p.scorecard_broken ?? 0,
    scorecard_total: p.scorecard_total ?? 0,
    photo_url: p.photo_url || '',
  }))

  const result = await typesense.collections('politicians').documents().import(docs, { action: 'upsert' })
  const failures = result.filter(r => !r.success)
  console.log(`Indexed ${docs.length} politicians (${failures.length} failures)`)
  if (failures.length > 0) console.error('Failures:', failures.slice(0, 3))
}

async function indexPromises() {
  // Fetch politicians for name lookup
  const { data: pols } = await supabase.from('cr_politicians').select('id, slug, name, party')
  const polMap = Object.fromEntries((pols || []).map(p => [p.id, p]))

  // Fetch all promises in batches
  let allPromises = []
  let offset = 0
  const batchSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('cr_promises')
      .select('id, politician_id, promise_text, verdict, category, case_study_narrative, verdict_reasoning')
      .range(offset, offset + batchSize - 1)
    if (error) throw error
    if (!data?.length) break
    allPromises.push(...data)
    if (data.length < batchSize) break
    offset += batchSize
  }

  if (!allPromises.length) { console.log('No promises found'); return }

  const docs = allPromises
    .filter(p => polMap[p.politician_id])
    .map(p => {
      const pol = polMap[p.politician_id]
      return {
        id: p.id,
        promise_text: p.promise_text || '',
        verdict: p.verdict || 'YOU_DECIDE',
        category: p.category || '',
        politician_name: pol.name,
        politician_slug: pol.slug,
        politician_party: pol.party || 'Other',
        case_study_narrative: p.case_study_narrative || '',
        verdict_reasoning: p.verdict_reasoning || '',
      }
    })

  const result = await typesense.collections('promises').documents().import(docs, { action: 'upsert', batch_size: 200 })
  const failures = result.filter(r => !r.success)
  console.log(`Indexed ${docs.length} promises (${failures.length} failures)`)
  if (failures.length > 0) console.error('Failures:', failures.slice(0, 3))
}

async function main() {
  console.log(`Typesense indexing started at ${new Date().toISOString()}`)
  console.log(`Host: ${TS_HOST}`)

  await recreateCollection(POLITICIANS_SCHEMA)
  await recreateCollection(PROMISES_SCHEMA)
  await indexPoliticians()
  await indexPromises()

  console.log('Indexing complete.')
}

main().catch(err => {
  console.error('Indexing failed:', err)
  process.exit(1)
})
