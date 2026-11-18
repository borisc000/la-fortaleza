import type { Point } from '../domain/movement.ts';
import { EXPEDITION } from './expedition.ts';
import { sectorAt } from './terrain-layout.ts';

// Reachable clearings used by exploration; later captures and shops reuse these regions.
export const LANDMARKS = [
  { name: 'La explanada', x: 4, z: -8, radius: 5 },
  { name: 'Campamento abandonado', x: -35, z: 30, radius: 12 },
  { name: 'Ruinas del camino', x: -30, z: 65, radius: 12 },
  { name: 'Cruce del sur', x: 4, z: 45, radius: 16 },
  { name: 'Linde del bosque', x: 50, z: 55, radius: 12 },
  { name: 'Torre del este', x: 35, z: 2, radius: 5 },
  { name: 'Pradera de poniente', x: -95, z: 65, radius: 14 },
  { name: 'Camino de los molinos', x: -78, z: 105, radius: 14 },
  { name: 'Abadía derruida', x: -28, z: 110, radius: 14 },
  { name: 'Encrucijada del exilio', x: 8, z: 130, radius: 16 },
  { name: 'Arboleda del sur', x: 90, z: 120, radius: 18 },
  { name: 'Atalaya lejana', x: 100, z: 65, radius: 14 },
  { name: 'Campos del asedio', x: -85, z: 160, radius: 18 },
  { name: 'Gran explanada del sur', x: 10, z: 180, radius: 16 },
  { name: 'Camino de las caravanas', x: 90, z: 190, radius: 14 },
] as const;

export function regionAt(point: Point) {
  if (Math.hypot(point.x - EXPEDITION.start.x, point.z - EXPEDITION.start.z) <= 18) return EXPEDITION.arrivalName;
  const nearby = LANDMARKS.find(p => Math.hypot(p.x - point.x, p.z - point.z) <= p.radius + 3);
  return nearby?.name ?? sectorAt(point).name;
}
