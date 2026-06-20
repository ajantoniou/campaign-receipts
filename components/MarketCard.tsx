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
    <Link href={`/markets/${dbMarket.slug}`} className="block h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -4 }}
        className="glass-card p-8 h-full flex flex-col justify-between cursor-pointer group"
      >
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono tracking-[0.12em] uppercase px-3 py-1.5 rounded-[6px] border text-primary border-white/10 bg-white/5">
              {dbMarket.group_name || 'POLITICS'}
            </span>
            {hasEdge && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.12em] uppercase text-background font-bold bg-accent px-3 py-1.5 rounded-[6px]">
                <ShieldAlert size={12} />
                <span>Alpha Edge</span>
              </div>
            )}
          </div>

          <h3 className="font-display text-xl font-[600] text-primary leading-[1.2] line-clamp-3 group-hover:text-white transition-colors">
            {dbMarket.question}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.12em]">Implied Odds</div>
            <div className={`text-2xl font-display font-bold ${
              isHighOdds ? 'text-success' : isLowOdds ? 'text-danger' : 'text-primary'
            }`}>
              {impliedOdds.toFixed(0)}%
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.12em]">Volume</div>
            <div className="text-sm font-mono font-medium text-primary flex items-center gap-1.5">
              <TrendingUp size={14} className="text-text-muted" />
              {volumeStr}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.12em]">Expires</div>
            <div className="text-sm font-mono font-medium text-primary flex items-center gap-1.5">
              <Clock size={14} className="text-text-muted" />
              {expiresStr}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
