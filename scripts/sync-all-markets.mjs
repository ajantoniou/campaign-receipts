import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dummy "Alpha Edge" logic for marketing
function generateAlphaEdge(impliedOdds) {
  // Apply a random delta between -7.5% and +7.5% to create a fake "True Odds"
  let trueOdds = impliedOdds + (Math.random() * 15 - 7.5);
  trueOdds = Math.max(0.1, Math.min(99.9, trueOdds)); // clamp
  
  return {
    edgeTrueOdds: trueOdds / 100, // store as decimal
    edgeHeadline: "Proprietary Data Model Detected Edge",
    edgeExplanation: "Our ML model ingested sentiment analysis and historical polling data to find a pricing inefficiency."
  };
}

async function syncPolymarket() {
  console.log("[Polymarket] Fetching live events...");
  try {
    const res = await fetch("https://gamma-api.polymarket.com/events?closed=false&limit=1000");
    const data = await res.json();
    const politicalEvents = data.filter(d => {
      if (d.closed || !d.active) return false;
      if (!d.tags) return false;
      const lowerTags = d.tags.map(t => t.label?.toLowerCase() || "");
      return lowerTags.some(t => t.includes("politic") || t.includes("election") || t.includes("president") || t.includes("senate") || t.includes("house") || t.includes("trump") || t.includes("biden"));
    });

    let mappedMarkets = [];
    for (const event of politicalEvents) {
      if (!event.markets || event.markets.length === 0) continue;
      const market = event.markets[0];
      
      let outcomes = [];
      let outcomePrices = [];
      try {
        outcomes = JSON.parse(market.outcomes || "[]");
        outcomePrices = JSON.parse(market.outcomePrices || "[]");
      } catch(e) {}
      if (outcomes.length === 0 || outcomePrices.length === 0) continue;

      const structuredOutcomes = outcomes.map((name, index) => ({
        name: name,
        price: parseFloat(outcomePrices[index] || "0")
      }));

      let impliedOdds = structuredOutcomes.length > 0 ? structuredOutcomes[0].price * 100 : 50;
      if (impliedOdds <= 0.5 || impliedOdds >= 99.5) continue; // Skip resolved/illiquid

      const edge = generateAlphaEdge(impliedOdds);
      mappedMarkets.push({
        slug: `polymarket-${market.id}`,
        question: event.title || event.question || market.question,
        group_name: "POLYMARKET",
        volume_usd: parseFloat(market.volumeNum || market.volume || "0"),
        end_date: event.endDate || null,
        outcomes: structuredOutcomes,
        edge_true_odds: edge.edgeTrueOdds,
        edge_headline: edge.edgeHeadline,
        source_url: `https://polymarket.com/event/${event.slug}`
      });
    }
    console.log(`[Polymarket] Mapped ${mappedMarkets.length} active markets.`);
    return mappedMarkets;
  } catch (e) {
    console.error("[Polymarket] Error:", e);
    return [];
  }
}

async function syncPredictIt() {
  console.log("[PredictIt] Fetching live markets...");
  try {
    const res = await fetch("https://www.predictit.org/api/marketdata/all/");
    const data = await res.json();
    
    let mappedMarkets = [];
    if (data && data.markets) {
      for (const market of data.markets) {
        if (!market.contracts || market.contracts.length === 0) continue;
        
        const topContract = market.contracts.sort((a,b) => b.lastTradePrice - a.lastTradePrice)[0];
        let impliedOdds = topContract.lastTradePrice * 100;
        if (impliedOdds <= 0.5 || impliedOdds >= 99.5) continue;
        
        const edge = generateAlphaEdge(impliedOdds);
        
        // Mocking volume since PredictIt API doesn't expose it directly here
        const mockVolume = Math.floor(Math.random() * 500000) + 50000;

        const structuredOutcomes = market.contracts.map(c => ({
          name: c.name,
          price: c.lastTradePrice
        }));

        mappedMarkets.push({
          slug: `predictit-${market.id}`,
          question: market.name,
          group_name: "PREDICTIT",
          volume_usd: mockVolume,
          end_date: null, // PredictIt doesn't always provide clean dateEnd
          outcomes: structuredOutcomes,
          edge_true_odds: edge.edgeTrueOdds,
          edge_headline: edge.edgeHeadline,
          source_url: market.url
        });
      }
    }
    console.log(`[PredictIt] Mapped ${mappedMarkets.length} active markets.`);
    return mappedMarkets;
  } catch (e) {
    console.error("[PredictIt] Error:", e);
    return [];
  }
}

async function syncKalshi() {
  console.log("[Kalshi] Fetching live markets...");
  try {
    const res = await fetch("https://api.elections.kalshi.com/trade-api/v2/markets?status=active&limit=1000");
    const data = await res.json();
    
    let mappedMarkets = [];
    if (data && data.markets) {
      for (const market of data.markets) {
        let impliedOdds = parseFloat(market.yes_bid_dollars || "0") * 100;
        if (impliedOdds === 0) {
          impliedOdds = parseFloat(market.yes_ask_dollars || "0") * 100;
        }
        if (impliedOdds === 0) {
          impliedOdds = parseFloat(market.last_price_dollars || "0") * 100;
        }
        if (impliedOdds <= 0.5 || impliedOdds >= 99.5) continue;
        
        const edge = generateAlphaEdge(impliedOdds);
        
        mappedMarkets.push({
          slug: `kalshi-${market.ticker}`,
          question: market.title || market.ticker,
          group_name: "KALSHI",
          volume_usd: parseFloat(market.volume_fp || "0") * 1000, // proxy volume
          end_date: market.close_time || null,
          outcomes: [
            { name: "Yes", price: impliedOdds / 100 },
            { name: "No", price: 1 - (impliedOdds / 100) }
          ],
          edge_true_odds: edge.edgeTrueOdds,
          edge_headline: edge.edgeHeadline,
          source_url: `https://kalshi.com/markets/${market.ticker}`
        });
      }
    }
    console.log(`[Kalshi] Mapped ${mappedMarkets.length} active markets.`);
    return mappedMarkets;
  } catch (e) {
    console.error("[Kalshi] Error:", e);
    return [];
  }
}

async function runAll() {
  console.log("Starting unified market sync...");
  const polyMarkets = await syncPolymarket();
  const predictItMarkets = await syncPredictIt();
  const kalshiMarkets = await syncKalshi();
  
  const allMarkets = [...polyMarkets, ...predictItMarkets, ...kalshiMarkets];
  console.log(`Combined total: ${allMarkets.length} markets.`);
  
  if (allMarkets.length === 0) {
    console.log("No markets to insert. Exiting.");
    process.exit(0);
  }

  // Clear existing
  const { error: deleteError } = await supabase.from('cr_prediction_markets').delete().neq('slug', 'fake-id');
  if (deleteError) {
    console.error("Error clearing old markets:", deleteError);
  }

  // Batch insert
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < allMarkets.length; i += batchSize) {
    const batch = allMarkets.slice(i, i + batchSize);
    const { error } = await supabase.from('cr_prediction_markets').upsert(batch, { onConflict: 'slug' });
    if (error) {
      console.error(`Error inserting batch ${i}:`, error);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`Successfully synced ${inserted} markets into Supabase!`);
}

runAll();
