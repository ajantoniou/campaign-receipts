'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

// Homepage hero — rev-7-EDGE: kill-shot stats replace generic
// quantity-bragging. Per founder rev-7 critique ("missing edge"):
// - Real median-kept-rate, real worst-kept politicians, real
//   bipartisan corporate-capture finding ABOVE the fold
// - Three editorial claim lines under the H1 instead of one bland
//   "we track" description
// - Mono-cap eyebrow stays: "Receipts, not rhetoric"

type Exhibit = {
  /** The product-surface tag (Donor → Vote, Broken-promise, etc.) */
  surface: string
  /** Politician display name. Card H3. */
  politician: string
  /** Sub-line under the name — seat / chamber / role. */
  seat: string
  /** Verdict-stamp visual key. */
  verdict: 'kept' | 'partial' | 'broken' | 'pending'
  /** Stamp text — short data point, e.g. "7/7 Defense" or "22 broken". */
  stampLabel: string
  /** Politician photo URL (wikipedia / bioguide). Each card pulls a
   *  DIFFERENT politician so the hero never reads as 4x the same head. */
  imgSrc: string
  /** Click target. */
  href: string
}

// Founder rev-7 batch C+ (2026-05-17): "The images in header need to be
// of politicians. Which politician Broke major promise (like trump with
// no foreign influence), and politician with donor influence on vote,
// and politician with donor influence on bill sponsor, and politician
// with the most kept promises Or juicier politician in active campaign
// race with major funding from one donor."
//
// Each exhibit is a different politician + a different product surface.
// Photo URLs come straight from cr_politicians.photo_url so the hero
// stays in lockstep with the corpus.
const EXHIBITS: Exhibit[] = [
  {
    // Broken-promise · the canonical case (Trump 2016 audit, 81
    // graded, 22 broken, 34.6% kept). The 2016-audit methodology
    // spine of CR. We use the official portrait (verified live in
    // cr_politicians) not the wikipedia free portrait used previously.
    surface: 'Broken-promise',
    politician: 'Donald J. Trump',
    seat: 'R · 2016 cycle',
    verdict: 'broken',
    stampLabel: '22 broken',
    imgSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29_%28cropped%29%282%29.jpg/500px-Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29_%28cropped%29%282%29.jpg',
    href: '/politician/donald-trump-2016',
  },
  {
    // Donor → Vote · Mike Turner (R-OH, House Intel Chair) voted with
    // defense-industry donors 7/7 tracked votes. Live cr_donor_vote_alignment.
    surface: 'Donor → Vote',
    politician: 'Mike Turner',
    seat: 'R-OH · House Intel Chair',
    verdict: 'broken',
    stampLabel: '7/7 Defense',
    imgSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Mike_Turner_118th_Congress.jpeg/500px-Mike_Turner_118th_Congress.jpeg',
    href: '/politician/mike-turner',
  },
  {
    // Donor → Bill · French Hill (R-AR, Financial Services Chair)
    // sponsored the Digital Asset Market Clarity Act of 2025; top non-
    // individual donor industry was Finance ($109k). Live cr_bill_money_trail.
    surface: 'Donor → Bill',
    politician: 'French Hill',
    seat: 'R-AR · Financial Services Chair',
    verdict: 'broken',
    stampLabel: '$109K Finance',
    imgSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Hill_French_119th_Congress.jpg/500px-Hill_French_119th_Congress.jpg',
    href: '/bill/119/3633',
  },
  {
    // Active race · Thomas Massie (R-KY-04). May 19 primary, 2 days
    // out. $16.4M outside money against the incumbent — most expensive
    // U.S. House primary in history. Live cr_races.
    surface: 'Active race',
    politician: 'Thomas Massie',
    seat: 'R-KY-04 · primary May 19',
    verdict: 'pending',
    stampLabel: '$16.4M against',
    imgSrc: 'https://bioguide.congress.gov/bioguide/photo/M/M001184.jpg',
    href: '/race/ky-04-2026-r-primary',
  },
]

type HeroStats = {
  graded_total: number          // total politicians with graded scorecards
  median_kept_pct: number       // median kept-rate across corpus
  under_50_count: number        // count of pols who kept <50% of promises
  corporate_r: number           // corporate-funded R count
  corporate_d: number           // corporate-funded D count
  total_broken: number          // total broken promises across corpus
}

export default function HomeHeroIntro({ stats }: { stats?: HeroStats }) {
  // Sensible fallback if server didn't pass stats (shouldn't happen)
  const s = stats || { graded_total: 585, median_kept_pct: 53, under_50_count: 135, corporate_r: 61, corporate_d: 61, total_broken: 692 }
  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
      {/* Left rail — type-only headline + CTAs */}
      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2 mb-5 inline-flex items-center gap-2"
        >
          <span className="size-1.5 rounded-full bg-ink animate-pulse" aria-hidden />
          Receipts, not rhetoric
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.05 }}
          className="font-display text-[56px] sm:text-[72px] lg:text-[88px] leading-[0.94] tracking-[-0.015em] text-ink text-balance"
        >
          Every Promise.<br />Every Receipt.
        </motion.h1>

        {/* Three editorial claims with real numbers (the EDGE) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 max-w-xl space-y-3"
        >
          <p className="font-display text-[20px] sm:text-[22px] leading-[1.35] text-ink">
            <strong className="font-medium text-broken">{s.under_50_count} of {s.graded_total}</strong> politicians kept less than half their promises.
          </p>
          <p className="font-display text-[20px] sm:text-[22px] leading-[1.35] text-ink">
            <strong className="font-medium">{s.corporate_r} Republicans + {s.corporate_d} Democrats</strong> are corporate-funded. Capture is bipartisan.
          </p>
          <p className="font-display text-[20px] sm:text-[22px] leading-[1.35] text-ink">
            <strong className="font-medium text-broken">{s.total_broken.toLocaleString()}</strong> broken promises. Sourced. Cited. Yours to read.
          </p>
        </motion.div>

        {/* Stat strip — paper-warm, mono, links to underlying surfaces */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] sm:text-[12px] text-ink-3"
        >
          <span><strong className="text-ink-2 tabular-nums font-medium">{s.graded_total.toLocaleString()}</strong> graded scorecards</span>
          <span aria-hidden>·</span>
          <span><strong className="text-ink-2 tabular-nums font-medium">median {s.median_kept_pct}%</strong> kept</span>
          <span aria-hidden>·</span>
          <span>three sequential reviewers · primary-source receipts</span>
        </motion.div>

        {/* CTAs — single primary, single secondary */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <Link
            href="/politician/donald-trump-2016"
            className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-6 py-3 transition-colors border border-ink"
          >
            Read the Trump 2016 audit
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 rounded-full bg-paper text-ink hover:bg-paper-2 font-sans text-[15px] font-medium px-5 py-3 transition-colors border border-line hover:border-ink-3"
          >
            Browse 585 politicians
          </Link>
        </motion.div>
      </div>

      {/* Right rail — 4 receipts, 4 product surfaces, 4 different
          politicians. Per founder rev-7 batch C+ (2026-05-17): the
          band now maps one politician to each CR product surface
          (Broken-promise / Donor→Vote / Donor→Bill / Active race) so
          a first-time visitor sees the 4 things CR offers as 4
          concrete examples instead of 4 chapter views of one audit. */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2 mb-3">
          Featured · 4 receipts · 4 product surfaces
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {EXHIBITS.map((ex, i) => (
            <ExhibitTile key={i} ex={ex} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function ExhibitTile({ ex }: { ex: Exhibit }) {
  // Asymmetric visual weight per engagement panel R3: broken stamps
  // pop harder than kept/pending. Pending uses slate border so an
  // active-race card reads as "in motion," not "verdict in."
  const isBroken = ex.verdict === 'broken'
  const isPending = ex.verdict === 'pending'
  const borderCls = isBroken
    ? 'border-broken/40'
    : isPending
      ? 'border-pending/40'
      : 'border-line'
  return (
    <Link
      href={ex.href}
      className={`group relative block aspect-[3/4] rounded-md border ${borderCls} bg-paper overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_-12px_rgba(60,40,20,0.18)]`}
    >
      {/* Image fill — politician headshot from cr_politicians.photo_url */}
      <Image
        src={ex.imgSrc}
        alt={`${ex.politician} — ${ex.surface}`}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover object-top opacity-80 group-hover:opacity-95 transition-opacity"
        unoptimized
      />
      {/* Paper-warm overlay tint for legibility of the bottom strip
          over the photo. Lighter on broken/pending so the photo reads
          more, denser on kept so the green stamp still pops. */}
      <div
        className={`absolute inset-0 ${
          isBroken || isPending ? 'bg-paper/15' : 'bg-paper/30'
        } mix-blend-multiply pointer-events-none`}
        aria-hidden
      />

      {/* Product-surface tag — top-left mono cap. This is the editorial
          point of the band: "here are the four things we surface." */}
      <div className="absolute top-2 left-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/90 bg-paper/85 backdrop-blur-sm px-2 py-0.5 rounded">
        {ex.surface}
      </div>

      {/* Tilted verdict stamp — top-right */}
      <div className="absolute top-2 right-2">
        <span
          className={`stamp ${ex.verdict} stamp-tilted font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em]`}
        >
          {ex.stampLabel}
        </span>
      </div>

      {/* Caption strip — bottom. Politician name + seat. */}
      <div className="absolute inset-x-0 bottom-0 bg-ink/85 backdrop-blur-sm text-paper px-3 py-2.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/70 truncate">
          {ex.seat}
        </div>
        <div className="font-display text-[14px] sm:text-[15px] leading-[1.2] text-paper truncate">
          {ex.politician}
        </div>
      </div>
    </Link>
  )
}
