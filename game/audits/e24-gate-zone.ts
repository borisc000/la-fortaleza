// E2.4 audit of the gate zone: camera clearance and horde behaviour around the gate, explanada and siege remains.
// Usage, from `game`: node --experimental-strip-types audits/e24-gate-zone.ts [world module] [label]
// The optional module lets the same audit run against an earlier world (for example a copy of the E1 version).
import * as THREE from 'three';
import { ThirdPersonCamera } from '../src/rendering/camera.ts';
import { Combat } from '../src/domain/combat.ts';
import { overlaps } from '../src/domain/movement.ts';
import { PLAY_AREA, PLAYER, SIMULATION_STEP } from '../src/content/config.ts';
import { SOLDIER } from '../src/content/combat.ts';
import type { createWorld as CreateWorld } from '../src/rendering/world.ts';

const modulePath = process.argv[2] ?? '../src/rendering/world.ts',
  label = process.argv[3] ?? 'actual';
const { createWorld } = (await import(modulePath)) as { createWorld: typeof CreateWorld };
const material = new THREE.MeshStandardMaterial();
const world = createWorld({
  materials: {
    castle_wall_slates: material,
    cobblestone_floor_04: material,
    brown_mud_02: material,
    weathered_brown_planks: material,
  },
  failures: [],
  dispose() {},
});
const blocked = (p: { x: number; z: number }, radius: number) => world.movementSolids.some(s => overlaps(p, radius, s));
const round = (v: number) => Math.round(v * 100) / 100;
const quantile = (values: number[], q: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
};

// Camera: every free 2 m cell from the west flank to the east tower and from the wall foot to 22 m south,
// sixteen headings each, default distance and pitch.
const camera = new ThirdPersonCamera();
camera.resize(1440, 900);
const distances: number[] = [];
let cells = 0,
  obstructed = 0;
const worst: Array<{ x: number; z: number; yaw: number; distance: number }> = [];
for (let x = -30; x <= 38; x += 2)
  for (let z = -16; z <= 22; z += 2) {
    if (blocked({ x, z }, PLAYER.radius)) continue;
    cells++;
    for (let i = 0; i < 16; i++) {
      const yaw = (i / 16) * Math.PI * 2;
      camera.reset(yaw);
      camera.update(new THREE.Vector3(x, 0, z), world.obstacles, 1 / 60);
      distances.push(camera.distance);
      if (camera.obstructed) obstructed++;
      worst.push({ x, z, yaw: round(yaw), distance: round(camera.distance) });
    }
  }
worst.sort((a, b) => a.distance - b.distance);

// Hordes: sixty soldiers in a ring 12–22 m around a still hero; nobody dies, so the test isolates movement.
function horde(name: string, x: number, z: number) {
  const ring: { x: number; z: number }[] = [];
  for (let i = 0; ring.length < 60 && i < 400; i++) {
    const a = i * 2.39996,
      r = 12 + ((i * 7) % 11);
    const p = { x: x + Math.cos(a) * r, z: z + Math.sin(a) * r };
    if (
      p.x > PLAY_AREA.minX + 1 &&
      p.x < PLAY_AREA.maxX - 1 &&
      p.z > PLAY_AREA.minZ + 1 &&
      p.z < PLAY_AREA.maxZ - 1 &&
      !blocked(p, SOLDIER.radius) &&
      ring.every(q => Math.hypot(q.x - p.x, q.z - p.z) > 1.2)
    )
      ring.push(p);
  }
  const combat = new Combat(PLAY_AREA, world.movementSolids, ring);
  combat.cooldown = 1e9;
  combat.hp = combat.maxHp = 1e9;
  for (const e of combat.enemies) e.hp = e.maxHp = 1e9;
  const hero = { x, z, yaw: 0 };
  const within = (d: number) => combat.enemies.filter(e => Math.hypot(e.x - x, e.z - z) < d).length;
  let violations = 0,
    half: number | undefined,
    mark: Map<number, { x: number; z: number }> | undefined;
  const steps = Math.round(25 / SIMULATION_STEP);
  for (let tick = 1; tick <= steps; tick++) {
    combat.step(SIMULATION_STEP, hero);
    if (tick % 30 === 0) for (const e of combat.enemies) if (!e.dead && blocked(e, e.radius - 0.02)) violations++;
    if (half === undefined && within(6) >= ring.length / 2) half = round(tick * SIMULATION_STEP);
    if (tick === Math.round(15 / SIMULATION_STEP)) mark = new Map(combat.enemies.map(e => [e.id, { x: e.x, z: e.z }]));
  }
  const stuck = combat.enemies.filter(e => {
    const before = mark?.get(e.id);
    return before && Math.hypot(e.x - before.x, e.z - before.z) < 0.3 && Math.hypot(e.x - x, e.z - z) > 6;
  });
  return {
    name,
    hero: { x, z },
    soldiers: ring.length,
    secondsToHalfWithin6m: half ?? null,
    within4m: within(4),
    within6m: within(6),
    within10m: within(10),
    stuckFarAway: stuck.length,
    stuckAt: stuck.slice(0, 6).map(e => ({ x: round(e.x), z: round(e.z) })),
    solidOverlapSamples: violations,
    status: combat.status,
  };
}

const result = {
  world: label,
  obstacles: world.obstacles.length,
  movementSolids: world.movementSolids.length,
  camera: {
    cells,
    samples: distances.length,
    min: round(Math.min(...distances)),
    p5: round(quantile(distances, 0.05)),
    median: round(quantile(distances, 0.5)),
    under6m: round(distances.filter(d => d < 6).length / distances.length),
    obstructed: round(obstructed / distances.length),
    worst: worst.slice(0, 5),
  },
  hordes: [
    horde('explanada', 4, -8),
    horde('boca de la puerta', 4, -15.6),
    horde('flanco este, junto al ariete', 15.5, -12.5),
    horde('flanco oeste, junto a la escala', -16, -12.5),
  ],
};
console.log(JSON.stringify(result, null, 2));
world.dispose();
