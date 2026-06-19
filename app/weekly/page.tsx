// Worst Broken Promise of the Week — the recurring screenshot hook.
// Migrated to paper-warm benchmark per claude-design audit (rev-7
// batch C #5). Old version used the legacy dark ink-900 theme that
// no longer matches the rest of the site. New version uses Receipt
// + Stamp + RRow primitives so the share-screenshot reads as part
// of the same publisher.
//
// Influencer agent flagged this page as the "give creators a content
// calendar they don't have to think about" P1 — every Monday a fresh
// shareable verdict. Cron writes to cr_weekly; this page renders the
// latest pick prominently with an archive list below.

import Link from 'next/link'
import { supabaseService, type Politician } from '@/lib/supabase'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import ShareButtons from '@/app/components/ShareButtons'
import SealedBookBand from '@/app/components/SealedBookBand'
import NewsletterCapture from '@/app/components/NewsletterCapture'
import { Receipt, Tag, partyVariant } from '@/app/components/cr'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Worst Broken Promise of the Week — CampaignReceipts',
  description:
    'Every Monday: the highest-impact broken campaign promise of the week, with primary-source citations. Subscribe via RSS.',
  openGraph: {
    title: 'Worst Broken Promise of the Week',
    description:
      'Every Monday: the highest-impact broken campaign promise of the week, with primary-source citations.',
    images: [{ url: '/weekly/opengraph-image' }],
  },
}

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

async function getLatest(): Promise<{ row: WeeklyRow | null; politician: Politician | null }> {
  const { data: rows } = await supabaseService
    .from('cr_weekly')
    .select('*')
    .order('iso_year', { ascending: false })
    .order('iso_week', { ascending: false })
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

async function getArchive(): Promise<WeeklyRow[]> {
  const { data } = await supabaseService
    .from('cr_weekly')
    .select('*')
    .order('iso_year', { ascending: false })
    .order('iso_week', { ascending: false })
    .limit(50)
  return (data || []) as WeeklyRow[]
}

function fmtWeek(r: WeeklyRow) {
  // Anchor week label to its Monday for human readability.
  const simple = new Date(Date.UTC(r.iso_year, 0, 1 + (r.iso_week - 1) * 7))
  const dayOfWeek = simple.getUTCDay()
  const monday = new Date(simple)
  if (dayOfWeek <= 4) monday.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1)
  else monday.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay())
  return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function WeeklyPage() {
  const { row, politician } = await getLatest()
  const archive = await getArchive()

  return (
    <>
      {/* ───── MASTHEAD (paper-2 band) ────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="max-w-2xl">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
                Recurring · every Monday 9am ET
              </div>
              <h1 className="font-display text-[44px] sm:text-[60px] leading-[0.96] tracking-[-0.015em] text-ink text-balance m-0">
                Worst broken promise of the week.
              </h1>
              <p className="mt-4 font-sans text-[16px] text-ink-2 leading-[1.55]">
                Every Monday we pick the highest-impact broken campaign promise
                from our corpus. Primary-source citations on every verdict.
                One short read. One screenshot-able receipt.
              </p>
            </div>
            <Link
              href="/weekly/rss.xml"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper hover:bg-paper-3 hover:border-ink-3 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink no-underline transition-colors"
            >
              <span aria-hidden>📡</span> RSS feed
            </Link>
          </div>
        </div>
      </section>

      {/* ───── LATEST PICK (the share asset) ─────────────── */}
      <section className="section-shell pt-10 sm:pt-14 pb-2">
        <div className="max-w-[760px] mx-auto">
          {!row && (
            <div className="rounded-lg border border-line bg-paper-2 p-12 text-center">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-3">
                Awaiting first pick
              </div>
              <p className="font-sans text-[15px] text-ink-2 leading-relaxed max-w-md mx-auto m-0">
                First Monday pick lands shortly. Subscribe via RSS to catch it,
                or sign up for the Bill Donor Influence newsletter below.
              </p>
            </div>
          )}

          {row && politician && (
            <div className="space-y-5">
              {/* Politician identification slab — sits above the Receipt
                  so the share asset reads at a glance: who, then why. */}
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
                  <h2 className="mt-4 font-display italic text-[22px] sm:text-[26px] leading-[1.1] tracking-[-0.005em] text-ink text-balance m-0">
                    "{row.headline}"
                  </h2>
                </div>
              </div>

              {/* Canonical receipt — the share asset. Perforated edges,
                  tilted Broken stamp, primary-source identifier. */}
              <Receipt
                id={`RCPT-WEEKLY-${row.iso_year}W${String(row.iso_week).padStart(2, '0')}`}
                title={`Week of ${fmtWeek(row)}`}
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
                  { k: 'Week', v: fmtWeek(row), sans: true },
                  { k: 'Picked at', v: new Date(row.picked_at).toISOString().slice(0, 10), sans: true },
                ]}
                footLeft={`Cite as: weekly/${row.iso_year}/w${row.iso_week}`}
                footRight="campaignreceipts.com"
              />
            </div>
          )}

          {row && politician && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/politician/${politician.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink"
              >
                Full scorecard on {politician.name} →
              </Link>
              {row.share_image_url && (
                <a
                  href={row.share_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink"
                >
                  Open share-card →
                </a>
              )}
            </div>
          )}

          {row && politician && (
            <div className="mt-4">
              <ShareButtons
                title={row.headline}
                tagline={`Worst broken promise · week of ${fmtWeek(row)}`}
                source="weekly-page"
              />
            </div>
          )}
        </div>
      </section>

      <section className="section-shell py-10 sm:py-12">
        <div className="max-w-[760px] mx-auto">
          <NewsletterCapture
            variant="inline-wide"
            surface="weekly-page"
            heading="Want the weekly money trail?"
            body="Join the free list for occasional updates — or get the $12 weekly newsletter that names the donors behind every bill. See pricing."
            buttonLabel="Join the free list"
          />
        </div>
      </section>

      {/* ───── ARCHIVE ──────────────────────────────────── */}
      {archive.length > 1 && (
        <section className="bg-paper-2 border-t border-line mt-14">
          <div className="section-shell py-12 sm:py-16">
            <div className="max-w-[760px] mx-auto">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
                Archive · past picks
              </div>
              <h2 className="font-display text-[28px] sm:text-[32px] leading-[1.1] tracking-[-0.005em] text-ink m-0 mb-6">
                Every Monday, going back.
              </h2>
              <ol className="m-0 p-0 list-none space-y-2">
                {archive.slice(1).map((r) => (
                  <li
                    key={`${r.iso_year}-${r.iso_week}`}
                    className="rounded-lg border border-line bg-paper hover:bg-paper-3 hover:border-ink-3 transition-all p-4"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 mb-1.5">
                      Week of {fmtWeek(r)}
                    </div>
                    <div className="font-sans text-[15px] text-ink leading-[1.4]">
                      {r.headline}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      <SealedBookBand placement="weekly" />
    </>
  )
}
