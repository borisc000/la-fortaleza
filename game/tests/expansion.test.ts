import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Run } from '../src/domain/run.ts';
import { Navigation } from '../src/domain/navigation.ts';
import { overlaps, stepMovement } from '../src/domain/movement.ts';
import { PLAY_AREA, PLAYER } from '../src/content/config.ts';
import { LANDMARKS } from '../src/content/map.ts';
import { LOCAL_HORDE, CAMPAIGN } from '../src/content/campaign.ts';
import { SOLDIER } from '../src/content/combat.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { createWorld } from '../src/rendering/world.ts';

const hero = { x: 0, z: 7, yaw: 0 };
const fixture = () => {
  const material = new THREE.MeshStandardMaterial();
  return createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
};

test('offscreen candidates are preferred; visible fallback retains warning and safe distance', () => {
  const run = new Run(PLAY_AREA, [], 9);
  const visible = (p: { x: number; z: number }) => p.z < hero.z;
  const spawns = run.reinforcementPositions(hero, 8, SOLDIER.radius, visible);
  assert.equal(spawns.length, 8);
  assert.ok(spawns.every(p => !visible(p)));
  for (const p of spawns) {
    const d = Math.hypot(p.x - hero.x, p.z - hero.z);
    assert.ok(d >= LOCAL_HORDE.minDistance - 1e-8 && d <= LOCAL_HORDE.maxDistance + 1e-8);
  }
  run.combat.time = 14;
  const before = run.totalSpawned;
  run.step(PLAYER.step, hero, () => true);
  assert.ok(run.totalSpawned > before);
  const newEnemies = run.combat.enemies.slice(5);
  assert.ok(newEnemies.every(e => e.spawnRemaining === CAMPAIGN.spawnWarning));
  assert.equal(run.combat.hp, 100);
});

test('unsafe or disconnected spawn rings are deferred without a later wave backlog', () => {
  const walls = [
    { min: { x: -4, z: -5 }, max: { x: -3, z: 5 } },
    { min: { x: 3, z: -5 }, max: { x: 4, z: 5 } },
    { min: { x: -4, z: -5 }, max: { x: 4, z: -4 } },
    { min: { x: -4, z: 4 }, max: { x: 4, z: 5 } },
  ];
  const run = new Run(PLAY_AREA, walls),
    body = { x: 0, z: 0, yaw: 0 };
  run.combat.retireNormals();
  assert.deepEqual(run.reinforcementPositions(body, 6), []);
  for (let t = 15; t < 40; t++) {
    run.combat.time = t;
    run.step(PLAYER.step, body);
  }
  const before = run.totalSpawned;
  run.combat.time = 42;
  run.step(PLAYER.step, { x: 25, z: 35, yaw: 0 });
  assert.ok(run.totalSpawned > before && run.totalSpawned - before <= run.stage.count);
});

test('only persistently distant unseen normals retire; visibility resets grace and rewards survive', () => {
  const run = new Run(PLAY_AREA, [], 33);
  run.combat.retireNormals();
  run.combat.addEnemies([{ x: -30, z: -8 }], 999, 'soldier');
  run.combat.addEnemies([{ x: -30, z: -10 }], 999, 'elite');
  run.combat.addEnemies([{ x: -30, z: -12 }], 999, 'boss');
  const soldier = run.combat.enemies.find(e => !e.dead && e.kind === 'soldier')!;
  run.progression.drops.push({ id: 500, x: -30, z: -9, value: 8, core: true });
  const far = { x: 40, z: 60, yaw: 0 };
  for (let t = 1; t <= 10; t++) {
    run.combat.time = t;
    run.step(PLAYER.step, far, () => true);
  }
  assert.equal(soldier.dead, false);
  for (let t = 11; t <= 17; t++) {
    run.combat.time = t;
    run.step(PLAYER.step, far, () => false);
  }
  assert.equal(soldier.dead, false);
  run.combat.time = 18;
  run.step(PLAYER.step, far, () => true);
  run.combat.time = 19;
  run.step(PLAYER.step, far, () => false);
  run.progression.gain(4);
  const pausedTime = run.combat.time;
  run.step(30, far);
  assert.equal(run.combat.time, pausedTime);
  assert.equal(soldier.dead, false);
  const choice = run.progression.choice()!;
  run.choose(choice.id, 'fire');
  run.combat.time = 26;
  run.step(PLAYER.step, far);
  assert.equal(soldier.dead, false);
  run.combat.time = 28;
  const events = run.step(PLAYER.step, far);
  assert.equal(soldier.retired, true);
  assert.equal(run.combat.kills, 0);
  assert.equal(
    events.some(e => e.type === 'death'),
    false,
  );
  assert.ok(run.elite);
  assert.ok(run.boss && !run.boss.dead);
  assert.deepEqual(run.progression.drops, [{ id: 500, x: -30, z: -9, value: 8, core: true }]);
});

test('local replenishment follows a relocated player while respecting rests and population', () => {
  const run = new Run(PLAY_AREA, [], 77),
    far = { x: 35, z: 55, yaw: 0 };
  run.combat.time = 6;
  run.step(PLAYER.step, far);
  assert.ok(run.combat.enemies.some(e => !e.dead && Math.hypot(e.x - far.x, e.z - far.z) <= LOCAL_HORDE.maxDistance));
  const after = run.totalSpawned;
  for (let i = 0; i < 120; i++) run.step(PLAYER.step, far);
  assert.equal(run.totalSpawned, after, 'No per-frame refill');
  run.combat.time = CAMPAIGN.restStart;
  run.step(PLAYER.step, hero);
  const rest = run.totalSpawned;
  for (let i = 0; i < 180; i++) run.step(PLAYER.step, hero);
  assert.equal(run.totalSpawned, rest);
  assert.ok(run.combat.enemies.filter(e => !e.dead).length < CAMPAIGN.maxEnemies);
  const fresh = new Run(PLAY_AREA, [], 77);
  fresh.combat.time = 6;
  fresh.step(PLAYER.step, far);
  assert.equal(fresh.totalSpawned, after);
});

test('expanded map has connected activity clearings and safe normal/major spawns at edges', () => {
  const world = fixture(),
    run = new Run(PLAY_AREA, world.movementSolids, 19);
  const nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius);
  nav.update(hero);
  try {
    let free = 0,
      oldFree = 0;
    for (let x = PLAY_AREA.minX + 0.5; x < PLAY_AREA.maxX; x++)
      for (let z = PLAY_AREA.minZ + 0.5; z < PLAY_AREA.maxZ; z++) {
        if (!world.movementSolids.some(s => overlaps({ x, z }, PLAYER.radius, s))) {
          free++;
          if (x >= -23 && x <= 28 && z <= 28) oldFree++;
        }
      }
    assert.ok(free / oldFree >= 3);
    console.log(
      `Superficie libre muestreada: ${free} m²; sector anterior sin su antigua valla: ${oldFree} m²; razón ${(free / oldFree).toFixed(2)}.`,
    );
    for (const landmark of LANDMARKS) {
      for (let dx = -landmark.radius + 1; dx < landmark.radius; dx += 2)
        for (let dz = -landmark.radius + 1; dz < landmark.radius; dz += 2) {
          if (Math.hypot(dx, dz) > landmark.radius - 1) continue;
          const p = { x: landmark.x + dx, z: landmark.z + dz };
          assert.equal(
            world.movementSolids.some(s => overlaps(p, PLAYER.radius, s)),
            false,
            landmark.name,
          );
        }
      assert.ok(nav.waypoint(landmark, hero), landmark.name);
    }
    const points = [
      ...LANDMARKS,
      { x: PLAY_AREA.minX + 2, z: PLAY_AREA.maxZ - 3 },
      { x: PLAY_AREA.maxX - 2, z: PLAY_AREA.maxZ - 3 },
      { x: PLAY_AREA.minX + 2, z: -12 },
      { x: PLAY_AREA.maxX - 2, z: -12 },
    ];
    let checked = 0;
    for (const p of points)
      for (const radius of [SOLDIER.radius, ENEMIES.elite.radius, ENEMIES.boss.radius]) {
        const spawns = run.reinforcementPositions(p, 6, radius, q => q.z < p.z);
        assert.equal(spawns.length, 6, JSON.stringify(p));
        for (const spawn of spawns) {
          assert.equal(
            world.movementSolids.some(s => overlaps(spawn, radius, s)),
            false,
          );
          assert.ok(nav.waypoint(spawn, hero));
          checked++;
        }
      }
    console.log(
      `Expansión: ${checked} apariciones seguras para tres tamaños, ${LANDMARKS.length} destinos y cuatro bordes.`,
    );
    // Physically walk the loop, rather than merely checking connectivity metadata.
    const body = { ...hero };
    let longest = 0;
    for (const target of [
      LANDMARKS[1],
      LANDMARKS[2],
      LANDMARKS[3],
      LANDMARKS[4],
      LANDMARKS[5],
      ...LANDMARKS.slice(6),
      LANDMARKS[0],
    ]) {
      nav.update(target);
      let ticks = 0;
      while (Math.hypot(body.x - target.x, body.z - target.z) > 1 && ticks++ < 4800) {
        const next = nav.waypoint(body, target);
        assert.ok(next);
        stepMovement(
          body,
          { right: 0, forward: 1 },
          Math.atan2(body.x - next.x, body.z - next.z),
          PLAYER.step,
          PLAYER,
          PLAY_AREA,
          world.movementSolids,
        );
        assert.equal(
          world.movementSolids.some(s => overlaps(body, PLAYER.radius, s)),
          false,
        );
      }
      assert.ok(ticks < 4800, `No llega a ${target.name}`);
      longest = Math.max(longest, ticks / 60);
    }
    console.log(
      `Circuito transitable: ${LANDMARKS.length} destinos; tramo máximo ${longest.toFixed(1)} s a velocidad base.`,
    );
  } finally {
    world.dispose();
  }
});
