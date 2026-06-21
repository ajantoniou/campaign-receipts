#!/usr/bin/env node
//
// scripts/sync-senate-rollcalls.mjs  —  Phase 2b: Senate roll-call votes.
//
// seed-bills.mjs only ingests HOUSE votes (Congress.gov v3 doesn't expose Senate
// votes). The authoritative Senate source is senate.gov XML. This pulls the vote
// menu + each vote's member detail, maps lis_member_id → bioguide via the
// congress-legislators crosswalk, and writes cr_roll_calls (same schema as House),
// so vote-alignment + "the record" sections cover senators too.
//
// Senate XML:
//   menu:  /legislative/LIS/roll_call_lists/vote_menu_{congress}_{session}.xml
//   vote:  /legislative/LIS/roll_call_votes/vote{congress}{session}/vote_{congress}_{session}_{NNNNN}.xml
// member rows carry <lis_member_id> (e.g. S428) + <vote_cast>.
//
// Idempotent: upsert on (congress, chamber, roll_number, bioguide). Bounded to the
// most-recent N votes by default (cheap incremental); --all does the whole session.
//
// Usage:
//   node scripts/sync-senate-rollcalls.mjs [--dry-run] [--congress=119] [--session=1] [--recent=20] [--all]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const ALL = args.includes('--all')
const CONGRESS = Number(args.find((a) => a.startsWith('--congress='))?.split('=')[1] ?? 119)
const SESSION = Number(args.find((a) => a.startsWith('--session='))?.split('=')[1] ?? 1)
const RECENT = Number(args.find((a) => a.startsWith('--recent='))?.split('=')[1] ?? 20)
const UA = '(campaign-receipts research, alex@antoniou.net)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getXml(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/xml' } })
    if (r.status === 429 || r.status >= 500) { await sleep(1500 * (attempt + 1)); continue }
    if (!r.ok) throw new Error(`${r.status} ${url}`)
    return r.text()
  }
  throw new Error(`${url}: failed`)
}
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)); return m ? m[1].trim() : null }
const allBlocks = (xml, name) => [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => m[1])

// Normalize a Senate <vote_cast> to the House-style vote value.
function normVote(v) {
  const t = (v || '').toLowerCase()
  if (t === 'yea') return 'Yea'
  if (t === 'nay') return 'Nay'
  if (t.includes('not voting')) return 'Not Voting'
  if (t === 'present') return 'Present'
  return v || null
}

async function main() {
  console.log(`[${new Date().toISOString()}] Senate roll calls ${CONGRESS}-${SESSION}${DRY ? ' (DRY RUN)' : ''}`)

  // Crosswalks: lis_member_id → bioguide (from congress-legislators), bioguide →
  // politician_id (from cr_politicians).
  const legis = await (await fetch('https://unitedstates.github.io/congress-legislators/legislators-current.json', { headers: { 'User-Agent': UA } })).json()
  const bioByLis = new Map()
  for (const l of legis) { if (l.id?.lis && l.id?.bioguide) bioByLis.set(l.id.lis, l.id.bioguide) }
  const { data: pols } = await supabase.from('cr_politicians').select('id, bioguide').not('bioguide', 'is', null)
  const polByBio = new Map((pols || []).map((p) => [p.bioguide, p.id]))

  // Vote menu → list of vote numbers (most recent first).
  const menu = await getXml(`https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${CONGRESS}_${SESSION}.xml`)
  const voteNums = [...menu.matchAll(/<vote_number>(\d+)<\/vote_number>/g)].map((m) => parseInt(m[1], 10))
  const ordered = [...new Set(voteNums)].sort((a, b) => b - a)
  const targets = ALL ? ordered : ordered.slice(0, RECENT)
  console.log(`Menu has ${ordered.length} votes; processing ${targets.length}.`)

  let rowsWritten = 0, votesDone = 0, mapped = 0, unmapped = 0
  for (const n of targets) {
    const nnnnn = String(n).padStart(5, '0')
    const url = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${CONGRESS}${SESSION}/vote_${CONGRESS}_${SESSION}_${nnnnn}.xml`
    let xml
    try { xml = await getXml(url); await sleep(400) } catch (e) { console.error(`  vote ${n}: ${e.message}`); continue }
    votesDone++
    const question = tag(xml, 'vote_question_text') || tag(xml, 'question') || ''
    const dateStr = tag(xml, 'vote_date') // e.g. "January 8, 2025, 05:30 PM"
    let votedAt = null
    if (dateStr) { const d = new Date(dateStr.replace(/,\s*\d{2}:\d{2}\s*(AM|PM).*$/i, '')); if (!isNaN(d)) votedAt = d.toISOString() }
    const isProcedural = /cloture|motion to proceed|motion to table|quorum|adjourn/i.test(question)

    const memberRows = []
    for (const block of allBlocks(xml, 'member')) {
      const lis = tag(block, 'lis_member_id')
      const bio = lis ? bioByLis.get(lis) : null
      if (!bio) { unmapped++; continue }
      mapped++
      memberRows.push({
        congress: CONGRESS, chamber: 'senate', roll_number: n,
        voted_at: votedAt, question: question.slice(0, 500), bill_id: null,
        politician_id: polByBio.get(bio) || null, bioguide: bio,
        vote: normVote(tag(block, 'vote_cast')), is_procedural: isProcedural,
      })
    }
    if (DRY) { if (votesDone <= 3) console.log(`  vote ${n}: "${question.slice(0, 40)}" — ${memberRows.length} mapped members`); rowsWritten += memberRows.length; continue }
    for (let i = 0; i < memberRows.length; i += 500) {
      const { error } = await supabase.from('cr_roll_calls').upsert(memberRows.slice(i, i + 500), { onConflict: 'congress,chamber,roll_number,bioguide' })
      if (error) { console.error(`  vote ${n} upsert:`, error.message); break }
      rowsWritten += memberRows.slice(i, i + 500).length
    }
  }
  console.log(`Done. ${votesDone} votes, ${rowsWritten} member-vote rows ${DRY ? '(dry)' : 'written'}. lis→bioguide mapped ${mapped}, unmapped ${unmapped}.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
