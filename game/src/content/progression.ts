import { WARRIOR } from './classes/warrior.ts';
export const PROGRESSION = {
  absorb: 1.5,
  attract: 3,
  attractionSpeed: 8,
  maxSpeed: WARRIOR.movement.maxSpeed,
  fallbackHealFraction: 0.25,
} as const;
export const UPGRADES = {
  damage: {
    name: 'Filo templado',
    description: '+10 % de daño base a los ataques de tu clase.',
    amount: 0.1,
    maxRank: 3,
    symbol: 'Ⅰ',
  },
  vitality: {
    name: 'Vigor de hierro',
    description: '+20 de vida máxima y recuperas 20 de vida.',
    amount: 20,
    maxRank: 3,
    symbol: 'Ⅱ',
  },
  speed: {
    name: 'Paso firme',
    description: '+0,5 m/s al caminar, hasta un máximo de 6,5 m/s.',
    amount: 0.5,
    maxRank: 3,
    symbol: 'Ⅲ',
  },
  collection: {
    name: 'Llamada de esencia',
    description: '+0,5 m de alcance de atracción y recogida.',
    amount: 0.5,
    maxRank: 3,
    symbol: 'Ⅳ',
  },
} as const;
export type UpgradeId = keyof typeof UPGRADES;
export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[];

/** Dense expedition curve: early affinity, then increasing investment per choice. */
export function hordeThreshold(level: number) {
  return level <= 1 ? 4 : 24 + 10 * (level - 2);
}
export const HORDE_COIN_KILLS = 8;

export const HORDE_HIT_GRACE = 0.65;
