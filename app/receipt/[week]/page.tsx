// /receipt/[week] — stable permalink for a specific Receipt-of-the-Week pick.
//
// /weekly renders "the current pick + an archive". This route is its
// permalink counterpart: a URL you can drop into a tweet, email, or
// Instantly cold-email body and trust will resolve to the same Receipt
// six months from now even after the front page rolls.
//
// URL shape: /receipt/2026-W20  (ISO year + ISO week, zero-padded)
//
// Founder framing (May 19 2026): "/r/[id] covers it functionally today,
// low-leverage to build right now" — built anyway because (a) it's a
// 1-screen file and (b) the weekly cohort outreach hooks reference
// /receipt/<week> in a few drafts; killing the 404 risk is worth 30 min.
//
// generateMetadata builds canonical OG tags pointing at the existing
// /api/card/headline/[slug] PNG endpoint so social previews stay rich.
//
// No archive list, no SealedBookBand bottom CTA — this is a focused
// permalink. Use /weekly for the magazine view.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseService, type Politician } from '@/lib/supabase'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import ShareButtons from '@/app/components/ShareButtons'
import { Receipt, Tag, partyVariant } from '@/app/components/cr'
import * as apCitation from '@/lib/ap-citation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type WeeklyRow = {
  iso_year: number
  iso_week: number
  picked_at: string
  promise_id: string
  politician_id: string
  headline: string
  blurb: string
  share_image_url: string | null
}

// Accepts: "2026-W20", "2026W20", "2026-w20" (lenient — typos shouldn't 404)
function parseWeekParam(raw: string): { year: number; week: number } | null {
  const m = /^(\d{4})[-_]?[Ww]?(\d{1,2})$/.exec(raw.trim())
  if (!m) return null
  const year = parseInt(m[1], 10)
  const week = parseInt(m[2], 10)
  if (year < 2020 || year > 2100) return null
  if (week < 1 || week > 53) return null
  return { year, week }
}

async function getWeek(year: number, week: number): Promise<{
  row: WeeklyRow | null
  politician: Politician | null
}> {
  const { data: rows } = await supabaseService
    .from('cr_weekly')
    .select('*')
    .eq('iso_year', year)
    .eq('iso_week', week)
    .limit(1)
  const row = (rows?.[0] as WeeklyRow | undefined) || null
  if (!row) return { row: null, politician: null }
  const { data: pol } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('id', row.politician_id)
    .maybeSingle()
  return { row, politician: (pol as Politician | null) || null }
}

function fmtWeek(year: number, week: number) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const dayOfWeek = simple.getUTCDay()
  const monday = new Date(simple)
  if (dayOfWeek <= 4) monday.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1)
  else monday.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay())
  return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function generateMetadata({ params }: { params: { week: string } }) {
  const parsed = parseWeekParam(params.week)
  if (!parsed) return { title: 'Receipt — CampaignReceipts' }
  const { row, politician } = await getWeek(parsed.year, parsed.week)
  if (!row || !politician) {
    return {
      title: `Receipt · week of ${fmtWeek(parsed.year, parsed.week)} — CampaignReceipts`,
      description: 'No pick on file for this week.',
    }
  }
  const title = `${politician.name}: ${row.headline}`
  const description = row.blurb || 'Worst broken promise of the week — primary-source citations.'
  const ogImage = `/api/card/headline/${politician.slug}`
  const canonical = `/receipt/${parsed.year}-W${String(parsed.week).padStart(2, '0')}`
  return {
    title: `${title} — CampaignReceipts`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ReceiptWeekPermalink({
  params,
}: {
  params: { week: string }
}) {
  const parsed = parseWeekParam(params.week)
  if (!parsed) notFound()
  const { row, politician } = await getWeek(parsed.year, parsed.week)
  if (!row || !politician) notFound()

  const weekLabel = fmtWeek(parsed.year, parsed.week)
  const weekTag = `${parsed.year}-W${String(parsed.week).padStart(2, '0')}`

  return (
    <>
      {/* ───── MASTHEAD ─────────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="max-w-[760px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
              Receipt · week of {weekLabel} · {weekTag}
            </div>
            <h1 className="font-display text-[36px] sm:text-[48px] leading-[1.0] tracking-[-0.012em] text-ink text-balance m-0">
              {row.headline}
            </h1>
            <div className="mt-4">
              <Link
                href="/weekly"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                ← All weekly receipts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── RECEIPT BODY ─────────────────────────────── */}
      <section className="section-shell pt-10 sm:pt-14 pb-14">
        <div className="max-w-[760px] mx-auto space-y-5">
          {/* Politician slab */}
          <div className="flex items-start gap-4 sm:gap-5 p-5 rounded-lg border border-line bg-paper">
            <PoliticianAvatar
              name={politician.name}
              party={politician.party}
              photoUrl={politician.photo_url}
              size="md"
              className="border border-line bg-paper shrink-0"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/politician/${politician.slug}`}
                className="font-display text-[24px] sm:text-[28px] leading-[1.1] tracking-[-0.005em] text-ink no-underline hover:underline underline-offset-4 decoration-line hover:decoration-ink m-0 block"
              >
                {politician.name}
              </Link>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Tag variant={partyVariant(politician.party)}>
                  {politician.party}
                  {politician.state ? ` · ${politician.state}` : ''}
                  {' · '}
                  {politician.branch}
                </Tag>
              </div>
            </div>
          </div>

          {/* The Receipt — canonical share asset */}
          <Receipt
            id={`RCPT-WEEKLY-${parsed.year}W${String(parsed.week).padStart(2, '0')}`}
            title={`Week of ${weekLabel}`}
            headerRight={
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                Picked {new Date(row.picked_at).toISOString().slice(0, 10)}
              </span>
            }
            verdict="broken"
            stampLabel="Broken"
            verdictCopy={row.blurb}
            rows={[
              {
                k: 'Politician',
                v: (
                  <Link
                    href={`/politician/${politician.slug}`}
                    className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
                  >
                    {politician.name}
                  </Link>
                ),
              },
              {
                k: 'Seat',
                v: `${politician.party}${politician.state ? ` · ${politician.state}` : ''} · ${politician.branch}`,
                sans: true,
              },
              { k: 'Week', v: weekLabel, sans: true },
              { k: 'Picked at', v: new Date(row.picked_at).toISOString().slice(0, 10), sans: true },
            ]}
            footLeft={`Cite as: receipt/${weekTag}`}
            citation={apCitation.forWeeklyReceipt({
              iso_year: parsed.year,
              iso_week: parsed.week,
              headline: row.headline,
              politicianName: politician.name,
            })}
            footRight="campaignreceipts.com"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              href={`/politician/${politician.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink"
            >
              Full scorecard on {politician.name} →
            </Link>
            <a
              href={`/api/card/strip/${politician.slug}`}
              download
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:text-amber-text transition-colors underline underline-offset-4 decoration-line hover:decoration-amber-text"
            >
              ↓ Share strip · PNG
            </a>
          </div>

          <ShareButtons
            title={row.headline}
            tagline={`Receipt · week of ${weekLabel}`}
            source="receipt-permalink"
          />
        </div>
      </section>
    </>
  )
}
