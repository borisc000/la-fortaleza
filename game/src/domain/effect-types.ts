import type { Enemy, CombatSource } from './combat.ts';
import type { Point } from './movement.ts';

export type ElementalDamage = { target: Enemy; amount: number; source: CombatSource; attackId: number };
export type ElementalVisual = { type: 'splash' | 'explosion' | 'quake' | 'gust'; position: Point; radius: number };
