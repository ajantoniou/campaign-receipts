// Pricing — THREE columns (founder pricing lock 2026-05-30):
//   1. FREE — leaderboards, all non-Trump promises, the recently-updated feed
//      (names + teaser stat). The hook. No card.
//   2. NEWSLETTER — $12/mo — the weekly Friday money-trail email.
//   3. DONOR INTELLIGENCE — $45/mo — the /investigate search: any politician,
//      donor, bill, or vote → a sourced dossier that connects the money.
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
    'Read every record free. Get the weekly money trail in your inbox for $12 a month. Or search any donor, bill, or vote and pull a sourced dossier for $45 a month.',
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
            Read every record free. Get the money trail in your inbox. Or search
            it yourself. Take one. Take both. No bundles.
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
              $12 <span className="font-sans text-[14px] text-ink-3">/ month</span>
            </div>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-[1.55]">
              One email, every Friday morning. The week's bills, the donors
              behind them, and how the votes fell.
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
                href="/api/checkout?product=newsletter"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink bg-paper hover:bg-paper-2 font-sans text-[14px] font-medium text-ink px-5 py-2.5 no-underline transition-colors"
              >
                Get the newsletter
              </Link>
            </div>
          </div>

          {/* ─── Column 3 — DONOR INTELLIGENCE $45 ───────── */}
          <div className="rounded-lg border-2 border-ink bg-paper p-6 flex flex-col">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2">
              Donor Intelligence · for reporters &amp; watchdogs
            </div>
            <h2 className="font-display text-[26px] leading-[1.1] tracking-[-0.005em] text-ink m-0">
              Search the money yourself
            </h2>
            <div className="mt-2 font-display text-[20px] text-ink">
              $45 <span className="font-sans text-[14px] text-ink-3">/ month</span>
            </div>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-[1.55]">
              Type any politician, donor, bill, or vote. Get a sourced dossier
              that connects the dots a person can't connect alone.
            </p>
            <ul className="mt-3 space-y-2 font-sans text-[15px] text-ink-2 list-none p-0 flex-1">
              {[
                'Search 585 politicians + 2,268 donor PACs',
                'See who else your donor funds',
                'Every dollar shows its FEC source',
                'Built for newsrooms and watchdog groups',
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
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-ink hover:bg-ink-2 text-paper font-sans text-[14px] font-medium px-5 py-2.5 no-underline transition-colors"
              >
                Get Donor Intelligence
              </Link>
            </div>
            <p className="mt-3 font-sans text-[12px] text-ink-3">
              One flat price — $45/mo for newsrooms and citizens alike.{' '}
              <Link href="/for-journalists" className="text-broken underline underline-offset-2">
                For reporters
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Who it's for */}
        <div className="mt-14 max-w-[720px]">
          <h2 className="font-display text-[24px] leading-[1.1] text-ink m-0">
            Who uses Donor Intelligence
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-paper-2 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 mb-1">
                Reporters
              </div>
              <p className="font-sans text-[14px] text-ink-2 leading-[1.5] m-0">
                Pull a sourced money trail for any race in seconds. Every number
                links back to the FEC filing.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-paper-2 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 mb-1">
                Citizen watchdogs
              </div>
              <p className="font-sans text-[14px] text-ink-2 leading-[1.5] m-0">
                Built for watchdog groups that track who funds the votes they
                fight. Search the donor, see every politician they pay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
