import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Combat } from '../src/domain/combat.ts';
import { ElementalEffects } from '../src/domain/elements.ts';
import { Progression } from '../src/domain/progression.ts';
import { Run } from '../src/domain/run.ts';
import { MouseLook } from '../src/input/mouse-look.ts';
import { PLAYER, PLAY_AREA } from '../src/content/config.ts';
import { HERO_COMBAT, SOLDIER } from '../src/content/combat.ts';
import { splitDirectDamage } from '../src/content/elements.ts';
import type { Element, ElementalLoadout } from '../src/content/elements.ts';
import { createElementView } from '../src/rendering/elements.ts';
import { overlaps } from '../src/domain/movement.ts';
const hero = { x: 0, z: 0, yaw: 0 };
const fire: ElementalLoadout = { element: 'fire', rank: 1, mastery: false };
const water: ElementalLoadout = { element: 'water', rank: 1, mastery: false };
function fixture(element?: Element, mastery = false) {
  const c = new Combat(PLAY_AREA, [], [{ x: 0, z: -1 }], false);
  c.loadout = { element, rank: element ? 3 : 0, mastery }; c.whirlwindCooldown = 999; c.cooldown = 999;
  c.enemies[0].hp = 1000; c.enemies[0].cooldown = 999; return c;
}
function strike(c: Combat, id = 900) { c.attack = { id, yaw: 0, age: HERO_COMBAT.windup - PLAYER.step, hits: new Set() }; c.step(PLAYER.step, { ...hero }); return c.takeEvents(); }
function tick(c: Combat, count: number) { const events = []; for (let i = 0; i < count; i++) { c.step(PLAYER.step, { ...hero }); events.push(...c.takeEvents()); } return events; }

test('level two selects one affinity and later offers only its upgrades', () => {
  const p = new Progression(); p.gain(20); const first = p.choice()!;
  assert.equal(first.kind, 'element'); assert.deepEqual(first.options, ['fire', 'water', 'earth', 'air']);
  assert.equal(p.choose(first.id, 'damage'), false); assert.ok(p.choose(first.id, 'water'));
  assert.equal(p.affinityRank, 1); assert.equal(p.choose(first.id, 'fire'), false);
  const next = p.choice()!; assert.equal(next.kind, 'upgrade'); assert.equal(next.options.length, 3);
  assert.ok(next.options.includes('affinity')); assert.ok(!next.options.includes('fire'));
  assert.ok(p.choose(next.id, 'affinity')); assert.equal(p.affinityRank, 2);
});
test('mastery requires both prerequisites in either order and consumes neither XP nor a level choice', () => {
  for (const coreFirst of [true, false]) {
    const p = new Progression(); p.gain(28); if (coreFirst) p.grantCore();
    p.choose(p.choice()!.id, 'fire'); p.choose(p.choice()!.id, 'affinity');
    assert.equal(p.mastery, false); assert.equal(p.choice()!.kind, 'upgrade');
    p.choose(p.choice()!.id, 'affinity'); if (!coreFirst) { assert.equal(p.choice()!.kind, 'upgrade'); p.grantCore(); }
    const master = p.choice()!; assert.equal(master.kind, 'mastery'); assert.equal(p.pending, 2);
    p.grantCore(); assert.equal(p.choice()!.id, master.id); assert.ok(p.choose(master.id, 'mastery'));
    assert.equal(p.choose(master.id, 'mastery'), false); assert.equal(p.core, false); assert.equal(p.mastery, true);
    assert.equal(p.pending, 1); assert.equal(p.choice()!.level, 5); assert.equal(p.totalEssence, 28);
    p.grantCore(); assert.equal(p.core, false); assert.equal(p.pending, 1);
  }
});
test('an elite death drops eight essence and a core, awarded only upon collection', () => {
  const p = new Progression();
  const event = { id: 90, type: 'death' as const, target: 90, amount: 0, x: 10, z: 0, reward: 8, core: true, enemyKind: 'elite' as const };
  p.receive([event, event]); assert.equal(p.drops.length, 1); assert.equal(p.core, false);
  p.step(PLAYER.step, hero, []); assert.equal(p.totalEssence, 0);
  p.step(PLAYER.step, { x: 10, z: 0 }, []); assert.equal(p.core, true); assert.equal(p.totalEssence, 8);
  p.receive([event]); p.step(PLAYER.step, hero, []); assert.equal(p.totalEssence, 8);
});
test('direct elemental conversion preserves the total physical-plus-elemental budget', () => {
  for (const element of ['fire', 'water'] as const) for (let rank = 1; rank <= 3; rank++) {
    const split = splitDirectDamage(18, { element, rank, mastery: false });
    assert.ok(Math.abs(split.physical + split.elemental - 18) < 1e-8);
    const c = fixture(element); c.loadout.rank = rank;
    const hits = strike(c).filter(e => e.type === 'hit' && e.source === 'basic');
    assert.equal(hits.length, 1); assert.equal(hits[0].amount, 18); assert.equal(c.enemies[0].hp, 982);
  }
});
test('burn lasts three seconds with six periodic ticks and no new momentum', () => {
  const c = fixture('fire'); strike(c); const stacks = c.impetusStacks;
  const events = tick(c, 180), burns = events.filter(e => e.type === 'hit' && e.source === 'burn');
  assert.equal(burns.length, 6); assert.ok(Math.abs(burns.reduce((sum, e) => sum + e.amount, 0) - 5.4) < 1e-8);
  assert.equal(c.enemies[0].burn, undefined); assert.ok(c.impetusStacks <= stacks);
  assert.equal(tick(c, 60).some(e => e.source === 'burn'), false);
});
test('burn refresh keeps the highest potency and does not reset its next tick', () => {
  const c = fixture(), e = c.enemies[0], fx = c.elementalEffects;
  fx.direct(e, 'basic', 40, 1, hero, [e], { ...fire, rank: 3 });
  fx.update(.3, [e]); fx.direct(e, 'whirlwind', 12, 2, hero, [e], fire);
  assert.equal(e.burn!.dps, 4); assert.equal(e.burn!.remaining, 3);
  assert.equal(fx.update(.2, [e]).length, 1); assert.equal(e.burn!.dps, 4);
  fx.direct(e, 'burn', 999, 3, hero, [e], fire); assert.equal(e.burn!.dps, 4);
});
test('a periodic burn kill emits one death and never damages the corpse again', () => {
  const c = fixture('fire'); const e = c.enemies[0]; e.hp = 1; e.burn = { dps: 4, remaining: 3, clock: .5 - PLAYER.step, attackId: 42 };
  const events = tick(c, 120); assert.equal(c.kills, 1); assert.equal(events.filter(e => e.type === 'death').length, 1); assert.equal(e.burn, undefined);
  assert.equal(events.filter(e => e.source === 'burn').length, 1);
});
test('fire death explosions respect walls and never chain through an already burning victim', () => {
  const c = new Combat(PLAY_AREA, [], [{ x: 0, z: -1 }, { x: 1.5, z: -1 }, { x: 3, z: -1 }], false);
  c.loadout = { ...fire, rank: 3, mastery: true }; c.cooldown = 999; c.whirlwindCooldown = 999;
  c.enemies.forEach(e => { e.cooldown = 999; });
  c.enemies[0].hp = 1; c.enemies[0].burn = { dps: 4, remaining: 3, clock: .5 - PLAYER.step, attackId: 1 };
  c.enemies[1].hp = 5; c.enemies[1].burn = { dps: 1, remaining: 3, clock: 0, attackId: 2 };
  const events = tick(c, 1);
  assert.equal(c.kills, 2); assert.equal(events.filter(e => e.type === 'explosion').length, 1);
  assert.equal(c.enemies[2].hp, 54); assert.equal(c.enemies[2].burn, undefined);
  const wall = [{ min: { x: .5, z: -4 }, max: { x: .7, z: 4 } }];
  const fx = new ElementalEffects(PLAY_AREA, wall); c.enemies[0].burn = { dps: 4, remaining: 2, clock: 0, attackId: 1 };
  c.enemies[2].x = 1.5; c.enemies[2].z = -1;
  assert.equal(new ElementalEffects(PLAY_AREA, []).explosions([c.enemies[0]], [c.enemies[2]], new Map(), c.loadout).hits.length, 1);
  assert.equal(fx.explosions([c.enemies[0]], [c.enemies[2]], new Map(), c.loadout).hits.length, 0);
});
test('fire mastery changes the next Torbellino to eight pulses over 3.2 seconds', () => {
  const c = fixture('fire', true); c.whirlwindCooldown = 0;
  const events = tick(c, 193);
  assert.equal(events.filter(e => e.type === 'whirlwind-pulse').length, 8);
  assert.equal(c.whirlwind, undefined); assert.ok(c.whirlwindCooldown > 19.9);
  assert.equal(c.impetusStacks, 0);
});
test('an active swing and whirlwind retain the loadout they started with', () => {
  const c = fixture(); c.whirlwindCooldown = 0; c.step(PLAYER.step, { ...hero }); c.takeEvents();
  c.loadout = { ...fire, rank: 3, mastery: true };
  const events = tick(c, 144); assert.equal(events.filter(e => e.type === 'whirlwind-pulse').length, 5);
  assert.equal(c.enemies[0].burn, undefined); assert.equal(c.whirlwind, undefined);
  c.cooldown = 0; c.step(PLAYER.step, { ...hero }); c.loadout = { ...water, rank: 3, mastery: true };
  tick(c, 8); assert.ok(c.enemies[0].burn); assert.equal(c.enemies[0].wetRemaining, 0);
});
test('wet slows actual pursuit by 15 percent and expires without stacking', () => {
  const dry = new Combat(PLAY_AREA, [], [{ x: 0, z: -8 }], false), wet = new Combat(PLAY_AREA, [], [{ x: 0, z: -8 }], false);
  wet.enemies[0].wetRemaining = 3;
  tick(dry, 60); tick(wet, 60);
  const ratio = (wet.enemies[0].z + 8) / (dry.enemies[0].z + 8); assert.ok(Math.abs(ratio - .85) < 1e-8);
  const e = wet.enemies[0]; wet.elementalEffects.direct(e, 'whirlwind', 12, 1, hero, [e], water);
  assert.equal(e.wetRemaining, 3); wet.elementalEffects.update(3, [e]); assert.equal(e.wetRemaining, 0);
});
test('water push is bounded, protected for half a second and blocked by architecture', () => {
  const wall = { min: { x: 1.6, z: -4 }, max: { x: 2, z: 4 } };
  const c = new Combat(PLAY_AREA, [wall], [{ x: 1, z: 0 }], false), e = c.enemies[0], fx = c.elementalEffects;
  fx.direct(e, 'basic', 18, 1, hero, [e], { ...water, rank: 3 });
  assert.equal(overlaps(e, SOLDIER.radius, wall), false); assert.ok(e.x <= 1.24 + 1e-6);
  const first = e.x; fx.direct(e, 'basic', 18, 2, hero, [e], water); assert.equal(e.x, first);
  assert.equal(e.pushProtection, .5); fx.update(.5, [e]); assert.equal(e.pushProtection, 0);
  e.x = 0; e.z = -1; fx.direct(e, 'basic', 18, 3, hero, [e], { ...water, rank: 3 }); assert.ok(Math.abs(e.z + 1.5) < 1e-8);
});
test('splash needs an already wet primary, excludes it, and triggers at most once per second', () => {
  const c = new Combat(PLAY_AREA, [], [{ x: 0, z: -1 }, { x: 1, z: -1 }], false), [primary, neighbour] = c.enemies;
  const loadout = { ...water, rank: 3, mastery: true }, fx = c.elementalEffects;
  assert.equal(fx.direct(primary, 'basic', 18, 1, hero, c.enemies, loadout).hits.length, 0);
  const second = fx.direct(primary, 'basic', 18, 2, hero, c.enemies, loadout);
  assert.equal(second.hits.length, 1); assert.equal(second.hits[0].target.id, neighbour.id); assert.equal(second.hits[0].amount, 8);
  assert.equal(neighbour.wetRemaining, 3);
  assert.equal(fx.direct(neighbour, 'basic', 18, 3, hero, c.enemies, loadout).hits.length, 0);
  fx.update(1, c.enemies); assert.equal(fx.direct(neighbour, 'splash', 8, 4, hero, c.enemies, loadout).hits.length, 0);
  assert.equal(fx.direct(neighbour, 'whirlwind', 12, 5, hero, c.enemies, loadout).hits.length, 0);
  assert.equal(fx.direct(neighbour, 'basic', 18, 6, hero, c.enemies, loadout).hits.length, 1);
});
test('splash cannot cross walls and water never heals or freezes', () => {
  const c = new Combat(PLAY_AREA, [{ min: { x: .5, z: -4 }, max: { x: .6, z: 4 } }], [{ x: 0, z: -1 }, { x: 1, z: -1 }], false);
  const e = c.enemies[0]; e.wetRemaining = 3; c.hp = 37;
  const result = c.elementalEffects.direct(e, 'basic', 18, 1, hero, c.enemies, { ...water, rank: 3, mastery: true });
  assert.equal(result.hits.length, 0); assert.equal(c.hp, 37); assert.equal(c.enemies[1].wetRemaining, 0);
});
test('water mastery acquires enemies in its enlarged radius, without sword splash', () => {
  const c = new Combat(PLAY_AREA, [], [{ x: 0, z: -3.4 }], false); c.loadout = { ...water, rank: 3, mastery: true };
  c.enemies[0].wetRemaining = 3; c.enemies[0].cooldown = 999;
  c.step(PLAYER.step, { ...hero }); const events = c.takeEvents();
  assert.ok(c.whirlwind); assert.equal(c.whirlwind.radius, 3.12); assert.equal(c.enemies[0].hp, 42);
  assert.equal(events.some(e => e.type === 'splash'), false); assert.equal(c.enemies[0].pushProtection, 0);
});
test('defeat wins simultaneous burn death and cancels mastery rewards', () => {
  const run = new Run(PLAY_AREA, []), c = run.combat; c.enemies.splice(1); c.hp = 12; c.cooldown = 999; c.whirlwindCooldown = 999;
  c.loadout = { ...fire, rank: 3, mastery: true };
  Object.assign(c.enemies[0], { x: 0, z: -1, hp: 1, burn: { dps: 4, remaining: 3, clock: .5 - PLAYER.step, attackId: 1 }, attack: { id: 2, yaw: Math.PI, age: SOLDIER.windup - PLAYER.step, hits: new Set() } });
  const events = run.step(PLAYER.step, { ...hero });
  assert.equal(c.status, 'defeat'); assert.equal(c.kills, 1); assert.equal(events.some(e => e.type === 'explosion'), false);
  assert.equal(run.progression.totalEssence, 0); assert.equal(run.progression.pending, 0);
});
test('element effects freeze with pending choices and reset with a fresh run', () => {
  const run = new Run(PLAY_AREA, []); run.progression.gain(4); run.choose(run.progression.choice()!.id, 'fire');
  run.combat.enemies[0].burn = { dps: 4, remaining: 3, clock: .1, attackId: 2 }; run.combat.elementalEffects.splashRemaining = .8;
  run.progression.gain(run.progression.threshold); const before = JSON.stringify(run.combat.enemies);
  for (let i = 0; i < 120; i++) run.step(PLAYER.step, { ...hero });
  assert.equal(JSON.stringify(run.combat.enemies), before); assert.equal(run.combat.elementalEffects.splashRemaining, .8);
  const fresh = new Run(PLAY_AREA, []); assert.equal(fresh.combat.loadout.element, undefined); assert.equal(fresh.combat.elementalEffects.splashRemaining, 0);
  assert.ok(fresh.combat.enemies.every(e => !e.burn && !e.wetRemaining && !e.pushProtection));
});
test('element visuals consume events, freeze, reset and release their scene objects', () => {
  const scene = new THREE.Scene(), view = createElementView(scene), c = fixture('fire', true);
  const permanent = scene.children[0].children.length;
  strike(c); view.events([{ id: 1, type: 'explosion', target: 0, amount: 1.8, x: 0, z: 0 }]);
  view.update(c, new THREE.Vector3(), 1, 0);
  assert.ok(scene.children[0].children.length >= 4); const before = scene.toJSON(); view.update(c, new THREE.Vector3(), 1, 0);
  assert.deepEqual(scene.toJSON(), before); view.reset(); assert.equal(scene.children[0].children.length, permanent);
  assert.ok(scene.children[0].children.every(object => !object.visible));
  view.dispose(); assert.equal(scene.children.length, 0);
});
test('mouse motion rotates without a button and never drifts across pauses or UI', () => {
  const look = new MouseLook(), sample = { x: 20, y: 20, dx: 12, dy: -3, active: true, locked: true, overScene: true };
  assert.deepEqual(look.move(sample), { dx: 12, dy: -3 });
  assert.equal(look.move({ ...sample, active: false }), undefined);
  assert.equal(look.move({ ...sample, locked: false }), undefined);
  assert.deepEqual(look.move({ ...sample, locked: false, x: 24, y: 25 }), { dx: 4, dy: 5 });
  assert.equal(look.move({ ...sample, locked: false, overScene: false }), undefined);
  assert.equal(look.move({ ...sample, locked: false, x: 900 }), undefined);
  look.clear(); assert.equal(look.move({ ...sample, locked: false }), undefined);
});
