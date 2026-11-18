import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { classDefinition } from '../src/content/classes.ts';
import { stepMovement, overlaps } from '../src/domain/movement.ts';
import { PLAY_AREA, SIMULATION_STEP } from '../src/content/config.ts';
const m = new THREE.MeshStandardMaterial();
const world = createWorld({
  materials: { castle_wall_slates: m, cobblestone_floor_04: m, brown_mud_02: m, weathered_brown_planks: m },
  failures: [],
  dispose() {},
});
const results = [];
try {
  for (const id of ['warrior', 'mage', 'archer'] as const) {
    const movement = classDefinition(id).movement;
    for (const start of [
      { x: -137, z: 239 },
      { x: 141, z: 239 },
      { x: -137, z: -10 },
      { x: 141, z: -10 },
    ]) {
      const body = { ...start, yaw: 0 };
      for (let step = 0; step < 180; step++)
        stepMovement(
          body,
          { right: start.x < 0 ? -1 : 1, forward: start.z > 0 ? -1 : 1 },
          0,
          SIMULATION_STEP,
          movement,
          PLAY_AREA,
          world.movementSolids,
        );
      const expectedX = start.x < 0 ? PLAY_AREA.minX + movement.radius : PLAY_AREA.maxX - movement.radius;
      const expectedZ = start.z < 0 ? PLAY_AREA.minZ + movement.radius : PLAY_AREA.maxZ - movement.radius;
      assert.ok(Math.abs(body.x - expectedX) < 0.001);
      // North is closed by the fortress wall before the numeric map boundary.
      assert.ok(start.z > 0 ? Math.abs(body.z - expectedZ) < 0.001 : body.z < start.z && body.z >= expectedZ);
      const stopped = { ...body };
      assert.ok(!world.movementSolids.some(s => overlaps(body, movement.radius, s)));
      // Turn inward: reaching a limit must not trap the hero there.
      stepMovement(
        body,
        { right: start.x < 0 ? 1 : -1, forward: start.z > 0 ? 1 : -1 },
        0,
        0.1,
        movement,
        PLAY_AREA,
        world.movementSolids,
      );
      assert.ok(Math.abs(body.x - stopped.x) > 0.1 && Math.abs(body.z - stopped.z) > 0.1);
      results.push({ classId: id, start, stopped, returnedToMap: true });
    }
  }
  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
} finally {
  world.dispose();
  m.dispose();
}
