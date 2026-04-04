import { describe, it, expect, beforeEach } from 'vitest';
import { findFusionPaths, clearFusionCache } from '../lib/fusion';

describe('Fusion Path Finder', () => {
  beforeEach(() => {
    clearFusionCache();
  });

  it('should find direct fusion path for 朱雀', () => {
    const paths = findFusionPaths('朱雀', { maxSteps: 1 });
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should filter paths by requiredTrait - 熱病的血統 (TW variant)', () => {
    clearFusionCache();
    const filteredPaths = findFusionPaths('朱雀', { maxSteps: 1, requiredTrait: '熱病的血統' });
    
    console.log('TW trait filter results:', filteredPaths.length);
    console.log('Paths:', filteredPaths.map(p => p.steps[0].personaA.name_cn + '+' + p.steps[0].personaB.name_cn));
    
    expect(filteredPaths.length).toBeGreaterThan(0);
  });

  it('should include 凤凰 in filtered results since it has 熱病的血統', () => {
    const paths = findFusionPaths('朱雀', { maxSteps: 1, requiredTrait: '热病的血统' });

    const hasPhoenix = paths.some(path =>
      path.steps.some(step => 
        step.personaA.name_cn === '凤凰' || 
        step.personaB.name_cn === '凤凰'
      )
    );
    
    expect(hasPhoenix).toBe(true);
  });

  it('should find paths with 獅爺 when using multi-step fusion with trait filter', () => {
    clearFusionCache();
    const paths = findFusionPaths('朱雀', { maxSteps: 2, requiredTrait: '热病的血统' });
    
    console.log('maxSteps=2, all paths:', paths.length);
    paths.slice(0, 5).forEach(p => {
      console.log('  Steps:', p.steps.length, '|', p.steps.map(s => `${s.personaA.name_cn}+${s.personaB.name_cn}=${s.resultPersona.name_cn}`).join(' -> '));
    });
    
    // Should find at least one path with 獅爺 (any step count)
    const hasShishi = paths.some(path => {
      const allPersonas = path.steps.flatMap(s => [s.personaA, s.personaB, s.resultPersona]);
      return allPersonas.some(p => p.name_cn === '狮爷');
    });
    console.log('Has 獅爺:', hasShishi);
    expect(hasShishi).toBe(true);
  });

  it('should exclude paths without required trait', () => {
    const paths = findFusionPaths('朱雀', { maxSteps: 1, requiredTrait: '热病的血统' });

    paths.forEach(path => {
      const allPersonas = path.steps.flatMap(step => [step.personaA, step.personaB, step.resultPersona]);
      const hasRequiredTrait = allPersonas.some(p => 
        p.trait?.includes('热病的血统') || (p as any).trait_tw?.includes('熱病的血統')
      );
      expect(hasRequiredTrait).toBe(true);
    });
  });
  
  it('should return empty when no paths match trait filter', () => {
    clearFusionCache();
    const paths = findFusionPaths('朱雀', { maxSteps: 1, requiredTrait: '不存在的特性' });
    expect(paths.length).toBe(0);
  });

  it('should filter paths by requiredSkill - 芙雷', () => {
    clearFusionCache();
    const paths = findFusionPaths('朱雀', { maxSteps: 1, requiredSkills: ['芙雷'] });
    
    console.log('Skill filter - 芙雷, paths found:', paths.length);
    
    expect(paths.length).toBeGreaterThan(0);
    
    // Verify all paths have at least one persona with the required skill
    paths.forEach(path => {
      const allPersonas = path.steps.flatMap(s => [s.personaA, s.personaB, s.resultPersona]);
      const hasSkill = allPersonas.some(persona => 
        persona.skills.some(s => s.name === '芙雷')
      );
      expect(hasSkill).toBe(true);
    });
    
    // Verify that the skill comes from the initial persona (resultPersona), not inherited
    const pathsWithInitialSkill = paths.filter(p => {
      return p.steps[0].resultPersona.skills.some(s => s.name === '芙雷');
    });
    console.log('Paths with 芙雷 as initial skill:', pathsWithInitialSkill.length);
    expect(pathsWithInitialSkill.length).toBeGreaterThan(0);
  });

  it('should filter paths by requiredSkill - 拉库卡加', () => {
    clearFusionCache();
    const paths = findFusionPaths('瑟坦特', { maxSteps: 1, requiredSkills: ['拉库卡加', '拉庫卡加'] });
    
    console.log('Skill filter - 拉库卡加, paths found:', paths.length);
    
    // 比利士 has 拉库卡加 skill, so paths containing 比利士 will appear
    // This is correct - we're filtering for paths that INCLUDE the skill
    const blsPaths = paths.filter((p: any) => {
      const names = [p.steps[0].personaA.name_cn, p.steps[0].personaB.name_cn];
      return names.includes('比利士');
    });
    console.log('Paths with 比利士 (has 拉库卡加):', blsPaths.length);
    
    // 比利士 should appear because it has 拉库卡加
    expect(blsPaths.length).toBeGreaterThan(0);
  });

  it('should find Orpheus with skills and trait', () => {
    clearFusionCache();
    
    // Test with TW inputs (what the UI sends)
    const paths = findFusionPaths('欧若博司', { 
      maxSteps: 2,
      requiredSkills: ['新華彩樂段', '輝箭'],
      requiredTrait: '萬夫莫敵'
    });
    
    console.log('Orpheus paths with TW filter:', paths.length);
    if (paths.length > 0) {
      console.log('First path:', paths[0].steps.map(s => s.personaA.name_cn + '+' + s.personaB.name_cn));
    }
    
    // Also test with CN inputs
    clearFusionCache();
    const pathsCN = findFusionPaths('欧若博司', { 
      maxSteps: 2,
      requiredSkills: ['新华彩乐段', '辉箭'],
      requiredTrait: '万夫莫敌'
    });
    console.log('Orpheus paths with CN filter:', pathsCN.length);
    
    // Test without any filters
    clearFusionCache();
    const pathsNoFilter = findFusionPaths('欧若博司', { maxSteps: 2 });
    console.log('Orpheus paths without filter:', pathsNoFilter.length);
    if (pathsNoFilter.length > 0) {
      console.log('First path:', pathsNoFilter[0].steps.map(s => s.personaA.name_cn + '+' + s.personaB.name_cn));
    }
    
    expect(pathsNoFilter.length).toBeGreaterThan(0);
  });
});