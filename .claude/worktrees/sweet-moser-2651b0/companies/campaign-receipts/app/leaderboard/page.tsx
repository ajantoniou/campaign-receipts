// Leaderboard — the unified "Donor Influence" hub (founder 2026-05-30).
// One page, four views, one question: where does donor money show up?
//   Races        — who paid to win the race (PAC → backed/fought)
//   Company money — which companies fund the most politicians
//   Votes that match the money — politicians ranked by how often they vote
//                  WITH their top donor industries (free); the per-vote
//                  evidence is Pro.
//   Who paid the sponsors — bills ranked by donor-industry money behind
//                  the sponsors (free); the full sponsor breakdown is Pro.
//
// FREE vs PRO split (founder lock 2026-05-30): "rankings free, the WHY is
// Pro." Names + totals + rank drive share traffic and stay free. The
// influence EVIDENCE (which bills, which industry, aligned/broke detail;
// the full sponsor×industry money breakdown) is the paywall.
//
// FLIPPED to donor-centric (founder 2026-05-29).
// Headline view: "Follow the money" from the donor end. Big outside-money
// PACs ranked by spend, each showing WHO THEY PAID and who they fought.
//
// Data sources, verified 2026-05-29:
//   - cr_races.top_pacs  -> named PACs, FEC-sourced, support/oppose +
//     named target. This is the strong, clean data (AIPAC/UDP, MAGA KY,
//     314 Action). It IS the donor leaderboard headline.
//   - cr_top_donors -> employer money across politicians we track.
//     Integrity still partial (53/585 pols, is_pac all-false, FEC
//     artifacts like RETIRED/SELF-EMPLOYED). Used ONLY for the secondary
//     "company money" view, with artifacts filtered out.
//   - politician scorecards -> kept on the "By politician" tabs.
//
// Public/free for the rankings (share traffic). CSV/alerts stay Pro.

import Link from 'next/link'
import { supabaseService, type Politician } from '@/lib/supabase'
import SealedBookBand from '@/app/components/SealedBookBand'
import ScorecardBar from '@/app/components/ScorecardBar'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import { ArrowLeft, ArrowRight, Lock, Download } from 'lucide-react'
import { getEntitlement } from '@/lib/entitlement'
import { isFecArtifact } from '@/lib/fec-industry'
import ProGate from '@/app/components/ProGate'
import { ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ---- Views -----------------------------------------------------------

type View = 'pac-money' | 'big-money' | 'company-money' | 'votes' | 'bill-sponsors' | 'by-politician'

const VIEWS: { id: View; label: string }[] = [
  { id: 'pac-money', label: 'Big donors' },
  { id: 'big-money', label: 'Race money' },
  { id: 'votes', label: 'Votes that match the money' },
  { id: 'bill-sponsors', label: 'Who paid the sponsors' },
  { id: 'company-money', label: 'Company money' },
  { id: 'by-politician', label: 'By politician' },
]

// The default headline view is the deep PAC→member money web. 'big-money'
// (the 4-race top_pacs) becomes a secondary "race money" view so the page
// never opens thin.
const DEFAULT_VIEW: View = 'pac-money'

// Free ranking needs a credible sample. "100% — 5 of 5" is still noise
// framed as a headline; raised from 3 to 5 substantive votes (founder
// 2026-05-30) so neither the "bought" nor "independent" board surfaces
// tiny-sample politicians.
const MIN_ALIGNMENT_VOTES = 5

// Politician sub-tabs (kept from the old leaderboard, now nested).
type PolTab = 'most-broken' | 'most-kept' | 'most-corporate-funded' | 'most-grassroots'

const POL_TABS: { id: PolTab; label: string; blurb: string }[] = [
  { id: 'most-broken', label: 'Most broken', blurb: 'The most broken promises we have graded.' },
  { id: 'most-kept', label: 'Most kept', blurb: 'The highest share of promises kept (8 or more graded).' },
  { id: 'most-corporate-funded', label: 'Big-company money', blurb: 'Funded mostly by big companies. Both parties: 61 R and 60 D.' },
  { id: 'most-grassroots', label: 'Small-dollar money', blurb: 'Funded mostly by small gifts from regular people.' },
  // "Most live promises" REMOVED as a global leaderboard tab (founder
  // 2026-05-30): a live-promise tally reads better as a per-race running
  // count on the race landing page (/race/[slug]) than as a global board.
]

const MIN_GRADED = 8

// ---- Donor row shape -------------------------------------------------

type SponsoredCandidate = {
  name: string
  slug: string | null
  hasPage: boolean
  amount: number
  // 'backed' = they paid to help this person; 'fought' = they paid to beat them.
  side: 'backed' | 'fought'
}

type DonorRow = {
  key: string
  name: string
  affiliation: string | null
  blurb: string | null
  total: number
  sponsored: SponsoredCandidate[]
}

// Normalize a committee/PAC display name for fuzzy matching between the
// race top_pacs JSON (human-entered names) and cr_committees (FEC names).
function normPacName(s: string): string {
  return String(s || '')
    .toUpperCase()
    .replace(/\b(POLITICAL ACTION COMMITTEE|PAC|INC|THE|FUND|COMMITTEE)\b/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .trim()
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !n) return '$0'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${Math.round(n).toLocaleString()}`
}

// Pull the named outside-money PACs from cr_races.top_pacs and roll them
// up by PAC name so one donor row can list every candidate they touched.
async function getBigMoney(): Promise<DonorRow[]> {
  const { data: races } = await supabaseService
    .from('cr_races')
    .select('slug, candidates, top_pacs')
    .limit(200)

  // Build a name -> candidate-slug map from race candidates so we can link
  // a PAC's named target to a real politician page when one exists.
  const pols = await supabaseService.from('cr_politicians').select('slug').limit(2000)
  const polSlugs = new Set(((pols.data as { slug: string }[]) || []).map((p) => p.slug))

  // Name-keyed blurb lookup: race top_pacs carry human-entered names, so
  // match them to cr_committees.blurb on a normalized name.
  const { data: blurbCommittees } = await supabaseService
    .from('cr_committees')
    .select('name, blurb')
    .not('blurb', 'is', null)
  const blurbByName = new Map<string, string>()
  for (const c of (blurbCommittees as { name: string; blurb: string }[]) || []) {
    blurbByName.set(normPacName(c.name), c.blurb)
  }

  const nameToSlug = new Map<string, string>()
  for (const r of (races as any[]) || []) {
    for (const c of r.candidates || []) {
      if (c?.name && c?.slug) nameToSlug.set(String(c.name).toLowerCase(), c.slug)
    }
  }

  const byPac = new Map<string, DonorRow>()
  for (const r of (races as any[]) || []) {
    for (const pac of r.top_pacs || []) {
      if (!pac?.name || !pac?.total_usd) continue
      const key = String(pac.name).trim()
      const row =
        byPac.get(key) ||
        ({ key, name: key, affiliation: pac.affiliation ?? null, blurb: blurbByName.get(normPacName(key)) ?? null, total: 0, sponsored: [] } as DonorRow)
      row.total += Number(pac.total_usd) || 0
      const target = String(pac.target_candidate || '').trim()
      const lower = target.toLowerCase()
      const slug = nameToSlug.get(lower) || null
      const side: 'backed' | 'fought' =
        typeof pac.support_oppose === 'string' && pac.support_oppose.startsWith('against') ? 'fought' : 'backed'
      if (target && target.toLowerCase() !== 'multi-race') {
        row.sponsored.push({
          name: target,
          slug,
          hasPage: slug ? polSlugs.has(slug) : false,
          amount: Number(pac.total_usd) || 0,
          side,
        })
      }
      byPac.set(key, row)
    }
  }

  return [...byPac.values()].sort((a, b) => b.total - a.total)
}

// ---- Big donors: the deep PAC→member contributions web ----------------
// cr_pac_contributions holds ~7,900 PAC→politician edges across the 2024
// cycle. We roll them up per committee (joined to cr_committees for the
// human name + industry) and rank by REACH (# distinct members funded)
// then dollars. This is the strong, deep "follow the money" showcase.
//
// Pass-through conduits (ActBlue/WinRed) and party / candidate committees
// are dropped so the ranking shows INTERESTED money — trade, industry,
// ideological PACs — not plumbing. Mirrors weekly-content-build.mjs.

// FEC committee_type codes that are party / candidate committees.
const PARTY_CANDIDATE_TYPES = new Set(['H', 'S', 'X', 'Y', 'P'])
// Known conduit committees (pass-through small-donor platforms).
const CONDUIT_COMMITTEE_IDS = new Set(['C00401224', 'C00694323']) // ActBlue, WinRed
function isConduitName(name: string | null | undefined): boolean {
  return /\b(ACTBLUE|WINRED|DCCC|NRCC|DSCC|NRSC|VICTORY FUND|JOINT FUNDRAIS|NEW DEM(OCRAT)? COALITION)\b/i.test(name || '')
}

type PacRecipient = { name: string; slug: string; party: string; state: string; amount: number }
type PacRow = {
  committee_id: string
  name: string
  industry: string | null
  blurb: string | null
  total: number
  reach: number
  recipients: PacRecipient[]
}

// Paginate the full edge set (PostgREST caps at 1,000 rows/request).
async function fetchAllEdges() {
  const out: any[] = []
  const step = 1000
  for (let from = 0; ; from += step) {
    const { data } = await supabaseService
      .from('cr_pac_contributions')
      .select(
        'committee_id, politician_id, total_amount, cr_committees!inner(name, committee_type, industry_label, connected_org_name, blurb), cr_politicians!inner(name, slug, party, state, bioguide)',
      )
      .gt('total_amount', 0)
      .order('total_amount', { ascending: false })
      .range(from, from + step - 1)
    const batch = (data as any[]) || []
    out.push(...batch)
    if (batch.length < step) break
  }
  return out
}

async function getPacContributions(): Promise<PacRow[]> {
  const edges = await fetchAllEdges()

  // Group by committee. DEDUP funded members on bioguide so a near-duplicate
  // politician row never double-counts a PAC's reach (the AIPAC-Pat-Ryan bug).
  const byCommittee = new Map<
    string,
    { name: string; type: string; industry: string | null; blurb: string | null; connected: string | null; members: Map<string, PacRecipient> }
  >()
  for (const e of edges) {
    const c = e.cr_committees
    const p = e.cr_politicians
    if (!c || !p) continue
    let g = byCommittee.get(e.committee_id)
    if (!g) {
      g = { name: c.name, type: c.committee_type, industry: c.industry_label, blurb: c.blurb ?? null, connected: c.connected_org_name, members: new Map() }
      byCommittee.set(e.committee_id, g)
    }
    const amt = Number(e.total_amount) || 0
    const key = p.bioguide || `slug:${p.slug}`
    const ex = g.members.get(key)
    if (ex) ex.amount += amt
    else g.members.set(key, { name: p.name, slug: p.slug, party: p.party, state: p.state, amount: amt })
  }

  const rows: PacRow[] = []
  for (const [committee_id, g] of byCommittee.entries()) {
    // Drop pass-through conduits and party / candidate committees — they are
    // plumbing, not interested money.
    if (CONDUIT_COMMITTEE_IDS.has(committee_id) || isConduitName(g.name) || isConduitName(g.connected)) continue
    if (PARTY_CANDIDATE_TYPES.has(g.type)) continue
    const recipients = [...g.members.values()].sort((a, b) => b.amount - a.amount)
    const total = recipients.reduce((s, r) => s + r.amount, 0)
    // "Political organizations" is FEC's generic bucket — show no industry tag
    // rather than a meaningless one.
    const industry = g.industry && g.industry !== 'Political organizations' ? g.industry : null
    rows.push({ committee_id, name: cleanPacName(g.name), industry, blurb: g.blurb, total, reach: recipients.length, recipients })
  }

  // Rank by reach first (how many members one PAC funds = the influence web),
  // then dollars. Keep the deepest 50.
  return rows.sort((a, b) => b.reach - a.reach || b.total - a.total).slice(0, 50)
}

// FEC committee names are ALL-CAPS and verbose. Title-case and trim the
// boilerplate so a 3rd-grader can read the row.
function cleanPacName(raw: string): string {
  let s = (raw || '').trim()
  s = s.replace(/\s*\(.*?\)\s*$/, '') // drop a trailing "(...)" acronym
  const title = s
    .toLowerCase()
    // Capitalize the first letter of each word, but NOT a letter that follows
    // an apostrophe (so "america's" stays "America's", not "America'S").
    .replace(/(^|[\s.&/-])([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase())
    .replace(/\bPac\b/g, 'PAC')
    .replace(/\bAt&t\b/gi, 'AT&T')
    .replace(/\bCulac\b/g, 'CULAC')
  return title
}

// Secondary, honest "company money" view from cr_top_donors. We sum each
// employer across every politician we track and count how many they reach.
// FEC artifacts (RETIRED / SELF-EMPLOYED / HOMEMAKER) are dropped.
async function getCompanyMoney(): Promise<DonorRow[]> {
  const { data } = await supabaseService
    .from('cr_top_donors')
    .select('donor_name, total_contributed, industry_label, politician_id')
    .limit(20000)

  const ARTIFACTS = new Set([
    'retired',
    'self',
    'self employed',
    'self-employed',
    'homemaker',
    'not employed',
    'none',
    'information requested',
    'information requested per best efforts',
    'requested',
    'n/a',
  ])

  const polById = new Map<string, { slug: string; name: string }>()
  const polsQ = await supabaseService.from('cr_politicians').select('id, slug, name').limit(2000)
  for (const p of ((polsQ.data as any[]) || [])) polById.set(p.id, { slug: p.slug, name: p.name })

  const map = new Map<string, { total: number; pols: Map<string, number> }>()
  for (const d of (data as any[]) || []) {
    const raw = String(d.donor_name || '').trim()
    if (!raw) continue
    if (ARTIFACTS.has(raw.toLowerCase())) continue
    if (isFecArtifact(d.industry_label)) continue
    const e = map.get(raw) || { total: 0, pols: new Map<string, number>() }
    e.total += Number(d.total_contributed) || 0
    e.pols.set(d.politician_id, (e.pols.get(d.politician_id) || 0) + (Number(d.total_contributed) || 0))
    map.set(raw, e)
  }

  const rows: DonorRow[] = [...map.entries()].map(([name, e]) => {
    const sponsored: SponsoredCandidate[] = [...e.pols.entries()]
      .map(([pid, amt]) => {
        const p = polById.get(pid)
        return p
          ? { name: p.name, slug: p.slug, hasPage: true, amount: amt, side: 'backed' as const }
          : null
      })
      .filter(Boolean)
      .sort((a, b) => (b!.amount - a!.amount)) as SponsoredCandidate[]
    return { key: name, name, affiliation: null, blurb: null, total: e.total, sponsored }
  })

  // Headline = reach AND dollars; drop one-politician rows so the view
  // reads as "money that shows up in many races", not single gifts.
  return rows
    .filter((r) => r.sponsored.length >= 2)
    .sort((a, b) => b.sponsored.length - a.sponsored.length || b.total - a.total)
    .slice(0, 40)
}

// ---- Votes that match the money --------------------------------------
// Rank politicians by how often they vote WITH their top donor industries.
// FREE: the ranking (name, %, votes). PRO: the per-vote evidence rows.

type VoteRankRow = {
  politician_id: string
  name: string
  slug: string
  party: string
  state: string
  photoUrl: string | null
  aligned: number
  broke: number
  total: number
  pct: number // share of scored votes that went WITH the donor industry
}

async function getVoteRanking(): Promise<VoteRankRow[]> {
  const { data: rows } = await supabaseService
    .from('cr_donor_vote_alignment')
    .select('politician_id, alignment_score')
    .limit(20000)

  const byPol = new Map<string, { aligned: number; broke: number; total: number }>()
  for (const r of (rows as { politician_id: string; alignment_score: number }[]) || []) {
    const e = byPol.get(r.politician_id) || { aligned: 0, broke: 0, total: 0 }
    if (r.alignment_score === 1) e.aligned++
    else if (r.alignment_score === -1) e.broke++
    e.total++
    byPol.set(r.politician_id, e)
  }

  const qualified = [...byPol.entries()].filter(([, e]) => e.total >= MIN_ALIGNMENT_VOTES)
  if (qualified.length === 0) return []

  const ids = qualified.map(([id]) => id)
  const { data: pols } = await supabaseService
    .from('cr_politicians')
    .select('id, name, slug, party, state, photo_url')
    .in('id', ids)
  const polById = new Map<string, any>(((pols as any[]) || []).map((p) => [p.id, p]))

  return qualified
    .map(([id, e]) => {
      const p = polById.get(id)
      if (!p) return null
      return {
        politician_id: id,
        name: p.name,
        slug: p.slug,
        party: p.party,
        state: p.state,
        photoUrl: p.photo_url ?? null,
        aligned: e.aligned,
        broke: e.broke,
        total: e.total,
        pct: e.total > 0 ? Math.round((e.aligned / e.total) * 100) : 0,
      } as VoteRankRow
    })
    .filter(Boolean as any as (v: VoteRankRow | null) => v is VoteRankRow)
    .sort((a, b) => b.pct - a.pct || b.total - a.total)
}

// Pro evidence: the per-vote rows for a single politician (which bill,
// which industry, aligned or broke). This is the "WHY" behind the rank.
type VoteEvidenceRow = {
  industry_label: string
  alignment_score: number
  vote: string | null
  industry_position: string | null
  bills: {
    bill_type: string
    bill_number: number
    title: string
    short_title: string | null
    congress_gov_url: string | null
  } | null
}

async function getVoteEvidence(politicianId: string): Promise<VoteEvidenceRow[]> {
  const { data } = await supabaseService
    .from('cr_donor_vote_alignment')
    .select(
      'industry_label, alignment_score, vote, industry_position, bills:cr_bills!inner(bill_type, bill_number, title, short_title, congress_gov_url)',
    )
    .eq('politician_id', politicianId)
    .limit(200)
  return (data || []) as unknown as VoteEvidenceRow[]
}

// ---- Who paid the sponsors -------------------------------------------
// Rank bills by donor-industry money behind sponsor + cosponsors.
// FREE: the ranking (bill, $ total, top industry). PRO: full sponsor
// breakdown lives on the bill page; here Pro = the full industry stack.

type BillRankRow = {
  bill_id: string
  bill_type: string
  bill_number: number
  title: string
  short_title: string | null
  congress: number
  congress_gov_url: string | null
  total: number // sum of REAL-industry money (artifacts removed)
  topIndustry: string | null
  topAmount: number
  // Coalition framing (founder 2026-05-30): the top industry's money split
  // into what the LEAD sponsor took vs what the coalition that voted yes took.
  leadSponsorTotal: number
  coalitionTotal: number
  nCoalition: number
  industries: { label: string; total: number; nSponsors: number }[]
}

async function getBillSponsorRanking(): Promise<BillRankRow[]> {
  const { data: trail } = await supabaseService
    .from('cr_bill_money_trail')
    .select('bill_id, industry_label, total_from_industry, n_sponsors_funded, lead_sponsor_total, coalition_total, n_coalition, rank')
    .limit(20000)

  const byBill = new Map<
    string,
    { total: number; industries: { label: string; total: number; nSponsors: number; lead: number; coalition: number; nCoalition: number }[] }
  >()
  for (const r of (trail as any[]) || []) {
    // Drop FEC bucketing artifacts ("Individual / Retired" etc.) — they
    // swamp the real-industry signal and tank credibility. This is what
    // DEMOTES the catch-all bucket so a NAMED industry leads each row.
    if (isFecArtifact(r.industry_label)) continue
    const amt = Number(r.total_from_industry) || 0
    if (amt <= 0) continue
    const e = byBill.get(r.bill_id) || { total: 0, industries: [] }
    e.total += amt
    e.industries.push({
      label: r.industry_label,
      total: amt,
      nSponsors: Number(r.n_sponsors_funded) || 0,
      lead: Number(r.lead_sponsor_total) || 0,
      coalition: Number(r.coalition_total) || amt,
      nCoalition: Number(r.n_coalition) || 0,
    })
    byBill.set(r.bill_id, e)
  }
  if (byBill.size === 0) return []

  const ids = [...byBill.keys()]
  const { data: bills } = await supabaseService
    .from('cr_bills')
    .select('id, bill_type, bill_number, title, short_title, congress, congress_gov_url')
    .in('id', ids)
  const billById = new Map<string, any>(((bills as any[]) || []).map((b) => [b.id, b]))

  return [...byBill.entries()]
    .map(([billId, e]) => {
      const b = billById.get(billId)
      if (!b) return null
      const industries = e.industries.sort((x, y) => y.total - x.total)
      const top = industries[0]
      return {
        bill_id: billId,
        bill_type: b.bill_type,
        bill_number: b.bill_number,
        title: b.title,
        short_title: b.short_title,
        congress: b.congress,
        congress_gov_url: b.congress_gov_url,
        total: e.total,
        topIndustry: top?.label ?? null,
        topAmount: top?.total ?? 0,
        leadSponsorTotal: top?.lead ?? 0,
        coalitionTotal: top?.coalition ?? 0,
        nCoalition: top?.nCoalition ?? 0,
        industries: industries.map(({ label, total, nSponsors }) => ({ label, total, nSponsors })),
      } as BillRankRow
    })
    .filter(Boolean as any as (v: BillRankRow | null) => v is BillRankRow)
    .sort((a, b) => b.total - a.total)
    .slice(0, 50)
}

function billLabel(b: { bill_type: string; bill_number: number; short_title: string | null; title: string }): string {
  const tag = `${b.bill_type.toUpperCase()} ${b.bill_number}`
  const name = b.short_title || b.title
  return `${tag} · ${name}`
}

// ---- Politician tabs (unchanged logic) -------------------------------

// By-politician view shows only the TOP 5 rows; the rest sits behind the
// $45 Donor Intelligence product (founder 2026-05-30). Pull 5, not 50.
async function getPolRows(tab: PolTab): Promise<Politician[]> {
  let q = supabaseService.from('cr_politicians').select('*').limit(5)
  switch (tab) {
    case 'most-broken':
      q = q.gte('scorecard_broken', 3).order('scorecard_broken', { ascending: false })
      break
    case 'most-kept':
      q = q.gte('scorecard_graded_total', MIN_GRADED).order('scorecard_percentage_kept', { ascending: false, nullsFirst: false })
      break
    case 'most-corporate-funded':
      q = q.eq('donor_profile', 'corporate').gt('scorecard_graded_total', 0).order('scorecard_graded_total', { ascending: false })
      break
    case 'most-grassroots':
      q = q.eq('donor_profile', 'grassroots').gt('scorecard_graded_total', 0).order('scorecard_graded_total', { ascending: false })
      break
  }
  const { data } = await q
  return (data as Politician[]) || []
}

export async function generateMetadata(args: { searchParams: { view?: string; tab?: string } }) {
  const meta = await leaderboardMetadata(args)
  // Canonical = the normalized view/tab URL, so unknown/duplicate params and
  // param ordering all collapse to one indexable URL per board. Default view
  // canonicalizes to the bare /leaderboard.
  const view = (VIEWS.find((v) => v.id === args.searchParams.view)?.id || DEFAULT_VIEW) as View
  let canonical = '/leaderboard'
  if (view === 'by-politician') {
    const tab = (POL_TABS.find((t) => t.id === args.searchParams.tab)?.id || 'most-broken') as PolTab
    canonical = `/leaderboard?view=by-politician&tab=${tab}`
  } else if (view !== DEFAULT_VIEW) {
    canonical = `/leaderboard?view=${view}`
  }
  return { ...meta, alternates: { ...(meta as any).alternates, canonical } }
}

async function leaderboardMetadata({ searchParams }: { searchParams: { view?: string; tab?: string } }) {
  const view = (VIEWS.find((v) => v.id === searchParams.view)?.id || DEFAULT_VIEW) as View
  if (view === 'pac-money') {
    const title = 'Big donors — who pays the most members of Congress'
    const desc =
      'Trade and industry PACs ranked by how many members of Congress they fund — with the exact dollars. FEC receipts on every line.'
    return {
      title: `${title} — CampaignReceipts`,
      description: desc,
      openGraph: { title, description: desc, images: [{ url: `/api/card/donor?view=big-money`, width: 1200, height: 630 }] },
    }
  }
  if (view === 'by-politician') {
    const tab = (POL_TABS.find((t) => t.id === searchParams.tab)?.id || 'most-broken') as PolTab
    const meta = POL_TABS.find((t) => t.id === tab)!
    return {
      title: `${meta.label} — CampaignReceipts leaderboard`,
      description: meta.blurb,
      openGraph: { images: [{ url: `/leaderboard/opengraph-image?view=by-politician&tab=${tab}` }] },
    }
  }
  if (view === 'votes') {
    const title = 'Votes that match the money'
    const desc = 'Politicians ranked by how often they vote WITH their top donor industries. FEC + roll-call receipts.'
    return {
      title: `${title} — CampaignReceipts`,
      description: desc,
      openGraph: { title, description: desc, images: [{ url: `/api/card/votes`, width: 1200, height: 630 }] },
    }
  }
  if (view === 'bill-sponsors') {
    const title = 'Who paid the sponsors'
    const desc = 'Bills ranked by the donor-industry money behind the people who sponsored them. FEC receipts on every line.'
    return {
      title: `${title} — CampaignReceipts`,
      description: desc,
      openGraph: { title, description: desc, images: [{ url: `/api/card/bill-sponsors`, width: 1200, height: 630 }] },
    }
  }
  const title = view === 'big-money' ? 'Who paid to win these races' : 'Which companies fund the most politicians'
  const desc =
    view === 'big-money'
      ? 'Big outside money ranked by spend — and the exact candidates each group paid to back or beat. FEC receipts on every line.'
      : 'Company money across the politicians we track — who shows up in the most campaigns.'
  return {
    title: `${title} — CampaignReceipts`,
    description: desc,
    openGraph: { title, description: desc, images: [{ url: `/api/card/donor?view=${view}`, width: 1200, height: 630 }] },
  }
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { view?: string; tab?: string }
}) {
  const view = (VIEWS.find((v) => v.id === searchParams.view)?.id || DEFAULT_VIEW) as View
  const ent = await getEntitlement()
  const isPro = ent.tier === 'pro'

  // BIG DONORS — the deep PAC→member money web (default headline) ---------
  if (view === 'pac-money') {
    const rows = await getPacContributions()
    return (
      <>
        <section className="border-b border-ink-800/60">
          <div className="section-shell pt-12 pb-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
              <ArrowLeft className="size-3.5" />
              Back to home
            </Link>
            <div className="eyebrow mb-2">Follow the money</div>
            <h1 className="text-display-md text-ink-50">Big donors — who they pay in Congress</h1>
            <p className="mt-3 text-ink-400 text-[15px] max-w-2xl leading-relaxed">
              These are the big donor groups — trade and industry PACs. We add up who they
              pay in Congress. The more members one group pays, the higher it ranks.
            </p>

            <ViewSwitcher view={view} />

            <CsvCta ent={ent} view={view} />
          </div>
        </section>

        <article className="section-shell py-8">
          <ol className="grid gap-3">
            {rows.map((r, idx) => (
              <li key={r.committee_id}>
                <PacCard row={r} idx={idx} />
              </li>
            ))}
          </ol>

          {rows.length === 0 && (
            <EmptyState>No donor money on record yet.</EmptyState>
          )}

          <p className="mt-6 text-xs text-ink-500 leading-relaxed max-w-2xl">
            Source: FEC. We add up each PAC&apos;s gifts to every member of Congress in the 2024
            cycle. Pass-through groups (ActBlue, WinRed) and party committees are left out — they
            are plumbing, not interested money.{' '}
            <Link href="/methodology" className="text-broken underline-offset-4 hover:underline">
              See how we count
            </Link>
          </p>
        </article>

        <SealedBookBand placement="leaderboard" />
      </>
    )
  }

  // VOTES THAT MATCH THE MONEY -----------------------------------------
  if (view === 'votes') {
    const rows = await getVoteRanking()
    // Two honest lenses on the SAME data + SAME ≥3-vote gate:
    //   "bought"      — high % first: votes the money's way (the indictment)
    //   "independent" — low % first: votes against the money (the credit)
    // Default is "bought" (the viral exposé). The toggle just flips the sort.
    const lens: 'bought' | 'independent' =
      searchParams.tab === 'independent' ? 'independent' : 'bought'
    const ranked =
      lens === 'independent'
        ? [...rows].sort((a, b) => a.pct - b.pct || b.total - a.total)
        : rows // already sorted high→low by getVoteRanking
    // For the Pro evidence block we open up the #1-ranked politician's
    // per-vote receipts. Free users see it locked.
    const lead = ranked[0] || null
    const evidence = lead && isPro ? await getVoteEvidence(lead.politician_id) : []

    return (
      <>
        <section className="border-b border-ink-800/60">
          <div className="section-shell pt-12 pb-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
              <ArrowLeft className="size-3.5" />
              Back to home
            </Link>
            <div className="eyebrow mb-2">Donor influence</div>
            <h1 className="text-display-md text-ink-50">Votes that match the money</h1>
            <p className="mt-3 text-ink-400 text-[15px] max-w-2xl leading-relaxed">
              How often does a politician vote the way their biggest donors want? We line up
              each vote with the donor industry behind them.{' '}
              <span className="text-broken-400 font-semibold">A high score is bad</span> — it
              means most votes went the money&apos;s way.{' '}
              <span className="text-kept-400 font-semibold">A low score is good</span> — they
              voted against the people who fund them.
            </p>

            <ViewSwitcher view={view} />

            <VoteLensSwitcher lens={lens} />
          </div>
        </section>

        <article className="section-shell py-8 max-w-3xl">
          {ranked.length === 0 ? (
            <EmptyState>No vote-money matches scored yet.</EmptyState>
          ) : (
            <>
              <div className="mb-4 text-sm text-ink-300">
                {lens === 'independent' ? (
                  <>
                    <span className="font-semibold text-kept-400">Most independent.</span>{' '}
                    These politicians voted against the money the most. Lowest score first.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-broken-400">Most bought.</span>{' '}
                    These politicians voted the money&apos;s way the most. Highest score first.
                  </>
                )}
              </div>

              <ol className="grid gap-3">
                {ranked.map((r, idx) => (
                  <li key={r.politician_id}>
                    <Link
                      href={`/politician/${r.slug}/correlations`}
                      className="group flex items-center gap-3 sm:gap-4 rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 hover:bg-ink-900/70 hover:ring-ink-700 hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4"
                    >
                      <span className="text-xs font-mono text-ink-600 w-8 tabular-nums text-center shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <PoliticianAvatar name={r.name} party={r.party} photoUrl={r.photoUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-ink-50 truncate">{r.name}</span>
                          <span className="text-[10px] font-mono uppercase text-ink-500">
                            {r.party[0]} · {r.state}
                          </span>
                        </div>
                        <div className="mt-1 text-[12px] text-ink-400">
                          {lens === 'independent'
                            ? `Voted against the money ${r.broke} of ${r.total} times`
                            : `Voted the money's way ${r.aligned} of ${r.total} times`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-2xl font-bold tabular-nums tracking-tight ${
                            r.pct >= 70 ? 'text-broken-500' : r.pct >= 40 ? 'text-partial-500' : 'text-kept-500'
                          }`}
                        >
                          {r.pct}%
                        </div>
                        <div className="text-[10px] text-ink-500 mt-0.5">voted with the money</div>
                      </div>
                      <ArrowRight className="size-4 text-ink-700 group-hover:text-broken transition-colors shrink-0 hidden sm:block" />
                    </Link>
                  </li>
                ))}
              </ol>

              {/* The WHY — Pro evidence on the #1 row */}
              {lead && (
                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-3">
                    See the why — {lead.name}
                  </div>
                  {isPro ? (
                    <VoteEvidenceList rows={evidence} />
                  ) : (
                    <>
                      <FadedEvidencePreview />
                      <ProGate
                        headline={`Unlock every vote behind the ranking — which bill, which industry, voted with or broke from the money. ${rows.length} politicians scored.`}
                        ctaLabel="See the why →"
                      />
                    </>
                  )}
                </div>
              )}
            </>
          )}

          <p className="mt-6 text-xs text-ink-500 leading-relaxed max-w-2xl">
            We only rank a politician with {MIN_ALIGNMENT_VOTES} or more scored votes. We line up
            each House roll-call with the donor industries that fund them. A high score means most
            votes went the money&apos;s way (bought). A low score means they voted against the money
            (independent). Same votes, two ways to read them.{' '}
            <Link href="/methodology" className="text-broken underline-offset-4 hover:underline">
              See how we count
            </Link>
          </p>
        </article>

        <SealedBookBand placement="leaderboard" />
      </>
    )
  }

  // WHO PAID THE SPONSORS ----------------------------------------------
  if (view === 'bill-sponsors') {
    const rows = await getBillSponsorRanking()
    const lead = rows[0] || null

    return (
      <>
        <section className="border-b border-ink-800/60">
          <div className="section-shell pt-12 pb-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
              <ArrowLeft className="size-3.5" />
              Back to home
            </Link>
            <div className="eyebrow mb-2">Donor influence</div>
            <h1 className="text-display-md text-ink-50">Who paid the sponsors</h1>
            <p className="mt-3 text-ink-400 text-[15px] max-w-2xl leading-relaxed">
              Every bill has people who put their name on it. We add up the donor money behind
              those people. Bigger number means more industry money sits behind the bill.
            </p>

            <ViewSwitcher view={view} />
          </div>
        </section>

        <article className="section-shell py-8 max-w-3xl">
          {rows.length === 0 ? (
            <EmptyState>No sponsor money scored yet.</EmptyState>
          ) : (
            <>
              <ol className="grid gap-3">
                {rows.map((r, idx) => (
                  <li key={r.bill_id}>
                    <Link
                      href={`/bill/${r.congress}/${r.bill_type}${r.bill_number}`}
                      className="group flex items-start gap-3 sm:gap-4 rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 hover:bg-ink-900/70 hover:ring-ink-700 hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4"
                    >
                      <span className="text-xs font-mono text-ink-600 w-8 tabular-nums text-center shrink-0 pt-1">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        {/* Lead with the NAMED industry (founder 2026-05-30):
                            the FEC "Individual / Retired" catch-all is already
                            demoted out via isFecArtifact, so topIndustry is a
                            real industry. */}
                        {r.topIndustry && (
                          <div className="text-[10px] font-mono uppercase tracking-wider text-broken mb-1">
                            {r.topIndustry}
                          </div>
                        )}
                        <div className="text-sm font-semibold text-ink-50 line-clamp-2">
                          {r.short_title || r.title}
                        </div>
                        <div className="mt-1 text-[11px] font-mono uppercase text-ink-500">
                          {r.bill_type.toUpperCase()} {r.bill_number}
                        </div>
                        {/* Coalition framing: lead sponsor took $X, the N who
                            voted yes took $Y. */}
                        {r.nCoalition > 0 && r.coalitionTotal > 0 && (
                          <div className="mt-1.5 text-[12px] text-ink-400 leading-snug">
                            Lead sponsor took{' '}
                            <span className="font-mono text-broken-400">{fmtMoney(r.leadSponsorTotal)}</span>; the{' '}
                            {r.nCoalition} who voted yes took{' '}
                            <span className="font-mono text-broken-400">{fmtMoney(r.coalitionTotal)}</span>
                            {r.topIndustry ? ` from ${r.topIndustry}.` : '.'}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold tabular-nums text-broken tracking-tight">{fmtMoney(r.total)}</div>
                        <div className="text-[10px] text-ink-500 mt-0.5">behind the sponsors</div>
                      </div>
                      <ArrowRight className="size-4 text-ink-700 group-hover:text-broken transition-colors shrink-0 hidden sm:block" />
                    </Link>
                  </li>
                ))}
              </ol>

              {/* The WHY — Pro full industry breakdown on the #1 bill */}
              {lead && (
                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-3">
                    See the why — {billLabel(lead)}
                  </div>
                  {isPro ? (
                    <IndustryBreakdownList row={lead} />
                  ) : (
                    <>
                      <FadedEvidencePreview />
                      <ProGate
                        headline={`Unlock the full money trail behind every bill — each industry, each dollar, how many sponsors it funded. ${rows.length} bills ranked.`}
                        ctaLabel="See the why →"
                      />
                    </>
                  )}
                </div>
              )}
            </>
          )}

          <p className="mt-6 text-xs text-ink-500 leading-relaxed max-w-2xl">
            Source: FEC. We add up donor industries across the sponsor and co-sponsors of each
            bill. Generic FEC buckets (Retired, Self-employed) are left out — they are not real
            industries.{' '}
            <Link href="/methodology" className="text-broken underline-offset-4 hover:underline">
              See how we count
            </Link>
          </p>
        </article>

        <SealedBookBand placement="leaderboard" />
      </>
    )
  }

  // Donor views (headline)
  if (view === 'big-money' || view === 'company-money') {
    const rows = view === 'big-money' ? await getBigMoney() : await getCompanyMoney()
    const isBig = view === 'big-money'

    const h1 = isBig ? 'Who paid to win these races' : 'Which companies fund the most politicians'
    const what = isBig
      ? 'Big outside money — the kind a candidate never touches. We show who they paid, and who they paid to beat.'
      : 'Company money across the politicians we track. Bigger reach means the name shows up in more campaigns.'

    return (
      <>
        <section className="border-b border-ink-800/60">
          <div className="section-shell pt-12 pb-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
              <ArrowLeft className="size-3.5" />
              Back to home
            </Link>
            <div className="eyebrow mb-2">Follow the money</div>
            <h1 className="text-display-md text-ink-50">{h1}</h1>
            <p className="mt-3 text-ink-400 text-[15px] max-w-2xl leading-relaxed">{what}</p>

            <ViewSwitcher view={view} />

            <CsvCta ent={ent} view={view} />
          </div>
        </section>

        <article className="section-shell py-8">
          <ol className="grid gap-3">
            {rows.map((r, idx) => (
              <li key={r.key}>
                <DonorCard row={r} idx={idx} big={isBig} />
              </li>
            ))}
          </ol>

          {rows.length === 0 && (
            <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-12 text-center text-sm text-ink-500">
              No money on record for this view yet.
            </div>
          )}

          <p className="mt-6 text-xs text-ink-500 leading-relaxed max-w-2xl">
            {isBig
              ? 'Source: FEC filings, listed on each race page. "Backed" means they paid to help that person win. "Fought" means they paid to beat them.'
              : 'Source: FEC. We add up each company across every politician we track. Generic FEC buckets (Retired, Self-employed, Homemaker) are left out — they are not real donors.'}{' '}
            <Link href="/methodology" className="text-broken underline-offset-4 hover:underline">
              See how we count
            </Link>
          </p>
        </article>

        <SealedBookBand placement="leaderboard" />
      </>
    )
  }

  // By-politician view (legacy tabs)
  const tab = (POL_TABS.find((t) => t.id === searchParams.tab)?.id || 'most-broken') as PolTab
  const active = POL_TABS.find((t) => t.id === tab)!
  const rows = await getPolRows(tab)

  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-12 pb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
          <div className="eyebrow mb-2">Leaderboards</div>
          <h1 className="text-display-md text-ink-50">{active.label}</h1>
          <p className="mt-3 text-ink-400 text-[15px] max-w-2xl">{active.blurb}</p>

          <ViewSwitcher view={view} />

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            {POL_TABS.map((t) => {
              const isActive = t.id === tab
              return (
                <Link
                  key={t.id}
                  href={`/leaderboard?view=by-politician&tab=${t.id}`}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    isActive ? 'bg-ink-800 text-ink-100 ring-1 ring-ink-700' : 'text-ink-400 hover:text-ink-200 hover:bg-ink-900/60'
                  }`}
                >
                  {t.label}
                </Link>
              )
            })}
          </div>

          <CsvCta ent={ent} view={view} tab={tab} />
        </div>
      </section>

      <article className="section-shell py-8">
        <ol className="grid gap-3">
          {rows.map((p, idx) => (
            <li key={p.id}>
              <Link
                href={`/politician/${p.slug}`}
                className="group flex items-center gap-3 sm:gap-4 rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 hover:bg-ink-900/70 hover:ring-ink-700 hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4"
              >
                <span className="text-xs font-mono text-ink-600 w-8 tabular-nums text-center shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <PoliticianAvatar name={p.name} party={p.party} photoUrl={p.photo_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink-50 truncate">{p.name}</span>
                    <span className="text-[10px] font-mono uppercase text-ink-500">
                      {p.party[0]} · {p.state} · {p.branch}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ScorecardBar
                      kept={p.scorecard_kept}
                      partial={p.scorecard_partial}
                      broken={p.scorecard_broken}
                      youDecide={p.scorecard_you_decide}
                      total={p.scorecard_graded_total || p.scorecard_total}
                      size="sm"
                    />
                  </div>
                </div>
                <ArrowRight className="size-4 text-ink-700 group-hover:text-broken transition-colors shrink-0 hidden sm:block" />
              </Link>
            </li>
          ))}
        </ol>

        {rows.length === 0 && (
          <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-12 text-center text-sm text-ink-500">
            No politicians match this leaderboard yet.
          </div>
        )}

        {/* Only the top 5 show here. The full ranking is behind the $45
            Donor Intelligence product (founder 2026-05-30). */}
        {rows.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href="/investigate"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-500 hover:text-broken transition-colors"
            >
              <Lock className="size-3" />
              Powered by Donor Intelligence AI Platform
              <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </article>

      <SealedBookBand placement="leaderboard" />
    </>
  )
}

// ---- Small components -------------------------------------------------

function ViewSwitcher({ view }: { view: View }) {
  return (
    <div className="mt-6 inline-flex rounded-lg ring-1 ring-ink-800 bg-ink-900/50 p-1 text-sm">
      {VIEWS.map((v) => {
        const isActive = v.id === view
        const href = v.id === 'by-politician' ? '/leaderboard?view=by-politician&tab=most-broken' : `/leaderboard?view=${v.id}`
        return (
          <Link
            key={v.id}
            href={href}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              isActive ? 'bg-broken/10 text-broken ring-1 ring-broken/30' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {v.label}
          </Link>
        )
      })}
    </div>
  )
}

// Two honest lenses on the Votes view. Same ≥3-vote gate, same data —
// only the sort flips. Labels spell out high = bought, low = independent
// so a reader can never mistake a high score for a good thing.
function VoteLensSwitcher({ lens }: { lens: 'bought' | 'independent' }) {
  const tabs: { id: 'bought' | 'independent'; label: string; sub: string }[] = [
    { id: 'bought', label: 'Most bought', sub: 'high score' },
    { id: 'independent', label: 'Most independent', sub: 'low score' },
  ]
  return (
    <div className="mt-4 inline-flex rounded-lg ring-1 ring-ink-800 bg-ink-900/50 p-1 text-sm">
      {tabs.map((t) => {
        const isActive = t.id === lens
        const href = t.id === 'bought' ? '/leaderboard?view=votes' : '/leaderboard?view=votes&tab=independent'
        return (
          <Link
            key={t.id}
            href={href}
            className={`px-3.5 py-1.5 rounded-md transition-colors flex items-baseline gap-1.5 ${
              isActive ? 'bg-broken/10 text-broken ring-1 ring-broken/30' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {t.label}
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500">{t.sub}</span>
          </Link>
        )
      })}
    </div>
  )
}

function CsvCta({ ent, view, tab }: { ent: { tier: string }; view: View; tab?: PolTab }) {
  const exportHref =
    view === 'by-politician' ? `/leaderboard/export?tab=${tab}` : `/leaderboard/export?view=${view}`
  return (
    <div className="mt-5 flex items-center gap-2">
      {ent.tier === 'pro' ? (
        <a href={exportHref} className="btn-ghost text-xs inline-flex items-center gap-1.5">
          <Download className="size-3.5" />
          Export CSV
        </a>
      ) : (
        <Link
          href="/pricing"
          className="text-[11px] font-mono uppercase tracking-wider text-ink-500 hover:text-broken inline-flex items-center gap-1"
        >
          <Lock className="size-3" />
CSV + alerts with Donor Intelligence
        </Link>
      )}
    </div>
  )
}

function EmptyState({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-12 text-center text-sm text-ink-500">
      {children}
    </div>
  )
}

// Pro: the per-vote receipts behind a politician's "matched the money" rank.
function VoteEvidenceList({ rows }: { rows: VoteEvidenceRow[] }) {
  if (rows.length === 0) {
    return <EmptyState>No vote receipts on file yet.</EmptyState>
  }
  return (
    <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-400 mb-3">
        Every vote · Donor Intelligence
      </div>
      <ul className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
        {rows.map((v, i) => {
          const aligned = v.alignment_score === 1
          return (
            <li key={i} className="flex items-start gap-3">
              <span className={`text-[10px] font-mono shrink-0 mt-0.5 ${aligned ? 'text-broken-400' : 'text-kept-400'}`}>
                {aligned ? 'WITH' : 'BROKE'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-ink-200 truncate">
                  {v.bills ? `${v.bills.bill_type.toUpperCase()} ${v.bills.bill_number} · ${v.bills.short_title || v.bills.title}` : 'Bill'}
                </div>
                <div className="text-[10px] font-mono text-ink-600 mt-0.5">
                  {v.industry_label} · {v.industry_position} · voted {v.vote}
                </div>
              </div>
              {v.bills?.congress_gov_url && (
                <a href={v.bills.congress_gov_url} target="_blank" rel="noreferrer" className="text-ink-600 hover:text-ink-300 shrink-0" aria-label="View on Congress.gov">
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Pro: the full industry money stack behind a bill's sponsors.
function IndustryBreakdownList({ row }: { row: BillRankRow }) {
  const max = Math.max(...row.industries.map((i) => i.total), 1)
  return (
    <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-400 mb-3">
        Full money trail · Donor Intelligence
      </div>
      <ul className="space-y-3">
        {row.industries.map((ind, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-36 text-xs text-ink-300 truncate shrink-0">{ind.label}</div>
            <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
              <div className="h-full bg-broken/70" style={{ width: `${(ind.total / max) * 100}%` }} />
            </div>
            <div className="w-20 text-right text-xs font-mono tabular-nums text-ink-300 shrink-0">{fmtMoney(ind.total)}</div>
          </li>
        ))}
      </ul>
      <Link
        href={`/bill/${row.congress}/${row.bill_type}${row.bill_number}`}
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-authority-300 hover:text-authority-200"
      >
        Open the full bill page <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

// Free: a blurred teaser of the evidence so the lock has something to hide.
function FadedEvidencePreview() {
  return (
    <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5 mb-3 opacity-30 blur-[2px] pointer-events-none select-none" aria-hidden>
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-200">HR 0000 · A bill that the money cared about</span>
            <span className="text-xs font-mono text-ink-400">$000K</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Big-donors card: one PAC, its total, its reach, and the members it pays.
// Each named member links to their real politician page. The "see the full
// web" line is the $45 software upsell (the deep connections live there).
function PacCard({ row, idx }: { row: PacRow; idx: number }) {
  const shown = row.recipients.slice(0, 4)
  const more = row.recipients.length - shown.length
  return (
    <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="text-xs font-mono text-ink-600 w-8 tabular-nums text-center shrink-0 pt-1">
          {String(idx + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-ink-50">{row.name}</span>
            {row.industry && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500">{row.industry}</span>
            )}
          </div>
          <div className="mt-1 text-[12px] text-ink-400">
            Pays {row.reach} {row.reach === 1 ? 'member of Congress' : 'members of Congress'}
          </div>
          {row.blurb && (
            <p className="mt-1.5 text-[12px] leading-snug text-ink-500">{row.blurb}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold tabular-nums text-broken tracking-tight">{fmtMoney(row.total)}</div>
          <div className="text-[10px] text-ink-500 mt-0.5">total given</div>
        </div>
      </div>

      {shown.length > 0 && (
        <ul className="mt-4 ml-11 grid gap-1.5">
          {shown.map((s, i) => (
            <li key={`${s.slug}-${i}`}>
              <Link
                href={`/politician/${s.slug}`}
                className="flex rounded-lg ring-1 ring-ink-800/60 bg-ink-950/40 hover:bg-ink-900/70 hover:ring-ink-700 px-3 py-2 transition-colors"
              >
                <span className="flex items-center justify-between gap-3 w-full">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 ring-1 text-kept ring-kept/30 bg-kept/10">
                      paid
                    </span>
                    <span className="text-sm text-ink-200 truncate">{s.name}</span>
                    <span className="text-[10px] font-mono uppercase text-ink-500 shrink-0">
                      {s.party?.[0]} · {s.state}
                    </span>
                  </span>
                  <span className="text-xs font-mono tabular-nums text-ink-400 shrink-0">{fmtMoney(s.amount)}</span>
                </span>
              </Link>
            </li>
          ))}
          {more > 0 && (
            <li>
              <Link
                href="/investigate"
                className="inline-flex items-center gap-1 text-[11px] text-broken hover:underline underline-offset-4 ml-1"
              >
                + {more} more — see the full money web
                <ArrowRight className="size-3" />
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function DonorCard({ row, idx, big }: { row: DonorRow; idx: number; big: boolean }) {
  const shown = row.sponsored.slice(0, 4)
  const more = row.sponsored.length - shown.length
  return (
    <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="text-xs font-mono text-ink-600 w-8 tabular-nums text-center shrink-0 pt-1">
          {String(idx + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-ink-50">{row.name}</span>
            {row.affiliation && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500">{row.affiliation}</span>
            )}
          </div>
          <div className="mt-1 text-[12px] text-ink-400">
            {big
              ? `Paid ${row.sponsored.length} ${row.sponsored.length === 1 ? 'candidate' : 'candidates'}`
              : `Shows up for ${row.sponsored.length} politicians`}
          </div>
          {row.blurb && (
            <p className="mt-1.5 text-[12px] leading-snug text-ink-500">{row.blurb}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold tabular-nums text-broken tracking-tight">{fmtMoney(row.total)}</div>
          <div className="text-[10px] text-ink-500 mt-0.5">total spend</div>
        </div>
      </div>

      {shown.length > 0 && (
        <ul className="mt-4 ml-11 grid gap-1.5">
          {shown.map((s, i) => {
            const tone =
              s.side === 'fought'
                ? 'text-broken ring-broken/30 bg-broken/10'
                : 'text-kept ring-kept/30 bg-kept/10'
            const inner = (
              <span className="flex items-center justify-between gap-3 w-full">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`text-[9px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 ring-1 ${tone}`}>
                    {s.side === 'fought' ? 'fought' : 'backed'}
                  </span>
                  <span className="text-sm text-ink-200 truncate">{s.name}</span>
                </span>
                <span className="text-xs font-mono tabular-nums text-ink-400 shrink-0">{fmtMoney(s.amount)}</span>
              </span>
            )
            return (
              <li key={`${s.name}-${i}`}>
                {s.hasPage && s.slug ? (
                  <Link
                    href={`/politician/${s.slug}`}
                    className="flex rounded-lg ring-1 ring-ink-800/60 bg-ink-950/40 hover:bg-ink-900/70 hover:ring-ink-700 px-3 py-2 transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex rounded-lg ring-1 ring-ink-800/60 bg-ink-950/40 px-3 py-2">{inner}</div>
                )}
              </li>
            )
          })}
          {more > 0 && <li className="text-[11px] text-ink-500 ml-1">+ {more} more</li>}
        </ul>
      )}
    </div>
  )
}
