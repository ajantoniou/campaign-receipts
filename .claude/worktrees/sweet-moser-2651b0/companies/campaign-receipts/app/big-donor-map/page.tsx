// /big-donor-map — curated donor→race→outcome map.
//
// Built to back the /for-journalists promise: "the AIPAC and Adelson
// money is in here — traced from donor to race to outcome." This page
// is that trace. Data is hand-curated in lib/big-donor-stories.ts; every
// dollar figure is sourced from repo material (anchor-cards.ts + the TX
// Senate 2026 super-PAC storyboard HARD FACTS LOCK).
//
// Server component. Site audit-document aesthetic: section-shell wrapper,
// font-display/sans/mono + bg-paper/text-ink/border-line tokens, the
// StatTile + Tag primitives from app/components/cr.

import Link from 'next/link'
import Image from 'next/image'
import SealedBookBand from '@/app/components/SealedBookBand'
import { StatTile, Tag } from '@/app/components/cr'
import { BIG_DONOR_STORIES, type RaceOutcome } from '@/lib/big-donor-stories'

export const metadata = {
  title: 'Big-donor map — CampaignReceipts',
  description:
    'Where the big-donor money flows — and what it bought. Traced from donor to race to outcome, from FEC filings.',
  openGraph: {
    title: 'Big-donor map · CampaignReceipts',
    description:
      'Where the big-donor money flows — and what it bought. Donor to race to outcome.',
  },
}

function outcomeTag(outcome: RaceOutcome) {
  if (outcome === 'won') return { label: 'WON', variant: 'party-d' as const }
  if (outcome === 'lost') return { label: 'LOST', variant: 'party-r' as const }
  return { label: 'IN RACE', variant: 'default' as const }
}

function Caricature({
  slug,
  name,
  size,
}: {
  slug?: string
  name: string
  size: number
}) {
  if (slug) {
    return (
      <Image
        src={`/brand/caricatures/${slug}.png`}
        alt={name}
        width={size}
        height={size}
        className="rounded-full border border-line bg-paper-2 object-cover shrink-0"
      />
    )
  }
  // Monogram fallback for donors with no caricature in the repo.
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <div
      className="rounded-full border border-line bg-paper-2 flex items-center justify-center font-display text-ink-2 shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}

export default function BigDonorMapPage() {
  return (
    <main className="bg-paper text-ink">
      {/* HERO */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell py-14 sm:py-20">
          <div className="max-w-[820px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
              The big-donor map
            </div>
            <h1 className="font-display text-[44px] sm:text-[60px] leading-[0.96] tracking-[-0.01em] text-ink text-balance m-0">
              Where the big-donor money flows — and what it bought.
            </h1>
            <p className="mt-5 font-sans text-[17px] text-ink-2 leading-relaxed max-w-2xl">
              Traced from donor to race to outcome. Every figure here comes
              from FEC filings and on-the-record sources — no invented
              numbers, no invented motives.
            </p>
            <p className="mt-3 font-sans text-[14px] text-ink-3 leading-relaxed max-w-2xl">
              The biggest checks do not always win. Read the receipts.
            </p>
          </div>
        </div>
      </section>

      {/* DONOR CARDS */}
      <section className="section-shell py-12 sm:py-16">
        <div className="max-w-[820px] mx-auto flex flex-col gap-8">
          {BIG_DONOR_STORIES.map((story) => (
            <article
              key={story.donorName}
              className="rounded-2xl border border-line bg-paper p-6 sm:p-8"
            >
              {/* Donor header */}
              <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
                <Caricature slug={story.donorSlug} name={story.donorName} size={72} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-1">
                    Donor · {story.cycle} cycle
                  </div>
                  <h2 className="font-display text-[26px] sm:text-[32px] leading-[1.05] tracking-[-0.005em] text-ink m-0">
                    {story.donorName}
                  </h2>
                  <p className="mt-1 font-sans text-[14px] text-ink-2 leading-relaxed">
                    {story.donorRole}
                  </p>
                </div>
                <div className="w-full sm:w-[200px] shrink-0">
                  <StatTile
                    meta="Given"
                    num={story.amount}
                    label={`to a ${story.cycle} super PAC`}
                  />
                </div>
              </div>

              {/* Races funded */}
              <div className="mt-7 flex flex-col gap-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
                  Races funded
                </div>
                {story.racesFunded.map((race) => {
                  const t = outcomeTag(race.outcome)
                  return (
                    <div
                      key={race.politicianName}
                      className="rounded-xl border border-line bg-paper-2 p-4 flex items-start gap-4"
                    >
                      <Caricature
                        slug={race.politicianSlug}
                        name={race.politicianName}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-[18px] leading-tight text-ink">
                            {race.politicianName}
                          </span>
                          <Tag variant={t.variant}>{t.label}</Tag>
                        </div>
                        <p className="mt-1 font-sans text-[14px] text-ink-2 leading-relaxed">
                          {race.note}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer: FEC ref + source + dig-further link */}
              <div className="mt-6 pt-5 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
                    {story.fecRef}
                  </div>
                  <p className="mt-1 font-sans text-[12px] text-ink-3 leading-relaxed max-w-xl">
                    {story.sourceNote}
                  </p>
                </div>
                <Link
                  href={story.href}
                  className="font-sans text-[14px] text-ink underline underline-offset-4 decoration-line hover:decoration-ink whitespace-nowrap"
                >
                  Follow the money →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SealedBookBand placement="big-donor-map" />
    </main>
  )
}
