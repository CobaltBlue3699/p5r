'use client';

import { Persona, formatResist, ARCANA_COLORS } from '@/lib/types';

interface PersonaCardProps {
  persona: Persona;
  onClick?: () => void;
}

const RESIST_LABELS = ['phys', 'gun', 'fire', 'ice', 'elec', 'wind', 'psy', 'nuke', 'bless', 'curse'] as const;
const RESIST_DISPLAY: Record<string, string> = {
  phys: '物', gun: '槍', fire: '火', ice: '冰', elec: '電', wind: '風',
  psy: '念', nuke: '核', bless: '祝', curse: '咒'
};

export default function PersonaCard({ persona, onClick }: PersonaCardProps) {
  const arcanaColor = ARCANA_COLORS[persona.arcana] || '#9B59B6';
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[var(--p5r-dark)] rounded-xl overflow-hidden card-hover border border-[var(--p5r-gray)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--p5r-red)]"
    >
      <div className="flex gap-3 p-3">
        <div className="relative w-16 h-16 flex-shrink-0 bg-[var(--p5r-gray)] rounded-lg overflow-hidden">
          {persona.image_url ? (
            <img
              src={persona.image_url}
              alt={persona.name_cn}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
              ?
            </div>
          )}
          <div 
            className="absolute top-0 left-0 w-1 h-full"
            style={{ backgroundColor: arcanaColor }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span suppressHydrationWarning className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: arcanaColor }}>
              Lv.{persona.level}
            </span>
            <span suppressHydrationWarning className="text-xs text-[var(--p5r-light)] opacity-60">
              {persona.arcana}
            </span>
          </div>
          
          <h3 className="text-base font-semibold text-white truncate mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {persona.name_cn}
          </h3>
          
          <p className="text-xs text-[var(--p5r-light)] opacity-60 truncate">
            {persona.name_en || persona.name_jp || '-'}
          </p>
        </div>
      </div>
      
      <div className="px-3 pb-3">
        <div className="grid grid-cols-10 gap-1 text-center">
          {RESIST_LABELS.map((key) => {
            const resistKey = (key + '_resist') as keyof Persona;
            const resistValue = persona[resistKey];
            const { symbol, className } = formatResist(resistValue as string | null);
            
            return (
              <div key={key} className="flex flex-col items-center">
                <span className="text-[8px] text-[var(--p5r-light)] opacity-40">
                  {RESIST_DISPLAY[key]}
                </span>
                <span className={`text-xs font-medium ${className}`}>
                  {symbol}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
}
