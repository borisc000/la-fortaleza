import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Progression } from '../src/domain/progression.ts';
import { classDefinition } from '../src/content/classes.ts';
import { damageLabels } from '../src/rendering/damage-labels.ts';
import type { CombatEvent } from '../src/domain/combat.ts';
import { Exploration } from '../src/domain/exploration.ts';
const bounds = { minX: -35, maxX: 35, minZ: -35, maxZ: 45 };

test('dense XP curve keeps the first affinity early and reduces 1300 essence to a bounded choice budget', () => {
  const p = new Progression(classDefinition('mage'), 'fire', true);
  p.gain(4);
  assert.equal(p.level, 2);
  assert.equal(p.threshold, 24);
  p.gain(23);
  assert.equal(p.level, 2);
  p.gain(1);
  assert.equal(p.level, 3);
  p.gain(1272);
  assert.equal(p.totalEssence, 1300);
  assert.equal(p.level, 16);
  assert.equal(p.pending, 15);
  while (p.pending) {
    const c = p.choice()!;
    assert.ok(p.choose(c.id, c.options[0]));
  }
  assert.equal(p.pending, 0);
  assert.ok(p.xp < p.threshold);
});

test('eight unique normal deaths grant one coin, duplicates and retirement do not add rewards', () => {
  const e = new Exploration(bounds, [], 3, 0.4, true, TRAINING_EXPEDITION);
  e.objects.splice(0);
  const deaths: CombatEvent[] = Array.from({ length: 80 }, (_, i) => ({
    id: i + 1,
    target: i + 1,
    type: 'death',
    enemyKind: 'thrall',
    amount: 0,
    x: 0,
    z: 0,
  }));
  e.receive(deaths.slice(0, 7));
  assert.equal(e.objects.filter(o => o.kind === 'coins').length, 0);
  e.receive(deaths);
  e.receive(deaths);
  assert.equal(
    e.objects.filter(o => o.kind === 'coins').reduce((sum, o) => sum + o.amount, 0),
    10,
  );
  assert.equal(e.objects.filter(o => o.combatDrop && o.kind === 'supply').length, 3);
  assert.ok(e.objects.filter(o => o.combatDrop && o.kind === 'supply').every(o => o.amount === 12));
  e.receive(Array.from({ length: 160 }, (_, i) => ({ ...deaths[0], id: i + 81, target: i + 81 })));
  assert.equal(e.objects.filter(o => o.combatDrop && o.kind === 'supply').length, 4);
});

test('damage labels combine pulses, bound visual noise and retain incoming hero damage', () => {
  const hits: CombatEvent[] = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    target: i + 1,
    type: 'hit',
    amount: 12,
    x: 0,
    z: 0,
  }));
  hits.push({ ...hits[0], id: 101, amount: 9 }, { ...hits[0], id: 102, target: 0, amount: 6 });
  const result = damageLabels(hits);
  assert.equal(result.length, 8);
  assert.equal(result.at(-1)!.target, 0);
  assert.equal(result.find(e => e.target === 1)!.amount, 21);
  assert.equal(hits[0].amount, 12);
});
