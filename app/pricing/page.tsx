import Link from 'next/link';
import type { Metadata } from 'next';

// Pricing / subscribe page. MODEL (founder 2026-06-20): all donor-influence data
// is FREE. The only paid product is the weekly newsletter ($12/mo) — a convenience
// layer that alerts subscribers each week and links them into the free donor maps.

export const metadata: Metadata = {
  title: 'Subscribe | Campaign Receipts',
  description: 'The donor-influence database is free. Subscribe to the weekly newsletter for the story behind the money, delivered every Friday.',
};

export default function PricingPage({ searchParams }: { searchParams: { error?: string } }) {
  const checkoutError = searchParams?.error === 'checkout_not_configured';

  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center gap-12">
      <div className="text-center flex flex-col gap-4 max-w-2xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">Pricing</div>
        <h1 className="text-4xl md:text-5xl font-display font-[800] tracking-[-0.03em] text-primary leading-[1.05]">
          The data is free. The story is <span className="font-serif italic font-normal text-white">$12 a month.</span>
        </h1>
        <p className="text-lg text-text-muted leading-relaxed">
          Every donor map, money trail, and bill connection on Campaign Receipts is free to explore.
          The newsletter is the convenience: each week we surface the trail that matters and drop it in your inbox.
        </p>
      </div>

      {checkoutError && (
        <div className="w-full max-w-md rounded-lg border border-warning/30 bg-warning/10 px-5 py-3 text-sm text-warning text-center">
          Checkout isn’t configured yet. Please try again shortly.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* FREE */}
        <div className="glass-panel p-8 flex flex-col gap-6 border border-white/5">
          <div className="flex flex-col gap-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">Always free</div>
            <div className="text-3xl font-display font-bold text-primary">The full database</div>
          </div>
          <ul className="flex flex-col gap-3 text-sm text-text-muted">
            <li>✓ Donor leaderboard &amp; big-donor map</li>
            <li>✓ Bill money trails &amp; full sponsor lists</li>
            <li>✓ Search any politician, donor, or vote</li>
            <li>✓ Foreign-donor records</li>
            <li>✓ Every page sourced to public FEC filings</li>
          </ul>
          <Link href="/leaderboard" className="btn-secondary mt-auto text-center">Explore for free</Link>
        </div>

        {/* PAID newsletter */}
        <div className="glass-panel p-8 flex flex-col gap-6 border border-accent/20 bg-accent/5 relative overflow-hidden">
          <div className="flex flex-col gap-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent">The Weekly Receipt</div>
            <div className="text-3xl font-display font-bold text-primary">$12<span className="text-lg text-text-muted font-sans font-normal"> / month</span></div>
          </div>
          <ul className="flex flex-col gap-3 text-sm text-text-muted">
            <li>✓ One money trail, explained, every Friday</li>
            <li>✓ We pick the story that matters — no homework</li>
            <li>✓ One-tap links into the donor map for each story</li>
            <li>✓ Read it in five minutes over coffee</li>
            <li>✓ Cancel anytime</li>
          </ul>
          <Link href="/api/checkout?product=newsletter" className="btn-primary bg-accent hover:bg-accent/90 border-none mt-auto text-center">
            Subscribe — $12/mo
          </Link>
        </div>
      </div>

      <p className="text-sm text-text-muted text-center max-w-lg">
        Prefer free? <Link href="/#newsletter" className="text-primary underline underline-offset-4">Join the free list</Link> for occasional updates,
        or browse the <Link href="/leaderboard" className="text-primary underline underline-offset-4">full database</Link> — no account needed.
      </p>
    </section>
  );
}
