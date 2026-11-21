import type { EnemyKind } from './enemies.ts';
import type { InteriorExpeditionLayout } from './expedition.ts';
import type { Bounds, Point } from '../domain/movement.ts';

export const STONE_HEART_BOUNDS: Bounds = { minX: -37, maxX: 25, minZ: -44, maxZ: 38 };
export const STONE_HEART_CAPTAIN = 'Capitán de la guarnición';

// The northbound route runs on -Z. Rectangular walls also define the combat and camera collision volumes.
export type StoneBlock = Point & { width: number; depth: number; height: number };

export function stoneBounds(block: StoneBlock) {
  return {
    min: { x: block.x - block.width / 2, y: 0, z: block.z - block.depth / 2 },
    max: { x: block.x + block.width / 2, y: block.height, z: block.z + block.depth / 2 },
  };
}

export const STONE_HEART_WALLS: readonly StoneBlock[] = [
  // Portón de entrada y patio.
  { x: -5.8, z: 31.4, width: 1.6, depth: 12.8, height: 7 },
  { x: 5.8, z: 31.4, width: 1.6, depth: 12.8, height: 7 },
  { x: 0, z: 37.2, width: 11.6, depth: 1.6, height: 4.8 },
  { x: -14, z: 25.8, width: 18, depth: 2, height: 7.4 },
  { x: 14, z: 25.8, width: 18, depth: 2, height: 7.4 },
  { x: 23, z: 9.4, width: 2, depth: 34.8, height: 7.5 },
  { x: -23, z: 22, width: 2, depth: 9.8, height: 7.5 },
  { x: -23, z: 0, width: 2, depth: 16.2, height: 7.5 },
  { x: -14, z: -7.2, width: 18.4, depth: 2, height: 8.6 },
  { x: 14, z: -7.2, width: 18.4, depth: 2, height: 8.6 },

  // Armería de poniente. El vano lateral mide nueve metros.
  { x: -36.1, z: 12.4, width: 1.8, depth: 18.6, height: 6.4 },
  { x: -29.2, z: 3.3, width: 14.4, depth: 1.6, height: 6.4 },
  { x: -29.2, z: 21.3, width: 14.4, depth: 1.6, height: 6.4 },

  // Pasaje corto y salón. Los pilares dejan libres la nave y dos flancos.
  { x: -5.6, z: -11.2, width: 1.6, depth: 8.8, height: 7.2 },
  { x: 5.6, z: -11.2, width: 1.6, depth: 8.8, height: 7.2 },
  { x: -10.4, z: -15.2, width: 11.2, depth: 1.8, height: 8.8 },
  { x: 10.4, z: -15.2, width: 11.2, depth: 1.8, height: 8.8 },
  { x: -15.3, z: -29.4, width: 1.8, depth: 28.8, height: 9.4 },
  { x: 15.3, z: -29.4, width: 1.8, depth: 28.8, height: 9.4 },
  { x: 0, z: -43.1, width: 31, depth: 1.8, height: 10 },
];

export const STONE_HEART_COLUMNS: readonly StoneBlock[] = [-21.5, -29, -36.5].flatMap(z =>
  [-8.35, 8.35].map(x => ({ x, z, width: 1.62, depth: 1.62, height: 8.4 })),
);

export const STONE_HEART_SOLIDS = [...STONE_HEART_WALLS, ...STONE_HEART_COLUMNS].map(stoneBounds);
export const STONE_HEART_GATE: StoneBlock = { x: 0, z: -7.2, width: 9.8, depth: 0.48, height: 5.5 };
export const STONE_HEART_BEACON = { id: 'beacon', kind: 'beacon', x: 0, z: -37.6 } as const;
export const STONE_HEART_ARCH = { x: 0, z: -16.5 };
export const STONE_HEART_COURT = { x: 0, z: 9.5 };

export const STONE_HEART_LAYOUT: InteriorExpeditionLayout = {
  id: 'stone-heart',
  start: { x: 0, z: 29, yaw: 0 },
  arrivalName: 'Portón interior',
  objects: [
    { kind: 'chest', x: -32.6, z: 14.2, region: 'Armería', amount: 14, uses: 1 },
    { kind: 'shop', x: -31.6, z: 7.1, region: 'Armería', amount: 0, uses: 1 },
    { kind: 'supply', x: -26.1, z: 17.1, region: 'Armería', amount: 25, uses: 1 },
    { kind: 'coins', x: -27.8, z: 11.2, region: 'Armería', amount: 7, uses: 1 },
    { kind: 'fountain', x: 13.4, z: -0.8, region: 'Patio de armas', amount: 35, uses: 2 },
    { kind: 'supply', x: 0.95, z: -11.4, region: 'Paso del rastrillo', amount: 30, uses: 1 },
    { kind: 'supply', x: 10.8, z: -33.5, region: 'Salón principal', amount: 24, uses: 1 },
  ],
};

export type StoneHeartSpawn = Point & { kind: EnemyKind };

export const COURT_GUARDS: readonly StoneHeartSpawn[] = [
  { x: -5.1, z: 11.6, kind: 'thrall' },
  { x: 5.1, z: 12.5, kind: 'thrall' },
  { x: -11.8, z: 9.4, kind: 'thrall' },
  { x: 10.8, z: 8.8, kind: 'thrall' },
  { x: -3.8, z: 3.3, kind: 'soldier' },
  { x: 4, z: 3.2, kind: 'soldier' },
  { x: 14.5, z: 0.8, kind: 'archer' },
];

export const COURT_REINFORCEMENTS: readonly StoneHeartSpawn[] = [
  { x: -17.5, z: -2.5, kind: 'soldier' },
  { x: 17, z: -2.2, kind: 'charger' },
  { x: -12, z: 2.5, kind: 'thrall' },
  { x: 12, z: 2.5, kind: 'thrall' },
  { x: -17, z: 19.5, kind: 'thrall' },
  { x: 17, z: 19.5, kind: 'archer' },
];

export const HALL_GUARDS: readonly StoneHeartSpawn[] = [
  { x: -4, z: -25.3, kind: 'soldier' },
  { x: 4, z: -25.6, kind: 'soldier' },
  { x: -10.9, z: -27.1, kind: 'thrall' },
  { x: 10.9, z: -28, kind: 'thrall' },
  { x: 2.9, z: -35.5, kind: 'charger' },
  { x: -12, z: -36.5, kind: 'archer' },
];

export const HALL_CAPTAIN: StoneHeartSpawn = { x: 0, z: -34.1, kind: 'elite' };

export function stoneHeartRegion(point: Point) {
  if (point.z >= 25) return STONE_HEART_LAYOUT.arrivalName;
  if (point.z <= -16) return 'Salón principal';
  if (point.z <= -7.2) return 'Paso del rastrillo';
  return point.x <= -23 ? 'Armería' : 'Patio de armas';
}
