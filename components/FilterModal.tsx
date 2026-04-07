'use client';

import { useState, useMemo } from 'react';
import { type Persona, type PersonaSkill, ARCANA_ORDER } from '@/lib/types';
import { getPersonaName, getSkillName, type Language, toTW } from '@/lib/i18n';

interface FilterModalProps {
  type: 'skill' | 'trait' | 'persona';
  selectedSkills: string[];
  selectedTrait: string;
  selectedPersonas: string[];
  onClose: () => void;
  onSelectSkill: (skill: string) => void;
  onSelectTrait: (trait: string) => void;
  onSelectPersona: (persona: string) => void;
  allSkills: PersonaSkill[];
  allTraits: { personaName: string; traitValue: string; level: number }[];
  allPersonas: Persona[];
  getPersonaName: (p: Persona) => string;
  getSkillName: (s: any) => string;
  ui: any;
  lang: Language;
}

function getSkillCategory(skill: PersonaSkill): string {
  if (skill.element) return toTW(skill.element);
  
  // 如果 element 為空，嘗試從描述或名稱猜測 (作為後備)
  const name = skill.name || '';
  const desc = skill.description || '';
  
  if (desc.includes('恢复') || desc.includes('復原')) return '恢復';
  if (desc.includes('攻击力提升') || desc.includes('防御力提升')) return '輔助';
  if (desc.includes('机率陷入') || desc.includes('異常狀態')) return '異常';
  if (desc.includes('自动生效') || desc.includes('被动')) return '被動';
  
  return '其他';
}

export default function FilterModal({
  type,
  selectedSkills,
  selectedTrait,
  selectedPersonas,
  onClose,
  onSelectSkill,
  onSelectTrait,
  onSelectPersona,
  allSkills,
  allTraits,
  allPersonas,
  getPersonaName,
  getSkillName,
  ui,
  lang
}: FilterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('全部');

  const title = type === 'skill' ? ui.skillFilter : type === 'trait' ? ui.traitFilter : ui.personaFilter;
  const handleSelect = type === 'skill' ? onSelectSkill : type === 'trait' ? onSelectTrait : onSelectPersona;
  const isSelected = (item: string) => type === 'skill' ? selectedSkills.includes(item) : type === 'trait' ? selectedTrait === item : selectedPersonas.includes(item);

  const tabs = useMemo(() => {
    if (type === 'persona') return ['全部', ...ARCANA_ORDER];
    if (type === 'skill') {
      const categories = new Set<string>();
      allSkills.forEach(s => categories.add(getSkillCategory(s)));
      return ['全部', ...Array.from(categories).sort()];
    }
    return [];
  }, [type, allSkills]);

  const filteredSkills = useMemo(() => {
    let skills = allSkills;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      skills = skills.filter(s => 
        getSkillName(s).toLowerCase().includes(q) || 
        s.name.toLowerCase().includes(q) ||
        (s.name_tw && s.name_tw.toLowerCase().includes(q))
      );
    }
    if (activeTab !== '全部') {
      skills = skills.filter(s => getSkillCategory(s) === activeTab);
    }
    return skills;
  }, [allSkills, searchQuery, activeTab, getSkillName]);
  
  const filteredTraits = useMemo(() => {
    if (!searchQuery) return allTraits;
    const q = searchQuery.toLowerCase();
    return allTraits.filter(t => 
      t.traitValue.toLowerCase().includes(q) || 
      t.personaName.toLowerCase().includes(q)
    );
  }, [allTraits, searchQuery]);

  const filteredPersonas = useMemo(() => {
    let personas = allPersonas;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      personas = personas.filter(p => 
        getPersonaName(p).toLowerCase().includes(q) ||
        p.name_cn.toLowerCase().includes(q) ||
        (p.name_tw && p.name_tw.toLowerCase().includes(q))
      );
    }
    if (activeTab !== '全部') {
      personas = personas.filter(p => p.arcana === activeTab);
    }
    return personas;
  }, [allPersonas, searchQuery, activeTab, getPersonaName]);

  const renderContent = () => {
    switch (type) {
      case 'skill':
        return (
          <div className="flex flex-col">
            <div className="flex gap-1 p-2 overflow-x-auto border-b border-[var(--p5r-gray)]">
              {tabs.map(tab => {
                const count = allSkills.filter(s => tab === '全部' || getSkillCategory(s) === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? 'bg-[var(--p5r-red)] text-white'
                        : 'bg-[var(--p5r-dark)] text-[var(--p5r-light)] border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]'
                    }`}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto p-2">
              {filteredSkills.map(skill => {
                const name = getSkillName(skill);
                return (
                  <button
                    key={name}
                    onClick={() => handleSelect(name)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-105 ${
                      isSelected(name)
                        ? 'bg-[var(--p5r-red)] text-white shadow-lg'
                        : 'bg-[var(--p5r-dark)] text-[var(--p5r-light)] border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 'trait':
        return (
          <div className="flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto p-2">
            {filteredTraits.map(t => (
              <button
                key={t.traitValue}
                onClick={() => handleSelect(t.traitValue)}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-105 ${
                  isSelected(t.traitValue)
                    ? 'bg-[var(--p5r-red)] text-white shadow-lg'
                    : 'bg-[var(--p5r-dark)] text-[var(--p5r-light)] border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]'
                }`}
              >
                <span>{t.traitValue}</span>
                <span className="ml-2 text-xs opacity-70">({t.personaName} Lv{t.level})</span>
              </button>
            ))}
          </div>
        );
      case 'persona':
        return (
          <div className="flex flex-col">
            <div className="flex gap-1 p-2 overflow-x-auto border-b border-[var(--p5r-gray)]">
              {tabs.map(tab => {
                const count = allPersonas.filter(p => tab === '全部' || p.arcana === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? 'bg-[var(--p5r-red)] text-white'
                        : 'bg-[var(--p5r-dark)] text-[var(--p5r-light)] border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]'
                    }`}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto p-2">
              {filteredPersonas.map(p => {
                const name = getPersonaName(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(name)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-105 ${
                      isSelected(name)
                        ? 'bg-[var(--p5r-red)] text-white shadow-lg'
                        : 'bg-[var(--p5r-dark)] text-[var(--p5r-light)] border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]'
                    }`}
                  >
                    <span>{name}</span>
                    <span className="ml-2 text-xs opacity-70">Lv{p.level}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--p5r-black)] rounded-2xl border border-[var(--p5r-gray)] w-full max-w-lg mx-4 max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--p5r-gray)]">
          <h2 className="text-lg font-semibold text-[var(--p5r-light)]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--p5r-gray)] transition-colors text-[var(--p5r-light)]"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 border-b border-[var(--p5r-gray)]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={type === 'skill' ? ui.selectSkill : type === 'trait' ? ui.selectTrait : ui.selectPersona2}
            className="w-full px-4 py-3 bg-[var(--p5r-dark)] border border-[var(--p5r-gray)] rounded-lg text-[var(--p5r-light)] placeholder-[var(--p5r-gray)] focus:border-[var(--p5r-red)] focus:outline-none"
            autoFocus
          />
        </div>
        
        {renderContent()}
        
        <div className="flex justify-between items-center p-4 border-t border-[var(--p5r-gray)]">
          <div className="text-sm text-[var(--p5r-gray)]">
            {type === 'skill' && `${selectedSkills.length} 個技能已選擇`}
            {type === 'trait' && selectedTrait && '已選擇特性'}
            {type === 'persona' && `${selectedPersonas.length} 個面具已選擇`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (type === 'skill') selectedSkills.forEach(onSelectSkill);
                else if (type === 'trait' && selectedTrait) onSelectTrait('');
                else if (type === 'persona') selectedPersonas.forEach(onSelectPersona);
              }}
              className="px-4 py-2 text-sm text-[var(--p5r-gray)] hover:text-[var(--p5r-light)] transition-colors"
            >
              {ui.clear}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[var(--p5r-red)] text-white font-medium rounded-lg hover:bg-[var(--p5r-red)]/80 transition-colors"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
