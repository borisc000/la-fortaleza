import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Combat } from '../src/domain/combat.ts';
import { classRuntime } from '../src/domain/classes.ts';
import { RangedArsenal } from '../src/domain/classes/ranged-arsenal.ts';
import { trialBuild } from '../src/domain/ability-lab.ts';
import { createMageSpellView } from '../src/rendering/mage-spells.ts';
import { heroFacing } from '../src/rendering/hero.ts';

const bounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };
const hero = { x: 0, z: 0, yaw: 0 };
test('fractured cataclysm telegraphs both pulse centers and omits a lobe behind a wall', () => {
  const wall = { min: { x: 0.5, y: 0, z: -4.5 }, max: { x: 0.7, y: 2, z: -3.5 } };
  for (const solids of [[], [wall]]) {
    const kit = new RangedArsenal('mage', bounds);
    kit.abilities = trialBuild({
      abilityId: 'mage:cataclysm',
      level: 10,
      mutation: 1,
      finisher: 1,
      focus: 'expansion',
      element: 'air',
    }).abilities;
    const combat = new Combat(bounds, solids, [{ x: 0, z: -4 }], false, {
      ...classRuntime('mage'),
      createKit: () => kit,
    });
    combat.enemies[0].stationary = true;
    combat.loadout = { element: 'air', rank: 1, mastery: false };
    combat.step(1 / 60, hero);
    const scene = new THREE.Scene(),
      view = createMageSpellView(scene);
    view.update(combat, 1);
    const area = kit.state.area!;
    const centers = area.fractures!;
    assert.equal(centers.length, solids.length ? 1 : 2);
    assert.equal(centers[0].x, -1);
    const rings = scene.children[0].children.filter(
      o => o instanceof THREE.Mesh && o.geometry.type === 'RingGeometry' && o.visible && o.position.y === 0.09,
    );
    assert.deepEqual(
      rings.map(o => [o.position.x, o.position.z, o.scale.x]),
      centers.map(p => [p.x, p.z, p.radius]),
    );
    view.reset();
    assert.ok(rings.every(r => !r.visible));
    view.dispose();
  }
});
test('an archer faces the basic target during rain and braces toward the siege shot during its pose', () => {
  const combat = new Combat(bounds, [], [], false, classRuntime('archer'));
  combat.heroKit.state.area = {
    id: 1,
    yaw: 1,
    age: 0,
    duration: 2,
    radius: 3,
    pulses: 0,
    maxPulses: 4,
    loadout: combat.loadout,
  };
  assert.equal(heroFacing(combat, 0), 1);
  combat.attack = { id: 2, yaw: -0.5, age: 0.1, hits: new Set() };
  assert.equal(heroFacing(combat, 0), -0.5);
  combat.heroKit.state.siegePose = { age: 0, yaw: 2 };
  assert.equal(heroFacing(combat, 0), 2);
});
