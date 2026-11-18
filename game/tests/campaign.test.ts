import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Combat } from '../src/domain/combat.ts';
import { Run } from '../src/domain/run.ts';
import { Projectiles } from '../src/domain/projectiles.ts';
import { PLAYER, PLAY_AREA } from '../src/content/config.ts';
import { HERO_COMBAT } from '../src/content/combat.ts';
import { ENEMIES, actionStats, BOLT } from '../src/content/enemies.ts';
import type { EnemyKind } from '../src/content/enemies.ts';
import { CAMPAIGN } from '../src/content/campaign.ts';
import { overlaps } from '../src/domain/movement.ts';
import { createCombatView } from '../src/rendering/combat.ts';
import { createProjectileView } from '../src/rendering/projectiles.ts';
import { Navigation } from '../src/domain/navigation.ts';
const hero = { x: 0, z: 0, yaw: 0 };
test('large enemies retain a reachable approach when the hero hugs a wall', () => {
  const wall = { min: { x: -8, y: 0, z: -2 }, max: { x: 8, y: 3, z: -1 } };
  const target = { x: 0, z: -0.59 },
    nav = new Navigation(PLAY_AREA, [wall], ENEMIES.boss.radius);
  nav.update(target);
  const waypoint = nav.waypoint({ x: 0, z: 6 }, target);
  assert.ok(waypoint);
  assert.equal(overlaps(waypoint, ENEMIES.boss.radius, wall), false);
});
function fixture(kind: EnemyKind, z = -7) {
  const c = new Combat(PLAY_AREA, [], [], false);
  c.addEnemies([{ x: 0, z }], 0, kind);
  c.cooldown = 999;
  c.whirlwindCooldown = 999;
  c.enemies[0].cooldown = 0;
  return c;
}
function steps(c: Combat, count: number, body = hero) {
  const events = [];
  for (let i = 0; i < count; i++) {
    c.step(PLAYER.step, { ...body });
    events.push(...c.takeEvents());
  }
  return events;
}

test('archer announces a frozen aim, then fires a non-homing bolt once', () => {
  const c = fixture('archer');
  steps(c, 30);
  assert.equal(c.enemies[0].attack?.action, 'shot');
  assert.equal(c.projectiles.items.length, 0);
  assert.equal(c.hp, 100);
  const yaw = c.enemies[0].attack!.yaw;
  steps(c, 30, { x: 3, z: 0, yaw: 0 });
  assert.equal(c.projectiles.items.length, 1);
  assert.equal(c.enemies[0].attack!.yaw, yaw);
  assert.ok(Math.abs(c.projectiles.items[0].vx) < 1e-8);
  steps(c, 60, { x: 3, z: 0, yaw: 0 });
  assert.equal(c.hp, 100);
});
test('standing in a bolt path takes one hit; contact alone has no archer damage', () => {
  const c = fixture('archer');
  steps(c, 130);
  assert.equal(c.hp, 90);
  const close = fixture('archer', -0.8);
  close.enemies[0].cooldown = 999;
  steps(close, 60);
  assert.equal(close.hp, 100);
});
test('projectiles sweep thin obstacles and targets without tunnelling', () => {
  const wall = { min: { x: -2, z: -2.01 }, max: { x: 2, z: -1.99 } };
  const blocked = new Projectiles(PLAY_AREA, [wall]);
  blocked.fire({ x: 0, z: -4 }, Math.PI, 1, 10);
  assert.equal(blocked.step(1, hero).length, 0);
  assert.equal(blocked.items.length, 0);
  const open = new Projectiles(PLAY_AREA, []);
  open.fire({ x: 0, z: -4 }, Math.PI, 1, 10);
  assert.equal(open.step(1, hero).length, 1);
  assert.equal(open.step(1, hero).length, 0);
});
test('projectile lifetime, population and pause are bounded', () => {
  const p = new Projectiles(PLAY_AREA, []);
  for (let i = 0; i < 200; i++) p.fire(hero, 0, 1, 10);
  assert.equal(p.items.length, BOLT.cap);
  p.step(4, { x: 20, z: 20 });
  assert.equal(p.items.length, 0);
  const run = new Run(PLAY_AREA, []);
  run.combat.projectiles.fire({ x: 0, z: -5 }, Math.PI, 1, 10);
  run.progression.gain(4);
  const before = JSON.stringify(run.combat.projectiles.items),
    time = run.combat.time;
  for (let i = 0; i < 120; i++) run.step(PLAYER.step, hero);
  assert.equal(JSON.stringify(run.combat.projectiles.items), before);
  assert.equal(run.combat.time, time);
  assert.equal(run.wave, 1);
});
test('charge warns for one second, locks heading and only hits once', () => {
  const c = fixture('charger', -5);
  steps(c, 50);
  const enemy = c.enemies[0];
  assert.equal(enemy.attack?.action, 'charge');
  assert.ok(enemy.z < -4.9);
  assert.equal(c.hp, 100);
  const start = enemy.x;
  steps(c, 60, { x: 3, z: 0, yaw: 0 });
  assert.ok(Math.abs(enemy.x - start) < 1e-6);
  assert.equal(c.hp, 100);
  const hit = fixture('charger', -5);
  steps(hit, 130);
  assert.equal(hit.hp, 82);
});
test('charging into a wall stops before it and cannot damage through it', () => {
  const wall = { min: { x: -3, z: -2.1 }, max: { x: 3, z: -1.9 } };
  const c = new Combat(PLAY_AREA, [wall], [], false);
  c.addEnemies([{ x: 0, z: -4 }], 0, 'charger');
  c.cooldown = 999;
  c.whirlwindCooldown = 999;
  c.enemies[0].attack = { id: 100, yaw: Math.PI, age: 1.05, action: 'charge', hits: new Set() };
  steps(c, 30);
  assert.equal(c.hp, 100);
  assert.equal(overlaps(c.enemies[0], c.enemies[0].radius, wall), false);
  assert.ok(c.enemies[0].z <= -2.1 - c.enemies[0].radius);
});
test('elite drops a real unique core and eight essence, with no provisional group grant', () => {
  const run = new Run(PLAY_AREA, []);
  run.combat.retireNormals();
  run.combat.addEnemies([{ x: 0, z: -1 }], 0, 'elite');
  const elite = run.elite!;
  elite.hp = 1;
  elite.cooldown = 999;
  run.combat.whirlwindCooldown = 999;
  run.combat.attack = { id: 100, yaw: 0, age: HERO_COMBAT.windup - PLAYER.step, hits: new Set() };
  const events = run.step(PLAYER.step, hero);
  const deaths = events.filter(e => e.type === 'death' && e.enemyKind === 'elite');
  assert.equal(deaths.length, 1);
  assert.equal(deaths[0].reward, 8);
  assert.equal(deaths[0].core, true);
  assert.equal(run.progression.totalEssence, 8);
  assert.equal(run.progression.core, true);
  assert.equal(run.progression.level, 2);
  run.progression.receive(deaths);
  assert.equal(run.progression.drops.length, 0);
});
test('elite and boss have correct water resistance, while burn still applies', () => {
  for (const kind of ['elite', 'boss'] as const) {
    const c = fixture(kind, -1),
      e = c.enemies[0],
      before = e.z;
    c.elementalEffects.direct(e, 'basic', 18, 1, hero, [e], { element: 'water', rank: 3, mastery: true });
    assert.ok(Math.abs(e.z - (before - 0.5 * ENEMIES[kind].push)) < 1e-8);
    assert.equal(e.wetRemaining, 3);
    c.elementalEffects.direct(e, 'basic', 18, 2, hero, [e], { element: 'fire', rank: 3, mastery: true });
    assert.ok(e.burn);
  }
  const c = fixture('boss', -10);
  c.enemies[0].wetRemaining = 3;
  c.enemies[0].cooldown = 999;
  steps(c, 60);
  assert.ok(Math.abs(c.enemies[0].z + 10 - 1.7 * (1 - 0.15 * 0.25)) < 1e-7);
});
test('boss alternates sweep, ground slam and volley with recovery windows', () => {
  const c = fixture('boss', -2);
  const e = c.enemies[0];
  c.hp = 10000;
  c.maxHp = 10000;
  const actions = new Set<string>();
  let recovered = false;
  for (let i = 0; i < 720; i++) {
    c.step(PLAYER.step, hero);
    c.takeEvents();
    if (e.attack) {
      actions.add(e.attack.action!);
      const data = actionStats(e.kind, e.attack.action);
      if (e.attack.age > data.windup + data.active) recovered = true;
    }
  }
  assert.deepEqual([...actions].sort(), ['melee', 'slam', 'volley']);
  assert.equal(recovered, true);
});
test('leaving the boss slam circle before impact avoids damage', () => {
  const c = fixture('boss', -2),
    e = c.enemies[0];
  e.actionCount = 1;
  steps(c, 60);
  assert.equal(e.attack?.action, 'slam');
  assert.equal(c.hp, 100);
  steps(c, 60, { x: 8, z: 0, yaw: 0 });
  assert.equal(c.hp, 100);
});
test('boss fury widens the volley without creating homing projectiles', () => {
  for (const wounded of [false, true]) {
    const c = fixture('boss', -8),
      e = c.enemies[0];
    e.actionCount = 2;
    if (wounded) e.hp = e.maxHp / 2;
    steps(c, 74);
    assert.equal(c.projectiles.items.length, wounded ? 5 : 3);
    assert.ok(c.projectiles.items.every(p => Math.abs(Math.hypot(p.vx, p.vz) - BOLT.speed) < 1e-8));
  }
});
test('the director introduces enemies on schedule and respects rest windows', () => {
  const run = new Run(PLAY_AREA, [], 19);
  const far = { x: 25, z: 25, yaw: 0 };
  run.combat.time = CAMPAIGN.restStart;
  const before = run.totalSpawned;
  run.step(PLAYER.step, far);
  assert.equal(run.totalSpawned, before);
  run.combat.time = 60;
  run.step(PLAYER.step, far);
  assert.ok(run.combat.enemies.some(e => e.kind === 'archer'));
  assert.ok(!run.elite);
  run.combat.time = 150;
  run.step(PLAYER.step, far);
  assert.ok(run.elite);
  assert.ok(run.combat.enemies.some(e => e.kind === 'charger'));
  run.combat.time = 240;
  run.step(PLAYER.step, far);
  assert.equal(run.combat.enemies.filter(e => e.kind === 'elite').length, 1);
});
test('population cap discards missed waves instead of bursting a backlog', () => {
  const run = new Run(PLAY_AREA, []);
  while (run.combat.enemies.length < CAMPAIGN.maxEnemies - 1) run.combat.addEnemies([{ x: 15, z: 15 }], 999);
  run.combat.enemies.forEach(e => {
    e.spawnRemaining = 999;
  });
  run.combat.time = 240;
  run.step(PLAYER.step, hero);
  assert.equal(run.combat.enemies.filter(e => !e.dead).length, CAMPAIGN.maxEnemies);
  for (let i = 0; i < 120; i++) run.step(PLAYER.step, hero);
  assert.equal(run.combat.enemies.filter(e => !e.dead).length, CAMPAIGN.maxEnemies);
  run.combat.retireNormals();
  run.combat.time += 3;
  run.step(PLAYER.step, hero);
  assert.ok(run.combat.enemies.filter(e => !e.dead).length <= run.stage.count + 1);
});
test('at six minutes normal enemies withdraw without loot and the live elite blocks the boss', () => {
  const run = new Run(PLAY_AREA, []);
  run.combat.time = 150;
  run.step(PLAYER.step, { x: 25, z: 25, yaw: 0 });
  run.combat.projectiles.fire({ x: -10, z: -10 }, 0, 1, 10);
  const kills = run.combat.kills;
  run.combat.time = 360;
  const events = run.step(PLAYER.step, hero);
  assert.equal(run.phase, 'elite-gate');
  assert.equal(run.boss, undefined);
  assert.ok(run.elite);
  assert.equal(run.combat.projectiles.items.length, 0);
  assert.equal(run.combat.kills, kills);
  assert.equal(events.filter(e => e.type === 'death').length, 0);
  assert.equal(run.progression.totalEssence, 0);
  assert.ok(run.combat.enemies.filter(e => !e.dead).every(e => e.kind === 'elite'));
});
test('boss arrival is announced, invulnerable, and never grants victory on time alone', () => {
  const run = new Run(PLAY_AREA, []);
  run.eliteSpawned = true;
  run.combat.time = 360;
  run.step(PLAYER.step, hero);
  assert.equal(run.phase, 'arrival');
  assert.ok(run.boss);
  assert.equal(run.boss!.spawnRemaining, CAMPAIGN.arrivalWarning);
  const hp = run.boss!.hp;
  for (let i = 0; i < 300; i++) run.step(PLAYER.step, { ...run.boss!, yaw: 0 });
  assert.equal(run.boss!.hp, hp);
  assert.equal(run.combat.status, 'running');
  for (let i = 0; i < 65; i++) run.step(PLAYER.step, hero);
  assert.equal(run.phase, 'boss');
  assert.equal(run.combat.status, 'running');
  assert.equal(run.combat.enemies.filter(e => !e.dead).length, 1);
});
test('only killing the boss wins; simultaneous lethal blows are defeat', () => {
  for (const lethal of [false, true]) {
    const run = new Run(PLAY_AREA, []),
      c = run.combat;
    c.retireNormals();
    c.addEnemies([{ x: 0, z: -1 }], 0, 'boss');
    run.phase = 'boss';
    run.eliteSpawned = true;
    run.bossSpawned = true;
    const boss = run.boss!;
    boss.hp = 1;
    boss.cooldown = 999;
    c.whirlwindCooldown = 999;
    c.attack = { id: 100, yaw: 0, age: HERO_COMBAT.windup - PLAYER.step, hits: new Set() };
    if (lethal) {
      c.hp = 24;
      boss.attack = { id: 101, yaw: Math.PI, age: ENEMIES.boss.windup - PLAYER.step, action: 'melee', hits: new Set() };
    }
    run.step(PLAYER.step, hero);
    assert.equal(c.status, lethal ? 'defeat' : 'victory');
    assert.equal(run.progression.pending, 0);
    assert.equal(c.projectiles.items.length, 0);
  }
});
test('pruning dead actors keeps IDs unique and releases render objects', () => {
  const c = fixture('archer'),
    scene = new THREE.Scene(),
    view = createCombatView(scene),
    bolts = createProjectileView(scene);
  const camera = new THREE.PerspectiveCamera();
  view.update(c, new THREE.Vector3(), camera, 1, 0);
  const old = c.enemies[0].id;
  c.enemies[0].dead = true;
  c.enemies[0].deathAge = 3;
  c.pruneCorpses(2);
  c.addEnemies([{ x: 1, z: 1 }], 0, 'boss');
  assert.ok(c.enemies[0].id > old);
  view.update(c, new THREE.Vector3(), camera, 1, 0);
  c.projectiles.fire(hero, 0, 1, 10);
  bolts.update(c.projectiles.items, 1);
  c.projectiles.clear();
  bolts.update(c.projectiles.items, 1);
  view.dispose();
  bolts.dispose();
  assert.equal(scene.children.length, 0);
});
test('same seed reproduces spawns and a fresh run clears every campaign state', () => {
  const a = new Run(PLAY_AREA, [], 19),
    b = new Run(PLAY_AREA, [], 19),
    c = new Run(PLAY_AREA, [], 20);
  assert.deepEqual(a.reinforcementPositions(hero, 5), b.reinforcementPositions(hero, 5));
  assert.notDeepEqual(b.reinforcementPositions(hero, 5), c.reinforcementPositions(hero, 5));
  a.combat.time = 360;
  a.eliteSpawned = true;
  a.step(PLAYER.step, hero);
  const fresh = new Run(PLAY_AREA, [], 21);
  assert.equal(fresh.phase, 'waves');
  assert.equal(fresh.wave, 1);
  assert.equal(fresh.combat.time, 0);
  assert.equal(fresh.eliteSpawned, false);
  assert.equal(fresh.bossSpawned, false);
  assert.equal(fresh.combat.projectiles.items.length, 0);
});
