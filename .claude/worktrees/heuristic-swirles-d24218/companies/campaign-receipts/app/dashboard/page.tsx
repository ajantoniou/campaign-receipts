// Signed-in dashboard. Shows each active subscription with a self-serve Cancel
// button (LS cancels at period end → keeps access until the month ends), the
// commercial-use badge, the donor-intelligence search-credit meter, and quick
// links to the Pro surfaces.

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getEntitlement, isRowActive, isCompRow } from '@/lib/entitlement'
import { getCreditState } from '@/lib/search-credits'
import CancelButton from './CancelButton'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard — CampaignReceipts',
}

const PRODUCT_LABEL: Record<string, string> = {
  software: 'Donor Intelligence',
  newsletter: 'Friday Receipts',
}
const PRODUCT_PRICE: Record<string, string> = {
  software: '$45/mo',
  newsletter: '$9/mo',
}
// Ledger-style code for the receipt-id line (on-brand for a "receipts" product).
const PRODUCT_CODE: Record<string, string> = {
  software: 'SUB-SW',
  newsletter: 'SUB-NL',
}

function fmt(d: string | null): string | null {
  return d
    ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null
}

export default async function DashboardPage() {
  const ent = await getEntitlement()
  if (!ent.user) redirect('/auth/signin?next=/dashboard')

  // Drive the page off the rows getEntitlement() already fetched — no second
  // query — and share its liveness rule so the two never drift.
  const liveSubs = ent.rows.filter(isRowActive)

  const credits = ent.hasSoftware ? await getCreditState(ent.user.id) : null

  // First-run: a software user who hasn't spent a single search this period.
  // No extra query — derived from the credit state we already fetched.
  const firstRun = !!credits && credits.used === 0
  // Low-credits trigger. Zero is its own state (hard 100/mo cap — no upsell,
  // just the reset date); ≤20% remaining is the gentle "running low" nudge.
  const outOfCredits = !!credits && credits.remaining <= 0
  const lowCredits = !!credits && credits.remaining > 0 && credits.remaining <= 20
  // Stat-tile fill variant maps to the existing token palette:
  // broken (red) when empty, partial (amber) when low, neutral otherwise.
  const creditsFill = outOfCredits ? 'fill-broken' : lowCredits ? 'fill-partial' : ''

  return (
    <section className="section-shell py-14 max-w-3xl">
      <div className="eyebrow mb-2">Account</div>
      <h1 className="text-display-md text-ink">Your account</h1>
      <p className="mt-1 text-sm text-ink-3">{ent.user.email}</p>

      {/* ── First-run activation hero (#16) ──
          A brand-new software subscriber who hasn't searched gets one obvious
          first action instead of a "100 of 100 left" meter. /investigate has no
          free-text prefill param, so the copy does the prompting. */}
      {firstRun && (
        <div className="mt-8 rounded-r-lg border border-line bg-paper p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="eyebrow mb-1">Start here</div>
              <div className="font-display text-[26px] leading-[1.15] tracking-[-0.01em] text-ink">
                Run your first search
              </div>
            </div>
            <span className="stamp pending stamp-tilted">Not used yet</span>
          </div>
          <p className="mt-2 text-sm text-ink-2 leading-relaxed">
            Pick anyone and we show you who funds them. Try your own
            representative. Then ask follow-ups — they&apos;re free.
          </p>
          <p className="mt-1 text-xs text-ink-3">
            You have all {credits!.allotment} searches this month.
          </p>
          <Link href="/investigate" className="mt-3 inline-block btn-accent text-sm">
            Run your first search
          </Link>
        </div>
      )}

      {/* ── Credits meter with low/empty triggers (#15) ──
          Skipped on first run (the hero above owns that moment). At zero we
          frame it as 'resets on {date}' — 100/mo is a hard cap, no higher tier
          to sell. At ≤20 left, a gentle running-low nudge. */}
      {credits && !firstRun && (
        <div className="mt-8">
          <div className={`stat-tile ${creditsFill}`}>
            <span className="corner-mark">SW-CREDITS</span>
            <div className="meta">This month&apos;s searches</div>

            {outOfCredits ? (
              <>
                <div className="num">
                  0<small> of {credits.allotment} left</small>
                </div>
                <div className="bar mt-1 mb-3">
                  <span className="seg broken" style={{ width: '100%' }} />
                </div>
                <p className="lbl">
                  You&apos;re out of searches this month. They reset{' '}
                  {fmt(credits.periodEnd)} — no charge. Need more sooner? Reply
                  to any newsletter or email us and we&apos;ll help.
                </p>
              </>
            ) : (
              <>
                <div className="num">
                  {credits.remaining}
                  <small> of {credits.allotment} searches left</small>
                </div>
                <div className="bar mt-1 mb-3">
                  <span
                    className={lowCredits ? 'seg partial' : 'seg kept'}
                    style={{ width: `${(credits.remaining / credits.allotment) * 100}%` }}
                  />
                </div>
                {lowCredits ? (
                  <p className="lbl">
                    Running low — {credits.remaining} left this month. They reset{' '}
                    {fmt(credits.periodEnd)}. Each search opens a chat you can keep
                    asking, free.
                  </p>
                ) : (
                  <p className="lbl">
                    Each search opens a chat. Ask all you want, free. Resets{' '}
                    {fmt(credits.periodEnd)}.
                  </p>
                )}
                <Link href="/investigate" className="mt-3 inline-block btn-accent text-sm">
                  Start a search
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Newsletter front-door. Without this, a newsletter subscriber lands on
          this page with no way to reach the thing they paid for — the issues
          live on the free /articles archive and this is the only signed-in
          link to them. */}
      {ent.hasNewsletter && (
        <div className="mt-8 rounded-r-lg border border-line bg-paper p-6">
          <div className="eyebrow mb-1">Your newsletter</div>
          <div className="font-display text-[26px] leading-[1.15] tracking-[-0.01em] text-ink">
            Read this week&apos;s issue
          </div>
          <p className="mt-1 text-xs text-ink-3">
            Every issue lands in your inbox. Read past ones here anytime — free.
          </p>
          <Link
            href="/articles?kind=weekly_receipt"
            className="mt-3 inline-block btn-accent text-sm"
          >
            Read the newsletter
          </Link>
        </div>
      )}

      {ent.hasSoftware && (
        <div className="mt-8">
          <h2 className="eyebrow mb-3">What you get</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            <li>
              <Link
                href="/leaderboard?tab=most-corporate-funded"
                className="block rounded-r-lg border border-line bg-paper hover:bg-paper-2 p-5"
              >
                <div className="eyebrow mb-1">Pro surface</div>
                <div className="font-display text-xl leading-tight tracking-[-0.01em] text-ink">
                  Leaderboards
                </div>
                <div className="mt-1 text-xs text-ink-3">
                  See who takes the most drug, war, and oil money.
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/bills"
                className="block rounded-r-lg border border-line bg-paper hover:bg-paper-2 p-5"
              >
                <div className="eyebrow mb-1">Pro surface</div>
                <div className="font-display text-xl leading-tight tracking-[-0.01em] text-ink">
                  Bill money trails
                </div>
                <div className="mt-1 text-xs text-ink-3">
                  See who paid for each bill, and who helped write it.
                </div>
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* ── Cross-sell value cards (#14) ──
          Only for products the user lacks. Value-framed, not bare price
          buttons. Same hrefs + same gating as the old buttons. */}
      {(!ent.hasSoftware || !ent.hasNewsletter) && (
        <div className="mt-8">
          <div className="eyebrow mb-3">Add to your account</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {!ent.hasSoftware && (
              <div className="receipt">
                <div className="receipt-head flex-wrap gap-3">
                  <div>
                    <div className="receipt-id">{PRODUCT_CODE.software}</div>
                    <div className="receipt-title">{PRODUCT_LABEL.software}</div>
                  </div>
                  <span className="stamp partial">$45/mo</span>
                </div>
                <div className="receipt-body">
                  <p className="text-sm text-ink-2 leading-relaxed">
                    Go past the headline. Search any politician, donor, or bill
                    and ask follow-ups in plain words.
                  </p>
                  <ul className="mt-3 space-y-1.5 list-none p-0 text-sm text-ink-2">
                    <li>See who funds whom — tied to FEC records.</li>
                    <li>Chat each search as long as you want, free.</li>
                    <li>100 searches a month. Stuff no email can show.</li>
                  </ul>
                </div>
                <div className="receipt-foot">
                  <Link href="/api/checkout?product=software" className="btn-accent text-sm">
                    Get Donor Intelligence — $45/mo
                  </Link>
                </div>
              </div>
            )}

            {!ent.hasNewsletter && (
              <div className="receipt">
                <div className="receipt-head flex-wrap gap-3">
                  <div>
                    <div className="receipt-id">{PRODUCT_CODE.newsletter}</div>
                    <div className="receipt-title">{PRODUCT_LABEL.newsletter}</div>
                  </div>
                  <span className="stamp partial">$9/mo</span>
                </div>
                <div className="receipt-body">
                  <p className="text-sm text-ink-2 leading-relaxed">
                    Get the weekly story behind the data — one money trail,
                    explained, in your inbox.
                  </p>
                  <ul className="mt-3 space-y-1.5 list-none p-0 text-sm text-ink-2">
                    <li>One clear story each week. No homework.</li>
                    <li>We pick the trail that matters and show the receipts.</li>
                    <li>Read it in five minutes over coffee.</li>
                  </ul>
                </div>
                <div className="receipt-foot">
                  <Link href="/api/checkout?product=newsletter" className="btn-secondary text-sm">
                    Get it weekly — $9/mo
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Billing / subscription management (#20) ──
          Moved to the bottom: payers open the page on what to DO. The free-plan
          empty state still LEADS this block for a no-sub user, since the
          entitlement-gated sections above collapse out. */}
      <div className="mt-10">
        <div className="eyebrow mb-3">What you pay for</div>
        {liveSubs.length === 0 && (
          <div className="rounded-r-lg border border-line bg-paper-2 p-6">
            <div className="text-xl font-semibold text-ink">You&apos;re on the free plan</div>
            <p className="mt-1 text-sm text-ink-3">Pay for a plan above to unlock more.</p>
          </div>
        )}

        <div className="space-y-3">
          {liveSubs.map((s) => {
            const comp = isCompRow(s)
            const ends = fmt(s.status === 'trialing' ? s.trial_ends_at : s.current_period_end)
            // Comp/manual grants have no real billing schedule — never show a
            // renewal date (it'd read "Renews Dec 31, 2099") or a Cancel button
            // (it would 422 against a Lemon Squeezy sub that doesn't exist).
            const statusLine = comp
              ? 'Complimentary access — courtesy of CampaignReceipts.'
              : s.status === 'canceled'
                ? `Canceled. Access until ${ends ?? 'your month ends'}.`
                : s.status === 'trialing'
                  ? `Trial ends ${ends ?? ''}`
                  : `Renews ${ends ?? ''}`
            // Active paid subs read as "kept" (live, paying); comps and trials
            // are provisional access → "pending". Canceled keeps the pending
            // read since access is winding down, not live-paying.
            const stampKind =
              comp || s.status === 'trialing' || s.status === 'canceled' ? 'pending' : 'kept'
            const stampLabel = comp
              ? 'Comp'
              : s.status === 'canceled'
                ? 'Ending'
                : s.status === 'trialing'
                  ? 'Trial'
                  : 'Active'
            return (
              <div key={s.product} className="receipt">
                <div className="receipt-head flex-wrap gap-3">
                  <div>
                    <div className="receipt-id">{PRODUCT_CODE[s.product]}</div>
                    <div className="receipt-title">{PRODUCT_LABEL[s.product]}</div>
                  </div>
                  <span className={`stamp ${stampKind}`}>{stampLabel}</span>
                </div>

                <div className="receipt-body">
                  <div className="receipt-row">
                    <span className="k">Price</span>
                    <span className="leader" />
                    <span className="v">{PRODUCT_PRICE[s.product]}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="k">Status</span>
                    <span className="leader" />
                    <span className="v sans">{statusLine}</span>
                  </div>
                </div>

                {s.product === 'software' && ent.commercialLicense && (
                  <div className="receipt-verdict">
                    <span className="stamp partial stamp-tilted">Use it at work</span>
                    <p className="v-copy">You can use this data for your job or business.</p>
                  </div>
                )}

                {/* Only real Lemon Squeezy subs are self-serve cancelable.
                    Comps are revoked internally; canceled rows have nothing to
                    cancel. */}
                {!comp && s.status !== 'canceled' && (
                  <div className="receipt-foot">
                    <CancelButton
                      product={s.product}
                      label={PRODUCT_LABEL[s.product]}
                      endsAt={s.status === 'trialing' ? s.trial_ends_at : s.current_period_end}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-10">
        <form method="post" action="/auth/signout">
          <button type="submit" className="text-xs text-ink-3 hover:text-ink-2">
            Sign out
          </button>
        </form>
      </div>
    </section>
  )
}
