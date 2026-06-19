'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IntelAlert as IntelAlertType } from '../lib/aiIntel';
import { ShieldAlert, Zap, Network } from 'lucide-react';

interface IntelAlertProps {
  alert: IntelAlertType | null;
}

export function IntelAlert({ alert }: IntelAlertProps) {
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative overflow-hidden mb-8 p-[1px] rounded-xl bg-gradient-to-r from-accent/50 via-primary/50 to-accent/50 shadow-glow shadow-accent-glow"
        >
          <div className="bg-background/95 backdrop-blur-xl p-4 sm:p-6 rounded-xl flex items-start gap-4">
            <div className={`p-3 rounded-lg flex-shrink-0 ${
              alert.source === 'FEC_FILING' ? 'bg-accent/20 text-accent' :
              alert.source === 'KNOWLEDGE_GRAPH' ? 'bg-primary/20 text-primary' :
              'bg-white/10 text-white'
            }`}>
              {alert.source === 'FEC_FILING' && <Zap size={24} />}
              {alert.source === 'KNOWLEDGE_GRAPH' && <Network size={24} />}
              {alert.source === 'NEWS_API' && <ShieldAlert size={24} />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-white bg-white/10 px-2 py-0.5 rounded">
                  Fresh Intel
                </span>
                <span className="text-xs font-mono text-text-muted">
                  Just now
                </span>
              </div>
              <p className="text-sm sm:text-base font-medium text-white/90 leading-relaxed">
                {alert.message}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
