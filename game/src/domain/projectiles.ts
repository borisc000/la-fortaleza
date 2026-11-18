import type { Point, Bounds, Solid } from './movement.ts';
import { clearPath } from './navigation.ts';
import { BOLT } from '../content/enemies.ts';
import { PLAYER } from '../content/config.ts';
export type Projectile = Point & {
  id: number;
  owner: number;
  previous: Point;
  vx: number;
  vz: number;
  age: number;
  damage: number;
};
export function segmentDistance(a: Point, b: Point, p: Point) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / length)) : 0;
  return Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z);
}
export class Projectiles {
  readonly items: Projectile[] = [];
  private nextId = 0;
  private bounds: Bounds;
  private solids: readonly Solid[];
  private heroRadius: number;
  constructor(bounds: Bounds, solids: readonly Solid[], heroRadius: number = PLAYER.radius) {
    this.bounds = bounds;
    this.solids = solids;
    this.heroRadius = heroRadius;
  }
  fire(origin: Point, yaw: number, owner: number, damage: number) {
    if (this.items.length >= BOLT.cap) return;
    this.items.push({
      ...origin,
      id: ++this.nextId,
      owner,
      previous: { ...origin },
      vx: -Math.sin(yaw) * BOLT.speed,
      vz: -Math.cos(yaw) * BOLT.speed,
      age: 0,
      damage,
    });
  }
  step(dt: number, hero: Point) {
    const hits: Projectile[] = [];
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.previous = { x: p.x, z: p.z };
      p.age += dt;
      const next = { x: p.x + p.vx * dt, z: p.z + p.vz * dt };
      // Sweep in short segments; wall collision takes priority before a target behind it.
      const steps = Math.max(1, Math.ceil(Math.hypot(next.x - p.x, next.z - p.z) / 0.08));
      let removed = false;
      for (let j = 1; j <= steps; j++) {
        const to = {
          x: p.previous.x + ((next.x - p.previous.x) * j) / steps,
          z: p.previous.z + ((next.z - p.previous.z) * j) / steps,
        };
        if (!clearPath(p, to, this.solids, BOLT.radius)) {
          removed = true;
          break;
        }
        if (segmentDistance(p, to, hero) <= this.heroRadius + BOLT.radius) {
          hits.push(p);
          removed = true;
          break;
        }
        p.x = to.x;
        p.z = to.z;
      }
      if (
        removed ||
        p.age >= BOLT.lifetime ||
        p.x < this.bounds.minX ||
        p.x > this.bounds.maxX ||
        p.z < this.bounds.minZ ||
        p.z > this.bounds.maxZ
      )
        this.items.splice(i, 1);
    }
    return hits.sort((a, b) => a.id - b.id);
  }
  clear() {
    this.items.length = 0;
  }
}
