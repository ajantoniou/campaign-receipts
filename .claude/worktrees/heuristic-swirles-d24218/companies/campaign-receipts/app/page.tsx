// Homepage — THE ENGINE (rebuild 2026-06-17, web-ux-director verdict).
//
// The search engine IS the product, so the homepage IS the engine. Four
// zones, engine-dominant, ~2.5 screens:
//   1. Full-bleed search hero (the box owns the first screen).
//   2. One pre-pulled example dossier (Adelson → $250M → Trump) — the
//      empty-box cure, rendered from the anchor-card table at $0 cost.
//   3. One discovery strip: four LINKS (not sections) to the SEO surfaces.
//   4. One pricing line.
//
// The old ten-section marketing homepage moved OFF the landing page: the
// races / leaderboards / influence chart / foreign-influence / Trump
// mega-donors / value ladder all live at their own routes (still in the
// sitemap + footer), reachable from the discovery strip. Hidden from the
// landing page, not deleted from the site.

import Link from 'next/link'
import HomeSearchHero from './components/HomeSearchHero'
import LiveActivityStrip from './components/LiveActivityStrip'
import { getAnchorCard } from '@/lib/anchor-cards'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

const DISCOVERY = [
  {
    href: '/race',
    label: 'The big races',
    dek: "Who's spending millions to win — by name and amount.",
  },
  {
    href: '/who-funds/pro-israel',
    label: 'Who took pro-Israel money',
    dek: 'The PAC funding ledger — and who took $0.',
  },
  {
    href: '/leaderboard',
    label: 'The leaderboards',
    dek: 'Biggest donors, votes that match the money, who paid the sponsors.',
  },
  {
    href: '/articles',
    label: "This week's receipts",
    dek: 'The new filings, connected — one story a week.',
  },
]

export default async function HomePage() {
  const anchor = getAnchorCard('adelson-250m')
  const adelson = anchor?.topDonors?.[0] // Miriam Adelson → $250M

  return (
    <>
      {/* ───── LIVE ACTIVITY TICKER ──────────────────────────────── */}
      <LiveActivityStrip />

      {/* ───── ZONE 1 — THE ENGINE (full-bleed search hero) ──────── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-20 sm:pb-14">
          <div className="max-w-[860px] mx-auto text-center">
            <HomeSearchHero centered />
          </div>

          {/* ── ZONE 2 — the pre-pulled example dossier (empty-box cure) ── */}
          {anchor && adelson && (
            <div className="mt-10 sm:mt-12 max-w-[640px] mx-auto">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 text-center mb-3">
                Or see one we already pulled
              </div>
              <Link
                href="/investigate?type=politician&id=donald-trump"
                className="group block rounded-lg border border-line bg-paper-2 hover:bg-paper-3 hover:border-ink-3 transition-all p-5 sm:p-6 no-underline cta-lift"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-broken mb-1">
                      Donor
                    </div>
                    <div className="font-display text-[22px] sm:text-[26px] leading-tight text-ink truncate">
                      Miriam Adelson
                    </div>
                    <div className="mt-1 font-sans text-[14px] text-ink-2">
                      The biggest known single backer of{' '}
                      <span className="text-ink font-medium">Donald J. Trump</span> since 2016.
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-[34px] sm:text-[40px] leading-none tabular-nums text-broken tracking-[-0.02em]">
                      {fmtUsd(adelson.amount)}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3 mt-1">
                      to Trump
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                    Source · FEC {anchor.fecFilingId}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink group-hover:text-broken transition-colors">
                    See the full dossier →
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ───── ZONE 3 — discovery strip (the SEO surfaces, as doors) ── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell py-10 sm:py-12">
          <div className="max-w-[1080px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-5">
              Don&apos;t know where to start? Browse the money.
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DISCOVERY.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="group block rounded-lg border border-line bg-paper hover:bg-paper-3 hover:border-ink-3 transition-all p-4 no-underline"
                >
                  <div className="font-display text-[18px] leading-tight text-ink">{d.label}</div>
                  <div className="mt-1.5 font-sans text-[13px] text-ink-2 leading-snug">{d.dek}</div>
                  <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 group-hover:text-broken transition-colors">
                    Open →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── ZONE 4 — one pricing line ─────────────────────────── */}
      <section className="bg-paper">
        <div className="section-shell py-10 sm:py-12">
          <div className="max-w-[860px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="font-display text-[20px] sm:text-[24px] leading-[1.2] text-ink m-0 text-balance">
              Free is last month. <span className="text-broken">$9</span> gets this week.{' '}
              <span className="text-broken">$45</span> searches it all.
            </p>
            <Link
              href="/pricing"
              className="cta-lift shrink-0 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-6 py-3 border border-ink no-underline"
            >
              See what you get →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
