import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Combat } from '../src/domain/combat.ts';
import { Run } from '../src/domain/run.ts';
import { classRuntime } from '../src/domain/classes.ts';
import { MageKit } from '../src/domain/classes/mage-kit.ts';
import { ArcherKit } from '../src/domain/classes/archer-kit.ts';
import { MageEffects } from '../src/domain/classes/mage-effects.ts';
import { ArcherEffects } from '../src/domain/classes/archer-effects.ts';
import { mageRange } from '../src/content/classes/mage.ts';
import { archerRange } from '../src/content/classes/archer.ts';
import { ELEMENTS } from '../src/content/elements.ts';
import type { Element } from '../src/content/elements.ts';
import type { HeroHit, HeroKitContext } from '../src/domain/hero-kit.ts';
import { SIMULATION_STEP as dt } from '../src/content/config.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { overlaps } from '../src/domain/movement.ts';
import { createMageSpellView } from '../src/rendering/mage-spells.ts';
import { createArcherArrowView } from '../src/rendering/archer-arrows.ts';

const bounds = { minX: -30, maxX: 30, minZ: -30, maxZ: 30 },
  hero = { x: 0, z: 0, yaw: 0 };
function fixture(
  classId: 'mage' | 'archer',
  element: Element,
  rank = 1,
  mastery = false,
  positions = [{ x: 0, z: -8 }],
) {
  const combat = new Combat(bounds, [], positions, false, classRuntime(classId));
  const kit = classId === 'mage' ? new MageKit() : new ArcherKit();
  let id = 0;
  const context: HeroKitContext = {
    hero: { ...hero },
    alive: combat.enemies,
    solids: [],
    damageMultiplier: 1,
    loadout: { element, rank, mastery },
    nextId: () => ++id,
    emit: () => {},
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
  return { combat, kit, context, step };
}

test('all twelve builds can select their affinity, reach rank III, spend a core and restart cleanly', () => {
  for (const classId of ['warrior', 'mage', 'archer'] as const)
    for (const element of Object.keys(ELEMENTS) as Element[]) {
      const run = new Run(bounds, [], 1, classId, element, TRAINING_EXPEDITION),
        p = run.progression;
      p.gain(1000);
      if (classId !== 'mage') assert.ok(run.choose(p.choice()!.id, element));
      while (p.affinityRank < 3) {
        const choice = p.choice()!;
        assert.ok(choice);
        assert.ok(run.choose(choice.id, choice.options.includes('affinity') ? 'affinity' : choice.options[0]));
      }
      p.grantCore();
      assert.equal(p.choice()!.kind, 'mastery');
      assert.ok(p.option('mastery').description.length > 10);
      assert.ok(run.choose(p.choice()!.id, 'mastery'));
      assert.equal(run.combat.loadout.mastery, true);
      assert.equal(p.core, false);
      const fresh = new Run(bounds, [], 2, classId, element, TRAINING_EXPEDITION);
      assert.equal(fresh.progression.mastery, false);
      assert.equal(fresh.combat.heroKit.state.barrier, undefined);
    }
});

test('Mage Earth guard uses the released cast snapshot, lasts four seconds, and does not refresh before six seconds', () => {
  for (let rank = 1; rank <= 3; rank++) {
    const f = fixture('mage', 'earth', rank);
    f.kit.state.skillCooldown = 999;
    f.kit.state.passiveStacks = 3;
    f.step();
    f.context.loadout = { element: 'air', rank: 3, mastery: true };
    f.step(12);
    assert.equal(f.kit.state.barrier?.amount, [12, 16, 20][rank - 1]);
    assert.equal(f.kit.state.projectiles![0].loadout.element, 'earth');
    assert.equal(Math.hypot(f.kit.state.projectiles![0].vx, f.kit.state.projectiles![0].vz), 12);
    f.kit.state.barrier!.amount = 1;
    f.context.loadout = { element: 'earth', rank, mastery: false };
    f.kit.state.passiveStacks = 3;
    f.step(60);
    assert.equal(f.kit.state.barrier?.amount, 1);
    f.context.alive = [];
    f.step(180);
    assert.equal(f.kit.state.barrier, undefined);
    assert.ok(f.kit.state.barrierCooldown! > 0);
    f.step(150);
    f.context.alive = f.combat.enemies;
    f.kit.state.passiveStacks = 3;
    f.step(13);
    assert.equal(f.kit.state.barrier?.amount, [12, 16, 20][rank - 1]);
    f.kit.cancel();
    assert.equal(f.kit.state.barrier, undefined);
  }
});

test('Earth masteries retain fixed centers and double only the final area pulse', () => {
  for (const classId of ['mage', 'archer'] as const) {
    const f = fixture(classId, 'earth', 3, true);
    f.step();
    const center = { ...f.kit.state.area!.center! };
    f.context.hero.x = 20;
    f.context.damageMultiplier = 5;
    f.context.loadout = { element: 'fire', rank: 1, mastery: false };
    const hits = f.step(115).filter(h => h.source === (classId === 'mage' ? 'cataclysm' : 'rain'));
    const expected = classId === 'mage' ? [21.6, 21.6, 43.2] : [14, 14, 14, 28];
    assert.equal(hits.length, expected.length);
    hits.forEach((h, i) => assert.ok(Math.abs(h.amount - expected[i]) < 1e-8));
    assert.ok(hits.every(h => h.origin!.x === center.x && h.origin!.z === center.z && h.loadout!.element === 'earth'));
    if (classId === 'archer') assert.ok(hits.every(h => h.armorIgnore === 0.75));
    assert.equal(f.kit.state.passiveStacks, 0);
  }
});

test('Earth applies one non-stacking Quebranto to ranged hits and never a Water slow or splash', () => {
  const f = fixture('mage', 'earth'),
    e = f.combat.enemies[0];
  const mage = new MageEffects(bounds, []),
    archer = new ArcherEffects([]);
  for (const [effect, source] of [
    [mage, 'spell'],
    [mage, 'cataclysm'],
    [archer, 'arrow'],
    [archer, 'rain'],
  ] as const) {
    const result = effect.direct(e, source, 24, 1, hero, [e], { element: 'earth', rank: 3, mastery: true });
    assert.equal(e.brokenRemaining, 3);
    assert.equal(e.wetRemaining, 0);
    assert.equal(e.burn, undefined);
    assert.deepEqual(result, { hits: [], visuals: [] });
  }
});

test('Archer Earth armor penetration and subsequent Quebranto are applied by Combat, not render or status damage', () => {
  for (let rank = 1; rank <= 3; rank++) {
    const c = new Combat(bounds, [], [{ x: 0, z: -8 }], false, classRuntime('archer'));
    const e = c.enemies[0];
    e.hp = e.maxHp = 1000;
    e.armor = 100;
    c.loadout = { element: 'earth', rank, mastery: false };
    c.whirlwindCooldown = 999;
    const damages: number[] = [];
    for (let i = 0; i < 100 && damages.length < 2; i++) {
      c.step(dt, hero);
      for (const event of c.takeEvents()) if (event.type === 'hit' && event.target === e.id) damages.push(event.amount);
    }
    const expected = (22 * 100) / (200 - [15, 25, 35][rank - 1]);
    assert.equal(damages.length, 2);
    assert.ok(Math.abs(damages[0] - expected) < 1e-8);
    assert.ok(Math.abs(damages[1] - expected * 1.15) < 1e-8);
  }
});

test('Mage Air push/pull respect enemy resistance and leave attacks intact', () => {
  const c = new Combat(bounds, [], [], false),
    effects = new MageEffects(bounds, []);
  for (const kind of ['soldier', 'elite', 'boss'] as const) c.addEnemies([{ x: 0, z: -3 }], 0, kind);
  for (const e of c.enemies) {
    const attack = { id: 9, yaw: 0, age: 0.2, hits: new Set<number>() };
    e.attack = attack;
    effects.direct(e, 'spell', 24, 1, hero, c.enemies, { element: 'air', rank: 3, mastery: true }, hero);
    assert.ok(Math.abs(e.z - (-3 - 0.4 * ENEMIES[e.kind].push)) < 1e-8);
    const z = e.z;
    effects.direct(e, 'spell', 24, 2, hero, c.enemies, { element: 'air', rank: 3, mastery: true }, hero);
    assert.equal(e.z, z);
    effects.update(0.35, c.enemies);
    effects.direct(e, 'cataclysm', 18, 3, hero, c.enemies, { element: 'air', rank: 3, mastery: true }, hero);
    assert.ok(Math.abs(e.z - (z + 0.75 * ENEMIES[e.kind].push)) < 1e-8);
    assert.equal(e.attack, attack);
    assert.equal(e.wetRemaining, 0);
  }
});

test('Mage Air cannot pull through a wall, through the hero or beyond its fixed center', () => {
  const wall = { min: { x: -0.05, y: 0, z: -5 }, max: { x: 0.05, y: 3, z: 5 } };
  const f = fixture('mage', 'air', 3, true, [{ x: 0.6, z: 0 }]),
    e = f.combat.enemies[0];
  const loadout = { element: 'air' as const, rank: 3, mastery: true };
  new MageEffects(bounds, [wall]).direct(e, 'cataclysm', 18, 1, { x: -3, z: 0 }, [e], loadout);
  assert.equal(overlaps(e, e.radius, wall), false);
  assert.ok(e.x > 0);
  e.x = 1;
  e.z = 0;
  e.pushProtection = 0;
  new MageEffects(bounds, []).direct(e, 'cataclysm', 18, 2, { x: -2, z: 0 }, [e], loadout, hero);
  assert.ok(e.x >= e.radius + 0.4);
  e.pushProtection = 0;
  e.x = 1.1;
  new MageEffects(bounds, []).direct(e, 'cataclysm', 18, 3, { x: 0.5, z: 0 }, [e], loadout);
  assert.ok(e.x >= 0.5 + e.radius);
});

test('Air range and velocity scale by rank, allowing targets beyond the normal class reach', () => {
  for (let rank = 1; rank <= 3; rank++)
    for (const classId of ['mage', 'archer'] as const) {
      const f = fixture(classId, 'air', rank, false, [
        { x: 0, z: -(classId === 'mage' ? 10 + [1, 1.5, 2][rank - 1] : 12 + [2, 3, 4][rank - 1]) },
      ]);
      f.kit.state.skillCooldown = 999;
      f.step(13);
      const p = f.kit.state.projectiles![0];
      assert.ok(p);
      assert.equal(Math.hypot(p.vx, p.vz), classId === 'mage' ? 22 : [30, 33, 36][rank - 1]);
      assert.equal(
        classId === 'mage' ? mageRange(f.context.loadout) : archerRange(f.context.loadout),
        -f.combat.enemies[0].z,
      );
      assert.equal(f.step(60).length, 1);
      assert.equal(f.combat.enemies[0].wetRemaining, 0);
    }
});

test('Archer Air adds penetration without granting extra Precision per pierced enemy and snapshots its mastery', () => {
  for (const mastery of [false, true]) {
    const f = fixture(
      'archer',
      'air',
      3,
      mastery,
      [2, 3, 4, 5, 6, 7].map(z => ({ x: 0, z: -z })),
    );
    f.kit.state.skillCooldown = 999;
    f.kit.state.passiveStacks = 3;
    f.kit.state.passiveRemaining = 4;
    f.step(11);
    f.context.loadout = { element: 'earth', rank: 1, mastery: false };
    const hits = f.step(18);
    assert.equal(hits.length, mastery ? 5 : 4);
    assert.equal(new Set(hits.map(h => h.target!.id)).size, hits.length);
    assert.ok(hits.every(h => h.loadout?.element === 'air' && h.armorIgnore === 0));
    assert.equal(f.kit.state.passiveStacks, 3);
  }
  const f = fixture('archer', 'air', 1, true, [
    { x: 0, z: -2 },
    { x: 0, z: -3 },
    { x: 0, z: -4 },
  ]);
  f.kit.state.skillCooldown = 999;
  assert.equal(f.step(30).length, 3);
  assert.equal(f.kit.state.passiveStacks, 1);
});

test('Air masteries enlarge their areas without adding Fire pulses or following the player', () => {
  for (const classId of ['mage', 'archer'] as const) {
    const f = fixture(classId, 'air', 3, true);
    f.step();
    const area = f.kit.state.area!;
    assert.equal(area.radius, classId === 'mage' ? 3.2 * 1.3 : 3.5 * 1.25);
    assert.equal(area.maxPulses, classId === 'mage' ? 3 : 4);
    f.context.hero.x = 20;
    f.step(20);
    assert.deepEqual(area.center, { x: 0, z: -8 });
  }
});

test('fast Air shots and wider Earth rocks collide with thin walls even on a long simulation step', () => {
  for (const classId of ['mage', 'archer'] as const)
    for (const element of ['earth', 'air'] as const) {
      const f = fixture(classId, element, 3);
      f.kit.state.skillCooldown = 999;
      f.step(13);
      f.context.solids = [{ min: { x: -3, y: 0, z: -3.01 }, max: { x: 3, y: 3, z: -3 } }];
      f.kit.advance(0.5);
      assert.equal(f.kit.act(f.context).length, 0);
      assert.equal(f.kit.state.projectiles!.length, 0);
    }
});

test('new affinities render their own colors and shapes; Mage vortex is fixed to the cast location', () => {
  for (const classId of ['mage', 'archer'] as const)
    for (const element of ['earth', 'air'] as const) {
      const scene = new THREE.Scene(),
        view = classId === 'mage' ? createMageSpellView(scene) : createArcherArrowView(scene);
      const c = new Combat(bounds, [], [{ x: 0, z: -8 }], false, classRuntime(classId));
      c.loadout = { element, rank: 3, mastery: true };
      c.whirlwindCooldown = 999;
      for (let i = 0; i < 14; i++) c.step(dt, hero);
      view.update(c, 1);
      const colored: THREE.Mesh[] = [];
      scene.traverse(o => {
        if (
          o instanceof THREE.Mesh &&
          (o.material as THREE.MeshBasicMaterial).color?.getHex() === ELEMENTS[element].color
        )
          colored.push(o);
      });
      assert.ok(colored.length);
      if (classId === 'mage')
        assert.ok(
          colored.some(o => o.geometry.type === (element === 'earth' ? 'DodecahedronGeometry' : 'TorusGeometry')),
        );
      c.heroKit.cancel();
      c.cooldown = 0;
      c.whirlwindCooldown = 0;
      c.step(dt, hero);
      view.update(c, 1);
      if (classId === 'mage' && element === 'air') {
        const vortex = scene.getObjectByName('mage-vortex')!;
        assert.equal(vortex.visible, true);
        assert.equal(vortex.position.z, c.whirlwind!.center!.z);
      }
      view.reset();
      view.dispose();
      assert.equal(scene.children.length, 0);
    }
});

for (const classId of ['mage', 'archer'] as const)
  for (const element of ['earth', 'air'] as const)
    test(`${classId} ${element} clears a small encounter at normal starting HP`, () => {
      const c = new Combat(
        bounds,
        [],
        [
          { x: 0, z: -6 },
          { x: 1, z: -7 },
          { x: -1, z: -8 },
        ],
        true,
        classRuntime(classId),
      );
      c.loadout = { element, rank: 1, mastery: false };
      for (let i = 0; i < 1800 && c.status === 'running'; i++) c.step(dt, hero);
      assert.equal(c.status, 'victory');
      assert.equal(c.kills, 3);
      assert.ok(c.hp > 0);
    });
