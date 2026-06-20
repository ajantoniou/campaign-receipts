'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export function MarketCard({ dbMarket }: { dbMarket: any }) {
  // DB schema:
  // slug, question, group_name, volume_usd, end_date, outcomes (jsonb: [{name, price}]), edge_true_odds, edge_headline

  const impliedOdds = dbMarket.outcomes && dbMarket.outcomes.length > 0 
    ? (dbMarket.outcomes[0].price * 100) 
    : 50;
    
  const isHighOdds = impliedOdds > 60;
  const isLowOdds = impliedOdds < 30;
  const hasEdge = !!dbMarket.edge_headline;

  const volumeStr = dbMarket.volume_usd 
    ? `$${(dbMarket.volume_usd / 1000).toFixed(1)}k`
    : 'N/A';

  const expiresStr = dbMarket.end_date
    ? new Date(dbMarket.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Open';

  return (
    <Link href={`/markets/${dbMarket.slug}`} className="block">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="glass-card p-6 h-full flex flex-col justify-between cursor-pointer border border-white/5 hover:border-white/20 transition-colors"
      >
        <div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded border text-primary border-primary/30 bg-primary/10">
              {dbMarket.group_name || 'POLITICS'}
            </span>
            {hasEdge && (
              <div className="flex items-center gap-1 text-xs text-accent font-medium bg-accent/10 px-2 py-1 rounded">
                <ShieldAlert size={14} />
                <span>Alpha Edge</span>
              </div>
            )}
          </div>

          <h3 className="font-display text-lg font-semibold text-white mb-6 leading-tight line-clamp-3">
            {dbMarket.question}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div>
            <div className="text-[10px] sm:text-xs text-text-muted mb-1 font-mono uppercase">Implied Odds</div>
            <div className={`text-xl sm:text-2xl font-display font-bold ${
              isHighOdds ? 'text-success' : isLowOdds ? 'text-danger' : 'text-white'
            }`}>
              {impliedOdds.toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-text-muted mb-1 font-mono uppercase">Volume</div>
            <div className="text-sm sm:text-base font-mono font-medium text-white flex items-center gap-1">
              <TrendingUp size={14} className="text-primary hidden sm:block" />
              {volumeStr}
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-text-muted mb-1 font-mono uppercase">Expires</div>
            <div className="text-sm font-mono font-medium text-white flex items-center gap-1">
              <Clock size={14} className="text-text-muted hidden sm:block" />
              {expiresStr}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
