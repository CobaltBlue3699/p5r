'use client';

import { useState } from 'react';
import { getPersonas } from '@/lib/api';
import { setLang, type Language } from '@/lib/i18n';
import PersonaList from '@/components/PersonaList';

const UI_TW = {
  title: '人格面具圖鑑',
  count: '共 {count} 個人格面具',
  searchPlaceholder: '搜尋人格面具...',
  sortByLevel: '按等級排序',
  sortByName: '按名稱排序',
  allArcana: '全部',
  switchLang: '簡體'
};

const UI_CN = {
  title: '人格面具图鉴',
  count: '共 {count} 个人格面具',
  searchPlaceholder: '搜索人格面具...',
  sortByLevel: '按等级排序',
  sortByName: '按名称排序',
  allArcana: '全部',
  switchLang: '繁體'
};

const UI = { tw: UI_TW, cn: UI_CN };

export default function PersonasPage() {
  const [lang, setLangState] = useState<Language>('tw');
  const ui = UI[lang];
  
  const switchLanguage = () => {
    const newLang = lang === 'tw' ? 'cn' : 'tw';
    setLang(newLang);
    setLangState(newLang);
  };

  const personas = getPersonas();
  
  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 neon-glow" style={{ fontFamily: 'var(--font-heading)' }}>
              {ui.title}
            </h1>
            <p className="text-[var(--p5r-light)] opacity-60">
              {ui.count.replace('{count}', String(personas.length))}
            </p>
          </div>
          <button
            onClick={switchLanguage}
            className="px-4 py-2 bg-[var(--p5r-dark)] border border-[var(--p5r-gray)] rounded-lg text-[var(--p5r-light)] hover:border-[var(--p5r-red)] transition-colors"
          >
            {ui.switchLang}
          </button>
        </div>
        
        <PersonaList personas={personas} lang={lang} />
      </div>
    </main>
  );
}
