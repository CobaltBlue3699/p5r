'use client';

import { Persona, formatResist, ARCANA_COLORS } from '@/lib/types';
import { getPersonaName, getPersonaArcana, getPersonaImage } from '@/lib/i18n';

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
  const imgUrl = getPersonaImage(persona);
  const personaName = getPersonaName(persona);
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[var(--p5r-black)] rounded-xl overflow-hidden p5r-tilt border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--p5r-red)] transition-all duration-300 group shadow-lg hover:shadow-[var(--p5r-red)]/20"
    >
      <div className="flex gap-3 p-3">
        <div className="relative w-16 h-16 flex-shrink-0 bg-[var(--p5r-dark)] rounded-lg overflow-hidden border border-[var(--p5r-gray)] group-hover:border-[var(--p5r-red)]/30 transition-colors">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={personaName}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold opacity-30" style={{ color: arcanaColor }}>
              {personaName[0]}
            </div>
          )}
          <div 
            className="absolute top-0 left-0 w-1 h-full shadow-[2px_0_5px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: arcanaColor }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span suppressHydrationWarning className="text-[10px] px-2 py-0.5 rounded font-bold text-white shadow-sm" style={{ backgroundColor: arcanaColor }}>
              Lv.{persona.level}
            </span>
            <span suppressHydrationWarning className="text-[10px] font-bold text-[var(--p5r-yellow)] uppercase tracking-wider opacity-80">
              {getPersonaArcana(persona)}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-white truncate mb-0.5 group-hover:text-[var(--p5r-red)] transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
            {personaName}
          </h3>
          
          <p className="text-[10px] text-[var(--p5r-light)] opacity-40 truncate italic">
            {persona.name_en || persona.name_jp || '-'}
          </p>
        </div>
      </div>
      
      <div className="px-3 pb-3">
        <div className="grid grid-cols-10 gap-0.5 text-center bg-[var(--p5r-dark)]/50 p-1.5 rounded-lg border border-[var(--p5r-gray)]/30">
          {RESIST_LABELS.map((key) => {
            const resistKey = (key + '_resist') as keyof Persona;
            const resistValue = persona[resistKey];
            const { symbol, className } = formatResist(resistValue as string | null);
            
            return (
              <div key={key} className="flex flex-col items-center">
                <span className="text-[7px] font-bold text-[var(--p5r-light)] opacity-30 mb-0.5">
                  {RESIST_DISPLAY[key]}
                </span>
                <span className={`text-[10px] font-bold ${className} drop-shadow-sm`}>
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
