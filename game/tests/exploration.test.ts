import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Exploration } from '../src/domain/exploration.ts';
import type { WorldObject } from '../src/domain/exploration.ts';
import type { Solid } from '../src/domain/movement.ts';
import { Run } from '../src/domain/run.ts';
import { Navigation } from '../src/domain/navigation.ts';
import { overlaps } from '../src/domain/movement.ts';
import { PLAY_AREA, PLAYER } from '../src/content/config.ts';
import { createWorld } from '../src/rendering/world.ts';
import { createExplorationView } from '../src/rendering/exploration.ts';

const bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 20 }, hero = { x: 0, z: 0, yaw: 0 };
function health(hp = 50) { return { hp, maxHp: 100, heal(amount: number) { if (this.hp > 0) this.hp = Math.min(this.maxHp, this.hp + amount); } }; }
function object(kind: WorldObject['kind'], id = 100, x = 0, z = 0): WorldObject { return { id, x, z, kind, status: 'available', discovered: false, amount: kind === 'chest' ? 12 : kind === 'fountain' ? 35 : kind === 'supply' ? 20 : 3, uses: kind === 'fountain' ? 2 : 1, region: 'Prueba' }; }
function fixture(solids: Solid[] = []) { const e = new Exploration(bounds, solids, 19, undefined, undefined, TRAINING_EXPEDITION); e.objects.length = 0; return e; }
const wall = { min: { x: -.08, y: 0, z: -4 }, max: { x: .08, y: 3, z: 4 } };

test('coins collect once by proximity and supplies wait at full health', () => {
  const e = fixture(), h = health(100); e.objects.push(object('coins'), object('supply', 101));
  e.step(1 / 60, hero, h); assert.equal(e.coins, 3); assert.equal(e.objects.length, 1); assert.equal(h.hp, 100);
  e.step(1 / 60, hero, h); assert.equal(e.coins, 3);
  h.hp = 95; e.step(1 / 60, hero, h); assert.equal(h.hp, 100); assert.equal(e.objects.length, 0);
});

test('walls block automatic collection, discovery and contextual interaction', () => {
  const e = fixture([wall]), h = health(), body = { x: -.5, z: 0 };
  e.objects.push(object('coins', 100, .5), object('supply', 101, .5), object('chest', 102, .5), object('fountain', 103, .5));
  e.step(1 / 60, body, h); assert.equal(e.coins, 0); assert.equal(h.hp, 50); assert.ok(e.objects.every(o => !o.discovered));
  assert.equal(e.focus(body), undefined); assert.equal(e.interact(102, body, h), false); assert.equal(e.interact(103, body, h), false);
  e.step(1 / 60, { x: 1, z: 0 }, h); assert.equal(e.coins, 3); assert.equal(h.hp, 70);
  assert.equal(e.interact(102, { x: 1, z: 0 }, h), true);
});

test('chests are unique rewards; sources preserve charges at full HP and exhaust visibly', () => {
  const e = fixture(), h = health(100), chest = object('chest'), source = object('fountain', 101, 1);
  e.objects.push(chest, source);
  assert.equal(e.interact(chest.id, hero, h), true); assert.equal(e.coins, 12); assert.equal(e.chestsOpened, 1);
  for (let i = 0; i < 10; i++) assert.equal(e.interact(chest.id, hero, h), false);
  assert.equal(chest.status, 'used'); assert.equal(e.interact(source.id, hero, h), false); assert.equal(source.uses, 2);
  h.hp = 10; assert.equal(e.interact(source.id, hero, h), true); assert.equal(h.hp, 45); assert.equal(source.uses, 1);
  assert.equal(e.interact(source.id, hero, h), true); assert.equal(h.hp, 80); assert.equal(source.status, 'used');
  assert.equal(e.interact(source.id, hero, h), false); assert.equal(e.fountainUses, 2); assert.match(e.label(source), /agotada/);
});

test('interaction targeting is deterministic, prefers unused objects and rechecks range', () => {
  const e = fixture(), h = health();
  const a = object('chest', 102, -1), b = object('fountain', 101, 1); e.objects.push(a, b);
  assert.equal(e.focus(hero)?.id, 101); b.status = 'used'; assert.equal(e.focus(hero)?.id, 102);
  assert.equal(e.interact(a.id, { x: 10, z: 10 }, h), false);
  assert.equal(e.interact(999, hero, h), false); assert.equal(e.coins, 0);
});

test('normal deaths leave collectible currency once; withdrawal and boss deaths do not', () => {
  const e = fixture(), h = health();
  const death = { id: 1, target: 25, type: 'death' as const, x: 1, z: 0, amount: 0, enemyKind: 'soldier' as const };
  e.receive([death, death]); assert.equal(e.coins, 0); assert.equal(e.objects.length, 1); assert.equal(e.objects[0].amount, 1);
  e.receive([{ ...death, id: 2, target: 26, enemyKind: 'archer' }]); assert.equal(e.objects.length, 1); assert.equal(e.objects[0].amount, 2);
  e.receive([{ ...death, target: 27, enemyKind: 'boss' }]); assert.equal(e.objects[0].amount, 2);
  e.step(1 / 60, hero, h); e.receive([death]); assert.equal(e.coins, 2); assert.equal(e.objects.length, 0);
  const run = new Run(bounds, [], undefined, undefined, undefined, TRAINING_EXPEDITION); run.combat.retireNormals(); run.step(PLAYER.step, hero);
  assert.equal(run.exploration.coins, 0); assert.equal(run.combat.kills, 0);
});

test('discovery remembers visited destinations but limits guidance to three nearby points', () => {
  const e = fixture(), h = health();
  for (let i = 0; i < 5; i++) e.objects.push(object('chest', 100 + i, 3 + i * 4));
  e.step(1 / 60, hero, h); assert.ok(e.objects.every(o => o.discovered)); assert.equal(e.destinations(hero).length, 3);
  e.objects[0].status = 'used'; assert.notEqual(e.destinations(hero)[0].id, 100);
  assert.equal(e.destinations({ x: 90, z: 90 }).length, 0); assert.ok(e.objects[0].discovered);
});

test('paused choices freeze pickups and queued interactions; lethal hits take priority over healing', () => {
  const run = new Run(bounds, [], undefined, undefined, undefined, TRAINING_EXPEDITION), e = run.exploration;
  e.objects.length = 0; e.objects.push(object('coins'), object('fountain', 101), object('supply', 102));
  run.combat.hp = 50; run.progression.gain(4); const time = run.combat.time;
  for (let i = 0; i < 10; i++) run.step(PLAYER.step, hero, undefined, 101);
  assert.equal(run.combat.time, time); assert.equal(e.coins, 0); assert.equal(e.fountainUses, 0); assert.equal(run.combat.hp, 50);
  const choice = run.progression.choice()!; run.choose(choice.id, 'fire');
  run.combat.retireNormals(); run.combat.addEnemies([{ x: 0, z: -1 }]);
  run.combat.hp = 12; run.combat.cooldown = 999; run.combat.whirlwindCooldown = 999;
  run.combat.enemies.at(-1)!.attack = { id: 900, yaw: Math.PI, age: .6 - PLAYER.step, hits: new Set() };
  run.step(PLAYER.step, hero, undefined, 101);
  assert.equal(run.combat.status, 'defeat'); assert.equal(run.combat.hp, 0); assert.equal(e.coins, 0); assert.equal(e.fountainUses, 0);
  assert.equal(e.interact(101, hero, health()), false);
});

test('reward state and balance reset while the same seed reproduces placement', () => {
  const a = new Exploration(bounds, [], 17, undefined, undefined, TRAINING_EXPEDITION), b = new Exploration(bounds, [], 17, undefined, undefined, TRAINING_EXPEDITION), c = new Exploration(bounds, [], 18, undefined, undefined, TRAINING_EXPEDITION);
  assert.deepEqual(a.objects, b.objects); assert.notDeepEqual(a.objects, c.objects);
  const chest = a.objects.find(o => o.kind === 'chest')!; assert.ok(chest); a.interact(chest.id, chest, health());
  a.stop(); const fresh = new Exploration(bounds, [], 17, undefined, undefined, TRAINING_EXPEDITION);
  assert.equal(fresh.coins, 0); assert.equal(fresh.chestsOpened, 0); assert.ok(fresh.objects.every(o => o.status === 'available' && !o.discovered));
});

test('actual map placements are reproducible, separated and reachable with player clearance', () => {
  const mat = new THREE.MeshStandardMaterial(), world = createWorld({ materials: { castle_wall_slates: mat, cobblestone_floor_04: mat, brown_mud_02: mat, weathered_brown_planks: mat }, failures: [], dispose() {} });
  const start = { x: 0, z: 7 }, nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius); nav.update(start);
  try {
    for (const seed of [1, 19, 77]) {
      const exploration = new Exploration(PLAY_AREA, world.movementSolids, seed);
      assert.equal(exploration.objects.filter(o => o.kind === 'chest').length, 10);
      assert.equal(exploration.objects.filter(o => o.kind === 'fountain').length, 5);
      assert.equal(exploration.objects.length, 33);
      assert.equal(exploration.objects.filter(o => o.kind === 'shop').length, 1);
      assert.equal(exploration.objects.filter(o => o.kind === 'capture').length, 1);
      for (const o of exploration.objects) {
        assert.equal(world.movementSolids.some(s => overlaps(o, .6, s)), false);
        assert.ok(nav.waypoint(o, start));
        assert.ok(exploration.objects.every(other => other.id === o.id || Math.hypot(o.x - other.x, o.z - other.z) >= 3));
      }
      const run = new Run(PLAY_AREA, world.movementSolids, seed); const initialCoins = run.exploration.objects.find(o => o.kind === 'coins')!;
      run.combat.retireNormals(); run.step(PLAYER.step, { ...initialCoins, yaw: 0 }); assert.equal(run.exploration.coins, initialCoins.amount);
      const chest = run.exploration.objects.find(o => o.kind === 'chest')!;
      run.step(PLAYER.step, { ...chest, yaw: 0 }, undefined, chest.id); assert.equal(run.exploration.chestsOpened, 1);
      run.step(PLAYER.step, { ...chest, yaw: 0 }, undefined, chest.id); assert.equal(run.exploration.chestsOpened, 1);
    }
  } finally { world.dispose(); }
});

test('rendered props reflect used states and release objects and shared resources on restart', () => {
  const scene = new THREE.Scene(), view = createExplorationView(scene), items = [object('chest'), object('fountain', 101), object('coins', 102), object('supply', 103)];
  view.update(items, 100, 1); assert.equal(scene.children[0].children.length, 4);
  items[0].status = 'used'; items[1].status = 'used'; view.update(items, undefined, 2);
  const root = scene.children[0], chest = root.children[0], fountain = root.children[1];
  assert.ok(chest.children.some(child => child instanceof THREE.Group && child.rotation.x < -1));
  assert.ok(fountain.children.some(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.CircleGeometry && !child.visible));
  view.update(items.slice(0, 2), undefined, 2); assert.equal(root.children.length, 2);
  view.reset(); assert.equal(root.children.length, 0); view.update(items, undefined, 0); assert.equal(root.children.length, 4);
  view.dispose(); assert.equal(scene.children.length, 0);
});
