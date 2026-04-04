'use client';

import { ARCANA_ORDER, ARCANA_COLORS } from '@/lib/types';

interface ArcanFilterProps {
  selected: string | null;
  onSelect: (arcana: string | null) => void;
  counts: Record<string, number>;
  allLabel?: string;
}

export default function ArcanFilter({ selected, onSelect, counts, allLabel = '全部' }: ArcanFilterProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-[var(--p5r-dark)] rounded-xl border border-[var(--p5r-gray)]">
      <button
        onClick={() => onSelect(null)}
        className={`
          px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          ${selected === null 
            ? 'bg-[var(--p5r-red)] text-white' 
            : 'bg-[var(--p5r-gray)] text-[var(--p5r-light)] hover:bg-[var(--p5r-gray)]/70'
          }
        `}
      >
        {allLabel} ({totalCount})
      </button>
      
      {ARCANA_ORDER.filter(arcana => counts[arcana] > 0).map((arcana) => (
        <button
          key={arcana}
          onClick={() => onSelect(arcana)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${selected === arcana
              ? 'text-white'
              : 'text-[var(--p5r-light)] hover:opacity-80'
            }
          `}
          style={{ 
            backgroundColor: selected === arcana ? ARCANA_COLORS[arcana] : 'var(--p5r-gray)',
          }}
        >
          {arcana} ({counts[arcana]})
        </button>
      ))}
    </div>
  );
}
