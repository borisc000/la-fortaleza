import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RELICS, RELIC_IDS, isRelic } from '../src/content/relics.ts';
import { ELEMENTS } from '../src/content/elements.ts';
import type { Element } from '../src/content/elements.ts';
import { Progression, secondaryElement } from '../src/domain/progression.ts';
import type { ChoiceOption } from '../src/domain/progression.ts';
import { Combat } from '../src/domain/combat.ts';
import { Run } from '../src/domain/run.ts';
import { classRuntime } from '../src/domain/classes.ts';
import { syncLoadout } from '../src/domain/loadout.ts';
import { ExpeditionShop } from '../src/domain/shop.ts';
import { SIMULATION_STEP as dt } from '../src/content/config.ts';
import { secondaryEffects, primaryEffectDamage } from '../src/domain/secondary-effects.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { createElementView } from '../src/rendering/elements.ts';
import { affinitySummary, relicSummary } from '../src/app/relics.ts';

const bounds = { minX: -15, maxX: 42, minZ: -15, maxZ: 42 }, hero = { x: 0, z: 0, yaw: 0 };
function progress(primary: Element = 'fire', classId: 'warrior' | 'mage' | 'archer' = 'mage') {
  const p = new Progression(classRuntime(classId).definition, primary); p.element = primary; p.affinityRank = 3; return p;
}
function learnSecondary(p: Progression, element: Element) {
  p.gain(1200); let count = 0;
  while (p.secondaryRank < 3 && count++ < 50) {
    const c = p.choice()!;
    const option = c.options.find(id => secondaryElement(id) === element) ?? (c.options.includes('secondary-affinity') ? 'secondary-affinity' : c.options.find(id => !secondaryElement(id)));
    if (option) assert.ok(p.choose(c.id, option)); else assert.ok(p.fallback(c.id));
  }
  assert.equal(p.secondaryElement, element); assert.equal(p.secondaryRank, 3);
}
test('twelve immutable relics, four slots, no duplicates, eligibility follows either affinity', () => {
  assert.equal(RELIC_IDS.length, 12); assert.ok(Object.values(RELICS).every(Object.isFrozen));
  const p = progress('water'); assert.ok(p.relicReason('relic_ember')); assert.equal(p.equipRelic('relic_ember'), false);
  p.secondaryElement = 'fire'; p.secondaryRank = 1; assert.ok(p.equipRelic('relic_ember'));
  for (const id of ['relic_edge', 'relic_heart', 'relic_shell'] as const) assert.ok(p.equipRelic(id));
  assert.equal(p.equipRelic('relic_edge'), false); assert.equal(p.equipRelic('relic_boots'), false); assert.equal(p.relics.length, 4); assert.ok(Object.isFrozen(p.relics));
  assert.ok(p.relicReason('forged' as never));
});

test('pure seal and concord require their respective builds; pure seal prevents a second affinity', () => {
  const p = progress(); assert.ok(p.equipRelic('relic_solitude')); assert.equal(p.equipRelic('relic_concord'), false); p.gain(400);
  while (p.pending) { const c = p.choice()!; assert.ok(!c.options.some(id => secondaryElement(id))); if (c.options.length) p.choose(c.id, c.options[0]); else p.fallback(c.id); }
  assert.equal(p.secondaryElement, undefined); assert.ok(p.damageMultiplier >= 1.15);
  const dual = progress(); dual.secondaryElement = 'water'; dual.secondaryRank = 1; assert.equal(dual.equipRelic('relic_solitude'), false); assert.ok(dual.equipRelic('relic_concord')); assert.equal(dual.damageMultiplier, 1.12);
});

test('second affinity starts at level five, costs a choice, upgrades to III and cannot add a third or replace the primary', () => {
  for (const primary of Object.keys(ELEMENTS) as Element[]) for (const second of Object.keys(ELEMENTS) as Element[]) if (primary !== second) {
    const p = progress(primary); p.gain(20);
    while (p.pending) { const c = p.choice()!; assert.ok(c.level < 5); assert.ok(!c.options.some(id => secondaryElement(id))); p.choose(c.id, c.options[0]); }
    learnSecondary(p, second); assert.equal(p.element, primary); p.grantCore(); assert.equal(p.choice()!.kind, 'mastery'); assert.ok(p.choose(p.choice()!.id, 'mastery')); assert.equal(p.mastery, true);
    const current = p.choice()!; for (const other of Object.keys(ELEMENTS)) assert.equal(p.choose(current.id, `secondary_${other}` as ChoiceOption), false);
    assert.equal(p.loadout.secondary!.element, second); assert.ok(Object.isFrozen(p.loadout.secondary));
  }
});

test('all 36 ordered mixed class builds clear a small encounter with one primary mastery and bounded effects', () => {
  for (const cls of ['warrior', 'mage', 'archer'] as const) for (const primary of Object.keys(ELEMENTS) as Element[]) for (const second of Object.keys(ELEMENTS) as Element[]) if (primary !== second) {
    const c = new Combat(bounds, [], [{ x: 0, z: -1.5 }, { x: .4, z: -2 }, { x: -.4, z: -3 }], true, classRuntime(cls));
    c.loadout = { element: primary, rank: 3, mastery: true, secondary: { element: second, rank: 3 } };
    const deaths = new Set<number>();
    for (let i = 0; i < 1800 && c.status === 'running'; i++) { c.step(dt, hero); for (const event of c.takeEvents()) if (event.type === 'death' && event.target > 0) { assert.ok(!deaths.has(event.target)); deaths.add(event.target); } assert.ok((c.heroKit.state.projectiles?.length ?? 0) <= 32); }
    assert.equal(c.status, 'victory', `${cls} ${primary}/${second}`); assert.equal(c.kills, 3); assert.ok(c.hp > 0);
  }
});

test('direct damage is not doubled by mixing; Fire primary burn is 70%, support burns are weaker and never recursively proc', () => {
  const p = progress('fire'); assert.equal(primaryEffectDamage(100, p.loadout), 100);
  p.secondaryElement = 'water'; p.secondaryRank = 3; assert.equal(primaryEffectDamage(100, p.loadout), 70);
  const c = new Combat(bounds, [], [{ x: 0, z: -1 }], false), target = c.enemies[0];
  const loadout = { element: 'water' as const, rank: 3, mastery: true, secondary: { element: 'fire' as const, rank: 3 } };
  secondaryEffects(target, 'basic', 100, 1, hero, hero, loadout, bounds, []); assert.equal(target.burn!.dps, 5); const burn = JSON.stringify(target.burn);
  for (const source of ['burn', 'splash', 'explosion', 'quake'] as const) assert.deepEqual(secondaryEffects(target, source, 500, 2, hero, hero, loadout, bounds, []), []);
  assert.equal(JSON.stringify(target.burn), burn);
  for (const mixed of [false, true]) {
    const combat = new Combat(bounds, [], [{ x: 0, z: -1 }], false); combat.whirlwindCooldown = 999;
    combat.loadout = { element: 'fire', rank: 3, mastery: false, ...(mixed ? { secondary: { element: 'water' as const, rank: 3 } } : {}) };
    combat.attack = { id: 1, yaw: 0, age: .12 - dt, hits: new Set(), multiplier: 1, loadout: combat.loadout };
    combat.step(dt, hero); assert.equal(combat.takeEvents().find(e => e.type === 'hit' && e.source === 'basic')!.amount, 18);
  }
});

test('support Earth affects following damage only; Water/Fire coexist and Air respects resistance and shared protection', () => {
  const c = new Combat(bounds, [], [], false);
  for (const kind of ['soldier', 'elite', 'boss'] as const) c.addEnemies([{ x: 0, z: -2 }], 0, kind);
  for (const e of c.enemies) {
    const l = { element: 'earth' as const, rank: 3, mastery: true, secondary: { element: 'air' as const, rank: 3 } };
    secondaryEffects(e, 'basic', 20, 1, hero, hero, l, bounds, []); assert.ok(Math.abs(e.z + 2 + .22 * ENEMIES[e.kind].push) < 1e-8);
    const z = e.z; secondaryEffects(e, 'basic', 20, 2, hero, hero, l, bounds, []); assert.equal(e.z, z);
    secondaryEffects(e, 'spell', 20, 3, hero, hero, { ...l, secondary: { element: 'water', rank: 3 } }, bounds, []); assert.equal(e.wetRemaining, 1.6);
    secondaryEffects(e, 'spell', 20, 4, hero, hero, { ...l, secondary: { element: 'fire', rank: 3 } }, bounds, []); assert.ok(e.burn); assert.equal(e.wetRemaining, 1.6);
    secondaryEffects(e, 'spell', 20, 5, hero, hero, { ...l, element: 'water', secondary: { element: 'earth', rank: 3 } }, bounds, []); assert.equal(e.brokenRemaining, 1.6);
  }
});

test('stat relics apply once, respect movement limits and keep technique slots independent', () => {
  const p = progress('air'), c = new Combat(bounds, [], [], false, classRuntime('mage')); c.hp = 30;
  for (const id of ['relic_edge', 'relic_heart', 'relic_boots', 'relic_magnet'] as const) assert.ok(p.equipRelic(id));
  syncLoadout(p, c); assert.equal(c.maxHp, 105); assert.equal(c.hp, 55); assert.equal(c.damageMultiplier, 1.12); syncLoadout(p, c); assert.equal(c.maxHp, 105); assert.equal(c.hp, 55);
  assert.equal(p.speed, 5.4); p.ranks.speed = 3; assert.equal(p.speed, 6.5); assert.equal(p.absorbRadius, 2.3); assert.equal(p.attractRadius, 3.8); assert.equal(p.equippedTechniques.length, 0);
  const wind = progress('air'); assert.ok(wind.equipRelic('relic_wind')); assert.equal(wind.speed, 5.5);
});

test('iron medallion combines multiplicatively with Guard and consumes only post-mitigation barrier capacity', () => {
  const c = new Combat(bounds, [], [{ x: 0, z: -.95 }], false); c.techniques = { guard: 3 }; c.relics = ['relic_shell']; c.cooldown = c.whirlwindCooldown = 999;
  c.heroKit.state.barrier = { amount: 8, remaining: 4 }; c.enemies[0].attack = { id: 2, yaw: Math.PI, age: .6 - dt, hits: new Set() };
  c.step(dt, hero); assert.ok(Math.abs(c.hp - 99.36) < 1e-8); assert.equal(c.heroKit.state.barrier, undefined);
});

test('renewal heals once for simultaneous kills, cooldown freezes with no steps and never resurrects a dead hero', () => {
  const c = new Combat(bounds, [], [{ x: -.1, z: -1 }, { x: .1, z: -1 }], false); c.relics = ['relic_mender']; c.hp = 50; c.enemies.forEach(e => e.hp = 1);
  c.step(dt, hero); assert.equal(c.kills, 2); assert.equal(c.hp, 52);
  c.addEnemies([{ x: 0, z: -1 }]); c.enemies[2].hp = 1; for (let i = 0; i < 24; i++) c.step(dt, hero); assert.equal(c.hp, 52);
  const dead = new Combat(bounds, [], [{ x: 0, z: -1 }], false); dead.relics = ['relic_mender']; dead.hp = 12; dead.whirlwindCooldown = 999; dead.enemies[0].hp = 18;
  dead.enemies[0].attack = { id: 2, yaw: Math.PI, age: .6 - dt, hits: new Set() }; dead.attack = { id: 3, yaw: 0, age: .12 - dt, hits: new Set() };
  dead.step(dt, hero); assert.equal(dead.hp, 0); assert.equal(dead.status, 'defeat');
});

test('element relics modify primary and support states without stacking indefinitely', () => {
  const c = new Combat(bounds, [], [{ x: 0, z: -2 }], false), e = c.enemies[0];
  const l = { element: 'earth' as const, rank: 3, mastery: false, relics: ['relic_ember', 'relic_tide', 'relic_stone'] as const };
  for (const element of ['fire', 'water', 'earth'] as const) for (let i = 0; i < 10; i++) secondaryEffects(e, 'spell', 100, i, hero, hero, { ...l, element: 'air', secondary: { element, rank: 3 } }, bounds, []);
  assert.equal(e.burn!.dps, 6.5); assert.equal(e.wetRemaining, 3.1); assert.equal(e.brokenRemaining, 3.1);
  const mage = new Combat(bounds, [], [{ x: 0, z: -2 }], false, classRuntime('mage')); mage.loadout = { element: 'water', rank: 1, mastery: false, relics: ['relic_tide'] };
  for (let i = 0; i < 40; i++) mage.step(dt, hero); assert.equal(mage.enemies[0].wetRemaining, 4.5);
});

test('relic rewards are deterministic, unique, pause the world, consume no level and can be salvaged exactly once', () => {
  const run = new Run(bounds, [], 1, 'mage', 'fire', TRAINING_EXPEDITION), p = run.progression, other = progress();
  assert.ok(p.offerRelics('x', 'Cofre', 19, 11)); other.offerRelics('x', 'Cofre', 19, 11); assert.deepEqual(p.choice()!.options, other.choice()!.options);
  assert.equal(p.offerRelics('x', 'Cofre', 19, 11), false); const c = p.choice()!, time = run.combat.time, level = p.level;
  run.step(5, hero); assert.equal(run.combat.time, time); assert.ok(run.choose(c.id, 'salvage')); assert.equal(run.exploration.coins, 11); assert.equal(run.choose(c.id, 'salvage'), false); assert.equal(p.level, level);
  p.offerRelics('y', 'Cofre', 0, 11); const option = p.choice()!.options.find(isRelic)!; assert.ok(run.choose(p.choice()!.id, option)); assert.ok(p.relics.includes(option)); assert.equal(run.exploration.coins, 11);
});

test('full inventory offers only salvage; queued rewards cannot equip duplicates and death cancels rewards', () => {
  const p = progress(); for (const id of ['relic_edge', 'relic_heart', 'relic_boots', 'relic_shell'] as const) p.equipRelic(id);
  p.offerRelics('a', 'Cofre', 2, 9); assert.deepEqual(p.choice()!.options, ['salvage']); p.stop(); assert.equal(p.pending, 0); assert.equal(p.choice(), undefined);
  const q = progress(); q.offerRelics('one', 'Cofre', 0, 10); q.offerRelics('two', 'Cofre', 0, 10);
  const id = q.choice()!.options.find(isRelic)!; assert.ok(q.choose(q.choice()!.id, id)); assert.ok(!q.choice()!.options.includes(id));
});

test('real chest interaction replaces coins with a choice; replaying E cannot duplicate it', () => {
  const run = new Run(bounds, [], 4, 'mage', 'fire', TRAINING_EXPEDITION); const chest = run.exploration.objects.find(o => o.kind === 'chest')!; assert.ok(chest);
  run.combat.enemies.forEach(e => { e.dead = true; }); const point = { ...chest, yaw: 0 }; run.step(dt, point, undefined, chest.id);
  assert.equal(chest.status, 'used'); assert.equal(run.progression.choice()!.kind, 'relic'); const coins = run.exploration.coins;
  const c = run.progression.choice()!; run.step(1, point, undefined, chest.id); assert.equal(run.progression.choice()!.id, c.id);
  assert.ok(run.choose(c.id, 'salvage')); assert.equal(run.exploration.coins, coins + chest.amount); run.step(dt, point, undefined, chest.id); assert.equal(run.progression.pending, 0);
});

test('capture grants its coins and one relic choice without repeating the reward', () => {
  const run = new Run(bounds, [], 4, 'mage', 'fire', TRAINING_EXPEDITION); assert.ok(run.capture.point); run.combat.enemies.forEach(e => { e.dead = true; });
  const point = { ...run.capture.point!, yaw: 0 }; let rewarded = false;
  for (let i = 0; i < 2000 && !rewarded; i++) {
    if (run.progression.pending) { const c = run.progression.choice()!; if (c.kind === 'relic') { rewarded = true; break; } run.choose(c.id, c.options[0]); }
    run.combat.enemies.forEach(e => { e.dead = true; }); run.step(dt, point);
  }
  assert.ok(rewarded); assert.equal(run.capture.state, 'completed'); const coins = run.exploration.coins; assert.ok(coins >= 25);
  const c = run.progression.choice()!; run.choose(c.id, 'salvage'); assert.equal(run.exploration.coins, coins + 12);
  for (let i = 0; i < 20; i++) run.step(dt, point); assert.equal(run.progression.pending, 0);
});

test('shop relic stock is seeded, finite and atomic: invalid/stale/full/ineligible purchases never charge coins', () => {
  const run = new Run(bounds, [], 19, 'mage', 'fire', TRAINING_EXPEDITION), shop = run.shop; assert.equal(shop.offers.length, 7); assert.deepEqual(shop.offers, new ExpeditionShop(19).offers); run.exploration.coins = 200; shop.open();
  const heart = shop.offers.find(o => o.relic === 'relic_heart')!, tide = shop.offers.find(o => o.relic === 'relic_tide')!; assert.ok(heart && tide);
  assert.equal(shop.buy(tide.id, shop.revision, run.exploration, run.progression, run.combat), false); assert.equal(run.exploration.coins, 200);
  const revision = shop.revision; assert.ok(shop.buy(heart.id, revision, run.exploration, run.progression, run.combat)); assert.equal(run.combat.maxHp, 105); assert.equal(run.exploration.coins, 174);
  assert.equal(shop.buy(heart.id, revision, run.exploration, run.progression, run.combat), false); assert.equal(shop.buy(heart.id, shop.revision, run.exploration, run.progression, run.combat), false); assert.equal(run.exploration.coins, 174);
  run.progression.equipRelic('relic_edge'); run.progression.equipRelic('relic_boots'); run.progression.equipRelic('relic_magnet');
  const shell = shop.offers.find(o => o.relic === 'relic_shell')!; assert.equal(shop.buy(shell.id, shop.revision, run.exploration, run.progression, run.combat), false); assert.equal(run.exploration.coins, 174);
});

test('projectiles preserve the old affinity/relic snapshot across choices; restart resets both inventories', () => {
  const c = new Combat(bounds, [], [{ x: 0, z: -6 }], false, classRuntime('mage')); c.loadout = { element: 'fire', rank: 1, mastery: false }; c.whirlwindCooldown = 999;
  for (let i = 0; i < 13; i++) c.step(dt, hero); const bolt = c.heroKit.state.projectiles![0];
  c.loadout = { element: 'fire', rank: 3, mastery: true, secondary: { element: 'water', rank: 3 }, relics: ['relic_ember'] };
  for (let i = 0; i < 25; i++) c.step(dt, hero); assert.equal(bolt.loadout.secondary, undefined); assert.equal(bolt.loadout.relics, undefined); assert.equal(c.enemies[0].wetRemaining, 0);
  const fresh = new Run(bounds, [], 1, 'mage', 'earth', TRAINING_EXPEDITION); assert.deepEqual(fresh.progression.relics, []); assert.equal(fresh.progression.secondaryElement, undefined); assert.equal(fresh.progression.secondaryRank, 0);
});

test('HUD summary and secondary aura show two affinities but only one mastery', () => {
  const p = progress('earth'); p.secondaryElement = 'water'; p.secondaryRank = 2; p.mastery = true; p.equipRelic('relic_tide');
  assert.ok(affinitySummary(p).includes('Agua II de apoyo')); assert.ok(affinitySummary(p).includes('Maestría principal')); assert.ok(relicSummary(p).includes('Perla'));
  const c = new Combat(bounds, [], [], false); c.loadout = p.loadout; const scene = new THREE.Scene(), view = createElementView(scene);
  view.update(c, new THREE.Vector3(), 1, dt); const aura = scene.getObjectByName('Afinidad de apoyo') as THREE.Mesh;
  assert.equal(aura.visible, true); assert.equal((aura.material as THREE.MeshBasicMaterial).color.getHex(), ELEMENTS.water.color);
  view.reset(); assert.equal(aura.visible, false); view.dispose(); assert.equal(scene.children.length, 0);
});
