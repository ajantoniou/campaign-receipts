'use client';

import { useState, useEffect } from 'react';
import { mockMarkets, PredictionMarket } from '../lib/mockData';
import { subscribeToIntel, IntelAlert as IntelAlertType } from '../lib/aiIntel';
import { MarketCard } from '../components/MarketCard';
import { FilterBar, SortOption } from '../components/FilterBar';
import { IntelAlert } from '../components/IntelAlert';
import { PortfolioWidget } from '../components/PortfolioWidget';

export default function Home() {
  const [markets, setMarkets] = useState<PredictionMarket[]>(mockMarkets);
  const [sortOption, setSortOption] = useState<SortOption>('VOLUME_DESC');
  const [latestAlert, setLatestAlert] = useState<IntelAlertType | null>(null);

  useEffect(() => {
    // Subscribe to live AI intel alerts
    const unsubscribe = subscribeToIntel((alert) => {
      setLatestAlert(alert);
      
      // Clear alert after 10 seconds to simulate a transient notification
      setTimeout(() => setLatestAlert(null), 10000);
    });

    return unsubscribe;
  }, []);

  // Sort logic
  const sortedMarkets = [...markets].sort((a, b) => {
    switch (sortOption) {
      case 'ODDS_DESC':
        return b.impliedProbability - a.impliedProbability;
      case 'ODDS_ASC':
        return a.impliedProbability - b.impliedProbability;
      case 'VOLUME_DESC':
        return b.volume - a.volume;
      case 'EXPIRATION_ASC':
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Portfolio & Intel */}
        <div className="lg:col-span-1 space-y-8">
          <PortfolioWidget />
          
          <div className="glass-panel p-6">
            <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></span>
              Donor Intelligence
            </h3>
            <p className="text-sm text-text-muted mb-4 leading-relaxed">
              Our AI ingests FEC data, Super PAC filings, and knowledge graphs to give you an edge before the market reacts.
            </p>
            <div className="space-y-4">
              <div className="p-3 bg-surface border border-white/5 rounded-lg">
                <div className="text-xs font-mono text-accent mb-1">PREMIUM INTEL</div>
                <div className="text-sm text-white/90">A top NY-14 donor just pivoted funds to a dark horse candidate.</div>
              </div>
              <div className="p-3 bg-surface border border-white/5 rounded-lg">
                <div className="text-xs font-mono text-primary mb-1">FEC FILING DETECTED</div>
                <div className="text-sm text-white/90">"Liberty First" PAC burning cash 3x faster than baseline.</div>
              </div>
            </div>
            <button className="w-full mt-6 btn-secondary text-sm">Upgrade to Alpha Tier</button>
          </div>
        </div>

        {/* Right Column - Markets */}
        <div className="lg:col-span-2">
          {/* Live Alert Banner */}
          <IntelAlert alert={latestAlert} />

          <FilterBar currentSort={sortOption} onSortChange={setSortOption} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedMarkets.map(market => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
