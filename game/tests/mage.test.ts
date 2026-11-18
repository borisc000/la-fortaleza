import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { MAGE } from '../src/content/classes/mage.ts';
import { WARRIOR } from '../src/content/classes/warrior.ts';
import { classRuntime, MAGE_RUNTIME } from '../src/domain/classes.ts';
import { MageKit } from '../src/domain/classes/mage-kit.ts';
import { MageEffects } from '../src/domain/classes/mage-effects.ts';
import { Combat } from '../src/domain/combat.ts';
import type { CombatEvent } from '../src/domain/combat.ts';
import type { HeroKitContext, HeroHit } from '../src/domain/hero-kit.ts';
import { Progression } from '../src/domain/progression.ts';
import { Run } from '../src/domain/run.ts';
import { splitDirectDamage } from '../src/content/elements.ts';
import { createWorld } from '../src/rendering/world.ts';
import { createMageSpellView } from '../src/rendering/mage-spells.ts';
import { createCombatView } from '../src/rendering/combat.ts';
import { PLAY_AREA, SIMULATION_STEP as dt } from '../src/content/config.ts';
import { AudioFeedback } from '../src/audio/game-audio.ts';

const bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
function fixture(positions = [{ x: 0, z: -8 }]) {
  const kit = new MageKit(),
    combat = new Combat(bounds, [], positions, false, MAGE_RUNTIME);
  const events: CombatEvent[] = [];
  let sequence = 0;
  const context: HeroKitContext = {
    hero: { x: 0, z: 0, yaw: Math.PI },
    alive: combat.enemies,
    solids: [],
    damageMultiplier: 1,
    loadout: { element: 'fire', rank: 1, mastery: false },
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

test('Mage requires a starting affinity, has 80 HP, and level 2 offers upgrades without choosing the element again', () => {
  assert.equal(classRuntime('mage').definition, MAGE);
  assert.throws(() => new Run(bounds, [], 1, 'mage', undefined, TRAINING_EXPEDITION), /requiere/);
  for (const element of ['fire', 'water'] as const) {
    const run = new Run(bounds, [], 1, 'mage', element, TRAINING_EXPEDITION);
    assert.equal(run.combat.hp, 80);
    assert.equal(run.combat.loadout.element, element);
    assert.equal(run.progression.affinityRank, 1);
    assert.equal(run.progression.pending, 0);
    run.progression.gain(4);
    const choice = run.progression.choice()!;
    assert.equal(choice.kind, 'upgrade');
    assert.ok(choice.options.every(o => !['fire', 'water', 'earth', 'air'].includes(o)));
    const selected = choice.options[0];
    assert.ok(run.choose(choice.id, selected));
    assert.equal(run.combat.loadout.element, element);
  }
  assert.equal(new Progression(WARRIOR, 'fire').element, undefined);
  assert.throws(() => {
    (MAGE.stats as { hp: number }).hp = 100;
  });
  assert.deepEqual(splitDirectDamage(24, { element: 'fire', rank: 1, mastery: false, pureElemental: true }), {
    physical: 0,
    elemental: 24,
  });
});

test('Mage bolts travel before hitting, use the target rather than camera direction, and preserve their cast loadout', () => {
  const f = fixture();
  f.kit.state.skillCooldown = 100;
  assert.equal(f.step(13).length, 0);
  assert.equal(f.kit.state.projectiles!.length, 1);
  const p = f.kit.state.projectiles![0];
  assert.ok(p.vz < 0);
  assert.equal(p.damage, 24);
  f.context.loadout = { element: 'water', rank: 3, mastery: true };
  f.context.damageMultiplier = 3;
  const hits = f.step(30);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].amount, 24);
  assert.equal(hits[0].loadout?.element, 'fire');
  assert.equal(f.kit.state.projectiles!.length, 0);
});

test('bolts strike the first intervening enemy, do not pierce, and stop at walls even after launch', () => {
  const f = fixture();
  f.kit.state.skillCooldown = 100;
  f.step(13);
  f.combat.addEnemies([{ x: 0, z: -3 }]);
  f.context.alive = [...f.combat.enemies].reverse();
  const hits = f.step(35);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].target?.id, 2);
  const blocked = fixture();
  blocked.kit.state.skillCooldown = 100;
  blocked.step(13);
  blocked.context.solids = [{ min: { x: -3, y: 0, z: -4 }, max: { x: 3, y: 3, z: -3.9 } }];
  assert.equal(blocked.step(60).length, 0);
  assert.equal(blocked.kit.state.projectiles!.length, 0);
  assert.equal(blocked.kit.state.attack, undefined);
});

test('every fourth released orb consumes three persistent charges and hits a nearby group once each', () => {
  const f = fixture([
    { x: 0, z: -8 },
    { x: 1, z: -8 },
  ]);
  f.kit.state.skillCooldown = 100;
  const hits = f.step(220),
    casts = f.events.filter(e => e.type === 'spell-cast');
  assert.equal(casts.length, 4);
  assert.deepEqual(
    casts.map(e => e.amount),
    [0, 0, 0, 1],
  );
  const burst = hits.filter(h => h.attackId === casts[3].attackId);
  assert.equal(burst.length, 2);
  assert.equal(new Set(burst.map(h => h.target?.id)).size, 2);
  assert.ok(burst.every(h => h.amount === 24 * 1.6));
  assert.equal(f.kit.state.passiveStacks, 0);
  f.kit.cancel();
  f.kit.state.passiveStacks = 2;
  f.context.alive = [];
  f.step(600);
  assert.equal(f.kit.state.passiveStacks, 2);
});

test('missed projectiles expire and ending a run clears all spells and area actions', () => {
  const f = fixture();
  f.kit.state.skillCooldown = 100;
  f.step(13);
  f.context.alive = [];
  assert.equal(f.step(90).length, 0);
  assert.equal(f.kit.state.projectiles!.length, 0);
  const c = new Combat(bounds, [], [{ x: 0, z: -8 }], false, MAGE_RUNTIME);
  c.loadout = { element: 'water', rank: 1, mastery: false };
  c.heroKit.state.skillCooldown = 100;
  for (let i = 0; i < 14; i++) c.step(dt, { x: 0, z: 0, yaw: 0 });
  assert.ok(c.heroKit.state.projectiles!.length);
  c.hp = 0;
  c.step(dt, { x: 0, z: 0, yaw: 0 });
  assert.equal(c.status, 'defeat');
  assert.equal(c.heroKit.state.projectiles!.length, 0);
  assert.equal(c.attack, undefined);
  assert.equal(c.whirlwind, undefined);
});

test('Cataclysm has a warning, stays at the original target position, and starts its full cooldown after three pulses', () => {
  const f = fixture();
  f.step();
  const area = f.kit.state.area!;
  assert.ok(area);
  assert.equal(area.pulses, 0);
  f.context.hero.x = 12;
  f.combat.enemies[0].x = 0.5;
  f.context.damageMultiplier = 9;
  assert.equal(f.step(38).length, 0);
  const first = f.step();
  assert.equal(first.length, 1);
  assert.equal(first[0].amount, 18);
  assert.deepEqual(first[0].origin, { x: 0, z: -8 });
  const rest = f.step(63).filter(h => h.source === 'cataclysm');
  assert.equal(rest.length, 2);
  assert.deepEqual(area.center, { x: 0, z: -8 });
  assert.equal(f.kit.state.area, undefined);
  assert.ok(Math.abs(f.kit.state.skillCooldown - 14) < 1e-7);
});

test('Cataclysm waits for the current cast and cannot harm enemies behind a wall or in their spawn warning', () => {
  const f = fixture([
    { x: 0, z: -8 },
    { x: 2, z: -8 },
  ]);
  f.kit.state.skillCooldown = 100;
  f.step(13);
  f.kit.state.skillCooldown = 0;
  f.step();
  assert.equal(f.kit.state.area, undefined);
  f.step(12);
  assert.ok(f.kit.state.area);
  f.context.solids = [{ min: { x: 0.8, y: 0, z: -12 }, max: { x: 1, y: 3, z: -5 } }];
  const hits = f.step(105).filter(h => h.source === 'cataclysm');
  assert.ok(hits.length);
  assert.ok(hits.every(h => h.target?.id === 1));
  const c = new Combat(bounds, [], [], false, MAGE_RUNTIME);
  c.loadout = { element: 'fire', rank: 1, mastery: false };
  c.addEnemies([{ x: 0, z: -5 }], 2);
  for (let i = 0; i < 60; i++) c.step(dt, { x: 0, z: 0, yaw: 0 });
  assert.equal(c.attack, undefined);
  assert.equal(c.whirlwind, undefined);
  assert.equal(c.enemies[0].hp, c.enemies[0].maxHp);
});

test('Mage masteries change Cataclysm independently and snapshot the chosen rank and mastery', () => {
  const fire = fixture();
  fire.context.loadout = { element: 'fire', rank: 3, mastery: true };
  fire.step();
  assert.equal(fire.kit.state.area!.maxPulses, 5);
  fire.context.loadout.mastery = false;
  const hits = fire.step(150).filter(h => h.source === 'cataclysm');
  assert.equal(hits.length, 5);
  assert.ok(hits.every(h => Math.abs(h.amount - 21.6) < 1e-8));
  const water = fixture();
  water.context.loadout = { element: 'water', rank: 3, mastery: true };
  water.step();
  assert.equal(water.kit.state.area!.radius, 4);
  assert.equal(water.kit.state.area!.maxPulses, 3);
});

test('Mage fire refreshes the strongest burn without stacking; Water only pushes mastered Cataclysm from its center', () => {
  const f = fixture(),
    effects = new MageEffects(bounds, []),
    e = f.combat.enemies[0];
  effects.direct(e, 'spell', 24, 1, f.context.hero, [e], { element: 'fire', rank: 1, mastery: false });
  effects.direct(e, 'cataclysm', 18, 2, f.context.hero, [e], { element: 'fire', rank: 1, mastery: false });
  assert.ok(Math.abs(e.burn!.dps - 4.8) < 1e-8);
  assert.equal(e.burn!.remaining, 3);
  const burn = effects.update(3.5, [e]);
  assert.equal(burn.length, 6);
  effects.cleanup([e]);
  assert.equal(e.burn, undefined);
  const before = e.z;
  effects.direct(e, 'spell', 24, 3, f.context.hero, [e], { element: 'water', rank: 3, mastery: true });
  assert.equal(e.z, before);
  assert.equal(e.wetRemaining, 3);
  effects.direct(e, 'cataclysm', 18, 4, { x: 0, z: -10 }, [e], { element: 'water', rank: 3, mastery: true });
  assert.ok(e.z > before, 'Push must point away from the ground center, not away from the player');
  assert.deepEqual(effects.explosions(), { hits: [], visuals: [] });
});

test('level-up and shop pauses freeze Mage projectiles, charges, area and clocks; fresh expeditions are isolated', () => {
  const run = new Run(bounds, [], 3, 'mage', 'water', TRAINING_EXPEDITION);
  const hero = { x: 0, z: 7, yaw: 0 };
  run.combat.heroKit.state.skillCooldown = 100;
  for (let i = 0; i < 20; i++) run.step(dt, hero);
  assert.ok(run.combat.heroKit.state.projectiles!.length);
  run.progression.gain(4);
  const snapshot = JSON.stringify(run.combat.heroKit.state),
    time = run.combat.time;
  for (let i = 0; i < 60; i++) run.step(dt, hero);
  assert.equal(JSON.stringify(run.combat.heroKit.state), snapshot);
  assert.equal(run.combat.time, time);
  assert.ok(run.choose(run.progression.choice()!.id, run.progression.choice()!.options[0]));
  run.shop.open();
  run.step(2, hero);
  assert.equal(JSON.stringify(run.combat.heroKit.state), snapshot);
  assert.equal(run.combat.time, time);
  const fresh = new Run(bounds, [], 3, 'mage', 'fire', TRAINING_EXPEDITION);
  assert.equal(fresh.progression.affinityRank, 1);
  assert.equal(fresh.combat.heroKit.state.projectiles!.length, 0);
  assert.equal(fresh.combat.impetusStacks, 0);
  run.shop.close();
  run.step(dt, hero);
  assert.ok(run.combat.time > time);
});

test('Mage models and spell representation survive repeated class switches without leftover actors', () => {
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
    for (const definition of [MAGE, WARRIOR, MAGE]) {
      const previous = world.hero.root;
      world.replaceHero(definition);
      assert.equal(previous.parent, null);
      assert.equal(world.scene.children.length, count);
      assert.ok(world.hero.root.name.includes(definition.name));
      world.hero.walk(dt, 5);
      world.hero.combatPose(0.2, 0.5, true, 3);
      world.hero.fade(0.5);
      world.hero.resetPose();
    }
    const c = new Combat(PLAY_AREA, world.movementSolids, [{ x: 0, z: 0 }], false, MAGE_RUNTIME);
    c.loadout = { element: 'fire', rank: 1, mastery: false };
    c.step(dt, { x: 0, z: 7, yaw: 0 });
    const spells = createMageSpellView(world.scene),
      view = createCombatView(world.scene, MAGE);
    spells.update(c, 0.5);
    view.update(c, new THREE.Vector3(0, 0, 7), new THREE.PerspectiveCamera(), 0.5, dt);
    assert.ok(c.whirlwind?.center);
    spells.reset();
    spells.dispose();
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

test('Mage audio routes cast and Cataclysm separately from Warrior cues', () => {
  const run = new Run(bounds, [], 3, 'mage', 'fire', TRAINING_EXPEDITION),
    feedback = new AudioFeedback(80),
    cues: string[] = [];
  feedback.update(
    run,
    [
      { id: 1, type: 'spell-cast', target: 0, amount: 0, x: 0, z: 0 },
      { id: 2, type: 'cataclysm-start', target: 0, amount: 0, x: 0, z: 0 },
    ],
    cue => cues.push(cue),
  );
  assert.deepEqual(cues, ['spell', 'cataclysm']);
});

for (const element of ['fire', 'water'] as const)
  test(`Mage ${element} clears three approaching soldiers with its normal 80 HP`, () => {
    const c = new Combat(
      bounds,
      [],
      [
        { x: 0, z: -8 },
        { x: -1, z: -8 },
        { x: 1, z: -8 },
      ],
      true,
      MAGE_RUNTIME,
    );
    c.loadout = { element, rank: 1, mastery: false };
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
    assert.equal(c.maxHp, 80);
  });
