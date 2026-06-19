// Homepage — rev-8 declutter + evidence-is-the-chart rewrite.
// Panel: web-ux-director + conversion + brand designer (founder lock
// 2026-05-31). Goals: ONE primary hero action, fixed overlapping hero
// boxes, compact side-by-side toppers+articles, Trump mega-donors,
// foreign-influence mini-section, redesigned active races (one hero
// race + smaller boxes), and the "Price of Influence 1980-2026"
// centerpiece chart. Dossiers moved to the bottom. No fabricated
// numbers — every figure is sourced or honestly empty.
//
// Sections, top to bottom:
//   1. Live activity ticker
//   2. Find-your-reps opening plate
//   3. Hero — animated Congress video + ONE headline + ONE CTA
//   4. Leaderboard toppers + latest articles (side by side)
//   5. Trump × Adelson power asset + Trump mega-donors
//   6. Active campaign races (one hero race + smaller boxes)
//   7. THE PRICE OF INFLUENCE 1980-2026 chart (centerpiece)
//   8. Foreign influence mini-section
//   9. Value ladder (free → $12 → $45)
//  10. Find-your-reps newsletter capture
//  11. Open dossiers (moved to bottom)
//  12. SEALED book promo

import { supabaseService, type Politician } from '@/lib/supabase'
import Link from 'next/link'
import FindYourReps from './components/FindYourReps'
import CharacterCard from './components/CharacterCard'
import LiveActivityStrip from './components/LiveActivityStrip'
import InfluenceChart from './components/InfluenceChart'
import NewsletterCapture from './components/NewsletterCapture'
import { getAnchorCard } from '@/lib/anchor-cards'
import { isFecArtifact } from '@/lib/fec-industry'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPoliticians(): Promise<Politician[]> {
  const { data, error } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .order('scorecard_graded_total', { ascending: false })
    .order('scorecard_percentage_kept', { ascending: false, nullsFirst: false })
  if (error) {
    console.error('Failed to load politicians:', error)
    return []
  }
  return (data as Politician[]) || []
}

export type Punchline = {
  topIndustry: string | null
  shockingIndustry: string | null
  shockingAligned: number | null
  shockingTotal: number | null
  shockingPct: number | null
}

async function getPunchlines(): Promise<Map<string, Punchline>> {
  const [{ data: industries }, { data: alignments }] = await Promise.all([
    supabaseService
      .from('cr_industry_breakdown')
      .select('politician_id, industry_label, rank')
      .lte('rank', 5)
      .order('rank', { ascending: true }),
    supabaseService
      .from('cr_donor_vote_alignment')
      .select('politician_id, industry_label, alignment_score'),
  ])

  const map = new Map<string, Punchline>()

  for (const row of (industries as any[]) || []) {
    if (isFecArtifact(row.industry_label)) continue
    const existing = map.get(row.politician_id)
    if (existing && existing.topIndustry) continue
    map.set(row.politician_id, {
      topIndustry: row.industry_label,
      shockingIndustry: existing?.shockingIndustry ?? null,
      shockingAligned: existing?.shockingAligned ?? null,
      shockingTotal: existing?.shockingTotal ?? null,
      shockingPct: existing?.shockingPct ?? null,
    })
  }

  const agg = new Map<string, { aligned: number; total: number }>()
  for (const row of (alignments as any[]) || []) {
    if (isFecArtifact(row.industry_label)) continue
    const key = `${row.politician_id}::${row.industry_label}`
    if (!agg.has(key)) agg.set(key, { aligned: 0, total: 0 })
    const v = agg.get(key)!
    v.total++
    if (row.alignment_score === 1) v.aligned++
  }

  const bestByPol = new Map<string, { industry: string; aligned: number; total: number; pct: number }>()
  for (const [key, v] of agg) {
    if (v.total < 5) continue
    const pct = (100 * v.aligned) / v.total
    if (pct > 20 && pct < 80) continue
    const [politicianId, industry] = key.split('::')
    const extremity = Math.abs(pct - 50)
    const cur = bestByPol.get(politicianId)
    if (!cur || extremity > Math.abs(cur.pct - 50)) {
      bestByPol.set(politicianId, { industry, aligned: v.aligned, total: v.total, pct })
    }
  }

  for (const [politicianId, s] of bestByPol) {
    const existing = map.get(politicianId) || {
      topIndustry: null, shockingIndustry: null, shockingAligned: null, shockingTotal: null, shockingPct: null,
    }
    existing.shockingIndustry = s.industry
    existing.shockingAligned = s.aligned
    existing.shockingTotal = s.total
    existing.shockingPct = s.pct
    map.set(politicianId, existing)
  }

  return map
}

/** Top-3 most-recently-published articles for the homepage right column. */
async function getTopArticles(): Promise<
  { slug: string; title: string; dek: string | null; kind: string; published_at: string | null }[]
> {
  const { data } = await supabaseService
    .from('cr_articles')
    .select('slug, title, dek, kind, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(3)
  return (data as any[]) || []
}

type LeaderboardTopper = {
  category: string
  href: string
  primary: string
  meta: string
  value: string
}

async function getLeaderboardToppers(): Promise<LeaderboardTopper[]> {
  const [pacEdges, alignments, billTrail] = await Promise.all([
    supabaseService
      .from('cr_pac_contributions')
      .select('committee_id, politician_id, total_amount, cr_committees!inner(name, committee_type, connected_org_name)')
      .gt('total_amount', 0)
      .limit(20000),
    supabaseService
      .from('cr_donor_vote_alignment')
      .select('politician_id, alignment_score')
      .limit(20000),
    supabaseService
      .from('cr_bill_money_trail')
      .select('bill_id, industry_label, total_from_industry, lead_sponsor_total, coalition_total, n_coalition')
      .limit(20000),
  ])

  const toppers: LeaderboardTopper[] = []

  const PARTY_CANDIDATE_TYPES = new Set(['H', 'S', 'X', 'Y', 'P'])
  const CONDUIT_IDS = new Set(['C00401224', 'C00694323'])
  const isConduit = (n: string | null | undefined) =>
    /\b(ACTBLUE|WINRED|DCCC|NRCC|DSCC|NRSC|VICTORY FUND|JOINT FUNDRAIS|NEW DEM)\b/i.test(n || '')
  const byCommittee = new Map<string, { name: string; type: string; connected: string | null; members: Set<string>; total: number }>()
  for (const e of (pacEdges.data as any[]) || []) {
    const c = e.cr_committees
    if (!c) continue
    let g = byCommittee.get(e.committee_id)
    if (!g) {
      g = { name: c.name, type: c.committee_type, connected: c.connected_org_name, members: new Set(), total: 0 }
      byCommittee.set(e.committee_id, g)
    }
    g.members.add(e.politician_id)
    g.total += Number(e.total_amount) || 0
  }
  let topPac: { name: string; reach: number; total: number } | null = null
  for (const [id, g] of byCommittee) {
    if (CONDUIT_IDS.has(id) || isConduit(g.name) || isConduit(g.connected)) continue
    if (PARTY_CANDIDATE_TYPES.has(g.type)) continue
    const reach = g.members.size
    if (!topPac || reach > topPac.reach || (reach === topPac.reach && g.total > topPac.total)) {
      const name = g.name
        .toLowerCase()
        .replace(/(^|[\s.&/-])([a-z])/g, (_m: string, sep: string, ch: string) => sep + ch.toUpperCase())
        .replace(/\bPac\b/g, 'PAC')
      topPac = { name, reach, total: g.total }
    }
  }
  if (topPac) {
    toppers.push({
      category: 'Big donors',
      href: '/leaderboard?view=pac-money',
      primary: topPac.name,
      meta: `Pays ${topPac.reach} members of Congress`,
      value: topPac.total >= 1_000_000 ? `$${(topPac.total / 1_000_000).toFixed(1)}M` : `$${Math.round(topPac.total / 1_000).toLocaleString()}K`,
    })
  }

  const byPol = new Map<string, { aligned: number; total: number }>()
  for (const r of (alignments.data as any[]) || []) {
    const e = byPol.get(r.politician_id) || { aligned: 0, total: 0 }
    if (r.alignment_score === 1) e.aligned++
    e.total++
    byPol.set(r.politician_id, e)
  }
  const qualified = [...byPol.entries()]
    .filter(([, e]) => e.total >= 5)
    .map(([id, e]) => ({ id, pct: Math.round((e.aligned / e.total) * 100), total: e.total }))
    .sort((a, b) => b.pct - a.pct || b.total - a.total)
  const topVote = qualified[0]
  if (topVote) {
    const { data: pol } = await supabaseService
      .from('cr_politicians')
      .select('name, slug, party, state')
      .eq('id', topVote.id)
      .maybeSingle()
    if (pol) {
      toppers.push({
        category: 'Votes that match the money',
        href: '/leaderboard?view=votes',
        primary: (pol as any).name,
        meta: `Voted the money's way ${topVote.pct}% of the time`,
        value: `${topVote.pct}%`,
      })
    }
  }

  const byBill = new Map<string, { total: number; topIndustry: string | null; topAmt: number; lead: number; coalition: number; nCoalition: number }>()
  for (const r of (billTrail.data as any[]) || []) {
    if (isFecArtifact(r.industry_label)) continue
    const amt = Number(r.total_from_industry) || 0
    if (amt <= 0) continue
    const e = byBill.get(r.bill_id) || { total: 0, topIndustry: null, topAmt: 0, lead: 0, coalition: 0, nCoalition: 0 }
    e.total += amt
    if (amt > e.topAmt) {
      e.topAmt = amt
      e.topIndustry = r.industry_label
      e.lead = Number(r.lead_sponsor_total) || 0
      e.coalition = Number(r.coalition_total) || amt
      e.nCoalition = Number(r.n_coalition) || 0
    }
    byBill.set(r.bill_id, e)
  }
  const topBillEntry = [...byBill.entries()].sort((a, b) => b[1].total - a[1].total)[0]
  if (topBillEntry) {
    const [billId, agg] = topBillEntry
    const { data: bill } = await supabaseService
      .from('cr_bills')
      .select('bill_type, bill_number, title, short_title, congress')
      .eq('id', billId)
      .maybeSingle()
    if (bill) {
      const b = bill as any
      const fmt = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1_000).toLocaleString()}K`)
      const meta =
        agg.nCoalition > 0 && agg.coalition > agg.lead
          ? `Lead sponsor took ${fmt(agg.lead)}; the ${agg.nCoalition} who voted yes took ${fmt(agg.coalition)}`
          : `${agg.topIndustry || 'Industry'} money behind the sponsors`
      toppers.push({
        category: 'Who paid the sponsors',
        href: '/leaderboard?view=bill-sponsors',
        primary: b.short_title || b.title,
        meta,
        value: fmt(agg.total),
      })
    }
  }

  return toppers
}

type RaceCandidate = {
  name: string
  party: string | null
  incumbent: boolean
  ie_for_usd: number | null
  ie_against_usd: number | null
  campaign_raised_usd: number | null
}
type RaceRow = {
  slug: string
  headline: string | null
  blurb: string | null
  state: string | null
  district: string | null
  total_ie_usd: number | null
  total_spend_usd: number | null
  primary_date: string | null
  election_date: string | null
  is_active: boolean
  candidates: RaceCandidate[] | null
  top_pacs: any[] | null
}

/** Active + recent campaign races. The single is_active hero race
 *  (TX Senate) renders big; the rest render as smaller money-progress
 *  boxes. Pulled from cr_races — never fabricated. */
async function getRaces(): Promise<RaceRow[]> {
  const { data } = await supabaseService
    .from('cr_races')
    .select('slug, headline, blurb, state, district, total_ie_usd, total_spend_usd, primary_date, election_date, is_active, candidates, top_pacs')
    .order('is_active', { ascending: false })
    .order('total_ie_usd', { ascending: false, nullsFirst: false })
  return (data as RaceRow[]) || []
}

type ForeignCountry = {
  country: string
  flag: string
  totalUsd: number | null
  tracking: boolean
  pacs: { name: string; amount: number | null; note: string }[]
}

/** Foreign-influence mini-section. Aggregates cr_foreign_donor_records
 *  by the country a donor's money advocates for. Pro-Israel money is the
 *  only category with a real dollar total today (UDP $87.2M, FEC-sourced);
 *  the others have named, sourced PACs but no public total yet, so they
 *  render honestly labelled "tracking" rather than with a fabricated bar.
 *  Never invents a dollar figure. */
async function getForeignInfluence(): Promise<ForeignCountry[]> {
  const { data } = await supabaseService
    .from('cr_foreign_donor_records')
    .select('category, donor_name, donor_origin_country, amount_usd, short_summary')
    .eq('category', 'foreign_policy_pac')

  const rows = (data as any[]) || []

  // Bucket the policy-PAC rows by the country they advocate for.
  const israelPacs = rows
    .filter((r) => /israel/i.test(r.donor_origin_country || ''))
    .map((r) => ({
      name: r.donor_name as string,
      amount: r.amount_usd != null ? Number(r.amount_usd) : null,
      note: r.short_summary ? String(r.short_summary).slice(0, 90) : '',
    }))
  const israelTotal = israelPacs.reduce((s, p) => s + (p.amount || 0), 0)

  const armeniaPacs = rows
    .filter((r) => /armenia/i.test(r.donor_origin_country || ''))
    .map((r) => ({ name: r.donor_name as string, amount: r.amount_usd != null ? Number(r.amount_usd) : null, note: '' }))

  const out: ForeignCountry[] = [
    {
      country: 'Pro-Israel',
      flag: '🇮🇱',
      totalUsd: israelTotal > 0 ? israelTotal : null,
      tracking: israelTotal === 0,
      pacs: israelPacs,
    },
  ]

  if (armeniaPacs.length) {
    out.push({
      country: 'Pro-Armenia',
      flag: '🇦🇲',
      totalUsd: null,
      tracking: true,
      pacs: armeniaPacs,
    })
  }

  // Third lane: illegal-contribution country cases exist (China,
  // Russia/Ukraine) but they are criminal cases, not advocacy spend, so
  // we surface them honestly as "tracking" without a spend bar.
  out.push({
    country: 'Foreign-national cases',
    flag: '🌐',
    totalUsd: null,
    tracking: true,
    pacs: [
      { name: 'China · Russia/Ukraine straw-donor cases', amount: null, note: 'DOJ + FEC criminal matters — see the dossier' },
    ],
  })

  return out
}

export default async function HomePage() {
  const [all, punchlines, topArticles, leaderboardToppers, races, foreign] = await Promise.all([
    getPoliticians(),
    getPunchlines(),
    getTopArticles(),
    getLeaderboardToppers(),
    getRaces(),
    getForeignInfluence(),
  ])

  const punchlineMap: Record<string, Punchline> = {}
  for (const [k, v] of punchlines) punchlineMap[k] = v

  const rest = all.filter((p) => p.slug !== 'donald-trump' && p.slug !== 'donald-trump-2016')


  const heroRace = races.find((r) => r.is_active) || races[0] || null
  const otherRaces = races.filter((r) => r.slug !== heroRace?.slug).slice(0, 4)

  const fmtUsd = (n: number | null | undefined) => {
    if (!n || n <= 0) return null
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
    return `$${Math.round(n)}`
  }

  return (
    <>
      {/* ───── LIVE ACTIVITY TICKER ──────────────────────────────── */}
      <LiveActivityStrip />

      {/* ───── OPENING PLATE — FIND YOUR REPS ────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-8 pb-8 sm:pt-10 sm:pb-10">
          <div className="max-w-[760px] mx-auto">
            <FindYourReps />
          </div>
        </div>
      </section>

      {/* ───── HERO — animated video + ONE headline + ONE CTA ─────
          Fixed: the headline no longer overlaps a faded second line.
          Clean two-column grid; text left, living video right; one
          primary action. (Removed the "Receipts · Not · Rhetoric"
          eyebrow, the second/third hero buttons, and the "free to read"
          microcopy per founder declutter 2026-05-31.) */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell pt-10 pb-10 sm:pt-14 sm:pb-14">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-[1180px] mx-auto">
            {/* Left — the thesis in words */}
            <div className="order-2 lg:order-1">
              <h1 className="font-display text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.012em] text-ink text-balance m-0">
                See who paid your{' '}
                <span className="text-broken">politician</span> — and how they{' '}
                <span className="text-broken">voted</span>.
              </h1>
              <p className="mt-5 font-sans text-[16px] sm:text-[18px] text-ink-2 leading-[1.5] max-w-[520px] m-0">
                We follow the money for every member of Congress. Who gave it,
                and what they did after. Every claim links back to{' '}
                <span className="text-ink underline underline-offset-2 decoration-line">FEC.gov</span>{' '}
                or{' '}
                <span className="text-ink underline underline-offset-2 decoration-line">Congress.gov</span>.
              </p>
              {/* ONE primary action. */}
              <div className="mt-7">
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[16px] font-medium px-7 py-3.5 transition-colors border border-ink no-underline"
                >
                  See the money →
                </Link>
              </div>
            </div>

            {/* Right — the living hero video. */}
            <figure className="order-1 lg:order-2 m-0">
              <div className="rounded-lg border border-line bg-paper-2 p-1.5 shadow-sm">
                <div className="relative aspect-[1400/781] overflow-hidden rounded-md">
                  <video
                    className="hero-video absolute inset-0 h-full w-full object-cover"
                    poster="/brand/homepage-hero-congress.jpg"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="A cash handoff across a desk in a Congress office, photographed from the visitor gallery. Folders on the desk read: planned yes/no votes, soundbites for the media, and what donors want in the bill."
                  >
                    <source src="/brand/homepage-hero-congress.webm" type="video/webm" />
                    <source src="/brand/homepage-hero-congress.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
              <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 leading-relaxed">
                Dramatization · the deal the receipts make visible
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───── LEADERBOARD TOPPERS + LATEST ARTICLES (side by side) ──
          Compact two-column module designed to fit BOTH the toppers and
          the latest 3 articles in one desktop viewport (founder
          2026-05-31). Toppers = #1 row of each leaderboard category.
          Articles = latest 3 published. */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell py-10 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-[1100px] mx-auto">
            {/* Leaderboard toppers */}
            <div>
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
                  Leaderboard toppers
                </div>
                <Link
                  href="/leaderboard"
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink shrink-0"
                >
                  Full board →
                </Link>
              </div>
              {leaderboardToppers.length > 0 ? (
                <ul className="grid gap-2 list-none p-0 m-0">
                  {leaderboardToppers.map((t) => (
                    <li key={t.category}>
                      <Link
                        href={t.href}
                        className="block rounded-lg border border-line bg-paper hover:bg-paper-3 hover:border-ink-3 transition-all px-3.5 py-3 no-underline"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-broken mb-1">
                              {t.category}
                            </div>
                            <div className="font-display text-[17px] leading-[1.1] text-ink tracking-[-0.005em] truncate">
                              {t.primary}
                            </div>
                            <div className="mt-0.5 font-sans text-[12px] text-ink-2 leading-snug line-clamp-1">
                              {t.meta}
                            </div>
                          </div>
                          <div className="font-display text-[22px] tabular-nums text-broken shrink-0 leading-none">
                            {t.value}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-sans text-[14px] text-ink-2">
                  Leaderboards update as we grade.{' '}
                  <Link href="/leaderboard" className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink">
                    Open the leaderboard →
                  </Link>
                </p>
              )}
            </div>

            {/* Latest articles */}
            <div>
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
                  Latest articles
                </div>
                <Link
                  href="/articles"
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink shrink-0"
                >
                  All articles →
                </Link>
              </div>
              {topArticles.length > 0 ? (
                <ul className="grid gap-2 list-none p-0 m-0">
                  {topArticles.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/articles/${a.slug}`}
                        className="block rounded-lg border border-line bg-paper hover:bg-paper-3 hover:border-ink-3 transition-all px-3.5 py-3 no-underline"
                      >
                        <div className="font-display text-[16px] leading-[1.2] text-ink">
                          {a.title}
                        </div>
                        {a.dek && (
                          <div className="mt-1 font-sans text-[12px] text-ink-2 leading-snug line-clamp-2">
                            {a.dek}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-sans text-[14px] text-ink-2">No articles yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───── TRUMP × ADELSON POWER ASSET + MEGA-DONORS ─────────────
          The Adelson $250M card stays (founder: power asset). Beside it,
          Trump's known multi-million donors since 2016. Our FEC top-donor
          table for Trump caps at the $3,300 individual limit (it does not
          hold super-PAC mega-money), so per founder 2026-05-31 we list
          the REAL, sourced famous mega-donors rather than fabricate a
          ranking. Each line is sourced. */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-12 sm:py-16">
          <div className="grid lg:grid-cols-[560px_1fr] gap-8 lg:gap-10 items-start max-w-[1180px] mx-auto">
            {/* Adelson hero card */}
            <div className="mx-auto lg:mx-0 w-full max-w-[560px]">
              {(() => {
                const anchor = getAnchorCard('adelson-250m')
                if (!anchor) return null
                return <CharacterCard data={anchor} variant="hero" width={560} surface="paper" />
              })()}
            </div>

            {/* Trump mega-donors */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2">
                Donald J. Trump · the mega-donors
              </div>
              <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.05] tracking-[-0.01em] text-ink m-0">
                Who put millions behind Trump.
              </h2>
              <p className="mt-3 font-sans text-[14px] text-ink-2 leading-[1.5] max-w-[520px]">
                These are the biggest known donors since 2016. Each one is
                sourced. The small-dollar donors live on his{' '}
                <Link href="/politician/donald-trump" className="text-ink underline underline-offset-2 decoration-line hover:decoration-ink">
                  full file
                </Link>.
              </p>
              <ul className="mt-5 grid gap-2 list-none p-0 m-0">
                <MegaDonor
                  name="Miriam Adelson"
                  amount="$250M"
                  note="Per Trump, on the White House stage (Dec 16, 2025)."
                />
                <MegaDonor
                  name="Preserve America PAC"
                  amount="$112.3M"
                  note="Verified FEC independent spending for Trump, 2024 cycle."
                />
                <MegaDonor
                  name="Elon Musk (America PAC)"
                  amount="$238M+"
                  note="FEC: Musk's America PAC, 2024 cycle pro-Trump spending."
                />
                <MegaDonor
                  name="Timothy Mellon"
                  amount="$150M"
                  note="FEC: largest disclosed donor to MAGA Inc., 2024."
                />
              </ul>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 leading-relaxed">
                Sources: FEC committee filings (C00878801, MAGA Inc.,
                America PAC) + Trump's own on-stage statement. Figures are
                cycle totals as filed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── ACTIVE CAMPAIGN RACES ─────────────────────────────
          One big hero race (the live is_active race — TX Senate) with a
          large visual + headline, then smaller money-progress boxes for
          the other races. All click into /race/[slug]. */}
      {heroRace && (
        <section className="bg-paper-2 border-b border-line">
          <div className="section-shell py-12 sm:py-16">
            <div className="max-w-[1100px] mx-auto">
              <div className="flex items-baseline justify-between gap-4 mb-5 flex-wrap">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
                  Live money in the big races
                </div>
                <Link
                  href={`/race/${heroRace.slug}`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink shrink-0"
                >
                  The big race →
                </Link>
              </div>

              {/* Hero race */}
              <Link
                href={`/race/${heroRace.slug}`}
                className="block rounded-xl border-2 border-ink/25 bg-paper hover:border-ink-3 transition-all overflow-hidden no-underline group"
              >
                <div className="grid md:grid-cols-[1fr_300px]">
                  <div className="p-6 sm:p-8 order-2 md:order-1">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-broken mb-2 inline-flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
                      Live · {heroRace.state}{heroRace.district ? ` · ${heroRace.district}` : ''}
                    </div>
                    <h3 className="font-display text-[26px] sm:text-[34px] leading-[1.05] tracking-[-0.01em] text-ink m-0">
                      {heroRace.headline || 'Active race'}
                    </h3>
                    {heroRace.blurb && (
                      <p className="mt-3 font-sans text-[14px] text-ink-2 leading-[1.5] max-w-[560px] line-clamp-3">
                        {heroRace.blurb}
                      </p>
                    )}
                    <div className="mt-5 inline-flex items-baseline gap-2">
                      <span className="font-display text-[40px] sm:text-[52px] leading-none tabular-nums text-broken tracking-[-0.02em]">
                        {fmtUsd(heroRace.total_ie_usd) || fmtUsd(heroRace.total_spend_usd) || '—'}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        outside money so far
                      </span>
                    </div>
                    <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink group-hover:text-broken transition-colors">
                      See who funds this race →
                    </div>
                  </div>
                  {/* Visual — the hero still from the homepage video. */}
                  <div className="relative min-h-[180px] md:min-h-0 order-1 md:order-2 overflow-hidden bg-ink/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand/homepage-hero-congress.jpg"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-90"
                    />
                  </div>
                </div>
              </Link>

              {/* Smaller race boxes — $-donated progress. */}
              {otherRaces.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {otherRaces.map((r) => {
                    const amt = r.total_ie_usd || r.total_spend_usd || 0
                    // Progress relative to the hero race's outside total.
                    const heroAmt = heroRace.total_ie_usd || heroRace.total_spend_usd || amt || 1
                    const pct = Math.max(4, Math.min(100, Math.round((amt / heroAmt) * 100)))
                    return (
                      <Link
                        key={r.slug}
                        href={`/race/${r.slug}`}
                        className="block rounded-lg border border-line bg-paper hover:bg-paper-3 hover:border-ink-3 transition-all p-4 no-underline"
                      >
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3 mb-1.5">
                          {r.state}{r.district ? ` · ${r.district}` : ''}
                        </div>
                        <div className="font-display text-[15px] leading-[1.15] text-ink line-clamp-2 min-h-[2.4em]">
                          {r.headline || 'Race'}
                        </div>
                        <div className="mt-3 font-display text-[22px] tabular-nums text-broken leading-none">
                          {fmtUsd(amt) || 'Tracking'}
                        </div>
                        {amt > 0 && (
                          <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
                            <div className="h-full rounded-full bg-broken" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ───── THE PRICE OF INFLUENCE · 1980 → 2026 (CENTERPIECE) ──
          The "evidence is the chart" moment. Scroll-driven CSS bar chart
          of total federal election spending, industry-colored on the
          latest bar, Pro-Israel-PAC overlay, top counter, bottom bill
          ticker. Sources cited under it. */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-14 sm:py-20">
          <div className="max-w-[980px] mx-auto">
            <div className="mb-8 max-w-[640px]">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2">
                The evidence
              </div>
              <h2 className="font-display text-[32px] sm:text-[44px] leading-[1.02] tracking-[-0.01em] text-ink text-balance m-0">
                The price of influence, 1980–2026.
              </h2>
              <p className="mt-3 font-sans text-[15px] text-ink-2 leading-[1.5]">
                Every election costs more than the last. Watch the money
                race up. The colors show which industries pay the most.
              </p>
            </div>
            <InfluenceChart />
          </div>
        </div>
      </section>

      {/* ───── FOREIGN INFLUENCE ─────────────────────────────────
          Top countries whose money shapes U.S. policy. Pro-Israel has a
          real FEC dollar total (UDP $87.2M); the others have named,
          sourced PACs/cases but no public total, so they are labelled
          "tracking" — never a fabricated bar. */}
      <section className="bg-paper-3 border-b border-line">
        <div className="section-shell py-12 sm:py-16">
          <div className="max-w-[860px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2">
              Foreign influence
            </div>
            <h2 className="font-display text-[28px] sm:text-[36px] leading-[1.05] tracking-[-0.01em] text-ink m-0">
              Money that shapes U.S. policy from abroad.
            </h2>
            <p className="mt-3 font-sans text-[14px] text-ink-2 leading-[1.5] max-w-[560px]">
              Some money pushes U.S. policy toward another country. Here is
              what is filed with the FEC. Where no total is public yet, we
              say so.
            </p>

            {(() => {
              const maxTotal = Math.max(...foreign.map((c) => c.totalUsd || 0), 1)
              return (
                <div className="mt-6 grid gap-3">
                  {foreign.map((c) => (
                    <div key={c.country} className="rounded-lg border border-line bg-paper p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="font-display text-[20px] text-ink leading-none inline-flex items-center gap-2">
                          <span aria-hidden>{c.flag}</span>
                          {c.country}
                        </div>
                        <div className="font-display text-[22px] tabular-nums leading-none shrink-0 text-broken">
                          {c.totalUsd ? fmtUsd(c.totalUsd) : (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Tracking</span>
                          )}
                        </div>
                      </div>
                      {c.totalUsd ? (
                        <div className="h-2.5 rounded-full bg-line overflow-hidden mb-3">
                          <div
                            className="h-full rounded-full bg-broken"
                            style={{ width: `${Math.max(6, Math.round((c.totalUsd / maxTotal) * 100))}%` }}
                          />
                        </div>
                      ) : (
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-3">
                          No public spend total yet · sourced cases below
                        </p>
                      )}
                      <ul className="grid gap-1.5 list-none p-0 m-0">
                        {c.pacs.map((p) => (
                          <li key={p.name} className="flex items-baseline justify-between gap-3 font-sans text-[13px]">
                            <span className="text-ink min-w-0">
                              <span className="font-medium">{p.name}</span>
                              {p.note && <span className="text-ink-3"> · {p.note}</span>}
                            </span>
                            {p.amount != null && (
                              <span className="font-mono text-[12px] tabular-nums text-ink-2 shrink-0">
                                {fmtUsd(p.amount)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            })()}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/foreign-donors"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink no-underline"
              >
                Open the dossier →
              </Link>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 leading-relaxed">
              Sources: FEC (UDP C00799031, ANCA PAC C00146969) · DOJ
              criminal matters. Pro-Israel total = UDP 2024 cycle receipts.
            </p>
          </div>
        </div>
      </section>

      {/* ───── VALUE LADDER (free → $12 → $45) ──────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell py-10 sm:py-12">
          <div className="max-w-[1080px] mx-auto">
            <div className="flex items-baseline justify-between gap-4 mb-5 flex-wrap">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
                Three ways in
              </div>
              <Link
                href="/pricing"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink shrink-0"
              >
                Compare all three →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <LadderCard
                tier="Free"
                price="$0"
                title="Read the whole record"
                body="Every leaderboard. Every graded promise. The latest as it lands."
                cta="Start free →"
                href="/leaderboard"
                emphasis={false}
              />
              <LadderCard
                tier="Newsletter"
                price="$12/mo"
                title="The weekly money trail"
                body="One email each Friday. The week's bills, the donors behind them, how the votes fell."
                cta="Get the newsletter"
                href="/api/checkout?product=newsletter"
                emphasis={false}
              />
              <LadderCard
                tier="Donor Intelligence"
                price="$45/mo"
                title="Search the money yourself"
                body="Type any politician, donor, bill, or vote. Get a sourced dossier with FEC links."
                cta="Get Donor Intelligence"
                href="/api/checkout?product=software"
                emphasis
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───── EMAIL SIGNUP ─────────────────────────────────────── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-12 sm:py-16">
          <div className="max-w-[640px] mx-auto">
            <NewsletterCapture
              variant="inline-wide"
              surface="homepage-mid"
              heading={
                <>
                  See who got paid by <u>whom</u> to write, sponsor, or vote for a bill.
                </>
              }
              body="Each week we name the donors behind a bill. We name who paid to sponsor it, and who got paid to vote for it. Free. Unsubscribe in one click."
              buttonLabel="Get the newsletter"
            />
          </div>
        </div>
      </section>

      {/* THE RANKING section removed 2026-05-31 (founder: "doesn't add much").
          Politician scorecards live on /directory + each politician page, not
          the homepage. PoliticianFilters/rankableCount/liveCount retired here. */}

      {/* ───── OPEN DOSSIERS (moved to the BOTTOM per founder) ───── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-12 sm:py-16">
          <div className="max-w-[860px] mx-auto mb-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
              Open dossiers
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
              Standalone investigations.
            </h2>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed max-w-2xl">
              Topic-scoped dossiers built on the same primary-source discipline:
              one government source per row, contested labels surfaced honestly.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <InvestigationCard
              eyebrow="Investigation"
              title="Dual citizenship"
              body="Which U.S. politicians hold a second citizenship — what they said, what reputable journalism reported, who funded their campaign."
              href="/dual-citizenship"
            />
            <InvestigationCard
              eyebrow="Investigation"
              title="Foreign-tied funding"
              body="Illegal foreign-national contributions, FARA-registered lobbyist money, foreign-state-owned-enterprise donors, and foreign-policy-aligned PACs."
              href="/foreign-donors"
            />
            <InvestigationCard
              eyebrow="For reporters"
              title="How to cite this"
              body="Citation guide for journalists. What's safe to cite today, what's not citation-ready yet, commercial-use license."
              href="/methodology#cite"
            />
          </div>
        </div>
      </section>

      {/* ───── BOOK PROMO (SEALED) ──────────────────────────────── */}
      <section className="bg-paper-2 border-t border-line">
        <div className="section-shell py-14 sm:py-20">
          <div className="max-w-[760px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
              The book that started it all
            </div>
            <h2 className="font-display text-[32px] sm:text-[40px] leading-[1.05] tracking-[-0.01em] text-ink">
              <em className="font-display italic">SEALED — The 2016 Promises</em>
            </h2>
            <p className="mt-4 font-sans text-[16px] text-ink-2 leading-relaxed max-w-2xl">
              All 145 of Donald Trump's 2016 campaign promises, fact-checked
              with paper-trail receipts on every claim. The same methodology
              CampaignReceipts applies to every politician at scale.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="https://creativelabs2016.lemonsqueezy.com/checkout/buy/90308e58-3e24-40fa-b9be-269480ef8767?utm_source=campaignreceipts&utm_medium=cross-link-buy&utm_content=homepage-case-study"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-5 py-3 transition-colors border border-ink"
              >
                Get the book — $15 PDF
                <span aria-hidden>→</span>
              </a>
              <a
                href="https://sealed2016.com/?utm_source=campaignreceipts&utm_medium=cross-link&utm_content=homepage-case-study"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-paper text-ink hover:bg-paper-2 font-sans text-[15px] font-medium px-5 py-3 transition-colors border border-ink"
              >
                Read more about SEALED
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ───── Sub-components ─────────────────────────────────────────────

function MegaDonor({ name, amount, note }: { name: string; amount: string; note: string }) {
  return (
    <li className="rounded-lg border border-line bg-paper-2 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-[17px] text-ink leading-tight">{name}</span>
        <span className="font-display text-[20px] tabular-nums text-broken shrink-0 leading-none">{amount}</span>
      </div>
      <div className="mt-1 font-sans text-[12px] text-ink-2 leading-snug">{note}</div>
    </li>
  )
}

function LadderCard({
  tier, price, title, body, cta, href, emphasis,
}: {
  tier: string; price: string; title: string; body: string; cta: string; href: string; emphasis: boolean
}) {
  return (
    <div className={`rounded-lg p-5 flex flex-col bg-paper ${emphasis ? 'border-2 border-ink' : 'border border-line'}`}>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${emphasis ? 'text-broken' : 'text-ink-2'}`}>
          {tier}
        </span>
        <span className="font-display text-[18px] text-ink tabular-nums leading-none">{price}</span>
      </div>
      <h3 className="font-display text-[22px] leading-[1.1] tracking-[-0.005em] text-ink m-0">{title}</h3>
      <p className="mt-2 font-sans text-[14px] text-ink-2 leading-[1.5] flex-1">{body}</p>
      <div className="mt-4">
        <Link
          href={href}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full font-sans text-[14px] font-medium px-5 py-2.5 no-underline transition-colors ${
            emphasis ? 'bg-ink text-paper hover:bg-ink-2 border border-ink' : 'bg-paper text-ink hover:bg-paper-2 border border-ink'
          }`}
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}

function InvestigationCard({ eyebrow, title, body, href }: { eyebrow: string; title: string; body: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-line bg-paper hover:bg-paper-2 hover:border-ink-3 transition-all p-5 no-underline"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2 mb-3">{eyebrow}</div>
      <h3 className="font-display text-[22px] leading-[1.15] text-ink m-0 mb-2">{title}</h3>
      <p className="font-sans text-[14px] text-ink-2 leading-relaxed">{body}</p>
      <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:underline underline-offset-4 decoration-line">
        Open →
      </div>
    </Link>
  )
}
