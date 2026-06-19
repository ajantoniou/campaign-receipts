// Pricing — THREE columns (founder pricing lock 2026-05-30):
//   1. FREE — leaderboards, all non-Trump promises, the recently-updated feed
//      (names + teaser stat). The hook. No card.
//   2. NEWSLETTER — $12/mo — the weekly Friday money-trail email.
//   3. TERMINAL ACCESS — $500/mo — the alpha dashboard, Polymarket extension,
//      and live Telegram Whale Alerts. The ultimate edge.
//
// The two paid products are bought independently (either, both, or neither) —
// the software does NOT bundle the newsletter. Each paid CTA hits
// /api/checkout?product=newsletter or ?product=software, which wires real Lemon
// Squeezy when the variant IDs are set in .env, else redirects to
// /pricing?error=checkout_not_configured (graceful). See lib/lemonsqueezy.ts.

import Link from 'next/link'

export const metadata = {
  title: 'Pricing — Campaign Receipts',
  description:
    'Read every record free. Get the weekly money trail in your inbox for $29 a month. Or unlock Terminal Access for institutional data advantage with dark money alerts for $500 a month.',
}

function Check() {
  return (
    <span className="font-mono text-ink-3 shrink-0 mt-0.5" aria-hidden>
      •
    </span>
  )
}

export default function PricingPage() {
  return (
    <section className="bg-paper">
      <div className="section-shell py-16 sm:py-24">
        <div className="max-w-[720px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
            Pricing
          </div>
          <h1 className="font-display text-[44px] sm:text-[56px] leading-[1.0] tracking-[-0.012em] text-ink text-balance m-0">
            Pick what you need.
          </h1>
          <p className="mt-5 font-sans text-[17px] text-ink-2 leading-[1.55]">
            Read every record free. Get the money trail in your inbox. Or unlock the 
            Alpha Terminal for an institutional data edge. Take one. Take both. No bundles.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3 max-w-[1080px] items-stretch">
          {/* ─── Column 1 — FREE ─────────────────────────── */}
          <div className="rounded-lg border border-line bg-paper-2 p-6 flex flex-col">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
              Free
            </div>
            <h2 className="font-display text-[26px] leading-[1.1] tracking-[-0.005em] text-ink m-0">
              The whole record
            </h2>
            <div className="mt-2 font-display text-[20px] text-ink">$0</div>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-[1.55]">
              Look up any politician. See who kept their word and who broke it.
            </p>
            <ul className="mt-3 space-y-2 font-sans text-[15px] text-ink-2 list-none p-0 flex-1">
              {[
                'Every leaderboard, free',
                'Every promise we have graded',
                'The latest updates as they land',
                'No card. No signup wall.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Link
                href="/leaderboard"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-line hover:border-ink-3 bg-paper hover:bg-paper-2 font-sans text-[14px] font-medium text-ink px-5 py-2.5 no-underline transition-colors"
              >
                Start free →
              </Link>
            </div>
          </div>

          {/* ─── Column 2 — NEWSLETTER $12 ───────────────── */}
          <div className="rounded-lg border border-line bg-paper p-6 flex flex-col">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
              Newsletter
            </div>
            <h2 className="font-display text-[26px] leading-[1.1] tracking-[-0.005em] text-ink m-0">
              The weekly money trail
            </h2>
            <div className="mt-2 font-display text-[20px] text-ink">
              $0 <span className="font-sans text-[14px] text-ink-3">/ month</span>
            </div>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-[1.55]">
              One email, every Friday morning. Weekly changes in donor influence, major dark money shifts, and closing predictive market trends tied to the story.
            </p>
            <ul className="mt-3 space-y-2 font-sans text-[15px] text-ink-2 list-none p-0 flex-1">
              {[
                'New bills, new donors, new votes',
                'Who paid, who voted, what it bought',
                'Plain English. One short read.',
                'Cancel in one click.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Link
                href="/#newsletter"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink bg-paper hover:bg-paper-2 font-sans text-[14px] font-medium text-ink px-5 py-2.5 no-underline transition-colors"
              >
                Subscribe for free
              </Link>
            </div>
          </div>

          {/* ─── Column 3 — TERMINAL ACCESS $500 ───────── */}
          <div className="rounded-lg border-2 border-[#b3271e] bg-paper p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#b3271e] text-white font-mono text-[10px] uppercase px-2 py-1 tracking-wider rounded-bl-lg">
              Institutional Data
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2">
              Terminal Access · Campaign Finance Intelligence
            </div>
            <h2 className="font-display text-[26px] leading-[1.1] tracking-[-0.005em] text-ink m-0">
              Gain Data Advantage
            </h2>
            <div className="mt-2 font-display text-[20px] text-ink">
              $500 <span className="font-sans text-[14px] text-ink-3">/ month</span>
            </div>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-[1.55]">
              Capitalize on institutional capital flow data with real-time campaign finance intelligence.
            </p>
            <ul className="mt-3 space-y-2 font-sans text-[15px] text-ink-2 list-none p-0 flex-1">
              {[
                'Live Analytics Dashboard',
                'Real-Time Data Anomaly Alerts',
                'Algorithmic API Access',
                'Campaign Finance Context Plugin',
                'Capped at 150 Seats (Edge Protection)',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/api/checkout?product=software"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#b3271e] hover:bg-[#911f18] text-white font-sans text-[14px] font-medium px-5 py-2.5 no-underline transition-colors shadow-sm"
              >
                Apply for Access
              </Link>
            </div>
            <p className="mt-3 font-sans text-[12px] text-ink-3">
              Due to the sensitive nature of this data, we strictly cap membership at 150 seats.
            </p>
          </div>
        </div>

        {/* Who it's for */}
        <div className="mt-14 max-w-[720px]">
          <h2 className="font-display text-[24px] leading-[1.1] text-ink m-0">
            Who uses the Terminal Access
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-paper-2 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#b3271e] font-bold mb-1">
                Institutional Analysts
              </div>
              <p className="font-sans text-[14px] text-ink-2 leading-[1.5] m-0">
                Instantly see the smart money flow into competitive races. Get Chrome Extension overlays for market context and live data anomaly alerts.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-paper-2 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 mb-1">
                Whale Watchers
              </div>
              <p className="font-sans text-[14px] text-ink-2 leading-[1.5] m-0">
                Track multimillion-dollar independent expenditures the second they are filed with the FEC, before the markets adjust.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-4 border-l-4 border-broken bg-paper-2 rounded-r-lg max-w-[720px]">
          <p className="font-sans text-[13px] text-ink-3">
            <strong>Compliance Disclaimer:</strong> Campaign Receipts provides B2B data analytics and campaign finance intelligence. We do not provide sports forecasting, betting tips, or gambling advice. Our services are strictly for informational and research purposes.
          </p>
        </div>
      </div>
    </section>
  )
}
