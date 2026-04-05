import { type Persona, NON_FUSIBLE_PERSONAS } from './types';
import { getFusionResult, getFusionResults } from './fusion-matrix';
import { TREASURE_DEMONS, getTreasureModifier, type TreasureDemon } from './treasure-demons';
import { getPersonasByArcana, getPersonas, getPersonaByName, getFusiblePersonas } from './persona-index';
import { toTW, toCN } from './cn-tw';

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
  requiredPersonas?: string[];
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
  const traitValue = persona.trait || (persona as any).trait_tw;
  if (!traitValue) return false;
  
  const filterCN = toCN(traitFilter);
  const filterTW = toTW(traitFilter);
  
  const traitCN = persona.trait || '';
  const traitTW = (persona as any).trait_tw || '';
  
  return traitValue.includes(filterCN) || traitValue.includes(filterTW);
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
  
  const cacheKey = `${targetName}-${maxSteps}-${options.requiredSkills?.join(',')}-${options.requiredTrait}-${options.requiredPersonas?.join(',')}`;
  if (pathCache.has(cacheKey)) {
    return pathCache.get(cacheKey)!;
  }
  
  const targetPersona = getPersonaByName(targetName);
  if (!targetPersona) return [];
  
  if (NON_FUSIBLE_PERSONAS.includes(targetPersona.name_cn as typeof NON_FUSIBLE_PERSONAS[number])) {
    return [];
  }
  
  const reversePaths = findReverseFusionPaths(targetPersona, options);
  
  const allPersonas = getFusiblePersonas();
  const paths: FusionPath[] = [];
  
  // Always include reverse paths, even with filters
  if (reversePaths.length > 0) {
    if (!options.requiredTrait && !options.requiredSkills?.length) {
      const sorted = sortPaths(reversePaths, options);
      pathCache.set(cacheKey, sorted);
      return sorted;
    }
    // If there's a trait or skill filter, include filtered reverse paths too
    paths.push(...reversePaths);
  }
  
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

  const hasNoFilters = !options.requiredTrait && (!options.requiredSkills || options.requiredSkills.length === 0) && (!options.requiredPersonas || options.requiredPersonas.length === 0);
  
  if (hasNoFilters && paths.length > 0) {
    const sorted = sortPaths(paths, options);
    pathCache.set(cacheKey, sorted);
    return sorted;
  }

  // BFS for multi-step paths - run when there's a requiredTrait OR requiredSkills OR requiredPersonas
  const traitFilter = options.requiredTrait || '';
  const traitCN = traitFilter ? toCN(traitFilter) : '';
  const traitTW = traitFilter ? toTW(traitFilter) : '';
  const skillsFilter = options.requiredSkills || [];
  const personasFilter = options.requiredPersonas || [];
  
  // BFS for multi-step paths - always run when maxSteps > 1 or when there's a personas filter
  // This ensures we find paths of ALL lengths 1 through maxSteps, not just maxSteps
  if (maxSteps > 1 || personasFilter.length > 0) {
    
    // Helper to convert skill name to both CN and TW variants using opencc
    
    // Helper to convert skill name to both CN and TW variants using opencc
    const convertSkillName = (name: string) => {
      return [name, toCN(name), toTW(name)];
    };
    
    // Find personas that hold any of the required skills (CN or TW)
    const skillHolders = new Set<string>();
    if (skillsFilter.length > 0) {
      for (const p of allPersonas) {
        for (const s of p.skills || []) {
          const skillName = s.name;
          const skillNameTW = (s as any).name_tw || '';
          for (const reqSkill of skillsFilter) {
            const variants = convertSkillName(reqSkill);
            if (variants.some(v => skillName === v || skillNameTW === v || skillName.startsWith(v) || skillNameTW.startsWith(v))) {
              skillHolders.add(p.name_cn);
              break;
            }
          }
        }
      }
    }
    
  // Start BFS from ALL fusible personas when there's a trait filter or personas filter
  // (we need to search all arcanas to find paths that end with the trait or include required personas)
  const startPersonas = (traitFilter || skillsFilter.length > 0 || personasFilter.length > 0)
    ? allPersonas
    : allPersonas.filter(p => p.arcana === targetPersona.arcana);
    
    // Remove duplicates based on id
    const uniqueStartPersonas = startPersonas.filter((p, idx, arr) => 
      arr.findIndex(x => x.id === p.id) === idx
    );
    
    for (const personaA of uniqueStartPersonas) {
      bfsQueue.push({
        current: personaA,
        steps: [],
        visited: new Set([personaA.id.toString()])
      });
    }
  }
  
  const maxQueueSize = 500000;
  let queueIndex = 0;
  let pathsFound = 0;
  
  while (queueIndex < bfsQueue.length && bfsQueue.length < maxQueueSize) {
    const { current, steps, visited } = bfsQueue[queueIndex];
    queueIndex++;
    
    // Check if current has trait
    const queueHasTrait = traitFilter && (
      (current.trait && (current.trait.includes(traitCN) || current.trait.includes(traitTW))) ||
      (current.trait_tw && (current.trait_tw.includes(traitCN) || current.trait_tw.includes(traitTW)))
    );
    
    for (const personaB of allPersonas) {
      if (visited.has(personaB.id.toString())) continue;
      
      const result = calculateFusionResult(current, personaB);
      if (!result.resultPersona) continue;
      
      // Always add path if we found the target, regardless of steps.length
      if (result.resultPersona.id === targetPersona.id) {
        pathsFound++;
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
        continue; // Don't continue from here, move to next personaB
      }
      
      // Only continue searching if we haven't reached maxSteps
      if (steps.length >= maxSteps - 1) continue;
      
      // Check if current has trait for exploration
      const currentHasTrait = (current.trait && current.trait.includes(traitCN || traitTW)) || 
                             (current.trait_tw && (current.trait_tw.includes(traitCN) || current.trait_tw.includes(traitTW)));
      
      // When there's a trait filter, explore ALL arcanas (not just target arcana)
      // to find any path that could potentially inherit the trait
      if (options.requiredTrait) {
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
      } else if (result.resultPersona.arcana === targetPersona.arcana && result.resultPersona.id !== targetPersona.id) {
        // Same arcana - add to BFS queue to continue searching
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
      } else if (options.requiredSkills?.length) {
        // When there's a skill filter, also explore paths that might lead to skills
        const hasSkill = result.resultPersona.skills?.some(s => {
          const skillName = s.name;
          const skillNameTW = (s as any).name_tw || '';
          const skillNameCN = toCN(skillName);
          return options.requiredSkills!.some(rs => {
            const rsCN = toCN(rs);
            const rsTW = toTW(rs);
            return skillName === rs || skillNameTW === rs || skillNameCN === rs ||
                   skillName === rsCN || skillNameTW === rsCN || skillNameCN === rsCN ||
                   skillName === rsTW || skillNameTW === rsTW || skillNameCN === rsTW;
          });
        }) || false;
        
        if (hasSkill) {
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
      } else if (personasFilter.length > 0) {
        // When there's a personas filter, explore all arcanas
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
  
  // console.log('[Fusion] BFS done. Queue processed:', queueIndex, 'Final queue size:', bfsQueue.length, 'Paths found:', pathsFound);
   
  const sorted = sortPaths(paths, options);
  pathCache.set(cacheKey, sorted);
  
  return sorted;
}

function sortPaths(paths: FusionPath[], options: FindFusionPathsOptions): FusionPath[] {
  let filtered = paths;

  if (options.requiredSkills && options.requiredSkills.length > 0) {
    const requiredSkills = options.requiredSkills;
    filtered = filtered.filter(p => {
      // Check if the FINAL target persona has all required skills
      // (not just any persona in the path)
      const targetSkills = new Set<string>();
      for (const s of p.targetPersona.skills || []) {
        targetSkills.add(s.name);
        if ((s as any).name_tw) targetSkills.add((s as any).name_tw);
      }
      
      return requiredSkills.every(rs => {
        const rsCN = toCN(rs);
        const rsTW = toTW(rs);
        
        return [...targetSkills].some(skill => skill === rs || skill === rsCN || skill === rsTW);
      });
    });
  }

  if (options.requiredTrait) {
    const traitInput = options.requiredTrait;
    const traitCN = toCN(traitInput);
    const traitTW = toTW(traitInput);
    
    // console.log('[traitFilter] Filtering for:', traitCN, '/', traitTW);
    // console.log('[traitFilter] Before:', filtered.length);
    
    // Debug: list ALL unique personas in all paths
    const allPersonasInPaths = new Set<string>();
    filtered.forEach(p => {
      p.steps.forEach(step => {
        allPersonasInPaths.add(step.personaA.name_cn);
        allPersonasInPaths.add(step.personaB.name_cn);
        allPersonasInPaths.add(step.resultPersona.name_cn);
      });
    });
    // console.log('[traitFilter] Unique personas in paths:', [...allPersonasInPaths].slice(0, 20));
    // console.log('[traitFilter] Total unique:', allPersonasInPaths.size);
    
    // Check if ANY persona in the path has the trait (ingredients OR results)
    filtered = filtered.filter(p => {
      return p.steps.some(step => {
        const allPersonasInStep = [step.personaA, step.personaB, step.resultPersona];
        return allPersonasInStep.some(ing => {
          const ingTrait = ing?.trait || (ing as any)?.trait_tw || '';
          const match = ingTrait.includes(traitCN) || ingTrait.includes(traitTW);
          return match;
        });
      });
    });
    
    // console.log('[traitFilter] After:', filtered.length);
  }

  if (options.requiredPersonas && options.requiredPersonas.length > 0) {
    const requiredPersonasInput = options.requiredPersonas;
    const requiredPersonasCN = requiredPersonasInput.map(name => toCN(name));
    const requiredPersonasTW = requiredPersonasInput.map(name => toTW(name));
    
    // console.log('[personasFilter] Filtering for required personas:', requiredPersonasCN);
    // console.log('[personasFilter] Before:', filtered.length);
    
    filtered = filtered.filter(p => {
      const personasInPath = new Set<string>();
      p.steps.forEach(step => {
        personasInPath.add(step.personaA.name_cn);
        personasInPath.add(step.personaB.name_cn);
        personasInPath.add(step.resultPersona.name_cn);
      });
      
      return requiredPersonasCN.some(name => personasInPath.has(name)) ||
             requiredPersonasTW.some(name => personasInPath.has(name));
    });
    
    // console.log('[personasFilter] After:', filtered.length);
  }

  return filtered.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 50);
}

export { getFusionResult };
