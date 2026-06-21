import Link from 'next/link';
import type { Metadata } from 'next';

// Pricing / subscribe page. MODEL (founder 2026-06-20): all donor-influence data
// is FREE. The only paid product is the weekly newsletter — a convenience layer
// that alerts subscribers and links into the free donor maps.
//
// CRO (conversion-expert review 2026-06-20): reframe from "convenience" to
// "the catch / fund the watchdog" (membership framing supports the price), and
// make the ANNUAL plan the default/highlighted choice (monthly newsletter churn
// caps the model otherwise). Founding-member price adds urgency for early subs.

export const metadata: Metadata = {
  title: 'Subscribe | Campaign Receipts',
  description: 'The donor-influence database is free. Subscribe to the weekly newsletter — we catch the one money trail that matters each week and fund the watchdog that finds it.',
};

export default function PricingPage({ searchParams }: { searchParams: { error?: string } }) {
  const checkoutError = searchParams?.error === 'checkout_not_configured';

  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center gap-12">
      <div className="text-center flex flex-col gap-4 max-w-2xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">Membership</div>
        <h1 className="text-4xl md:text-5xl font-display font-[800] tracking-[-0.03em] text-primary leading-[1.05]">
          47,000 filings hit the FEC every week. <span className="font-serif italic font-normal text-white">We catch the one that matters.</span>
        </h1>
        <p className="text-lg text-text-muted leading-relaxed">
          Every donor map and money trail on Campaign Receipts is free. Members fund the watchdog that
          reads the filings, finds the one trail behind this week’s vote, and sends it to you Friday —
          with a one-tap link straight into the map. You’re not buying an email. You’re funding the receipts.
        </p>
      </div>

      {checkoutError && (
        <div className="w-full max-w-md rounded-lg border border-warning/30 bg-warning/10 px-5 py-3 text-sm text-warning text-center">
          Checkout isn’t configured yet. Please try again shortly.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
        {/* FREE */}
        <div className="glass-panel p-8 flex flex-col gap-6 border border-white/5">
          <div className="flex flex-col gap-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">Always free</div>
            <div className="text-2xl font-display font-bold text-primary">The full database</div>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm text-text-muted">
            <li>✓ Donor leaderboard &amp; big-donor map</li>
            <li>✓ Bill money trails &amp; full sponsor lists</li>
            <li>✓ Search any politician, donor, or vote</li>
            <li>✓ Foreign-donor records</li>
            <li>✓ Sourced to public FEC filings</li>
          </ul>
          <Link href="/leaderboard" className="btn-secondary mt-auto text-center">Explore free</Link>
        </div>

        {/* ANNUAL — the default / highlighted plan */}
        <div className="glass-panel p-8 flex flex-col gap-6 border-2 border-accent bg-accent/5 relative overflow-hidden md:-mt-3 md:mb-[-0.75rem]">
          <div className="absolute top-0 right-0 bg-accent text-background text-[10px] font-mono font-bold px-4 py-1.5 tracking-wider rounded-bl-lg">
            BEST VALUE
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent">Annual</div>
            <div className="text-3xl font-display font-bold text-primary">
              $8<span className="text-lg text-text-muted font-sans font-normal"> / mo</span>
            </div>
            <div className="text-xs text-text-muted">$96 billed yearly — 2 months free</div>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm text-text-muted">
            <li>✓ The one money trail that matters, every Friday</li>
            <li>✓ One-tap into the donor map for each story</li>
            <li>✓ Be first to know when money moves a vote</li>
            <li>✓ Fund an independent follow-the-money watchdog</li>
            <li>✓ Cancel anytime · 7-day money-back</li>
          </ul>
          <Link href="/api/checkout?plan=newsletter-annual" className="btn-primary bg-accent hover:bg-accent/90 border-none mt-auto text-center">
            Join — $96/yr
          </Link>
        </div>

        {/* MONTHLY */}
        <div className="glass-panel p-8 flex flex-col gap-6 border border-white/5">
          <div className="flex flex-col gap-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">Monthly</div>
            <div className="text-3xl font-display font-bold text-primary">
              $12<span className="text-lg text-text-muted font-sans font-normal"> / mo</span>
            </div>
            <div className="text-xs text-text-muted">Billed monthly · cancel anytime</div>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm text-text-muted">
            <li>✓ The one money trail that matters, every Friday</li>
            <li>✓ One-tap into the donor map for each story</li>
            <li>✓ Be first to know when money moves a vote</li>
            <li>✓ Cancel anytime · 7-day money-back</li>
          </ul>
          <Link href="/api/checkout?plan=newsletter" className="btn-secondary mt-auto text-center">
            Subscribe — $12/mo
          </Link>
        </div>
      </div>

      {/* Founding member — urgency / early-believer */}
      <div className="w-full max-w-2xl rounded-xl border border-accent/30 bg-accent/[0.04] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent">Founding member · first 1,000</div>
          <div className="text-sm text-text-muted">Lock in <span className="text-primary font-bold">$79/yr forever</span> — the price never goes up while you stay a member.</div>
        </div>
        <Link href="/api/checkout?plan=newsletter-founding" className="btn-primary text-sm whitespace-nowrap">
          Become a founding member
        </Link>
      </div>

      <p className="text-sm text-text-muted text-center max-w-lg">
        Not ready? <Link href="/#newsletter" className="text-primary underline underline-offset-4">Get the free weekly headline</Link> —
        we’ll send the trail of the week and you’ll see exactly what members get. Or browse the
        {' '}<Link href="/leaderboard" className="text-primary underline underline-offset-4">full database</Link>, free, no account.
      </p>
    </section>
  );
}
