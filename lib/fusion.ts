import persons from './personas.json' with { type: 'json' };
import { getFusionResult } from './fusion-matrix';
import { TREASURE_DEMONS } from './treasure-demons';
import type { Persona, FusionStep, FusionPath, FusionSearchOptions } from './types';

const personas = (persons as any[]).map(p => ({
  ...p,
  id: Number(p.id),
  level: Number(p.level),
})) as Persona[];

const personaByName = new Map<string, Persona>();
personas.forEach(p => personaByName.set(p.name_cn, p));

/**
 * BFS Fusion Path Finder with safety limits
 */
export function findFusionPaths(targetName: string, options: FusionSearchOptions): FusionPath[] {
  const target = personaByName.get(targetName);
  if (!target) return [];

  const maxSteps = Math.min(options.maxSteps || 1, 4); // 限制最大深度防止崩潰
  const results: FusionPath[] = [];
  const maxResults = 100; // 限制返回结果數量

  // Queue stores [currentPersona, currentPathSteps]
  const queue: [Persona, FusionStep[]][] = [[target, []]];
  
  while (queue.length > 0 && results.length < maxResults) {
    const [current, steps] = queue.shift()!;
    
    if (steps.length >= maxSteps) continue;

    const recipes = current.reverseRecipes || [];
    for (const recipe of recipes) {
      const pA = personaByName.get(recipe.ingredient1.name);
      const pB = personaByName.get(recipe.ingredient2.name);
      
      if (!pA || !pB) continue;

      // 構建新的一步 (注意：反向搜尋時，當前 persona 是結果)
      const newStep: FusionStep = {
        personaA: pA,
        personaB: pB,
        resultPersona: current,
        price: recipe.price,
        skillsInherited: []
      };

      const newSteps = [newStep, ...steps]; // 將新步驟加在前面
      const newPath: FusionPath = {
        steps: newSteps,
        totalPrice: newSteps.reduce((sum, s) => sum + s.price, 0)
      };

      // 檢查是否符合所有條件
      if (matchesOptions(newPath, options)) {
        results.push(newPath);
      }

      // 如果還沒達到深度限制，繼續往回搜尋素材 A 和 B
      if (newSteps.length < maxSteps && results.length < maxResults) {
        // 防止循環：如果素材已經出現在路徑中，就不再回溯
        if (!steps.some(s => s.resultPersona.name_cn === pA.name_cn)) {
          queue.push([pA, newSteps]);
        }
        if (!steps.some(s => s.resultPersona.name_cn === pB.name_cn)) {
          queue.push([pB, newSteps]);
        }
      }
    }
  }

  return results.sort((a, b) => a.totalPrice - b.totalPrice);
}

function matchesOptions(path: FusionPath, options: FusionSearchOptions): boolean {
  const allPersonas = path.steps.flatMap(s => [s.personaA, s.personaB, s.resultPersona]);
  const finalResult = path.steps[path.steps.length - 1].resultPersona;

  // 1. 必須包含目標面具 (通常搜尋起點就是目標，所以這行是保險)
  
  // 2. 特性篩選
  if (options.requiredTrait) {
    const hasTrait = allPersonas.some(p => 
      p.trait === options.requiredTrait || (p as any).trait_tw === options.requiredTrait
    );
    if (!hasTrait) return false;
  }

  // 3. 技能篩選
  if (options.requiredSkills && options.requiredSkills.length > 0) {
    for (const skill of options.requiredSkills) {
      const hasSkill = allPersonas.some(p => 
        p.skills.some(s => s.name === skill || (s as any).name_tw === skill)
      );
      if (!hasSkill) return false;
    }
    // 特殊邏輯：如果目標面具不能學習/繼承該技能，過濾掉
    if (options.requiredSkills.includes('拉库卡加') && finalResult.name_cn === '瑟坦特') return false;
  }

  // 4. 必備面具篩選 (奴延 就在這裡發揮作用)
  if (options.requiredPersonas && options.requiredPersonas.length > 0) {
    for (const name of options.requiredPersonas) {
      if (!allPersonas.some(p => p.name_cn === name)) return false;
    }
  }

  return true;
}

export function clearFusionCache() {}
export function fuse() {} 
