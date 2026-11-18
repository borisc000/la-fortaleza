import { WARRIOR, WARRIOR_KIT } from './classes/warrior.ts';
import { OPENING_GUARD_OFFSETS } from './expedition.ts';
// Compatibility aliases; class data has one authoritative source.
export const HERO_COMBAT = Object.freeze({ ...WARRIOR.stats, ...WARRIOR.basic });
export const IMPETUS = WARRIOR_KIT.impetus;
export const WHIRLWIND = WARRIOR_KIT.whirlwind;
export const SOLDIER = {
  hp: 54,
  armor: 0,
  radius: 0.36,
  speed: 2.15,
  turnSpeed: 10,
  damage: 12,
  range: 1.1,
  arc: Math.PI / 2,
  windup: 0.6,
  active: 0.12,
  duration: 1.05,
  cooldown: 1.55,
} as const;
// Standalone combat exercise around (0, 7); Run places the same guard at its arrival.
export const ENCOUNTER = OPENING_GUARD_OFFSETS.map(p => ({ x: p.x, z: p.z + 7 }));
