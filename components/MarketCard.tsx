'use client';

import { PredictionMarket } from '../lib/mockData';
import { TrendingUp, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketCardProps {
  market: PredictionMarket;
}

export function MarketCard({ market }: MarketCardProps) {
  const isHighOdds = market.impliedProbability > 0.6;
  const isLowOdds = market.impliedProbability < 0.3;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-xs font-mono font-semibold px-2 py-1 rounded border ${
          market.category === 'DONOR_INTEL' 
            ? 'text-accent border-accent/30 bg-accent/10' 
            : 'text-primary border-primary/30 bg-primary/10'
        }`}>
          {market.category}
        </span>
        {market.fecEdgeAvailable && (
          <div className="flex items-center gap-1 text-xs text-accent font-medium bg-accent/10 px-2 py-1 rounded">
            <ShieldAlert size={14} />
            <span>FEC Edge</span>
          </div>
        )}
      </div>

      <h3 className="font-display text-lg font-semibold text-white mb-6 leading-tight">
        {market.title}
      </h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-xs text-text-muted mb-1 font-mono uppercase">Implied Odds</div>
          <div className={`text-2xl font-display font-bold ${
            isHighOdds ? 'text-success text-glow-success' : isLowOdds ? 'text-danger' : 'text-white'
          }`}>
            {(market.impliedProbability * 100).toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted mb-1 font-mono uppercase">Volume</div>
          <div className="text-lg font-mono font-medium text-white flex items-center gap-1">
            <TrendingUp size={16} className="text-primary" />
            ${(market.volume / 1000).toFixed(1)}k
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted mb-1 font-mono uppercase">Expires</div>
          <div className="text-sm font-mono font-medium text-white flex items-center gap-1">
            <Clock size={16} className="text-text-muted" />
            {new Date(market.expirationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 bg-success/10 hover:bg-success/20 text-success border border-success/30 py-2 rounded font-medium transition-colors">
          Buy Yes {(market.impliedProbability).toFixed(2)}
        </button>
        <button className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 py-2 rounded font-medium transition-colors">
          Buy No {(1 - market.impliedProbability).toFixed(2)}
        </button>
      </div>
    </motion.div>
  );
}
