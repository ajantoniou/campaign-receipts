'use client'

import { useState } from 'react'
import { ExternalLink, Lock, Search, Terminal, AlertTriangle, TrendingUp } from 'lucide-react'
import type { BettingSnapshot, BettingGroup, BettingMarket } from '@/lib/betting-markets'
import Link from 'next/link'

interface TerminalClientProps {
  snap: BettingSnapshot
  hasAccess: boolean
}

function fmtUsd(v: number | null): string {
  if (v === null || v <= 0) return '—'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export default function TerminalClient({ snap, hasAccess }: TerminalClientProps) {
  const [activeTab, setActiveTab] = useState<BettingGroup | 'All'>('All')
  const [search, setSearch] = useState('')

  const allMarkets = snap.markets || []
  
  const filtered = allMarkets.filter(m => {
    if (activeTab !== 'All' && m.group !== activeTab) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!m.question.toLowerCase().includes(q)) return false
    }
    return true
  })

  const groups: (BettingGroup | 'All')[] = ['All', 'Elections', 'Legislation', 'World & Policy']

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00FF00] font-mono selection:bg-[#00FF00] selection:text-black p-4 sm:p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="mb-8 border-b border-[#333] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 text-[#58A6FF]">
              <Terminal className="w-5 h-5" />
              <span className="text-[11px] uppercase tracking-widest">Campaign Receipts · Alpha Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Institutional Data Terminal
            </h1>
            <p className="text-[#888] text-sm max-w-2xl leading-relaxed">
              Live predictive market pricing overlaid with real-time campaign finance capital flows.
              Discover arbitrage gaps driven by undisclosed PAC injections and hidden lobby consensus.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#888]">
              <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse" />
              LIVE FEED
            </div>
            {!hasAccess && (
              <Link href="/pricing" className="bg-[#b3271e] text-white px-4 py-2 rounded font-bold hover:bg-[#911f18] transition-colors">
                UNLOCK ACCESS
              </Link>
            )}
          </div>
        </header>

        {/* Disclaimer */}
        <div className="mb-8 border border-[#333] bg-[#111] p-4 flex gap-3 text-sm text-[#888]">
          <AlertTriangle className="w-5 h-5 shrink-0 text-[#b3271e]" />
          <p>
            <strong className="text-white">Compliance Notice:</strong> This terminal displays raw market data from public predictive markets alongside our proprietary campaign finance intelligence. We do not operate these markets, endorse speculation, or provide betting advice. This is a B2B intelligence dashboard.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-2 bg-[#111] border border-[#333] p-1 rounded">
            {groups.map(g => (
              <button
                key={g}
                onClick={() => setActiveTab(g)}
                className={`px-4 py-1.5 text-sm transition-colors rounded ${
                  activeTab === g ? 'bg-[#333] text-white' : 'text-[#888] hover:text-[#bbb]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
            <input
              type="text"
              placeholder="Search markets or politicians..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#58A6FF]"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-6">
          {!snap.ok && (
            <div className="border border-[#b3271e] bg-[#b3271e]/10 text-[#b3271e] p-6 text-center rounded">
              Connection to live markets failed. Retrying...
            </div>
          )}
          {snap.ok && filtered.length === 0 && (
            <div className="border border-[#333] bg-[#111] text-[#666] p-12 text-center rounded">
              No active markets match your filters.
            </div>
          )}
          {filtered.map(m => (
            <MarketTerminalCard key={m.id} market={m} hasAccess={hasAccess} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[#333] text-xs text-[#666] flex justify-between items-center">
          <span>SOURCE: GAMMA API / FEC.GOV</span>
          <span>LAST SYNC: {new Date(snap.fetchedAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

function MarketTerminalCard({ market, hasAccess }: { market: BettingMarket, hasAccess: boolean }) {
  const edge = market.edge
  const primaryOutcome = market.outcomes[0]
  
  // Calculate edge if we have data
  const hasEdgeData = !!edge
  const liveOdds = primaryOutcome?.yesPct ?? 50
  const trueOdds = edge?.trueOddsPct ?? null
  const arbGap = trueOdds !== null ? trueOdds - liveOdds : null
  
  return (
    <div className="border border-[#333] bg-[#111] rounded overflow-hidden flex flex-col md:flex-row">
      {/* Left: Market Data */}
      <div className="p-5 md:w-[60%] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#333]">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#666] mb-2 flex items-center justify-between">
            <span>{market.group}</span>
            <span>VOL: {fmtUsd(market.volumeUsd)}</span>
          </div>
          <h3 className="text-lg text-white mb-4 leading-snug hover:text-[#58A6FF] transition-colors">
            <Link href={`/betting/${market.slug}`}>{market.question}</Link>
          </h3>
          
          <div className="space-y-2">
            {market.outcomes.slice(0, 3).map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-[#888] w-24 truncate">{o.label}</span>
                <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white" 
                    style={{ width: `${Math.max(o.yesPct, 1)}%` }} 
                  />
                </div>
                <span className="text-sm text-white w-12 text-right">
                  {o.yesPct.toFixed(0)}¢
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-5 pt-4 border-t border-[#222] flex justify-end">
          <a 
            href={market.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer nofollow"
            className="text-xs text-[#58A6FF] hover:underline flex items-center gap-1"
          >
            VIEW RAW MARKET <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Right: CR Lobby Edge Panel */}
      <div className="p-5 md:w-[40%] bg-[#1a1a1a] relative flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-[#58A6FF]">
          <TrendingUp className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-widest">CR Institutional Edge</span>
        </div>

        {hasEdgeData ? (
          <div className={`flex-1 flex flex-col ${!hasAccess ? 'blur-[4px] select-none opacity-50' : ''}`}>
            <div className="mb-4">
              <div className="text-[10px] text-[#888] mb-1">DATA MATCH</div>
              <div className="text-sm text-white">{edge.headline}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#111] border border-[#333] p-3 rounded">
                <div className="text-[10px] text-[#888] mb-1 uppercase">Outside Money</div>
                <div className="text-lg text-white">{fmtUsd(edge.totalOutsideSpend)}</div>
              </div>
              <div className="bg-[#111] border border-[#333] p-3 rounded">
                <div className="text-[10px] text-[#888] mb-1 uppercase">Institutional Support</div>
                <div className="text-lg text-white">
                  {edge.lobbyConsensusPct != null ? `${edge.lobbyConsensusPct}%` : 
                   edge.lobbyStrengthScore != null ? `${edge.lobbyStrengthScore}/100` : '—'}
                </div>
              </div>
            </div>

            <div className="bg-[#222] p-3 rounded mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-[#888] uppercase">Arbitrage Gap</span>
                {arbGap !== null && (
                  <span className={`text-xs font-bold ${arbGap > 0 ? 'text-[#00FF00]' : 'text-[#b3271e]'}`}>
                    {arbGap > 0 ? '+' : ''}{arbGap.toFixed(1)}¢ EDGE
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[10px] text-[#888]">TRUE ODDS</div>
                  <div className="text-xl text-[#58A6FF]">{trueOdds?.toFixed(1)}¢</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#888]">MARKET ODDS</div>
                  <div className="text-xl text-white">{liveOdds.toFixed(1)}¢</div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-[#888] leading-relaxed border-l-2 border-[#58A6FF] pl-3">
              {edge.insight}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <span className="text-xs text-[#666]">
              No direct campaign finance anomalies detected for this market yet.
            </span>
          </div>
        )}

        {/* Lock Overlay */}
        {hasEdgeData && !hasAccess && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-[2px]">
            <Lock className="w-8 h-8 text-white mb-3" />
            <h4 className="text-sm font-bold text-white mb-2 text-center uppercase tracking-wide">
              Data Protected
            </h4>
            <p className="text-[11px] text-[#ccc] text-center mb-4 leading-relaxed max-w-[200px]">
              Unlock the Terminal to see calculated donor edges, true odds, and actionable capital flow anomalies.
            </p>
            <Link 
              href="/pricing"
              className="bg-[#b3271e] text-white px-4 py-2 rounded text-xs font-bold hover:bg-[#911f18] transition-colors"
            >
              UPGRADE TO ALPHA
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
