import type { Element } from './elements.ts';

export type ClassId = 'warrior' | 'mage' | 'archer' | 'armored';
export type BasicAttackDefinition = Readonly<{ damage: number; range: number; arc: number; windup: number; active: number; duration: number; cooldown: number }>;
export type ClassDefinition = Readonly<{
  id: ClassId;
  name: string;
  stats: Readonly<{ hp: number; armor: number; protection: number }>;
  movement: Readonly<{ speed: number; maxSpeed: number; radius: number; height: number; turnSpeed: number }>;
  weapon: Readonly<{ id: string; name: string }>;
  basic: BasicAttackDefinition;
  passive: Readonly<{ id: string; name: string }>;
  skill: Readonly<{ id: string; name: string }>;
  affinities: Readonly<Partial<Record<Element, Readonly<{ description: string; upgradeDescription: string; mastery: string; masteryDescription: string }>>>>;
}>;
export function classAffinity(definition: ClassDefinition, element: Element) {
  const affinity = definition.affinities[element];
  if (!affinity) throw new Error(`Afinidad no disponible para ${definition.name}: ${element}`);
  return affinity;
}
