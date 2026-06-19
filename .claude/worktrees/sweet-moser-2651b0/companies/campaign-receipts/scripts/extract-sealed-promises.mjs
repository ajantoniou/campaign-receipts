#!/usr/bin/env node
// Extract individual Trump 2016 promises + verdicts from the SEALED book's
// build-retail-pdf.mjs script. Produces seed-trump-2016-cycle.json with
// promises tagged term_start=2017-01-20 / term_end=2021-01-20 / cycle_year=2016
// so the seeder writes them as verdict_status='graded'.
//
// Source: companies/concise-sealed/scripts/build-retail-pdf.mjs
// Total verdict tally per published book PDF (verified by founder):
//   KEPT 36 · PARTIAL 42 · BROKEN 48 · YOU_DECIDE 19  = 145

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SOURCE = '/Applications/DrAntoniou Projects/AgentCompanies/companies/concise-sealed/scripts/build-retail-pdf.mjs'
const OUT = join(__dirname, 'seed-trump-2016-cycle.json')

const src = readFileSync(SOURCE, 'utf-8')

// Map book badge labels to directory verdict types.
// BLOCKED → PARTIAL (per /methodology verdict-routing standard;
// blocked-by-Congress folds into PARTIAL when politician's effort was full).
// READER → YOU_DECIDE.
function mapBadge(badge) {
  if (badge === 'KEPT') return 'KEPT'
  if (badge === 'PARTIAL') return 'PARTIAL'
  if (badge === 'BROKEN') return 'BROKEN'
  if (badge === 'BLOCKED') return 'PARTIAL'
  if (badge === 'READER') return 'YOU_DECIDE'
  return null
}

// Strip HTML entities and tags for clean promise text.
function clean(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\$\{badge\("[A-Z]+"\)\}/g, '')
    .trim()
}

// Broad scan: line-by-line look for <h4 class="entry-title">...badge(...).../h4
// and same for h1 ch-title. Avoid greedy multi-line regexes.
const lines = src.split('\n')
const entries = []

for (const line of lines) {
  const h4Match = line.match(/<h4 class="entry-title">(.*?)\$\{badge\("(KEPT|PARTIAL|BROKEN|BLOCKED|READER)"\)\}\s*<\/h4>/)
  if (h4Match) {
    const text = clean(h4Match[1])
    if (text && !/^Receipt\s+\d+/i.test(text)) {
      entries.push({ text, verdict: mapBadge(h4Match[2]), source_badge: h4Match[2], kind: 'detail' })
    }
    continue
  }
  const h1Match = line.match(/<h1 class="ch-title">(.*?)\$\{badge\("(KEPT|PARTIAL|BROKEN|BLOCKED|READER)"\)\}\s*<\/h1>/)
  if (h1Match) {
    const text = clean(h1Match[1])
    if (text) entries.push({ text, verdict: mapBadge(h1Match[2]), source_badge: h1Match[2], kind: 'chapter' })
  }
}

const tocRegex = /<div class="toc-entry"><span class="t">(\d+)\.\s+([^<]+?)<\/span>\$\{badge\("(KEPT|PARTIAL|BROKEN|BLOCKED|READER)"\)\}<\/div>/g
let m

// TOC chapter list — these often duplicate h1 chapter titles but with
// the cleaner "Chapter N: theme" framing. Use them only if h1 didn't
// pick up the chapter.
const tocEntries = []
while ((m = tocRegex.exec(src)) !== null) {
  tocEntries.push({
    n: parseInt(m[1], 10),
    text: clean(m[2]),
    verdict: mapBadge(m[3]),
    source_badge: m[3],
    kind: 'toc',
  })
}

// Build the politician record.
const promises = []
let n = 1

// First 9 chapter-level promises = "Featured" (driving the case study)
const featuredQuadrant = (v) =>
  v === 'KEPT' ? 'own-party-win' :
  v === 'BROKEN' ? 'own-party-loss' :
  v === 'YOU_DECIDE' ? 'opp-party-acknowledge' :
  'opp-party-acknowledge'

// Prefer TOC entries for featured — they have the cleanest framing.
const featured = tocEntries.slice(0, 4) // The Featured Four
for (const e of featured) {
  promises.push({
    promise_number: n++,
    promise_text: e.text,
    promise_type: 'EXPLICIT',
    category: 'Chapter overview',
    verdict: e.verdict,
    is_featured: true,
    featured_quadrant: featuredQuadrant(e.verdict),
    verdict_reasoning: `Aggregated chapter verdict from the SEALED book. See campaignreceipts.com/politician/donald-trump for the full chapter case study and receipts.`,
    term_start: '2017-01-20',
    term_end: '2021-01-20',
    cycle_year: 2016,
    promise_source_url: 'https://sealed2016.com',
  })
}

// Remaining TOC chapter entries (5-9) as non-featured chapter rollups.
for (const e of tocEntries.slice(4)) {
  promises.push({
    promise_number: n++,
    promise_text: e.text,
    promise_type: 'EXPLICIT',
    category: 'Chapter overview',
    verdict: e.verdict,
    is_featured: false,
    verdict_reasoning: `Aggregated chapter verdict from the SEALED book.`,
    term_start: '2017-01-20',
    term_end: '2021-01-20',
    cycle_year: 2016,
    promise_source_url: 'https://sealed2016.com',
  })
}

// Individual h4 sub-promises.
for (const e of entries.filter((x) => x.kind === 'detail')) {
  promises.push({
    promise_number: n++,
    promise_text: e.text,
    promise_type: 'EXPLICIT',
    category: 'Individual pledge',
    verdict: e.verdict,
    is_featured: false,
    verdict_reasoning: `Verdict from the SEALED book. Original badge: ${e.source_badge}. Full receipts in the book at sealed2016.com.`,
    term_start: '2017-01-20',
    term_end: '2021-01-20',
    cycle_year: 2016,
    promise_source_url: 'https://sealed2016.com',
  })
}

// Synthesize the politician record (slug suffixed to distinguish from
// the existing donald-trump entry which tracks the 2024 cycle).
const record = {
  politician: {
    slug: 'donald-trump-2016',
    name: 'Donald John Trump (2016-cycle)',
    party: 'Republican',
    branch: 'President',
    state: 'NY',
    gender: 'Male',
    religion: 'Christian (Presbyterian)',
    minority_status: null,
    dob: '1946-06-14',
    age: 79,
    in_office_since: '2017-01-20',
    in_office_to: '2021-01-20',
    current_status: 'Former president (2021); returned to office 2025',
    official_url: 'https://trumpwhitehouse.archives.gov',
    photo_url: null,
    ideology_label: 'Populist Republican',
    professional_background: 'Real estate developer; television personality; 45th and 47th President of the United States.',
    profile_narrative: `Trump's 2016 cycle — the campaign promises made between 2015 and Nov 8, 2016 — were graded against his 2017-2021 first term by SEALED Press. The book documents 145 distinct promises with paper-trail receipts on every verdict. Final published tally: 36 KEPT, 42 PARTIAL, 48 BROKEN, 19 YOU_DECIDE. This directory page surfaces ${promises.length} of those promises (the chapter overviews + individual h4-level pledges from the book). For the remaining ${145 - promises.length} sub-promises that appear in book prose without their own header — and for the full case-study receipts on every verdict — read the book at sealed2016.com.`,
    review_tier: 'book-sourced',
  },
  promises,
}

writeFileSync(OUT, JSON.stringify([record], null, 2))
console.log(`Extracted ${promises.length} promises (${entries.length + tocEntries.length} raw matches)`)

// Verdict tally for sanity check.
const tally = { KEPT: 0, PARTIAL: 0, BROKEN: 0, YOU_DECIDE: 0 }
for (const p of promises) tally[p.verdict] = (tally[p.verdict] || 0) + 1
console.log('Verdict tally:', tally)
console.log(`Wrote ${OUT}`)
