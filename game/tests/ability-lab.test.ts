import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ABILITY_CATALOG } from '../src/content/ability-schema.ts';
import { createAbilityTrial, trialBuild, type TrialConfig } from '../src/domain/ability-lab.ts';

const config = (abilityId: string): TrialConfig => ({
  abilityId,
  level: 1,
  focus: 'expansion',
  mutation: 0,
  finisher: 0,
  element: 'fire',
});

test('trial progression uses legal branch budgets and unlocks variants only at 5 and 10', () => {
  for (const ability of ABILITY_CATALOG)
    for (let level = 1; level <= 10; level++) {
      const { state, abilities } = trialBuild({ ...config(ability.id), level });
      assert.equal(state.level, level);
      assert.equal(state.mutation, level >= 5 ? 0 : undefined);
      assert.equal(state.finisher, level === 10 ? 0 : undefined);
      assert.equal(
        Object.values(state.branches).reduce((a, b) => a + b, 0),
        level - 1 - (level >= 5 ? 1 : 0) - (level === 10 ? 1 : 0),
      );
      assert.ok(Object.values(state.branches).every(n => n <= 3));
      assert.equal(abilities.length, ability.kind === 'basic' ? 1 : 2);
    }
  assert.throws(() => trialBuild({ ...config('warrior:sword'), level: 11 }));
  assert.throws(() => trialBuild(config('archer:nonexistent')));
});

for (const ability of ABILITY_CATALOG)
  test(`${ability.id} trial activates at level 1 and both level 10 variants`, () => {
    for (const [level, path, element] of [
      [1, 0, 'fire'],
      [10, 0, 'water'],
      [10, 1, 'air'],
    ] as const) {
      const trial = createAbilityTrial({ ...config(ability.id), level, mutation: path, finisher: path, element });
      let activated = false;
      for (let i = 0; i < 390; i++) {
        trial.step();
        activated ||= ability.kind === 'basic' ? !!trial.combat.attack : trial.kit.clock.remaining(ability.id) > 0;
      }
      assert.ok(activated, `${ability.id}/${level}/${path} should actually execute`);
      assert.equal(trial.combat.status, 'running');
      assert.equal(trial.combat.kills, 0);
      assert.ok(trial.combat.enemies.every(e => e.hp === e.maxHp && !e.dead && !e.attack && e.speed === 0));
      assert.equal(trial.combat.hp, trial.combat.maxHp);
      assert.ok(Number.isFinite(trial.damage));
      if (ability.kind === 'basic') assert.ok(trial.hits > 0);
      trial.kit.cancel();
    }
  });

test('restarting a trial recreates the same hits and positions, with no state leaking to another trial', () => {
  for (const id of ['warrior:war-chain', 'mage:guardian-orbs', 'archer:ricochet']) {
    const c = { ...config(id), level: 10, element: 'earth' as const };
    const a = createAbilityTrial(c),
      b = createAbilityTrial(c);
    const eventsA = [],
      eventsB = [];
    for (let i = 0; i < 150; i++) eventsA.push(...a.step());
    assert.equal(b.combat.time, 0);
    for (let i = 0; i < 150; i++) eventsB.push(...b.step());
    assert.deepEqual(eventsA, eventsB);
    assert.deepEqual(a.combat.enemies, b.combat.enemies);
    assert.equal(a.damage, b.damage);
  }
});

test('isolated skills suppress basic attacks while support skills deliberately keep them', () => {
  for (const id of [
    'warrior:war-banner',
    'mage:mirror',
    'archer:hunting-beacon',
    'warrior:steel-wave',
    'mage:arcane-lances',
    'archer:fan-volley',
  ]) {
    const trial = createAbilityTrial(config(id));
    let basic = false;
    for (let i = 0; i < 180; i++) {
      trial.step();
      basic ||= !!trial.combat.attack;
    }
    assert.equal(basic, trial.basicEnabled);
  }
});
