#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

// Helper to generate mock Alpha Engine data
function generateAlphaEdge(impliedOddsPct) {
  const edgeTrueOdds = impliedOddsPct + (Math.random() * 15 - 7.5);
  
  const headlines = [
    "FEC FILING DETECTED: Super PAC burning cash 3x faster than baseline.",
    "PREMIUM INTEL: Top donor pivoted funds to a dark horse candidate.",
    "LOBBYING SURGE: Tech PAC heavily influencing key committee members.",
    "DARK MONEY FLOW: Untraceable 501(c)(4) ad buys detected in key state.",
    "OPPOSITION RESEARCH: Leaked internal polling shifts campaign strategy."
  ];

  const insights = [
    "Our algorithmic knowledge graph detects an unusual correlation between recent PAC spending and upcoming voting blocs. This creates an arbitrage opportunity.",
    "FEC data shows irregular burn rates from the leading candidate, indicating possible internal polling panic.",
    "Lobbying disclosure forms show a 400% increase in K-Street meetings related to this outcome over the last 14 days.",
    "A massive influx of out-of-state donor money is fundamentally changing the ground-game dynamics here.",
    "By tracking historical donor behavior of the top 5 contributors in this race, our model predicts a high likelihood of this outcome."
  ];

  return {
    edge_headline: headlines[Math.floor(Math.random() * headlines.length)],
    edge_insight: insights[Math.floor(Math.random() * insights.length)],
    edge_lobby_strength: Math.floor(Math.random() * 100),
    edge_lobby_pct: Math.floor(Math.random() * 100),
    edge_outside_spend: Math.floor(Math.random() * 5000000) + 100000,
    edge_true_odds: edgeTrueOdds < 1 ? 1 : (edgeTrueOdds > 99 ? 99 : edgeTrueOdds)
  };
}

async function run() {
  console.log(`[sync-polymarket] Starting ingestion of political prediction markets...`)

  try {
    const res = await fetch("https://gamma-api.polymarket.com/events?closed=false&limit=500")
    if (!res.ok) throw new Error(`Polymarket API responded with status: ${res.status}`)
    const data = await res.json()

    const politicalEvents = data.filter(d => 
      d.tags && d.tags.some(t => t.id === "1" || t.label.toLowerCase().includes("politic") || t.label.toLowerCase().includes("election"))
    );

    console.log(`[sync-polymarket] Found ${politicalEvents.length} active political events.`)

    let upsertCount = 0;

    for (const event of politicalEvents) {
      if (!event.markets || event.markets.length === 0) continue;
      
      for (const market of event.markets) {
        let outcomes = [];
        let outcomePrices = [];
        
        try {
          outcomes = JSON.parse(market.outcomes || "[]");
          outcomePrices = JSON.parse(market.outcomePrices || "[]");
        } catch(e) { }

        if (outcomes.length === 0 || outcomePrices.length === 0) continue;

        const structuredOutcomes = outcomes.map((name, index) => {
          return {
            name: name,
            price: parseFloat(outcomePrices[index] || "0")
          }
        });

        let impliedOdds = structuredOutcomes.length > 0 ? structuredOutcomes[0].price * 100 : 50;
        const edgeData = generateAlphaEdge(impliedOdds);

        const payload = {
          slug: market.slug || `${event.slug}-${market.id}`,
          question: market.question || event.title,
          group_name: event.title || 'Politics',
          volume_usd: parseFloat(market.volumeNum || market.volume || event.volumeNum || 0),
          end_date: market.endDate || event.endDate || null,
          source_url: `https://polymarket.com/event/${event.slug}`,
          outcomes: structuredOutcomes,
          ...edgeData,
          last_analyzed_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('cr_prediction_markets')
          .upsert(payload, { onConflict: 'slug' })

        if (error) {
          console.error(`[sync-polymarket] Failed to upsert market ${payload.slug}:`, error.message)
        } else {
          upsertCount++;
        }
      }
    }

    console.log(`[sync-polymarket] Successfully upserted ${upsertCount} political markets.`)
  } catch (err) {
    console.error(`[sync-polymarket] Error during ingestion:`, err.message)
    process.exit(1)
  }
}

run()
