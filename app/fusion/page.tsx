'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { type Persona } from '@/lib/types';
import { getFusiblePersonas, getPersonasByArcana, getAllArcanas } from '@/lib/persona-index';
import { findFusionPaths, clearFusionCache, type FusionPath } from '@/lib/fusion';
import { 
  getPersonaName, 
  getPersonaArcana, 
  getPersonaTrait, 
  getSkillName,
  getLang, 
  setLang,
  getArcanaColor,
  getPersonaImage,
  type Language 
} from '@/lib/i18n';
import PersonaModal from '@/components/PersonaModal';
import FilterModal from '@/components/FilterModal';

const UI_TW = {
  title: '人格面具合成規劃',
  targetPersona: '目標人格面具',
  searchPlaceholder: '搜尋人格面具...',
  maxSteps: '最大合成步驟',
  skillFilter: '技能篩選',
  traitFilter: '特性篩選',
  personaFilter: '面具篩選',
  findPaths: '查詢合成路徑',
  calculating: '計算中...',
  foundPaths: '找到 {count} 條合成路徑',
  noPaths: '未找到符合條件的合成路徑',
  price: '¥{price}',
  step: '步驟 {n}',
  level: 'Lv.{level}',
  trait: '特性',
  skills: '技能',
  selectPersona: '選擇人格面具',
  requiredSkill: '必備技能',
  requiredTrait: '必備特性',
  requiredPersona: '必備面具',
  selectSkill: '選擇技能...',
  selectTrait: '選擇特性...',
  selectPersona2: '選擇面具...',
  clear: '清除',
  noSkillFilter: '不使用技能篩選',
  noTraitFilter: '不使用特性篩選',
  noPersonaFilter: '不使用面具篩選',
  lang: '語言',
  switchLang: '切換語言'
};

const UI_CN = {
  title: '人格面具合成规划',
  targetPersona: '目标人格面具',
  searchPlaceholder: '搜索人格面具...',
  maxSteps: '最大合成步骤',
  skillFilter: '技能筛选',
  traitFilter: '特性筛选',
  personaFilter: '面具筛选',
  findPaths: '查找合成路径',
  calculating: '计算中...',
  foundPaths: '找到 {count} 条合成路径',
  noPaths: '未找到符合条件的合成路径',
  price: '¥{price}',
  step: '步骤 {n}',
  level: 'Lv.{level}',
  trait: '特性',
  skills: '技能',
  selectPersona: '选择人格面具',
  requiredSkill: '必备技能',
  requiredTrait: '必备特性',
  requiredPersona: '必备面具',
  selectSkill: '选择技能...',
  selectTrait: '选择特性...',
  selectPersona2: '选择面具...',
  clear: '清除',
  noSkillFilter: '不使用技能筛选',
  noTraitFilter: '不使用特性筛选',
  noPersonaFilter: '不使用面具筛选',
  lang: '语言',
  switchLang: '切换语言'
};

const UI = { tw: UI_TW, cn: UI_CN };

export default function FusionPage() {
  const [lang, setLangState] = useState<Language>('tw');
  const [selectedArcana, setSelectedArcana] = useState<string | null>(null);
  const [targetName, setTargetName] = useState('');
  const [searchResults, setSearchResults] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [paths, setPaths] = useState<FusionPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<'skill' | 'trait' | 'persona' | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTrait, setSelectedTrait] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [modalPersona, setModalPersona] = useState<Persona | null>(null);
  const [sortBy, setSortBy] = useState<'level' | 'name'>('level');
  const [skillSearchResults, setSkillSearchResults] = useState<string[]>([]);
  const [traitSearchQuery, setTraitSearchQuery] = useState('');
  const [traitSearchResults, setTraitSearchResults] = useState<string[]>([]);
  const [personaSearchResults, setPersonaSearchResults] = useState<string[]>([]);

  const ui = UI[lang];
  const allPersonas = useMemo(() => getFusiblePersonas(), []);
  
  const allTraits = useMemo(() => {
    const seen = new Set<string>();
    return allPersonas
      .filter(p => {
        const traitValue = lang === 'tw' && p.trait_tw ? p.trait_tw : (p.trait || '');
        if (!traitValue || seen.has(traitValue)) return false;
        seen.add(traitValue);
        return true;
      })
      .map(p => ({
        personaName: getPersonaName(p),
        traitValue: lang === 'tw' && p.trait_tw ? p.trait_tw : (p.trait || ''),
        level: p.level
      }));
  }, [allPersonas, lang]);

  const sortedPersonas = useMemo(() => {
    const sorted = [...allPersonas];
    if (sortBy === 'level') {
      return sorted.sort((a, b) => a.level - b.level);
    }
    return sorted.sort((a, b) => getPersonaName(a).localeCompare(getPersonaName(b)));
  }, [allPersonas, lang, sortBy]);
  
  const allArcanas = useMemo(() => getAllArcanas(), []);
  
  const uniqueSkills = useMemo(() => {
    const seen = new Set<string>();
    const skills = sortedPersonas.flatMap(p => p.skills).filter(s => {
      const name = getSkillName(s);
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
    return skills;
  }, [allPersonas, lang]);

  const arcanasByLevel = useMemo(() => {
    const arcanaMap: Record<string, { name: string; color: string; personas: Persona[] }> = {};
    
    allArcanas.forEach((arcana, idx) => {
      const personas = getPersonasByArcana(arcana);
      if (personas.length > 0) {
        arcanaMap[arcana] = {
          name: getPersonaArcana({ arcana } as Persona),
          color: getArcanaColor(arcana),
          personas: personas.sort((a, b) => a.level - b.level)
        };
      }
    });
    
    return arcanaMap;
  }, [allArcanas, lang]);

  useEffect(() => {
    setLangState(getLang());
  }, []);

  const handleSearch = useCallback((query: string) => {
    setTargetName(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const results = allPersonas.filter(p => 
      getPersonaName(p).toLowerCase().includes(q) ||
      (p.name_en && p.name_en.toLowerCase().includes(q))
    ).slice(0, 10);
    setSearchResults(results);
  }, [allPersonas, lang]);

  const handleSelectPersona = useCallback((persona: Persona) => {
    setSelectedPersona(persona);
    setTargetName(getPersonaName(persona));
    setSearchResults([]);
    setSelectedArcana(persona.arcana);
  }, [lang]);

  const handleSelectArcana = useCallback((arcana: string) => {
    setSelectedArcana(arcana);
    setSelectedPersona(null);
    setTargetName('');
  }, []);

  const handleFindPaths = useCallback(() => {
    if (!selectedPersona) return;
    setLoading(true);
    clearFusionCache();
    
    setTimeout(() => {
      const foundPaths = findFusionPaths(selectedPersona.name_cn, {
        maxSteps: 5,
        requiredSkills: selectedSkills.length > 0 ? selectedSkills : undefined,
        requiredTrait: selectedTrait || undefined,
        requiredPersonas: selectedPersonas.length > 0 ? selectedPersonas : undefined
      });
      
      console.log('[Fusion] Found', foundPaths.length, 'paths');
      foundPaths.forEach((p, i) => {
        console.log(`Path ${i+1}:`, p.steps.map(s => `${s.personaA.name_cn}+${s.personaB.name_cn}`).join(' -> '));
      });
      
      setPaths(foundPaths);
      setLoading(false);
    }, 50);
  }, [selectedPersona, selectedSkills, selectedTrait, selectedPersonas]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const switchLanguage = () => {
    const newLang = lang === 'tw' ? 'cn' : 'tw';
    setLang(newLang);
    setLangState(newLang);
  };

  const arcanaColor = selectedPersona ? getArcanaColor(selectedPersona.arcana) : '#888';

  return (
    <div className="min-h-screen bg-[var(--p5r-dark)] text-[var(--p5r-light)]">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--p5r-red)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {ui.title}
          </h1>
          <button
            onClick={switchLanguage}
            className="px-3 py-1.5 text-sm bg-[var(--p5r-gray)] rounded-lg hover:bg-[var(--p5r-gray)]/80 transition-colors"
          >
            {lang === 'tw' ? '簡體' : '繁體'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[var(--p5r-black)] rounded-xl p-4 border border-[var(--p5r-gray)]">
              <label className="block text-sm font-medium text-[var(--p5r-light)] mb-2">
                {ui.targetPersona}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={ui.searchPlaceholder}
                  className="w-full px-4 py-3 bg-[var(--p5r-dark)] border border-[var(--p5r-gray)] rounded-lg text-[var(--p5r-light)] placeholder-[var(--p5r-gray)] focus:border-[var(--p5r-red)] focus:outline-none text-base input-focus transition-all duration-200"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[var(--p5r-black)] border border-[var(--p5r-gray)] rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map(persona => {
                      const imgUrl = getPersonaImage(persona);
                      return (
                      <div
                        key={persona.id}
                        className="w-full px-4 py-3 text-left hover:bg-[var(--p5r-gray)] flex items-center gap-3 min-h-[52px]"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectPersona(persona)}
                          className="flex items-center gap-3 flex-1"
                        >
                          {imgUrl ? (
                            <img 
                              src={imgUrl} 
                              alt={getPersonaName(persona)}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <span 
                              className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg font-bold"
                              style={{ backgroundColor: getArcanaColor(persona.arcana) }}
                            >
                              {getPersonaName(persona)[0]}
                            </span>
                          )}
                          <span className="text-[var(--p5r-light)] font-medium">{getPersonaName(persona)}</span>
                          <span className="text-xs font-bold text-[var(--p5r-yellow)] bg-[var(--p5r-dark)] px-1.5 py-0.5 rounded">
                            Lv{persona.level} {getPersonaArcana(persona)}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalPersona(persona)}
                          className="px-2 py-1 text-xs bg-[var(--p5r-gray)] rounded hover:bg-[var(--p5r-red)] transition-colors"
                          title="查看詳情"
                        >
                          ℹ
                        </button>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--p5r-black)] rounded-xl p-4 border border-[var(--p5r-gray)]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[var(--p5r-light)]">
                  按Arcana篩選
                </label>
                <button
                  onClick={() => setSelectedArcana(null)}
                  className="px-2 py-1 text-xs bg-[var(--p5r-gray)] rounded hover:bg-[var(--p5r-red)] transition-all duration-200 hover:scale-105"
                >
                  清除
                </button>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {Object.entries(arcanasByLevel).map(([arcana, data]) => (
                  <button
                    key={arcana}
                    onClick={() => handleSelectArcana(arcana)}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium
                      transition-all duration-200 min-h-[48px]
                      ${selectedArcana === arcana 
                        ? 'ring-2 ring-[var(--p5r-yellow)] ring-offset-2 ring-offset-[var(--p5r-black)] scale-110' 
                        : 'hover:scale-105 hover:brightness-110'
                      }
                    `}
                    style={{ backgroundColor: data.color }}
                  >
                    <span className="text-white drop-shadow-md">{data.name.slice(0, 2)}</span>
                    <span className="text-[10px] text-white/70">{data.personas.length}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedArcana && arcanasByLevel[selectedArcana] && (
              <div className="bg-[var(--p5r-black)] rounded-xl p-4 border border-[var(--p5r-gray)]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {arcanasByLevel[selectedArcana].personas.map(persona => {
                    const imgUrl = getPersonaImage(persona);
                    return (
                    <div
                      key={persona.id}
                      onClick={() => handleSelectPersona(persona)}
                      className={`
                        p-2 rounded-xl text-center transition-all duration-200 group relative cursor-pointer
                        ${selectedPersona?.id === persona.id 
                          ? 'bg-[var(--p5r-red)] ring-2 ring-[var(--p5r-yellow)]' 
                          : 'bg-[var(--p5r-dark)] hover:bg-[var(--p5r-gray)]'
                        }
                      `}
                    >
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt={getPersonaName(persona)}
                          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-lg object-cover mb-1"
                        />
                      ) : (
                        <div 
                          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-lg flex items-center justify-center text-xl font-bold mb-1"
                          style={{ backgroundColor: getArcanaColor(persona.arcana) }}
                        >
                          {getPersonaName(persona)[0]}
                        </div>
                      )}
                      <div className="text-xs font-medium text-[var(--p5r-light)] truncate">
                        {getPersonaName(persona)}
                      </div>
                      <div className="text-[10px] font-bold text-[var(--p5r-yellow)] bg-[var(--p5r-black)] px-1.5 py-0.5 rounded inline-block">
                        Lv{persona.level}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setModalPersona(persona); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--p5r-gray)] text-[var(--p5r-light)] text-xs hover:bg-[var(--p5r-red)] transition-colors opacity-0 group-hover:opacity-100"
                        title="查看詳情"
                      >
                        ℹ
                      </button>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setModalType('skill')}
                  className={`px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95 ${
                    selectedSkills.length > 0
                      ? 'bg-[var(--p5r-red)] border-[var(--p5r-red)] text-white shadow-lg shadow-[var(--p5r-red)]/30' 
                      : 'border-[var(--p5r-gray)] text-[var(--p5r-light)] hover:border-[var(--p5r-red)] hover:shadow-lg hover:shadow-[var(--p5r-red)]/20'
                  }`}
                >
                  {ui.skillFilter} {selectedSkills.length > 0 && `(${selectedSkills.length})`}
                </button>

                <button
                  onClick={() => setModalType('trait')}
                  className={`px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95 ${
                    selectedTrait
                      ? 'bg-[var(--p5r-red)] border-[var(--p5r-red)] text-white shadow-lg shadow-[var(--p5r-red)]/30' 
                      : 'border-[var(--p5r-gray)] text-[var(--p5r-light)] hover:border-[var(--p5r-red)] hover:shadow-lg hover:shadow-[var(--p5r-red)]/20'
                  }`}
                >
                  {ui.traitFilter} {selectedTrait && ' ✓'}
                </button>

                <button
                  onClick={() => setModalType('persona')}
                  className={`px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95 ${
                    selectedPersonas.length > 0
                      ? 'bg-[var(--p5r-red)] border-[var(--p5r-red)] text-white shadow-lg shadow-[var(--p5r-red)]/30' 
                      : 'border-[var(--p5r-gray)] text-[var(--p5r-light)] hover:border-[var(--p5r-red)] hover:shadow-lg hover:shadow-[var(--p5r-red)]/20'
                  }`}
                >
                  {ui.personaFilter} {selectedPersonas.length > 0 && `(${selectedPersonas.length})`}
                </button>

                <button
                onClick={handleFindPaths}
                disabled={!selectedPersona || loading}
                className="px-8 py-3 bg-[var(--p5r-red)] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg p5r-button"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="star-loader scale-50" />
                    <span>{ui.calculating}</span>
                  </div>
                ) : ui.findPaths}
              </button>
            </div>

            {modalType && (
              <FilterModal
                type={modalType}
                selectedSkills={selectedSkills}
                selectedTrait={selectedTrait}
                selectedPersonas={selectedPersonas}
                onClose={() => setModalType(null)}
                onSelectSkill={(skill) => setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])}
                onSelectTrait={(trait) => { setSelectedTrait(prev => prev === trait ? '' : trait); }}
                onSelectPersona={(persona) => setSelectedPersonas(prev => prev.includes(persona) ? prev.filter(p => p !== persona) : [...prev, persona])}
                allSkills={uniqueSkills}
                allTraits={allTraits}
                allPersonas={sortedPersonas}
                getPersonaName={getPersonaName}
                getSkillName={getSkillName}
                ui={ui}
                lang={lang}
              />
            )}

            {paths.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[var(--p5r-yellow)] italic">
                  {ui.foundPaths.replace('{count}', String(paths.length))}
                </h2>
                {paths.slice(0, 10).map((path, idx) => (
                  <div key={idx} className="fusion-card p5r-tilt" style={{ animationDelay: `${idx * 50}ms` }}>
                    <FusionPathCard 
                      path={path} 
                      index={idx} 
                      ui={ui} 
                      lang={lang} 
                      onPersonaClick={setModalPersona}
                      highlightSkills={selectedSkills}
                      highlightTrait={selectedTrait}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loading && paths.length === 0 && selectedPersona && (
              <div className="text-center py-12 bg-[var(--p5r-black)] rounded-2xl border-2 border-dashed border-[var(--p5r-gray)]">
                <div className="star-loader mx-auto mb-4 opacity-20 grayscale" />
                <p className="text-[var(--p5r-gray)] font-medium italic">
                  {ui.noPaths}
                </p>
              </div>
            )}
          </div>

          {selectedPersona && (
            <div className="bg-[var(--p5r-black)] rounded-xl p-5 border-2 border-[var(--p5r-red)]/30 h-fit sticky top-20 shadow-lg shadow-[var(--p5r-red)]/10">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setModalPersona(selectedPersona)}
                  className="relative group"
                >
                  {getPersonaImage(selectedPersona) ? (
                    <img 
                      src={getPersonaImage(selectedPersona)!}
                      alt={getPersonaName(selectedPersona)}
                      className="w-24 h-24 mx-auto rounded-xl object-cover mb-4 shadow-lg"
                    />
                  ) : (
                    <div 
                      className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg"
                      style={{ backgroundColor: arcanaColor }}
                    >
                      {getPersonaName(selectedPersona)[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm">查看詳情</span>
                  </div>
                </button>
                <h3 className="text-xl font-bold text-[var(--p5r-light)]">{getPersonaName(selectedPersona)}</h3>
                <p className="text-sm font-bold text-[var(--p5r-yellow)] mb-4 bg-[var(--p5r-dark)] px-3 py-1 rounded-lg inline-block">
                  Lv{selectedPersona.level} · {getPersonaArcana(selectedPersona)}
                </p>
                {getPersonaTrait(selectedPersona) && (
                  <div className="p-3 bg-[var(--p5r-dark)] rounded-lg mb-4">
                    <p className="text-xs text-[var(--p5r-yellow)] mb-1">{ui.trait}</p>
                    <p className="text-sm text-[var(--p5r-light)]">{getPersonaTrait(selectedPersona)}</p>
                  </div>
                )}
                {selectedPersona.skills.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--p5r-yellow)] mb-2">{ui.skills}</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {selectedPersona.skills.slice(0, 6).map(skill => (
                        <span key={skill.name} className="text-xs px-2 py-1 bg-[var(--p5r-dark)] rounded text-[var(--p5r-light)]">
                          {getSkillName(skill)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <PersonaModal 
        persona={modalPersona} 
        onClose={() => setModalPersona(null)} 
      />
    </div>
  );
}

function FusionPathCard({ 
  path, 
  index, 
  ui, 
  lang, 
  onPersonaClick,
  highlightSkills = [],
  highlightTrait = ''
}: { 
  path: FusionPath; 
  index: number; 
  ui: typeof UI_TW; 
  lang: Language; 
  onPersonaClick?: (p: Persona) => void;
  highlightSkills?: string[];
  highlightTrait?: string;
}) {
  const getPersonaHighlights = (persona: Persona) => {
    const highlights: string[] = [];
    if (highlightSkills.length > 0) {
      const matchingSkills = persona.skills.filter(s => {
        const skillName = s.name;
        const skillNameTW = (s as any).name_tw || '';
        return highlightSkills.some(hs => 
          skillName === hs || 
          skillNameTW === hs ||
          skillName.startsWith(hs) ||
          skillNameTW.startsWith(hs)
        );
      });
      if (matchingSkills.length > 0) {
        highlights.push(...matchingSkills.map(s => getSkillName(s)));
      }
    }
    if (highlightTrait) {
      const traitValue = lang === 'tw' && persona.trait_tw ? persona.trait_tw : persona.trait;
      if (traitValue && (traitValue.includes(highlightTrait) || highlightTrait.includes(traitValue))) {
        highlights.push(traitValue);
      }
    }
    return highlights;
  };
  
  return (
    <div className="bg-[var(--p5r-black)] rounded-xl p-4 border border-[var(--p5r-gray)] hover:border-[var(--p5r-red)]/50 transition-all duration-200 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--p5r-gray)] group-hover:text-[var(--p5r-light)] transition-colors">{ui.step.replace('{n}', String(index + 1))}</span>
        <span className="text-lg font-bold text-[var(--p5r-yellow)] drop-shadow-md">
          {ui.price.replace('{price}', path.totalPrice.toLocaleString())}
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {path.steps.map((step, stepIdx) => (
          <div key={stepIdx} className="flex items-center gap-2 sm:gap-3">
            <PersonaAvatar 
              persona={step.personaA} 
              onClick={onPersonaClick} 
              highlights={getPersonaHighlights(step.personaA)}
            />
            
            <span className="text-[var(--p5r-red)] text-xl font-bold">+</span>
            
            <PersonaAvatar 
              persona={step.personaB} 
              onClick={onPersonaClick}
              highlights={getPersonaHighlights(step.personaB)}
            />
            
            <span className="text-[var(--p5r-yellow)] text-xl font-bold">→</span>
            
            <PersonaAvatar 
              persona={step.resultPersona} 
              isResult 
              onClick={onPersonaClick}
              highlights={getPersonaHighlights(step.resultPersona)}
            />
            
            {stepIdx < path.steps.length - 1 && (
              <span className="text-[var(--p5r-gray)] mx-1">⮕</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonaAvatar({ 
  persona, 
  isResult, 
  onClick,
  highlights = []
}: { 
  persona: Persona; 
  isResult?: boolean; 
  onClick?: (p: Persona) => void;
  highlights?: string[];
}) {
  const imgUrl = getPersonaImage(persona);
  const name = getPersonaName(persona);
  
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => onClick?.(persona)}
        className={`relative group cursor-pointer ${highlights.length > 0 ? 'ring-2 ring-[var(--p5r-red)] ring-offset-2 ring-offset-[var(--p5r-black)]' : ''}`}
      >
        {imgUrl ? (
          <img 
            src={imgUrl} 
            alt={name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shadow-md"
          />
        ) : (
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shadow-md"
            style={{ backgroundColor: getArcanaColor(persona.arcana) }}
          >
            {name.slice(0, 2)}
          </div>
        )}
        <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-xs">{name}</span>
        </div>
      </button>
      <span className="text-xs font-bold text-[var(--p5r-yellow)] bg-[var(--p5r-dark)] px-1.5 py-0.5 rounded mt-1">{persona.level}</span>
      {highlights.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-16">
          {highlights.slice(0, 2).map((h, i) => (
            <span key={i} className="text-[10px] text-[var(--p5r-red)] bg-[var(--p5r-dark)] px-1 rounded leading-tight">
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
