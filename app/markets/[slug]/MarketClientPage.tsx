'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckoutModal } from '../../../components/CheckoutModal';

export function MarketClientPage({ dbMarket }: { dbMarket: any }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const impliedOdds = dbMarket.outcomes && dbMarket.outcomes.length > 0 
    ? (dbMarket.outcomes[0].price * 100) 
    : 50;

  const chartData = (dbMarket.outcomes || []).map((opt: any) => ({
    name: opt.name,
    prob: Math.round(opt.price * 100),
  }));

  const isActive = new Date(dbMarket.end_date) > new Date() || !dbMarket.end_date;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-text-muted hover:text-white text-sm mb-4 inline-block font-mono">
          ← Back to Markets
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/10 text-white/70">
            {dbMarket.group_name || 'POLITICS'}
          </span>
          {isActive ? (
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-success-bg text-success border border-success/20">
              ● LIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/5 text-white/40">
              CLOSED
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
          {dbMarket.question}
        </h1>
        <div className="flex gap-6 text-sm text-text-muted mb-6">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider">Volume</span>
            <span className="font-mono text-white text-lg">${dbMarket.volume_usd?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider">Implied Probability</span>
            <span className="font-mono text-white text-lg">{impliedOdds.toFixed(0)}%</span>
          </div>
        </div>

        {/* Outbound link to Polymarket */}
        {dbMarket.source_url && (
          <a 
            href={dbMarket.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 font-bold py-2 px-6 rounded transition-colors uppercase"
          >
            Trade on {dbMarket.group_name || 'Market'} ↗
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Market Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold mb-4 font-display">Current Odds</h2>
            <div className="flex flex-col gap-3">
              {(dbMarket.outcomes || []).map((opt: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded bg-surface border border-white/5">
                  <span className="font-medium">{opt.name}</span>
                  <span className="font-mono text-xl">{Math.round(opt.price * 100)}¢</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Interactive Chart Area */}
          <div className="glass-panel p-6 h-[350px] flex flex-col relative overflow-hidden">
            <h3 className="font-display font-bold text-white mb-4">Probability Distribution</h3>
            <div className="flex-1 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} stroke="#ffffff40" tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" width={140} stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff10' }}
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value}%`, 'Implied Probability']}
                  />
                  <Bar dataKey="prob" radius={[0, 4, 4, 0]} barSize={32}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#60A5FA'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Col - Paywall & Pricing */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Paywalled Intel Box */}
          <div className="glass-panel p-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50" />
            
            <div className="relative bg-background p-6 h-full flex flex-col">
              <h3 className="font-display text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></span>
                Donor Intelligence
              </h3>
              
              {/* Blurred content simulating real data */}
              <div className="mt-4 space-y-4 blur-sm select-none opacity-50">
                <div className="text-sm font-bold text-white">HEADLINE: {dbMarket.edge_headline || "FEC DATA DETECTED"}</div>
                <div className="h-4 bg-white/20 rounded w-full"></div>
                <div className="h-4 bg-white/20 rounded w-5/6"></div>
                
                <div className="pt-4 border-t border-white/10 flex justify-between">
                  <div>
                    <div className="h-3 bg-white/20 rounded w-16 mb-1">True Odds</div>
                    <div className="h-5 bg-white/20 rounded w-24"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-white/20 rounded w-16 mb-1">Lobby Pct</div>
                    <div className="h-5 bg-white/20 rounded w-24"></div>
                  </div>
                </div>
              </div>

              {/* Paywall Overlay CTA */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-sm text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-xl">🔒</span>
                </div>
                <h4 className="font-bold text-lg mb-2">Alpha Detected</h4>
                <p className="text-xs text-text-muted mb-6">
                  Our model has identified active FEC filings and Super PAC spending affecting this market.
                </p>
                
                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full btn-primary py-2 text-sm shadow-glow shadow-primary/30 hover:shadow-primary/50 transition-shadow mb-3"
                >
                  Unlock Market Data — $49
                </button>
                
                <p className="text-[10px] text-text-muted">
                  One-time fee until market expires. Includes email alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Full Access CTA */}
          <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-surface to-background text-center">
            <h4 className="font-bold mb-2">Want full access?</h4>
            <p className="text-sm text-text-muted mb-4">
              Get real-time API access and donor intelligence for every active market on Campaign Receipts.
            </p>
            <Link href="/pricing" className="text-sm text-primary hover:text-primary-hover font-medium underline underline-offset-4">
              View Alpha Terminal Pricing →
            </Link>
          </div>

        </div>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        marketId={dbMarket.id}
        title={`Alpha Intel: ${dbMarket.question}`}
        price="$49.00"
      />
    </div>
  );
}
