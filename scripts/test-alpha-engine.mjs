import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function calculateAlphaScore(candidate, isGeneral) {
  // Base financial strength: Candidate's own war chest + Friendly Super PACs - Hostile Super PACs
  let score = (candidate.campaign_raised_usd || 0) + (candidate.ie_for_usd || 0) - (candidate.ie_against_usd || 0);
  
  // Niche alpha 1: Incumbency advantage. In generals, incumbency is incredibly strong. 
  // We model it as a flat $15M advantage in perceived strength.
  if (candidate.incumbent && isGeneral) {
    score += 15_000_000;
  }
  
  // Niche alpha 2: Primaries. In primaries, Super PAC money (IE) has an outsized effect 
  // compared to general elections because name ID is lower. We multiply IE impact.
  if (!isGeneral) {
    score += (candidate.ie_for_usd || 0) * 1.5;
    score -= (candidate.ie_against_usd || 0) * 1.5;
  }

  return score;
}

async function runBacktest() {
  console.log("=========================================");
  console.log("CR ALPHA ENGINE v2.0: HISTORICAL BACKTEST");
  console.log("=========================================\n");

  const { data: races, error } = await supabase
    .from('cr_races')
    .select('*')
    .eq('is_active', false);

  if (error) {
    console.error("Error fetching races:", error);
    return;
  }

  if (!races || races.length === 0) {
    console.log("No historical races found in the database to backtest.");
    return;
  }

  let totalRaces = 0;
  let accuratePredictions = 0;

  const niches = {
    general: { total: 0, accurate: 0 },
    primary: { total: 0, accurate: 0 },
    incumbent_involved: { total: 0, accurate: 0 },
    open_seat: { total: 0, accurate: 0 }
  };

  for (const race of races) {
    if (!race.candidates || race.candidates.length < 2) continue;
    
    // Determine niche
    const isGeneral = race.race_type.includes('general');
    const hasIncumbent = race.candidates.some(c => c.incumbent);

    // Sort candidates by actual voting result (polling_pct used as final result for historical)
    const sortedByResult = [...race.candidates].sort((a, b) => {
      const aPct = a.polling_pct || 0;
      const bPct = b.polling_pct || 0;
      return bPct - aPct;
    });

    const actualWinner = sortedByResult[0];

    // Calculate donor advantage using the new Alpha engine
    const candidatesWithScore = race.candidates.map(c => {
      const adv = calculateAlphaScore(c, isGeneral);
      return { ...c, alphaScore: adv };
    });

    const sortedByScore = [...candidatesWithScore].sort((a, b) => b.alphaScore - a.alphaScore);
    const predictedWinner = sortedByScore[0];

    const isAccurate = predictedWinner.name === actualWinner.name;

    totalRaces++;
    if (isAccurate) accuratePredictions++;

    // Record niche stats
    if (isGeneral) { niches.general.total++; if (isAccurate) niches.general.accurate++; }
    else { niches.primary.total++; if (isAccurate) niches.primary.accurate++; }

    if (hasIncumbent) { niches.incumbent_involved.total++; if (isAccurate) niches.incumbent_involved.accurate++; }
    else { niches.open_seat.total++; if (isAccurate) niches.open_seat.accurate++; }

    // Calculate the 'Edge' magnitude
    const moneyDiff = predictedWinner.alphaScore - sortedByScore[1].alphaScore;
    const edgeConfidence = Math.min(99, 50 + (moneyDiff / 1000000) * 2); 
    
    console.log(`Race: ${race.headline}`);
    console.log(`- Predicted Winner: ${predictedWinner.name} (Alpha Score: $${(predictedWinner.alphaScore / 1e6).toFixed(1)}M)`);
    console.log(`- Actual Winner: ${actualWinner.name}`);
    console.log(`- Prediction: ${isAccurate ? '✅ CORRECT' : '❌ INCORRECT'} (Confidence: ${edgeConfidence.toFixed(1)}%)`);
  }

  console.log("\n=========================================");
  console.log("BACKTEST RESULTS & NICHE ALPHA DISCOVERY");
  console.log("=========================================");
  const winRate = (accuratePredictions / totalRaces) * 100;
  console.log(`Total Historical Races Analyzed: ${totalRaces}`);
  console.log(`Overall Accurate Predictions: ${accuratePredictions}`);
  console.log(`Overall Win Rate (Alpha): ${winRate.toFixed(2)}%\n`);

  console.log("NICHE PERFORMANCE BREAKDOWN:");
  for (const [niche, stats] of Object.entries(niches)) {
    if (stats.total === 0) continue;
    const rate = (stats.accurate / stats.total) * 100;
    console.log(`- ${niche.toUpperCase()}: ${rate.toFixed(1)}% win rate (${stats.accurate}/${stats.total})`);
  }

  let bestNiche = null;
  let bestRate = 0;
  for (const [niche, stats] of Object.entries(niches)) {
    if (stats.total >= 3) {
      const rate = stats.accurate / stats.total;
      if (rate > bestRate) {
        bestRate = rate;
        bestNiche = niche;
      }
    }
  }

  if (winRate >= 75) {
    console.log(`\n✅ VERDICT: EXTREME ALPHA DETECTED. You have reached the ~80% target.`);
    console.log(`🏆 BEST TRADING NICHE: ${bestNiche.toUpperCase()} at ${(bestRate * 100).toFixed(1)}% accuracy.`);
  } else if (winRate > 50) {
    console.log(`\n⚠️ VERDICT: MODERATE ALPHA. The model is profitable but needs tuning to hit 80%.`);
  } else {
    console.log(`\n❌ VERDICT: NO ALPHA. The model performs worse than a coin flip.`);
  }
}

runBacktest();
