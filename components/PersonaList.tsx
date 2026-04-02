'use client';

import { useState, useMemo } from 'react';
import { Persona } from '@/lib/types';
import PersonaCard from '@/components/PersonaCard';
import ArcanFilter from '@/components/ArcanFilter';
import PersonaModal from '@/components/PersonaModal';

interface PersonaListProps {
  personas: Persona[];
}

export default function PersonaList({ personas }: PersonaListProps) {
  const [selectedArcana, setSelectedArcana] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sortBy, setSortBy] = useState<'level' | 'name'>('level');
  
  const arcanaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    personas.forEach(p => {
      counts[p.arcana] = (counts[p.arcana] || 0) + 1;
    });
    return counts;
  }, [personas]);
  
  const filteredPersonas = useMemo(() => {
    let result = personas;
    
    if (selectedArcana) {
      result = result.filter(p => p.arcana === selectedArcana);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name_cn.toLowerCase().includes(query) ||
        p.name_en?.toLowerCase().includes(query) ||
        p.name_jp?.toLowerCase().includes(query)
      );
    }
    
    if (sortBy === 'level') {
      result = [...result].sort((a, b) => a.level - b.level);
    } else {
      result = [...result].sort((a, b) => a.name_cn.localeCompare(b.name_cn, 'zh-CN'));
    }
    
    return result;
  }, [personas, selectedArcana, searchQuery, sortBy]);
  
  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--p5r-light)] opacity-50"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索人格面具..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[var(--p5r-dark)] border border-[var(--p5r-gray)] rounded-xl text-[var(--p5r-light)] placeholder:text-[var(--p5r-light)] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--p5r-red)] transition-all"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'level' | 'name')}
            className="px-4 py-3 bg-[var(--p5r-dark)] border border-[var(--p5r-gray)] rounded-xl text-[var(--p5r-light)] focus:outline-none focus:ring-2 focus:ring-[var(--p5r-red)] cursor-pointer"
          >
            <option value="level">按等级排序</option>
            <option value="name">按名称排序</option>
          </select>
        </div>
        
        <ArcanFilter
          selected={selectedArcana}
          onSelect={setSelectedArcana}
          counts={arcanaCounts}
        />
        
        <div className="text-sm text-[var(--p5r-light)] opacity-60">
          显示 {filteredPersonas.length} / {personas.length} 个人格面具
        </div>
      </div>
      
      {filteredPersonas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--p5r-light)] opacity-60">没有找到匹配的人格面具</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onClick={() => setSelectedPersona(persona)}
            />
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
