import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { WARRIOR } from '../src/content/classes/warrior.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import {
  COURT_GUARDS,
  COURT_REINFORCEMENTS,
  HALL_GUARDS,
  STONE_HEART_ARCH,
  STONE_HEART_BEACON,
  STONE_HEART_BOUNDS,
  STONE_HEART_LAYOUT,
  STONE_HEART_SOLIDS,
} from '../src/content/stone-heart.ts';
import { Navigation, clearPath } from '../src/domain/navigation.ts';
import { overlaps, stepMovement } from '../src/domain/movement.ts';
import { Run } from '../src/domain/run.ts';
import { ThirdPersonCamera } from '../src/rendering/camera.ts';
import { safeCameraDistance } from '../src/rendering/collision.ts';
import { createStoneHeartWorld } from '../src/rendering/stone-heart-world.ts';
import { createStoneHeartPilot, stoneHeartChoice } from './support/stone-heart-pilot.ts';

const step = 1 / 60;

test('the interior camera respects the arch and pillar volumes and the rastrillo can reopen and reset', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createStoneHeartWorld(
    {
      materials: {
        castle_wall_slates: material,
        brown_mud_02: material,
        cobblestone_floor_04: material,
        weathered_brown_planks: material,
      },
      failures: [],
      dispose: () => material.dispose(),
    },
    WARRIOR,
  );
  try {
    const from = { x: 0, y: 1.4, z: -5 };
    const forward = { x: 0, y: 0, z: -1 };
    assert.ok(safeCameraDistance(from, forward, 12, 0.22, world.obstacles) < 2);
    world.setMission(true, false, false, 1);
    assert.equal(safeCameraDistance(from, forward, 12, 0.22, world.obstacles), 12);
    const camera = new ThirdPersonCamera();
    const points = [
      [0, 29],
      [0, 12],
      [-23, 12.6],
      [-28, 12.6],
      [0, -9],
      [0, -16.3],
      [7.1, -25],
      [0, -35],
    ];
    let shortened = 0;
    for (const [x, z] of points) {
      for (const distance of [4, 12, 18]) {
        camera.setDistance(distance);
        for (let angle = 0; angle < 12; angle++) {
          camera.reset((angle * Math.PI) / 6);
          camera.update(new THREE.Vector3(x, 0, z), world.obstacles, step);
          const eye = camera.camera.position;
          shortened += Number(camera.obstructed);
          assert.ok(eye.y > 0 && camera.distance >= 0 && camera.distance <= distance);
          assert.ok(
            !world.obstacles.some(
              box =>
                eye.x > box.min.x &&
                eye.x < box.max.x &&
                eye.y > box.min.y &&
                eye.y < box.max.y &&
                eye.z > box.min.z &&
                eye.z < box.max.z,
            ),
          );
        }
      }
    }
    assert.ok(shortened > 0);
    world.setMission(false, false, false, 0);
    assert.ok(safeCameraDistance(from, forward, 12, 0.22, world.obstacles) < 2);
  } finally {
    world.dispose();
    material.dispose();
  }
});

test('interior starts behind its own portón and the closed rastrillo isolates the hall', () => {
  const run = new Run(STONE_HEART_BOUNDS, STONE_HEART_SOLIDS, 19, 'warrior', undefined, STONE_HEART_LAYOUT);
  const mission = run.stoneHeart!;
  const start = { ...run.layout.start };
  const nav = new Navigation(run.bounds, run.movementSolids, run.definition.movement.radius);
  nav.update(start);
  assert.equal(nav.waypoint(STONE_HEART_ARCH, start), undefined);
  assert.equal(clearPath({ x: 0, z: -5 }, { x: 0, z: -9 }, run.movementSolids, 0.4), false);
  assert.equal(mission.gateOpen, false);
  for (let i = 0; i < 250; i++) run.step(step, start, undefined, 'beacon');
  assert.equal(run.combat.status, 'running');
  assert.equal(run.combat.enemies.length, 0);
  assert.equal(run.focus(STONE_HEART_BEACON), undefined);
  assert.deepEqual(
    run.exploration.objects.map(object => object.kind),
    STONE_HEART_LAYOUT.objects.map(object => object.kind),
  );
});

for (const classId of ['warrior', 'mage', 'archer'] as const) {
  test(`El corazón de piedra can be cleared at normal health with ${classId}`, () => {
    const run = new Run(STONE_HEART_BOUNDS, STONE_HEART_SOLIDS, 19, classId, 'fire', STONE_HEART_LAYOUT);
    const mission = run.stoneHeart!;
    const hero = { ...run.layout.start };
    // The detour is available throughout the run; the Archer verifies it is optional.
    const armory = classId !== 'archer';
    const pilot = createStoneHeartPilot(run, armory);
    const visited = new Set<string>();
    const deaths = new Set<number>();
    let peak = 0;
    for (let frame = 0; frame < 60 * 200 && run.combat.status === 'running'; frame++) {
      visited.add(mission.phase);
      if (run.progression.pending) {
        const choice = run.progression.choice()!;
        const option = stoneHeartChoice(choice.options);
        assert.ok(option ? run.choose(choice.id, option) : run.fallback(choice.id));
        continue;
      }
      const input = pilot.act(hero, 0);
      stepMovement(
        hero,
        input,
        0,
        step,
        { ...run.definition.movement, speed: run.progression.speed },
        run.bounds,
        run.movementSolids,
      );
      for (const event of run.step(step, hero, undefined, input.interaction)) {
        if (event.type === 'death') {
          assert.ok(!deaths.has(event.target));
          deaths.add(event.target);
        }
      }
      const living = run.combat.enemies.filter(enemy => !enemy.dead);
      peak = Math.max(peak, living.length);
      for (const enemy of living)
        assert.ok(!STONE_HEART_SOLIDS.some(box => overlaps(enemy, ENEMIES[enemy.kind].radius, box)));
      if (mission.phase === 'signal') assert.equal(run.combat.status, 'running');
    }
    assert.equal(run.combat.status, 'victory', JSON.stringify({ phase: mission.phase, hp: run.combat.hp, hero }));
    assert.equal(mission.phase, 'complete');
    assert.deepEqual(
      [...visited],
      ['entry', 'courtyard', 'reinforcements', 'passage', 'hall', 'captain', 'signal', 'complete'],
    );
    assert.equal(run.combat.kills, COURT_GUARDS.length + COURT_REINFORCEMENTS.length + HALL_GUARDS.length + 1);
    assert.equal(peak, COURT_GUARDS.length);
    assert.equal(run.exploration.chestsOpened, Number(armory));
    assert.equal(run.bossSpawned, false);
    assert.ok(run.combat.hp > 0);
    console.log(
      `Interior ${classId}: ${run.combat.time.toFixed(1)} s · ${Math.ceil(run.combat.hp)} vida · ${peak} vivos · ${run.exploration.chestsOpened} cofre`,
    );
  });
}
