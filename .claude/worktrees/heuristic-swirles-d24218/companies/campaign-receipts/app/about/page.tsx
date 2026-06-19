// About — benchmark audit-document trust surface (rev 5).
// Replaces the parchment/authority-blue legacy. Adds the named-
// reviewer-panel section the journalist asked for at rev 4 review.

import Link from 'next/link'
import { Tag } from '@/app/components/cr'
import CompRequestForm from '@/app/components/CompRequestForm'

export const metadata = {
  title: 'About — CampaignReceipts',
  description:
    "Political-media company tying donors to votes, donors to bills, donors to campaign promises, and donors to races. Editorial lead: Alex Antoniou. Three-reviewer panel: neutral · conservative · progressive. Receipts, not rhetoric.",
}

export default function AboutPage() {
  return (
    <>
      {/* Masthead band */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            Why this exists
          </div>
          <h1 className="font-display text-[44px] sm:text-[64px] leading-[0.96] tracking-[-0.01em] text-ink text-balance max-w-3xl">
            Receipts, not rhetoric.
          </h1>
          <p className="mt-5 font-sans text-[17px] text-ink-2 leading-relaxed max-w-2xl">
            CampaignReceipts is a political-media company that ties donor money to four
            things: <strong className="font-medium text-ink">congressional votes</strong>,{' '}
            <strong className="font-medium text-ink">sponsored bills</strong>,{' '}
            <strong className="font-medium text-ink">campaign promises kept or broken</strong>,
            and{' '}
            <strong className="font-medium text-ink">races won or lost</strong>. Free to browse,
            sourced from FEC.gov + Congress.gov, every verdict reviewed by three sequential
            reviewers — neutral, conservative, progressive — before publication.
          </p>
        </div>
      </section>

      {/* Editorial leadership + reviewer panel — THE journalist-asked
          section. Names, affiliations, recruiting transparency. */}
      <section className="section-shell py-14 sm:py-20 border-b border-line">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            Who reviews the verdicts
          </div>
          <h2 className="font-display text-[34px] sm:text-[40px] leading-[1.05] tracking-[-0.01em] text-ink text-balance">
            Editorial leadership + the reviewer panel.
          </h2>
          <p className="mt-4 font-sans text-[15px] text-ink-2 leading-relaxed">
            Every verdict that ships passes through three sequential reviewers in this order:
            neutral editorial pass → conservative reader pass → progressive reader pass. The
            panelists rotate; their notes are stored as a public audit trail. We name everyone
            we can, mark every seat we're still recruiting, and never publish a "review board"
            we can't point to by name.
          </p>

          {/* Editorial lead */}
          <div className="mt-10 rounded-lg border border-line bg-paper p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-2">
              Editorial lead
            </div>
            <h3 className="font-display text-[24px] leading-[1.15] text-ink">
              Alex Antoniou
            </h3>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
              Founder · Editorial lead
            </div>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
              Built CampaignReceipts to track political money and promises against the
              public record. Ran the original 145-promise audit of the Trump 2016 campaign —
              every claim paired with a paper-trail receipt. That same method now runs at
              scale here.
              <strong className="font-medium text-ink"> No party affiliation. No prior
              campaign-staff history.</strong> Drafts the neutral pass on every verdict before it
              goes to the conservative and progressive readers.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Tag>Neutral pass</Tag>
            </div>
          </div>

          {/* Reviewer panel grid */}
          <div className="mt-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2 mb-3">
              Reviewer panel (rotating)
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <ReviewerCard
                label="Conservative pass"
                status="Recruiting"
                bio="Seat open. Recruiting two readers with prior affiliation at a Republican-aligned policy shop, conservative magazine, or right-of-center think tank. Reviewer reads each verdict for partisan framing, missing context, and steel-mans the politician under review. Notes stored publicly. Compensated per-verdict reviewed."
              />
              <ReviewerCard
                label="Conservative pass"
                status="Recruiting"
                bio="Second seat open — we run two conservative readers per verdict in rotation to keep no single reader's framing dominant. Same role + compensation as above."
              />
              <ReviewerCard
                label="Progressive pass"
                status="Recruiting"
                bio="Seat open. Recruiting two readers with prior affiliation at a Democratic-aligned policy shop, progressive publication, or left-of-center think tank. Same role: read for partisan framing, missing context, steel-man the politician under review. Notes stored publicly. Compensated per-verdict reviewed."
              />
              <ReviewerCard
                label="Progressive pass"
                status="Recruiting"
                bio="Second seat open — same rotation discipline as the conservative side. Same role + compensation as above."
              />
            </div>
            <p className="mt-4 font-sans text-[14px] text-ink-2 leading-relaxed">
              <strong className="font-medium text-ink">Why we name "Recruiting" instead of inventing reviewers:</strong>{' '}
              a "bipartisan review" claim that doesn't name people isn't a review claim — it's
              marketing. We'd rather show open seats than fake them.{' '}
              <Link
                href="#reviewer-application"
                className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                Apply for a reviewer seat →
              </Link>
            </p>
            <div id="reviewer-application" className="mt-8 scroll-mt-20">
              <CompRequestForm mode="feedback" feedbackTopic="reviewer-panel-application" />
            </div>
          </div>
        </div>
      </section>

      {/* What we don't do */}
      <section className="section-shell py-14 sm:py-20 border-b border-line">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            Discipline
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            What we don't do.
          </h2>
          <ul className="mt-5 space-y-3 font-sans text-[15px] text-ink-2 leading-relaxed list-none p-0">
            <li>
              <strong className="font-medium text-ink">Anonymous scoring.</strong> Every verdict
              has primary-source receipts. The receipts are on the verdict page, not buried in a
              PDF appendix.
            </li>
            <li>
              <strong className="font-medium text-ink">Partisan framing.</strong> Three reviewer
              passes per verdict. If conservative and progressive readers disagree on framing, the
              disagreement is logged publicly and the verdict re-drafted.
            </li>
            <li>
              <strong className="font-medium text-ink">Editorializing.</strong> The receipts do
              the work. Verdict reasoning explains how the instrument compared to the campaign
              pledge — not whether we approve of the politician.
            </li>
            <li>
              <strong className="font-medium text-ink">Paywalled facts.</strong> The directory and
              all verdicts are free. The Bundle ($45/mo) is the commercial-use license that
              journalists and content creators need to publish work built on this data — not a
              gate on the underlying facts.
            </li>
            <li>
              <strong className="font-medium text-ink">Politician donations.</strong> No advertising,
              no politician donations accepted. Revenue: the weekly newsletter and Bundle newsroom
              licenses. That's it.
            </li>
          </ul>
        </div>
      </section>

      {/* Where it started — the 2016 audit, now free on-site */}
      <section className="section-shell py-14 sm:py-20 bg-paper-2">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
            Where it started
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            The Trump 2016 promise audit.
          </h2>
          <p className="mt-4 font-sans text-[15px] text-ink-2 leading-relaxed max-w-2xl">
            We graded all 145 of Donald Trump's 2016 campaign promises against the public
            record — every claim paired with a paper-trail receipt. It is free to read here.
            The same method now runs on every politician on the site.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/politician/donald-trump-2016"
              className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink no-underline"
            >
              See the 2016 audit
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink"
            >
              Read the methodology →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function ReviewerCard({
  label,
  status,
  bio,
}: {
  label: string
  status: 'Recruiting' | 'Active'
  bio: string
}) {
  return (
    <div className="rounded-lg border border-line bg-paper p-5">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          {label}
        </div>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full ${
            status === 'Recruiting'
              ? 'bg-pending-bg text-pending border border-pending/30'
              : 'bg-kept-bg text-kept border border-kept/30'
          }`}
        >
          · {status}
        </span>
      </div>
      <h4 className="font-display text-[18px] leading-[1.2] text-ink mb-2">
        Open seat
      </h4>
      <p className="font-sans text-[14px] text-ink-2 leading-relaxed">{bio}</p>
    </div>
  )
}
