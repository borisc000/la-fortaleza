import type { Point } from './movement.ts';

/** Mutable broad phase; caller still checks exact distances. */
export class SpatialBuckets<T extends Point & { id: number }> {
  private cells = new Map<string, Set<T>>();
  private keys = new Map<number, string>();
  private size: number;
  constructor(size = 2) { this.size = size; }
  private key(p: Point) { return `${Math.floor(p.x / this.size)}:${Math.floor(p.z / this.size)}`; }
  rebuild(items: readonly T[]) { this.cells.clear(); this.keys.clear(); for (const item of items) this.update(item); }
  update(item: T) {
    const key = this.key(item), old = this.keys.get(item.id);
    if (key === old) return;
    if (old !== undefined) { const cell = this.cells.get(old)!; cell.delete(item); if (!cell.size) this.cells.delete(old); }
    let cell = this.cells.get(key); if (!cell) { cell = new Set(); this.cells.set(key, cell); }
    cell.add(item); this.keys.set(item.id, key);
  }
  near(p: Point, radius: number): T[] {
    const result: T[] = [];
    for (let x = Math.floor((p.x - radius) / this.size); x <= Math.floor((p.x + radius) / this.size); x++)
      for (let z = Math.floor((p.z - radius) / this.size); z <= Math.floor((p.z + radius) / this.size); z++)
        for (const item of this.cells.get(`${x}:${z}`) ?? []) result.push(item);
    return result.sort((a, b) => a.id - b.id);
  }
}
