import { type Persona, type PersonaSkill, ARCANA_COLORS } from './types';

export type Language = 'cn' | 'tw';

const DEFAULT_LANG: Language = 'tw';

export function getLang(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  
  const stored = localStorage.getItem('p5r-lang');
  if (stored === 'cn' || stored === 'tw') return stored;
  
  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) {
    return browserLang.includes('TW') || browserLang.includes('HK') ? 'tw' : 'cn';
  }
  
  return DEFAULT_LANG;
}

export function setLang(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('p5r-lang', lang);
  }
}

export function getPersonaName(p: Persona): string {
  const lang = getLang();
  if (lang === 'tw' && p.name_tw) return p.name_tw;
  return p.name_cn;
}

export function getPersonaArcana(p: Persona): string {
  const lang = getLang();
  if (lang === 'tw' && p.arcana_tw) return p.arcana_tw;
  return p.arcana;
}

export function getPersonaTrait(p: Persona): string | null {
  const lang = getLang();
  if (lang === 'tw' && p.trait_tw) return p.trait_tw;
  return p.trait;
}

export function getPersonaTraitDesc(p: Persona): string | null {
  const lang = getLang();
  if (lang === 'tw' && p.trait_desc_tw) return p.trait_desc_tw;
  return p.trait_desc;
}

export function getSkillName(s: PersonaSkill): string {
  const lang = getLang();
  if (lang === 'tw' && s.name_tw) return s.name_tw;
  return s.name;
}

export function getSkillDesc(s: PersonaSkill): string {
  const lang = getLang();
  if (lang === 'tw' && s.description_tw) return s.description_tw;
  return s.description;
}

export function getItemName(p: Persona): string | null {
  const lang = getLang();
  if (lang === 'tw' && p.item_name_tw) return p.item_name_tw;
  return p.item_name;
}

export function getPersonaImage(p: Persona): string | null {
  return p.image_url || p.local_image_path || null;
}

export const ARCANA_ORDER_TW = [
  '愚者', '魔術師', '女教皇', '女皇', '皇帝', '教皇', '戀人', '戰車',
  '正義', '隱士', '命運', '力量', '倒懸者', '死神', '節制', '惡魔',
  '塔', '星星', '月亮', '太陽', '審判', '信念', '顧問官', '世界'
] as const;

export const ARCANA_COLORS_TW: Record<string, string> = {
  '愚者': '#9B59B6',
  '魔術師': '#E74C3C',
  '女教皇': '#3498DB',
  '女皇': '#E91E63',
  '皇帝': '#F39C12',
  '教皇': '#27AE60',
  '戀人': '#E91E63',
  '戰車': '#C0392B',
  '正義': '#2980B9',
  '隱士': '#7F8C8D',
  '命運': '#16A085',
  '力量': '#D35400',
  '倒懸者': '#8E44AD',
  '死神': '#2C3E50',
  '節制': '#1ABC9C',
  '惡魔': '#C0392B',
  '塔': '#E74C3C',
  '星星': '#F1C40F',
  '月亮': '#9B59B6',
  '太陽': '#F39C12',
  '審判': '#3498DB',
  '信念': '#1ABC9C',
  '顧問官': '#9B59B6',
  '世界': '#E91E63'
};

export function getArcanaColor(arcana: string): string {
  const lang = getLang();
  if (lang === 'tw') {
    return ARCANA_COLORS_TW[arcana] || ARCANA_COLORS_TW[arcana.replace(/愚者|魔術師|女教皇|女皇|皇帝|教皇|戀人|戰車|正義|隱士|命運|力量|倒懸者|死神|節制|惡魔|塔|星星|月亮|太陽|審判|信念|顧問官|世界/g, (m) => {
      const map: Record<string, string> = {
        '愚者': '愚者', '魔術師': '魔術師', '女教皇': '女教皇', '女皇': '女皇',
        '皇帝': '皇帝', '教皇': '教皇', '戀人': '戀人', '戰車': '戰車',
        '正義': '正義', '隱士': '隱士', '命運': '命運', '力量': '力量',
        '倒懸者': '倒懸者', '死神': '死神', '節制': '節制', '惡魔': '惡魔',
        '塔': '塔', '星星': '星星', '月亮': '月亮', '太陽': '太陽',
        '審判': '審判', '信念': '信念', '顧問官': '顧問官', '世界': '世界'
      };
      return map[m] || m;
    })] || '#888';
  }
  return ARCANA_COLORS[arcana] || '#888';
}
