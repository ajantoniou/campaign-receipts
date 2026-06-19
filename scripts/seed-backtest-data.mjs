#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fecKey = process.env.FEC_API_KEY;

if (!supabaseUrl || !supabaseKey || !fecKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const FEC_BASE = 'https://api.open.fec.gov/v1';

async function fecGet(path, params) {
  const qs = new URLSearchParams({ api_key: fecKey });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  }
  const url = `${FEC_BASE}${path}?${qs.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
      console.error(`FEC Error ${resp.status}: ${await resp.text()}`);
      return { results: [] };
  }
  return resp.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getCandidateIE(fecId, cycle) {
  const j = await fecGet('/schedules/schedule_e/by_candidate/', {
    candidate_id: fecId, cycle, per_page: 100
  });
  let forUsd = 0;
  let againstUsd = 0;
  for (const r of (j.results || [])) {
    if (r.support_oppose_indicator === 'O') againstUsd += Number(r.total);
    else forUsd += Number(r.total);
  }
  return { ie_for_usd: forUsd, ie_against_usd: againstUsd };
}

async function getCandidateReceipts(fecId, cycle) {
  const j = await fecGet(`/candidate/${fecId}/totals/`, { cycle, per_page: 1 });
  const r = (j.results || [])[0];
  return r ? Number(r.receipts || 0) : 0;
}

const HISTORICAL_RACES = [
  // 2022 SENATE (General)
  {
    slug: 'pa-senate-2022', headline: '2022 PA Senate', race_type: 'senate_general', cycle: '2022',
    candidates: [
      { name: 'John Fetterman', fec_id: 'S2PA00203', party: 'Democratic', incumbent: false, won: true },
      { name: 'Mehmet Oz', fec_id: 'S2PA00211', party: 'Republican', incumbent: false, won: false }
    ]
  },
  {
    slug: 'ga-senate-2022', headline: '2022 GA Senate', race_type: 'senate_general', cycle: '2022',
    candidates: [
      { name: 'Raphael Warnock', fec_id: 'S0GA00523', party: 'Democratic', incumbent: true, won: true },
      { name: 'Herschel Walker', fec_id: 'S2GA00155', party: 'Republican', incumbent: false, won: false }
    ]
  },
  {
    slug: 'az-senate-2022', headline: '2022 AZ Senate', race_type: 'senate_general', cycle: '2022',
    candidates: [
      { name: 'Mark Kelly', fec_id: 'S0AZ00155', party: 'Democratic', incumbent: true, won: true },
      { name: 'Blake Masters', fec_id: 'S2AZ00302', party: 'Republican', incumbent: false, won: false }
    ]
  },
  {
    slug: 'nv-senate-2022', headline: '2022 NV Senate', race_type: 'senate_general', cycle: '2022',
    candidates: [
      { name: 'Catherine Cortez Masto', fec_id: 'S6NV00200', party: 'Democratic', incumbent: true, won: true },
      { name: 'Adam Laxalt', fec_id: 'S2NV00160', party: 'Republican', incumbent: false, won: false }
    ]
  },
  {
    slug: 'wi-senate-2022', headline: '2022 WI Senate', race_type: 'senate_general', cycle: '2022',
    candidates: [
      { name: 'Ron Johnson', fec_id: 'S0WI00197', party: 'Republican', incumbent: true, won: true },
      { name: 'Mandela Barnes', fec_id: 'S2WI00209', party: 'Democratic', incumbent: false, won: false }
    ]
  },
  {
    slug: 'oh-senate-2022', headline: '2022 OH Senate', race_type: 'senate_general', cycle: '2022',
    candidates: [
      { name: 'JD Vance', fec_id: 'S2OH00346', party: 'Republican', incumbent: false, won: true },
      { name: 'Tim Ryan', fec_id: 'S0OH00067', party: 'Democratic', incumbent: false, won: false }
    ]
  },
  {
    slug: 'nc-senate-2022', headline: '2022 NC Senate', race_type: 'senate_general', cycle: '2022',
    candidates: [
      { name: 'Ted Budd', fec_id: 'S2NC00244', party: 'Republican', incumbent: false, won: true },
      { name: 'Cheri Beasley', fec_id: 'S2NC00251', party: 'Democratic', incumbent: false, won: false }
    ]
  },
  {
    slug: 'fl-senate-2022', headline: '2022 FL Senate', race_type: 'senate_general', cycle: '2022',
    candidates: [
      { name: 'Marco Rubio', fec_id: 'S0FL00398', party: 'Republican', incumbent: true, won: true },
      { name: 'Val Demings', fec_id: 'S2FL00305', party: 'Democratic', incumbent: false, won: false }
    ]
  },

  // 2024 SENATE (General)
  {
    slug: 'oh-senate-2024', headline: '2024 OH Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Sherrod Brown', fec_id: 'S6OH00163', party: 'Democratic', incumbent: true, won: false },
      { name: 'Bernie Moreno', fec_id: 'S4OH00277', party: 'Republican', incumbent: false, won: true }
    ]
  },
  {
    slug: 'mt-senate-2024', headline: '2024 MT Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Jon Tester', fec_id: 'S6MT00113', party: 'Democratic', incumbent: true, won: false },
      { name: 'Tim Sheehy', fec_id: 'S4MT00204', party: 'Republican', incumbent: false, won: true }
    ]
  },
  {
    slug: 'pa-senate-2024', headline: '2024 PA Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Bob Casey', fec_id: 'S6PA00100', party: 'Democratic', incumbent: true, won: false },
      { name: 'David McCormick', fec_id: 'S2PA00245', party: 'Republican', incumbent: false, won: true }
    ]
  },
  {
    slug: 'tx-senate-2024', headline: '2024 TX Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Ted Cruz', fec_id: 'S2TX00312', party: 'Republican', incumbent: true, won: true },
      { name: 'Colin Allred', fec_id: 'S4TX00722', party: 'Democratic', incumbent: false, won: false }
    ]
  },
  {
    slug: 'fl-senate-2024', headline: '2024 FL Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Rick Scott', fec_id: 'S8FL00234', party: 'Republican', incumbent: true, won: true },
      { name: 'Debbie Mucarsel-Powell', fec_id: 'S4FL00273', party: 'Democratic', incumbent: false, won: false }
    ]
  },
  {
    slug: 'mi-senate-2024', headline: '2024 MI Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Elissa Slotkin', fec_id: 'S4MI00388', party: 'Democratic', incumbent: false, won: true },
      { name: 'Mike Rogers', fec_id: 'S4MI00396', party: 'Republican', incumbent: false, won: false }
    ]
  },
  {
    slug: 'az-senate-2024', headline: '2024 AZ Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Ruben Gallego', fec_id: 'S4AZ00262', party: 'Democratic', incumbent: false, won: true },
      { name: 'Kari Lake', fec_id: 'S4AZ00270', party: 'Republican', incumbent: false, won: false }
    ]
  },
  {
    slug: 'nv-senate-2024', headline: '2024 NV Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Jacky Rosen', fec_id: 'S6NV00184', party: 'Democratic', incumbent: true, won: true },
      { name: 'Sam Brown', fec_id: 'S4NV00213', party: 'Republican', incumbent: false, won: false }
    ]
  },
  {
    slug: 'wi-senate-2024', headline: '2024 WI Senate', race_type: 'senate_general', cycle: '2024',
    candidates: [
      { name: 'Tammy Baldwin', fec_id: 'S8WI00026', party: 'Democratic', incumbent: true, won: true },
      { name: 'Eric Hovde', fec_id: 'S2WI00193', party: 'Republican', incumbent: false, won: false }
    ]
  }
];

async function main() {
  console.log("Seeding historical backtest races...");
  for (const race of HISTORICAL_RACES) {
    console.log(`Processing ${race.headline}...`);
    const candidates = [];
    for (const c of race.candidates) {
      console.log(`  Fetching FEC data for ${c.name} (${c.fec_id})...`);
      const ie = await getCandidateIE(c.fec_id, race.cycle);
      await sleep(200);
      const raised = await getCandidateReceipts(c.fec_id, race.cycle);
      await sleep(200);
      
      candidates.push({
        name: c.name,
        party: c.party,
        incumbent: c.incumbent,
        fec_candidate_id: c.fec_id,
        ie_for_usd: ie.ie_for_usd,
        ie_against_usd: ie.ie_against_usd,
        campaign_raised_usd: raised,
        polling_pct: c.won ? 51.0 : 49.0 // We use polling_pct to denote the winner for the backtester
      });
    }
    
    const row = {
      slug: race.slug,
      headline: race.headline,
      race_type: race.race_type,
      cycle: race.cycle,
      is_active: false,
      candidates: candidates,
      result_summary: `${candidates.find(c => c.polling_pct === 51.0)?.name} won.`,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('cr_races').upsert(row, { onConflict: 'slug' });
    if (error) console.error(`  Error saving ${race.slug}:`, error);
    else console.log(`  Saved ${race.slug}.`);
  }
  console.log("Done.");
}

main();
