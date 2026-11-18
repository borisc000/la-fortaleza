import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { ROUTES, SECTORS, sectorAt } from '../src/content/terrain-layout.ts';
import { EXPEDITION } from '../src/content/expedition.ts';
import { PLAY_AREA, PLAYER } from '../src/content/config.ts';
import { overlaps, stepMovement } from '../src/domain/movement.ts';
import { Navigation } from '../src/domain/navigation.ts';
import { LANDMARKS } from '../src/content/map.ts';

test('all six sectors have spatial territories and the route network joins the arrival and fifteen landmarks', () => {
  for (const sector of SECTORS) assert.equal(sectorAt(sector.center).id, sector.id);
  const mat = new THREE.MeshStandardMaterial();
  const world = createWorld({ materials: { castle_wall_slates: mat, cobblestone_floor_04: mat, brown_mud_02: mat, weathered_brown_planks: mat }, failures: [], dispose() {} });
  const nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius); nav.update(EXPEDITION.start);
  try {
    for (const place of LANDMARKS) assert.ok(nav.waypoint(place, EXPEDITION.start), place.name);
    let samples = 0;
    for (const route of ROUTES) {
      const body = { ...route.points[0], yaw: 0 }; let elapsed = 0;
      for (let i = 1; i < route.points.length; i++) {
        const a = route.points[i - 1], b = route.points[i], dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz);
        for (let step = 0; step <= Math.ceil(length); step++) for (const lane of [-1, 0, 1]) {
          const t = step / Math.ceil(length), offset = lane * (route.width / 2 - .6);
          const p = { x: a.x + dx * t + dz / length * offset, z: a.z + dz * t - dx / length * offset };
          assert.equal(world.movementSolids.some(s => overlaps(p, PLAYER.radius, s)), false, `${route.id}: lane ${lane} at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
          samples++;
        }
        let ticks = 0;
        while (Math.hypot(body.x - b.x, body.z - b.z) > .15 && ticks++ < 1200) {
          stepMovement(body, { right: 0, forward: 1 }, Math.atan2(body.x - b.x, body.z - b.z), .05, PLAYER, PLAY_AREA, world.movementSolids);
          elapsed += .05;
        }
        assert.ok(ticks < 1200, `Blocked physical route ${route.id}`);
      }
      console.log(`Ruta ${route.id}: ${elapsed.toFixed(2)} s a 5 m/s, sin combate.`);
    }
    console.log(`${samples} muestras de centro y laterales libres en siete rutas.`);
  } finally { world.dispose(); mat.dispose(); }
});
