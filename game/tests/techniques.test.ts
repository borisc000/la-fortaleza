import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TECHNIQUES, TECHNIQUE_IDS, classTechniques, isTechnique } from '../src/content/techniques.ts';
import type { TechniqueRanks, TechniqueId } from '../src/content/techniques.ts';
import { classRuntime } from '../src/domain/classes.ts';
import { Progression } from '../src/domain/progression.ts';
import { Combat } from '../src/domain/combat.ts';
import { Run } from '../src/domain/run.ts';
import { SIMULATION_STEP as dt } from '../src/content/config.ts';
import { techniqueCatalog, techniqueSummary } from '../src/app/techniques.ts';
import { createMageSpellView } from '../src/rendering/mage-spells.ts';
import type { HeroHit, HeroKitContext } from '../src/domain/hero-kit.ts';

const bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
  hero = { x: 0, z: 0, yaw: 0 };
function fixture(classId: 'warrior' | 'mage' | 'archer', techniques: TechniqueRanks, positions = [{ x: 0, z: -6 }]) {
  const runtime = classRuntime(classId),
    c = new Combat(bounds, [], positions, false, runtime),
    kit = runtime.createKit();
  let sequence = 0;
  const context: HeroKitContext = {
    hero: { ...hero },
    alive: c.enemies,
    solids: [],
    damageMultiplier: 1,
    loadout: { element: 'fire', rank: 1, mastery: false },
    techniques,
    nextId: () => ++sequence,
    emit() {},
  };
  function step(count = 1) {
    const hits: HeroHit[] = [];
    for (let i = 0; i < count; i++) {
      kit.advance(dt);
      hits.push(...kit.act(context));
      kit.finishStep();
    }
    return hits;
  }
  return { c, kit, context, step };
}
function learnBuild(classId: 'warrior' | 'mage' | 'archer', excluded: TechniqueId) {
  // Historical technique domain remains covered without re-enabling it in live expeditions.
  const progression = new Progression(classRuntime(classId).definition, 'earth'),
    combat = new Combat(bounds, [], [], false, classRuntime(classId));
  const run = {
    progression,
    combat,
    choose(id: number, option: Parameters<Progression['choose']>[1]) {
      const chosen = progression.choose(id, option);
      combat.techniques = Object.freeze({ ...progression.techniques });
      return chosen;
    },
    fallback(id: number) {
      return progression.fallback(id);
    },
  };
  run.progression.gain(2000);
  let rounds = 0;
  while (run.progression.pending && rounds++ < 70) {
    const c = run.progression.choice()!,
      candidates = c.options.filter(isTechnique).filter(id => id !== excluded);
    const selected =
      c.kind === 'element'
        ? 'earth'
        : c.options.includes('affinity')
          ? 'affinity'
          : (candidates.find(id => !run.progression.techniques[id]) ??
            candidates[0] ??
            c.options.find(id => id !== excluded));
    if (selected) assert.ok(run.choose(c.id, selected));
    else assert.ok(run.fallback(c.id));
  }
  return run;
}

test('catalog has four immutable techniques per class, three ranks, no Armored entries', () => {
  assert.equal(TECHNIQUE_IDS.length, 12);
  for (const id of ['warrior', 'mage', 'archer'] as const) assert.equal(classTechniques(id).length, 4);
  assert.deepEqual(classTechniques('armored'), []);
  for (const t of Object.values(TECHNIQUES)) {
    assert.equal(t.values.length, 3);
    assert.equal(t.descriptions.length, 3);
    assert.ok(Object.isFrozen(t));
    assert.ok(Object.isFrozen(t.values));
  }
});

test('queued level gates use the choice level, reject foreign/forged choices, and never equip four', () => {
  for (const classId of ['warrior', 'mage', 'archer'] as const) {
    const p = new Progression(classRuntime(classId).definition, 'fire');
    p.gain(2000);
    const first = p.choice()!;
    assert.ok(!first.options.some(isTechnique));
    assert.equal(p.choose(first.id, classTechniques(classId)[0]), false);
    const foreign = classTechniques(classId === 'mage' ? 'archer' : 'mage')[0];
    assert.equal(p.choose(first.id, foreign), false);
    // Modern expeditions are covered separately; these are historical domain rules.
    for (const excluded of classTechniques(classId)) {
      const run = learnBuild(classId, excluded),
        equipped = run.progression.equippedTechniques;
      assert.equal(equipped.length, 3);
      assert.ok(!equipped.includes(excluded));
      assert.ok(equipped.every(id => run.progression.techniques[id] === 3));
      assert.deepEqual(run.combat.techniques, run.progression.techniques);
      assert.ok(Object.isFrozen(run.combat.techniques));
      assert.equal(run.progression.techniqueOptions(99).length, 0);
      const newRun = new Run(bounds, [], 9, classId, 'air', TRAINING_EXPEDITION);
      assert.deepEqual(newRun.progression.techniques, {});
      assert.deepEqual(newRun.combat.techniques, {});
    }
  }
});

test('learning consumes one level, upgrading keeps its slot and requires levels five/seven', () => {
  const p = new Progression();
  p.element = 'earth';
  p.affinityRank = 3;
  p.ranks = { damage: 3, vitality: 3, speed: 3, collection: 3 };
  p.gain(100);
  assert.ok(p.fallback(p.choice()!.id)); // Level 2 has no eligible new technique.
  let c = p.choice()!;
  assert.equal(c.level, 3);
  assert.ok(c.options.includes('sweep'));
  assert.ok(p.choose(c.id, 'sweep'));
  assert.equal(p.choose(c.id, 'sweep'), false);
  c = p.choice()!;
  assert.equal(c.level, 4);
  assert.ok(!c.options.includes('sweep'));
  assert.ok(p.choose(c.id, c.options[0]));
  c = p.choice()!;
  assert.equal(c.level, 5);
  assert.ok(c.options.includes('sweep'));
  const slots = p.equippedTechniques.length;
  assert.ok(p.choose(c.id, 'sweep'));
  assert.equal(p.equippedTechniques.length, slots);
  assert.equal(p.techniques.sweep, 2);
  assert.ok(!p.techniqueOptions(6).includes('sweep'));
  assert.ok(p.techniqueOptions(7).includes('sweep'));
});

test('Warrior Barrido reaches lateral targets while Estocada extends reach and snapshots both', () => {
  const positions = [
    { x: 0, z: -1.5 },
    { x: 1.5, z: 0 },
    { x: 0, z: -3 },
  ];
  const f = fixture('warrior', { sweep: 3, lunge: 3 }, positions);
  f.kit.state.skillCooldown = 999;
  f.step();
  f.context.techniques = {};
  const hits = f.step(12).filter(h => h.source === 'basic');
  assert.equal(hits.length, 3);
  assert.equal(new Set(hits.map(h => h.target!.id)).size, 3);
  const base = fixture('warrior', {}, positions);
  base.kit.state.skillCooldown = 999;
  assert.equal(base.step(13).length, 1);
});

test('Guardia firme reduces melee and projectile damage before consuming the Earth barrier', () => {
  const c = new Combat(bounds, [], [{ x: 0, z: -0.95 }], false);
  c.techniques = { guard: 3 };
  c.cooldown = c.whirlwindCooldown = 999;
  c.heroKit.state.barrier = { amount: 8, remaining: 4 };
  c.enemies[0].attack = { id: 2, yaw: Math.PI, age: 0.6 - dt, hits: new Set() };
  c.step(dt, hero);
  assert.ok(Math.abs(c.hp - 98.4) < 1e-8);
  assert.equal(c.heroKit.state.barrier, undefined);
  c.protection = 0;
  c.enemies[0].attack = undefined;
  c.enemies[0].cooldown = 999;
  c.projectiles.fire({ x: 0, z: -0.5 }, Math.PI, 1, 10);
  c.step(dt, hero);
  assert.ok(Math.abs(c.hp - 90.4) < 1e-8);
});

test('Giro prolongado adds the correct pulses to every mastery and starts cooldown after its new duration', () => {
  for (const element of ['fire', 'water', 'earth', 'air'] as const)
    for (let rank = 1; rank <= 3; rank++) {
      const f = fixture('warrior', { whirl: rank }, [{ x: 0, z: -1.5 }]);
      f.context.loadout = { element, rank: 3, mastery: true };
      f.step();
      const area = f.kit.state.area!;
      assert.equal(area.maxPulses, (element === 'fire' ? 8 : 6) + [2, 3, 4][rank - 1]);
      f.context.techniques = {};
      const hits = f.step(Math.ceil(area.duration / dt));
      assert.equal(hits.filter(h => h.source === 'whirlwind').length, area.maxPulses - 1);
      assert.equal(f.kit.state.area, undefined);
      assert.ok(f.kit.state.skillCooldown > 19.9);
    }
});

test('Eco arcano releases a delayed weaker bolt without extra charges, empowered area, or duplicated Earth guard', () => {
  for (let rank = 1; rank <= 3; rank++) {
    const f = fixture('mage', { echo: rank });
    f.kit.state.skillCooldown = 999;
    f.context.loadout = { element: 'earth', rank: 1, mastery: false };
    f.kit.state.passiveStacks = 3;
    f.step(13);
    const bolts = f.kit.state.projectiles!;
    assert.equal(bolts.length, 2);
    const echo = bolts.find(p => p.echo)!;
    assert.ok(echo.delay! > 0);
    assert.equal(echo.empowered, false);
    assert.equal(echo.damage, 24 * [0.35, 0.5, 0.65][rank - 1]);
    assert.equal(f.kit.state.passiveStacks, 0);
    const hits = f.step(45);
    assert.equal(hits.length, 2);
    assert.ok(hits[0].amount > hits[1].amount);
    assert.equal(f.kit.state.passiveStacks, 0);
    assert.equal(f.kit.state.barrier!.amount, 12);
  }
});

test('Resonancia widens only the empowered blast, respects walls and keeps launch values', () => {
  const f = fixture('mage', { resonance: 3 }, [
    { x: 0, z: -6 },
    { x: 2.6, z: -6 },
    { x: -2.6, z: -6 },
  ]);
  f.kit.state.skillCooldown = 999;
  f.kit.state.passiveStacks = 3;
  f.step(13);
  f.context.techniques = {};
  f.context.solids = [{ min: { x: -2, y: 0, z: -9 }, max: { x: -1.9, y: 3, z: -3 } }];
  const hits = f.step(30);
  assert.deepEqual(hits.map(h => h.target!.id).sort(), [1, 2]);
});

test('Concentración/Cadencia shorten only basic launch intervals with bounded projectile counts', () => {
  for (const classId of ['mage', 'archer'] as const) {
    const base = fixture(classId, {}),
      faster = fixture(classId, classId === 'mage' ? { focus: 3, echo: 3 } : { cadence: 3, fan: 3 });
    base.kit.state.skillCooldown = faster.kit.state.skillCooldown = 999;
    const regular = base.step(300).length,
      improved = faster.step(300).length;
    assert.ok(improved > regular);
    assert.ok(faster.kit.state.projectiles!.length <= 32);
  }
});

test('Convergencia and Lluvia extensa multiply mastered area radius and preserve center and pulse count', () => {
  for (const classId of ['mage', 'archer'] as const)
    for (const element of ['fire', 'water', 'earth', 'air'] as const) {
      const base = fixture(classId, {}),
        wider = fixture(classId, classId === 'mage' ? { convergence: 3 } : { downpour: 3 });
      base.context.loadout = wider.context.loadout = { element, rank: 3, mastery: true };
      base.step();
      wider.step();
      const a = base.kit.state.area!,
        b = wider.kit.state.area!;
      assert.equal(b.radius, a.radius * 1.3);
      assert.equal(b.maxPulses, a.maxPulses);
      wider.context.techniques = {};
      wider.context.hero.x = 10;
      wider.step(10);
      assert.equal(b.radius, a.radius * 1.3);
      assert.deepEqual(b.center, a.center);
    }
});

test('Abanico sends two angled arrows, snapshots damage and never grants or removes Precision for side hits/misses', () => {
  const f = fixture('archer', { fan: 3 }, [
    { x: 0, z: -6 },
    { x: 0.97, z: -6 },
    { x: -0.97, z: -6 },
  ]);
  f.kit.state.skillCooldown = 999;
  f.step(11);
  assert.equal(f.kit.state.projectiles!.length, 3);
  f.context.techniques = {};
  f.context.damageMultiplier = 5;
  const hits = f.step(20);
  assert.equal(hits.length, 3);
  assert.deepEqual(
    hits.map(h => h.amount).sort((a, b) => a - b),
    [14.3, 14.3, 22],
  );
  assert.equal(f.kit.state.passiveStacks, 1);
  const miss = fixture('archer', { fan: 1 });
  miss.kit.state.skillCooldown = 999;
  miss.step(11);
  miss.kit.state.cooldown = 999;
  miss.step(65);
  assert.equal(miss.kit.state.passiveStacks, 1, 'missing side arrows must not reset the central successful shot');
});

test('Punta larga combines with Precisión and Air mastery but still stops at walls', () => {
  const f = fixture(
    'archer',
    { piercing: 3 },
    Array.from({ length: 9 }, (_, i) => ({ x: 0, z: -2 - i })),
  );
  f.context.loadout = { element: 'air', rank: 3, mastery: true };
  f.kit.state.skillCooldown = 999;
  f.kit.state.passiveStacks = 3;
  f.kit.state.passiveRemaining = 4;
  f.step(11);
  assert.equal(f.kit.state.attack!.pierce, 8);
  f.context.techniques = {};
  f.context.solids = [{ min: { x: -2, y: 0, z: -6.1 }, max: { x: 2, y: 3, z: -6 } }];
  assert.equal(f.step(20).length, 5);
  assert.equal(f.kit.state.passiveStacks, 3);
});

test('technique echoes and fans remain bounded and delayed shots cannot bypass walls', () => {
  for (const classId of ['mage', 'archer'] as const) {
    const f = fixture(classId, classId === 'mage' ? { echo: 3, focus: 3 } : { fan: 3, cadence: 3 });
    f.kit.state.skillCooldown = 999;
    f.step(13);
    f.context.solids = [{ min: { x: -4, y: 0, z: -3.1 }, max: { x: 4, y: 3, z: -3 } }];
    assert.equal(f.step(100).length, 0);
    assert.equal(f.kit.state.projectiles!.length, 0);
    f.kit.cancel();
    assert.equal(f.kit.state.area, undefined);
  }
});

test('modern Mage projectiles freeze in menus and clear on death', () => {
  const run = new Run(bounds, [], 3, 'mage', 'earth', TRAINING_EXPEDITION);
  for (let i = 0; i < 20; i++) run.step(dt, { x: 0, z: 7, yaw: 0 });
  assert.ok(run.combat.heroKit.state.projectiles!.length);
  run.progression.gain(4);
  const snapshot = JSON.stringify(run.combat.heroKit.state);
  run.step(2, hero);
  assert.equal(JSON.stringify(run.combat.heroKit.state), snapshot);
  const choice = run.progression.choice()!;
  assert.ok(run.choose(choice.id, choice.options[0]));
  run.shop.open();
  run.step(2, hero);
  assert.equal(JSON.stringify(run.combat.heroKit.state), snapshot);
  run.shop.close();
  run.combat.hp = 0;
  run.step(dt, hero);
  assert.equal(run.combat.heroKit.state.projectiles!.length, 0);
});

test('catalog and summaries expose ranks, occupied slots, gated upgrades and the omitted fourth technique', () => {
  const run = learnBuild('archer', 'cadence'),
    p = run.progression;
  assert.ok(techniqueSummary(p).includes('3/3'));
  const catalog = techniqueCatalog(p, 99);
  assert.equal(catalog.length, 4);
  assert.ok(catalog.find(e => e.id === 'cadence')!.status.includes('Fuera'));
  assert.ok(catalog.filter(e => e.id !== 'cadence').every(e => e.status.includes('Máximo')));
  const fresh = new Progression();
  assert.ok(techniqueCatalog(fresh, 1).every(e => e.status.includes('nivel 3')));
});

test('delayed echo is not drawn before release and disposes with the Mage view', () => {
  const scene = new THREE.Scene(),
    view = createMageSpellView(scene),
    c = new Combat(bounds, [], [{ x: 0, z: -6 }], false, classRuntime('mage'));
  c.techniques = { echo: 3 };
  c.loadout = { element: 'air', rank: 1, mastery: false };
  c.whirlwindCooldown = 999;
  for (let i = 0; i < 13; i++) c.step(dt, hero);
  view.update(c, 1);
  const root = scene.children[0],
    count = root.children.length;
  for (let i = 0; i < 8; i++) c.step(dt, hero);
  view.update(c, 1);
  assert.equal(root.children.length, count + 1);
  view.dispose();
  assert.equal(scene.children.length, 0);
});
