import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { ThirdPersonCamera } from '../src/rendering/camera.ts';
import { Exploration } from '../src/domain/exploration.ts';
import { PLAY_AREA, PLAYER } from '../src/content/config.ts';
import { ROUTES, routeClearance } from '../src/content/terrain-layout.ts';
import { LANDMARKS } from '../src/content/map.ts';
import { clearPath } from '../src/domain/navigation.ts';
import { overlaps } from '../src/domain/movement.ts';

const mat = new THREE.MeshStandardMaterial();
const world = createWorld({
  materials: { castle_wall_slates: mat, cobblestone_floor_04: mat, brown_mud_02: mat, weathered_brown_planks: mat },
  failures: [],
  dispose() {},
});
const objects = [1, 19, 77, 9173].map(seed => {
  const exploration = new Exploration(PLAY_AREA, world.movementSolids, seed);
  const interactive = exploration.objects.filter(o => ['chest', 'fountain', 'shop'].includes(o.kind));
  const access = interactive.map(o => ({
    kind: o.kind,
    x: o.x,
    z: o.z,
    usableSides: Array.from({ length: 8 }, (_, i) => ({
      x: o.x + Math.sin((i * Math.PI) / 4) * 2,
      z: o.z + Math.cos((i * Math.PI) / 4) * 2,
    })).filter(
      p =>
        !world.movementSolids.some(s => overlaps(p, PLAYER.radius, s)) &&
        clearPath(p, o, world.movementSolids, PLAYER.radius),
    ).length,
  }));
  return {
    seed,
    count: exploration.objects.length,
    onRoad: interactive.filter(o => routeClearance(o) < 1).map(o => ({ kind: o.kind, x: o.x, z: o.z })),
    access,
  };
});
const camera = new ThirdPersonCamera();
camera.resize(1440, 900);
let min = Infinity,
  retracted = 0,
  samples = 0;
let worst: unknown;
const points = [...LANDMARKS, ...ROUTES.flatMap(r => r.points.filter((_, i) => i % 3 === 0))];
for (const point of points)
  for (const zoom of [4, 12, 18])
    for (let i = 0; i < 16; i++) {
      if (world.movementSolids.some(s => overlaps(point, PLAYER.radius, s))) continue;
      camera.setDistance(zoom);
      camera.reset((i * Math.PI) / 8);
      camera.update(new THREE.Vector3(point.x, 0, point.z), world.obstacles, 1 / 60);
      samples++;
      if (camera.obstructed) retracted++;
      if (camera.distance < min) {
        min = camera.distance;
        worst = { point, zoom, yaw: (i * Math.PI) / 8 };
      }
    }
console.log(
  JSON.stringify(
    {
      objects,
      camera: { samples, retracted, minDistance: min, worst },
      scope: 'actual world; procedural fallback hero; camera collision, not GPU or gameplay balance',
    },
    null,
    2,
  ),
);
world.dispose();
mat.dispose();
