import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'P5R 攻略指南 | Persona 5 Royal 人格面具圖鑑與合成規劃',
  description: 'Persona 5 Royal 完整攻略網站。包含人格面具圖鑑、属性抗性查詢、合成規劃工具、技能與特性篩選。',
};

export default function HomePage() {
  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 neon-glow" style={{ fontFamily: 'var(--font-heading)' }}>
            P5R
          </h1>
          <p className="text-xl md:text-2xl text-[var(--p5r-red)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            女神異聞錄 5 皇家版
          </p>
          <p className="text-lg text-[var(--p5r-light)] opacity-60">
            個人攻略指南
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Link 
            href="/personas"
            className="group p-8 bg-[var(--p5r-dark)] rounded-2xl border border-[var(--p5r-gray)] card-hover"
          >
            <div className="w-16 h-16 mb-4 rounded-xl bg-[var(--p5r-red)]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--p5r-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--p5r-yellow)] transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
              人格面具
            </h2>
            <p className="text-[var(--p5r-light)] opacity-60 text-sm">
              查看所有人格面具圖鑑與屬性抗性
            </p>
          </Link>
          
          <Link 
            href="/fusion"
            className="group p-8 bg-[var(--p5r-dark)] rounded-2xl border border-[var(--p5r-gray)] card-hover"
          >
            <div className="w-16 h-16 mb-4 rounded-xl bg-[var(--p5r-red)]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--p5r-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--p5r-yellow)] transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
              合成規劃
            </h2>
            <p className="text-[var(--p5r-light)] opacity-60 text-sm">
              規劃人格面具合成路徑與繼承技能
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
