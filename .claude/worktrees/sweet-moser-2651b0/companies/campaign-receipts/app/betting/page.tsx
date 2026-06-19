import type { Metadata } from 'next'
import { ExternalLink, AlertTriangle } from 'lucide-react'
import { getBettingSnapshot, type BettingGroup, type BettingMarket } from '@/lib/betting-markets'

// Cache this page server-side for 10 minutes so we don't hammer the public API.
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Betting Markets — Experimental — CampaignReceipts',
  description:
    'What public betting markets think will happen in politics. Live odds from Polymarket. Market speculation only — not our data, not a prediction, not advice.',
  robots: { index: false, follow: false },
}

const GROUP_ORDER: BettingGroup[] = ['Elections', 'Legislation', 'World & Policy']

function fmtVolume(v: number | null): string | null {
  if (v === null || v <= 0) return null
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M traded`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K traded`
  return `$${v.toFixed(0)} traded`
}

export default async function BettingPage() {
  const snap = await getBettingSnapshot()
  const byGroup = new Map<BettingGroup, BettingMarket[]>()
  for (const m of snap.markets) {
    const arr = byGroup.get(m.group) || []
    arr.push(m)
    byGroup.set(m.group, arr)
  }

  return (
    <main className="bg-paper min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        {/* Eyebrow */}
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-broken mb-3">
          Experimental · Read-only tracker
        </p>

        {/* Title */}
        <h1 className="font-display text-display-lg text-ink leading-none mb-4">
          What the betting markets think will happen
        </h1>

        <p className="font-sans text-lg text-ink/80 max-w-2xl mb-6">
          People bet real money on politics. We show their best guesses here. A higher
          percent means more bettors think it will happen. That is all it means.
        </p>

        {/* Disclaimer — clear, up top */}
        <div className="rounded-r-lg border-l-4 border-broken bg-paper-2 px-4 py-3 mb-10 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-broken shrink-0 mt-0.5" aria-hidden />
          <p className="font-sans text-sm text-ink/80">
            <strong className="text-ink">These are public betting markets.</strong> Not our
            data. Not a prediction. Not advice. The odds come from Polymarket, a place where
            people bet on news. We just show them. We do not endorse betting and we do not run
            these markets.
          </p>
        </div>

        {/* Live state */}
        {!snap.ok && (
          <div className="rounded-lg border border-line bg-paper-2 px-5 py-8 text-center">
            <p className="font-display text-2xl text-ink mb-2">Live odds are not loading right now.</p>
            <p className="font-sans text-sm text-ink/70">
              We could not reach the betting markets. Check back in a few minutes. We will
              never make up odds — when we cannot get real numbers, we show nothing.
            </p>
          </div>
        )}

        {snap.ok &&
          GROUP_ORDER.map((group) => {
            const markets = byGroup.get(group)
            if (!markets || markets.length === 0) return null
            return (
              <section key={group} className="mb-12">
                <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-ink/60 border-b border-line pb-2 mb-5">
                  {group}
                </h2>
                <div className="grid gap-4">
                  {markets.map((m) => (
                    <MarketCard key={m.id} market={m} />
                  ))}
                </div>
              </section>
            )
          })}

        {/* Footer note + source */}
        {snap.ok && (
          <p className="font-mono text-xs text-ink/50 mt-8">
            Source: Polymarket public Gamma API · odds updated about every 10 minutes ·
            snapshot {new Date(snap.fetchedAt).toUTCString()}
          </p>
        )}
      </div>
    </main>
  )
}

function MarketCard({ market }: { market: BettingMarket }) {
  const vol = fmtVolume(market.volumeUsd)
  return (
    <article className="rounded-lg border border-line bg-paper-2 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="font-display text-xl sm:text-2xl text-ink leading-tight">
          {market.question}
        </h3>
      </div>

      <ul className="space-y-2 mb-4">
        {market.outcomes.map((o, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="font-sans text-sm text-ink/85 flex-1 truncate">{o.label}</span>
            <div className="w-28 sm:w-40 h-2 rounded-full bg-paper-3 overflow-hidden shrink-0">
              <div
                className="h-full bg-ink/70 rounded-full"
                style={{ width: `${Math.max(o.yesPct, 1)}%` }}
              />
            </div>
            <span className="font-mono text-sm text-ink tabular-nums w-14 text-right shrink-0">
              {o.yesPct.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-line/60">
        <span className="font-mono text-xs text-ink/50">{vol ?? 'live market'}</span>
        <a
          href={market.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-mono text-xs text-broken hover:underline inline-flex items-center gap-1"
        >
          See on Polymarket <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </article>
  )
}
