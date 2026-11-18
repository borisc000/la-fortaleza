import { SOLDIER } from './combat.ts';
export type EnemyKind = 'thrall' | 'soldier' | 'archer' | 'charger' | 'elite' | 'boss';
export const ENEMIES = {
  thrall: { ...SOLDIER, name: 'Despojo reanimado', hp: 18, damage: 4, speed: 2, push: 1, slow: 1, essence: 1, scale: 1, color: 0x898474 },
  soldier: { ...SOLDIER, name: 'Soldado reanimado', push: 1, slow: 1, essence: 1, scale: 1, color: 0x4b4938 },
  archer: { ...SOLDIER, name: 'Ballestero hueco', hp: 40, speed: 1.8, damage: 10, range: 11, windup: .9, duration: 1.4, cooldown: 3.2, push: 1, slow: 1, essence: 1, scale: 1, color: 0x364c56 },
  charger: { ...SOLDIER, name: 'Devastador', hp: 78, speed: 1.9, damage: 18, range: 9, windup: 1.05, duration: 2.6, cooldown: 4.3, push: 1, slow: 1, essence: 1, scale: 1.1, color: 0x653d31 },
  elite: { ...SOLDIER, name: 'Portador del núcleo', hp: 320, armor: 15, radius: .48, speed: 1.8, damage: 20, range: 2, arc: Math.PI * 5 / 6, windup: 1, active: .18, duration: 1.9, cooldown: 2.8, push: .4, slow: 1, essence: 8, scale: 1.3, color: 0x685733 },
  boss: { ...SOLDIER, name: 'El Castellano Vacío', hp: 1100, armor: 20, radius: .65, speed: 1.7, damage: 24, range: 2.6, arc: Math.PI, windup: 1.1, active: .2, duration: 2.1, cooldown: 3, push: 0, slow: .25, essence: 0, scale: 1.65, color: 0x503953 },
} as const;
export type EnemyAction = 'melee' | 'shot' | 'charge' | 'slam' | 'volley';
export const CHARGE = { speed: 10, duration: .65, length: 6.5 } as const;
export const BOLT = { speed: 7.5, radius: .13, lifetime: 3.5, cap: 100 } as const;
export function actionStats(kind: EnemyKind, action: EnemyAction = 'melee') {
  const base = ENEMIES[kind];
  if (action === 'charge') return { windup: base.windup, active: CHARGE.duration, duration: base.duration, cooldown: base.cooldown, range: CHARGE.length, damage: base.damage, arc: base.arc };
  if (action === 'slam') return { windup: kind === 'boss' ? 1.6 : 1.35, active: .2, duration: 2.7, cooldown: 4, range: kind === 'boss' ? 4 : 3, damage: kind === 'boss' ? 28 : 22, arc: Math.PI * 2 };
  if (action === 'volley') return { windup: 1.2, active: .1, duration: 2.4, cooldown: 3.4, range: 15, damage: 14, arc: .9 };
  return { windup: base.windup, active: base.active, duration: base.duration, cooldown: base.cooldown, range: base.range, damage: base.damage, arc: base.arc };
}
