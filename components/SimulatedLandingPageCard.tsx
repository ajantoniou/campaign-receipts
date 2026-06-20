import React from 'react';
import Link from 'next/link';

export function SimulatedLandingPageCard({ market }: { market: any }) {
  const impliedOdds = market.implied;
  const trueOdds = market.alpha;
  const edgeDiff = Math.abs(trueOdds - impliedOdds);
  const isExtreme = edgeDiff > 50;

  let roiMultiplier = 1;
  if (trueOdds > impliedOdds) {
    roiMultiplier = 100 / Math.max(0.01, impliedOdds);
  } else {
    roiMultiplier = 100 / Math.max(0.01, 100 - impliedOdds);
  }

  return (
    <div className="glass-card flex flex-col relative overflow-hidden group h-full">
      {/* Top Header Area */}
      <div className="p-6 pb-4 border-b border-white/5 relative z-10 flex-1">
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1.5 rounded-[6px] border border-white/10 bg-white/5 text-[8px] font-mono tracking-[0.12em] uppercase text-primary">
            {market.source}
          </span>
          <span className="px-3 py-1.5 rounded-[6px] border border-success/30 bg-success-bg text-[8px] font-mono tracking-[0.12em] uppercase text-success font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow"></span> LIVE
          </span>
        </div>
        <h3 className="font-display font-[600] tracking-tight text-primary leading-[1.2] line-clamp-3 text-lg mb-6 group-hover:text-white transition-colors">
          {market.question}
        </h3>
        
        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex justify-between items-end">
            <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-text-muted">Implied Odds</span>
            <span className="font-display font-bold text-primary text-xl">{impliedOdds.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full w-full overflow-hidden border border-white/10">
            <div className="h-full bg-white/20 rounded-full" style={{ width: `${impliedOdds}%` }}></div>
          </div>
        </div>
      </div>

      {/* Paywalled Intel Box Area */}
      <div className="relative bg-background p-6 flex flex-col min-h-[220px]">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-50" />
        
        <h4 className="font-display text-sm font-bold text-primary mb-2 flex items-center gap-2 relative z-10 tracking-tight">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></span>
          Donor Intelligence
        </h4>
        
        {/* Blurred Content */}
        <div className="mt-2 space-y-4 blur-[4px] select-none opacity-40 relative z-0">
          <div className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.1em]">HEADLINE: ALPHA DETECTED</div>
          <div className="h-3 bg-white/20 rounded w-full"></div>
          <div className="h-3 bg-white/20 rounded w-5/6"></div>
          
          <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-text-muted">True Odds</div>
              <div className="text-xl font-display font-bold text-primary">{trueOdds.toFixed(0)}%</div>
            </div>
            <div className="flex flex-col gap-1.5 text-center">
              <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-text-muted">The Edge</div>
              <div className="text-xl font-display font-bold text-accent">+{edgeDiff.toFixed(0)}%</div>
            </div>
            <div className="flex flex-col gap-1.5 text-right">
              <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-text-muted">Est. ROI</div>
              <div className="text-xl font-display font-bold text-success">{roiMultiplier.toFixed(1)}x</div>
            </div>
          </div>
        </div>
        
        {/* Paywall Overlay CTA */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-[6px] text-center">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
            <span className="text-xl">🔒</span>
          </div>
          <h5 className="font-display font-bold text-xl mb-3 text-primary tracking-tight">Alpha Detected</h5>
          {isExtreme ? (
             <div className="bg-danger/20 text-danger border border-danger/30 px-3 py-1.5 rounded-[6px] text-[10px] font-mono font-bold tracking-[0.1em] mb-6 animate-pulse shadow-glow shadow-danger/20">
               EXTREME EDGE DETECTED
             </div>
          ) : (
             <div className="bg-accent/20 text-accent border border-accent/30 px-3 py-1.5 rounded-[6px] text-[10px] font-mono font-bold tracking-[0.1em] mb-6 shadow-glow shadow-accent/20">
               MODERATE EDGE DETECTED
             </div>
          )}
          
          <div className="w-full btn-primary bg-accent hover:bg-accent/90 border-none py-2 text-sm shadow-glow shadow-accent/30">
            Unlock Market Data
          </div>
        </div>
      </div>
    </div>
  );
}
