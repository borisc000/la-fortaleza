import { SOLDIER } from './combat.ts';
export type EnemyKind = 'thrall' | 'soldier' | 'archer' | 'charger' | 'hunter' | 'elite' | 'boss';
export const ENEMIES = {
  thrall: {
    ...SOLDIER,
    name: 'Despojo reanimado',
    hp: 18,
    damage: 4,
    speed: 2,
    push: 1,
    slow: 1,
    essence: 1,
    scale: 1,
    color: 0x898474,
  },
  soldier: { ...SOLDIER, name: 'Soldado reanimado', push: 1, slow: 1, essence: 1, scale: 1, color: 0x4b4938 },
  archer: {
    ...SOLDIER,
    name: 'Ballestero hueco',
    hp: 40,
    speed: 1.8,
    damage: 10,
    range: 11,
    windup: 0.9,
    duration: 1.4,
    cooldown: 3.2,
    push: 1,
    slow: 1,
    essence: 1,
    scale: 1,
    color: 0x364c56,
  },
  charger: {
    ...SOLDIER,
    name: 'Devastador',
    hp: 78,
    speed: 1.9,
    damage: 18,
    range: 9,
    windup: 1.05,
    duration: 2.6,
    cooldown: 4.3,
    push: 1,
    slow: 1,
    essence: 1,
    scale: 1.1,
    color: 0x653d31,
  },
  hunter: {
    ...SOLDIER,
    name: 'Verdugo de la ronda',
    hp: 275,
    armor: 10,
    speed: 3.25,
    damage: 20,
    range: 13.5,
    windup: 1.05,
    duration: 2.45,
    cooldown: 2.65,
    push: 0.55,
    slow: 0.7,
    essence: 6,
    scale: 1.26,
    color: 0x68374e,
  },
  elite: {
    ...SOLDIER,
    name: 'Portador del núcleo',
    hp: 320,
    armor: 15,
    radius: 0.48,
    speed: 1.8,
    damage: 20,
    range: 2,
    arc: (Math.PI * 5) / 6,
    windup: 1,
    active: 0.18,
    duration: 1.9,
    cooldown: 2.8,
    push: 0.4,
    slow: 1,
    essence: 8,
    scale: 1.3,
    color: 0x685733,
  },
  boss: {
    ...SOLDIER,
    name: 'El Castellano Vacío',
    hp: 1400,
    armor: 20,
    radius: 0.65,
    speed: 2.45,
    damage: 24,
    range: 2.6,
    arc: Math.PI,
    windup: 1.1,
    active: 0.2,
    duration: 2.1,
    cooldown: 3,
    push: 0,
    slow: 0.25,
    essence: 0,
    scale: 1.65,
    color: 0x503953,
  },
} as const;
export type EnemyAction = 'melee' | 'shot' | 'charge' | 'slam' | 'volley' | 'rupture' | 'edict';
export const BOSS_ROTATION = ['melee', 'slam', 'volley', 'rupture', 'edict', 'charge'] as const;
export const BOSS_FURY = { healthFraction: 0.5, speedMultiplier: 1.22, cooldownMultiplier: 0.8 } as const;
export const BOSS_ATTACK_CUES: Partial<Record<EnemyAction, { name: string; instruction: string }>> = {
  melee: { name: 'Barrido', instruction: 'Sal del arco' },
  slam: { name: 'Golpe circular', instruction: 'Aléjate del Castellano' },
  volley: { name: 'Andanada', instruction: 'Esquiva los virotes hacia un lado' },
  charge: { name: 'Arremetida', instruction: 'Sal de la franja hacia un lado' },
  rupture: { name: 'Ruptura del suelo', instruction: 'Sal del círculo rojo' },
  edict: { name: 'Edicto del vacío', instruction: 'Quédate dentro del anillo turquesa' },
};
const CHARGE = { active: 0.65, range: 6.5 } as const;
export const BOLT = { speed: 7.5, radius: 0.13, lifetime: 3.5, cap: 100 } as const;
export function isGroundAttack(action?: EnemyAction): action is 'rupture' | 'edict' {
  return action === 'rupture' || action === 'edict';
}

export function actionStats(kind: EnemyKind, action: EnemyAction = 'melee') {
  const base = ENEMIES[kind];
  if (action === 'charge' && kind === 'boss')
    return { windup: 1.05, active: 0.92, duration: 2.55, cooldown: 3.2, range: 16.4, damage: 25, arc: 0 };
  if (action === 'charge')
    return {
      ...(kind === 'hunter' ? { active: 0.9, range: base.range } : CHARGE),
      windup: base.windup,
      duration: base.duration,
      cooldown: base.cooldown,
      damage: base.damage,
      arc: base.arc,
    };
  if (action === 'slam')
    return {
      windup: kind === 'boss' ? 1.6 : 1.35,
      active: 0.2,
      duration: 2.7,
      cooldown: 4,
      range: kind === 'boss' ? 4 : 3,
      damage: kind === 'boss' ? 28 : 22,
      arc: Math.PI * 2,
    };
  if (action === 'volley')
    return { windup: 1.2, active: 0.1, duration: 2.4, cooldown: 3.4, range: 15, damage: 14, arc: 0.9 };
  if (action === 'rupture')
    return { windup: 1.45, active: 0.3, duration: 2.5, cooldown: 3.1, range: 3.25, damage: 23, arc: 0 };
  if (action === 'edict')
    return { windup: 1.55, active: 0.3, duration: 2.6, cooldown: 3.2, range: 2.65, damage: 26, arc: 0 };
  return {
    windup: base.windup,
    active: base.active,
    duration: base.duration,
    cooldown: base.cooldown,
    range: base.range,
    damage: base.damage,
    arc: base.arc,
  };
}
