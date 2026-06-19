// /r/[id] — short URL receipt page.
//
// Per panel: every CharacterCard footer prints "campaignreceipts.com/r/[id]"
// as the screenshot-survivable share URL. This page hydrates that URL.
//
// Three sources for the card data, in order:
//   1. Anchor cards (lib/anchor-cards.ts) — hand-curated, like adelson-250m
//   2. Politician slug — load from cr_politicians + cr_industry_breakdown
//   3. 404 if neither matches
//
// The page renders:
//   - The CharacterCard (hero variant)
//   - "Why this matters" prose with the SEALED CTA
//   - Share buttons + the PNG download link

import { notFound } from 'next/navigation'
import Link from 'next/link'
import CharacterCard, { type CharacterCardData } from '@/app/components/CharacterCard'
import ShareButtons from '@/app/components/ShareButtons'
import TrackVisit from '@/app/components/TrackVisit'
import { getAnchorCard } from '@/lib/anchor-cards'
import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCardData(id: string): Promise<CharacterCardData | null> {
  // 1. Try anchor cards first.
  const anchor = getAnchorCard(id)
  if (anchor) return anchor

  // 2. Try politician slug.
  const { data: pol } = await supabaseService
    .from('cr_politicians')
    .select(
      'id, slug, name, party, state, branch, photo_url, scorecard_kept, scorecard_broken, scorecard_percentage_kept',
    )
    .eq('slug', id)
    .maybeSingle()
  if (!pol) return null
  const p = pol as {
    id: string
    slug: string
    name: string
    party: string | null
    state: string | null
    branch: string | null
    photo_url: string | null
    scorecard_kept: number | null
    scorecard_broken: number | null
    scorecard_percentage_kept: number | null
  }

  const { data: donors } = await supabaseService
    .from('cr_industry_breakdown')
    .select('industry_label, total_contributions, rank')
    .eq('politician_id', p.id)
    .order('rank', { ascending: true })
    .limit(3)

  const partyShort =
    p.party === 'Republican' ? 'R' : p.party === 'Democratic' ? 'D' : 'I'
  return {
    id: p.slug,
    politicianSlug: p.slug,
    candidateName: p.name,
    office: `${partyShort} · ${p.state || '—'} · ${p.branch || ''}`.trim(),
    photoUrl: p.photo_url,
    donorVoteScore: Math.round(Number(p.scorecard_percentage_kept || 0)),
    donorBillScore: null,
    topDonors: (donors || []).map((d) => ({
      name: (d as { industry_label: string }).industry_label,
      amount: Number((d as { total_contributions: number }).total_contributions || 0),
    })),
    promisesKept: p.scorecard_kept,
    promisesBroken: p.scorecard_broken,
    quote: null,
    quoteSpeaker: null,
    quoteSource: null,
    fecFilingId: null,
    shortUrl: `campaignreceipts.com/r/${p.slug}`,
    weekLabel: null,
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const data = await getCardData(params.id)
  if (!data) return { title: 'Receipt not found · CampaignReceipts' }
  return {
    title: `${data.candidateName} — receipt · CampaignReceipts`,
    description: data.quote || `Top donors and promise scorecard for ${data.candidateName}. Sourced. Cited. Free.`,
    openGraph: {
      title: `${data.candidateName} — receipt`,
      description: data.quote || `Top donors + promise scorecard.`,
      images: [{ url: `/api/card/receipt/${params.id}`, width: 1080, height: 1350 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.candidateName} — receipt`,
      images: [`/api/card/receipt/${params.id}`],
    },
  }
}

export default async function ReceiptShortUrlPage({ params }: { params: { id: string } }) {
  const data = await getCardData(params.id)
  if (!data) notFound()

  const isAnchor = !!getAnchorCard(params.id)

  return (
    <>
      <TrackVisit
        kind="receipt"
        id={params.id}
        name={data.candidateName}
        href={`/r/${params.id}`}
      />
      {/* Above the fold — the card on a paper-warm stage */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-10 pb-10 sm:pt-14 sm:pb-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors mb-6"
          >
            ← Home
          </Link>
          {isAnchor && (
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-broken mb-3 inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
              Pinned receipt · editorial founding document
            </div>
          )}
          <div className="grid lg:grid-cols-[560px_1fr] gap-8 lg:gap-12 items-start">
            <div className="mx-auto lg:mx-0 w-full max-w-[560px]">
              <CharacterCard data={data} variant="hero" width={560} surface="paper-2" />
            </div>
            <div className="max-w-prose">
              <h1 className="font-display text-[34px] sm:text-[44px] leading-[1.04] tracking-[-0.01em] text-ink m-0 mb-3">
                {data.quote ? '"' + data.quote + '"' : data.candidateName}
              </h1>
              {data.quoteSpeaker && (
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 m-0 mb-5">
                  {data.quoteSpeaker} · {data.quoteSource}
                </p>
              )}

              {isAnchor ? (
                <div className="space-y-4 font-sans text-[15px] sm:text-[16px] text-ink-2 leading-[1.6]">
                  <p>
                    On stage at the White House Hanukkah reception on
                    December 16, 2025, the President said it himself.
                    Miriam Adelson, who owns Las Vegas Sands and (until
                    2025) the Dallas Mavericks, was standing beside him.
                    She didn't disagree.
                  </p>
                  <p>
                    The figure Trump named — <strong className="text-ink">$250 million</strong> — is bigger than what
                    FEC Schedule E shows. The FEC's record of independent
                    expenditures supporting Trump's 2024 bid from
                    Adelson's Preserve America PAC (
                    <a
                      href="https://www.fec.gov/data/committee/C00878801/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
                    >
                      FEC C00878801
                    </a>
                    ) reports approximately <strong className="text-ink">$112.3 million</strong>. The remainder — the
                    "indirectly" Trump referenced — flows through joint
                    fundraising committees, the RNC, and bundled hard
                    money, channels the FEC doesn't aggregate by donor.
                  </p>
                  <p>
                    On the same stage, Adelson offered another{' '}
                    <strong className="text-ink">$250 million</strong> if Trump pursued a third term.
                    "Think about it," she said. He turned to the crowd
                    and called the offer "very generous." She confirmed:
                    "I will give."
                  </p>
                  <p>
                    SEALED — <em className="italic">The 2016 Promises</em> — is the audit of
                    what Trump promised the country before any of this
                    money flowed. 145 campaign promises, graded against
                    primary-source receipts, in book form.
                  </p>
                  <a
                    href="https://sealed2016.com?utm_source=campaignreceipts&utm_medium=referral&utm_content=adelson-250m"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-5 py-3 transition-colors border border-ink mt-2"
                  >
                    Read SEALED — $15 PDF →
                  </a>
                </div>
              ) : (
                <div className="space-y-4 font-sans text-[15px] sm:text-[16px] text-ink-2 leading-[1.6]">
                  <p>
                    This is one of 585 receipts. Open the dossier for the
                    full vote-by-vote record, every primary source, and
                    the donor-to-vote alignment table.
                  </p>
                  {data.politicianSlug && (
                    <Link
                      href={`/politician/${data.politicianSlug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-5 py-3 transition-colors border border-ink mt-2"
                    >
                      Open {data.candidateName} dossier →
                    </Link>
                  )}
                </div>
              )}

              <div className="mt-7 pt-6 border-t border-dotted border-line">
                <ShareButtons
                  title={data.quote || `${data.candidateName} — campaign receipt`}
                  tagline={data.quoteSource || undefined}
                  source={`receipt-${data.id}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sources panel */}
      {isAnchor && (
        <section className="bg-paper border-b border-line">
          <div className="section-shell py-10">
            <div className="max-w-[860px] mx-auto">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
                Primary sources
              </div>
              <ul className="m-0 p-0 list-none space-y-2.5 font-sans text-[14px] text-ink-2 leading-[1.55]">
                <li>
                  <a
                    href="https://www.fec.gov/data/committee/C00878801/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
                  >
                    FEC Committee C00878801 — Preserve America PAC
                  </a>{' '}
                  · 2024 cycle IE totals
                </li>
                <li>
                  Newsmax, AOL, Common Dreams, Jerusalem Post, Daily Beast,
                  Palestine Chronicle — all reported the White House
                  Hanukkah quote on or after December 16, 2025.
                </li>
                <li>
                  Times of Israel, JTA, Forward — reported the prior $100M
                  Preserve America installment via FEC disclosure, October
                  2024.
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
