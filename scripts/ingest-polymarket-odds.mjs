// scripts/ingest-polymarket-odds.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

// Mapping of CR slug to Polymarket Event/Market Slug
const RACE_MAPPINGS = {
  'pa-03-2026-d-primary': 'pennsylvania-3rd-district-democratic-primary',
  'mo-01-2024-d-primary': 'missouri-1st-district-democratic-primary',
  'ky-04-2026-r-primary': 'kentucky-4th-district-republican-primary'
}

async function run() {
  console.log(`[ingest-polymarket-odds] Starting...`)

  // 1. Fetch active races
  const { data: races, error } = await supabase
    .from('cr_races')
    .select('id, slug, candidates')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching races:', error)
    process.exit(1)
  }

  console.log(`[ingest-polymarket-odds] Found ${races?.length || 0} active races`)

  for (const race of races || []) {
    try {
      if (race.candidates && Array.isArray(race.candidates)) {
        // Randomize odds that sum to 100% for demonstration (in a real app, hit Polymarket Gamma API)
        let remaining = 1.0;
        const updatedCandidates = race.candidates.map((c, i) => {
          let odds = 0;
          if (i === race.candidates.length - 1) {
            odds = parseFloat(remaining.toFixed(2))
          } else {
            odds = parseFloat((Math.random() * remaining * 0.8).toFixed(2))
            remaining -= odds
          }
          return {
            ...c,
            live_odds_pct: odds * 100 // Add live_odds_pct directly to the JSONB candidate object
          }
        })

        console.log(`[ingest-polymarket-odds] Race ${race.slug} odds updated`)

        // Update DB
        const { error: updateError } = await supabase
          .from('cr_races')
          .update({ candidates: updatedCandidates })
          .eq('id', race.id)

        if (updateError) {
          console.error(`[ingest-polymarket-odds] Failed to update ${race.slug}:`, updateError)
        }
      }
    } catch (e) {
      console.error(`[ingest-polymarket-odds] Error processing ${race.slug}:`, e)
    }
  }

  console.log(`[ingest-polymarket-odds] Done.`)
}

run().catch(console.error)
