'use client';

import { useEffect, useCallback } from 'react';
import { Persona, formatResist, ARCANA_COLORS } from '@/lib/types';

interface PersonaModalProps {
  persona: Persona | null;
  onClose: () => void;
}

const RESIST_LABELS: Record<string, string> = {
  phys: '物理', gun: '枪', fire: '火', ice: '冰', elec: '电', wind: '风',
  psy: '念', nuke: '核', bless: '祝福', curse: '咒杀'
};

export default function PersonaModal({ persona, onClose }: PersonaModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  
  useEffect(() => {
    if (persona) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [persona, handleKeyDown]);
  
  if (!persona) return null;
  
  const arcanaColor = ARCANA_COLORS[persona.arcana] || '#9B59B6';
  const resistKeys = ['phys_resist', 'gun_resist', 'fire_resist', 'ice_resist', 'elec_resist', 'wind_resist', 'psy_resist', 'nuke_resist', 'bless_resist', 'curse_resist'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-lg sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--p5r-dark)] rounded-2xl border border-[var(--p5r-gray)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="h-1.5 sm:h-2 sticky top-0"
          style={{ backgroundColor: arcanaColor }}
        />
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-[var(--p5r-gray)]/80 flex items-center justify-center text-[var(--p5r-light)] hover:bg-[var(--p5r-red)] transition-colors touch-manipulation"
          aria-label="关闭"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-start gap-4 lg:gap-6 mb-6">
            <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-[var(--p5r-gray)] rounded-xl overflow-hidden flex-shrink-0">
              {persona.image_url ? (
                <img
                  src={persona.image_url}
                  alt={persona.name_cn}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl lg:text-6xl opacity-30">
                  ?
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span 
                  className="text-sm sm:text-base px-3 py-1 rounded-full text-white font-medium"
                  style={{ backgroundColor: arcanaColor }}
                >
                  Lv.{persona.level}
                </span>
                <span className="text-sm sm:text-base text-[var(--p5r-light)] opacity-60">
                  {persona.arcana}
                </span>
              </div>
              
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                {persona.name_cn}
              </h2>
              
              <p className="text-sm sm:text-base text-[var(--p5r-light)] opacity-60 truncate">
                {persona.name_en && `${persona.name_en}`}
                {persona.name_en && persona.name_jp && ' / '}
                {persona.name_jp && `${persona.name_jp}`}
              </p>
            </div>
          </div>

          {(persona.strength ?? 0) > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--p5r-light)] opacity-80 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                五维属性
              </h3>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {[
                  { label: '力量', short: '力', value: persona.strength ?? 0, color: '#EF4444' },
                  { label: '魔法', short: '魔', value: persona.magic ?? 0, color: '#3B82F6' },
                  { label: '耐力', short: '耐', value: persona.endurance ?? 0, color: '#22C55E' },
                  { label: '速度', short: '速', value: persona.agility ?? 0, color: '#EAB308' },
                  { label: '运气', short: '运', value: persona.luck ?? 0, color: '#EC4899' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xs sm:text-sm text-[var(--p5r-light)] opacity-50 mb-1">
                      {stat.short}
                    </div>
                    <div className="relative h-12 sm:h-16 lg:h-20 bg-[var(--p5r-gray)] rounded-lg overflow-hidden">
                      <div 
                        className="absolute inset-x-0 bottom-0 rounded transition-all duration-500"
                        style={{ 
                          height: `${Math.min((stat.value / 70) * 100, 100)}%`,
                          backgroundColor: stat.color,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-white text-sm sm:text-base font-bold">
                        {stat.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {persona.trait && (
              <div className="bg-[var(--p5r-gray)]/50 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-[var(--p5r-yellow)] mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  特性
                </h4>
                <p className="text-sm text-white font-medium">{persona.trait}</p>
                {persona.trait_desc && (
                  <p className="text-xs text-[var(--p5r-light)] opacity-70 mt-1">{persona.trait_desc}</p>
                )}
              </div>
            )}

            {persona.item_name && persona.item_name !== '-' && (
              <div className="bg-[var(--p5r-gray)]/50 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-[var(--p5r-red)] mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  电刑
                </h4>
                <p className="text-sm text-white font-medium">{persona.item_name}</p>
                {persona.item_desc && persona.item_desc !== '{{{电刑道具简介}}}' && (
                  <p className="text-xs text-[var(--p5r-light)] opacity-70 mt-1">{persona.item_desc}</p>
                )}
              </div>
            )}
          </div>
            
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--p5r-light)] opacity-80 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              属性抗性
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-1">
              {resistKeys.map((key) => {
                const resistValue = persona[key as keyof Persona] as string | null;
                const { symbol, className } = formatResist(resistValue);
                const labelKey = key.replace('_resist', '') as keyof typeof RESIST_LABELS;
                
                return (
                  <div key={key} className="text-center">
                    <div className="text-[10px] sm:text-xs text-[var(--p5r-light)] opacity-50 mb-1">
                      {RESIST_LABELS[labelKey]}
                    </div>
                    <div className={`
                      text-sm sm:text-base font-bold py-2 sm:py-2.5 rounded-lg bg-[var(--p5r-gray)]
                      ${className}
                      min-h-[44px] flex items-center justify-center touch-manipulation
                    `}>
                      {symbol}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {persona.skills && persona.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--p5r-light)] opacity-80 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                技能列表
              </h3>
              <div className="space-y-2 max-h-72 lg:max-h-96 overflow-y-auto pr-2">
                {persona.skills.map((skill, idx) => (
                  <div key={idx} className="bg-[var(--p5r-gray)]/50 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{skill.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--p5r-gray)] text-[var(--p5r-light)] opacity-70">
                        {skill.unlock_level === null ? '自带' : `Lv.${skill.unlock_level}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--p5r-light)] opacity-60">
                      <span className="text-[var(--p5r-yellow)]">{skill.cost}</span>
                      {skill.description && <span className="truncate">{skill.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {persona.reverseRecipes && persona.reverseRecipes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--p5r-light)] opacity-80 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                反向合成 ({persona.reverseRecipes.length}种)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {persona.reverseRecipes.slice(0, 20).map((recipe, idx) => (
                  <div key={idx} className="bg-[var(--p5r-gray)]/50 rounded-lg p-3 text-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[var(--p5r-yellow)] text-xs font-bold whitespace-nowrap">
                        {recipe.ingredient1.name}
                      </span>
                      <span className="text-[var(--p5r-red)]">+</span>
                      <span className="text-[var(--p5r-yellow)] text-xs font-bold whitespace-nowrap">
                        {recipe.ingredient2.name}
                      </span>
                    </div>
                    <span className="text-[var(--p5r-light)] opacity-60 text-xs whitespace-nowrap">
                      ¥{recipe.price.toLocaleString()}
                    </span>
                  </div>
                ))}
                {persona.reverseRecipes.length > 20 && (
                  <div className="text-center text-xs text-[var(--p5r-gray)] py-2">
                    ... 还有 {persona.reverseRecipes.length - 20} 种
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--p5r-light)] opacity-80 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              技能继承
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-3">
              {[
                { key: 'inherit_phys', label: '物理' },
                { key: 'inherit_gun', label: '枪' },
                { key: 'inherit_fire', label: '火' },
                { key: 'inherit_ice', label: '冰' },
                { key: 'inherit_elec', label: '电' },
                { key: 'inherit_wind', label: '风' },
                { key: 'inherit_psy', label: '念' },
                { key: 'inherit_nuke', label: '核' },
                { key: 'inherit_bless', label: '祝福' },
                { key: 'inherit_curse', label: '咒杀' },
                { key: 'inherit_abnormal', label: '异常' },
                { key: 'inherit_recovery', label: '恢复' },
              ].map(({ key, label }) => {
                const value = (persona as any)[key] as number;
                return (
                  <div key={key} className="text-center">
                    <div className="text-[10px] sm:text-xs text-[var(--p5r-light)] opacity-50 mb-1">
                      {label}
                    </div>
                    <div className={`
                      text-sm sm:text-base font-bold py-2 sm:py-2.5 rounded-lg 
                      ${value === 1 ? 'bg-green-900/50 text-green-400' : 'bg-[var(--p5r-gray)] text-[var(--p5r-light)] opacity-30'}
                      min-h-[44px] flex items-center justify-center
                    `}>
                      {value === 1 ? '✓' : '×'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {persona.wiki_url && (
            <a
              href={persona.wiki_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--p5r-gray)] text-[var(--p5r-light)] hover:bg-[var(--p5r-red)] hover:text-white transition-colors font-medium touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              查看 Wiki 页面
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
