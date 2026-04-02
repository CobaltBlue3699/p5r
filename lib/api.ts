import { Persona } from './types';
import personasData from '@/lib/personas.json';

const personas: Persona[] = personasData as unknown as Persona[];

export function getPersonas(): Persona[] {
  return personas;
}

export function getPersonaById(id: number): Persona | undefined {
  return personas.find(p => p.id === id);
}

export function getPersonasByArcana(arcana: string): Persona[] {
  return personas.filter(p => p.arcana === arcana);
}

export function searchPersonas(query: string): Persona[] {
  const lowerQuery = query.toLowerCase();
  return personas.filter(p => 
    p.name_cn.toLowerCase().includes(lowerQuery) ||
    p.name_en?.toLowerCase().includes(lowerQuery) ||
    p.name_jp?.toLowerCase().includes(lowerQuery)
  );
}
