'use client';

import { Filter, ArrowUpDown } from 'lucide-react';

export type SortOption = 'ODDS_DESC' | 'ODDS_ASC' | 'VOLUME_DESC' | 'EXPIRATION_ASC';

interface FilterBarProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function FilterBar({ currentSort, onSortChange }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-white/5">
      <div className="flex items-center gap-2 mb-4 sm:mb-0">
        <Filter size={18} className="text-text-muted" />
        <h2 className="font-display text-lg font-medium text-white">Live Markets</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-mono text-text-muted mr-2">Sort by:</span>
        <SortButton 
          active={currentSort === 'ODDS_DESC'} 
          onClick={() => onSortChange('ODDS_DESC')}
          label="Highest Odds"
        />
        <SortButton 
          active={currentSort === 'VOLUME_DESC'} 
          onClick={() => onSortChange('VOLUME_DESC')}
          label="Bet Size (Vol)"
        />
        <SortButton 
          active={currentSort === 'EXPIRATION_ASC'} 
          onClick={() => onSortChange('EXPIRATION_ASC')}
          label="Expiring Soon (0DTE)"
        />
      </div>
    </div>
  );
}

function SortButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        active 
          ? 'bg-white/10 text-white border border-white/20 shadow-glow' 
          : 'bg-transparent text-text-muted border border-white/5 hover:bg-white/5 hover:text-white'
      }`}
    >
      {label}
      {active && <ArrowUpDown size={14} className="opacity-70" />}
    </button>
  );
}
