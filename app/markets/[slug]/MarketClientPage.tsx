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
    <div className="w-full max-w-[1200px] mx-auto px-6 pt-12 pb-24">
      {/* Header */}
      <div className="mb-12 flex flex-col gap-6">
        <Link href="/" className="text-text-muted hover:text-white text-[10px] font-mono tracking-[0.12em] uppercase inline-block">
          ← Back to Markets
        </Link>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-[6px] border border-white/10 bg-white/5 text-[10px] font-mono tracking-[0.12em] uppercase text-primary">
              {dbMarket.group_name || 'POLITICS'}
            </span>
            {isActive ? (
              <span className="px-3 py-1.5 rounded-[6px] border border-success/30 bg-success-bg text-[10px] font-mono tracking-[0.12em] uppercase text-success font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow"></span> LIVE
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-[6px] border border-white/10 bg-white/5 text-[10px] font-mono tracking-[0.12em] uppercase text-text-muted">
                CLOSED
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-[700] tracking-[-0.02em] text-primary leading-tight">
            {dbMarket.question}
          </h1>
        </div>

        <div className="flex flex-wrap gap-8 py-6 border-y border-white/5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-text-muted">Volume</span>
            <span className="font-display font-bold text-primary text-2xl">${dbMarket.volume_usd?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-text-muted">Implied Probability</span>
            <span className="font-display font-bold text-primary text-2xl">{impliedOdds.toFixed(0)}%</span>
          </div>
        </div>

        {/* Outbound link to Market */}
        {dbMarket.source_url && (
          <div>
            <a 
              href={dbMarket.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary inline-block text-xs"
            >
              Trade on {dbMarket.group_name || 'Market'} ↗
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Market Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold mb-6 font-display text-primary">Current Odds</h2>
            <div className="flex flex-col gap-3">
              {(dbMarket.outcomes || []).map((opt: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-[8px] bg-background border border-white/5 hover:border-white/10 transition-colors">
                  <span className="font-medium text-primary font-sans">{opt.name}</span>
                  <span className="font-display font-bold text-2xl text-primary">{Math.round(opt.price * 100)}¢</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Interactive Chart Area */}
          <div className="glass-card p-8 h-[400px] flex flex-col relative overflow-hidden">
            <h3 className="font-display font-bold text-primary text-xl mb-6">Probability Distribution</h3>
            <div className="flex-1 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} stroke="#ffffff20" tickFormatter={(v) => `${v}%`} tick={{ fill: '#8A8A8A', fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis dataKey="name" type="category" width={140} stroke="#ffffff20" tick={{ fill: '#F9FAFB', fontSize: 12, fontFamily: 'sans-serif' }} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#11010A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#FF005E', fontWeight: 'bold', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#F9FAFB', fontWeight: 'bold', marginBottom: '8px' }}
                    formatter={(value: any) => [`${value}%`, 'Implied Probability']}
                  />
                  <Bar dataKey="prob" radius={[0, 4, 4, 0]} barSize={24}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#FF005E' : '#ffffff20'} />
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
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-50" />
            
            <div className="relative bg-background p-8 h-full flex flex-col rounded-[10px]">
              <h3 className="font-display text-lg font-bold text-primary mb-2 flex items-center gap-2 tracking-tight">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></span>
                Donor Intelligence
              </h3>
              
              {/* Blurred content simulating real data */}
              <div className="mt-4 space-y-5 blur-sm select-none opacity-40">
                <div className="text-xs font-mono font-bold text-primary uppercase tracking-[0.1em]">HEADLINE: {dbMarket.edge_headline || "FEC DATA DETECTED"}</div>
                <div className="h-4 bg-white/20 rounded w-full"></div>
                <div className="h-4 bg-white/20 rounded w-5/6"></div>
                
                <div className="pt-6 border-t border-white/10 flex justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-text-muted">True Odds</div>
                    <div className="h-6 bg-white/20 rounded w-20"></div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-text-muted">Lobby Pct</div>
                    <div className="h-6 bg-white/20 rounded w-20"></div>
                  </div>
                </div>
              </div>

              {/* Paywall Overlay CTA */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 bg-background/80 backdrop-blur-md text-center rounded-[10px]">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="font-display font-bold text-2xl mb-3 text-primary tracking-tight">Alpha Detected</h4>
                <p className="text-sm text-text-muted mb-8 leading-relaxed">
                  Our model has identified active FEC filings and Super PAC spending affecting this market.
                </p>
                
                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full btn-primary bg-accent hover:bg-accent/90 shadow-glow shadow-accent/30 mb-4 border-none"
                >
                  Unlock Market Data — $49
                </button>
                
                <p className="text-[10px] font-mono text-text-muted tracking-[0.05em] uppercase">
                  One-time fee until expiry.
                </p>
              </div>
            </div>
          </div>

          {/* Full Access CTA */}
          <div className="glass-card p-8 border-white/5 text-center flex flex-col items-center">
            <h4 className="font-display font-bold text-primary text-xl mb-3">Want full access?</h4>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              Get real-time API access and donor intelligence for every active market.
            </p>
            <Link href="/pricing" className="text-sm font-mono tracking-[0.05em] uppercase text-primary hover:text-accent transition-colors underline underline-offset-4 font-bold">
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
