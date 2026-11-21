import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SpatialBuckets } from '../src/domain/spatial-buckets.ts';
import { Run } from '../src/domain/run.ts';
import { Combat } from '../src/domain/combat.ts';
import { CAMPAIGN, WAVES, LOCAL_HORDE, incursionSchedule } from '../src/content/campaign.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { createHordeView } from '../src/rendering/horde.ts';
import { createWorld } from '../src/rendering/world.ts';
import { PLAY_AREA } from '../src/content/config.ts';
const bounds = { minX: -35, maxX: 35, minZ: -35, maxZ: 35 },
  hero = { x: 0, z: 0, yaw: 0 };

test('spatial broad phase never drops exact neighbors, including moving across negative cells', () => {
  const items = Array.from({ length: 100 }, (_, id) => ({
    id,
    x: (id % 10) * 0.7 - 3.6,
    z: Math.floor(id / 10) * 0.7 - 3.6,
  }));
  const grid = new SpatialBuckets<(typeof items)[number]>();
  grid.rebuild(items);
  for (let pass = 0; pass < 3; pass++)
    for (const item of items) {
      item.x += 0.39;
      item.z -= 0.67;
      grid.update(item);
      const actual = grid
        .near(item, 1.5)
        .filter(p => Math.hypot(p.x - item.x, p.z - item.z) <= 1.5)
        .map(p => p.id);
      const expected = items.filter(p => Math.hypot(p.x - item.x, p.z - item.z) <= 1.5).map(p => p.id);
      assert.deepEqual(actual, expected);
    }
});

test('each stage fills its local target with a weak majority, bounded threats and no backlog', () => {
  const seed = 17;
  const incursions = incursionSchedule(seed);
  for (const stage of WAVES) {
    const run = new Run(bounds, [], seed, undefined, undefined, TRAINING_EXPEDITION);
    run.combat.retireNormals();
    run.eliteSpawned = true;
    run.combat.heroKit.cancel();
    run.combat.hp = 100000;
    for (let time = stage.at + 3; time < stage.at + 45; time += 3) {
      // Incursions have their own squad and temporarily change the wave mix.
      if (incursions.some(event => time >= event.at && time < event.at + event.duration)) continue;
      run.combat.time = time;
      run.step(1 / 60, hero);
      for (const enemy of run.combat.enemies) if (!enemy.dead) enemy.spawnRemaining = 999;
    }
    const alive = run.combat.enemies.filter(e => !e.dead);
    assert.equal(alive.length, stage.localTarget);
    assert.ok(alive.filter(e => e.kind === 'thrall').length >= alive.length * 0.65);
    assert.ok(alive.filter(e => e.kind === 'archer').length <= Math.floor(stage.localTarget * 0.08));
    assert.ok(alive.filter(e => e.kind === 'charger').length <= Math.floor(stage.localTarget * 0.06));
    for (const e of alive) assert.ok(Math.hypot(e.x, e.z) >= LOCAL_HORDE.minDistance - 0.01);
    const count = run.totalSpawned;
    run.step(0, hero);
    assert.equal(run.totalSpawned, count);
  }
});

test('weak pursuers die to one base sword hit and award exactly one death; retirement awards none', () => {
  const c = new Combat(bounds, [], [], false);
  c.addEnemies([{ x: 0, z: -1 }], 0, 'thrall');
  c.enemies[0].cooldown = 999;
  c.whirlwindCooldown = 999;
  const deaths = [];
  for (let i = 0; i < 120; i++) {
    c.step(1 / 60, hero);
    deaths.push(...c.takeEvents().filter(e => e.type === 'death'));
  }
  assert.equal(deaths.length, 1);
  assert.equal(deaths[0].reward, ENEMIES.thrall.essence);
  assert.equal(c.kills, 1);
  c.addEnemies([{ x: 0, z: -8 }], 0, 'thrall');
  c.retireNormals();
  c.step(1 / 60, hero);
  assert.equal(c.takeEvents().filter(e => e.type === 'death').length, 0);
});

test('one hundred weak bodies and warnings use three shared meshes and reset without stale instances', () => {
  const c = new Combat(bounds, [], [], false);
  c.addEnemies(
    Array.from({ length: 100 }, (_, i) => ({ x: i % 10, z: Math.floor(i / 10) })),
    1,
    'thrall',
  );
  const root = new THREE.Group(),
    view = createHordeView(root);
  view.update(c.enemies, 1, 0);
  assert.equal(root.children.length, 3);
  assert.equal((root.children[0] as THREE.InstancedMesh).count, 100);
  assert.equal((root.children[2] as THREE.InstancedMesh).count, 100);
  c.enemies[0].dead = true;
  view.update(c.enemies, 1, 0);
  assert.equal((root.children[0] as THREE.InstancedMesh).count, 99);
  view.reset();
  for (const child of root.children) assert.equal((child as THREE.InstancedMesh).count, 0);
  view.dispose();
  assert.equal(root.children.length, 0);
});

test('real-map CPU load samples at 20, 60 and 100 actors remain finite and within collision bounds', () => {
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
  try {
    for (const count of [20, 60, CAMPAIGN.maxEnemies]) {
      const c = new Combat(PLAY_AREA, world.movementSolids, [], false),
        body = { x: 0, z: 7, yaw: 0 };
      c.addEnemies(
        Array.from({ length: count }, (_, i) => ({
          x: Math.sin(i * 2.4) * (5 + (i % 4)),
          z: 7 + Math.cos(i * 2.4) * (5 + (i % 4)),
        })),
        0,
        'thrall',
      );
      c.hp = 100000;
      c.heroKit.cancel();
      c.cooldown = c.whirlwindCooldown = 9999;
      const timings: number[] = [];
      for (let i = 0; i < 600; i++) {
        const start = performance.now();
        c.step(1 / 60, body);
        c.takeEvents();
        if (i >= 60) timings.push(performance.now() - start);
      }
      timings.sort((a, b) => a - b);
      console.log(
        JSON.stringify({
          actors: count,
          cpuMedianMs: timings[Math.floor(timings.length / 2)],
          cpuP95Ms: timings[Math.floor(timings.length * 0.95)],
          cpuMaxMs: timings.at(-1),
          gpuMeasured: false,
        }),
      );
      assert.equal(c.enemies.filter(e => !e.dead).length, count);
      for (const e of c.enemies)
        assert.ok(
          Number.isFinite(e.x + e.z) &&
            e.x >= PLAY_AREA.minX &&
            e.x <= PLAY_AREA.maxX &&
            e.z >= PLAY_AREA.minZ &&
            e.z <= PLAY_AREA.maxZ,
        );
    }
  } finally {
    world.dispose();
    material.dispose();
  }
});
