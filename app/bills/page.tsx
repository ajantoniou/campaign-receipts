// /bills — the PAID NEWSLETTER landing.
//
// Pricing (founder 2026-06-20): the weekly newsletter is $9/mo FLAT — all
// federal AND state bills, one price. The CTA goes to the real checkout:
// /api/checkout?product=newsletter ($9/mo, LemonSqueezy overlay).
//
// Each bill comes with four things: who sponsored it, who paid them to
// sponsor it, who's voting, and who paid them to vote that way. We already
// traced the money — subscribers just read who paid for it.
//
// Free taste: the announcement list (NewsletterCapture, surface='bill') gets
// the weekly headline. The full trail is the $9 paid weekly.

import { Receipt, Tag } from '@/app/components/cr'
import NewsletterCapture from '@/app/components/NewsletterCapture'
import HowItWorksFlow from '@/app/components/HowItWorksFlow'
import BillsSearch from '@/app/components/BillsSearch'

export const metadata = {
  title: 'Friday Receipts — the weekly money trail | CampaignReceipts',
  description:
    "The week's money trail in your inbox, every Friday. Who paid for the bill, and who voted their way. Sourced to the filing. $9/mo.",
  alternates: { canonical: '/bills' },
}

export default function NewBillsPage() {
  return (
    <>
      {/* MASTHEAD */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
              The newsletter
            </div>
            <h1 className="font-display text-[44px] sm:text-[60px] leading-[0.96] tracking-[-0.01em] text-ink text-balance">
              Friday Receipts.<br />The weekly money trail.
            </h1>
            <p className="mt-5 font-sans text-[17px] text-ink-2 leading-relaxed max-w-2xl">
              Every Friday morning, one email. The new bills, the donors
              behind them, and the votes the money is shaping.
            </p>
            <p className="mt-3 font-sans text-[16px] text-ink-2 leading-relaxed max-w-2xl">
              We read the FEC filings and the roll calls so you don't have
              to. You get the receipts. Who sponsored a bill. Who paid the
              sponsor. Who's voting, and who paid them.
            </p>
            <p className="mt-3 font-sans text-[15px] text-ink-3 leading-relaxed max-w-2xl">
              No spin. No jargon. Every number traces back to a filing. All
              bills, federal and state. $9/mo. Cancel anytime.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-6 py-3 transition-colors border border-ink"
              >
                Get Friday Receipts →
              </a>
              <a
                href="#free"
                className="font-sans text-[14px] text-ink-2 hover:text-ink underline underline-offset-4"
              >
                Or get free updates
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — animated walkthrough of what you get */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <HowItWorksFlow
          kicker="How it works"
          heading="One bill. The whole money trail."
          steps={[
            { label: 'Step 1', title: 'A new bill drops.', body: 'We pick the ones that matter this week.' },
            { label: 'Step 2', title: 'Who sponsored it?', body: 'The name, the party, the state.' },
            { label: 'Step 3', title: 'Who paid them?', body: 'The top donors behind the sponsor.' },
            { label: 'Step 4', title: 'Who voted, and why?', body: 'Each vote, lined up with the money.' },
          ]}
        />
      </section>

      {/* SAMPLE — REAL LIVE DATA */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <div className="max-w-[760px] mx-auto mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            One real bill from this week's data
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            Here is what one email looks like.
          </h2>
          <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
            Three big stories, told plainly — each with the sourced figures
            and a link to the full write-up. The rest of the week's money
            moves, listed clean. Here is one of those stories.
          </p>
          <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
            Rep. French Hill wrote a bill to set the rules for crypto. His
            top donor industry is finance. Crypto donors come in third. The
            newsletter lines that up for you, in plain words.
          </p>
        </div>

        <div className="max-w-[760px] mx-auto">
          <Receipt
            id="RCPT-HR-3633"
            title="H.R. 3633 — Digital Asset Market Clarity Act of 2025"
            headerRight={<Tag>Federal · 119th</Tag>}
            rows={[
              { k: 'Who sponsored it', v: 'Rep. French Hill (R-AR)', sans: true },
              { k: 'What it does', v: 'Sets the rules for crypto markets', sans: true },
              { k: 'Who paid the sponsor most', v: 'Finance — $109,000', sans: true },
              { k: 'Crypto money to the sponsor', v: '$28,900 (3rd biggest)', sans: true },
              { k: 'Where it is now', v: 'Passed the House · in the Senate', sans: true },
              { k: 'Read the bill', v: 'congress.gov/bill/119th-congress/house-bill/3633', sans: true },
            ]}
            verdict="pending"
            stampLabel="Moving"
            footLeft="★ Sample email — subscribers get one every Friday"
            footRight="campaignreceipts.com/bills"
          />
          <p className="mt-4 font-sans text-[13px] text-ink-3 leading-relaxed">
            Money figures are donor-industry totals to the sponsor, from FEC
            filings. When the vote lands, you also get who paid each yes and
            each no.
          </p>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            What you get
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            The bill, the money, the vote.
          </h2>
          <ul className="mt-5 space-y-3 font-sans text-[15px] text-ink-2 leading-relaxed list-none p-0">
            <li><strong className="font-medium text-ink">Who sponsored it.</strong> The name, the party, the state.</li>
            <li><strong className="font-medium text-ink">Who paid them to sponsor it.</strong> Top donor industries behind the sponsor.</li>
            <li><strong className="font-medium text-ink">Who is voting on it.</strong> The roll-call, when it lands.</li>
            <li><strong className="font-medium text-ink">Who paid them to vote that way.</strong> Each vote, lined up with the money.</li>
            <li><strong className="font-medium text-ink">Every bill, federal and state.</strong> No tiers. One price covers it all.</li>
            <li><strong className="font-medium text-ink">A link to the real bill, every time.</strong> Congress.gov, so you can check us.</li>
          </ul>
        </div>
      </section>

      {/* PRICE — FLAT $9 */}
      <section id="price" className="section-shell py-12 sm:py-16 bg-paper-2 scroll-mt-20">
        <div className="max-w-[760px] mx-auto text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            The price
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            One price. Every bill.
          </h2>
          <p className="mt-4 font-sans text-[17px] text-ink-2 leading-relaxed">
            $9/mo. All federal bills. All 50 states. Cancel anytime.
          </p>
          <div className="mt-7">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-7 py-3.5 transition-colors border border-ink"
            >
              Get Friday Receipts →
            </a>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            No tiers · No add-ons · One-click cancel
          </p>
        </div>
      </section>

      {/* FIND AN OLDER BILL — search past bills */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <BillsSearch />
      </section>

      {/* FREE TASTE — ANNOUNCEMENT LIST */}
      <section id="free" className="section-shell py-12 sm:py-16 scroll-mt-20">
        <div className="max-w-[760px] mx-auto">
          <NewsletterCapture
            variant="inline-receipt"
            surface="bill"
            heading="Not ready to pay? Get free updates."
            body="The free list gets the weekly headline. Want a bill every Friday with the full money trail behind it? That is the $9 newsletter above."
            buttonLabel="Get free updates"
          />
        </div>
      </section>
    </>
  )
}
