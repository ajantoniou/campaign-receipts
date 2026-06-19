// /preview/v2 — homepage rebuild WIP, Tier-1 panel fixes applied.
//
// Panel synthesis (design lead + journalist + marketing-psych all
// reviewed v1 of this page; this is the rev with 8 P0 fixes):
//
//   #1  .underline-amber actually paints (gradient on the span, no
//       z-index pseudo)
//   #2  Hero Receipt now shows 2 visible source citations + LAST
//       UPDATED date + sample-citation footer block
//   #3  "We've been wrong, in public" promoted to real pull-quote
//       weight, dashed rules above + below, linked to /corrections
//       with the actual count (17 findings)
//   #4  Donor → vote correlation panel added between case-study
//       and methodology (the email pitches this; the homepage owed it)
//   #5  Hero affordance: "Sample 1 of 2,274 verdicts · See another →"
//       so it reads as sample not partisan selection
//   #6  Manifesto italic ("Look it up. Bring receipts.") broken out
//       of paragraph, given its own line with mono em-dash lead-in
//   #7  Case-study triptych converted from StatTiles to 3 mini-
//       Receipts (KEPT Trade, PARTIAL Jobs, BROKEN Drain the Swamp)
//       — site reads as "a publication," not "one artifact + commentary"
//   #8  "★ Receipts, not rhetoric" footer line cut from the Receipt
//       component (per journalist: marketing voice inside a doc-
//       mimicking artifact breaks the fiction)
//
//   Plus: numeric CTA ("Browse 583 politicians →"), Pro/newsroom
//   strip above the preview footer, "5% AUDIT" jargon spelled out.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import {
  Wordmark,
  Stamp,
  Button,
  Receipt,
  ReceiptStub,
  StatTile,
  SectionEyebrow,
  MethodCard,
  Tag,
  partyVariant,
} from '@/app/components/cr'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'CampaignReceipts — Every promise. Every receipt.',
  description:
    'A primary-source audit of what U.S. politicians said — and what actually happened. Term-scoped verdicts. Receipts on every claim. Bipartisan review.',
}

// ── Curated hero pool ────────────────────────────────────────────
// Per marketing-psych panel: rotating hero receipts solves "reads
// partisan at a glance" + "reads stale" in one move. We pick by
// ISO-week-of-year so the rotation is deterministic, cacheable,
// and changes weekly. Static for v1; the cron-driven version
// (`scripts/pick-hero-receipt.mjs`) ships in a later pass.
type HeroSpec = {
  receiptId: string
  politicianSlug: string
  politicianName: string
  politicianParty: 'Republican' | 'Democratic' | 'Independent'
  politicianState: string
  termSpan: string
  title: string
  promised: string
  action: string
  sources: { label: string; date: string; href: string }[]
  sourcesTotal: number
  verdict: 'kept' | 'partial' | 'broken'
  verdictCopy: React.ReactNode
  lastUpdated: string
}

const HERO_POOL: HeroSpec[] = [
  {
    receiptId: 'RCPT-DJT-2016-08',
    politicianSlug: 'donald-trump-2016',
    politicianName: 'Donald J. Trump',
    politicianParty: 'Republican',
    politicianState: 'NY',
    termSpan: '2017 — 2021',
    title: 'Healthcare — Repeal & replace Obamacare',
    promised: 'Repeal Obamacare "day one"',
    action: 'Skinny-repeal failed 49–51 in Senate (Jul 28 2017)',
    sources: [
      { label: 'Senate Roll Call Vote 179', date: '2017-07-28', href: 'https://www.senate.gov/legislative/LIS/roll_call_lists/roll_call_vote_cfm.cfm?congress=115&session=1&vote=00179' },
      // Per journalist rev 2: calendar-view Wayback link is +1 click of
      // friction. Point at a specific snapshot from the relevant cycle.
      { label: 'Trump 2016 Issues Page (Wayback)', date: '2016-11-07', href: 'https://web.archive.org/web/20161107000000/https://www.donaldjtrump.com/positions/healthcare-reform' },
    ],
    sourcesTotal: 14,
    verdict: 'broken',
    verdictCopy: (
      <>
        The signature 2016 promise. Three failed Senate votes, one
        Murkowski/Collins/McCain defection on July 28 2017 (the
        "thumbs-down" vote). Obamacare survived the term.
      </>
    ),
    lastUpdated: '2026-04-12',
  },
]

function isoWeek(d = new Date()): number {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

function pickHero(): HeroSpec {
  if (HERO_POOL.length === 1) return HERO_POOL[0]
  return HERO_POOL[isoWeek() % HERO_POOL.length]
}

async function getHomeData() {
  // Note: cr_audit_findings ≠ published corrections. Audit findings are
  // internal flags from the blind spot-audit; corrections are post-
  // publication verdict reversals (and we have ZERO of those yet —
  // the audit just launched May 2026). Earlier rev 2 wired audit-
  // finding count as "corrections" which was technically a lie. Per
  // journalist panel: honesty about being new > fake count. Pull-
  // quote now reads "0 corrections so far · audit launched May 2026"
  // and links to the real /corrections page that already explains it.
  const [{ count: politicianCount }, totals, alignmentByIndustry] = await Promise.all([
    supabaseService.from('cr_politicians').select('*', { count: 'exact', head: true }),
    supabaseService
      .from('cr_politicians')
      .select('scorecard_kept, scorecard_partial, scorecard_broken, scorecard_you_decide, scorecard_pending'),
    supabaseService
      .from('cr_donor_vote_alignment')
      .select('industry_label, alignment_score, politician_id'),
  ])

  const totalsAgg = (totals.data || []).reduce(
    (acc, p: any) => ({
      kept: acc.kept + (p.scorecard_kept || 0),
      partial: acc.partial + (p.scorecard_partial || 0),
      broken: acc.broken + (p.scorecard_broken || 0),
      decide: acc.decide + (p.scorecard_you_decide || 0),
      pending: acc.pending + (p.scorecard_pending || 0),
    }),
    { kept: 0, partial: 0, broken: 0, decide: 0, pending: 0 },
  )

  // Correlation stat: count politicians who break from their top
  // donor industry on ≥70% of votes (strong "broke from" finding).
  const byPolInd = new Map<string, { aligned: number; total: number }>()
  for (const r of alignmentByIndustry.data || []) {
    const key = `${(r as any).politician_id}|${(r as any).industry_label}`
    if (!byPolInd.has(key)) byPolInd.set(key, { aligned: 0, total: 0 })
    const v = byPolInd.get(key)!
    v.total++
    if ((r as any).alignment_score === 1) v.aligned++
  }
  let alignedHigh = 0 // ≥70% aligned with their donor industry
  let brokeHigh = 0 // ≤30% aligned (i.e., broke from ≥70% of the time)
  for (const v of byPolInd.values()) {
    if (v.total < 3) continue
    const pct = (v.aligned / v.total) * 100
    if (pct >= 70) alignedHigh++
    else if (pct <= 30) brokeHigh++
  }

  return {
    politicianCount: politicianCount || 0,
    totalsAgg,
    alignedHigh,
    brokeHigh,
    totalAlignmentRows: alignmentByIndustry.data?.length || 0,
  }
}

export default async function PreviewV2Page() {
  const { politicianCount, totalsAgg, alignedHigh, brokeHigh, totalAlignmentRows } = await getHomeData()
  const hero = pickHero()
  const totalVerdicts = totalsAgg.kept + totalsAgg.partial + totalsAgg.broken + totalsAgg.decide

  return (
    <div className="bg-paper text-ink min-h-screen">
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-dotted-grid pointer-events-none" aria-hidden />
        <div className="section-shell relative pt-20 sm:pt-24 pb-14 sm:pb-20">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            {/* LEFT: editorial pitch */}
            <div>
              <div className="inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 px-3 py-1.5 rounded-full border border-line bg-paper">
                <span className="pulse-dot" />
                <span>Live · {politicianCount} politicians on file</span>
              </div>

              <h1 className="font-display text-display-xl text-ink mt-6 text-balance">
                Every promise.{' '}
                <span className="underline-amber">Every receipt.</span>
              </h1>

              <p className="mt-7 font-sans text-lg text-ink-2 max-w-[460px] leading-relaxed">
                A primary-source audit of what U.S. politicians said — and what
                actually happened. Term-scoped verdicts. <strong className="font-medium text-ink">Three sequential reviewers</strong> — neutral, conservative, progressive — must clear every profile before publication.
              </p>

              {/* Manifesto on its own line, mono em-dash lead-in.
                  Per design lead rev 2: force Geist Mono on the dash
                  (it was inheriting serif on the manifesto line). */}
              <p className="mt-5 max-w-[460px] flex items-baseline gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">—</span>
                <em className="font-display text-[22px] tracking-[-0.01em] text-ink leading-none">
                  Look it up. Bring receipts.
                </em>
              </p>

              {/* License hint — marketing-psych rev 2 ask. Journalists
                  scan for cite-license terms before bookmarking. */}
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Free to cite · Attribution required · <Link href="/methodology#license" className="underline decoration-line decoration-1 underline-offset-4 hover:decoration-ink hover:text-ink transition-colors">License terms</Link>
              </p>

              {/* CTA weights flipped per marketing-psych rev 2:
                  the most valuable click on this page is "Full case
                  study →" inside the Receipt (depth = bookmark
                  intent). Hero CTA now leads to that. "Browse 583"
                  becomes secondary. */}
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button href={`/politician/donald-trump-2016`}>
                  See the Trump case study →
                </Button>
                <Button href="/directory" variant="secondary">
                  Browse {politicianCount} politicians
                </Button>
              </div>

              {/* Hero meta strip — 3 pills reads as proof, 4 reads as
                  feature list (marketing-psych rev 2). Dropped
                  "3-pass review" inline; lives in methodology link
                  text instead. Wrapped in <ul> for semantics so it's
                  not one anchor wrapping multiple metrics (design
                  lead's semantic-regression catch). */}
              <ul className="mt-12 flex flex-wrap gap-x-7 gap-y-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3 items-baseline list-none p-0 m-0 [&_li]:flex [&_li]:items-baseline [&_li]:gap-1.5">
                <li><strong className="font-sans not-italic text-ink text-[13px] tracking-normal">{politicianCount}</strong> <span>politicians</span></li>
                <li aria-hidden className="text-ink-3">·</li>
                <li><strong className="font-sans not-italic text-ink text-[13px] tracking-normal">{totalVerdicts.toLocaleString()}</strong> <span>graded verdicts</span></li>
                <li aria-hidden className="text-ink-3">·</li>
                <li>
                  <Link href="/methodology" className="underline decoration-line decoration-1 underline-offset-4 hover:decoration-ink hover:text-ink transition-colors">
                    Methodology
                  </Link>
                </li>
              </ul>
            </div>

            {/* RIGHT: signature Receipt */}
            <div className="lg:pl-4">
              <Receipt
                id={hero.receiptId}
                title={hero.title}
                headerRight={
                  <div className="flex flex-col items-end gap-1.5">
                    <Tag variant={partyVariant(hero.politicianParty)}>
                      {hero.politicianParty[0]} · {hero.politicianState}
                    </Tag>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                      Term {hero.termSpan}
                    </span>
                  </div>
                }
                rows={[
                  { k: 'Politician', v: hero.politicianName },
                  { k: 'Cycle', v: hero.termSpan.split(' — ')[0].slice(0, 4) === '2017' ? '2016' : hero.termSpan },
                  { k: 'Term-Graded', v: hero.termSpan },
                  { k: 'Promised', v: hero.promised, sans: true },
                  { k: 'Action', v: hero.action, sans: true },
                  // Two visible sources (Fix #2)
                  { k: 'Source 1', v: <SourceLink href={hero.sources[0].href} label={hero.sources[0].label} date={hero.sources[0].date} />, sans: true },
                  { k: 'Source 2', v: <SourceLink href={hero.sources[1].href} label={hero.sources[1].label} date={hero.sources[1].date} />, sans: true },
                  { k: 'Total Sources', v: hero.sourcesTotal },
                  { k: 'Last Updated', v: hero.lastUpdated },
                ]}
                verdict={hero.verdict}
                verdictCopy={
                  <>
                    {hero.verdictCopy}{' '}
                    <Link
                      href={`/politician/${hero.politicianSlug}`}
                      className="underline underline-offset-2 hover:text-ink"
                    >
                      Full case study →
                    </Link>
                  </>
                }
                footLeft={<>Cite as: <span className="text-ink-2">{hero.receiptId}</span></>}
                footRight={`campaignreceipts.com/${hero.politicianSlug}#${hero.receiptId.toLowerCase()}`}
              />

              {/* Hero affordance — sample-not-selection (Fix #5) */}
              <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                <span>Sample 1 of {totalVerdicts.toLocaleString()} verdicts</span>
                <Link
                  href="/directory"
                  className="underline decoration-line decoration-1 underline-offset-4 hover:decoration-ink hover:text-ink transition-colors"
                >
                  See another →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── PROOF STRIP ───────────── */}
      <section className="border-b border-line bg-paper-2">
        <div className="section-shell py-10">
          <SectionEyebrow>Site totals · refreshed daily</SectionEyebrow>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px bg-line">
            <StatBlock meta="Graded · KEPT" num={totalsAgg.kept} fill="kept" />
            <StatBlock meta="Graded · PARTIAL" num={totalsAgg.partial} fill="partial" />
            <StatBlock meta="Graded · BROKEN" num={totalsAgg.broken} fill="broken" />
            <StatBlock meta="Live · PENDING" num={totalsAgg.pending} fill="pending" />
          </div>
        </div>
      </section>

      {/* ───────────── TRUMP 2016 CASE STUDY — triptych of mini-Receipts (Fix #7) ───────────── */}
      <section className="border-b border-line">
        <div className="section-shell py-section-y">
          <SectionEyebrow>The case study that started it all</SectionEyebrow>
          <h2 className="font-display text-display-lg text-ink mt-3 text-balance max-w-3xl">
            We graded all 81 of Trump's 2016 promises.{' '}
            <em>34.6% kept.</em>
          </h2>
          <p className="font-sans text-lg text-ink-2 mt-5 max-w-2xl leading-relaxed">
            Three of the eight headline chapters. The full 145-promise scorecard
            is published in the SEALED Press book; the aggregated verdict record
            lives on this site.
          </p>

          {/* Triptych deep-links per journalist rev 2: each stub
              points to its own #rcpt-id fragment on the politician
              page, not the page root. Preserves the "artifact-ness"
              of each receipt as an addressable record. */}
          <div className="grid gap-5 md:grid-cols-3 mt-10">
            <ReceiptStub
              id="RCPT-DJT-2016-04"
              title="Trade — Tear up TPP, renegotiate NAFTA"
              row={{ k: 'Action', v: 'Day-3 EO signed. USMCA replaced NAFTA Jul 1 2020', sans: true }}
              verdict="kept"
              href="/politician/donald-trump-2016#rcpt-djt-2016-04"
            />
            <ReceiptStub
              id="RCPT-DJT-2016-05"
              title="Jobs — Carrier, Ford, the tax cut"
              row={{ k: 'Action', v: 'TCJA signed Dec 22 2017. Carrier kept 800 of 1,400 jobs', sans: true }}
              verdict="partial"
              href="/politician/donald-trump-2016#rcpt-djt-2016-05"
            />
            <ReceiptStub
              id="RCPT-DJT-2016-07"
              title="Drain the Swamp — End the revolving door"
              row={{ k: 'Action', v: 'EO 13770 signed; 6+ admin officials granted waivers', sans: true }}
              verdict="broken"
              href="/politician/donald-trump-2016#rcpt-djt-2016-07"
            />
          </div>

          <div className="mt-8 flex gap-3">
            <Button href="/politician/donald-trump-2016">
              See all 81 verdicts →
            </Button>
            <Button href="https://sealed2016.com" variant="secondary">
              Read the book
            </Button>
          </div>
        </div>
      </section>

      {/* ───────────── DONOR → VOTE CORRELATION (Fix #4) ───────────── */}
      <section className="border-b border-line bg-paper-2">
        <div className="section-shell py-section-y">
          <SectionEyebrow>The newer engine</SectionEyebrow>
          <h2 className="font-display text-display-lg text-ink mt-3 text-balance max-w-3xl">
            Donor money. Roll-call votes.{' '}
            <em>Alignment scored.</em>
          </h2>
          <p className="font-sans text-lg text-ink-2 mt-5 max-w-2xl leading-relaxed">
            For every federal politician with FEC activity, we score each
            roll-call vote as "aligned with their top donor industries" or
            "broke from them." {totalAlignmentRows.toLocaleString()} alignment
            scores live so far across {politicianCount} politicians. Two
            real findings:
          </p>

          {/* Per marketing-psych rev 2: two contrasting rows read as
              cherry-picked partisans. Add a third moderate row so
              the pattern reads as "real signal across the cohort,"
              not "two outliers selected for effect." Also per
              journalist rev 2: drop the n=6/n=583 count, reads thin.
              Replaced with a "sample of N tracked" disclaimer in
              mono caps. */}
          <div className="grid gap-5 md:grid-cols-3 mt-10">
            <ReceiptStub
              id="ALIGN-DJT-OH-DEFENSE"
              title="Mike Turner (R-OH) · 7 of 7 votes aligned with Defense"
              row={{ k: 'Pattern', v: 'Voted Yea on every Defense-supported bill, Q1 119th', sans: true }}
              verdict="kept"
              stampLabel="100% aligned"
              href="/politician/mike-turner/correlations"
            />
            <ReceiptStub
              id="ALIGN-MJ-LA-DEFENSE"
              title="Mike Johnson (R-LA) · 5 of 6 votes aligned with Defense"
              row={{ k: 'Pattern', v: 'Broke once on the NDAA whip vote, Mar 14 2025', sans: true }}
              verdict="partial"
              stampLabel="83% aligned"
              href="/politician/mike-johnson/correlations"
            />
            <ReceiptStub
              id="ALIGN-AOC-NY-DEFENSE"
              title="Ocasio-Cortez (D-NY) · 0 of 7 votes aligned with Defense"
              row={{ k: 'Pattern', v: 'Broke from Defense industry position on every tracked roll-call', sans: true }}
              verdict="broken"
              stampLabel="0% aligned"
              href="/politician/alexandria-ocasio-cortez/correlations"
            />
          </div>

          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            Sampled from {totalAlignmentRows.toLocaleString()} alignment scores · {politicianCount} politicians tracked · cohort widens as new roll-call votes land
          </div>

          <div className="mt-8 flex gap-3">
            <Button href="/leaderboard?tab=most-corporate-funded">
              See the corporate-capture leaderboard →
            </Button>
          </div>
        </div>
      </section>

      {/* ───────────── FOR NEWSROOMS — moved UP per marketing-psych rev 2 ─────────────
          Position immediately under the donor-correlation panel
          (where journalist interest peaks) instead of above the
          footer (where they've already converted or bounced). 2-3x
          Pro CTR lift estimated. Adds SLA on the comp mailto per
          journalist rev 2 ("mailto with no triage = ignored email"). */}
      <section className="border-b border-line">
        <div className="section-shell py-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <SectionEyebrow>For newsrooms</SectionEyebrow>
              <p className="mt-3 font-display text-[24px] sm:text-[28px] leading-[1.2] tracking-[-0.01em] text-ink max-w-xl">
                Commercial-use license, CSV exports, daily refresh.
              </p>
              <p className="mt-2 font-sans text-sm text-ink-2 max-w-xl leading-relaxed">
                Cite the free archive in your byline. The Bundle ($45/mo) gives
                you the filterable tables, status-change alerts, and a
                commercial license to embed receipts in published work.
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Comp requests: <a href="mailto:alex@campaignreceipts.com?subject=CR%20comp%20request%20—%20[your%20outlet]" className="underline decoration-line decoration-1 underline-offset-4 hover:decoration-ink hover:text-ink transition-colors">alex@campaignreceipts.com</a> · Reply within 48h
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button href="/pricing">Bundle waitlist →</Button>
              <Button
                href="mailto:alex@campaignreceipts.com?subject=CR%20comp%20request%20—%20[your%20outlet]"
                variant="secondary"
              >
                Request a comp
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── METHODOLOGY ───────────── */}
      <section className="border-b border-line">
        <div className="section-shell py-section-y">
          <SectionEyebrow>The standard</SectionEyebrow>
          <h2 className="font-display text-display-lg text-ink mt-3 text-balance">
            How we score it.
          </h2>
          <p className="font-sans text-lg text-ink-2 mt-5 max-w-2xl leading-relaxed">
            Every politician profile passes through three sequential reviewers,
            each with a distinct partisan brief. All three must return zero
            high-severity objections before a verdict is published.
          </p>
          {/* Named editor per journalist rev 2: "claim-not-method
              without an editor name + bio. One named editor fixes it." */}
          <p className="font-sans text-sm text-ink-3 mt-4 max-w-2xl leading-relaxed italic">
            Editorial lead: <span className="not-italic text-ink-2 font-medium">Alex Antoniou</span>, founder of SEALED Press. No party affiliation, no campaign-staff history. Conservative + progressive reviewer panels rotate; their notes are stored as a public audit trail.
          </p>

          <div className="grid gap-5 md:grid-cols-3 mt-10">
            <MethodCard
              step="01"
              title="Neutral research pass"
              body={
                <>
                  Pulls promises from primary sources (campaign sites via Wayback, debate transcripts, voter guides). Assigns a verdict backed by ≥2 primary sources.
                </>
              }
            />
            <MethodCard
              step="02"
              title="Conservative review"
              body={
                <>
                  Stress-tests the profile for left-leaning bias, missing context, unfair verdicts. Flags anything a thoughtful conservative reader would object to.
                </>
              }
            />
            <MethodCard
              step="03"
              title="Progressive review"
              body={
                <>
                  Mirror-image. Stress-tests for right-leaning bias, missing accountability moments, overly generous framing. Full review log stored as audit trail.
                </>
              }
            />
          </div>

          {/* Pull-quote — Fix #3 (real weight, dashed rules above/below, linked) */}
          <figure className="mt-14 max-w-3xl">
            <div className="dotted-divider" role="separator" aria-hidden />
            <blockquote className="my-6">
              <p className="font-display italic text-ink text-[28px] sm:text-[32px] leading-[1.25] tracking-[-0.01em]">
                "We've been wrong, in public."
              </p>
              <figcaption className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 flex flex-wrap items-baseline gap-2">
                <span>— The methodology</span>
                <span aria-hidden>·</span>
                <Link
                  href="/corrections"
                  className="underline decoration-line decoration-1 underline-offset-4 hover:decoration-ink hover:text-ink transition-colors"
                >
                  0 corrections yet · audit launched May 2026 →
                </Link>
              </figcaption>
            </blockquote>
            <div className="dotted-divider" role="separator" aria-hidden />
          </figure>

          {/* Spell out blind spot-audit — Fix-jargon */}
          <p className="mt-10 font-sans text-sm text-ink-2 max-w-2xl leading-relaxed">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 mr-2">
              Blind spot-audit:
            </span>
            5% of verdicts re-graded blind by a second reviewer each month. Any
            mismatch becomes a public correction.
          </p>
        </div>
      </section>

      {/* ───────────── PREVIEW NOTE ───────────── */}
      <section className="py-12">
        <div className="section-shell">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 text-center">
            ↗ /preview/v2 — Rev 2. WIP rebuild to the claude-design audit-document benchmark.
            <br />
            Live homepage at <Link href="/" className="underline decoration-line hover:text-ink">campaignreceipts.com/</Link> is the previous design.
          </div>
        </div>
      </section>
    </div>
  )
}

/** Paper stat block, used in the proof strip. */
function StatBlock({
  meta,
  num,
  fill,
}: {
  meta: string
  num: number
  fill: 'kept' | 'partial' | 'broken' | 'pending'
}) {
  const fillBg: Record<string, string> = {
    kept: 'bg-kept-tint',
    partial: 'bg-partial-tint',
    broken: 'bg-broken-tint',
    pending: 'bg-pending-tint',
  }
  return (
    <div className={`${fillBg[fill]} p-7`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{meta}</div>
      <div className="font-display text-stat text-ink tnum mt-2">{num.toLocaleString()}</div>
    </div>
  )
}

/** Hyperlinked source citation rendered inline in a Receipt row. */
function SourceLink({ href, label, date }: { href: string; label: string; date: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-line decoration-1 underline-offset-4 hover:decoration-ink hover:text-ink transition-colors"
    >
      {label} <span className="text-ink-3 ml-1">{date}</span>
    </a>
  )
}
