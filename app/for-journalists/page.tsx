// /for-journalists — the JOURNALIST-FACING landing for the same $45/mo
// Donor Intelligence search (the /investigate product).
//
// Founder pricing lock 2026-05-30: ONE flat price. $45/mo for everyone —
// reporters and active citizens alike. No firm tier, no price-discovery
// capture. CTA routes to the real checkout (/api/checkout?product=software)
// and the free try (/investigate). Keep the newsroom-credibility framing:
// sourced FEC data, search any bill/politician/donor/vote, updated daily,
// a citation on every line.

import Link from 'next/link'
import { Receipt, Tag } from '@/app/components/cr'
import HowItWorksFlow from '@/app/components/HowItWorksFlow'

export const metadata = {
  title: 'The donor database for reporters | CampaignReceipts',
  description:
    'Search any bill, politician, donor, or vote. See who paid them. Cross-linked, updated daily, sourced. Free. Built for newsrooms.',
}

export default function ForJournalistsPage() {
  return (
    <>
      {/* MASTHEAD */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
              For reporters and watchdogs
            </div>
            <h1 className="font-display text-[44px] sm:text-[60px] leading-[0.96] tracking-[-0.01em] text-ink text-balance m-0">
              Name a bill. See who paid for it.
            </h1>
            <p className="mt-5 font-sans text-[17px] text-ink-2 leading-relaxed max-w-2xl">
              Type a bill or a name. We map the money in one click.
              Every donor, tied to every vote, tied to every bill. We did
              the cross-linking. You just search.
            </p>
            <p className="mt-3 font-sans text-[15px] text-ink-3 leading-relaxed max-w-2xl">
              Sourced to FEC and Congress.gov. Updated every day. Free to search.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/investigate"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-6 py-3 transition-colors border border-ink"
              >
                Start searching — free →
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-full bg-paper text-ink hover:bg-paper-2 font-sans text-[15px] font-medium px-6 py-3 transition-colors border border-line"
              >
                See the free leaderboard
              </Link>
            </div>
            <p className="mt-3 font-sans text-[13px] text-ink-3">
              Cancel anytime. Same price for newsrooms and citizens.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — animated walkthrough */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <HowItWorksFlow
          kicker="How it works"
          heading="One search. A sourced dossier."
          steps={[
            { label: 'Step 1', title: 'Type any name.', body: 'A politician, a donor, a bill, or a vote.' },
            { label: 'Step 2', title: 'We map the money.', body: 'Every donor, tied to every vote and bill.' },
            { label: 'Step 3', title: 'Read the dossier.', body: 'A plain-English summary of who funds whom.' },
            { label: 'Step 4', title: 'Check our work.', body: 'Every line links to FEC or Congress.gov.' },
          ]}
        />
      </section>

      {/* WHAT THE DATABASE DOES */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            What you get
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            One search. The whole money map.
          </h2>
          <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
            Start from a bill. Or start from a name. Either way, the
            map opens both directions.
          </p>
          <ul className="mt-5 space-y-3 font-sans text-[15px] text-ink-2 leading-relaxed list-none p-0">
            <li><strong className="font-medium text-ink">Search a bill → see who paid the sponsor.</strong> Top donor industries behind the sponsor and every co-sponsor.</li>
            <li><strong className="font-medium text-ink">Search a politician → see every bill they touched.</strong> Sponsored, co-sponsored, and how they voted.</li>
            <li><strong className="font-medium text-ink">See who paid them to vote that way.</strong> Each roll-call vote, lined up against the donor money.</li>
            <li><strong className="font-medium text-ink">Follow one donor across the whole map.</strong> Every politician they funded. Every bill those politicians moved.</li>
            <li><strong className="font-medium text-ink">Updated daily.</strong> New bills, new filings, new votes — in by the next morning.</li>
            <li><strong className="font-medium text-ink">Every row links to the primary source.</strong> Congress.gov and FEC, so it survives an editor.</li>
          </ul>
        </div>
      </section>

      {/* CONCRETE EXAMPLE — REAL LIVE DATA */}
      <section className="section-shell py-12 sm:py-16 border-b border-line">
        <div className="max-w-[760px] mx-auto mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            One real example
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            A crypto bill. A sponsor. Finance money.
          </h2>
          <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
            Here is one row, from live data. Rep. French Hill wrote a bill
            to set the rules for crypto. His top donor industry is finance.
            Crypto donors sit at number three. We lined that up
            for you in one search.
          </p>
        </div>

        <div className="max-w-[760px] mx-auto">
          <Receipt
            id="RCPT-HR-3633"
            title="H.R. 3633 — Digital Asset Market Clarity Act of 2025"
            headerRight={<Tag>Federal · 119th</Tag>}
            rows={[
              { k: 'Sponsor', v: 'Rep. French Hill (R-AR)', sans: true },
              { k: 'What it does', v: 'Sets the rules for crypto markets', sans: true },
              { k: '#1 donor industry behind sponsor', v: 'Finance — $109,000', sans: true },
              { k: '#3 donor industry', v: 'Crypto — $28,900', sans: true },
              { k: 'Status', v: 'Passed House · sent to Senate Banking', sans: true },
              { k: 'Primary source', v: 'congress.gov/bill/119th-congress/house-bill/3633', sans: true },
            ]}
            verdict="pending"
            stampLabel="In the data"
            footLeft="★ One row from the search — free"
            footRight="campaignreceipts.com/investigate"
          />
          <p className="mt-4 font-sans text-[13px] text-ink-3 leading-relaxed">
            Money figures are donor-industry totals to the sponsor set, from
            FEC filings. The full search shows every industry, every
            co-sponsor, and the roll-call.
          </p>
        </div>
      </section>

      {/* CREDIBILITY PROOF — AIPAC / ADELSON */}
      <section className="section-shell py-12 sm:py-16 border-b border-line bg-paper-2">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            Why trust it
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            We already mapped the hard ones.
          </h2>
          <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
            The AIPAC and Adelson money is in here — traced from donor to
            race to outcome. See how we showed our work.{' '}
            <Link
              href="/big-donor-map"
              className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
            >
              See the big-donor map →
            </Link>
          </p>
        </div>
      </section>

      {/* SIGN-UP — FREE DATA */}
      <section id="access" className="section-shell py-12 sm:py-16 scroll-mt-20">
        <div className="max-w-[760px] mx-auto">
          <div className="rounded-2xl border border-line bg-paper-2 p-8 sm:p-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
              For reporters and watchdogs
            </div>
            <h2 className="font-display text-[30px] sm:text-[38px] leading-[1.05] tracking-[-0.005em] text-ink m-0">
              Free for everyone. No account needed.
            </h2>
            <p className="mt-4 font-sans text-[16px] text-ink-2 leading-relaxed max-w-xl">
              Search any bill, politician, donor, or vote. Every claim is
              sourced. Updated daily. Free for everyone — a big newsroom or a
              one-person watchdog.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/investigate"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-6 py-3 transition-colors border border-ink"
              >
                Start searching — free →
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-full bg-paper text-ink hover:bg-paper-2 font-sans text-[15px] font-medium px-6 py-3 transition-colors border border-line"
              >
                See the free leaderboard
              </Link>
              <Link
                href="/#newsletter"
                className="font-sans text-[14px] text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                Get the weekly receipt
              </Link>
            </div>
            <p className="mt-6 font-sans text-[13px] text-ink-3 leading-relaxed">
              Need team access or a commercial license?{' '}
              <a
                href="mailto:alex@campaignreceipts.com?subject=Team%20access"
                className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                Email us
              </a>
              .
            </p>
          </div>
          <p className="mt-6 font-sans text-[14px] text-ink-2 leading-relaxed">
            Have a tip instead? Send it to{' '}
            <a
              href="mailto:tips@campaignreceipts.com"
              className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
            >
              tips@campaignreceipts.com
            </a>
            .
          </p>
        </div>
      </section>
    </>
  )
}
