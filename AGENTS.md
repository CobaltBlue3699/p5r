# P5R Guide - Agent Coding Guidelines

## Project Overview

P5R Guide is a personal攻略 (guide) website for Persona 5 Royal, featuring persona data, fusion planning tools, and skill databases. The project consists of:

- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS v4
- **Backend**: Node.js scripts for web scraping (ESM modules)
- **Database**: SQLite (via sql.js for browser-compatible data)
- **Data Source**: BWIKI wiki scraping

## Directory Structure

```
p5r/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Homepage
│   ├── personas/
│   │   └── page.tsx        # Persona list page
│   └── globals.css         # Global styles + Tailwind
├── components/             # React components (client components use 'use client')
├── lib/                    # Shared utilities, types, and static data
│   ├── types.ts            # TypeScript interfaces
│   ├── api.ts              # Data fetching functions
│   └── personas.json       # Static persona data
├── scripts/                # Node.js tools (ESM)
│   ├── scraper.js          # Wiki scraper
│   ├── export-json.js       # SQLite → JSON export
│   ├── query.js            # CLI query tool
│   └── db/
│       └── init.js          # Database initialization
├── data/                   # Runtime data (gitignored)
│   ├── personas.db          # SQLite database
│   └── images/             # Downloaded persona images
├── public/                 # Static assets served as-is
└── package.json
```

## Build Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server (http://localhost:3000)

# Production
pnpm build                  # Build for production
pnpm start                  # Start production server

# Data Scripts
pnpm scrape                 # Scrape wiki and update database
pnpm export                 # Export SQLite to JSON for web
pnpm db:init               # Initialize empty database

# Code Quality
pnpm lint                   # Run ESLint
```

## Code Style Guidelines

### TypeScript Conventions

- Use explicit TypeScript interfaces for all data structures (`lib/types.ts`)
- Prefer `type` over `interface` for unions and mapped types
- Use `as const` for literal arrays: `['a', 'b'] as const`
- Always use strict null checks

```typescript
// ✅ Good
interface Persona {
  id: number;
  name_cn: string;
  name_en: string | null;
}

// ❌ Avoid
interface Persona {
  id: any;
  name_en?: string;
}
```

### React/Next.js Conventions

- Use **App Router** with server components by default
- Add `'use client'` directive only when needed (useState, useEffect, event handlers)
- Use `suppressHydrationWarning` on elements affected by browser extensions
- Import fonts via `next/font/google` in layout.tsx

```typescript
// ✅ Client component for interactivity
'use client';
import { useState } from 'react';

// ✅ Server component for data fetching
export default async function Page() {
  const data = getPersonas();
  return <List data={data} />;
}
```

### CSS/Styling Conventions

- Use **Tailwind CSS v4** with CSS variables for theme colors
- Define theme colors in `globals.css` under `:root`
- Use `as-var(--color-name)` syntax for CSS variables
- Avoid inline styles except for dynamic values (colors from JS)

```css
/* ✅ Theme colors in globals.css */
:root {
  --p5r-red: #E31C34;
  --p5r-black: #0D0D0D;
}
```

```tsx
{/* ✅ Tailwind with CSS variable */}
<div className="bg-[var(--p5r-dark)] text-[var(--p5r-light)]">

{/* ✅ Dynamic inline style */}
<div style={{ backgroundColor: arcanaColor }}>
```

### JavaScript (scripts/) Conventions

- Use **ES modules** (`import`/`export`)
- Use `path.resolve(__dirname, '..')` for relative paths (avoid `__dirname` directly)
- Handle errors with try/catch and meaningful error messages
- Use `console.log` for progress, `console.error` for errors

```javascript
// ✅ ESM with proper path resolution
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `persona-card.tsx` |
| Components | PascalCase | `PersonaCard.tsx` |
| Functions | camelCase | `formatResist()` |
| Constants | SCREAMING_SNAKE | `ARCANA_ORDER` |
| Database columns | snake_case | `name_cn`, `ice_resist` |
| CSS variables | kebab-case | `--p5r-red` |

### Data Structures

#### Persona Interface

```typescript
interface Persona {
  id: number;
  name_cn: string;
  name_en: string | null;
  name_jp: string | null;
  level: number;
  arcana: string;
  phys_resist: string | null;   // 'weak' | 'resist' | 'repel' | 'absorb' | 'null' | null
  gun_resist: string | null;
  fire_resist: string | null;
  ice_resist: string | null;
  elec_resist: string | null;
  wind_resist: string | null;
  psy_resist: string | null;
  nuke_resist: string | null;
  bless_resist: string | null;
  curse_resist: string | null;
  image_url: string | null;
  local_image_path: string | null;
  wiki_url: string | null;
}
```

### Error Handling

```typescript
// ✅ Async functions with try/catch
async function scrape() {
  try {
    const response = await axios.get(url);
    return parseData(response.data);
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error.message);
    throw error;
  }
}

// ✅ Graceful degradation
const value = optionalData?.property ?? 'default';
```

### Hydration Considerations

- Use `suppressHydrationWarning` on elements that may differ between server/client
- Be aware of browser extensions that modify HTML (translation, ad-blockers)
- Test in incognito mode to catch hydration mismatches

## Gitignore Patterns

```
# Dependencies
node_modules/

# Next.js
.next/
out/

# Data (runtime generated)
data/personas.db
data/images/

# Environment
.env
.env.local

# IDE
.idea/
.vscode/

# OS
.DS_Store
Thumbs.db
```

## Localization

- Primary language: **Chinese (Simplified)** - 简体中文
- UI strings should be in Chinese
- Character names stored in Chinese (name_cn), English (name_en), Japanese (name_jp)

## Performance Notes

- Static data (personas.json) is bundled at build time
- Images use `loading="lazy"` for below-fold content
- Use `useMemo` for expensive computations in client components
