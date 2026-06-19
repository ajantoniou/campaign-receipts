#!/usr/bin/env node
// FEC sync — pulls campaign finance + top donors for federal politicians
// in cr_politicians and upserts into cr_campaign_finance, cr_top_donors,
// cr_industry_breakdown. Sets donor_profile + fec_candidate_id on the
// politician row.
//
// Rate budget: DEMO_KEY = ~30 req/hr per IP. With ~3 req per politician
// (lookup, totals, schedule_a), that's 10 politicians/hr on the demo key
// and ~330/hr with a real key. This script accepts --limit and
// --slugs to control scope.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FEC_KEY = process.env.FEC_API_KEY || 'DEMO_KEY'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

const FEC_BASE = 'https://api.open.fec.gov/v1'

// ---- minimal inline FEC client (no monorepo build needed) ----
async function fecGet(path, params = {}) {
  const qs = new URLSearchParams({ api_key: FEC_KEY })
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.append(k, String(v))
  }
  const url = `${FEC_BASE}${path}?${qs.toString()}`
  const resp = await fetch(url)
  if (resp.status === 429) {
    // Rate limited — wait 60s and retry once
    await sleep(60_000)
    const retry = await fetch(url)
    if (!retry.ok) throw new Error(`FEC ${retry.status} after retry: ${path}`)
    return retry.json()
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`FEC ${resp.status}: ${path} — ${body.slice(0, 160)}`)
  }
  return resp.json()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function officeToCode(branch) {
  if (branch === 'Senate') return 'S'
  if (branch === 'House') return 'H'
  if (branch === 'President') return 'P'
  return null
}

// Hardcoded FEC candidate IDs for politicians whose FEC name-search
// fails or returns the wrong record. Verified manually against
// https://www.fec.gov/data/candidate/<ID>/ before adding here.
const FEC_ID_OVERRIDES = {
  'donald-trump': 'P80001571',         // Trump 2024 campaign
  'donald-trump-2016': 'P80001571',    // Same FEC entity, 2016 cycle
  'joe-biden': 'P80000722',
  'kamala-harris': 'P80001779',
  'tim-walz': 'P00018236',
  'jd-vance': 'P00012541',
  'susan-collins': 'S0ME00109',
  'marjorie-taylor-greene': 'H0GA14122',
  'joe-manchin': 'S2WV00090',
  'hakeem-jeffries': 'H0NY10059',
  'bernie-sanders': 'S4VT00033',
  'alexandria-ocasio-cortez': 'H8NY15148',
  'ted-cruz': 'S2TX00312',
  'mike-johnson': 'H6LA04138',
  'chuck-schumer': 'S6NY00133',
  'elizabeth-warren': 'S2MA00170',
  'mitch-mcconnell': 'S6KY00266',
}

const INDUSTRY = [
  // Tech
  { rx: /\b(google|alphabet|meta\b|facebook|amazon|microsoft|apple\b|netflix|nvidia|salesforce|oracle\b|ibm|tesla|spacex|space exploration|palantir|openai|anthropic)\b/i, label: 'Big Tech' },
  // Crypto
  { rx: /\b(coinbase|binance|kraken|circle\b|ripple|gemini\b|crypto\.com|fairshake|stand with crypto|protect progress)\b/i, label: 'Crypto' },
  // Oil/gas
  { rx: /\b(exxon|chevron|conoco|halliburton|shell\b|bp\b|valero|marathon petroleum|occidental|hess|pioneer natural|continental resources|enterprise products|koch industries|koch ind)\b/i, label: 'Oil & Gas' },
  // Finance
  { rx: /\b(goldman sachs|jpmorgan|jp morgan|citigroup|citibank|bank of america|morgan stanley|wells fargo|blackrock|black rock|kkr|carlyle|apollo global|blackstone|ah capital|andreessen|sequoia|bridgewater|d\.?e\.? shaw|two sigma|millennium management|citadel\b|renaissance technologies)\b/i, label: 'Finance' },
  // Pharma + healthcare
  { rx: /\b(pfizer|merck\b|moderna|johnson & johnson|j&j|abbvie|eli lilly|bristol myers|bristol-myers|amgen|gilead|astrazeneca|sanofi|novartis|roche\b|teva|biogen|regeneron|vertex pharmaceuticals|cvs health|unitedhealth|anthem|cigna|humana|kaiser permanente|hca healthcare)\b/i, label: 'Pharmaceuticals & Healthcare' },
  // Defense
  { rx: /\b(lockheed|raytheon|rtx\b|northrop|boeing|general dynamics|l3harris|honeywell|leidos|booz allen|saic|cacai|kbr|huntington ingalls|textron)\b/i, label: 'Defense' },
  // Political orgs / lobbying
  { rx: /\b(aipac|j street|democracy alliance|club for growth|national rifle|\bnra\b|sierra club|planned parenthood|chamber of commerce|business roundtable|americans for prosperity|heritage|federalist society|aclu)\b/i, label: 'Political organizations' },
  // Labor
  { rx: /\b(united auto workers|\buaw\b|\bseiu\b|\baft\b|\bnea\b|afscme|afl-?cio|teamsters|ibew|laborers international|carpenters|sheet metal|plumbers|operating engineers|communications workers|cwa\b)\b/i, label: 'Labor unions' },
  // Real estate
  { rx: /\b(real estate|realtor|kushner|trump organization|related companies|tishman|vornado|simon property|brookfield)\b/i, label: 'Real estate' },
  // Retired / individual catch-all (lowest priority — fired last)
  { rx: /\b(retired|not employed|homemaker|disabled|self[- ]employed)\b/i, label: 'Individual / Retired' },
]
function classifyIndustry(donorName, employer, occupation) {
  const hay = `${donorName || ''} ${employer || ''} ${occupation || ''}`
  for (const r of INDUSTRY) if (r.rx.test(hay)) return r.label
  return null
}

function lastNameFirst(fullName) {
  // FEC stores names as "LAST, FIRST MIDDLE" — convert our "First Middle Last"
  // (or "First Last") to that format. Strips parentheticals and Jr./Sr./III.
  const cleaned = fullName
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+(Jr\.?|Sr\.?|II|III|IV)\.?\s*$/i, '')
    .trim()
  const parts = cleaned.split(/\s+/)
  if (parts.length < 2) return cleaned
  const last = parts[parts.length - 1]
  const first = parts[0]
  return `${last}, ${first}`
}

async function lookupCandidate(name, state, office) {
  // Try last-name-first format first (matches FEC's internal index)
  // then fall back to natural-language order.
  const queries = [lastNameFirst(name), name]
  for (const q of queries) {
    try {
      const data = await fecGet('/candidates/search', {
        q,
        state: state || undefined,
        office,
        per_page: 5,
      })
      const results = data.results || []
      if (results.length > 0) {
        results.sort((a, b) => Math.max(...(b.cycles || [0])) - Math.max(...(a.cycles || [0])))
        return results[0]?.candidate_id || null
      }
    } catch (e) {
      // Try next query variant
    }
  }
  // Final empty attempt at full name to preserve original behavior + error.
  const data = await fecGet('/candidates/search', {
    q: name,
    state: state || undefined,
    office,
    per_page: 5,
  })
  const results = data.results || []
  if (results.length === 0) return null
  results.sort((a, b) => Math.max(...(b.cycles || [0])) - Math.max(...(a.cycles || [0])))
  return results[0]?.candidate_id || null
}

async function fetchCandidateTotals(candidateId, cycle) {
  const data = await fecGet(`/candidate/${candidateId}/totals/`, { cycle, per_page: 1 })
  const r = (data.results || [])[0] || {}
  const total = Number(r.receipts || 0)
  const ind = Number(r.individual_contributions || 0)
  const pac = Number(r.other_political_committee_contributions || 0)
  const self_ = Number(r.candidate_contribution || 0)
  const itemized = Number(r.individual_itemized_contributions || 0)
  const unitemized = Number(r.individual_unitemized_contributions || 0)
  return {
    total_raised: total,
    total_spent: Number(r.disbursements || 0),
    cash_on_hand: Number(r.last_cash_on_hand_end_period || r.cash_on_hand_end_period || 0),
    individual_pct: total > 0 ? Math.round((ind / total) * 10000) / 100 : 0,
    pac_pct: total > 0 ? Math.round((pac / total) * 10000) / 100 : 0,
    self_funded_pct: total > 0 ? Math.round((self_ / total) * 10000) / 100 : 0,
    in_state_pct: 0,
    large_donor_pct: total > 0 ? Math.round((itemized / Math.max(itemized + unitemized, 1)) * 10000) / 100 : 0,
  }
}

// FEC's /schedules/schedule_a/ endpoint with candidate_id silently
// ignores the candidate filter and returns global rows — that was
// the root of the prior "Elon Musk donated $54B" bug. The correct
// approach is to look up the candidate's principal committee
// (designation=P) and then query schedule_a's pre-aggregated
// /by_employer endpoint with committee_id. That endpoint returns
// employer-aggregated totals for *that committee only*.

async function fetchPrincipalCommitteeId(candidateId, cycle) {
  const data = await fecGet(`/candidate/${candidateId}/committees/`, {
    cycle,
    designation: 'P', // principal candidate committee
    per_page: 5,
  })
  const results = data.results || []
  if (results.length === 0) {
    // Fall back to designation=A (authorized) if no principal — covers
    // joint committees for ex-candidates.
    const fallback = await fecGet(`/candidate/${candidateId}/committees/`, {
      cycle,
      designation: 'A',
      per_page: 5,
    })
    return (fallback.results || [])[0]?.committee_id || null
  }
  return results[0].committee_id
}

async function fetchTopDonors(candidateId, cycle, limit = 20) {
  const committeeId = await fetchPrincipalCommitteeId(candidateId, cycle)
  if (!committeeId) return []

  // /schedules/schedule_a/by_employer/ returns pre-aggregated employer
  // totals for the committee. This is the correct shape: each row is
  // "donors whose employer was X gave $Y total to this committee in
  // cycle Z". Sorting by -total gives us the top contributors clean.
  const data = await fecGet('/schedules/schedule_a/by_employer/', {
    committee_id: committeeId,
    cycle,
    sort: '-total',
    per_page: Math.max(limit * 2, 40), // pull extra so we can drop noise rows
  })
  const rows = data.results || []

  // Filter out FEC's "noise" employer buckets that aren't usable as
  // industry signal: NOT EMPLOYED, INFORMATION REQUESTED, REQUESTED,
  // NONE, SELF, etc. These are real money but tell us nothing about
  // industry capture, so they don't belong in the "top donors"
  // story-generator list. Keep RETIRED + SELF EMPLOYED with caps —
  // they're high-signal demographic markers for grassroots-style
  // bases.
  const NOISE = /^(NOT EMPLOYED|N\/?A|NONE|NULL|UNEMPLOYED|INFORMATION REQUESTED|REQUESTED|REQUESTED PER BEST EFFORTS|NOT APPLICABLE)$/i
  const filtered = rows.filter((r) => {
    const emp = (r.employer || '').trim()
    if (!emp) return false
    if (NOISE.test(emp)) return false
    return true
  })

  return filtered.slice(0, limit).map((r) => {
    const employer = r.employer.trim()
    return {
      donor_name: employer, // employer = "donor" here since we aggregated by employer
      donor_employer: employer,
      donor_occupation: null,
      total_contributed: Number(r.total || 0),
      is_pac: false,
      is_individual: true,
      industry_label: classifyIndustry(employer, employer, null),
    }
  })
}

function donorProfile(totals) {
  if (totals.total_raised === 0) return 'unknown'
  if (totals.self_funded_pct >= 25) return 'self-funded'
  if (totals.pac_pct >= 30) return 'corporate'
  if (totals.individual_pct >= 70 && totals.large_donor_pct <= 50) return 'grassroots'
  return 'mixed'
}

// ---- CLI args ----
const args = process.argv.slice(2)
function argVal(flag) {
  const idx = args.indexOf(flag)
  if (idx < 0) return null
  return args[idx + 1]
}
const LIMIT = Number(argVal('--limit') || '10')
const SLUGS_RAW = argVal('--slugs')
const CYCLE = argVal('--cycle') || '2024'

const ALL_FEDERAL = args.includes('--all-federal')

async function getTargetPoliticians() {
  if (SLUGS_RAW) {
    const slugs = SLUGS_RAW.split(',').map((s) => s.trim()).filter(Boolean)
    const { data } = await supabase
      .from('cr_politicians')
      .select('id, slug, name, state, branch')
      .in('slug', slugs)
    return (data || []).filter((p) => p.branch === 'Senate' || p.branch === 'House' || p.branch === 'President')
  }
  if (ALL_FEDERAL) {
    // Page through every federal politician (Supabase 1000-row default).
    const out = []
    const pageSize = 1000
    let from = 0
    while (true) {
      const { data } = await supabase
        .from('cr_politicians')
        .select('id, slug, name, state, branch, fec_candidate_id')
        .in('branch', ['Senate', 'House', 'President'])
        .order('is_homepage_featured', { ascending: false })
        .order('name')
        .range(from, from + pageSize - 1)
      if (!data || data.length === 0) break
      out.push(...data)
      if (data.length < pageSize) break
      from += pageSize
    }
    return out
  }
  // Default: featured politicians who are federal.
  const { data } = await supabase
    .from('cr_politicians')
    .select('id, slug, name, state, branch, is_homepage_featured, homepage_featured_order')
    .in('branch', ['Senate', 'House', 'President'])
    .eq('is_homepage_featured', true)
    .order('homepage_featured_order', { ascending: true })
    .limit(LIMIT)
  return data || []
}

async function syncOne(p) {
  const office = officeToCode(p.branch)
  if (!office) {
    console.log(`  ↷ skip ${p.name} (branch ${p.branch} not federal)`)
    return
  }
  console.log(`→ ${p.name} (${p.branch} · ${p.state})`)

  let candidateId = FEC_ID_OVERRIDES[p.slug] || null
  if (!candidateId) {
    try {
      candidateId = await lookupCandidate(p.name, p.state, office)
    } catch (e) {
      console.log(`  ! lookup failed: ${e.message}`)
      return
    }
  }
  if (!candidateId) {
    console.log('  ↷ no FEC candidate found')
    return
  }
  await sleep(200)

  let totals
  try {
    totals = await fetchCandidateTotals(candidateId, CYCLE)
  } catch (e) {
    console.log(`  ! totals failed: ${e.message}`)
    return
  }
  await sleep(200)

  let topDonors = []
  try {
    topDonors = await fetchTopDonors(candidateId, CYCLE, 20)
  } catch (e) {
    console.log(`  ! donors failed: ${e.message}`)
  }
  await sleep(200)

  const profile = donorProfile(totals)

  // Upsert campaign_finance row.
  const cfPayload = {
    politician_id: p.id,
    fec_candidate_id: candidateId,
    cycle: CYCLE,
    total_raised: totals.total_raised,
    total_spent: totals.total_spent,
    cash_on_hand: totals.cash_on_hand,
    individual_pct: totals.individual_pct,
    pac_pct: totals.pac_pct,
    self_funded_pct: totals.self_funded_pct,
    in_state_pct: totals.in_state_pct,
    large_donor_pct: totals.large_donor_pct,
    last_synced_at: new Date().toISOString(),
  }
  // Conflict on (fec_candidate_id, cycle)
  const { error: cfErr } = await supabase
    .from('cr_campaign_finance')
    .upsert(cfPayload, { onConflict: 'fec_candidate_id,cycle' })
  if (cfErr) console.log(`  ! cr_campaign_finance: ${cfErr.message}`)

  // Replace top donors for this cycle.
  await supabase.from('cr_top_donors').delete().eq('politician_id', p.id).eq('cycle', CYCLE)
  if (topDonors.length > 0) {
    const rows = topDonors.map((d, i) => ({
      politician_id: p.id,
      fec_candidate_id: candidateId,
      cycle: CYCLE,
      rank: i + 1,
      donor_name: d.donor_name,
      donor_employer: d.donor_employer,
      donor_occupation: d.donor_occupation,
      total_contributed: d.total_contributed,
      is_pac: d.is_pac,
      is_individual: d.is_individual,
      industry_label: d.industry_label,
    }))
    const { error: tdErr } = await supabase.from('cr_top_donors').insert(rows)
    if (tdErr) console.log(`  ! cr_top_donors: ${tdErr.message}`)
  }

  // Industry rollup from top donors (rough cut for v1).
  await supabase.from('cr_industry_breakdown').delete().eq('politician_id', p.id).eq('cycle', CYCLE)
  const indMap = new Map()
  for (const d of topDonors) {
    if (!d.industry_label) continue
    indMap.set(d.industry_label, (indMap.get(d.industry_label) || 0) + d.total_contributed)
  }
  const indRows = Array.from(indMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, total], i) => ({
      politician_id: p.id,
      fec_candidate_id: candidateId,
      cycle: CYCLE,
      industry_code: label.slice(0, 16).toUpperCase().replace(/\s+/g, '_'),
      industry_label: label,
      total_contributions: total,
      rank: i + 1,
    }))
  if (indRows.length > 0) {
    await supabase.from('cr_industry_breakdown').insert(indRows)
  }

  // Update the politician with the FEC id + donor profile.
  await supabase
    .from('cr_politicians')
    .update({ fec_candidate_id: candidateId, donor_profile: profile })
    .eq('id', p.id)

  console.log(`  ✓ ${candidateId} · profile=${profile} · raised=$${Math.round(totals.total_raised / 1000)}K · donors=${topDonors.length}`)
}

async function main() {
  const targets = await getTargetPoliticians()
  console.log(`Syncing FEC data for ${targets.length} politicians (cycle ${CYCLE}, key ${FEC_KEY === 'DEMO_KEY' ? 'DEMO' : 'real'})`)
  for (const p of targets) {
    try {
      await syncOne(p)
    } catch (e) {
      console.log(`  ! ${p.name} failed: ${e.message}`)
    }
  }
  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
