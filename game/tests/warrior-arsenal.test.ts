import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Run } from '../src/domain/run.ts';
import { Combat } from '../src/domain/combat.ts';
import { WARRIOR_RUNTIME } from '../src/domain/classes.ts';
import { WarriorArsenal } from '../src/domain/classes/warrior-arsenal.ts';
import { AbilityBook } from '../src/domain/ability-book.ts';
import { WARRIOR_ABILITIES, warriorParameters, GENERAL_STATS } from '../src/content/warrior-abilities.ts';
import type { WarriorAbilityId } from '../src/content/warrior-abilities.ts';
import { syncLoadout } from '../src/domain/loadout.ts';
import { createWarriorArsenalView } from '../src/rendering/warrior-arsenal.ts';
import { techniqueCatalog, techniqueSummary } from '../src/app/techniques.ts';
const bounds = { minX: -30, maxX: 30, minZ: -30, maxZ: 40 },
  hero = { x: 0, z: 0, yaw: 0 },
  dt = 1 / 60;
function upgraded(id: WarriorAbilityId, path: 0 | 1, max = 10) {
  const b = new AbilityBook('warrior'),
    full = `warrior:${id}`;
  if (!b.snapshot.some(s => s.id === full)) b.apply(b.revision, { id: full, kind: 'learn' });
  while (b.snapshot.find(s => s.id === full)!.level < max) {
    const options = b.options().filter(o => o.id === full);
    assert.ok(b.apply(b.revision, path ? options.at(-1)! : options[0]));
  }
  return b.snapshot;
}
function encounter(
  solids: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }[] = [],
) {
  const c = new Combat(
    bounds,
    solids,
    [
      { x: 0, z: -1.5 },
      { x: 0.8, z: -3 },
      { x: 0, z: -5 },
    ],
    false,
    { ...WARRIOR_RUNTIME, createKit: () => new WarriorArsenal(bounds) },
  );
  c.hp = c.maxHp = 10000;
  for (const e of c.enemies) {
    e.hp = e.maxHp = 10000;
    e.cooldown = 1000;
  }
  return c;
}

test('all expeditions enable modern progression while Warrior retains its own arsenal', () => {
  const run = new Run(bounds, [], 19, undefined, undefined, TRAINING_EXPEDITION);
  assert.ok(run.combat.heroKit instanceof WarriorArsenal);
  assert.ok(run.progression.development);
  for (const cls of ['mage', 'archer'] as const)
    assert.ok(new Run(bounds, [], 19, cls, 'fire', TRAINING_EXPEDITION).progression.development);
  assert.equal(run.progression.techniqueOptions(99).length, 0);
  assert.equal(techniqueCatalog(run.progression, 1).length, 9);
  assert.match(techniqueSummary(run.progression), /Habilidades 1\/4/);
});

test('real level choices acquire four skills and grow branches while preserving rank caps, pause and unique purchases', () => {
  const run = new Run(bounds, [], 7, undefined, undefined, TRAINING_EXPEDITION),
    p = run.progression;
  p.gain(20000);
  let choices = 0;
  while (p.pending && choices++ < 200) {
    const choice = p.choice()!,
      before = run.combat.time;
    run.step(dt, hero);
    assert.equal(run.combat.time, before);
    assert.deepEqual(p.choice(), choice);
    const option =
      choice.kind === 'element'
        ? 'fire'
        : (choice.options.find(o => o.startsWith('ability:') && o.includes('/learn/')) ??
          choice.options.find(o => o.startsWith('ability:')) ??
          choice.options[0]);
    if (!option) {
      assert.ok(run.fallback(choice.id));
      continue;
    }
    const description = p.option(option);
    assert.ok(description.name && description.description);
    assert.ok(run.choose(choice.id, option), option);
    assert.equal(run.choose(choice.id, option), false);
  }
  assert.equal(p.development!.book.slotsUsed, 4);
  assert.ok(p.development!.book.snapshot.every(s => s.level <= 10));
  assert.ok(p.development!.book.snapshot.some(s => s.level === 10));
  assert.deepEqual(run.combat.techniques, {});
  assert.ok(Object.values(p.development!.ranks(p)).every(r => r <= 4));
});

test('every Warrior attack and both level-ten paths execute finite damage or protection', () => {
  for (const id of Object.keys(WARRIOR_ABILITIES) as WarriorAbilityId[])
    for (const path of [0, 1] as const) {
      const c = encounter(),
        kit = c.heroKit as WarriorArsenal;
      const all = upgraded(id, path);
      kit.abilities = all.filter(s => s.id === 'warrior:sword' || s.id === `warrior:${id}`);
      if (id !== 'sword') kit.state.cooldown = 1000;
      let hits = 0,
        sawBarrier = false,
        sawAura = false;
      for (let i = 0; i < 600; i++) {
        c.step(dt, hero);
        hits += c.takeEvents().filter(e => e.type === 'hit' && e.target > 0).length;
        sawBarrier ||= !!kit.state.barrier;
        sawAura ||= kit.damageBonus > 0;
        assert.ok(
          c.enemies.every(e => Number.isFinite(e.hp) && e.hp >= 0),
          `${id}/${path}`,
        );
      }
      if (id === 'war-banner') assert.ok(sawAura, id);
      else {
        assert.ok(hits > 0, `${id}/${path}: no impact`);
        if (id === 'retaliation') assert.ok(sawBarrier);
      }
    }
});

test('all skill/element pairs apply their primary and support without recursive effects', () => {
  for (const element of ['fire', 'water', 'earth', 'air'] as const)
    for (const id of [
      'steel-wave',
      'orbiting-axes',
      'war-hammer',
      'spectral-spears',
      'retaliation',
      'war-chain',
    ] as const) {
      const c = encounter(),
        kit = c.heroKit as WarriorArsenal;
      kit.abilities = upgraded(id, 0, 1).filter(s => s.id === 'warrior:sword' || s.id === `warrior:${id}`);
      kit.state.cooldown = 1000;
      c.loadout = {
        element,
        rank: 3,
        mastery: true,
        secondary: { element: element === 'fire' ? 'water' : 'fire', rank: 3 },
      };
      let count = 0;
      for (let i = 0; i < 300; i++) {
        c.step(dt, hero);
        count += c.takeEvents().length;
      }
      assert.ok(
        c.enemies.some(e => e.hp < e.maxHp),
        `${id}/${element}`,
      );
      assert.ok(count < 1000, `${id}/${element}: recursive flood`);
    }
});

test('sword continues during whirlwind, multiple actions coexist, and a launched action keeps its build', () => {
  const c = encounter(),
    kit = c.heroKit as WarriorArsenal;
  const book = new AbilityBook('warrior');
  for (const id of ['orbiting-axes', 'steel-wave', 'war-banner'])
    book.apply(book.revision, { id: `warrior:${id}`, kind: 'learn' });
  kit.abilities = book.snapshot;
  c.step(dt, hero);
  assert.ok(kit.state.area);
  assert.ok(kit.state.attack);
  assert.ok(kit.clock.active.length >= 3);
  const active = kit.clock.active.find(a => a.ability.id === 'warrior:whirlwind')!;
  book.apply(book.revision, { id: 'warrior:whirlwind', kind: 'branch', branch: 'power' });
  kit.abilities = book.snapshot;
  assert.equal(active.ability.level, 1);
  const time = kit.clock.remaining('warrior:whirlwind');
  kit.clock.setPaused(true);
  kit.clock.step(5);
  assert.equal(kit.clock.remaining('warrior:whirlwind'), time);
  kit.clock.setPaused(false);
  kit.cancel();
  assert.equal(kit.presentation.length, 0);
  assert.equal(kit.clock.active.length, 0);
  assert.equal(
    kit.act({ hero, alive: c.enemies, solids: [], damageMultiplier: 1, loadout: c.loadout, nextId: () => 1, emit() {} })
      .length,
    0,
  );
});

test('walls prevent target selection, projectiles and remote damage through a solid', () => {
  const wall = { min: { x: -20, y: 0, z: -1 }, max: { x: 20, y: 4, z: -0.8 } };
  for (const id of ['steel-wave', 'war-hammer', 'spectral-spears', 'war-chain'] as const) {
    const c = encounter([wall]),
      kit = c.heroKit as WarriorArsenal;
    kit.abilities = upgraded(id, 0);
    kit.state.cooldown = 1000;
    for (let i = 0; i < 60; i++) c.step(dt, hero);
    assert.ok(
      c.enemies.every(e => e.hp === e.maxHp),
      id,
    );
  }
});

test('stat formulas respect cooldown, range and duration caps across all tree paths', () => {
  const ranks = Object.fromEntries(Object.keys(GENERAL_STATS).map(id => [id, 4]));
  for (const id of Object.keys(WARRIOR_ABILITIES) as WarriorAbilityId[])
    for (const path of [0, 1] as const) {
      const state = upgraded(id, path).find(s => s.id === `warrior:${id}`)!,
        p = warriorParameters(state, ranks);
      assert.ok(Number.isFinite(p.damage) && p.damage >= 0);
      assert.ok(p.cooldown >= (id === 'sword' ? 0.25 : 1));
      assert.ok(p.pierce <= 10);
      assert.ok(p.barrier <= 40);
    }
});

test('modern shop and relic sync share four stat ranks and fifteen-point vitality, reset starts empty', () => {
  const run = new Run(bounds, [], 19, undefined, undefined, TRAINING_EXPEDITION),
    p = run.progression;
  run.exploration.coins = 200;
  run.shop.open();
  const old = run.combat.maxHp;
  const offer = run.shop.offers.find(o => o.upgrade === 'vitality')!;
  assert.ok(run.shop.buy(offer.id, run.shop.revision, run.exploration, p, run.combat));
  assert.equal(run.combat.maxHp, old + 15);
  assert.equal(p.upgradeMax('damage'), 4);
  assert.equal(p.ranks.vitality, 1);
  assert.ok(p.equipRelic('relic_heart'));
  syncLoadout(p, run.combat);
  const hp = run.combat.maxHp;
  syncLoadout(p, run.combat);
  assert.equal(run.combat.maxHp, hp);
  const fresh = new Run(bounds, [], 19, undefined, undefined, TRAINING_EXPEDITION);
  assert.equal(fresh.progression.development!.book.slotsUsed, 1);
  assert.equal(fresh.combat.maxHp, 100);
});

test('procedural arsenal view follows domain state and clears objects on reset', () => {
  const c = encounter(),
    kit = c.heroKit as WarriorArsenal;
  kit.abilities = upgraded('orbiting-axes', 0);
  c.step(dt, hero);
  const scene = new THREE.Scene(),
    view = createWarriorArsenalView(scene);
  view.update(c);
  assert.ok(scene.getObjectByName('Arsenal del Guerrero')!.children.length > 0);
  view.reset();
  assert.equal(scene.getObjectByName('Arsenal del Guerrero')!.children.length, 0);
  view.dispose();
  assert.equal(scene.children.length, 0);
});

test('modern Warrior clears a close encounter with normal health in every primary affinity', () => {
  for (const element of ['fire', 'water', 'earth', 'air'] as const) {
    const c = new Combat(
      bounds,
      [],
      [
        { x: 0, z: -1.5 },
        { x: -0.6, z: -2 },
        { x: 0.6, z: -2 },
      ],
      true,
      { ...WARRIOR_RUNTIME, createKit: () => new WarriorArsenal(bounds) },
    );
    c.loadout = { element, rank: 3, mastery: true };
    for (let i = 0; i < 3600 && c.status === 'running'; i++) c.step(dt, hero);
    assert.equal(c.status, 'victory', element);
    assert.equal(c.kills, 3);
    assert.ok(c.hp > 0);
    assert.equal(c.maxHp, 100);
  }
});

test('chain exposure applies after its own damage and its visual lasts through the action', () => {
  const c = encounter(),
    kit = c.heroKit as WarriorArsenal;
  kit.abilities = upgraded('war-chain', 0).filter(s => s.id === 'warrior:sword' || s.id === 'warrior:war-chain');
  kit.state.cooldown = 1000;
  const state = kit.abilities.find(s => s.id === 'warrior:war-chain')!,
    expected = warriorParameters(state).damage;
  c.step(dt, hero);
  const impact = c.takeEvents().find(e => e.type === 'hit' && e.source === 'ability')!;
  assert.ok(impact);
  assert.equal(impact.amount, expected);
  assert.equal(c.enemies.find(e => e.id === impact.target)!.exposedRemaining, 2);
  c.step(dt, hero);
  assert.ok(kit.presentation.some(v => v.kind === 'chain'));
});

test('breaking retaliation starts its cooldown immediately and emits one wave', () => {
  const c = encounter(),
    kit = c.heroKit as WarriorArsenal;
  kit.abilities = upgraded('retaliation', 0, 1).filter(s => s.id !== 'warrior:whirlwind');
  kit.state.cooldown = 1000;
  c.step(dt, hero);
  c.takeEvents();
  assert.ok(kit.state.barrier);
  kit.state.barrier = undefined;
  c.step(dt, hero);
  assert.equal(kit.clock.remaining('warrior:retaliation'), 12);
  assert.ok(c.takeEvents().some(e => e.type === 'ability-pulse'));
  c.step(dt, hero);
  assert.ok(!c.takeEvents().some(e => e.type === 'ability-pulse'));
});
