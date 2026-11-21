import type { EnemyKind } from './enemies.ts';

export const CAMPAIGN = {
  eliteAt: 150,
  bossAt: 360,
  arrivalWarning: 6,
  spawnWarning: 1.5,
  maxEnemies: 100,
  corpseSeconds: 2,
  restStart: 56,
} as const;
export const LOCAL_HORDE = {
  minDistance: 11,
  maxDistance: 23,
  ringStep: 4,
  localRadius: 26,
  checkInterval: 1,
  replenishInterval: 2.5,
  retireDistance: 38,
  retireAfter: 8,
} as const;
export const WAVES = [
  { at: 0, label: 'La guardia despierta', interval: 4, count: 6, archers: 0, chargers: 0, localTarget: 20 },
  { at: 60, label: 'Fuego desde las almenas', interval: 3.5, count: 9, archers: 1, chargers: 0, localTarget: 40 },
  { at: 150, label: 'La marcha del portador', interval: 3, count: 12, archers: 1, chargers: 1, localTarget: 60 },
  { at: 240, label: 'El asedio de los muertos', interval: 2.5, count: 15, archers: 1, chargers: 1, localTarget: 90 },
] as const;

export const INCURSION_WARNING = 4;
export const INCURSIONS = [
  {
    kind: 'siege',
    title: 'Toque de asedio',
    warning: 'Llegan ballesteros por los flancos',
    active: 'Muévete de lado para esquivar los virotes',
    earliest: 80,
    latest: 90,
    duration: 14,
    enemies: ['archer', 'soldier', 'archer', 'archer', 'soldier', 'archer'],
  },
  {
    kind: 'hunt',
    title: 'Montería del Verdugo',
    warning: 'Se acerca el Verdugo de la ronda',
    active: 'Esquiva la carga hacia un lado',
    earliest: 188,
    latest: 196,
    duration: 10,
    enemies: ['hunter'],
  },
  {
    kind: 'siege',
    title: 'Toque de asedio',
    warning: 'Llegan ballesteros y devastadores',
    active: 'Esquiva cargas y virotes hacia los lados',
    earliest: 275,
    latest: 282,
    duration: 14,
    enemies: ['archer', 'charger', 'archer', 'archer', 'charger', 'archer'],
  },
] as const satisfies readonly {
  kind: 'siege' | 'hunt';
  title: string;
  warning: string;
  active: string;
  earliest: number;
  latest: number;
  duration: number;
  enemies: readonly EnemyKind[];
}[];

export function incursionSchedule(seed: number) {
  return INCURSIONS.map((event, index) => {
    // Keep the schedule independent from random draws used for position selection.
    const mixed = Math.imul(seed + index + 1, 0x9e3779b1);
    const offset = ((mixed ^ (mixed >>> 16)) >>> 0) % (event.latest - event.earliest + 1);
    return { ...event, at: event.earliest + offset };
  });
}
