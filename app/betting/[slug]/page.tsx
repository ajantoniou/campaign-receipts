import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEntitlement } from '@/lib/entitlement'
import { AlertTriangle, Lock, TrendingUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import MarketTrackerForm from './MarketTrackerForm'
import fs from 'fs'
import path from 'path'

export const dynamicParams = true // Allow dynamic rendering if file isn't generated yet
export const revalidate = 3600 // Cache for 1 hour

function getMarketData(slug: string) {
  const jsonPath = path.join(process.cwd(), 'data', 'markets', `${slug}.json`)
  if (!fs.existsSync(jsonPath)) return null
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  } catch {
    return null
  }
}

export async function generateStaticParams() {
  const dataDir = path.join(process.cwd(), 'data', 'markets')
  if (!fs.existsSync(dataDir)) return []
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))
  return files.map(f => ({
    slug: f.replace('.json', '')
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = getMarketData(params.slug)
  if (!data) return { title: 'Market Not Found' }
  return {
    title: `${data.market.question} — Alpha Terminal`,
    description: `Real-time prediction market data and institutional capital flow edge for ${data.market.question}.`,
  }
}

function fmtUsd(v: number | null): string {
  if (v === null || v <= 0) return '—'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export default async function MarketSlugPage({ params }: { params: { slug: string } }) {
  const data = getMarketData(params.slug)
  const ent = await getEntitlement()

  if (!data) {
    // If the cron hasn't processed this market yet, 404 for now.
    // In the future we could do a synchronous fallback fetch here.
    notFound()
  }

  const { market, edge } = data
  const hasAccess = ent.hasSoftware
  const hasEdgeData = !!edge

  const primaryOutcome = market.outcomes[0]
  const liveOdds = primaryOutcome?.yesPct ?? 50
  const trueOdds = edge?.trueOddsPct ?? null
  const arbGap = trueOdds !== null ? trueOdds - liveOdds : null

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#00FF00] font-mono selection:bg-[#00FF00] selection:text-black py-10 sm:py-16">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        
        {/* Breadcrumb & Warning */}
        <div className="mb-8">
          <Link href="/betting" className="text-[#58A6FF] hover:underline text-sm mb-4 inline-block">
            ← Back to Terminal
          </Link>
          <div className="border border-[#333] bg-[#111] p-4 flex gap-3 text-sm text-[#888]">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#b3271e]" />
            <p>
              <strong className="text-white">Compliance Notice:</strong> This page displays raw market data from public predictive markets alongside our proprietary campaign finance intelligence. We do not operate these markets, endorse speculation, or provide betting advice.
            </p>
          </div>
        </div>

        {/* Public Data Layer (SEO Indexed) */}
        <section className="border border-[#333] bg-[#111] p-6 rounded mb-8">
          <div className="text-[10px] uppercase tracking-widest text-[#666] mb-3 flex justify-between items-center">
            <span>{market.group} · Public Market Data</span>
            <span>VOL: {fmtUsd(market.volumeUsd)}</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-6 leading-snug">
            {market.question}
          </h1>

          <div className="space-y-4 mb-6">
            {market.outcomes.slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-[#888] w-32 truncate">{o.label}</span>
                <div className="flex-1 h-2 bg-[#222] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white" 
                    style={{ width: `${Math.max(o.yesPct, 1)}%` }} 
                  />
                </div>
                <span className="text-lg font-bold text-white w-16 text-right tabular-nums">
                  {o.yesPct.toFixed(0)}¢
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#222] flex justify-between items-center">
            <span className="text-xs text-[#666]">End Date: {market.endDate ? new Date(market.endDate).toLocaleDateString() : 'TBD'}</span>
            <a 
              href={market.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              className="text-xs text-[#58A6FF] hover:underline flex items-center gap-1"
            >
              VIEW RAW MARKET <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        {/* Locked Intelligence Layer */}
        <section className="relative border border-[#333] bg-[#1a1a1a] p-6 rounded">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[#58A6FF]">
              <TrendingUp className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Institutional Edge Analysis</h2>
            </div>
          </div>

          {hasEdgeData ? (
            <div className={`space-y-6 ${!hasAccess ? 'blur-[5px] select-none opacity-40' : ''}`}>
              <div>
                <div className="text-xs text-[#888] mb-1 uppercase tracking-wider">Primary Data Match</div>
                <div className="text-base text-white">{edge.headline}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#333] p-4 rounded">
                  <div className="text-xs text-[#888] mb-1 uppercase tracking-wider">Outside Money</div>
                  <div className="text-2xl font-bold text-white">{fmtUsd(edge.totalOutsideSpend)}</div>
                </div>
                <div className="bg-[#111] border border-[#333] p-4 rounded">
                  <div className="text-xs text-[#888] mb-1 uppercase tracking-wider">Institutional Support</div>
                  <div className="text-2xl font-bold text-white">
                    {edge.lobbyConsensusPct != null ? `${edge.lobbyConsensusPct}%` : 
                     edge.lobbyStrengthScore != null ? `${edge.lobbyStrengthScore}/100` : '—'}
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-[#333] p-5 rounded">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-[#888] uppercase tracking-wider">Calculated Arbitrage Gap</span>
                  {arbGap !== null && (
                    <span className={`text-sm font-bold px-2 py-1 rounded bg-[#222] ${arbGap > 0 ? 'text-[#00FF00]' : 'text-[#b3271e]'}`}>
                      {arbGap > 0 ? '+' : ''}{arbGap.toFixed(1)}¢ EDGE DETECTED
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-8 border-t border-[#333] pt-4">
                  <div>
                    <div className="text-xs text-[#888] mb-1">TRUE ODDS (DATA IMPUTED)</div>
                    <div className="text-3xl font-bold text-[#58A6FF]">{trueOdds?.toFixed(1)}¢</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#888] mb-1">CURRENT MARKET ODDS</div>
                    <div className="text-3xl font-bold text-white">{liveOdds.toFixed(1)}¢</div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-[#888] leading-relaxed border-l-2 border-[#58A6FF] pl-4 py-2 bg-[#111]/50">
                {edge.insight}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-center p-8 border border-dashed border-[#333] rounded">
              <span className="text-sm text-[#666]">
                No direct campaign finance anomalies detected for this market yet. Our cron workers continuously monitor FEC filings.
              </span>
            </div>
          )}

          {/* Overlay if paywalled */}
          {hasEdgeData && !hasAccess && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-black/70 backdrop-blur-sm rounded">
              <Lock className="w-10 h-10 text-white mb-4" />
              <h3 className="text-lg font-bold text-white mb-3 text-center uppercase tracking-wide">
                Institutional Data Protected
              </h3>
              <p className="text-sm text-[#ccc] text-center mb-6 leading-relaxed max-w-md">
                Unlock Terminal Access to see calculated donor edges, true odds, arbitrage gaps, and actionable capital flow anomalies for this market.
              </p>
              <div className="flex gap-4">
                <Link 
                  href="/pricing"
                  className="bg-[#b3271e] text-white px-6 py-3 rounded text-sm font-bold hover:bg-[#911f18] transition-colors"
                >
                  UPGRADE TO ALPHA ($500/mo)
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Email Alert Capture */}
        <MarketTrackerForm slug={market.slug} />

      </div>
    </main>
  )
}
