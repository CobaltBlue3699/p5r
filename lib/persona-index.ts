import { type Persona, NON_FUSIBLE_PERSONAS } from './types';

let personasCache: Persona[] | null = null;

export function getPersonas(): Persona[] {
  if (!personasCache) {
    personasCache = require('./personas.json') as Persona[];
  }
  return personasCache;
}

export function getFusiblePersonas(): Persona[] {
  return getPersonas().filter(p => !NON_FUSIBLE_PERSONAS.includes(p.name_cn as typeof NON_FUSIBLE_PERSONAS[number]));
}

export function getPersonaById(id: number): Persona | undefined {
  return getPersonas().find(p => p.id === id);
}

export function getPersonaByName(name: string): Persona | undefined {
  const searchName = name.toLowerCase();
  return getPersonas().find(p => 
    p.name_cn.toLowerCase().includes(searchName) ||
    (p.name_en && p.name_en.toLowerCase().includes(searchName)) ||
    (p.name_jp && p.name_jp.toLowerCase().includes(searchName))
  );
}

export function getPersonasByArcana(arcana: string): Persona[] {
  return getPersonas().filter(p => p.arcana === arcana);
}

export function getPersonasByLevel(minLevel: number, maxLevel: number): Persona[] {
  return getPersonas().filter(p => p.level >= minLevel && p.level <= maxLevel);
}

export function getPersonasBySkill(skillName: string): Persona[] {
  const searchSkill = skillName.toLowerCase();
  return getPersonas().filter(p => 
    p.skills.some(s => s.name.toLowerCase().includes(searchSkill))
  );
}

export function getPersonasByTrait(trait: string): Persona[] {
  const searchTrait = trait.toLowerCase();
  return getPersonas().filter(p => 
    p.trait && p.trait.toLowerCase().includes(searchTrait)
  );
}

export function getAllArcanas(): string[] {
  const arcanas = new Set(getPersonas().map(p => p.arcana));
  return Array.from(arcanas).sort();
}

export function getAllSkills(): string[] {
  const skills = new Set<string>();
  getPersonas().forEach(p => {
    p.skills.forEach(s => skills.add(s.name));
  });
  return Array.from(skills).sort();
}

export function getAllTraits(): string[] {
  const traits = new Set<string>();
  getPersonas().forEach(p => {
    if (p.trait) traits.add(p.trait);
  });
  return Array.from(traits).sort();
}

export function getMinLevelForArcana(arcana: string): number {
  const personas = getPersonasByArcana(arcana);
  if (personas.length === 0) return 0;
  return Math.min(...personas.map(p => p.level));
}

export function getMaxLevelForArcana(arcana: string): number {
  const personas = getPersonasByArcana(arcana);
  if (personas.length === 0) return 0;
  return Math.max(...personas.map(p => p.level));
}
