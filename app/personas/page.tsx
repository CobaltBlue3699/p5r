import { getPersonas } from '@/lib/api';
import PersonaList from '@/components/PersonaList';

export const metadata = {
  title: '人格面具图鉴 | P5R 攻略指南',
  description: 'Persona 5 Royal 人格面具完整图鉴，包含所有面具的等级、塔罗牌、属性抗性等信息',
};

export default function PersonasPage() {
  const personas = getPersonas();
  
  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 neon-glow" style={{ fontFamily: 'var(--font-heading)' }}>
            人格面具图鉴
          </h1>
          <p className="text-[var(--p5r-light)] opacity-60">
            共 {personas.length} 个人格面具
          </p>
        </div>
        
        <PersonaList personas={personas} />
      </div>
    </main>
  );
}
