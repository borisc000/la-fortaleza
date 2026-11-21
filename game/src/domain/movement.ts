export type Point = { x: number; z: number };
export type Body = Point & { yaw: number };
export type MoveInput = { right: number; forward: number };
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Solid = { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function worldDirection(input: MoveInput, yaw: number): Point {
  const length = Math.max(1, Math.hypot(input.right, input.forward));
  const right = input.right / length,
    forward = input.forward / length;
  return { x: right * Math.cos(yaw) - forward * Math.sin(yaw), z: -right * Math.sin(yaw) - forward * Math.cos(yaw) };
}
export function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
function outsideBox(p: Point, radius: number, box: Solid) {
  return p.x < box.min.x - radius || p.x > box.max.x + radius || p.z < box.min.z - radius || p.z > box.max.z + radius;
}
export function overlaps(position: Point, radius: number, box: Solid): boolean {
  if (outsideBox(position, radius, box)) return false;
  const x = clamp(position.x, box.min.x, box.max.x),
    z = clamp(position.z, box.min.z, box.max.z);
  return Math.hypot(position.x - x, position.z - z) < radius - 1e-7;
}

/** Circle against static boxes in XZ. Short substeps prevent tunnelling through thin
 * geometry; iterative contact normals preserve tangential movement along walls. */
export function moveCircle(
  start: Point,
  delta: Point,
  radius: number,
  bounds: Bounds,
  solids: readonly Solid[],
): Point {
  let position = { ...start };
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / (radius * 0.25)));
  for (let step = 0; step < steps; step++) {
    const next = { x: position.x + delta.x / steps, z: position.z + delta.z / steps };
    for (let iteration = 0; iteration < 8; iteration++) {
      next.x = clamp(next.x, bounds.minX + radius, bounds.maxX - radius);
      next.z = clamp(next.z, bounds.minZ + radius, bounds.maxZ - radius);
      let corrected = false;
      for (const box of solids) {
        if (outsideBox(next, radius, box)) continue;
        const x = clamp(next.x, box.min.x, box.max.x),
          z = clamp(next.z, box.min.z, box.max.z);
        const dx = next.x - x,
          dz = next.z - z,
          distance = Math.hypot(dx, dz);
        if (distance >= radius) continue;
        if (distance > 1e-8) {
          const push = radius - distance + 1e-6;
          next.x += (dx / distance) * push;
          next.z += (dz / distance) * push;
        } else {
          // Also handles a body starting inside a box, e.g. after an edited spawn.
          const exits = [next.x - box.min.x, box.max.x - next.x, next.z - box.min.z, box.max.z - next.z];
          const face = exits.indexOf(Math.min(...exits));
          if (face === 0) next.x = box.min.x - radius - 1e-6;
          else if (face === 1) next.x = box.max.x + radius + 1e-6;
          else if (face === 2) next.z = box.min.z - radius - 1e-6;
          else next.z = box.max.z + radius + 1e-6;
        }
        corrected = true;
      }
      if (!corrected) break;
    }
    const inside =
      next.x >= bounds.minX + radius - 1e-7 &&
      next.x <= bounds.maxX - radius + 1e-7 &&
      next.z >= bounds.minZ + radius - 1e-7 &&
      next.z <= bounds.maxZ - radius + 1e-7;
    if (inside && !solids.some(box => overlaps(next, radius, box))) position = next;
  }
  return position;
}

export function stepMovement(
  body: Body,
  input: MoveInput,
  cameraYaw: number,
  dt: number,
  settings: { speed: number; radius: number; turnSpeed: number },
  bounds: Bounds,
  solids: readonly Solid[],
): number {
  const direction = worldDirection(input, cameraYaw);
  const next = moveCircle(
    body,
    { x: direction.x * settings.speed * dt, z: direction.z * settings.speed * dt },
    settings.radius,
    bounds,
    solids,
  );
  const dx = next.x - body.x,
    dz = next.z - body.z,
    distance = Math.hypot(dx, dz);
  body.x = next.x;
  body.z = next.z;
  if (distance > 1e-5)
    body.yaw += angleDelta(body.yaw, Math.atan2(-dx, -dz)) * (1 - Math.exp(-settings.turnSpeed * dt));
  return dt > 0 ? distance / dt : 0;
}
