'use client';

import { useState, useMemo } from 'react';
import { Persona } from '@/lib/types';
import { getPersonaName, getPersonaArcana, getSkillName, type Language } from '@/lib/i18n';
import PersonaCard from '@/components/PersonaCard';
import ArcanFilter from '@/components/ArcanFilter';
import PersonaModal from '@/components/PersonaModal';

interface PersonaListProps {
  personas: Persona[];
  lang?: Language;
}

const UI_TW = {
  searchPlaceholder: '搜尋人格面具...',
  sortByLevel: '按等級排序',
  sortByName: '按名稱排序',
  allArcana: '全部',
  showing: '顯示 {filtered} / {total} 個人格面具',
  noResults: '沒有找到匹配的人格面具'
};

const UI_CN = {
  searchPlaceholder: '搜索人格面具...',
  sortByLevel: '按等級排序',
  sortByName: '按名稱排序',
  allArcana: '全部',
  showing: '显示 {filtered} / {total} 个人格面具',
  noResults: '没有找到匹配的人格面具'
};

const UI = { tw: UI_TW, cn: UI_CN };

export default function PersonaList({ personas, lang = 'tw' }: PersonaListProps) {
  const [selectedArcana, setSelectedArcana] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sortBy, setSortBy] = useState<'level' | 'name'>('level');
  const ui = UI[lang];
  
  const arcanaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    personas.forEach(p => {
      counts[p.arcana] = (counts[p.arcana] || 0) + 1;
    });
    return counts;
  }, [personas]);
  
  const personasInArcana = useMemo(() => {
    if (!selectedArcana) return personas;
    return personas.filter(p => p.arcana === selectedArcana);
  }, [personas, selectedArcana]);

  const filteredPersonas = useMemo(() => {
    let result = personasInArcana;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name_cn?.toLowerCase().includes(query) ||
        p.name_tw?.toLowerCase().includes(query) ||
        p.name_en?.toLowerCase().includes(query) ||
        p.name_jp?.toLowerCase().includes(query)
      );
    }
    
    if (sortBy === 'level') {
      result = [...result].sort((a, b) => a.level - b.level);
    } else {
      const locale = lang === 'tw' ? 'zh-TW' : 'zh-CN';
      result = [...result].sort((a, b) => {
        const nameA = getPersonaName(a);
        const nameB = getPersonaName(b);
        return nameA.localeCompare(nameB, locale);
      });
    }
    
    return result;
  }, [personasInArcana, searchQuery, sortBy, lang]);
  
  return (
    <>
      <div className="space-y-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--p5r-yellow)] opacity-50 group-focus-within:opacity-100 transition-opacity"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={ui.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--p5r-black)] border border-[var(--p5r-gray)] rounded-xl text-[var(--p5r-light)] placeholder:text-[var(--p5r-gray)] focus:outline-none focus:border-[var(--p5r-red)] focus:ring-2 focus:ring-[var(--p5r-red)]/20 transition-all text-base shadow-inner"
            />
          </div>
          
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'level' | 'name')}
              className="w-full sm:w-48 px-4 py-3 bg-[var(--p5r-black)] border border-[var(--p5r-gray)] rounded-xl text-[var(--p5r-light)] focus:outline-none focus:border-[var(--p5r-red)] cursor-pointer appearance-none transition-all font-medium shadow-inner"
            >
              <option value="level">{ui.sortByLevel}</option>
              <option value="name">{ui.sortByName}</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--p5r-yellow)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-[var(--p5r-black)] p-4 rounded-2xl border border-[var(--p5r-gray)] shadow-inner">
          <ArcanFilter
            selected={selectedArcana}
            onSelect={setSelectedArcana}
            counts={arcanaCounts}
            allLabel={ui.allArcana}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs font-bold tracking-widest text-[var(--p5r-yellow)] uppercase opacity-80 italic">
          <span>{ui.showing.replace('{filtered}', String(filteredPersonas.length)).replace('{total}', String(personasInArcana.length))}</span>
        </div>
      </div>
      
      {filteredPersonas.length === 0 ? (
        <div className="text-center py-20 bg-[var(--p5r-black)] rounded-3xl border-2 border-dashed border-[var(--p5r-gray)]">
          <div className="star-loader mx-auto mb-6 opacity-20 grayscale" />
          <p className="text-[var(--p5r-gray)] font-bold italic tracking-wider">{ui.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPersonas.map((persona, idx) => (
            <div key={persona.id} className="fusion-card" style={{ animationDelay: `${(idx % 20) * 30}ms` }}>
              <PersonaCard
                persona={persona}
                onClick={() => setSelectedPersona(persona)}
              />
            </div>
          ))}
        </div>
      )}
      
      <PersonaModal
        persona={selectedPersona}
        onClose={() => setSelectedPersona(null)}
      />
    </>
  );
}
