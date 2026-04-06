import { NextResponse } from 'next/server';
import path from 'path';
import type { Persona } from '@/lib/types';

export async function GET() {
  const personas = (await import('@/lib/personas.json')).default as Persona[];
  
  const personasWithImages = personas.map(p => ({
    ...p,
    image_url: p.local_image_path 
      ? `/api/personas/${path.basename(p.local_image_path)}`
      : null,
  }));
  
  return NextResponse.json(personasWithImages);
}
