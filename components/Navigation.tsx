'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { 
    href: '/', 
    label: '首頁', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>` 
  },
  { 
    href: '/personas', 
    label: '人格面具', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-5 h-5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 21c0-2 2-4 5-4s5 2 5 4"/></svg>` 
  },
  { 
    href: '/fusion', 
    label: '合成規劃', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>` 
  },
];

export default function Navigation() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 bg-[var(--p5r-black)] border-b border-[var(--p5r-gray)]">
      <nav className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-[var(--p5r-red)] hover:text-[var(--p5r-yellow)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-8 h-8">
              <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.15"/>
              <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
              <ellipse cx="12" cy="13" rx="2" ry="2.5" fill="currentColor"/>
              <ellipse cx="20" cy="13" rx="2" ry="2.5" fill="currentColor"/>
              <path d="M11 20c0 0 1.2 1.5 5 1.5s5-1.5 5-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
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
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${pathname === item.href 
                    ? 'bg-[var(--p5r-red)] text-white' 
                    : 'text-[var(--p5r-light)] hover:bg-[var(--p5r-gray)] hover:text-[var(--p5r-yellow)]'
                  }
                `}
              >
                <span dangerouslySetInnerHTML={{ __html: item.icon }} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
