import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { PLAY_AREA, VIEWS } from '../src/content/config.ts';
import { EXPEDITION } from '../src/content/expedition.ts';
import { LANDMARKS, regionAt } from '../src/content/map.ts';
import { classDefinition } from '../src/content/classes.ts';
import { Run } from '../src/domain/run.ts';
import { Navigation } from '../src/domain/navigation.ts';
import { overlaps, moveCircle } from '../src/domain/movement.ts';
import { ThirdPersonCamera } from '../src/rendering/camera.ts';

for (const cls of ['warrior', 'mage', 'archer'] as const)
  test(`${cls}: south arrival, rewards, expanded ground and reinforcement ring are usable`, () => {
    const mat = new THREE.MeshStandardMaterial(),
      definition = classDefinition(cls);
    const world = createWorld(
      {
        materials: {
          castle_wall_slates: mat,
          cobblestone_floor_04: mat,
          brown_mud_02: mat,
          weathered_brown_planks: mat,
        },
        failures: [],
        dispose() {},
      },
      definition,
    );
    const start = EXPEDITION.start,
      radius = definition.movement.radius;
    const nav = new Navigation(PLAY_AREA, world.movementSolids, radius);
    nav.update(start);
    world.scene.updateMatrixWorld(true);
    try {
      assert.equal(
        world.movementSolids.some(s => overlaps(start, radius, s)),
        false,
      );
      assert.equal(regionAt(start), EXPEDITION.arrivalName);
      assert.deepEqual(VIEWS[0].position, [start.x, 0, start.z]);
      for (const target of LANDMARKS) assert.ok(nav.waypoint(target, start), target.name);
      for (const seed of [1, 19, 9173]) {
        const run = new Run(PLAY_AREA, world.movementSolids, seed, cls, 'fire');
        assert.equal(run.exploration.objects.length, 33, 'No extra rewards for the larger map');
        for (const enemy of run.combat.enemies) {
          assert.ok(Math.hypot(enemy.x - start.x, enemy.z - start.z) > 6);
          assert.ok(Math.hypot(enemy.x - start.x, enemy.z - start.z) < 17);
          assert.equal(
            world.movementSolids.some(s => overlaps(enemy, enemy.radius, s)),
            false,
          );
          assert.ok(nav.waypoint(enemy, start));
        }
        for (const item of run.exploration.objects) assert.ok(nav.waypoint(item, start), item.kind);
        for (const item of run.exploration.objects.slice(0, 3))
          assert.ok(Math.hypot(item.x - start.x, item.z - start.z) < 13);
        assert.ok(
          Math.hypot(run.capture.point!.x - start.x, run.capture.point!.z - start.z) > 80,
          'Capture does not trigger at arrival',
        );
        for (const point of [
          start,
          { x: -135, z: 235 },
          { x: 139, z: 235 },
          { x: 20, z: 236 },
          { x: -135, z: 40 },
          { x: 139, z: 40 },
        ]) {
          assert.equal(
            world.movementSolids.some(s => overlaps(point, radius, s)),
            false,
          );
          assert.ok(nav.waypoint(point, start));
          const ground = new THREE.Raycaster(
            new THREE.Vector3(point.x, 10, point.z),
            new THREE.Vector3(0, -1, 0),
            0,
            11,
          ).intersectObjects(world.scene.children, false);
          assert.ok(
            ground.some(hit => Math.abs(hit.point.y + 0.035) < 0.001),
            'New strips have rendered ground beneath their walkable surface',
          );
          const spawns = run.reinforcementPositions(point, 8);
          assert.equal(spawns.length, 8);
          for (const spawn of spawns) {
            assert.equal(
              world.movementSolids.some(s => overlaps(spawn, radius, s)),
              false,
            );
            assert.ok(nav.waypoint(spawn, start));
          }
          const moved = moveCircle(point, { x: 0, z: 500 }, radius, PLAY_AREA, world.movementSolids);
          assert.ok(moved.z <= PLAY_AREA.maxZ - radius);
        }
      }
      const camera = new ThirdPersonCamera();
      camera.resize(1440, 900);
      camera.reset(start.yaw);
      for (let i = 0; i < 60; i++) camera.update(new THREE.Vector3(start.x, 0, start.z), world.obstacles, 1 / 60);
      assert.equal(camera.obstructed, false);
      assert.ok(Math.abs(camera.distance - 12) < 0.01);
    } finally {
      world.dispose();
      mat.dispose();
    }
  });
