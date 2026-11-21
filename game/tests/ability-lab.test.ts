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

test('a sparring hit opens the guard and a break emits exactly one wave before expiry', () => {
  const trial = createAbilityTrial({
    ...config('warrior:retaliation'),
    testGuardHits: true,
    level: 5,
    focus: 'specialization',
  });
  let damaged = false;
  const pulses = new Set<string>();
  for (let i = 0; i < 180; i++) {
    trial.step();
    for (const v of trial.kit.presentation) {
      if ('damageFraction' in v && v.damageFraction === 0.5) damaged = true;
      if (v.kind === 'guard-wave') pulses.add(v.id);
    }
  }
  assert.ok(damaged);
  assert.equal(pulses.size, 1);
  assert.equal(trial.kit.state.barrier, undefined);
  assert.ok(trial.hits > 0);
});

test('residual seals flash at each damage pulse and siege trails clear after the projectile ends', () => {
  const seal = createAbilityTrial({ ...config('mage:detonation'), level: 10, mutation: 1, finisher: 0 });
  const flashes = new Set<string>();
  let residual = false;
  for (let i = 0; i < 120; i++) {
    seal.step();
    for (const v of seal.kit.presentation) {
      if (v.kind === 'seal-flash') flashes.add(v.id);
      if (v.kind === 'seal' && 'residual' in v && v.residual) residual = true;
    }
  }
  assert.equal(flashes.size, 2);
  assert.ok(residual);
  assert.ok(!seal.kit.presentation.some(v => v.kind === 'seal-flash'));
  const siege = createAbilityTrial(config('archer:siege-shot'));
  let afterFlight = false;
  const perforations = new Set<string>();
  for (let i = 0; i < 60; i++) {
    siege.step();
    for (const v of siege.kit.presentation) if (v.kind === 'pierce') perforations.add(v.id);
    afterFlight ||= !!siege.kit.state.siegeTrail && !siege.kit.state.projectiles?.length;
  }
  assert.equal(perforations.size, 3);
  assert.ok(afterFlight);
  assert.equal(siege.kit.state.siegeTrail, undefined);
});

test('crossing a stake triggers its impact on the same step and replay follows the same path', () => {
  const run = () => {
    const trial = createAbilityTrial({ ...config('archer:stakes'), testStakeCrossing: true });
    const crossings: number[] = [];
    for (let frame = 0; frame < 100; frame++) {
      const events = trial.step();
      if (events.some(e => e.type === 'hit' && e.source === 'ability')) {
        assert.ok(trial.kit.presentation.some(v => v.kind === 'stake-hit' && v.phase === 0));
        crossings.push(frame);
      }
    }
    return crossings;
  };
  const crossings = run();
  assert.ok(crossings.length > 0);
  assert.deepEqual(run(), crossings);
});

test('return arrows mark their turn and mirror echoes appear only on the copied shot', () => {
  const arrows = createAbilityTrial(config('archer:return-arrows'));
  let turned = false;
  for (let frame = 0; frame < 60; frame++) {
    arrows.step();
    const returning = arrows.kit.state.projectiles?.filter(p => p.leg === 1) ?? [];
    if (returning.length && !turned) {
      assert.ok(arrows.kit.presentation.some(v => v.kind === 'bend' && v.phase === 0));
      assert.ok(returning.every(p => p.flightOrigin && p.flightOrigin.z === 0));
      turned = true;
    }
  }
  assert.ok(turned);
  const mirror = createAbilityTrial(config('mage:mirror'));
  let copies = 0;
  for (let frame = 0; frame < 220; frame++) {
    mirror.step();
    if (mirror.kit.presentation.some(v => v.kind === 'echo' && v.phase === 0)) {
      assert.ok(mirror.kit.state.projectiles?.some(p => p.echo && p.age === 0));
      copies++;
    }
  }
  assert.equal(copies, 1);
});

test('chain presentation follows both endpoints during recovery without retriggering damage', () => {
  const trial = createAbilityTrial(config('warrior:war-chain'));
  trial.step();
  const first = trial.kit.presentation.find(v => v.kind === 'chain')!;
  const target = trial.combat.enemies[0];
  const damage = trial.damage;
  trial.hero.x += 0.45;
  target.z -= 0.2;
  trial.step();
  const follow = trial.kit.presentation.find(v => v.id === first.id)!;
  assert.equal(follow.x, (trial.hero.x + target.x) / 2);
  assert.equal(follow.z, (trial.hero.z + target.z) / 2);
  assert.equal(trial.damage, damage);
});
