import { type Persona, NON_FUSIBLE_PERSONAS } from './types';
import { getFusionResult, getFusionResults } from './fusion-matrix';
import { TREASURE_DEMONS, getTreasureModifier, type TreasureDemon } from './treasure-demons';
import { getPersonasByArcana, getPersonas, getPersonaByName, getFusiblePersonas } from './persona-index';

export interface FusionInput {
  personaA: Persona;
  personaB: Persona;
  treasureDemon?: TreasureDemon;
}

export interface FusionResult {
  resultArcana: string;
  resultPersona: Persona | null;
  price: number;
  skillsInherited: string[];
}

export interface FusionPathStep {
  personaA: Persona;
  personaB: Persona;
  resultArcana: string;
  resultPersona: Persona;
  price: number;
}

export interface FusionPath {
  steps: FusionPathStep[];
  totalPrice: number;
  targetPersona: Persona;
}

export interface FindFusionPathsOptions {
  maxSteps?: number;
  minLevel?: number;
  maxLevel?: number;
  requiredSkills?: string[];
  requiredTrait?: string;
}

function calculateBasePrice(personaA: Persona, personaB: Persona): number {
  const levelA = personaA.level;
  const levelB = personaB.level;
  
  const diff = Math.abs(levelA - levelB);
  const effectiveLevelB = diff > 10 ? levelB + 10 - diff + 10 : levelB;
  
  return (levelA + effectiveLevelB) * 10;
}

export function calculateFusionPrice(
  personaA: Persona, 
  personaB: Persona, 
  treasureDemon?: TreasureDemon
): number {
  let price = calculateBasePrice(personaA, personaB);
  
  if (treasureDemon) {
    const modifierA = getTreasureModifier(treasureDemon.name_cn, personaA.arcana);
    const modifierB = getTreasureModifier(treasureDemon.name_cn, personaB.arcana);
    price += modifierA + modifierB;
  }
  
  return Math.max(1, price);
}

export function calculateFusionResult(
  personaA: Persona, 
  personaB: Persona,
  treasureDemon?: TreasureDemon
): FusionResult {
  const resultArcanas = getFusionResults(personaA.arcana, personaB.arcana);
  
  if (treasureDemon && resultArcanas.length > 0) {
    const modifierA = getTreasureModifier(treasureDemon.name_cn, personaA.arcana);
    const modifierB = getTreasureModifier(treasureDemon.name_cn, personaB.arcana);
    const totalModifier = modifierA + modifierB;
    
    const expandedArcanas: string[] = [];
    for (const arcana of resultArcanas) {
      const arcanas = getPersonasByArcana(arcana);
      if (arcanas.length > 0) {
        const targetLevel = arcanas[0].level + totalModifier;
        const candidates = arcanas.filter(p => p.level <= targetLevel + 5 && p.level >= targetLevel - 5);
        
        if (candidates.length > 0) {
          const closest = candidates.reduce((best, p) => 
            Math.abs(p.level - targetLevel) < Math.abs(best.level - targetLevel) ? p : best
          );
          expandedArcanas.push(closest.arcana);
        }
      }
    }
    if (expandedArcanas.length > 0) {
      resultArcanas.push(...expandedArcanas);
    }
  }

  const avgLevel = (personaA.level + personaB.level) / 2;
  const sameArcana = personaA.arcana === personaB.arcana;
  
  let resultArcana = resultArcanas[0] || '';
  let resultPersona: Persona | null = null;
  
  for (const arcana of resultArcanas) {
    const arcanas = getPersonasByArcana(arcana);
    
    if (arcanas.length > 0) {
      let candidates;
      if (sameArcana) {
        candidates = arcanas.filter(p => p.level <= avgLevel);
      } else {
        candidates = arcanas;
      }
      
      if (candidates.length > 0) {
        const persona = candidates.reduce((best, p) => 
          Math.abs(p.level - avgLevel) < Math.abs(best.level - avgLevel) ? p : best
        );
        
        if (!resultPersona || Math.abs(persona.level - avgLevel) < Math.abs(resultPersona.level - avgLevel)) {
          resultPersona = persona;
          resultArcana = arcana;
        }
      }
    }
  }
  
  if (!resultArcana || !resultPersona) {
    return {
      resultArcana: '',
      resultPersona: null,
      price: calculateFusionPrice(personaA, personaB, treasureDemon),
      skillsInherited: []
    };
  }
  
  const price = calculateFusionPrice(personaA, personaB, treasureDemon);
  
  const inheritedSkills: string[] = [];
  if (personaA.skills.length > 0) {
    const skill = personaA.skills[Math.floor(Math.random() * personaA.skills.length)];
    inheritedSkills.push(skill.name);
  }
  
  return {
    resultArcana,
    resultPersona,
    price,
    skillsInherited: inheritedSkills
  };
}

function canFusePersona(
  target: Persona,
  source: Persona,
  options: FindFusionPathsOptions
): boolean {
  if (NON_FUSIBLE_PERSONAS.includes(source.name_cn as typeof NON_FUSIBLE_PERSONAS[number])) {
    return false;
  }
  
  if (options.maxLevel && source.level > options.maxLevel) return false;
  if (options.minLevel && source.level < options.minLevel) return false;
  
  return true;
}

function personaHasTrait(persona: Persona, traitFilter: string): boolean {
  const traitCN = traitFilter;
  const traitTW = traitFilter.replace(/热/g, '熱').replace(/统/g, '統');
  const traitValue = persona.trait || (persona as any).trait_tw;
  return traitValue && (traitValue.includes(traitCN) || traitValue.includes(traitTW));
}

const pathCache = new Map<string, FusionPath[]>();

export function clearFusionCache(): void {
  pathCache.clear();
}

function findReverseFusionPaths(targetPersona: Persona, options: FindFusionPathsOptions = {}): FusionPath[] {
  if (!targetPersona.reverseRecipes || targetPersona.reverseRecipes.length === 0) {
    return [];
  }
  
  const paths: FusionPath[] = [];
  
  for (const recipe of targetPersona.reverseRecipes) {
    const p1 = getPersonaByName(recipe.ingredient1.name);
    const p2 = getPersonaByName(recipe.ingredient2.name);
    
    if (!p1 || !p2) continue;
    
    if (NON_FUSIBLE_PERSONAS.includes(p1.name_cn as typeof NON_FUSIBLE_PERSONAS[number]) ||
        NON_FUSIBLE_PERSONAS.includes(p2.name_cn as typeof NON_FUSIBLE_PERSONAS[number])) {
      continue;
    }
    
    if (!canFusePersona(targetPersona, p1, options) || !canFusePersona(targetPersona, p2, options)) {
      continue;
    }
    
    paths.push({
      steps: [{
        personaA: p1,
        personaB: p2,
        resultArcana: targetPersona.arcana,
        resultPersona: targetPersona,
        price: recipe.price
      }],
      totalPrice: recipe.price,
      targetPersona
    });
  }
  
  return paths;
}

export function findFusionPaths(
  targetName: string,
  options: FindFusionPathsOptions = {}
): FusionPath[] {
  const maxSteps = options.maxSteps ?? 3;
  
  const cacheKey = `${targetName}-${maxSteps}-${options.requiredSkills?.join(',')}-${options.requiredTrait}`;
  if (pathCache.has(cacheKey)) {
    return pathCache.get(cacheKey)!;
  }
  
  const targetPersona = getPersonaByName(targetName);
  if (!targetPersona) return [];
  
  if (NON_FUSIBLE_PERSONAS.includes(targetPersona.name_cn as typeof NON_FUSIBLE_PERSONAS[number])) {
    return [];
  }
  
  const reversePaths = findReverseFusionPaths(targetPersona, options);
  
  // Always include reverse paths, even with filters
  if (reversePaths.length > 0 && !options.requiredTrait) {
    const sorted = sortPaths(reversePaths, options);
    pathCache.set(cacheKey, sorted);
    return sorted;
  }
  
  const allPersonas = getFusiblePersonas();
  const paths: FusionPath[] = [];
  
  const bfsQueue: {
    current: Persona;
    steps: FusionPathStep[];
    visited: Set<string>;
  }[] = [];
  
  for (const personaA of allPersonas) {
    if (!canFusePersona(targetPersona, personaA, options)) continue;
    
    for (const personaB of allPersonas) {
      if (personaA.id === personaB.id) continue;
      if (!canFusePersona(targetPersona, personaB, options)) continue;
      
      const result = calculateFusionResult(personaA, personaB);
      
      if (result.resultPersona && result.resultPersona.id === targetPersona.id) {
        paths.push({
          steps: [{
            personaA,
            personaB,
            resultArcana: result.resultArcana,
            resultPersona: result.resultPersona,
            price: result.price
          }],
          totalPrice: result.price,
          targetPersona
        });
      }
    }
  }

  if (!options.requiredTrait && paths.length > 0) {
    const sorted = sortPaths(paths, options);
    pathCache.set(cacheKey, sorted);
    return sorted;
  }
  
  // BFS for multi-step paths - always run when there's a requiredTrait
  if (maxSteps > 1) {
    const traitFilter = options.requiredTrait || '';
    // Start BFS from both: target arcana personas AND trait-holding personas
    const startPersonas = allPersonas.filter(p => 
      p.arcana === targetPersona.arcana || 
      (traitFilter && personaHasTrait(p, traitFilter))
    );
    
    console.log('[BFS] Starting from', startPersonas.length, 'personas (target arcana + trait holders)');
    
    for (const personaA of startPersonas) {
      bfsQueue.push({
        current: personaA,
        steps: [],
        visited: new Set([personaA.id.toString()])
      });
    }
  }
  
  const maxQueueSize = 5000;
  let queueIndex = 0;
  
  while (queueIndex < bfsQueue.length && bfsQueue.length < maxQueueSize) {
    const { current, steps, visited } = bfsQueue[queueIndex];
    queueIndex++;
    
    if (steps.length >= maxSteps) continue;
    
    for (const personaB of allPersonas) {
      if (visited.has(personaB.id.toString())) continue;
      
      const result = calculateFusionResult(current, personaB);
      if (!result.resultPersona) continue;
      
      if (result.resultPersona.id === targetPersona.id) {
        paths.push({
          steps: [...steps, {
            personaA: current,
            personaB,
            resultArcana: result.resultArcana,
            resultPersona: result.resultPersona,
            price: result.price
          }],
          totalPrice: steps.reduce((sum, s) => sum + s.price, 0) + result.price,
          targetPersona
        });
      } else if (result.resultPersona.arcana === targetPersona.arcana && result.resultPersona.id !== targetPersona.id) {
        // Only add to BFS queue if we haven't reached max steps
        if (steps.length < maxSteps - 1) {
          // Only add if the intermediate result could be useful for trait filter
          if (!options.requiredTrait || personaHasTrait(result.resultPersona, options.requiredTrait)) {
            const newVisited = new Set(visited);
            newVisited.add(personaB.id.toString());
            
            bfsQueue.push({
              current: result.resultPersona,
              steps: [...steps, {
                personaA: current,
                personaB,
                resultArcana: result.resultArcana,
                resultPersona: result.resultPersona,
                price: result.price
              }],
              visited: newVisited
            });
          }
        }
      }
    }
  }
  
  const sorted = sortPaths(paths, options);
  pathCache.set(cacheKey, sorted);
  
  return sorted;
}

function sortPaths(paths: FusionPath[], options: FindFusionPathsOptions): FusionPath[] {
  let filtered = paths;

  if (options.requiredSkills && options.requiredSkills.length > 0) {
    const requiredSkills = options.requiredSkills;
    filtered = filtered.filter(p => {
      for (const step of p.steps) {
        const allPersonasInStep = [step.personaA, step.personaB, step.resultPersona];
        const hasSkill = allPersonasInStep.some(ing => 
          ing?.skills?.some(s => {
            const skillName = s.name;
            const skillNameTW = (s as any).name_tw || '';
            // Exact match or the filter is a prefix of the skill
            return requiredSkills.some(rs => 
              skillName === rs || 
              skillNameTW === rs ||
              skillName.startsWith(rs) ||
              skillNameTW.startsWith(rs)
            );
          })
        );
        if (hasSkill) return true;
      }
      return false;
    });
  }

  if (options.requiredTrait) {
    const traitInput = options.requiredTrait;
    const traitCN = traitInput.replace(/熱/g, '热').replace(/統/g, '统');
    const traitTW = traitInput.replace(/热/g, '熱').replace(/统/g, '統');
    
    filtered = filtered.filter(p => {
      for (const step of p.steps) {
        const allPersonasInStep = [step.personaA, step.personaB, step.resultPersona];
        const hasTrait = allPersonasInStep.some(ing => {
          const traitValue = ing?.trait || (ing as any)?.trait_tw;
          return traitValue && (traitValue.includes(traitCN) || traitValue.includes(traitTW));
        });
        if (hasTrait) return true;
      }
      return false;
    });
  }

  return filtered.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 50);
}

export { getFusionResult };
