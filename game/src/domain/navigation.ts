import { moveCircle, overlaps } from './movement.ts';
import type { Bounds, Point, Solid } from './movement.ts';

const OBSTACLE_CELL_SIZE = 4;

/** Capsule-like swept segment, conservatively padded against architecture. */
export function clearPath(from: Point, to: Point, solids: readonly Solid[], padding = 0): boolean {
  const delta = { x: to.x - from.x, z: to.z - from.z };
  const minX = Math.min(from.x, to.x) - padding,
    maxX = Math.max(from.x, to.x) + padding,
    minZ = Math.min(from.z, to.z) - padding,
    maxZ = Math.max(from.z, to.z) + padding;
  for (const box of solids) {
    if (box.max.x < minX || box.min.x > maxX || box.max.z < minZ || box.min.z > maxZ) continue;
    let near = 0,
      far = 1;
    for (const axis of ['x', 'z'] as const) {
      const lo = box.min[axis] - padding,
        hi = box.max[axis] + padding,
        d = delta[axis];
      if (Math.abs(d) < 1e-9) {
        if (from[axis] < lo || from[axis] > hi) {
          near = Infinity;
          break;
        }
      } else {
        const a = (lo - from[axis]) / d,
          b = (hi - from[axis]) / d;
        near = Math.max(near, Math.min(a, b));
        far = Math.min(far, Math.max(a, b));
        if (near > far) break;
      }
    }
    if (near <= far && far >= 0 && near <= 1) return false;
  }
  return true;
}

/** Cached grid for pursuers. A shared reverse BFS avoids running
 * a separate search for each actor. Collision checks still own physical movement. */
export class Navigation {
  readonly cell = 0.8;
  readonly width: number;
  readonly depth: number;
  readonly free: Uint8Array;
  readonly distance: Int32Array;
  private target = -1;
  private bounds: Bounds;
  private solids: readonly Solid[];
  private radius: number;
  private links: number[][];
  private obstacleBuckets = new Map<string, Solid[]>();
  private nearby(point: Point, margin: number): Solid[] {
    const result = new Set<Solid>();
    for (
      let x = Math.floor((point.x - margin) / OBSTACLE_CELL_SIZE);
      x <= Math.floor((point.x + margin) / OBSTACLE_CELL_SIZE);
      x++
    )
      for (
        let z = Math.floor((point.z - margin) / OBSTACLE_CELL_SIZE);
        z <= Math.floor((point.z + margin) / OBSTACLE_CELL_SIZE);
        z++
      )
        for (const solid of this.obstacleBuckets.get(`${x},${z}`) ?? []) result.add(solid);
    return [...result];
  }
  constructor(bounds: Bounds, solids: readonly Solid[], radius: number) {
    this.bounds = bounds;
    this.solids = solids;
    this.radius = radius;
    // Static broad phase: constructing a larger grid need not scan every wall at every cell.
    for (const solid of solids) {
      for (let x = Math.floor(solid.min.x / OBSTACLE_CELL_SIZE); x <= Math.floor(solid.max.x / OBSTACLE_CELL_SIZE); x++)
        for (
          let z = Math.floor(solid.min.z / OBSTACLE_CELL_SIZE);
          z <= Math.floor(solid.max.z / OBSTACLE_CELL_SIZE);
          z++
        ) {
          const key = `${x},${z}`,
            bucket = this.obstacleBuckets.get(key) ?? [];
          bucket.push(solid);
          this.obstacleBuckets.set(key, bucket);
        }
    }
    this.width = Math.ceil((bounds.maxX - bounds.minX) / this.cell);
    this.depth = Math.ceil((bounds.maxZ - bounds.minZ) / this.cell);
    this.free = new Uint8Array(this.width * this.depth);
    this.distance = new Int32Array(this.free.length).fill(-1);
    for (let i = 0; i < this.free.length; i++) {
      const point = this.point(i);
      if (
        point.x < bounds.minX + radius ||
        point.x > bounds.maxX - radius ||
        point.z < bounds.minZ + radius ||
        point.z > bounds.maxZ - radius
      )
        continue;
      this.free[i] = this.nearby(point, radius + 0.08).some(box => overlaps(point, radius + 0.08, box)) ? 0 : 1;
    }
    this.links = Array.from({ length: this.free.length }, (_, i) => (this.free[i] ? this.buildNeighbours(i) : []));
  }
  clearPath(from: Point, to: Point, padding = this.radius): boolean {
    if (!this.solids.length) return true;
    const minX = Math.floor((Math.min(from.x, to.x) - padding) / OBSTACLE_CELL_SIZE),
      maxX = Math.floor((Math.max(from.x, to.x) + padding) / OBSTACLE_CELL_SIZE),
      minZ = Math.floor((Math.min(from.z, to.z) - padding) / OBSTACLE_CELL_SIZE),
      maxZ = Math.floor((Math.max(from.z, to.z) + padding) / OBSTACLE_CELL_SIZE);
    // Long diagonal queries can cover more empty cells than there are boxes.
    if ((maxX - minX + 1) * (maxZ - minZ + 1) >= this.solids.length) return clearPath(from, to, this.solids, padding);
    for (let x = minX; x <= maxX; x++)
      for (let z = minZ; z <= maxZ; z++) {
        const boxes = this.obstacleBuckets.get(`${x},${z}`);
        if (boxes && !clearPath(from, to, boxes, padding)) return false;
      }
    return true;
  }
  move(start: Point, delta: Point, radius: number): Point {
    // One normal substep accepts its endpoint directly when it needs no contact or boundary correction.
    if (Math.hypot(delta.x, delta.z) <= radius * 0.25) {
      const end = { x: start.x + delta.x, z: start.z + delta.z };
      if (
        end.x >= this.bounds.minX + radius &&
        end.x <= this.bounds.maxX - radius &&
        end.z >= this.bounds.minZ + radius &&
        end.z <= this.bounds.maxZ - radius &&
        this.clearPath(end, end, radius)
      )
        return end;
    }
    return moveCircle(start, delta, radius, this.bounds, this.solids);
  }
  point(index: number): Point {
    return {
      x: this.bounds.minX + ((index % this.width) + 0.5) * this.cell,
      z: this.bounds.minZ + (Math.floor(index / this.width) + 0.5) * this.cell,
    };
  }
  private buildNeighbours(index: number): number[] {
    const x = index % this.width,
      z = Math.floor(index / this.width),
      result: number[] = [];
    const nearby = this.nearby(this.point(index), this.cell + this.radius);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= this.width || nz >= this.depth) continue;
      const next = nz * this.width + nx;
      if (this.free[next] && clearPath(this.point(index), this.point(next), nearby, this.radius)) result.push(next);
    }
    return result;
  }
  private nearest(point: Point, goal = false): number {
    const x = Math.floor((point.x - this.bounds.minX) / this.cell),
      z = Math.floor((point.z - this.bounds.minZ) / this.cell);
    let best = -1,
      distance = Infinity;
    for (let dz = -3; dz <= 3; dz++)
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx,
          nz = z + dz;
        if (nx < 0 || nz < 0 || nx >= this.width || nz >= this.depth) continue;
        const i = nz * this.width + nx;
        if (!this.free[i]) continue;
        const p = this.point(i),
          d = Math.hypot(p.x - point.x, p.z - point.z);
        if (d < distance && this.clearPath(point, p)) {
          best = i;
          distance = d;
        }
      }
    // Larger enemies approach a safe cell near a hero hugging a wall.
    if (best < 0 && goal)
      for (let dz = -3; dz <= 3; dz++)
        for (let dx = -3; dx <= 3; dx++) {
          const nx = x + dx,
            nz = z + dz;
          if (nx < 0 || nz < 0 || nx >= this.width || nz >= this.depth) continue;
          const i = nz * this.width + nx;
          if (!this.free[i]) continue;
          const p = this.point(i),
            d = Math.hypot(p.x - point.x, p.z - point.z);
          if (d < distance && this.clearPath(point, p, 0.04)) {
            best = i;
            distance = d;
          }
        }
    return best;
  }
  update(target: Point) {
    const index = this.nearest(target, true);
    if (index === this.target) return;
    this.target = index;
    this.distance.fill(-1);
    if (index < 0) return;
    const queue = [index];
    this.distance[index] = 0;
    for (let head = 0; head < queue.length; head++)
      for (const next of this.links[queue[head]]) {
        if (this.distance[next] >= 0) continue;
        this.distance[next] = this.distance[queue[head]] + 1;
        queue.push(next);
      }
  }
  waypoint(from: Point, target: Point): Point | undefined {
    if (this.clearPath(from, target)) return target;
    let index = this.nearest(from);
    if (index < 0 || this.distance[index] < 0) return undefined;
    let best = this.point(index);
    for (let step = 0; step < 8; step++) {
      const next = this.links[index].find(
        candidate => this.distance[candidate] >= 0 && this.distance[candidate] < this.distance[index],
      );
      if (next === undefined) break;
      const point = this.point(next);
      if (!this.clearPath(from, point)) break;
      best = point;
      index = next;
    }
    return best;
  }
}
