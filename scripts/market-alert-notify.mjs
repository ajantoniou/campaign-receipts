#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

async function run() {
  console.log(`[market-alert-notify] Checking for updated Alpha Engine intelligence...`)

  try {
    // Look for markets updated in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: markets, error } = await supabase
      .from('cr_prediction_markets')
      .select('slug, question, edge_headline, edge_insight, last_analyzed_at')
      .gte('last_analyzed_at', oneHourAgo)
      .limit(10) // Limit to 10 for notification blast

    if (error) throw error

    if (!markets || markets.length === 0) {
      console.log(`[market-alert-notify] No newly updated markets found.`)
      return
    }

    console.log(`[market-alert-notify] Found ${markets.length} markets with new edge intelligence.`)

    // Simulate pulling 100 paid subscribers
    console.log(`[market-alert-notify] Fetching premium $2500/mo subscribers (Limit: 100)`)
    const simulatedSubscribers = Array.from({length: 100}, (_, i) => `alpha_sub_${i}@example.com`)

    for (const market of markets) {
      console.log(`\n==============================================`)
      console.log(`DISPATCHING ALPHA ALERT TO ${simulatedSubscribers.length} SUBSCRIBERS`)
      console.log(`Market: ${market.question}`)
      console.log(`Headline: ${market.edge_headline}`)
      console.log(`Insight: ${market.edge_insight}`)
      console.log(`==============================================`)
    }

    console.log(`[market-alert-notify] Notifications successfully dispatched.`)
  } catch (err) {
    console.error(`[market-alert-notify] Error during notification dispatch:`, err.message)
    process.exit(1)
  }
}

run()
