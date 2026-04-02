'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '首页', icon: 'home' },
  { href: '/personas', label: '人格面具', icon: 'mask' },
  { href: '/fusion', label: '合成规划', icon: 'fusion' },
];

export default function Navigation() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 bg-[var(--p5r-black)] border-b border-[var(--p5r-gray)]">
      <nav className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-[var(--p5r-red)] hover:text-[var(--p5r-yellow)] transition-colors">
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              P5R
            </span>
            <span className="hidden sm:inline text-sm text-[var(--p5r-light)] opacity-70">
              攻略指南
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${pathname === item.href 
                    ? 'bg-[var(--p5r-red)] text-white' 
                    : 'text-[var(--p5r-light)] hover:bg-[var(--p5r-gray)] hover:text-[var(--p5r-yellow)]'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
