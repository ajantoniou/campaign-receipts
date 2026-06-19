import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Instrument_Serif } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Link from 'next/link'
import { Wordmark, Button } from './components/cr'
import FridayReceiptsFooterForm from './components/FridayReceiptsFooterForm'
import MobileStickyBookCTA from './components/MobileStickyBookCTA'
import MobileNav from './components/MobileNav'
import AuthNavButton from './components/AuthNavButton'
import { CompanyPhoneLink } from '../../../shared/react/CompanyPhoneLink'

const CF_ANALYTICS_TOKEN = '685f4fcc3a9d4aa880435bd923d36053'

// ── Benchmark type pairing (audit-document aesthetic) ─────────────
// Instrument Serif (display) + Geist (body) + Geist Mono (data labels)
// per claude-design/modes/agent-companies/BENCHMARK.md. Type pairing is
// a hard rule across the AgentCompanies portfolio — CR, SEALED, and
// EstimateProof all share these three families so the sites read as
// one publisher.

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: true, // critical font for hero
})

// Geist + Geist Mono come from the `geist` npm package (the Next 14.2
// next/font/google list doesn't include them in this version). The
// package ships variable fonts with all weights/styles built in.
// CSS variables it exposes: --font-geist-sans, --font-geist-mono.
// We re-alias them as --font-geist and --font-geist-mono in className
// below so tailwind.config.js fontFamily refs stay clean.

export const metadata: Metadata = {
  title: 'CampaignReceipts — Donors → Votes, Bills, Promises, Races.',
  description:
    'The political-media company that ties donors to votes, donors to bills, donors to campaign promises, and donors to races. Sourced from FEC.gov and Congress.gov. Primary-source citation on every verdict.',
  openGraph: {
    title: 'CampaignReceipts — Donors → Votes, Bills, Promises, Races.',
    description:
      'Political-media company tracking donor money to congressional votes, sponsored bills, campaign promises, and won-or-lost races. FEC + Congress.gov primary sources.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased bg-paper text-ink selection:bg-partial-bg selection:text-ink">
        {/* Sitewide entity schema: establishes the CampaignReceipts publisher
            once (Organization) and declares the canonical site + a SearchAction
            so Google can offer a sitelinks search box. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'CampaignReceipts',
              url: 'https://campaignreceipts.com',
              description:
                'Political-media company tying donors to congressional votes, sponsored bills, campaign promises, and races. Sourced from FEC.gov and Congress.gov.',
              sameAs: ['https://www.youtube.com/@CampaignReceiptsYoutube'],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'CampaignReceipts',
              url: 'https://campaignreceipts.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://campaignreceipts.com/directory?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* ───────────── NAV — benchmark anatomy ─────────────
            Paper bg, sticky, 22px Wordmark with 7px ink dot replacing
            the middle space. Per claude-design COMPONENTS.md.

            Mobile: 44px+ touch targets on every nav link (3:1 contrast,
            visible focus rings inherited from base). Methodology +
            Sources are the trust links — they go before About per the
            benchmark's "trust hero comes early" rule. */}
        <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
          <div className="section-shell">
            <div className="h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
              {/* Wordmark + dek. Founder rev-7 (2026-05-19): wordmark
                  carries the new positioning ("live operating system
                  for tracking political incentives") as a mono-cap dek
                  below the wordmark on desktop. Mobile hides the dek
                  for space. */}
              <div className="shrink-0 flex flex-col leading-none">
                <Wordmark size={20} />
                {/* Dek shows on tablet (md, where nav is hidden) and big
                    desktop (xl+, where there's room). Hidden in the
                    squeezed lg range (1024-1280px) where the dek would
                    collide with the desktop nav. Design-pass 2026-05-19. */}
                <span className="hidden md:block lg:hidden xl:block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 mt-1">
                  Political-media · donors → votes, bills, promises, races
                </span>
              </div>

              {/* Desktop nav — primary product surfaces only. Methodology /
                  Sources / About moved to footer; About+Editor lives at
                  /about.

                  "Politicians" (/directory) and the "All 585" button were
                  REMOVED from the top nav per founder 2026-05-30: the deep
                  politician browse is a CR-standard-subscriber surface,
                  reached from the logged-in dashboard, not the public nav.
                  The /politician/* and /directory routes still exist. */}
              <nav className="hidden lg:flex items-center gap-0.5 min-w-0" aria-label="Primary">
                <Link href="/race" className="font-sans text-[13px] text-ink-2 hover:text-ink px-2.5 py-3 -my-1 rounded-md transition-colors border-b border-transparent hover:border-ink">
                  Active Races
                </Link>
                <Link href="/articles" className="font-sans text-[13px] text-ink-2 hover:text-ink px-2.5 py-3 -my-1 rounded-md transition-colors border-b border-transparent hover:border-ink">
                  Articles
                </Link>
                <Link href="/leaderboard" className="font-sans text-[13px] text-ink-2 hover:text-ink px-2.5 py-3 -my-1 rounded-md transition-colors border-b border-transparent hover:border-ink">
                  Leaderboard
                </Link>
                <Link href="/bills" className="font-sans text-[13px] text-ink-2 hover:text-ink px-2.5 py-3 -my-1 rounded-md transition-colors border-b border-transparent hover:border-ink">
                  Newsletter
                </Link>
                <Link href="/for-journalists" className="font-sans text-[13px] text-ink-2 hover:text-ink px-2.5 py-3 -my-1 rounded-md transition-colors border-b border-transparent hover:border-ink">
                  For Journalists
                </Link>
                <AuthNavButton />
              </nav>

              {/* Mobile nav — accessible JS hamburger (button + slide-down overlay) */}
              <MobileNav />
            </div>
          </div>
        </header>

        <main className="min-h-[80vh]">{children}</main>

        {/* Persistent mobile SEALED-book CTA. Founder rev-7 (2026-05-18):
            "traffic is to campaignreceipts and they'll find sealed
            from there" -- SEALED is the only thing we can sell today,
            so every CR page (especially on mobile, where most traffic
            lands) keeps a soft exit ramp visible after the visitor
            scrolls past the hero. Dismissable. */}
        <MobileStickyBookCTA />

        {/* Cloudflare Web Analytics — privacy-friendly, no cookies, free. */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={`{"token": "${CF_ANALYTICS_TOKEN}"}`}
          strategy="afterInteractive"
        />

        {/* ───────────── FOOTER — inverted ink bg ─────────────
            Redesigned 2026-05-30 (4-expert panel): the old 6-column grid
            (The Site / Investigations / For Newsrooms / Trust / Published
            By + a separate newsletter block) read as visual noise. Now:
            a brand + newsletter masthead row on top, then THREE clean
            link groups (Explore / Investigate / Trust & legal), then one
            slim legal + attribution baseline. SEALED Press attribution
            and "Receipts · Not · Rhetoric" preserved.
          */}
        <footer className="bg-ink text-paper mt-12 sm:mt-20" aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">Footer</h2>
          <div className="section-shell pt-16 pb-9">
            {/* Masthead row — brand on the left, newsletter on the right.
                The single most valuable footer action (free email signup)
                gets prime real estate instead of being buried below the
                columns. */}
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16 pb-12 border-b border-paper/15">
              <div>
                <Wordmark size={22} inverse />
                <p className="mt-4 font-sans text-sm text-paper/70 leading-relaxed max-w-sm">
                  We track what politicians said — and what actually happened.
                  Term-scoped verdicts. Receipts on every claim, linked to
                  FEC.gov and Congress.gov.
                </p>
              </div>
              <div className="lg:pl-8 lg:border-l lg:border-paper/15">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60 mb-2">
                  Friday Receipts · free · every week
                </div>
                <h3 className="font-display text-[22px] sm:text-[26px] leading-[1.2] text-paper m-0 mb-4">
                  Who paid to write the bill? We name them every week.
                </h3>
                <FridayReceiptsFooterForm />
              </div>
            </div>

            {/* Three link groups — consolidated from five. */}
            <div className="grid gap-10 sm:grid-cols-3 pt-12">
              <FooterColumn label="Explore">
                <FooterLink href="/leaderboard">Leaderboards</FooterLink>
                <FooterLink href="/promises">Every promise</FooterLink>
                <FooterLink href="/bills">New bills</FooterLink>
                <FooterLink href="/directory">Directory</FooterLink>
                <FooterLink href="/pricing">Pricing</FooterLink>
              </FooterColumn>

              <FooterColumn label="Investigate">
                <FooterLink href="/dual-citizenship">Dual citizenship</FooterLink>
                <FooterLink href="/foreign-donors">Foreign-tied funding</FooterLink>
                <FooterLink href="/betting">Betting markets (beta)</FooterLink>
                <FooterLink href="/for-journalists">For journalists →</FooterLink>
                <FooterLink href="/methodology">Methodology</FooterLink>
                <FooterLink href="/sources">Source archive</FooterLink>
              </FooterColumn>

              <FooterColumn label="Trust & legal">
                <FooterLink href="/about">About + editor</FooterLink>
                <FooterLink href="/corrections">Corrections log</FooterLink>
                <FooterLink href="mailto:disputes@campaignreceipts.com">Dispute a verdict</FooterLink>
                <FooterLink href="/disclaimer">Disclaimer</FooterLink>
                <FooterLink href="/privacy">Privacy</FooterLink>
                <FooterLink href="/terms">Terms of use</FooterLink>
              </FooterColumn>
            </div>

            {/* Baseline — manifesto + attribution + funding, one slim row. */}
            <div className="mt-12 pt-6 border-t border-paper/15 flex flex-col sm:flex-row gap-4 sm:items-baseline justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/70 leading-relaxed">
                Receipts · Not · Rhetoric
                <span className="block mt-2 normal-case tracking-[0.06em] text-paper/40 text-[10px]">
                  © 2026 · Published by{' '}
                  <a
                    href="https://sealed2016.com/?utm_source=campaignreceipts&utm_medium=cross-link&utm_content=global-footer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paper/60 hover:text-paper underline underline-offset-2"
                  >
                    SEALED Press
                  </a>
                </span>
                {/* Channel link — the long-form videos are the top of the
                    funnel; the YouTube glyph is universally recognized so
                    we keep its brand red on the otherwise restrained
                    paper/ink footer. */}
                <a
                  href="https://www.youtube.com/@CampaignReceiptsYoutube"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Watch Campaign Receipts on YouTube"
                  className="group mt-3 inline-flex items-center gap-2 text-paper/60 hover:text-paper transition-colors normal-case tracking-[0.06em]"
                >
                  <YouTubeGlyph className="h-4 w-auto text-[#FF0000] group-hover:text-[#FF0000]" />
                  <span className="underline underline-offset-2">Watch on YouTube</span>
                </a>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50 leading-relaxed max-w-md sm:text-right">
                Independently funded · No advertising · No politician donations
                accepted
                <span className="block mt-1 normal-case tracking-[0.06em] text-paper/40">
                  Revenue: book sales + Donor Intelligence subscriptions.{' '}
                  <CompanyPhoneLink className="text-paper/50 hover:text-paper underline underline-offset-2" />
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

/** Footer column with mono-cap H4 label + Geist sans link list.
 *  Per benchmark COMPONENTS.md Footer anatomy. */
function FooterColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60 font-medium mb-4">
        {label}
      </h4>
      <ul className="space-y-2.5 list-none p-0 m-0">
        {Array.isArray(children) ? children.map((c, i) => <li key={i}>{c}</li>) : <li>{children}</li>}
      </ul>
    </div>
  )
}

/** Footer link — Geist 14px, opacity 0.7→1 on hover. */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:')
  if (isExternal) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="font-sans text-sm text-paper/70 hover:text-paper transition-colors"
      >
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className="font-sans text-sm text-paper/70 hover:text-paper transition-colors">
      {children}
    </Link>
  )
}

/** YouTube wordmark glyph — the official rounded-rect play badge.
 *  Inline SVG (no icon dep) so it renders at exact brand red and
 *  inherits sizing from className. currentColor drives the badge fill
 *  so the play triangle stays the footer's paper color. */
function YouTubeGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}
