import type { RelicId } from './relics.ts';
export type Element = 'fire' | 'water' | 'earth' | 'air';
export type ElementalLoadout = { element?: Element; rank: number; mastery: boolean; pureElemental?: boolean; secondary?: Readonly<{ element: Element; rank: number }>; relics?: readonly RelicId[] };
export const ELEMENTS = {
  fire: { name: 'Fuego', color: 0xf19842, symbol: '♨' },
  water: { name: 'Agua', color: 0x64c9e8, symbol: '≈' },
  earth: { name: 'Tierra', color: 0xc8a366, symbol: '◆' },
  air: { name: 'Aire', color: 0xc3e8b8, symbol: '≋' },
} as const;
export function isElement(id: string): id is Element { return Object.hasOwn(ELEMENTS, id); }
export const ELEMENT_RULES = {
  shares: [.3, .4, .5], burnDuration: 3, burnRatio: .2, burnInterval: .5,
  wetDuration: 3, slow: .15, brokenDuration: 3, brokenBonus: .15,
} as const;
export function elementalShare(loadout: ElementalLoadout) { return loadout.element ? loadout.pureElemental ? 1 : ELEMENT_RULES.shares[Math.max(0, Math.min(2, loadout.rank - 1))] : 0; }
export function splitDirectDamage(total: number, loadout: ElementalLoadout) { const elemental = total * elementalShare(loadout); return { physical: total - elemental, elemental }; }
