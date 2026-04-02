export interface PersonaSkill {
  name: string;
  name_tw?: string;
  cost: string;
  unlock_level: number | null;
  description: string;
  description_tw?: string;
}

export interface ReverseFusionIngredient {
  name: string;
  level: number;
  arcana: string;
}

export interface ReverseFusionRecipe {
  price: number;
  ingredient1: ReverseFusionIngredient;
  ingredient2: ReverseFusionIngredient;
}

export interface Persona {
  id: number;
  name_cn: string;
  name_tw?: string;
  name_en: string | null;
  name_jp: string | null;
  level: number;
  arcana: string;
  arcana_tw?: string;
  phys_resist: string | null;
  gun_resist: string | null;
  fire_resist: string | null;
  ice_resist: string | null;
  elec_resist: string | null;
  wind_resist: string | null;
  psy_resist: string | null;
  nuke_resist: string | null;
  bless_resist: string | null;
  curse_resist: string | null;
  image_url: string | null;
  local_image_path: string | null;
  wiki_url: string | null;
  strength: number;
  magic: number;
  endurance: number;
  agility: number;
  luck: number;
  trait: string | null;
  trait_tw?: string;
  trait_desc: string | null;
  trait_desc_tw?: string;
  item_name: string | null;
  item_name_tw?: string;
  item_desc: string | null;
  inherit_phys: number;
  inherit_gun: number;
  inherit_fire: number;
  inherit_ice: number;
  inherit_elec: number;
  inherit_wind: number;
  inherit_psy: number;
  inherit_nuke: number;
  inherit_bless: number;
  inherit_curse: number;
  inherit_abnormal: number;
  inherit_recovery: number;
  skills: PersonaSkill[];
  reverseRecipes?: ReverseFusionRecipe[];
  cannotFuse?: boolean;
}

export const ARCANA_ORDER = [
  '愚者', '魔术师', '女教皇', '女皇', '皇帝', '教皇', '恋人', '战车',
  '正义', '隐士', '命运', '力量', '倒悬者', '死神', '节制', '恶魔',
  '塔', '星星', '月亮', '太阳', '审判', '信念', '顾问官', '世界'
];

export const ARCANA_COLORS: Record<string, string> = {
  '愚者': '#9B59B6',
  '魔术师': '#E74C3C',
  '女教皇': '#3498DB',
  '女皇': '#E91E63',
  '皇帝': '#F39C12',
  '教皇': '#27AE60',
  '恋人': '#E91E63',
  '战车': '#C0392B',
  '正义': '#2980B9',
  '隐士': '#7F8C8D',
  '命运': '#16A085',
  '力量': '#D35400',
  '倒悬者': '#8E44AD',
  '死神': '#2C3E50',
  '节制': '#1ABC9C',
  '恶魔': '#C0392B',
  '塔': '#E74C3C',
  '星星': '#F1C40F',
  '月亮': '#9B59B6',
  '太阳': '#F39C12',
  '审判': '#3498DB',
  '信念': '#1ABC9C',
  '顾问官': '#9B59B6',
  '世界': '#E91E63'
};

export const NON_FUSIBLE_PERSONAS = [
  '卡门', '赛莱斯廷', '赫卡忒', '迪亚哥', '墨丘利', '佐罗'
] as const;

export type ResistType = 'weak' | 'resist' | 'repel' | 'absorb' | 'null' | 'block' | null;

export function formatResist(resist: string | null): { symbol: string; className: string } {
  switch (resist) {
    case 'weak': return { symbol: '弱', className: 'resist-weak' };
    case 'resist': return { symbol: '耐', className: 'resist-resist' };
    case 'repel': return { symbol: '反', className: 'resist-repel' };
    case 'absorb': return { symbol: '吸', className: 'resist-absorb' };
    case 'null': return { symbol: '無', className: 'resist-null' };
    case 'block': return { symbol: '封', className: 'resist-null' };
    default: return { symbol: '-', className: 'resist-none' };
  }
}
