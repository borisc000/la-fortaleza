import type { Point, Solid } from '../domain/movement.ts';
import { clearPath } from '../domain/navigation.ts';
import { PLAYER } from '../content/config.ts';
import { BOLT } from '../content/enemies.ts';

/** Warn only if the current projectile trajectory is about to pass near the hero. */
export function incomingProjectile(
  p: Point & { vx: number; vz: number },
  hero: Point,
  solids: readonly Solid[],
  heroRadius: number = PLAYER.radius,
) {
  const speedSquared = p.vx * p.vx + p.vz * p.vz;
  if (!speedSquared) return false;
  const time = ((hero.x - p.x) * p.vx + (hero.z - p.z) * p.vz) / speedSquared;
  if (time < 0 || time > 1.25) return false;
  const closest = { x: p.x + p.vx * time, z: p.z + p.vz * time };
  return (
    Math.hypot(closest.x - hero.x, closest.z - hero.z) <= heroRadius + BOLT.radius + 0.4 &&
    clearPath(p, closest, solids, BOLT.radius)
  );
}

/** HUD updates at 10 Hz; zero-delta renders refresh menus immediately. */
export class HudCadence {
  private remaining = 0;
  due(dt: number) {
    this.remaining -= dt;
    if (dt === 0 || this.remaining <= 1e-9) {
      this.remaining = 0.1;
      return true;
    }
    return false;
  }
}

/** Screen-edge anchor for a bearing relative to the camera (0 ahead, positive to the left). x and y in -1..1, y upwards. */
export function edgeAnchor(bearing: number, insetX = 0.9, insetY = 0.62) {
  const x = -Math.sin(bearing),
    y = Math.cos(bearing);
  const scale = 1 / Math.max(Math.abs(x) / insetX, Math.abs(y) / insetY);
  return { x: x * scale, y: y * scale };
}

/** Radar position for a bearing (0 ahead, positive to the left) and distance: unit circle, y downwards as on screen. Far targets pin to the rim. */
export function radarPoint(bearing: number, distance: number, range: number) {
  const radius = Math.min(1, Math.max(0, distance) / range);
  return { x: -Math.sin(bearing) * radius, y: -Math.cos(bearing) * radius, pinned: distance > range };
}
