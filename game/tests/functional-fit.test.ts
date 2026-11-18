import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { Exploration } from '../src/domain/exploration.ts';
import { Run } from '../src/domain/run.ts';
import { clearPath } from '../src/domain/navigation.ts';
import { overlaps } from '../src/domain/movement.ts';
import { PLAY_AREA, PLAYER } from '../src/content/config.ts';
import { EXPEDITION, OPENING_GUARD_OFFSETS } from '../src/content/expedition.ts';
import { OBJECT_FOOTPRINT } from '../src/content/exploration.ts';
import { CAPTURE } from '../src/content/activities.ts';
import { ROUTES, routeClearance } from '../src/content/terrain-layout.ts';
import { LANDMARKS } from '../src/content/map.ts';

const mat = new THREE.MeshStandardMaterial();
const world = createWorld({ materials: { castle_wall_slates: mat, cobblestone_floor_04: mat, brown_mud_02: mat, weathered_brown_planks: mat }, failures: [], dispose() {} });
after(() => { world.dispose(); mat.dispose(); });

for (const seed of [1, 2, 7, 19, 43, 77, 256, 9173]) test(`seed ${seed}: roadside rewards remain discoverable and approachable`, () => {
  const exploration = new Exploration(PLAY_AREA, world.movementSolids, seed);
  assert.equal(exploration.objects.length, 33);
  const props = exploration.objects.filter(o => ['chest', 'fountain', 'shop'].includes(o.kind));
  const capture = exploration.objects.find(o => o.kind === 'capture')!;
  for (const prop of props) {
    assert.ok(routeClearance(prop) >= OBJECT_FOOTPRINT[prop.kind] + .8, `${prop.region}: road encroachment`);
    assert.ok(Math.hypot(prop.x - capture.x, prop.z - capture.z) > CAPTURE.radius + OBJECT_FOOTPRINT[prop.kind], 'Capture arena stays clear');
    for (const offset of OPENING_GUARD_OFFSETS) assert.ok(Math.hypot(prop.x - EXPEDITION.start.x - offset.x, prop.z - EXPEDITION.start.z - offset.z) > OBJECT_FOOTPRINT[prop.kind] + .36);
    const sides = Array.from({ length: 8 }, (_, i) => ({ x: prop.x + Math.sin(i * Math.PI / 4) * 2, z: prop.z + Math.cos(i * Math.PI / 4) * 2 }));
    const usable = sides.filter(p => !world.movementSolids.some(s => overlaps(p, PLAYER.radius, s)) && clearPath(p, prop, world.movementSolids, PLAYER.radius));
    assert.ok(usable.length >= 4, `${prop.region}: too few approach directions`);
    assert.ok(usable.some(p => exploration.focus(p)?.id === prop.id), `${prop.region}: cannot focus from approach`);
  }
  const health = { hp: 100, maxHp: 100, heal() {} };
  for (const route of ROUTES) for (const point of route.points) exploration.step(.05, point, health);
  for (const prop of [...props, capture]) assert.ok(prop.discovered, `${prop.region}: not discoverable from routes`);
});

test('local reinforcement rings remain populated at all landmarks and activities for normal, elite and boss sizes', () => {
  const run = new Run(PLAY_AREA, world.movementSolids, 19);
  const points = [...LANDMARKS, EXPEDITION.start, ...run.exploration.objects.filter(o => o.kind === 'shop' || o.kind === 'capture')];
  for (const point of points) for (const radius of [.36, .48, .65]) {
    const positions = run.reinforcementPositions(point, 12, radius);
    assert.equal(positions.length, 12, `Insufficient spawn capacity at ${point.x},${point.z}`);
    for (const p of positions) for (const prop of run.exploration.objects) {
      if (!OBJECT_FOOTPRINT[prop.kind]) continue;
      assert.ok(Math.hypot(p.x - prop.x, p.z - prop.z) >= OBJECT_FOOTPRINT[prop.kind] + radius + .35);
    }
  }
});

test('director rejects a previously valid spawn when a persistent prop occupies it', () => {
  const first = new Run(PLAY_AREA, world.movementSolids, 19);
  const candidate = first.reinforcementPositions(EXPEDITION.start, 1)[0];
  const guarded = new Run(PLAY_AREA, world.movementSolids, 19);
  guarded.exploration.objects.push({ ...candidate, id: 1000, kind: 'chest', status: 'used', discovered: true, amount: 0, uses: 0, region: 'Regression fixture' });
  const positions = guarded.reinforcementPositions(EXPEDITION.start, 12);
  assert.equal(positions.length, 12);
  for (const p of positions) assert.ok(Math.hypot(p.x - candidate.x, p.z - candidate.z) >= .75 + .36 + .35);
});

test('capture ground, loot and supplies do not suppress the horde; the flag and used props do', () => {
  const exploration = new Exploration(PLAY_AREA, [], 19);
  const capture = exploration.objects.find(o => o.kind === 'capture')!;
  exploration.objects.splice(0, exploration.objects.length, capture);
  assert.equal(exploration.allowsSpawn(capture, .36), false);
  assert.equal(exploration.allowsSpawn({ x: capture.x + 3, z: capture.z }, .36), true);
  for (const kind of ['coins', 'supply', 'chest', 'fountain', 'shop'] as const) {
    exploration.objects.splice(0, exploration.objects.length, { x: 0, z: 0, id: 99, kind, status: 'used', discovered: true, amount: 0, uses: 0, region: '' });
    assert.equal(exploration.allowsSpawn({ x: 0, z: 0 }, .65), kind === 'coins' || kind === 'supply');
  }
});
