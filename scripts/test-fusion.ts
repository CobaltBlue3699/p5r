import persons from '../lib/personas.json' with { type: 'json' };
import { getFusionResult, getFusionResults } from '../lib/fusion-matrix';

interface Persona {
  id: number;
  name_cn: string;
  name_en: string | null;
  name_jp: string | null;
  level: number;
  arcana: string;
  [key: string]: unknown;
}

const personas = persons as Persona[];

function findPersona(name: string): Persona | undefined {
  return personas.find(p => p.name_cn === name);
}

function calculatePrice(a: Persona, b: Persona): number {
  const levelDiff = Math.abs(a.level - b.level);
  const effectiveLevelB = levelDiff > 10 ? b.level + 10 - levelDiff + 10 : b.level;
  return (a.level + effectiveLevelB) * 10;
}

const recipes = [
  { name: '皮克希', ingredients: ['幸魂', '天钿女命'] },
  { name: '皮克希', ingredients: ['幸魂', '拉南希'] },
  { name: '皮克希', ingredients: ['女梦魔', '杰克霜精'] },
  { name: '天钿女命', ingredients: ['女梦魔', '杰克霜精'] },
  { name: '辉夜', ingredients: ['高等皮克希', '软泥怪'] },
  { name: '辉夜', ingredients: ['高等皮克希', '飞天'] },
];

console.log('=== Testing Fusion Recipes ===\n');

let passed = 0;
let failed = 0;

for (const recipe of recipes) {
  const [ing1, ing2] = recipe.ingredients;
  const p1 = findPersona(ing1);
  const p2 = findPersona(ing2);
  const target = findPersona(recipe.name);
  
  if (!p1 || !p2 || !target) {
    console.log(`❌ Missing persona: ${ing1} or ${ing2} or ${recipe.name}`);
    failed++;
    continue;
  }
  
  const resultArcanas = getFusionResults(p1.arcana, p2.arcana);
  const price = calculatePrice(p1, p2);
  
  const avgLevel = Math.floor((p1.level + p2.level) / 2) + 1;
  console.log(`Recipe: ${ing1}(Lv${p1.level} ${p1.arcana}) + ${ing2}(Lv${p2.level} ${p2.arcana})`);
  console.log(`  Expected: ${recipe.name}(Lv${target.level} ${target.arcana})`);
  console.log(`  Got arcanas: ${resultArcanas.join(' or ')}, price: ${price}, avgLevel: ${avgLevel}`);
  
  const canProduce = resultArcanas.includes(target.arcana);
  console.log(`  Can produce ${target.arcana}: ${canProduce ? 'YES' : 'NO'}`);
  
  if (canProduce) {
    console.log(`  Status: ✅ PASS`);
    passed++;
  } else {
    console.log(`  Status: ❌ FAIL`);
    failed++;
  }
  console.log('');
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
