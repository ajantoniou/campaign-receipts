// lib/dossier.ts — the connection-matrix dossier engine.
//
// Per briefs/2026-05-30-connection-matrix-backfill.md §4: a paid search calls
// /api/dossier/[type]/[id]. We assemble a DETERMINISTIC, FULLY-SOURCED bundle
// from SQL (no model in the retrieval path), then hand it to Claude Opus to
// *write* the dossier — never to *recall*. Every fact carries a `source`; the
// system prompt forbids asserting anything not in facts[].
//
// Caching is two-layer:
//   1. Postgres cr_dossier_cache keyed on (entity_type, entity_id, inputs_hash)
//      where inputs_hash = sha256 of the bundle. Same bundle never re-bills Opus.
//   2. Anthropic prompt caching on the static system+contract prefix
//      (cache_control on the last system block) so repeated calls are ~0.1x.
//
// Default: dossiers generate only on a real paid request — we never
// pre-generate 585x4. The $ cap is respected by the Postgres cache + the
// gate in the route (free users get the bundle headline, no Opus call).

import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseService } from './supabase'

// claude-opus-4-8 per portfolio strategy/financial-adjacent tier + claude-api skill.
const OPUS_MODEL = 'claude-opus-4-8'

export type EntityType = 'politician' | 'donor' | 'bill' | 'vote'

export type Fact = {
  claim_type: string
  source: string
  [k: string]: unknown
}

export type CrossLink = {
  committee_id: string
  committee_name: string
  also_funded: { politician_id: string; name: string; slug: string; amount: number }[]
}

// A THEME is a deterministic, fully-sourced pattern computed in pure JS/SQL
// from the facts we HAVE — the "so-what" depth layer above flat receipts.
// The model NARRATES these; it never computes them. Every number is traced
// to a table/row via `sources`. If a pattern can't be computed from real
// rows, it is OMITTED — never fabricated.
export type Theme = {
  kind: 'party_skew' | 'multi_cycle' | 'shared_legislation' | 'concentration' | 'industry_cluster' | 'donor_loyalty'
  headline: string // the patterned so-what, plain English
  detail: string // supporting sentence(s) with the numbers
  sources: string[] // every figure above traces to one of these
}

export type DossierBundle = {
  entity: { type: EntityType; id: string; name: string }
  as_of: string
  facts: Fact[]
  themes: Theme[]
  cross_links: CrossLink[]
  notes: string[]
}

export type DossierResult = {
  bundle: DossierBundle
  headline: string // one plain-English line, shown FREE
  factCount: number
  crossLinkCount: number
  dossierMd: string | null // full Opus prose — only present for Pro
  cached: boolean
  usage?: { input_tokens: number; output_tokens: number; cache_read_input_tokens: number }
}

// ── Bundle assembly (pure SQL, no model) ─────────────────────

const today = () => new Date().toISOString().slice(0, 10)

async function assemblePoliticianBundle(slug: string): Promise<DossierBundle | null> {
  const { data: p } = await supabaseService
    .from('cr_politicians')
    .select(
      'id, slug, name, party, branch, state, scorecard_kept, scorecard_broken, scorecard_partial, scorecard_graded_total, scorecard_percentage_kept, bioguide',
    )
    .eq('slug', slug)
    .maybeSingle()
  if (!p) return null

  const facts: Fact[] = []
  const notes: string[] = []

  if (p.scorecard_graded_total > 0) {
    facts.push({
      claim_type: 'scorecard',
      kept: p.scorecard_kept,
      broken: p.scorecard_broken,
      partial: p.scorecard_partial,
      graded_total: p.scorecard_graded_total,
      pct_kept: p.scorecard_percentage_kept,
      source: `cr_politicians scorecard slug=${p.slug}`,
    })
  }

  // PAC money in — who funded this politician, top by amount.
  const { data: pac } = await supabaseService
    .from('cr_pac_contributions')
    .select('committee_id, total_amount, cycle, contribution_count, cr_committees!inner(name, industry_label, committee_type_full)')
    .eq('politician_id', p.id)
    .order('total_amount', { ascending: false })
    .limit(25)
  for (const row of (pac || []) as any[]) {
    facts.push({
      claim_type: 'pac_contribution',
      committee_id: row.committee_id,
      committee_name: row.cr_committees?.name,
      industry: row.cr_committees?.industry_label || row.cr_committees?.committee_type_full,
      amount: Number(row.total_amount),
      cycle: row.cycle,
      source: `FEC schedule_a 11C committee_id=${row.committee_id} → politician=${p.slug}`,
    })
  }

  // Top donors (individual + PAC, FEC top-20 by amount). This is the WIDEST
  // donor table — 270 politicians have it vs. only 42 with cr_pac_contributions.
  // Without this, ~85% of politicians-with-donor-data showed an empty dossier
  // ("Donor connections loading") even though their donor names exist. (Fix
  // 2026-06-02: the politician bundle queried only cr_pac_contributions.)
  const { data: topDonors } = await supabaseService
    .from('cr_top_donors')
    .select('donor_name, donor_employer, donor_occupation, total_contributed, cycle, rank, is_pac, is_individual, industry_label')
    .eq('politician_id', p.id)
    .order('rank', { ascending: true })
    .limit(20)
  for (const row of (topDonors || []) as any[]) {
    facts.push({
      claim_type: 'top_donor',
      donor_name: row.donor_name,
      employer: row.donor_employer,
      occupation: row.donor_occupation,
      industry: row.industry_label,
      is_pac: row.is_pac,
      amount: Number(row.total_contributed),
      cycle: row.cycle,
      source: `FEC top donors (cr_top_donors) politician=${p.slug} cycle=${row.cycle} rank=${row.rank}`,
    })
  }

  // Donor-vote alignment (procedural already scrubbed upstream).
  const { data: align } = await supabaseService
    .from('cr_donor_vote_alignment')
    .select('industry_label, vote, industry_position, alignment_score, total_from_industry, bill_id')
    .eq('politician_id', p.id)
    .limit(40)
  for (const row of (align || []) as any[]) {
    facts.push({
      claim_type: 'donor_vote_alignment',
      industry: row.industry_label,
      vote: row.vote,
      industry_wanted: row.industry_position,
      aligned: row.alignment_score === 1,
      money_from_industry: row.total_from_industry != null ? Number(row.total_from_industry) : null,
      source: `cr_donor_vote_alignment politician=${p.slug} bill_id=${row.bill_id}`,
    })
  }
  if (!align || align.length === 0) {
    notes.push('No donor-to-vote alignment rows yet for this politician (House roll-calls + bill-industry tags still expanding).')
  }

  const crossLinks = await buildCrossLinks(facts.filter((f) => f.claim_type === 'pac_contribution').map((f) => f.committee_id as string), p.id)

  const themes = computePoliticianThemes(p.name, facts)

  return {
    entity: { type: 'politician', id: p.slug, name: p.name },
    as_of: today(),
    facts,
    themes,
    cross_links: crossLinks,
    notes,
  }
}

// Mirror themes for a POLITICIAN: which industries cluster around them, and
// whether their votes line up with their top-donor industry. Deterministic;
// sourced or omitted.
function computePoliticianThemes(name: string, facts: Fact[]): Theme[] {
  const themes: Theme[] = []
  const money = (x: number) => `$${Math.round(x).toLocaleString()}`
  const pac = facts.filter((f) => f.claim_type === 'pac_contribution') as any[]

  // INDUSTRY CLUSTER — which industries fund this member, by share of PAC $.
  if (pac.length >= 3) {
    const total = pac.reduce((s, f) => s + (f.amount || 0), 0)
    const byIndustry = new Map<string, number>()
    for (const f of pac) {
      const ind = f.industry || 'Other / untagged'
      byIndustry.set(ind, (byIndustry.get(ind) || 0) + (f.amount || 0))
    }
    const ranked = [...byIndustry.entries()].sort((a, b) => b[1] - a[1])
    const [topInd, topAmt] = ranked[0]
    if (total > 0 && topAmt / total >= 0.25 && topInd !== 'Other / untagged') {
      themes.push({
        kind: 'industry_cluster',
        headline: `${topInd} is the biggest industry behind ${name}'s PAC money.`,
        detail: `Of ${money(total)} from ${pac.length} committees, ${money(topAmt)} (${Math.round((topAmt / total) * 100)}%) came from ${topInd}.`,
        sources: ['cr_pac_contributions + cr_committees.industry_label for this politician'],
      })
    }
  }

  // TOP-DONOR CONCENTRATION — how much of the named top-donor money sits in the
  // first few givers. Only fires when PAC industry-cluster didn't (top donors are
  // the fallback signal for the ~85% of members without PAC rows).
  const donors = facts.filter((f) => f.claim_type === 'top_donor') as any[]
  if (donors.length >= 5 && pac.length < 3) {
    const dTotal = donors.reduce((s, f) => s + (f.amount || 0), 0)
    const top3 = donors.slice(0, 3)
    const top3Amt = top3.reduce((s, f) => s + (f.amount || 0), 0)
    if (dTotal > 0 && top3Amt / dTotal >= 0.4) {
      themes.push({
        kind: 'concentration',
        headline: `${Math.round((top3Amt / dTotal) * 100)}% of ${name}'s top-donor money came from just 3 sources.`,
        detail: `Of ${money(dTotal)} across the top ${donors.length} donors, ${money(top3Amt)} came from ${top3.map((d) => d.donor_name).join(', ')}.`,
        sources: ['cr_top_donors for this politician'],
      })
    }
  }

  // VOTE/DONOR ALIGNMENT — does this member vote with the industries funding them?
  const align = facts.filter((f) => f.claim_type === 'donor_vote_alignment') as any[]
  if (align.length >= 3) {
    const aligned = align.filter((a) => a.aligned).length
    themes.push({
      kind: 'donor_loyalty',
      headline: `${name} voted with the funding industry on ${aligned} of ${align.length} tracked bills.`,
      detail: align.map((a) => `${a.industry}: voted ${a.vote}, industry wanted ${a.industry_wanted} — ${a.aligned ? 'aligned' : 'not aligned'}`).slice(0, 5).join('; ') + '.',
      sources: ['cr_donor_vote_alignment for this politician'],
    })
  }

  return themes
}

async function assembleDonorBundle(committeeId: string): Promise<DossierBundle | null> {
  const { data: c } = await supabaseService
    .from('cr_committees')
    .select('committee_id, name, committee_type_full, designation_full, organization_type_full, connected_org_name, is_leadership_pac, industry_label, party, state')
    .eq('committee_id', committeeId)
    .maybeSingle()
  if (!c) return null

  const facts: Fact[] = []
  facts.push({
    claim_type: 'committee_profile',
    committee_id: c.committee_id,
    type: c.committee_type_full,
    designation: c.designation_full,
    organization_type: c.organization_type_full,
    connected_org: c.connected_org_name,
    is_leadership_pac: c.is_leadership_pac,
    industry: c.industry_label,
    source: `FEC committee metadata committee_id=${c.committee_id}`,
  })

  // Every politician this donor funded — the cross-politician spine.
  const { data: edges } = await supabaseService
    .from('cr_pac_contributions')
    .select('politician_id, total_amount, cycle, contribution_count, cr_politicians!inner(name, slug, party, state, branch, bioguide)')
    .eq('committee_id', committeeId)
    .order('total_amount', { ascending: false })
    .limit(50)

  // DEFENSIVE DEDUP: cr_politicians has near-duplicate rows for the SAME member
  // (same `bioguide`, e.g. "Patrick Kerwin Ryan" / "Patrick Killian Ryan", both
  // R000579) — counting both double-counts the donor's giving. Collapse on
  // bioguide (the authoritative FEC/Congress id), summing amounts, keeping one
  // canonical name. Members with no bioguide stay distinct (keyed by slug).
  const byMember = new Map<string, { name: string; slug: string; party: string; state: string; amount: number; cycle: string; mergedFrom: string[] }>()
  let dedupNote = false
  for (const row of (edges || []) as any[]) {
    const p = row.cr_politicians
    const key = p?.bioguide || `slug:${p?.slug}`
    const amt = Number(row.total_amount)
    const ex = byMember.get(key)
    if (ex) {
      ex.amount += amt
      ex.mergedFrom.push(p?.slug)
      dedupNote = true
    } else {
      byMember.set(key, { name: p?.name, slug: p?.slug, party: p?.party, state: p?.state, amount: amt, cycle: row.cycle, mergedFrom: [p?.slug] })
    }
  }
  const members = [...byMember.values()].sort((a, b) => b.amount - a.amount)

  let total = 0
  for (const m of members) {
    total += m.amount
    facts.push({
      claim_type: 'funded_politician',
      politician: m.name,
      slug: m.slug,
      party: m.party,
      state: m.state,
      amount: m.amount,
      cycle: m.cycle,
      source: `FEC schedule_a 11C committee_id=${committeeId} → politician=${m.slug}`,
    })
  }
  facts.push({
    claim_type: 'donor_total',
    total_to_tracked_politicians: total,
    distinct_politicians: members.length,
    source: `cr_pac_contributions sum committee_id=${committeeId}`,
  })

  const notes: string[] = []
  if (dedupNote) {
    notes.push('Some funded members appeared as near-duplicate records in our data (same official ID, slightly different name). We merged them so each member is counted once.')
  }

  const cycles = [...new Set(members.map((m) => m.cycle).filter(Boolean))]
  const themes = computeDonorThemes(c.name, members, total, c.industry_label, cycles)

  // 3. SHARED LEGISLATION — only if real alignment rows tie the funded members
  // to the same bill in the donor's industry direction. Sourced or omitted.
  const memberIds = (edges || []).map((e: any) => e.politician_id).filter(Boolean)
  if (memberIds.length > 0) {
    const { data: align } = await supabaseService
      .from('cr_donor_vote_alignment')
      .select('politician_id, bill_id, industry_label, vote, industry_position, alignment_score')
      .in('politician_id', memberIds)
    const rows = (align || []) as any[]
    if (rows.length > 0) {
      // Group by bill; count distinct funded members who aligned with the industry.
      const byBill = new Map<string, { industry: string; aligned: Set<string> }>()
      for (const r of rows) {
        if (r.alignment_score !== 1) continue
        if (!byBill.has(r.bill_id)) byBill.set(r.bill_id, { industry: r.industry_label, aligned: new Set() })
        byBill.get(r.bill_id)!.aligned.add(r.politician_id)
      }
      for (const [billId, g] of byBill) {
        if (g.aligned.size >= 3) {
          themes.push({
            kind: 'shared_legislation',
            headline: `${g.aligned.size} of the funded members voted the way ${g.industry} donors wanted on one bill.`,
            detail: `On bill ${billId}, ${g.aligned.size} members ${c.name} funds voted in line with the ${g.industry} industry's position.`,
            sources: [`cr_donor_vote_alignment bill_id=${billId} (aligned funded members)`],
          })
        }
      }
    }
  }

  return {
    entity: { type: 'donor', id: c.committee_id, name: c.name },
    as_of: today(),
    facts,
    themes,
    cross_links: [],
    notes,
  }
}

type FundedMember = { name: string; slug: string; party: string; state: string; amount: number; cycle: string }

// Pure deterministic theme computation for a DONOR/committee.
// Every theme number traces to a source string; patterns that can't be
// computed from these real rows are simply not produced.
function computeDonorThemes(
  committeeName: string,
  members: FundedMember[],
  total: number,
  industry: string | null,
  cycles: string[],
): Theme[] {
  const themes: Theme[] = []
  const n = members.length
  if (n === 0) return themes
  const src = `cr_pac_contributions committee_id (funded-member rows, deduped on bioguide)`
  const money = (x: number) => `$${Math.round(x).toLocaleString()}`

  // 1. PARTY SKEW
  const rep = members.filter((m) => m.party === 'Republican')
  const dem = members.filter((m) => m.party === 'Democratic')
  const ind = members.filter((m) => m.party === 'Independent')
  const repAmt = rep.reduce((s, m) => s + m.amount, 0)
  const demAmt = dem.reduce((s, m) => s + m.amount, 0)
  const maj = rep.length >= dem.length ? { label: 'Republican', count: rep.length, amt: repAmt } : { label: 'Democratic', count: dem.length, amt: demAmt }
  const majShare = maj.count / n
  if (majShare >= 0.65 && n >= 4) {
    themes.push({
      kind: 'party_skew',
      headline: `${maj.count} of the ${n} members ${committeeName} funds are ${maj.label}.`,
      detail: `Of ${n} tracked members funded, ${rep.length} are Republican (${money(repAmt)}), ${dem.length} are Democratic (${money(demAmt)})${ind.length ? `, ${ind.length} Independent` : ''}. The money leans ${maj.label}.`,
      sources: [src, 'cr_politicians.party'],
    })
  } else if (n >= 4) {
    // Notably bipartisan is itself a pattern worth narrating.
    themes.push({
      kind: 'party_skew',
      headline: `${committeeName} funds both parties — ${rep.length} Republicans and ${dem.length} Democrats.`,
      detail: `Of ${n} tracked members funded, ${rep.length} are Republican (${money(repAmt)}) and ${dem.length} are Democratic (${money(demAmt)})${ind.length ? `, plus ${ind.length} Independent` : ''}. The split is close, not lopsided.`,
      sources: [src, 'cr_politicians.party'],
    })
  }

  // 4. CONCENTRATION — top-5 share
  if (n >= 6 && total > 0) {
    const top5 = members.slice(0, 5)
    const top5Amt = top5.reduce((s, m) => s + m.amount, 0)
    const share = top5Amt / total
    if (share >= 0.4) {
      themes.push({
        kind: 'concentration',
        headline: `${Math.round(share * 100)}% of the ${money(total)} went to just ${top5.length} members.`,
        detail: `Top recipients: ${top5.map((m) => `${m.name} (${money(m.amount)})`).join(', ')}. The rest is spread thin across ${n - top5.length} more members.`,
        sources: [src],
      })
    }
  }

  // 2. MULTI-CYCLE PERSISTENCE — honest about single-cycle data.
  if (cycles.length <= 1) {
    themes.push({
      kind: 'multi_cycle',
      headline: `This is one cycle of giving (${cycles[0] || 'current'}) — we can't yet show multi-year loyalty.`,
      detail: `All ${n} of these contributions are from the ${cycles[0] || 'current'} cycle. We do not have earlier cycles loaded for ${committeeName}, so we make no claim about repeat funding across years.`,
      sources: [src, 'cr_pac_contributions.cycle'],
    })
  } else {
    const byCycle = new Map<string, Set<string>>()
    for (const m of members) {
      if (!byCycle.has(m.cycle)) byCycle.set(m.cycle, new Set())
      byCycle.get(m.cycle)!.add(m.slug)
    }
    const sets = [...byCycle.values()]
    const persistent = members.filter((m) => sets.filter((s) => s.has(m.slug)).length >= 2)
    if (persistent.length > 0) {
      themes.push({
        kind: 'multi_cycle',
        headline: `${committeeName} funded the same ${persistent.length} members across ${cycles.length} cycles (${cycles.sort().join(', ')}).`,
        detail: `Repeat recipients: ${[...new Set(persistent.map((m) => m.name))].join(', ')}.`,
        sources: [src, 'cr_pac_contributions.cycle'],
      })
    }
  }

  return themes
}

async function assembleBillBundle(billId: string): Promise<DossierBundle | null> {
  const { data: b } = await supabaseService
    .from('cr_bills')
    .select('id, congress, bill_type, bill_number, title, short_title, summary, status, introduced_at, sponsor_bioguide, congress_gov_url')
    .eq('id', billId)
    .maybeSingle()
  if (!b) return null

  const facts: Fact[] = []
  const notes: string[] = []
  facts.push({
    claim_type: 'bill_profile',
    bill: `${b.bill_type?.toUpperCase()} ${b.bill_number}`,
    title: b.short_title || b.title,
    status: b.status,
    introduced_at: b.introduced_at,
    source: `cr_bills id=${b.id}${b.congress_gov_url ? ' (' + b.congress_gov_url + ')' : ''}`,
  })

  const { data: money } = await supabaseService
    .from('cr_bill_money_trail')
    .select('industry_label, total_from_industry, n_sponsors_funded, rank')
    .eq('bill_id', billId)
    .order('rank', { ascending: true })
    .limit(15)
  for (const row of (money || []) as any[]) {
    facts.push({
      claim_type: 'bill_money_trail',
      industry: row.industry_label,
      total_from_industry: Number(row.total_from_industry),
      sponsors_funded: row.n_sponsors_funded,
      source: `cr_bill_money_trail bill_id=${billId} industry=${row.industry_label}`,
    })
  }

  const { data: pos } = await supabaseService
    .from('cr_bill_industry_positions')
    .select('industry_label, position, is_human_verified, source, confidence')
    .eq('bill_id', billId)
    .limit(15)
  for (const row of (pos || []) as any[]) {
    facts.push({
      claim_type: 'bill_industry_position',
      industry: row.industry_label,
      stance: row.position,
      verified: row.is_human_verified,
      source: row.source || `cr_bill_industry_positions bill_id=${billId}`,
    })
  }
  if (!pos || pos.length === 0) {
    notes.push('No industry-stance tags on this bill yet (bill-industry tagging is editorial and still limited to ~48 bills).')
  }

  return {
    entity: { type: 'bill', id: b.id, name: b.short_title || b.title },
    as_of: today(),
    facts,
    themes: [],
    cross_links: [],
    notes,
  }
}

// A "vote" node resolves to the bill it was cast on + the politician's record.
async function assembleVoteBundle(rollCallId: string): Promise<DossierBundle | null> {
  const { data: rc } = await supabaseService
    .from('cr_roll_calls')
    .select('id, congress, chamber, roll_number, question, vote, is_procedural, bill_id, politician_id, voted_at, cr_politicians(name, slug)')
    .eq('id', rollCallId)
    .maybeSingle()
  if (!rc) return null

  const facts: Fact[] = []
  const pol = (rc as any).cr_politicians
  facts.push({
    claim_type: 'vote',
    roll_call: `${rc.chamber}-${rc.congress}-${rc.roll_number}`,
    question: rc.question,
    position: rc.vote,
    is_procedural: rc.is_procedural,
    politician: pol?.name,
    voted_at: rc.voted_at,
    source: `cr_roll_calls id=${rc.id}`,
  })

  let name = rc.question || `Roll call ${rc.roll_number}`
  if (rc.bill_id) {
    const { data: b } = await supabaseService
      .from('cr_bills')
      .select('id, bill_type, bill_number, short_title, title, status')
      .eq('id', rc.bill_id)
      .maybeSingle()
    if (b) {
      name = b.short_title || b.title
      facts.push({
        claim_type: 'bill_profile',
        bill: `${b.bill_type?.toUpperCase()} ${b.bill_number}`,
        title: b.short_title || b.title,
        status: b.status,
        source: `cr_bills id=${b.id}`,
      })
      const { data: money } = await supabaseService
        .from('cr_bill_money_trail')
        .select('industry_label, total_from_industry, rank')
        .eq('bill_id', rc.bill_id)
        .order('rank', { ascending: true })
        .limit(10)
      for (const row of (money || []) as any[]) {
        facts.push({
          claim_type: 'bill_money_trail',
          industry: row.industry_label,
          total_from_industry: Number(row.total_from_industry),
          source: `cr_bill_money_trail bill_id=${rc.bill_id} industry=${row.industry_label}`,
        })
      }
    }
  }

  return {
    entity: { type: 'vote', id: rc.id, name },
    as_of: today(),
    facts,
    themes: [],
    cross_links: [],
    notes: rc.is_procedural ? ['This is a procedural vote — it is not a vote on the bill itself.'] : [],
  }
}

// The dot-connecting payload: for each committee that funded this politician,
// which OTHER tracked politicians did it also fund. Pure cr_pac_contributions.
async function buildCrossLinks(committeeIds: string[], excludePoliticianId: string): Promise<CrossLink[]> {
  if (committeeIds.length === 0) return []
  const top = committeeIds.slice(0, 8) // cap payload; top funders only
  const links: CrossLink[] = []
  for (const cid of top) {
    const { data } = await supabaseService
      .from('cr_pac_contributions')
      .select('total_amount, cr_committees!inner(name), cr_politicians!inner(name, slug, id)')
      .eq('committee_id', cid)
      .neq('politician_id', excludePoliticianId)
      .order('total_amount', { ascending: false })
      .limit(6)
    const rows = (data || []) as any[]
    if (rows.length === 0) continue
    links.push({
      committee_id: cid,
      committee_name: rows[0].cr_committees?.name,
      also_funded: rows.map((r) => ({
        politician_id: r.cr_politicians?.id,
        name: r.cr_politicians?.name,
        slug: r.cr_politicians?.slug,
        amount: Number(r.total_amount),
      })),
    })
  }
  return links
}

export async function assembleBundle(type: EntityType, id: string): Promise<DossierBundle | null> {
  switch (type) {
    case 'politician':
      return assemblePoliticianBundle(id)
    case 'donor':
      return assembleDonorBundle(id)
    case 'bill':
      return assembleBillBundle(id)
    case 'vote':
      return assembleVoteBundle(id)
  }
}

// ── Headline (free teaser, deterministic — no model) ─────────

function buildHeadline(bundle: DossierBundle): string {
  const { entity, facts } = bundle
  if (entity.type === 'politician') {
    const pac = facts.filter((f) => f.claim_type === 'pac_contribution')
    const total = pac.reduce((s, f) => s + (f.amount as number), 0)
    if (pac.length > 0) {
      return `${entity.name} took $${Math.round(total).toLocaleString()} from ${pac.length} political committees.`
    }
    // Fall back to top-donor data (far wider coverage than PAC contributions).
    const donors = facts.filter((f) => f.claim_type === 'top_donor')
    if (donors.length > 0) {
      const dTotal = donors.reduce((s, f) => s + (f.amount as number), 0)
      return `${entity.name}'s top ${donors.length} donors gave $${Math.round(dTotal).toLocaleString()}.`
    }
    return `${entity.name} — promise record on file. Donor connections loading.`
  }
  if (entity.type === 'donor') {
    const tot = facts.find((f) => f.claim_type === 'donor_total') as any
    if (tot) {
      return `${entity.name} gave $${Math.round(tot.total_to_tracked_politicians).toLocaleString()} to ${tot.distinct_politicians} politicians we track.`
    }
    return `${entity.name} — committee profile on file.`
  }
  if (entity.type === 'bill') {
    const money = facts.find((f) => f.claim_type === 'bill_money_trail') as any
    if (money) {
      return `On ${entity.name}, ${money.industry} donors gave sponsors $${Math.round(money.total_from_industry).toLocaleString()}.`
    }
    return `${entity.name} — bill on file.`
  }
  // vote
  const v = facts.find((f) => f.claim_type === 'vote') as any
  return `${v?.politician || 'A member'} voted ${v?.position} on ${entity.name}.`
}

// ── Opus synthesis (writes, never recalls) ───────────────────

const SYSTEM_CONTRACT = `You are the writing engine for Campaign Receipts, a money-in-politics accountability tool used by journalists and citizen investigators.

You are handed a BUNDLE of facts retrieved from FEC and Congress.gov data. The bundle also contains a themes array: deterministic, pre-computed PATTERNS (the "so-what") — party skew, money concentration, multi-cycle persistence, shared legislation, industry clusters. These were computed in code from the same facts, NOT by you; you must NOT recompute or second-guess their numbers, only narrate them. Your ONLY job is to WRITE a clear, sourced donor-influence dossier. You do not have outside knowledge of this entity. You did not look anything up. Everything you assert MUST come from the bundle.

LEAD WITH THE THEMES (the so-what), THEN support with the receipts. A reader should learn the PATTERN first ("most of the money leans one party", "half went to five members") and only then the line-item amounts. Use each theme's headline and detail; cite the theme's sources. If there are no themes, fall back to the flat receipts but say plainly that no strong pattern emerged.

HARD RULES — violating any of these is a failure:
1. Assert ONLY what is in facts[] or cross_links[]. If a number, name, vote, or connection is not in the bundle, you may NOT state it.
2. Every dollar figure, vote, and position you mention must be followed by its source string in parentheses, copied verbatim from the fact's "source" field. Example: "took $5,000 from UNITE HERE TIP (FEC schedule_a 11C committee_id=C00004861)".
3. If the bundle does not contain a connection the reader might expect (e.g. no vote data, no industry stance), SAY SO plainly — "We do not yet have vote records linked to this donor." Do not infer or guess.
4. Never characterize intent or motive as fact. You may note a pattern ("this committee also funds X, Y, Z") but frame influence as a question the receipts raise, not a proven quid pro quo.
5. Nonpartisan. Same skepticism every direction. No "corrupt", "bought", "evil". Receipts, not character attacks.
6. Plain English, 3rd-to-6th-grade reading level. Short sentences. A curious citizen who is not a data person must be able to follow it.

OUTPUT FORMAT (markdown):
- A one-sentence summary line.
- A "## The money" section: who gave, how much, sourced.
- A "## The connections" section: use cross_links to name the OTHER politicians the same donors fund — this is the dot-connecting the reader is paying for. If cross_links is empty, write what the shared-donor picture would show once linked and say it's not yet available.
- A "## What we can't say yet" section listing the gaps from notes[].
Keep the whole dossier under 450 words.`

function hashBundle(bundle: DossierBundle): string {
  // Stable stringify: sort keys so identical data → identical hash.
  const stable = JSON.stringify(bundle, Object.keys(bundle).sort())
  return createHash('sha256').update(stable).digest('hex')
}

export async function getDossier(type: EntityType, id: string, opts: { withProse: boolean }): Promise<DossierResult | null> {
  const bundle = await assembleBundle(type, id)
  if (!bundle) return null

  const headline = buildHeadline(bundle)
  const factCount = bundle.facts.length
  const crossLinkCount = bundle.cross_links.length

  // Free path: bundle headline + locked panel. No Opus call, no $ spent.
  if (!opts.withProse) {
    return { bundle, headline, factCount, crossLinkCount, dossierMd: null, cached: false }
  }

  const inputsHash = hashBundle(bundle)

  // Layer-1 cache: same bundle never re-bills Opus.
  const { data: hit } = await supabaseService
    .from('cr_dossier_cache')
    .select('dossier_md, input_tokens, output_tokens, cache_read_tokens')
    .eq('entity_type', type)
    .eq('entity_id', id)
    .eq('inputs_hash', inputsHash)
    .maybeSingle()
  if (hit) {
    return { bundle, headline, factCount, crossLinkCount, dossierMd: hit.dossier_md, cached: true }
  }

  // Cache miss — call Opus to WRITE the dossier from the bundle.
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { bundle, headline, factCount, crossLinkCount, dossierMd: null, cached: false }
  }
  const anthropic = new Anthropic({ apiKey })

  const userPayload = `Write the dossier for this ${type}. Here is the bundle:\n\n\`\`\`json\n${JSON.stringify(bundle, null, 2)}\n\`\`\``

  const resp = await anthropic.messages.create({
    model: OPUS_MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: SYSTEM_CONTRACT,
        cache_control: { type: 'ephemeral' }, // static prefix — cached across all dossier calls
      },
    ],
    messages: [{ role: 'user', content: userPayload }],
  })

  const dossierMd = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()

  const usage = {
    input_tokens: resp.usage.input_tokens,
    output_tokens: resp.usage.output_tokens,
    cache_read_input_tokens: resp.usage.cache_read_input_tokens ?? 0,
  }

  // Persist to layer-1 cache so the same bundle never re-bills.
  await supabaseService.from('cr_dossier_cache').insert({
    entity_type: type,
    entity_id: id,
    inputs_hash: inputsHash,
    entity_name: bundle.entity.name,
    bundle,
    dossier_md: dossierMd,
    model: OPUS_MODEL,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cache_read_tokens: usage.cache_read_input_tokens,
  })

  return { bundle, headline, factCount, crossLinkCount, dossierMd, cached: false, usage }
}
