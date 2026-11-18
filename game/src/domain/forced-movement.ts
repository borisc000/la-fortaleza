import { moveCircle } from './movement.ts';
import type { Bounds, Point, Solid } from './movement.ts';
import { segmentDistance } from './projectiles.ts';

/** Signed displacement away from an origin. Never cross the center, solids or the hero. */
export function displaceFrom(target: Point & { radius: number }, origin: Point, amount: number, bounds: Bounds, solids: readonly Solid[], protectedHero?: Point, heroRadius = .4) {
  const dx = target.x - origin.x, dz = target.z - origin.z, distance = Math.hypot(dx, dz);
  if (distance <= 1e-8 || amount === 0) return;
  const travel = amount < 0 ? -Math.min(-amount, Math.max(0, distance - target.radius - .1)) : amount;
  const steps = Math.max(1, Math.ceil(Math.abs(travel) / .06));
  const delta = { x: dx / distance * travel / steps, z: dz / distance * travel / steps };
  for (let i = 0; i < steps; i++) {
    const next = moveCircle(target, delta, target.radius, bounds, solids);
    if (protectedHero && segmentDistance(target, next, protectedHero) < target.radius + heroRadius + .02) break;
    Object.assign(target, next);
  }
}
