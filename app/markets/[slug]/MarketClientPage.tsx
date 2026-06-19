'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckoutModal } from '../../../components/CheckoutModal';

export function MarketClientPage({ market }: { market: any }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-text-muted hover:text-white text-sm mb-4 inline-block font-mono">
          ← Back to Markets
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/10 text-white/70">
            {market.category}
          </span>
          {market.status === 'OPEN' ? (
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
          {market.title}
        </h1>
        <div className="flex gap-6 text-sm text-text-muted">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider">Volume</span>
            <span className="font-mono text-white text-lg">${market.volume.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider">Implied Probability</span>
            <span className="font-mono text-white text-lg">{(market.impliedProbability * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Market Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold mb-4 font-display">Current Odds</h2>
            <div className="flex flex-col gap-3">
              {market.options.map((opt: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded bg-surface border border-white/5">
                  <span className="font-medium">{opt.name}</span>
                  <span className="font-mono text-xl">{Math.round(opt.price * 100)}¢</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Simulated Chart Area */}
          <div className="glass-panel p-6 h-[300px] flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-20" style={{
               backgroundImage: 'linear-gradient(to right, #3B82F6 2px, transparent 2px), linear-gradient(to bottom, #3B82F6 2px, transparent 2px)',
               backgroundSize: '40px 40px'
             }}></div>
             <span className="text-text-muted font-mono relative z-10">[ Interactive Chart View ]</span>
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
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-4 bg-white/20 rounded w-full"></div>
                <div className="h-4 bg-white/20 rounded w-5/6"></div>
                
                <div className="pt-4 border-t border-white/10 flex justify-between">
                  <div>
                    <div className="h-3 bg-white/20 rounded w-16 mb-1"></div>
                    <div className="h-5 bg-white/20 rounded w-24"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-white/20 rounded w-16 mb-1"></div>
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
              Get real-time API access and donor intelligence for every active market on AlphaPredict.
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
        marketId={market.id}
        title={`Alpha Intel: ${market.title}`}
        price="$49.00"
      />
    </div>
  );
}
