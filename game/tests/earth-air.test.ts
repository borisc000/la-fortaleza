import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Combat } from '../src/domain/combat.ts';
import { WarriorKit } from '../src/domain/classes/warrior-kit.ts';
import { WarriorEffects } from '../src/domain/classes/warrior-effects.ts';
import { Run } from '../src/domain/run.ts';
import { Progression } from '../src/domain/progression.ts';
import { classAffinity } from '../src/content/class-definition.ts';
import { MAGE } from '../src/content/classes/mage.ts';
import { ARCHER } from '../src/content/classes/archer.ts';
import { WARRIOR_KIT as K } from '../src/content/classes/warrior.ts';
import { SIMULATION_STEP as dt } from '../src/content/config.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { overlaps } from '../src/domain/movement.ts';
import type { HeroKitContext, HeroHit } from '../src/domain/hero-kit.ts';
import type { CombatEvent } from '../src/domain/combat.ts';
import type { Element } from '../src/content/elements.ts';
import { createElementView } from '../src/rendering/elements.ts';
import { AudioFeedback } from '../src/audio/game-audio.ts';

const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, hero = { x: 0, z: 0, yaw: 0 };
function fixture(element: Element, rank = 1, mastery = false, positions = [{ x: 0, z: -1.5 }]) {
  const combat = new Combat(bounds, [], positions, false), kit = new WarriorKit(), events: CombatEvent[] = []; let id = 0;
  const context: HeroKitContext = { hero: { ...hero }, alive: combat.enemies, solids: [], damageMultiplier: 1, loadout: { element, rank, mastery }, nextId: () => ++id, emit: (type, target, amount, point, source, attackId) => events.push({ id: ++id, type, target, amount, ...point, source, attackId }) };
  function step(count = 1) { const hits: HeroHit[] = []; for (let i = 0; i < count; i++) { kit.advance(dt); hits.push(...kit.act(context)); kit.finishStep(); } return hits; }
  return { combat, kit, events, context, step };
}

test('all three classes offer four affinities in their respective selection stage', () => {
  const p = new Progression(); p.gain(4); assert.deepEqual(p.choice()!.options, ['fire', 'water', 'earth', 'air']);
  assert.ok(p.choose(p.choice()!.id, 'earth')); assert.equal(p.element, 'earth'); assert.equal(p.affinityRank, 1);
  assert.equal(p.option('affinity').symbol, '◆');
  const archer = new Progression(ARCHER); archer.gain(4); assert.deepEqual(archer.choice()!.options, ['fire', 'water', 'earth', 'air']);
  assert.equal(archer.choose(archer.choice()!.id, 'air'), true); assert.ok(classAffinity(ARCHER, 'air').mastery);
  assert.equal(new Progression(MAGE, 'earth').element, 'earth'); assert.throws(() => new Progression(MAGE));
  const mage = new Progression(MAGE, 'water'); mage.gain(4); assert.equal(mage.choice()!.kind, 'upgrade');
});

test('Quebranto affects subsequent damage by 15%, refreshes without stacking and expires', () => {
  const c = new Combat(bounds, [], [{ x: 0, z: -1 }], false); c.whirlwindCooldown = 999; c.loadout = { element: 'earth', rank: 1, mastery: false };
  const e = c.enemies[0]; e.hp = e.maxHp = 1000;
  const strike = () => { c.attack = { id: 700, yaw: 0, age: .12 - dt, hits: new Set(), multiplier: 1, loadout: { ...c.loadout } }; c.cooldown = 999; const before = e.hp; c.step(dt, hero); return before - e.hp; };
  assert.equal(strike(), 18); assert.equal(e.brokenRemaining, 3);
  assert.ok(Math.abs(strike() - 20.7) < 1e-8); assert.equal(e.brokenRemaining, 3);
  assert.ok(Math.abs(strike() - 20.7) < 1e-8);
  c.attack = undefined; c.loadout = { rank: 0, mastery: false };
  for (let i = 0; i < 180; i++) c.step(dt, { x: 8, z: 8, yaw: 0 });
  assert.equal(e.brokenRemaining, undefined);
});

test('stone protection is granted once per cleave, has rank values, expires and cannot refresh before its cooldown', () => {
  for (let rank = 1; rank <= 3; rank++) {
    const f = fixture('earth', rank, false, [{ x: -.2, z: -1.5 }, { x: .2, z: -1.5 }]); f.kit.state.skillCooldown = 999;
    f.step(10); assert.equal(f.events.filter(e => e.type === 'stone-guard').length, 1); assert.equal(f.kit.state.barrier?.amount, K.earth.guard[rank - 1]);
    f.kit.state.barrier!.amount = 1; f.step(60); assert.equal(f.kit.state.barrier?.amount, 1);
    f.context.alive = []; f.step(180); assert.equal(f.kit.state.barrier, undefined); assert.ok(f.kit.state.barrierCooldown! > 0);
    f.step(150); f.context.alive = f.combat.enemies; f.step(40); assert.equal(f.kit.state.barrier?.amount, K.earth.guard[rank - 1]);
  }
});

test('stone protection absorbs actual incoming damage including projectiles and does not heal or provide unlimited immunity', () => {
  const c = new Combat(bounds, [], [{ x: 0, z: -.95 }], false); c.cooldown = c.whirlwindCooldown = 999;
  c.heroKit.state.barrier = { amount: 8, remaining: 4 }; c.enemies[0].attack = { id: 2, yaw: Math.PI, age: .6 - dt, hits: new Set() };
  c.step(dt, hero); const events = c.takeEvents(); assert.equal(c.hp, 96); assert.equal(c.heroKit.state.barrier, undefined);
  assert.equal(events.find(e => e.type === 'guard-block')!.amount, 8); assert.equal(events.find(e => e.type === 'hit' && e.target === 0)!.amount, 4);
  c.protection = 0; c.enemies[0].attack = undefined; c.enemies[0].cooldown = 999;
  c.heroKit.state.barrier = { amount: 16, remaining: 4 }; c.projectiles.fire({ x: 0, z: -.5 }, Math.PI, 1, 10);
  c.step(dt, hero); assert.equal(c.hp, 96); assert.equal(c.heroKit.state.barrier?.amount, 6);
  c.protection = 0; c.heroKit.state.barrier!.remaining = dt / 2; c.projectiles.fire({ x: 0, z: -.5 }, Math.PI, 1, 10);
  c.step(dt, hero); assert.equal(c.hp, 86); assert.equal(c.heroKit.state.barrier, undefined);
});

test('Earth mastery releases exactly three extra seismic waves with obstacles and no recursive effects', () => {
  const f = fixture('earth', 3, true, [{ x: 0, z: -1.5 }, { x: 3.2, z: 0 }, { x: -3, z: 0 }]);
  f.context.solids = [{ min: { x: -2, y: 0, z: -2 }, max: { x: -1.8, y: 2, z: 2 } }];
  const hits = f.step(145).filter(h => h.source === 'quake');
  assert.equal(f.events.filter(e => e.type === 'quake').length, 3); assert.equal(hits.length, 6);
  assert.ok(hits.every(h => h.target?.id !== 3 && h.amount === 8)); assert.equal(f.kit.state.area, undefined);
  assert.equal(f.kit.state.barrier, undefined, 'Pulses do not generate the protection reserved for basic hits');
});

test('Air extends basic reach by rank and preserves the reach of an already prepared swing', () => {
  for (let rank = 1; rank <= 3; rank++) {
    const f = fixture('air', rank, false, [{ x: 0, z: -(2 + K.air.reach[rank - 1] + .3) }]); f.kit.state.skillCooldown = 999;
    f.step(); assert.equal(f.kit.state.attack?.range, 2 + K.air.reach[rank - 1]);
    f.context.loadout = { element: 'water', rank: 1, mastery: false };
    const hits = f.step(9); assert.equal(hits.length, 1); assert.equal(hits[0].loadout?.element, 'air');
  }
});

test('Air displacements respect normal/elite/boss resistance and cannot cancel prepared enemy attacks', () => {
  const c = new Combat(bounds, [], [], false); const effects = new WarriorEffects(bounds, []);
  for (const kind of ['soldier', 'elite', 'boss'] as const) c.addEnemies([{ x: 0, z: -2 }], 0, kind);
  for (const e of c.enemies) {
    e.attack = { id: 10, yaw: 0, age: .2, hits: new Set() }; const attack = e.attack;
    effects.direct(e, 'basic', 18, 1, hero, c.enemies, { element: 'air', rank: 3, mastery: false });
    assert.ok(Math.abs(e.z - (-2 - .65 * ENEMIES[e.kind].push)) < 1e-8); assert.equal(e.attack, attack);
    const z = e.z; effects.direct(e, 'basic', 18, 2, hero, c.enemies, { element: 'air', rank: 3, mastery: false }); assert.equal(e.z, z);
  }
  assert.equal(c.enemies[2].z, -2); assert.equal(c.enemies[2].wetRemaining, 0);
});

test('Air pull has a repetition limit, stops outside the hero and gains mastery radius', () => {
  const f = fixture('air', 3, true, [{ x: 0, z: -2 }]); f.step(); assert.equal(f.kit.state.area!.radius, 3.25);
  const e = f.combat.enemies[0], effects = new WarriorEffects(bounds, []);
  effects.direct(e, 'whirlwind', 12, 1, hero, [e], f.context.loadout); assert.ok(Math.abs(e.z + 1.55) < 1e-8);
  effects.direct(e, 'whirlwind', 12, 2, hero, [e], f.context.loadout); assert.ok(Math.abs(e.z + 1.55) < 1e-8);
  for (let i = 0; i < 20; i++) { effects.update(.4, [e]); effects.direct(e, 'whirlwind', 12, 3 + i, hero, [e], f.context.loadout); }
  assert.ok(Math.hypot(e.x, e.z) >= .4 + e.radius + .08 - 1e-8); assert.equal(e.brokenRemaining, undefined);
});

test('repeated Air push and pull cannot cross thin walls, bounds or pull through obstacles', () => {
  const wall = { min: { x: -3, y: 0, z: -2.5 }, max: { x: 3, y: 2, z: -2.48 } };
  const f = fixture('air'), e = f.combat.enemies[0], effects = new WarriorEffects(bounds, [wall]);
  for (let i = 0; i < 30; i++) { effects.update(.8, [e]); effects.direct(e, 'basic', 18, i, hero, [e], { element: 'air', rank: 3, mastery: true }); assert.equal(overlaps(e, e.radius, wall), false); assert.ok(e.z > wall.max.z); }
  e.z = -3; e.pushProtection = 0; effects.direct(e, 'whirlwind', 12, 31, hero, [e], { element: 'air', rank: 3, mastery: true }); assert.equal(e.z, -3);
  const open = new WarriorEffects(bounds, []); e.z = -9.5; e.pushProtection = 0; open.direct(e, 'basic', 18, 32, hero, [e], { element: 'air', rank: 3, mastery: true }); assert.ok(e.z >= bounds.minZ + e.radius - 1e-7);
});

test('Earth barrier and Quebranto freeze during upgrade/shop pauses and disappear on defeat or retirement', () => {
  const run = new Run(bounds, [], 3, undefined, undefined, TRAINING_EXPEDITION); run.combat.loadout = { element: 'earth', rank: 3, mastery: true };
  run.combat.heroKit.state.barrier = { amount: 12, remaining: 3 }; const e = run.combat.enemies[0]; e.brokenRemaining = 3;
  run.progression.gain(4); const before = JSON.stringify(run.combat.heroKit.state); run.step(2, hero);
  assert.equal(JSON.stringify(run.combat.heroKit.state), before); assert.equal(e.brokenRemaining, 3);
  run.choose(run.progression.choice()!.id, 'earth'); run.shop.open(); run.step(2, hero); assert.equal(e.brokenRemaining, 3); run.shop.close();
  run.combat.retireNormal(e); assert.equal(e.brokenRemaining, undefined);
  run.combat.hp = 0; run.step(dt, hero); assert.equal(run.combat.status, 'defeat'); assert.equal(run.combat.heroKit.state.barrier, undefined);
  const fresh = new Run(bounds, [], 3, undefined, undefined, TRAINING_EXPEDITION); assert.equal(fresh.combat.heroKit.state.barrier, undefined); assert.equal(fresh.progression.element, undefined);
});

test('Earth/Air visuals and audio have distinct cues and dispose their temporary representations', () => {
  const scene = new THREE.Scene(), view = createElementView(scene), c = new Combat(bounds, [], [{ x: 0, z: -2 }], false);
  c.loadout = { element: 'earth', rank: 3, mastery: true }; c.heroKit.state.barrier = { amount: 16, remaining: 4 }; c.enemies[0].brokenRemaining = 3;
  const events: CombatEvent[] = [{ id: 1, type: 'quake', target: 0, amount: 3.2, x: 0, z: 0 }, { id: 2, type: 'gust', target: 0, amount: .7, x: 0, z: -2 }];
  view.events(events); view.update(c, new THREE.Vector3(), .5, dt);
  assert.ok(scene.getObjectByName('Quebranto')?.visible); assert.ok(scene.getObjectByName('Protección pétrea')?.visible);
  const run = new Run(bounds, [], 3, undefined, undefined, TRAINING_EXPEDITION), cues: string[] = []; new AudioFeedback().update(run, events, cue => cues.push(cue)); assert.deepEqual(cues, ['stone', 'gust']);
  view.reset(); assert.equal(scene.getObjectByName('Protección pétrea')!.visible, false); view.dispose(); assert.equal(scene.children.length, 0);
});

for (const element of ['earth', 'air'] as const) test(`Warrior ${element} reaches mastery through progression and clears a short encounter with normal HP`, () => {
  const run = new Run(bounds, [], 3, undefined, undefined, TRAINING_EXPEDITION); run.progression.gain(4); assert.ok(run.choose(run.progression.choice()!.id, element));
  run.progression.gain(1000); while (run.progression.pending) { const ch = run.progression.choice()!; assert.ok(run.choose(ch.id, ch.options.includes('affinity') ? 'affinity' : ch.options[0])); }
  run.progression.grantCore(); assert.equal(run.progression.choice()!.kind, 'mastery'); assert.ok(run.choose(run.progression.choice()!.id, 'mastery')); assert.ok(run.progression.mastery);
  const c = new Combat(bounds, [], [{ x: 0, z: -2 }, { x: -.6, z: -2 }, { x: .6, z: -2 }]); c.loadout = { element, rank: 3, mastery: true };
  for (let i = 0; i < 3600 && c.status === 'running'; i++) c.step(dt, hero);
  assert.equal(c.status, 'victory'); assert.equal(c.kills, 3); assert.ok(c.hp > 0); assert.equal(c.maxHp, 100);
});
