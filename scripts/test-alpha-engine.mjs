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

async function runBacktest() {
  console.log("=========================================");
  console.log("CR ALPHA ENGINE: HISTORICAL BACKTEST");
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

  for (const race of races) {
    if (!race.candidates || race.candidates.length < 2) continue;
    
    // Sort candidates by actual voting result (polling_pct used as final result for historical)
    const sortedByResult = [...race.candidates].sort((a, b) => {
      const aPct = a.polling_pct || 0;
      const bPct = b.polling_pct || 0;
      return bPct - aPct;
    });

    const actualWinner = sortedByResult[0];

    // Calculate donor advantage: (ie_for - ie_against)
    const candidatesWithDonorAdvantage = race.candidates.map(c => {
      const adv = (c.ie_for_usd || 0) - (c.ie_against_usd || 0);
      return { ...c, donorAdvantage: adv };
    });

    const sortedByMoney = [...candidatesWithDonorAdvantage].sort((a, b) => b.donorAdvantage - a.donorAdvantage);
    const predictedWinner = sortedByMoney[0];

    const isAccurate = predictedWinner.name === actualWinner.name;

    totalRaces++;
    if (isAccurate) accuratePredictions++;

    // Calculate the 'Edge' magnitude
    const moneyDiff = predictedWinner.donorAdvantage - sortedByMoney[1].donorAdvantage;
    const edgeConfidence = Math.min(99, 50 + (moneyDiff / 1000000) * 5); // Rough heuristic: +5% confidence per $1M advantage
    
    console.log(`Race: ${race.headline}`);
    console.log(`- Predicted Winner (by Money): ${predictedWinner.name} (Advantage: $${(predictedWinner.donorAdvantage / 1e6).toFixed(1)}M)`);
    console.log(`- Actual Winner: ${actualWinner.name}`);
    console.log(`- Prediction: ${isAccurate ? '✅ CORRECT' : '❌ INCORRECT'} (Confidence: ${edgeConfidence.toFixed(1)}%)`);
    console.log(`- Summary: ${race.result_summary}\n`);
  }

  console.log("=========================================");
  console.log("BACKTEST RESULTS");
  console.log("=========================================");
  const winRate = (accuratePredictions / totalRaces) * 100;
  console.log(`Total Historical Races Analyzed: ${totalRaces}`);
  console.log(`Accurate Predictions: ${accuratePredictions}`);
  console.log(`Win Rate (Alpha): ${winRate.toFixed(2)}%`);
  
  if (winRate > 65) {
    console.log(`\n✅ VERDICT: EXTREME ALPHA DETECTED. You have a massive statistical edge.`);
  } else if (winRate > 50) {
    console.log(`\n⚠️ VERDICT: MODERATE ALPHA. The model is profitable but needs tuning.`);
  } else {
    console.log(`\n❌ VERDICT: NO ALPHA. The model performs worse than a coin flip.`);
  }
}

runBacktest();
