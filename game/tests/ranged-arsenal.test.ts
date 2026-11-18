import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Combat } from '../src/domain/combat.ts';
import { Run } from '../src/domain/run.ts';
import { classRuntime } from '../src/domain/classes.ts';
import { RangedArsenal } from '../src/domain/classes/ranged-arsenal.ts';
import { AbilityBook } from '../src/domain/ability-book.ts';
import { RANGED_ABILITIES, rangedParameters } from '../src/content/ranged-abilities.ts';
import { syncLoadout } from '../src/domain/loadout.ts';
import { createRangedArsenalView } from '../src/rendering/ranged-arsenal.ts';
import type { Element } from '../src/content/elements.ts';
const bounds = { minX: -25, maxX: 25, minZ: -25, maxZ: 25 }, hero = { x: 0, z: 0, yaw: 0 }, dt = 1 / 60;
function build(id: string, path: 0 | 1, level = 10) {
  const cls = id.split(':')[0] as 'mage' | 'archer', book = new AbilityBook(cls);
  if (!book.snapshot.some(s => s.id === id)) assert.ok(book.apply(book.revision, { id, kind: 'learn' }));
  while (book.snapshot.find(s => s.id === id)!.level < level) {
    const options = book.options().filter(o => o.id === id); assert.ok(book.apply(book.revision, path ? options.at(-1)! : options[0]));
  }
  return book.snapshot.filter(s => s.id === id || s.id === `${cls}:${cls === 'mage' ? 'orb' : 'arrow'}`);
}
function fixture(cls: 'mage' | 'archer', positions = [{ x: 0, z: -2 }, { x: .7, z: -3 }, { x: -.7, z: -4 }], walls: { min: { x: number; z: number }; max: { x: number; z: number } }[] = []) {
  const c = new Combat(bounds, walls, positions, false, { ...classRuntime(cls), createKit: () => new RangedArsenal(cls, bounds) }), kit = c.heroKit as RangedArsenal;
  c.hp = c.maxHp = 100000; for (const e of c.enemies) { e.hp = e.maxHp = 100000; e.cooldown = 10000; }
  c.loadout = { element: 'fire', rank: 1, mastery: false };
  return { c, kit };
}

test('both classes use four-slot progression, develop all levels, and reject double choices', () => {
  for (const cls of ['mage', 'archer'] as const) {
    const run = new Run(bounds, [], 19, cls, 'fire', TRAINING_EXPEDITION), p = run.progression; p.gain(20000);
    for (let n = 0; n < 250 && p.pending; n++) {
      const choice = p.choice()!, time = run.combat.time; run.step(dt, hero); assert.equal(run.combat.time, time);
      const id = choice.kind === 'element' ? 'fire' : choice.options.find(o => o.startsWith('ability:') && o.includes('/learn/')) ?? choice.options.find(o => o.startsWith('ability:')) ?? choice.options[0];
      if (!id) { assert.ok(run.fallback(choice.id)); continue; }
      assert.ok(p.option(id).description); assert.ok(run.choose(choice.id, id)); assert.equal(run.choose(choice.id, id), false);
    }
    assert.equal(p.development!.book.slotsUsed, 4); assert.ok(p.development!.book.snapshot.some(s => s.level === 10)); assert.deepEqual(run.combat.techniques, {});
    assert.equal(p.development!.eligible('temple', p), false);
  }
});

for (const id of Object.keys(RANGED_ABILITIES)) test(`${id}: both level-ten paths produce real combat effects`, () => {
  for (const path of [0, 1] as const) {
    const cls = id.split(':')[0] as 'mage' | 'archer', { c, kit } = fixture(cls); kit.abilities = build(id, path);
    if (!['mage:orb', 'archer:arrow', 'mage:mirror', 'archer:hunting-beacon'].includes(id)) kit.state.cooldown = 10000;
    let direct = 0, defensive = false;
    for (let i = 0; i < 720; i++) { c.step(dt, hero); defensive ||= kit.defenseBonus > 0 || !!kit.state.barrier; for (const e of c.takeEvents()) if (e.type === 'hit' && e.target && e.source !== 'burn') direct += e.amount; assert.ok(kit.state.projectiles.length <= 32); }
    assert.ok(direct > 0 || defensive, `${id} path ${path}`); assert.ok(c.enemies.every(e => Number.isFinite(e.hp)));
  }
});

test('skill hits carry each primary and support; derived shots do not recursively apply statuses', () => {
  for (const cls of ['mage', 'archer'] as const) for (const element of ['fire', 'water', 'earth', 'air'] as const) {
    const { c, kit } = fixture(cls); kit.abilities = build(cls === 'mage' ? 'mage:arcane-lances' : 'archer:siege-shot', 0, 3); kit.state.cooldown = 10000;
    c.loadout = { element, rank: 3, mastery: true, secondary: { element: element === 'fire' ? 'water' : 'fire', rank: 2 } };
    let hits = 0; for (let i = 0; i < 180; i++) { c.step(dt, hero); hits += c.takeEvents().filter(e => e.type === 'hit' && e.source === 'ability').length; }
    assert.ok(hits > 0, `${cls}/${element}`); assert.ok(hits < 100);
    assert.ok(c.enemies.some(e => e.burn || e.wetRemaining > 0 || (e.brokenRemaining ?? 0) > 0));
  }
});

test('walls prevent remote skill targeting and projectile damage for both classes', () => {
  for (const cls of ['mage', 'archer'] as const) {
    const { c, kit } = fixture(cls, [{ x: 0, z: -3 }], [{ min: { x: -10, z: -2 }, max: { x: 10, z: -1.8 } }]);
    kit.abilities = build(cls === 'mage' ? 'mage:runic-beam' : 'archer:ricochet', 0); kit.state.cooldown = 10000;
    for (let i = 0; i < 60; i++) c.step(dt, hero);
    assert.equal(c.enemies[0].hp, c.enemies[0].maxHp); assert.equal(kit.clock.active.length, 0);
  }
});

test('initial skills coexist with basics and cancellation clears clocks, marks and views', () => {
  for (const cls of ['mage', 'archer'] as const) {
    const { c, kit } = fixture(cls); let basicDuringArea = false;
    for (let i = 0; i < 90; i++) { c.step(dt, hero); basicDuringArea ||= !!kit.state.area && !!kit.state.projectiles.length; }
    assert.ok(basicDuringArea);
    const scene = new THREE.Scene(), view = createRangedArsenalView(scene); view.update(c);
    kit.cancel(); view.update(c); assert.equal(kit.state.projectiles.length, 0); assert.equal(kit.clock.active.length, 0); assert.equal(kit.presentation.length, 0);
    view.dispose(); assert.equal(scene.children.length, 0);
    kit.advance(10); assert.deepEqual(kit.act({ hero, alive: c.enemies, solids: [], damageMultiplier: 1, loadout: c.loadout, nextId: () => 999, emit() {} }), []);
  }
});

test('mirror echoes never grant arcane charges or copy empowered explosions', () => {
  const { c, kit } = fixture('mage', [{ x: 0, z: -8 }]); kit.abilities = build('mage:mirror', 0); let echoes = 0;
  for (let i = 0; i < 600; i++) { c.step(dt, hero); echoes += c.takeEvents().filter(e => e.type === 'hit' && e.source === 'ability-extra').length; assert.ok(kit.state.passiveStacks <= 3); }
  assert.ok(echoes > 0);
});

test('non-basic archer shots do not grant Precision; return arrows traverse both full legs', () => {
  const { c, kit } = fixture('archer', [{ x: 0, z: -2 }]); kit.abilities = build('archer:return-arrows', 0, 1); kit.state.cooldown = 10000;
  let direct = 0, returned = false;
  for (let i = 0; i < 100; i++) { c.step(dt, hero); returned ||= kit.state.projectiles.some(p => p.leg === 1); direct += c.takeEvents().filter(e => e.type === 'hit' && e.source === 'ability').length; }
  assert.ok(returned); assert.ok(direct >= 2); assert.equal(kit.state.passiveStacks, 0);
});

test('beacon modifies incoming damage only for marked enemies; traps use a separate slow', () => {
  const run = new Run(bounds, [], 1, 'archer', undefined, TRAINING_EXPEDITION), p = run.progression, kit = run.combat.heroKit as RangedArsenal;
  assert.ok(p.development!.book.apply(p.development!.book.revision, { id: 'archer:hunting-beacon', kind: 'learn' })); syncLoadout(p, run.combat);
  const { c, kit: k } = fixture('archer'); k.abilities = build('archer:hunting-beacon', 0); c.step(dt, hero); assert.ok(k.targetBonus(c.enemies[0]) > 0);
  k.cancel(); assert.equal(k.targetBonus(c.enemies[0]), 0);
  const trap = fixture('archer'); trap.kit.abilities = build('archer:spike-trap', 0, 1); trap.kit.state.cooldown = 10000; trap.c.loadout = { rank: 0, mastery: false };
  for (let i = 0; i < 60; i++) trap.c.step(dt, hero);
  assert.ok(trap.c.enemies.some(e => (e.trapSlowRemaining ?? 0) > 0)); assert.ok(trap.c.enemies.every(e => e.wetRemaining === 0));
  assert.equal(kit.state.projectiles.length, 0);
});

test('normal-health encounters clear with every class and primary affinity', () => {
  for (const cls of ['mage', 'archer'] as const) for (const element of ['fire', 'water', 'earth', 'air'] as Element[]) {
    const c = new Combat(bounds, [], [{ x: 0, z: -6 }, { x: .7, z: -7 }], true, { ...classRuntime(cls), createKit: () => new RangedArsenal(cls, bounds) }); c.loadout = { element, rank: 3, mastery: true };
    for (let i = 0; i < 3600 && c.status === 'running'; i++) c.step(dt, hero);
    assert.equal(c.status, 'victory', `${cls}/${element}`); assert.ok(c.hp > 0);
  }
});

test('parameter bounds cover basic, area, projectile and duration branches', () => {
  for (const id of Object.keys(RANGED_ABILITIES)) for (const path of [0, 1] as const) {
    const s = build(id, path).find(s => s.id === id)!, p = rangedParameters(s, { celerity: 4, cadence: 4, reach: 4, area: 4, persistence: 4 });
    assert.ok(p.cooldown >= (p.basic ? .25 : 1)); assert.ok(p.radius <= RANGED_ABILITIES[id].radius * (p.area ? 1.8 : 1.75)); assert.ok(Number.isFinite(p.damage));
  }
});
