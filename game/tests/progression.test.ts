import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Progression } from '../src/domain/progression.ts';
import { Run } from '../src/domain/run.ts';
import { Combat, chooseTarget } from '../src/domain/combat.ts';
import { PreviewState } from '../src/app/state.ts';
import { HERO_COMBAT, SOLDIER } from '../src/content/combat.ts';
import { PLAYER, PLAY_AREA } from '../src/content/config.ts';
import { UPGRADE_IDS } from '../src/content/progression.ts';
import { createEssenceView } from '../src/rendering/essence.ts';
import type { CombatEvent } from '../src/domain/combat.ts';
const hero = { x: 0, z: 0, yaw: 0 };
const death = (id: number, x = 0, z = 0): CombatEvent => ({ id, type: 'death', target: id, amount: 0, x, z });

test('only unique enemy deaths drop essence, and an orb is collected only once', () => {
  const p = new Progression();
  p.receive([death(1), death(1), death(0), { ...death(2), type: 'hit' }]);
  assert.equal(p.drops.length, 1);
  p.step(PLAYER.step, hero, []);
  assert.equal(p.totalEssence, 1);
  assert.equal(p.drops.length, 0);
  p.receive([death(1)]);
  p.step(PLAYER.step, hero, []);
  assert.equal(p.totalEssence, 1);
});
test('absorption, attraction, range and walls govern physical collection', () => {
  const p = new Progression();
  p.receive([death(1, 1.5), death(2, 2.8), death(3, 3.1)]);
  p.step(PLAYER.step, hero, []);
  assert.equal(p.totalEssence, 1);
  assert.ok(p.drops.find(d => d.id === 2)!.x < 2.8);
  assert.equal(p.drops.find(d => d.id === 3)!.x, 3.1);
  const before = p.drops[0].x;
  p.step(1, hero, [{ min: { x: 0.6, z: -2 }, max: { x: 0.8, z: 2 } }]);
  assert.equal(p.drops[0].x, before);
  assert.equal(p.totalEssence, 1);
  p.step(1, hero, []);
  assert.equal(p.totalEssence, 2);
});
test('multiple levels preserve excess XP and queue distinct choices', () => {
  const p = new Progression();
  p.gain(20);
  assert.equal(p.level, 4);
  assert.equal(p.xp, 2);
  assert.equal(p.threshold, 10);
  assert.equal(p.pending, 3);
  const first = p.choice()!;
  assert.deepEqual(first.options, ['fire', 'water', 'earth', 'air']);
  assert.equal(p.choose(first.id, first.options[0]), true);
  assert.equal(p.choose(first.id, first.options[0]), false);
  assert.equal(p.pending, 2);
  assert.equal(p.choice()!.level, 3);
  assert.equal(new Set(p.choice()!.options).size, 3);
  assert.equal(p.totalEssence, 20);
});
test('choices exclude maximized upgrades, support fewer than three and compensate exhaustion', () => {
  const p = new Progression();
  p.element = 'fire';
  p.affinityRank = 3;
  p.ranks = { damage: 3, vitality: 3, speed: 2, collection: 3 };
  p.gain(20);
  const first = p.choice()!;
  assert.deepEqual(first.options, ['speed']);
  assert.equal(p.choose(first.id, 'damage'), false);
  assert.equal(p.fallback(first.id), false);
  assert.equal(p.choose(first.id, 'speed'), true);
  assert.equal(p.speed, 6.5);
  const next = p.choice()!;
  assert.deepEqual(next.options, ['sweep', 'lunge', 'guard']);
  assert.equal(p.fallback(next.id), false);
  const exhausted = new Progression();
  exhausted.element = 'fire';
  exhausted.affinityRank = 3;
  exhausted.ranks = { damage: 3, vitality: 3, speed: 3, collection: 3 };
  exhausted.gain(4);
  const empty = exhausted.choice()!;
  assert.deepEqual(empty.options, []);
  assert.equal(exhausted.fallback(empty.id), true);
  assert.equal(exhausted.fallback(empty.id), false);
  assert.equal(exhausted.pending, 0);
});
test('modern general upgrades affect live stats and vitality heals only its increment', () => {
  const run = new Run(PLAY_AREA, []);
  run.combat.hp = 35;
  run.progression.gain(20000);
  for (let turns = 0; turns < 300 && UPGRADE_IDS.some(id => run.progression.ranks[id] < 4); turns++) {
    const choice = run.progression.choice()!;
    assert.ok(choice);
    const selected =
      choice.options.find(id => UPGRADE_IDS.includes(id as (typeof UPGRADE_IDS)[number])) ?? choice.options[0];
    assert.ok(run.choose(choice.id, selected));
  }
  for (const id of UPGRADE_IDS) assert.equal(run.progression.ranks[id], 4);
  assert.equal(run.combat.maxHp, 160);
  assert.equal(run.combat.hp, 95);
  assert.equal(run.combat.damageMultiplier, 1.32);
  assert.equal(run.progression.speed, 6.2);
  assert.equal(run.progression.absorbRadius, 3.1);
  assert.equal(run.progression.attractRadius, 4.6);
  assert.equal(run.progression.equippedTechniques.length, 0);
});
test('damage upgrades multiply both real sword hits and whirlwind pulses', () => {
  const c = new Combat(PLAY_AREA, [], [{ x: 0, z: -1 }]);
  c.damageMultiplier = 1.3;
  c.whirlwindCooldown = 999;
  c.attack = { id: 1, yaw: 0, age: HERO_COMBAT.windup - PLAYER.step, hits: new Set() };
  c.step(PLAYER.step, { ...hero });
  const basic = c.takeEvents().find(e => e.type === 'hit' && e.source === 'basic')!;
  assert.ok(Math.abs(basic.amount - 23.4) < 1e-8);
  c.attack = undefined;
  c.whirlwindCooldown = 0;
  c.step(PLAYER.step, { ...hero });
  const wind = c.takeEvents().find(e => e.type === 'hit' && e.source === 'whirlwind')!;
  assert.ok(Math.abs(wind.amount - 15.6) < 1e-8);
});
test('pending choices freeze the run including clocks, enemies, drops and cooldowns', () => {
  const run = new Run(PLAY_AREA, []);
  run.progression.gain(20);
  run.progression.receive([death(99, 2)]);
  const before = JSON.stringify({ combat: run.combat, drops: run.progression.drops });
  for (let i = 0; i < 120; i++) assert.deepEqual(run.step(PLAYER.step, hero), []);
  assert.equal(JSON.stringify({ combat: run.combat, drops: run.progression.drops }), before);
  const state = new PreviewState();
  state.loaded();
  state.resume();
  state.choose();
  state.pause();
  state.resume();
  assert.equal(state.phase, 'choosing');
  assert.equal(state.active, false);
  state.resumeChoice();
  assert.equal(state.active, true);
});
test('simultaneous lethal damage and available level XP resolve to defeat without resurrection', () => {
  const run = new Run(PLAY_AREA, []),
    c = run.combat;
  c.enemies.splice(1);
  Object.assign(c.enemies[0], {
    x: 0,
    z: -1,
    hp: 18,
    attack: { id: 2, yaw: Math.PI, age: SOLDIER.windup - PLAYER.step, hits: new Set() },
  });
  c.hp = 12;
  c.whirlwindCooldown = 999;
  c.attack = { id: 1, yaw: 0, age: HERO_COMBAT.windup - PLAYER.step, hits: new Set() };
  run.progression.gain(3);
  run.progression.receive([death(99)]);
  run.step(PLAYER.step, { ...hero });
  assert.equal(c.status, 'defeat');
  assert.equal(c.hp, 0);
  assert.equal(run.progression.level, 1);
  assert.equal(run.progression.pending, 0);
  assert.equal(run.progression.drops.length, 0);
  c.heal(100);
  c.increaseMaxHp(20);
  assert.equal(c.hp, 0);
  assert.equal(c.maxHp, 100);
  assert.equal(run.choose(1, 'vitality'), false);
  run.progression.gain(100);
  assert.equal(run.progression.level, 1);
});
test('clearing ordinary enemies never ends the timed run or skips pending choices', () => {
  const run = new Run(PLAY_AREA, []);
  run.combat.enemies.forEach(e => {
    e.dead = true;
  });
  run.progression.receive([death(99, 15)]);
  run.step(PLAYER.step, hero);
  assert.equal(run.phase, 'waves');
  assert.equal(run.combat.status, 'running');
  run.progression.gain(4);
  const time = run.combat.time;
  run.step(PLAYER.step, hero);
  assert.equal(run.combat.time, time);
  const choice = run.progression.choice()!;
  assert.ok(run.choose(choice.id, 'fire'));
  run.combat.time = 60;
  run.step(PLAYER.step, hero);
  assert.ok(run.combat.enemies.some(e => e.kind === 'archer'));
  assert.equal(run.combat.status, 'running');
});
test('reinforcement warning prevents targeting, movement and damage until complete', () => {
  const c = new Combat(PLAY_AREA, [], [], false);
  c.addEnemies([{ x: 0, z: -1 }], 1.2);
  assert.equal(chooseTarget(hero, c.enemies, undefined, []), undefined);
  for (let i = 0; i < 60; i++) c.step(PLAYER.step, { ...hero });
  assert.equal(c.hp, 100);
  assert.equal(c.enemies[0].hp, 54);
  assert.equal(c.enemies[0].z, -1);
  assert.equal(c.enemies[0].attack, undefined);
  for (let i = 0; i < 30; i++) c.step(PLAYER.step, { ...hero });
  assert.ok(c.enemies[0].hp < 54);
});
test('a fresh run and essence view reset every transient progression resource', () => {
  const old = new Run(PLAY_AREA, []);
  old.progression.gain(28);
  old.progression.receive([death(1)]);
  const choice = old.progression.choice()!;
  assert.ok(old.choose(choice.id, 'fire'));
  const general = old.progression.choice()!;
  assert.ok(old.choose(general.id, general.options[0]));
  const fresh = new Run(PLAY_AREA, []);
  assert.equal(fresh.combat.maxHp, 100);
  assert.equal(fresh.combat.damageMultiplier, 1);
  assert.equal(fresh.progression.level, 1);
  assert.equal(fresh.progression.xp, 0);
  assert.equal(fresh.progression.pending, 0);
  assert.equal(fresh.wave, 1);
  assert.equal(fresh.progression.speed, 5);
  assert.equal(fresh.progression.drops.length, 0);
  assert.equal(fresh.progression.element, undefined);
  assert.equal(fresh.progression.mastery, false);
  assert.equal(fresh.progression.core, false);
  const scene = new THREE.Scene(),
    view = createEssenceView(scene);
  view.update(old.progression.drops, 1);
  assert.equal(scene.children[0].children.length, 1);
  view.update([], 1);
  assert.equal(scene.children[0].children.length, 0);
  view.update(old.progression.drops, 2);
  view.reset();
  assert.equal(scene.children[0].children.length, 0);
  view.dispose();
  assert.equal(scene.children.length, 0);
});
