// Methodology — light "trust" surface. Parchment + serif headlines +
// authority-blue accents. Inline verdict-color names (KEPT/BROKEN/
// PARTIAL/YOU_DECIDE) keep their `-600` variants for legibility on
// light backgrounds per design-lead rec #6.

import { ShieldCheck, Search, Scale, FileCheck2, AlertCircle, Activity, Calendar, ListChecks, Gavel, Archive } from 'lucide-react'
import Link from 'next/link'
import TrustSurface from '@/app/components/TrustSurface'

export const metadata = {
  title: 'Methodology — how we grade promises | CampaignReceipts',
  description:
    'Three sequential reviewers (neutral · conservative · progressive). Primary-source receipts on every verdict. Term-scoped grading: we grade after the term ends, not before. Read the citation guide, dispute mechanism, and full audit-document discipline.',
}

export default function MethodologyPage() {
  return (
    <TrustSurface>
      <section className="border-b border-parchment-200">
        <div className="section-shell pt-20 pb-12">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
            The Standard
          </div>
          <h1 className="font-editorial text-display-lg text-ink-950 text-balance">Methodology</h1>
          <p className="mt-5 text-lg text-ink-700 max-w-2xl leading-relaxed font-editorial">
            How CampaignReceipts.com produces every politician profile. Read this once. Trust the rest.
          </p>
        </div>
      </section>

      <article className="section-shell py-12 grid lg:grid-cols-[1fr_280px] gap-12">
        <div className="space-y-12 max-w-3xl">
          {/* Verdicts */}
          <Block icon={Scale} title="The verdict system" eyebrow="Four verdicts">
            <ul className="space-y-3 text-[15px]">
              <li><strong className="text-kept-600">KEPT</strong> — The politician took the action they promised.</li>
              <li><strong className="text-partial-600">PARTIAL</strong> — Some action toward the promise, but incomplete delivery, OR outcome blocked by opposing party despite their full effort.</li>
              <li><strong className="text-broken-600">BROKEN</strong> — The politician's own vote or action contradicted the promise.</li>
              <li><strong className="text-decide-600">YOU DECIDE</strong> — Outcome depends on the reader's interpretive framework. Used sparingly.</li>
            </ul>
          </Block>

          {/* Term-grading rule */}
          <Block icon={Calendar} title="Promises are contracts for the next term" eyebrow="Term scoping">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              A campaign promise made in 2024 cannot be graded in 2025. It is a contract for the <em>next</em> term — and that term has barely begun. So every promise on this site is anchored to the term it covers, and a verdict only locks in once that term ends.
            </p>
            <ul className="mt-4 space-y-2 text-[15px] text-ink-700">
              <li><strong className="text-ink-950">Graded</strong> — the term has ended; the verdict is final.</li>
              <li><strong className="text-partial-600">Pending</strong> — the term is still in progress; we publish the promise but withhold the verdict. The politician page shows a "Live tracking" indicator instead of a kept-rate percentage.</li>
            </ul>
            <p className="mt-4 text-[15px] text-ink-700 leading-relaxed">
              For senators, the term is six years. For House members, two. For governors and presidents, four (with variation by state). For mayors and attorneys general, we honor each office's actual term length. The page header on every politician profile names the term boundaries you're looking at.
            </p>
            <p className="mt-4 text-[15px] text-ink-700 leading-relaxed">
              <strong className="text-ink-950">No career averages.</strong> A politician who served 1980–2024 made different promises in each of seven cycles. Averaging them into a single number erases meaning. Prior terms are displayed as separate scorecards on the politician page; we never collapse them into one aggregate.
            </p>
          </Block>

          {/* Curation protocol */}
          <Block icon={ListChecks} title="How a politician's promise list is built" eyebrow="Promise curation" anchor="sources">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              The biggest hidden trap in any promise tracker is who decides which promises get tracked. If the curator picks five flattering pledges, the politician scores well; if they pick five unflattering ones, the politician scores badly. Same person, different selection bias.
            </p>
            <p className="mt-3 text-[15px] text-ink-700 leading-relaxed">
              Our protocol: for each politician, identify the most-frequently-repeated commitments across <strong className="text-ink-950">three independent surfaces</strong> — (1) the official campaign website during the relevant cycle, (2) the politician's debate appearances and stump speeches, and (3) their voter-guide questionnaire responses. Promises that appear on two or more of these surfaces enter the list. Promises that appear on only one surface are excluded.
            </p>
            <p className="mt-3 text-[15px] text-ink-700 leading-relaxed">
              The minimum list size is 10 promises per cycle; the typical list is 15–25. When fewer than 10 surface, we flag the profile as <strong className="text-ink-950">"limited corpus"</strong> and treat its kept-rate as illustrative rather than conclusive.
            </p>
          </Block>

          {/* Primary-source archive */}
          <Block icon={Archive} title="The primary-source archive" eyebrow="Citation infrastructure" anchor="archive">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              Every verdict on this site is grounded in a primary-source document — campaign-site
              policy pages, debate transcripts, signed pledges, official speeches. Many of those
              documents live on fragile hosts: a single third-party CDN, a wayback snapshot that
              could decay, a news outlet&rsquo;s archive that has deleted older posts before. When
              a citation we depend on lives only at one fragile URL, we mirror the document to{' '}
              <Link href="/sources" className="text-authority-600 hover:text-authority-700 underline-offset-4 hover:underline font-medium">
                campaignreceipts.com/sources
              </Link>
              {' '}so the citation chain doesn&rsquo;t break.
            </p>
            <p className="mt-3 text-[15px] text-ink-700 leading-relaxed">
              Each mirrored document lists its original host and at least one additional public
              mirror so anyone can independently verify our copy matches the canonical one.
              We don&rsquo;t fabricate URLs and we don&rsquo;t cite documents we can&rsquo;t
              produce on request.
            </p>
          </Block>

          {/* Verdict-routing standard */}
          <Block icon={Gavel} title="When obstruction changes the verdict" eyebrow="Verdict routing" anchor="verdict-routing">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              Promises live or die in a system the politician doesn't fully control. Our routing rule keeps verdicts about <em>the person</em> rather than about <em>the system</em>:
            </p>
            <ul className="mt-4 space-y-3 text-[15px] text-ink-700">
              <li>
                <strong className="text-partial-600">Blocked by Congress</strong> → <strong className="text-partial-600">PARTIAL</strong>. If the politician used the procedural tools available to them (introducing the bill, whipping votes, taking the public position) but the opposing caucus killed it, that is PARTIAL — movement without completion, not the promisor's fault. The case study names the obstructing party explicitly.
              </li>
              <li>
                <strong className="text-broken-600">Blocked by courts</strong> → <strong className="text-ink-950">case-by-case</strong>. If the policy was struck down because the politician's own design was unconstitutional, that's closer to BROKEN. If struck down on standing or a tangential ruling, that's PARTIAL. The reasoning text explains which.
              </li>
              <li>
                <strong className="text-broken-600">Stalled by the politician's own caucus</strong> → <strong className="text-broken-600">BROKEN</strong>. If the politician's party held the trifecta and the promise still didn't move, that's an own-action failure regardless of who voted against it on the floor.
              </li>
            </ul>
            <p className="mt-4 text-[15px] text-ink-700 leading-relaxed">
              The rule applies symmetrically across parties. A Democratic senator whose bill died in a Republican-held chamber gets PARTIAL credit; a Republican senator whose bill died in a Democratic-held chamber gets the same. We do not let partisan alignment of the obstructor shift the routing.
            </p>
          </Block>

          {/* 3-pass */}
          <Block icon={ShieldCheck} title="The 3-pass adversarial review" eyebrow="The core process">
            <p className="text-[15px] text-ink-700 leading-relaxed">Every politician profile passes through three sequential reviewers — each a separate, isolated reasoning pass with a distinct partisan-perspective brief:</p>
            <ol className="mt-4 space-y-4">
              <PassStep n={1} title="Neutral researcher" body="Pulls campaign promises from primary sources — campaign websites via the Wayback Machine, debate transcripts, voter-guide questionnaires. For each promise, searches the legislative record and cross-spectrum news. Assigns a verdict backed by at least 2 primary sources." />
              <PassStep n={2} title="Conservative-perspective reviewer" body="Stress-tests the profile for left-leaning bias, missing context, and unfair verdicts. Flags any framing a thoughtful conservative reader would object to." />
              <PassStep n={3} title="Progressive-perspective reviewer" body="Mirror-image — stress-tests for right-leaning bias, missing accountability moments, and overly generous framings." />
            </ol>
            <p className="mt-5 text-[15px] text-ink-700 leading-relaxed">
              A profile is only published when <strong className="text-ink-950">both partisan reviewers return zero high-severity objections</strong>. Disagreements trigger a re-run of the research pass with both critiques as context. Full review logs are stored as an audit trail.
            </p>
            <p className="mt-4 text-sm text-ink-600 leading-relaxed">
              <em>On the underlying technology:</em> the research and review passes are run by current-generation language-model systems with web-search access. They are not the source of authority — primary records and public votes are. The reviewers exist to catch one-sided framing in the writeup; the receipts themselves do the load-bearing work.
            </p>
          </Block>

          {/* Obstruction-aware */}
          <Block icon={FileCheck2} title="The obstruction-aware verdict rule" eyebrow="Methodology nuance">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              When a promised outcome was prevented by the opposing party — filibuster, refusal to take up, presidential veto, courts — the verdict considers whether the politician took the actions available within their caucus's power.
            </p>
            <p className="mt-3 text-[15px] text-ink-700 leading-relaxed">
              <strong className="text-ink-950">BROKEN</strong> is reserved for cases where the politician's own actions prevented the outcome. When obstruction came from outside their caucus's control AND they took the maximally available procedural action, the verdict is <strong className="text-ink-950">PARTIAL</strong> with the obstructing party named explicitly. The rule applies symmetrically to politicians of both parties.
            </p>
          </Block>

          {/* Review tiers */}
          <Block icon={Activity} title="Two review tiers — and how a profile gets upgraded" eyebrow="Tier system">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              Not every profile receives the full 3-pass adversarial review. We use a two-tier system:
            </p>
            <ul className="mt-4 space-y-3 text-[15px] text-ink-700">
              <li className="flex gap-3">
                <span className="size-2 rounded-full bg-kept-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-kept-600">Full review</strong> — Research pass + Conservative-perspective reviewer + Progressive-perspective reviewer + adjudication when reviewers disagree. Reserved for politicians most likely to be screenshot-mocked if biased: leadership, presidential candidates, partisan flanks, controversial figures.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="size-2 rounded-full bg-ink-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-ink-800">Standard review</strong> — Single research pass with the stable prompt. Produces the same primary-source receipts but does not run the adversarial reviewers. Used for rank-and-file politicians where the marginal cost of full review exceeds the marginal benefit.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="size-2 rounded-full bg-authority-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-authority-700">Sourced from the SEALED book</strong> — Scorecard imported from the SEALED Press book's full case-study research (currently: Trump 2016).
                </span>
              </li>
            </ul>
            <p className="mt-5 text-[15px] text-ink-700 leading-relaxed">
              <strong className="text-ink-950">Auto-upgrade by reader interest:</strong> we track page-view counts on individual politician pages. When a Standard-review profile crosses a traffic threshold (currently set at 1,000 monthly views, subject to revision), it gets queued for promotion to Full review. The rationale: profiles that draw real reader attention deserve the deeper editorial process, and bias is more consequential where more readers see it.
            </p>
            <p className="mt-3 text-[15px] text-ink-700 leading-relaxed">
              Every politician page shows its current tier in the sidebar. You can see exactly what level of review the verdicts received.
            </p>
          </Block>

          {/* Stakes-naming */}
          <Block icon={Search} title="Stakes-naming rule" eyebrow="Symmetric framing">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              When a promise has documented real-world stakes — number of people affected, dollar amounts, casualties — those stakes are named explicitly in the case study, regardless of whether they help or hurt the politician. Symmetric stakes-naming applies across both KEPT and BROKEN verdicts. Selectively-cited political quotes are treated as equivalent to manufactured paraphrase.
            </p>
          </Block>

          {/* Spot audit */}
          <Block icon={Activity} title="Monthly verdict-routing audit" eyebrow="Consistency check">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              The biggest risk to a directory of this size is drift — the same situation routed to PARTIAL on one profile and BROKEN on another, simply because different research passes handled them. Two safeguards prevent that:
            </p>
            <ul className="mt-4 space-y-2 text-[15px] text-ink-700">
              <li><strong className="text-ink-950">5% monthly spot audit.</strong> Every month we randomly sample 5% of all verdicts and re-route them under the rules above. Discrepancies are corrected and the routing rules are tightened wherever the audit surfaces ambiguity.</li>
              <li><strong className="text-ink-950">Public audit log.</strong> When a verdict changes as a result of an audit, the change is recorded with a date, the original verdict, and the routing reason. The log is linked from every politician page.</li>
            </ul>
          </Block>

          {/* Donor classification — anchored from /politician/[slug]/donors */}
          <Block icon={Scale} title="How we classify donor profiles" eyebrow="FEC integration" anchor="donor-classification">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              For federal candidates with reported activity, we surface FEC-sourced donor data on a per-politician <code className="text-authority-700 bg-parchment-100 px-1 rounded font-mono text-sm">/donors</code> page and tag each politician with one of five donor profiles:
            </p>
            <ul className="mt-4 space-y-2 text-[15px] text-ink-700">
              <li><strong className="text-kept-600">Grassroots</strong> — individual contributions ≥70% of total raised AND large-donor share ≤50%.</li>
              <li><strong className="text-broken-600">Corporate</strong> — political-action-committee contributions ≥30% of total raised.</li>
              <li><strong className="text-partial-600">Self-funded</strong> — candidate's own contributions ≥25% of total raised.</li>
              <li><strong className="text-ink-900">Mixed</strong> — anything else, the most common bucket. Most senators land here because their large-donor share crosses the grassroots threshold even when PAC share is low.</li>
              <li><strong className="text-ink-600">Unknown</strong> — no FEC data (state-level candidates, joint-fundraising-committee structures, or no reported cycle activity).</li>
            </ul>
            <p className="mt-3 text-[15px] text-ink-700 leading-relaxed">
              Source: FEC OpenAPI v1. Industry rollups use a conservative 9-category keyword classifier on the contributor's employer and occupation fields — false positives hurt credibility more than missing tags, so we leave most donors industry-untagged when unsure.
            </p>
          </Block>

          {/* Dispute */}
          <Block icon={AlertCircle} title="Dispute a verdict" eyebrow="Get a correction">
            <p className="text-[15px] text-ink-700 leading-relaxed">
              Found a factual error? Email{' '}
              <a className="text-authority-600 hover:text-authority-700 underline-offset-4 hover:underline font-medium" href="mailto:disputes@campaignreceipts.com">
                disputes@campaignreceipts.com
              </a>
              {' '}with the politician's name, the specific verdict, and the source you believe contradicts our finding. We respond within 7 days. Verified corrections are applied with a public changelog.
            </p>
          </Block>
        </div>

        {/* Right rail — quick navigation. */}
        <aside className="lg:sticky lg:top-24 self-start hidden lg:block">
          <div className="rounded-xl ring-1 ring-parchment-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
              On this page
            </div>
            <ol className="text-xs text-ink-600 space-y-2 leading-relaxed">
              <li>The verdict system &mdash; four colors, plain rules</li>
              <li>Promises are contracts for the next term</li>
              <li>How a politician&rsquo;s promise list is built</li>
              <li>The primary-source archive</li>
              <li>When obstruction changes the verdict</li>
              <li>The 3-pass adversarial review</li>
              <li>Two review tiers &mdash; and how a profile gets upgraded</li>
              <li>Stakes-naming rule &mdash; symmetric framing</li>
              <li>Monthly verdict-routing audit</li>
              <li>How we classify donor profiles</li>
              <li>Dispute a verdict</li>
            </ol>
            <div className="mt-5 pt-5 border-t border-parchment-200">
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-2">
                Have a correction?
              </div>
              <a
                href="mailto:disputes@campaignreceipts.com"
                className="text-sm text-authority-600 hover:text-authority-700 underline-offset-4 hover:underline font-medium"
              >
                disputes@campaignreceipts.com →
              </a>
            </div>
          </div>
        </aside>
      </article>

      {/* ─── How to cite — benchmark paper section, rev 5 ──────────
          Per rev 4 journalist verdict: "cite the methodology + Wayback
          source, do NOT cite a CR verdict" — explicit guidance so
          reporters know HOW to use the site today, and which receipt
          ID to cite once a verdict has shipped. */}
      <section id="cite" className="scroll-mt-20 bg-paper-2 border-t border-line">
        <div className="section-shell py-14 sm:py-20">
          <div className="max-w-[760px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
              For reporters
            </div>
            <h2 className="font-display text-[34px] sm:text-[40px] leading-[1.05] tracking-[-0.01em] text-ink text-balance">
              How to cite CampaignReceipts.
            </h2>
            <p className="mt-4 font-sans text-[15px] text-ink-2 leading-relaxed">
              CampaignReceipts is a <strong className="font-medium text-ink">sourcing layer</strong>,
              not the source of record. Every verdict points to primary sources (debate transcripts,
              Federal Register, Congress.gov, agency filings). Cite the primary source first; cite us
              for the verdict-level synthesis only when the synthesis is the thing being claimed.
            </p>

            <h3 className="mt-10 font-display text-[22px] text-ink">
              When to cite the primary source directly
            </h3>
            <p className="mt-2 font-sans text-[15px] text-ink-2 leading-relaxed">
              If you're quoting a politician's campaign-stage promise verbatim, or referring to a
              specific instrument (TPP withdrawal memo, Executive Order 13770, TCJA, the July 28
              2017 skinny-repeal vote) — cite the primary source we link, not us. Example:
            </p>
            <div className="mt-3 rounded-md border border-line bg-paper p-4 font-mono text-[13px] leading-relaxed text-ink-2 overflow-x-auto">
              <div className="text-ink">
                "...the second presidential debate (Commission on Presidential Debates,{' '}
                <a
                  href="https://www.debates.org/voter-education/debate-transcripts/october-9-2016-debate-transcript/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-line hover:decoration-ink"
                >
                  October 9, 2016
                </a>
                )..."
              </div>
            </div>

            <h3 className="mt-10 font-display text-[22px] text-ink">
              When to cite CampaignReceipts
            </h3>
            <p className="mt-2 font-sans text-[15px] text-ink-2 leading-relaxed">
              When you're referring to the <em>term-scoped verdict</em> itself — the synthesis of
              dozens of receipts into a single grade. Each verdict has a stable RCPT-ID and a
              fragment anchor. Format:
            </p>
            <div className="mt-3 rounded-md border border-line bg-paper p-4 font-mono text-[13px] leading-relaxed text-ink-2 overflow-x-auto">
              <div>
                <span className="text-ink-3"># Citation</span>
              </div>
              <div className="mt-1 text-ink">
                CampaignReceipts. <em>RCPT-DJT-2016-004: Healthcare — The biggest broken promise</em>.{' '}
                Retrieved May 16 2026 from{' '}
                <span className="text-ink">
                  https://campaignreceipts.com/politician/donald-trump-2016#rcpt-djt-2016-004
                </span>
              </div>
            </div>
            <p className="mt-3 font-sans text-[14px] text-ink-2 leading-relaxed">
              Every promise and scorecard has a "Cite as: RCPT-..." footer line printed inside the
              Receipt itself so the ID is unambiguous on screenshot.
            </p>

            <h3 className="mt-10 font-display text-[22px] text-ink">
              What's safe to cite today
            </h3>
            <ul className="mt-3 space-y-2 font-sans text-[15px] text-ink-2 leading-relaxed list-disc pl-5">
              <li>
                The <Link href="/politician/donald-trump-2016" className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink">Trump 2016 final scorecard</Link>{' '}
                (81 promises graded, 34.6% kept) — full case studies + primary-source receipts on
                the four chapter-defining promises.
              </li>
              <li>
                The <Link href="/sources" className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink">source archive</Link>{' '}
                — Wayback-mirrored campaign policy pages with full-page screenshots as evidentiary
                receipts.
              </li>
              <li>
                The methodology itself (this page) — for "how the grades were assigned" attribution
                in a methods footnote.
              </li>
            </ul>

            <h3 className="mt-10 font-display text-[22px] text-ink">
              What's not citation-ready yet
            </h3>
            <p className="mt-2 font-sans text-[15px] text-ink-2 leading-relaxed">
              Live-tracking profiles (current term in progress) — verdicts are pending until the
              term ends. Cite the primary source we link, not the tracker page, until a final
              scorecard ships. Non-featured promise rows for any politician may have a verdict but
              no full case study yet; if the row you want to cite doesn't have an expandable case
              study with primary-source receipts, treat it as preliminary and cite the underlying
              source directly.
            </p>

            <h3 className="mt-10 font-display text-[22px] text-ink">
              Commercial use
            </h3>
            <p className="mt-2 font-sans text-[15px] text-ink-2 leading-relaxed">
              The data is free to read and free to cite in journalism with attribution. For
              commercial republishing or embedding scorecards in a paid product, email us and we'll
              sort a license.{' '}
              <Link href="/for-journalists" className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink">
                Working journalists — say hi here →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* SEALED cross-link — civic-publication register */}
      <section className="border-t border-parchment-200 bg-parchment-50">
        <div className="section-shell py-10">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-2">
              The source methodology
            </div>
            <p className="text-[14px] text-ink-700 leading-relaxed">
              The same methodology used in <em>SEALED</em> — the published 144-page book that graded
              all 145 of Trump's 2016 promises with primary-source receipts.{' '}
              <a
                href="https://sealed2016.com/?utm_source=campaignreceipts&utm_medium=cross-link&utm_content=methodology"
                target="_blank"
                rel="noopener"
                className="text-authority-600 hover:text-authority-700 underline underline-offset-4 font-medium"
              >
                sealed2016.com →
              </a>
            </p>
          </div>
        </div>
      </section>
    </TrustSurface>
  )
}

function Block({
  icon: Icon,
  eyebrow,
  title,
  anchor,
  children,
}: {
  icon: any
  eyebrow?: string
  title: string
  anchor?: string
  children: React.ReactNode
}) {
  return (
    <section id={anchor} className={anchor ? 'scroll-mt-24' : undefined}>
      <div className="flex items-center gap-3 mb-4">
        <div className="size-9 rounded-md bg-white ring-1 ring-parchment-200 flex items-center justify-center shadow-sm">
          <Icon className="size-4.5 text-authority-600" strokeWidth={2} />
        </div>
        <div>
          {eyebrow && (
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600">
              {eyebrow}
            </div>
          )}
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-ink-950 tracking-tight">
            {title}
          </h2>
        </div>
      </div>
      <div className="pl-12">{children}</div>
    </section>
  )
}

function PassStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="size-7 rounded-full bg-authority-500/10 ring-1 ring-authority-500/30 flex items-center justify-center font-mono text-xs text-authority-700 shrink-0">
        {n}
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        <p className="mt-1 text-sm text-ink-600 leading-relaxed">{body}</p>
      </div>
    </li>
  )
}
