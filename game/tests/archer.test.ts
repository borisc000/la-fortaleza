import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ARCHER, ARCHER_KIT as K } from '../src/content/classes/archer.ts';
import { WARRIOR } from '../src/content/classes/warrior.ts';
import { MAGE } from '../src/content/classes/mage.ts';
import { ARCHER_RUNTIME, classRuntime } from '../src/domain/classes.ts';
import { ArcherKit } from '../src/domain/classes/archer-kit.ts';
import { ArcherEffects } from '../src/domain/classes/archer-effects.ts';
import { Combat } from '../src/domain/combat.ts';
import type { CombatEvent } from '../src/domain/combat.ts';
import type { HeroKitContext, HeroHit } from '../src/domain/hero-kit.ts';
import { Run } from '../src/domain/run.ts';
import { createWorld } from '../src/rendering/world.ts';
import { createArcherArrowView } from '../src/rendering/archer-arrows.ts';
import { createMageSpellView } from '../src/rendering/mage-spells.ts';
import { createCombatView } from '../src/rendering/combat.ts';
import { AudioFeedback } from '../src/audio/game-audio.ts';
import { SIMULATION_STEP as dt } from '../src/content/config.ts';

const bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
const wall = { min: { x: -3, y: 0, z: -4 }, max: { x: 3, y: 3, z: -3.9 } };
function fixture(positions = [{ x: 0, z: -8 }]) {
  const kit = new ArcherKit(),
    combat = new Combat(bounds, [], positions, false, ARCHER_RUNTIME);
  const events: CombatEvent[] = [];
  let sequence = 0;
  const context: HeroKitContext = {
    hero: { x: 0, z: 0, yaw: Math.PI },
    alive: combat.enemies,
    solids: [],
    damageMultiplier: 1,
    loadout: { rank: 0, mastery: false },
    nextId: () => ++sequence,
    emit: (type, target, amount, point, source, attackId) =>
      events.push({ id: ++sequence, type, target, amount, ...point, source, attackId }),
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
  return { kit, combat, context, events, step };
}

test('Archer starts physical, picks affinity at level 2 and shares shops/upgrades with its own stats', () => {
  assert.equal(classRuntime('archer').definition, ARCHER);
  const run = new Run(bounds, [], 3, 'archer', 'fire', TRAINING_EXPEDITION);
  assert.equal(run.combat.hp, 90);
  assert.equal(run.progression.element, undefined);
  assert.equal(run.progression.speed, 5.2);
  run.progression.gain(4);
  const choice = run.progression.choice()!;
  assert.equal(choice.kind, 'element');
  assert.ok(run.choose(choice.id, 'water'));
  assert.equal(run.combat.loadout.element, 'water');
  run.exploration.coins = 100;
  run.shop.open();
  assert.ok(run.shop.buy('speed', run.shop.revision, run.exploration, run.progression, run.combat));
  assert.equal(run.progression.speed, 5.5);
  assert.equal(run.progression.ranks.speed, 1);
  assert.throws(() => {
    (ARCHER.stats as { hp: number }).hp = 120;
  });
  assert.throws(() => {
    (K.precision.targets as number[])[0] = 5;
  });
});

test('arrows have flight time, ignore camera facing and snapshot direction, damage, affinity and penetration', () => {
  const f = fixture();
  f.kit.state.skillCooldown = 100;
  f.kit.state.passiveStacks = 3;
  f.kit.state.passiveRemaining = 4;
  f.context.loadout = { element: 'fire', rank: 2, mastery: false };
  f.step();
  f.context.damageMultiplier = 5;
  f.context.loadout = { element: 'water', rank: 3, mastery: true };
  f.context.hero.yaw = -Math.PI / 2;
  assert.equal(f.step(10).length, 0);
  const p = f.kit.state.projectiles[0];
  assert.equal(p.maxHits, 3);
  assert.equal(p.damage, 22);
  assert.equal(p.loadout.element, 'fire');
  assert.ok(p.vz < 0);
  const hits = f.step(22);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].amount, 22);
  assert.equal(hits[0].target?.id, 1);
});

test('three consecutive successful arrows unlock penetration, and each arrow contributes only one Precision stack', () => {
  const f = fixture();
  f.kit.state.skillCooldown = 100;
  f.step(170);
  const shots = f.events.filter(e => e.type === 'arrow-shot');
  assert.deepEqual(
    shots.slice(0, 4).map(e => e.amount),
    [1, 1, 2, 3],
  );
  assert.equal(f.kit.state.passiveStacks, 3);
  const group = fixture([
    { x: 0, z: -3 },
    { x: 0, z: -5 },
    { x: 0, z: -7 },
    { x: 0, z: -9 },
  ]);
  group.kit.state.skillCooldown = 100;
  group.kit.state.passiveStacks = 3;
  group.kit.state.passiveRemaining = 4;
  group.step();
  group.kit.state.passiveStacks = 0;
  group.kit.state.passiveRemaining = 0;
  const hits = group.step(32);
  assert.deepEqual(
    hits.map(h => h.target?.id),
    [1, 2, 3],
  );
  assert.equal(new Set(hits.map(h => h.target?.id)).size, 3);
  assert.equal(group.kit.state.passiveStacks, 1);
  assert.ok(hits.every(h => h.amount === 22));
});

test('penetration follows the line rather than selecting nearby targets, and walls stop the rest of an arrow', () => {
  const f = fixture([
    { x: 0, z: -3 },
    { x: 0, z: -6 },
    { x: 1.5, z: -5 },
  ]);
  f.kit.state.skillCooldown = 100;
  f.kit.state.passiveStacks = 3;
  f.kit.state.passiveRemaining = 4;
  const hits = f.step(35);
  assert.deepEqual(
    hits.map(h => h.target?.id),
    [1, 2],
  );
  const blocked = fixture([
    { x: 0, z: -3 },
    { x: 0, z: -6 },
  ]);
  blocked.kit.state.skillCooldown = 100;
  blocked.kit.state.passiveStacks = 3;
  blocked.kit.state.passiveRemaining = 4;
  blocked.context.solids = [wall];
  const blockedHits = blocked.step(35);
  assert.deepEqual(
    blockedHits.map(h => h.target?.id),
    [1],
  );
  assert.equal(blocked.kit.state.projectiles.length, 0);
  assert.equal(blocked.kit.state.passiveStacks, 3, 'An arrow which hit before a wall is successful');
});

test('missing or hitting a wall without any enemy resets Precision; inactivity also expires it', () => {
  const f = fixture();
  f.kit.state.skillCooldown = 100;
  f.kit.state.passiveStacks = 2;
  f.kit.state.passiveRemaining = 4;
  f.step(11);
  f.context.alive = [];
  f.step(55);
  assert.equal(f.kit.state.passiveStacks, 0);
  assert.equal(f.kit.state.projectiles.length, 0);
  const blocked = fixture();
  blocked.kit.state.skillCooldown = 100;
  blocked.kit.state.passiveStacks = 2;
  blocked.kit.state.passiveRemaining = 4;
  blocked.step(11);
  blocked.context.solids = [wall];
  assert.equal(blocked.step(30).length, 0);
  assert.equal(blocked.kit.state.passiveStacks, 0);
  f.kit.cancel();
  f.kit.state.passiveStacks = 3;
  f.kit.state.passiveRemaining = 4;
  f.step(240);
  assert.equal(f.kit.state.passiveStacks, 0);
  assert.equal(f.kit.state.passiveRemaining, 0);
});

test('moving targets can evade the frozen arrow direction and projectiles remain bounded', () => {
  const f = fixture();
  f.kit.state.skillCooldown = 100;
  f.step(11);
  f.combat.enemies[0].x = 4;
  const id = f.events.find(e => e.type === 'arrow-shot')!.attackId;
  const hits = f.step(60);
  assert.ok(hits.every(h => h.attackId !== id));
  assert.ok(f.kit.state.projectiles.length <= K.projectile.cap);
});

test('Rain is telegraphed, fixed in the world, snapshots damage and does not grant Precision', () => {
  const f = fixture();
  f.step();
  const area = f.kit.state.area!;
  assert.equal(area.pulses, 0);
  f.context.hero.x = 15;
  f.combat.enemies[0].x = 0.5;
  f.context.damageMultiplier = 10;
  assert.equal(f.step(35).length, 0);
  const hits = [...f.step(), ...f.step(84)];
  assert.equal(hits.length, 4);
  assert.ok(hits.every(h => h.amount === 14 && h.source === 'rain'));
  assert.deepEqual(area.center, { x: 0, z: -8 });
  assert.equal(f.kit.state.passiveStacks, 0);
  assert.equal(f.kit.state.area, undefined);
  assert.ok(Math.abs(f.kit.state.skillCooldown - 16) < 1e-7);
});

test('Rain waits for an active shot and honors obstacles and spawn warnings', () => {
  const f = fixture([
    { x: 0, z: -8 },
    { x: 2, z: -8 },
  ]);
  f.kit.state.skillCooldown = 100;
  f.step(11);
  f.kit.state.skillCooldown = 0;
  f.step();
  assert.equal(f.kit.state.area, undefined);
  f.step(10);
  assert.ok(f.kit.state.area);
  f.context.solids = [{ min: { x: 0.8, y: 0, z: -12 }, max: { x: 1, y: 3, z: -5 } }];
  const hits = f.step(120).filter(h => h.source === 'rain');
  assert.equal(hits.length, 4);
  assert.ok(hits.every(h => h.target?.id === 1));
  const c = new Combat(bounds, [], [], false, ARCHER_RUNTIME);
  c.addEnemies([{ x: 0, z: -4 }], 2);
  for (let i = 0; i < 60; i++) c.step(dt, { x: 0, z: 0, yaw: 0 });
  assert.equal(c.attack, undefined);
  assert.equal(c.whirlwind, undefined);
  assert.equal(c.enemies[0].hp, c.enemies[0].maxHp);
});

test('Fire mastery adds two rain volleys and Water mastery enlarges its area without adding a second transformation', () => {
  const fire = fixture();
  fire.context.loadout = { element: 'fire', rank: 3, mastery: true };
  fire.step();
  fire.context.loadout.mastery = false;
  assert.equal(fire.kit.state.area!.maxPulses, 6);
  assert.equal(fire.step(162).filter(h => h.source === 'rain').length, 6);
  const water = fixture();
  water.context.loadout = { element: 'water', rank: 3, mastery: true };
  water.step();
  assert.equal(water.kit.state.area!.radius, 4.2);
  assert.equal(water.kit.state.area!.maxPulses, 4);
});

test('Archer Fire uses its elemental share, while Water splashes once per arrow with no recursive effects', () => {
  const f = fixture([
    { x: 0, z: -8 },
    { x: 0.8, z: -8 },
    { x: 2, z: -8 },
  ]);
  const effects = new ArcherEffects([]),
    [a, b, c] = f.combat.enemies;
  effects.direct(a, 'arrow', 22, 1, f.context.hero, f.combat.enemies, { element: 'fire', rank: 1, mastery: false });
  assert.ok(Math.abs(a.burn!.dps - 22 * 0.3 * 0.2) < 1e-8);
  assert.equal(effects.update(3, [a]).length, 6);
  effects.cleanup([a]);
  assert.equal(a.burn, undefined);
  const loadout = { element: 'water' as const, rank: 3, mastery: false };
  const first = effects.direct(a, 'arrow', 22, 2, f.context.hero, f.combat.enemies, loadout);
  assert.deepEqual(
    first.hits.map(h => h.target.id),
    [b.id],
  );
  assert.equal(first.hits[0].amount, 10);
  assert.equal(a.wetRemaining, 3);
  assert.equal(b.wetRemaining, 3);
  assert.equal(effects.direct(b, 'arrow', 22, 2, f.context.hero, f.combat.enemies, loadout).hits.length, 0);
  assert.equal(effects.direct(b, 'splash', 10, 2, f.context.hero, f.combat.enemies, loadout).hits.length, 0);
  assert.equal(effects.direct(a, 'rain', 14, 3, f.context.hero, f.combat.enemies, loadout).hits.length, 0);
  const mastered = effects.direct(a, 'arrow', 22, 4, f.context.hero, f.combat.enemies, { ...loadout, mastery: true });
  assert.ok(mastered.hits.some(h => h.target.id === c.id));
  const barrier = new ArcherEffects([{ min: { x: 0.4, y: 0, z: -10 }, max: { x: 0.5, y: 2, z: -6 } }]);
  assert.equal(barrier.direct(a, 'arrow', 22, 5, f.context.hero, f.combat.enemies, loadout).hits.length, 0);
  assert.deepEqual(effects.explosions(), { hits: [], visuals: [] });
});

test('upgrades and shop freeze arrow flight and Precision; defeat and restart clear actions', () => {
  const run = new Run(bounds, [], 3, 'archer', undefined, TRAINING_EXPEDITION),
    hero = { x: 0, z: 7, yaw: 0 };
  run.combat.heroKit.state.skillCooldown = 100;
  for (let i = 0; i < 15; i++) run.step(dt, hero);
  assert.ok(run.combat.heroKit.state.projectiles!.length);
  run.progression.gain(4);
  const snapshot = JSON.stringify(run.combat.heroKit.state),
    time = run.combat.time;
  run.step(2, hero);
  assert.equal(JSON.stringify(run.combat.heroKit.state), snapshot);
  assert.equal(run.combat.time, time);
  run.choose(run.progression.choice()!.id, 'fire');
  run.shop.open();
  run.step(2, hero);
  assert.equal(JSON.stringify(run.combat.heroKit.state), snapshot);
  run.shop.close();
  run.combat.hp = 0;
  run.step(dt, hero);
  assert.equal(run.combat.status, 'defeat');
  assert.equal(run.combat.heroKit.state.projectiles!.length, 0);
  assert.equal(run.combat.whirlwind, undefined);
  const fresh = new Run(bounds, [], 3, 'archer', undefined, TRAINING_EXPEDITION);
  assert.equal(fresh.progression.element, undefined);
  assert.equal(fresh.combat.impetusStacks, 0);
  assert.equal(fresh.combat.hp, 90);
});

test('all three character views can switch cleanly; Archer projectiles never appear as Mage orbs', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  const count = world.scene.children.length;
  try {
    for (const definition of [ARCHER, MAGE, WARRIOR, ARCHER]) {
      const old = world.hero.root;
      world.replaceHero(definition);
      assert.equal(old.parent, null);
      assert.equal(world.scene.children.length, count);
      assert.ok(world.hero.root.name.includes(definition.name));
      world.hero.walk(dt, 5);
      world.hero.combatPose(0.1, 0.2, true, 3);
      world.hero.fade(0.5);
      world.hero.resetPose();
    }
    const c = new Combat(bounds, [], [{ x: 0, z: -8 }], false, ARCHER_RUNTIME);
    c.whirlwindCooldown = 100;
    for (let i = 0; i < 11; i++) c.step(dt, { x: 0, z: 0, yaw: 0 });
    const arrows = createArcherArrowView(world.scene),
      mage = createMageSpellView(world.scene),
      view = createCombatView(world.scene, ARCHER);
    const mageRoot = world.scene.children[count + 1] as THREE.Group,
      before = mageRoot.children.length;
    arrows.update(c, 0.5);
    mage.update(c, 0.5);
    assert.equal(mageRoot.children.length, before);
    view.update(c, new THREE.Vector3(), new THREE.PerspectiveCamera(), 0.5, dt);
    c.attack = undefined;
    c.whirlwindCooldown = 0;
    c.step(dt, { x: 0, z: 0, yaw: 0 });
    c.whirlwind!.age = 0.4;
    arrows.update(c, 0.5);
    arrows.dispose();
    mage.dispose();
    view.dispose();
    assert.equal(world.scene.children.length, count);
    world.scene.traverse(o => {
      if (o instanceof THREE.Mesh)
        for (const n of o.geometry.getAttribute('position').array) assert.ok(Number.isFinite(n));
    });
  } finally {
    world.dispose();
  }
});

test('Archer audio routes bow and rain events separately from other classes', () => {
  const run = new Run(bounds, [], 3, 'archer', undefined, TRAINING_EXPEDITION),
    feedback = new AudioFeedback(90),
    cues: string[] = [];
  feedback.update(
    run,
    [
      { id: 1, type: 'arrow-shot', target: 0, amount: 1, x: 0, z: 0 },
      { id: 2, type: 'rain-start', target: 0, amount: 0, x: 0, z: 0 },
    ],
    cue => cues.push(cue),
  );
  assert.deepEqual(cues, ['arrow', 'rain']);
});

for (const element of [undefined, 'fire', 'water'] as const)
  test(`Archer ${element ?? 'physical'} clears three approaching soldiers with normal 90 HP`, () => {
    const c = new Combat(
      bounds,
      [],
      [
        { x: 0, z: -8 },
        { x: -1, z: -8 },
        { x: 1, z: -8 },
      ],
      true,
      ARCHER_RUNTIME,
    );
    c.loadout = { element, rank: element ? 1 : 0, mastery: false };
    const deaths = new Set<number>();
    for (let i = 0; i < 3600 && c.status === 'running'; i++) {
      c.step(dt, { x: 0, z: 0, yaw: 0 });
      for (const e of c.takeEvents())
        if (e.type === 'death') {
          assert.ok(!deaths.has(e.target));
          deaths.add(e.target);
        }
    }
    assert.equal(c.status, 'victory');
    assert.equal(c.kills, 3);
    assert.ok(c.hp > 0);
    assert.equal(c.maxHp, 90);
    assert.equal(c.heroKit.state.projectiles!.length, 0);
  });
