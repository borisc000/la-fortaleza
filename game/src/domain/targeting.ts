import type { Enemy } from './combat.ts';
import type { Point, Solid } from './movement.ts';
import { angleDelta } from './movement.ts';
import { clearPath } from './navigation.ts';
import { WARRIOR } from '../content/classes/warrior.ts';

export function inArc(origin: Point, target: Point, yaw: number, range: number, arc: number, radius: number): boolean {
  const dx = target.x - origin.x,
    dz = target.z - origin.z;
  if (Math.hypot(dx, dz) > range + radius) return false;
  return Math.abs(angleDelta(yaw, Math.atan2(-dx, -dz))) <= arc / 2 + 1e-8;
}
export function chooseTarget(
  origin: Point,
  enemies: readonly Enemy[],
  currentId: number | undefined,
  solids: readonly Solid[],
  range: number = WARRIOR.basic.range,
): number | undefined {
  const eligible = enemies.filter(
    enemy =>
      !enemy.dead &&
      enemy.hp > 0 &&
      enemy.spawnRemaining <= 0 &&
      Math.hypot(enemy.x - origin.x, enemy.z - origin.z) <= range + enemy.radius &&
      clearPath(origin, enemy, solids, 0.04),
  );
  eligible.sort(
    (a, b) => Math.hypot(a.x - origin.x, a.z - origin.z) - Math.hypot(b.x - origin.x, b.z - origin.z) || a.id - b.id,
  );
  const nearest = eligible[0],
    current = eligible.find(enemy => enemy.id === currentId);
  if (!nearest) return undefined;
  if (
    current &&
    Math.hypot(nearest.x - origin.x, nearest.z - origin.z) >
      Math.hypot(current.x - origin.x, current.z - origin.z) * 0.75
  )
    return current.id;
  return nearest.id;
}
