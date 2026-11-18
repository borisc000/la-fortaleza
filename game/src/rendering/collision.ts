export type Vec3 = { x: number; y: number; z: number };
export type Obstacle = { min: Vec3; max: Vec3 };
/** Swept camera volume: expand each static box, intersect the full segment using slabs.
 * Conservative at box corners; it never relies on a single unpadded centre ray. */
export function safeCameraDistance(origin: Vec3, direction: Vec3, desired: number, radius: number, obstacles: readonly Obstacle[]): number {
  let safe = desired;
  for (const box of obstacles) {
    let entry = 0, exit = desired;
    for (const axis of ['x', 'y', 'z'] as const) {
      const lo = box.min[axis] - radius, hi = box.max[axis] + radius;
      const d = direction[axis], p = origin[axis];
      if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) { entry = Infinity; break; } }
      else {
        const a = (lo - p) / d, b = (hi - p) / d;
        entry = Math.max(entry, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));
        if (entry > exit) break;
      }
    }
    if (entry <= exit && exit >= 0) safe = Math.min(safe, Math.max(0, entry - 0.05));
  }
  if (direction.y < 0) safe = Math.min(safe, Math.max(0, (origin.y - radius - 0.05) / -direction.y));
  return safe;
}
export function recoverDistance(current: number, safe: number, dt: number, speed = 7): number {
  return safe < current ? safe : current + (safe - current) * (1 - Math.exp(-speed * Math.max(0, dt)));
}
export function cameraRadius(fov: number, aspect: number, near: number): number {
  const height = Math.tan(fov * Math.PI / 360) * near;
  return Math.max(0.22, Math.hypot(height, height * aspect, near) + 0.08);
}
