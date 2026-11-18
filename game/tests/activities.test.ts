import { EXPEDITION } from '../src/content/expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CAPTURE } from '../src/content/activities.ts';
import { Capture } from '../src/domain/capture.ts';
import type { WorldObject } from '../src/domain/exploration.ts';
import { Run } from '../src/domain/run.ts';
import { PLAY_AREA, PLAYER } from '../src/content/config.ts';
import { CAMPAIGN } from '../src/content/campaign.ts';
import { PreviewState } from '../src/app/state.ts';
import { Navigation } from '../src/domain/navigation.ts';
import { stepMovement, overlaps } from '../src/domain/movement.ts';
import { createWorld } from '../src/rendering/world.ts';
import { createExplorationView } from '../src/rendering/exploration.ts';

const origin = { x: 0, z: 0, yaw: 0 };
function point(): WorldObject { return { id: 900, x: 0, z: 0, kind: 'capture', status: 'available', discovered: false, amount: 0, uses: 1, region: 'Puesto' }; }
function runFixture() { return new Run(PLAY_AREA, [], 19); }

test('capture warns, pauses progress outside the circle and pays only on completion', () => {
  const p = point(), capture = new Capture(p, []);
  capture.step(2, origin, true); assert.equal(capture.state, 'warning'); assert.equal(capture.progress, 0);
  capture.step(5, { x: 20, z: 0 }, true); assert.equal(capture.warningRemaining, 1); assert.equal(capture.pressure, false);
  capture.step(3, origin, true); assert.equal(capture.state, 'active'); assert.equal(capture.progress, 2); assert.equal(capture.pressure, true);
  capture.step(5, { x: 20, z: 0 }, true); assert.equal(capture.progress, 2);
  capture.step(0, origin, true); assert.equal(capture.progress, 2);
  assert.equal(capture.step(23, origin, true), 'completed'); assert.equal(p.status, 'used'); assert.equal(capture.progress, 25);
  assert.equal(capture.step(100, origin, false), undefined); assert.equal(p.status, 'used'); assert.equal(capture.pressure, false);
});

test('capture cannot progress across walls and incomplete objectives close at the final transition', () => {
  const p = point(), wall = { min: { x: -.1, y: 0, z: -8 }, max: { x: .1, y: 3, z: 8 } }; p.x = 1;
  const capture = new Capture(p, [wall]); capture.step(10, { x: -1, z: 0 }, true);
  assert.equal(capture.state, 'idle'); assert.equal(capture.progress, 0);
  assert.equal(capture.step(1, origin, false), 'closed'); assert.equal(p.status, 'closed');
  assert.equal(capture.step(100, p, true), undefined); assert.equal(capture.progress, 0);
});

test('run credits the capture once, never a core, and the boss deadline takes priority', () => {
  for (const atDeadline of [false, true]) {
    const run = runFixture(), target = run.capture.point!; assert.ok(target);
    run.capture.state = 'active'; run.capture.progress = CAPTURE.duration - .01;
    run.combat.retireNormals(); run.combat.time = atDeadline ? CAMPAIGN.bossAt - .005 : 20;
    const before = run.exploration.coins; run.step(.02, { ...target, yaw: 0 });
    assert.equal(run.capture.state, atDeadline ? 'closed' : 'completed');
    assert.equal(run.exploration.coins - before, atDeadline ? 0 : CAPTURE.reward);
    assert.equal(run.progression.core, false);
    run.step(.02, { ...target, yaw: 0 }); assert.equal(run.exploration.coins - before, atDeadline ? 0 : CAPTURE.reward);
  }
});

test('capture uses one shared wave budget, bounded cadence and the global enemy cap', () => {
  const run = runFixture(), target = run.capture.point!;
  run.combat.retireNormals(); run.capture.state = 'active'; run.combat.time = CAMPAIGN.restStart;
  const before = run.totalSpawned; run.step(PLAYER.step, { ...target, yaw: 0 });
  assert.equal(run.totalSpawned - before, run.stage.count, 'Holding the capture overrides a rest without adding two waves');
  for (let i = 0; i < 120; i++) run.step(PLAYER.step, { ...target, yaw: 0 });
  assert.equal(run.totalSpawned - before, run.stage.count);
  while (run.combat.enemies.filter(e => !e.dead).length < CAMPAIGN.maxEnemies - 1) run.combat.addEnemies([{ x: target.x + 14, z: target.z }], 999);
  run.combat.enemies.forEach(e => { if (!e.dead) e.spawnRemaining = 999; });
  run.combat.time = 240; run.step(PLAYER.step, { ...target, yaw: 0 });
  assert.ok(run.elite); assert.equal(run.combat.enemies.filter(e => !e.dead).length, CAMPAIGN.maxEnemies);
  for (let i = 0; i < 60; i++) run.step(PLAYER.step, { ...target, yaw: 0 });
  assert.ok(run.combat.enemies.filter(e => !e.dead).length <= CAMPAIGN.maxEnemies);
});

test('entering the merchant freezes combat, projectiles, capture and the director until explicitly closed', () => {
  const run = runFixture(), merchant = run.exploration.objects.find(o => o.kind === 'shop')!;
  assert.ok(merchant); run.capture.state = 'active'; run.capture.progress = 5;
  run.combat.projectiles.fire({ x: 50, z: 50 }, 0, 99, 10);
  run.step(PLAYER.step, { ...merchant, yaw: 0 }, undefined, merchant.id); assert.equal(run.shop.isOpen, true);
  const snapshot = JSON.stringify({ time: run.combat.time, enemies: run.combat.enemies, bolts: run.combat.projectiles.items, capture: run.capture.progress, total: run.totalSpawned });
  for (let i = 0; i < 50; i++) run.step(1, origin);
  assert.equal(JSON.stringify({ time: run.combat.time, enemies: run.combat.enemies, bolts: run.combat.projectiles.items, capture: run.capture.progress, total: run.totalSpawned }), snapshot);
  run.shop.close(); const time = run.combat.time; run.step(PLAYER.step, { ...merchant, yaw: 0 }); assert.ok(run.combat.time > time);
  assert.equal(run.capture.progress, 5);
});

test('merchant cannot open remotely or through a pending upgrade', () => {
  const run = runFixture(), merchant = run.exploration.objects.find(o => o.kind === 'shop')!;
  run.step(PLAYER.step, origin, undefined, merchant.id); assert.equal(run.shop.isOpen, false);
  run.progression.gain(4); run.step(PLAYER.step, { ...merchant, yaw: 0 }, undefined, merchant.id); assert.equal(run.shop.isOpen, false);
});

test('purchases reject stale clicks, insufficient funds, full health and exhausted stock', () => {
  const run = runFixture(), { shop, exploration: e, progression: p, combat: c } = run;
  shop.open(); c.hp = 10;
  assert.equal(shop.buy('heal', shop.revision, e, p, c), false); assert.equal(e.coins, 0);
  e.coins = 50; const revision = shop.revision;
  assert.equal(shop.buy('heal', revision, e, p, c), true); assert.equal(e.coins, 42); assert.equal(c.hp, 50);
  assert.equal(shop.buy('heal', revision, e, p, c), false); assert.equal(e.coins, 42);
  assert.equal(shop.buy('heal', shop.revision, e, p, c), true); assert.equal(c.hp, 90); assert.equal(shop.stock.heal, 0);
  assert.equal(shop.buy('heal', shop.revision, e, p, c), false); assert.equal(e.coins, 34);
  const other = runFixture(); other.shop.open(); other.exploration.coins = 50;
  assert.equal(other.shop.buy('heal', other.shop.revision, other.exploration, other.progression, other.combat), false);
  assert.equal(other.shop.stock.heal, 2); assert.equal(other.exploration.coins, 50);
});

test('shop upgrades share rank caps and immediately affect combat, maximum health and movement', () => {
  const run = runFixture(), { shop, exploration: e, progression: p, combat: c } = run; shop.open(); e.coins = 100; c.hp = 50;
  p.ranks.damage = 2;
  assert.ok(shop.buy('damage', shop.revision, e, p, c)); assert.equal(p.ranks.damage, 3); assert.equal(c.damageMultiplier, 1.24);
  assert.ok(shop.buy('vitality', shop.revision, e, p, c)); assert.equal(c.maxHp, 115); assert.equal(c.hp, 65);
  assert.ok(shop.buy('speed', shop.revision, e, p, c)); assert.equal(p.speed, 5.3); assert.equal(e.coins, 48);
  assert.equal(shop.purchases, 3); assert.equal(shop.spent, 52);
  const other = runFixture(); other.progression.ranks.damage = 4; other.exploration.coins = 99; other.shop.open();
  assert.equal(other.shop.buy('damage', other.shop.revision, other.exploration, other.progression, other.combat), false);
  assert.equal(other.shop.stock.damage, 1); assert.equal(other.exploration.coins, 99);
  p.ranks.damage = 4; p.element = 'fire'; p.affinityRank = 3; p.gain(4); assert.ok(!p.choice()!.options.includes('damage'));
});

test('closing or restarting invalidates shop clicks and resets stock, capture and economy', () => {
  const run = runFixture(); run.shop.open(); run.exploration.coins = 40;
  const revision = run.shop.revision; run.shop.close();
  assert.equal(run.shop.buy('damage', revision, run.exploration, run.progression, run.combat), false);
  run.shop.open(); assert.equal(run.shop.buy('damage', revision, run.exploration, run.progression, run.combat), false);
  assert.ok(run.shop.buy('damage', run.shop.revision, run.exploration, run.progression, run.combat));
  const fresh = runFixture(); assert.equal(fresh.shop.isOpen, false); assert.equal(fresh.shop.stock.damage, 1); assert.equal(fresh.exploration.coins, 0); assert.equal(fresh.capture.progress, 0);
  const ui = new PreviewState(); ui.loaded(); ui.resume(); ui.shop(); assert.equal(ui.active, false); ui.resume(); assert.equal(ui.phase, 'shopping');
  ui.pauseShop(); assert.equal(ui.phase, 'paused'); ui.resume(); ui.shop(); ui.resumeShop(); assert.equal(ui.active, true);
  ui.fail(); ui.resumeShop(); assert.equal(ui.phase, 'error');
});

test('actual-map expedition can capture then physically reach the merchant and purchase with its reward', () => {
  const mat = new THREE.MeshStandardMaterial(), world = createWorld({ materials: { castle_wall_slates: mat, cobblestone_floor_04: mat, brown_mud_02: mat, weathered_brown_planks: mat }, failures: [], dispose() {} });
  const run = new Run(PLAY_AREA, world.movementSolids, 19), body = { ...EXPEDITION.start }, nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius);
  const merchant = run.exploration.objects.find(o => o.kind === 'shop')!, capture = run.capture.point!;
  assert.ok(merchant && capture); assert.equal(world.movementSolids.some(s => overlaps(capture, CAPTURE.radius, s)), false);
  // Extra health isolates integration, not human difficulty.
  run.combat.maxHp = 10000; run.combat.hp = 10000;
  try {
    for (let frame = 0; frame < 7200 && !run.shop.isOpen; frame++) {
      if (run.progression.pending) {
        const choice = run.progression.choice()!, option = choice.options.find(o => o === 'fire') ?? choice.options.find(o => o === 'affinity') ?? choice.options.find(o => o === 'damage') ?? choice.options[0];
        if (option) run.choose(choice.id, option); else run.fallback(choice.id); continue;
      }
      const target = run.capture.state === 'completed' ? merchant : capture;
      nav.update(target); const next = nav.waypoint(body, target); assert.ok(next);
      if (Math.hypot(body.x - target.x, body.z - target.z) > 1) stepMovement(body, { right: 0, forward: 1 }, Math.atan2(body.x - next.x, body.z - next.z), PLAYER.step, PLAYER, PLAY_AREA, world.movementSolids);
      run.step(PLAYER.step, body, undefined, target === merchant ? merchant.id : undefined);
      assert.ok(run.combat.enemies.filter(e => !e.dead).length <= CAMPAIGN.maxEnemies);
    }
    assert.equal(run.capture.state, 'completed'); assert.equal(run.shop.isOpen, true); assert.ok(run.exploration.coins >= CAPTURE.reward);
    const coins = run.exploration.coins, time = run.combat.time;
    assert.ok(run.shop.buy('vitality', run.shop.revision, run.exploration, run.progression, run.combat));
    assert.equal(run.exploration.coins, coins - 18); assert.equal(run.combat.time, time);
    console.log(`Captura y compra: ${time.toFixed(2)} s, ${coins} monedas antes de comprar, saldo ${run.exploration.coins}; simulación sin GPU.`);
  } finally { world.dispose(); }
});

test('merchant and capture views update state without accumulating geometry across resets', () => {
  const scene = new THREE.Scene(), view = createExplorationView(scene), capturePoint = point();
  const merchant: WorldObject = { ...point(), id: 901, x: 10, kind: 'shop' }, capture = new Capture(capturePoint, []);
  try {
    view.update([merchant, capturePoint], merchant.id, 0, capture);
    capture.step(3 + CAPTURE.duration, origin, true); view.update([merchant, capturePoint], undefined, 30, capture);
    assert.equal(capturePoint.status, 'used');
    const geometries = new Set<THREE.BufferGeometry>(); scene.traverse(o => { if (o instanceof THREE.Mesh) geometries.add(o.geometry); });
    view.reset(); view.update([merchant, capturePoint], undefined, 30, capture);
    scene.traverse(o => { if (o instanceof THREE.Mesh) assert.ok(geometries.has(o.geometry)); });
    assert.equal(scene.children[0].children.length, 2);
  } finally { view.dispose(); }
  assert.equal(scene.children.length, 0);
});
