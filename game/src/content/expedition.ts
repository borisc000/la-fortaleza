import type { Point } from '../domain/movement.ts';
import type { ObjectKind } from './exploration.ts';

export type ExpeditionId = 'exterior' | 'stone-heart';

export const EXPEDITION_TITLES: Readonly<Record<ExpeditionId, string>> = {
  exterior: 'Los dominios exteriores',
  'stone-heart': 'El corazón de piedra',
};

export type InteriorExpeditionLayout = {
  id: 'stone-heart';
  start: Point & { yaw: number };
  arrivalName: string;
  objects: readonly (Point & { kind: ObjectKind; region: string; amount: number; uses: number })[];
};

export type ExpeditionLayout = {
  start: Point & { yaw: number };
  arrivalName: string;
  chest: Point;
  supply: Point;
  coins: Point;
  shop: Point;
  capture: Point;
  roadsidePlacement?: boolean;
};

export type PlayableLayout = ExpeditionLayout | InteriorExpeditionLayout;

// Shared arrival, opening guards and early activities for the exterior scenario.
export const EXPEDITION: ExpeditionLayout = {
  start: { x: 20, z: 205, yaw: Math.atan2(16, 223) },
  arrivalName: 'Llegada de la expedición',
  roadsidePlacement: true,
  chest: { x: 25, z: 195 },
  supply: { x: 12, z: 199 },
  coins: { x: 20, z: 194 },
  shop: { x: 35, z: 180 },
  // Eight metres north of the E0 sketch, clear of the abbey's existing rewards.
  capture: { x: -20, z: 102 },
};

export const OPENING_GUARD_OFFSETS = [
  { x: -3, z: -6.5 },
  { x: 4, z: -9 },
  { x: 8, z: -5.5 },
  { x: -8, z: -8 },
  { x: 10, z: -13 },
] as const;
