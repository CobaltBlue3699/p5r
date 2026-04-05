'use client';

import { useState, useMemo } from 'react';
import { type Persona } from '@/lib/types';
import { getPersonaName, getSkillName, type Language } from '@/lib/i18n';

interface FilterModalProps {
  type: 'skill' | 'trait' | 'persona';
  selectedSkills: string[];
  selectedTrait: string;
  selectedPersonas: string[];
  onClose: () => void;
  onSelectSkill: (skill: string) => void;
  onSelectTrait: (trait: string) => void;
  onSelectPersona: (persona: string) => void;
  allSkills: string[];
  allTraits: { personaName: string; traitValue: string; level: number }[];
  allPersonas: Persona[];
  getPersonaName: (p: Persona) => string;
  getSkillName: (s: any) => string;
  ui: any;
  lang: Language;
}

const ARCANAS = ['愚者', '魔术师', '女教皇', '女皇', '皇帝', '教皇', '恋人', '战车', '正义', '隐士', '命运', '力量', '倒悬者', '死神', '节制', '恶魔', '塔', '星星', '月亮', '太阳', '信念', '世界', '顾问官'];

const SKILL_CATEGORIES: Record<string, string[]> = {
  '物理': ['斬擊', '砍伐', '射擊', '打擊'],
  '火焰': ['火焰', '燃燒', '燃燒', '灼熱'],
  '冰凍': ['冰凍', '冰雪', '寒冷', '冰'],
  '電擊': ['電擊', '雷電', '閃電', '電氣'],
  '風壓': ['風壓', '風', '旋風', '颱風'],
  '念動': ['念動', '精神', '心靈', '精神'],
  '核熱': ['核熱', '核', '原子', '輻射'],
  '祝福': ['祝福', '神聖', '光明', '聖'],
  '咒怨': ['咒怨', '詛咒', '黑暗', '惡魔'],
  '萬能': ['萬能', 'UP', '真空', '疾風'],
};

function getSkillCategory(skillName: string): string {
  for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
    for (const keyword of keywords) {
      if (skillName.includes(keyword)) return category;
    }
  }
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
    if (type === 'persona') return ['全部', ...ARCANAS];
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
      skills = skills.filter(s => s.toLowerCase().includes(q));
    }
    if (activeTab !== '全部') {
      skills = skills.filter(s => getSkillCategory(s) === activeTab);
    }
    return skills.slice(0, 100);
  }, [allSkills, searchQuery, activeTab]);
  
  const filteredTraits = useMemo(() => {
    if (!searchQuery) return allTraits.slice(0, 30);
    const q = searchQuery.toLowerCase();
    return allTraits.filter(t => 
      t.traitValue.toLowerCase().includes(q) || 
      t.personaName.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [allTraits, searchQuery]);

  const filteredPersonas = useMemo(() => {
    let personas = allPersonas;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      personas = personas.filter(p => getPersonaName(p).toLowerCase().includes(q));
    }
    if (activeTab !== '全部') {
      personas = personas.filter(p => p.arcana === activeTab);
    }
    return personas.slice(0, 100);
  }, [allPersonas, searchQuery, activeTab, getPersonaName]);

  const renderContent = () => {
    switch (type) {
      case 'skill':
        return (
          <div className="flex flex-col">
            <div className="flex gap-1 p-2 overflow-x-auto border-b border-[var(--p5r-gray)]">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-[var(--p5r-red)] text-white'
                      : 'bg-[var(--p5r-dark)] text-[var(--p5r-light)] border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto p-2">
              {filteredSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => handleSelect(skill)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-105 ${
                    isSelected(skill)
                      ? 'bg-[var(--p5r-red)] text-white shadow-lg'
                      : 'bg-[var(--p5r-dark)] text-[var(--p5r-light)] border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]'
                  }`}
                >
                  {skill}
                </button>
              ))}
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
              {filteredPersonas.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(getPersonaName(p))}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-105 ${
                    isSelected(getPersonaName(p))
                      ? 'bg-[var(--p5r-red)] text-white shadow-lg'
                      : 'bg-[var(--p5r-dark)] text-[var(--p5r-light)] border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]'
                  }`}
                >
                  <span>{getPersonaName(p)}</span>
                  <span className="ml-2 text-xs opacity-70">Lv{p.level}</span>
                </button>
              ))}
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
