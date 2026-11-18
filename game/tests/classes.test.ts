import { TRAINING_EXPEDITION } from './support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { warriorTrace } from './support/warrior-trace.ts';
import { CLASSES, classDefinition } from '../src/content/classes.ts';
import { WARRIOR } from '../src/content/classes/warrior.ts';
import type { ClassDefinition, ClassId } from '../src/content/class-definition.ts';
import { WARRIOR_RUNTIME, classRuntime } from '../src/domain/classes.ts';
import { WarriorKit } from '../src/domain/classes/warrior-kit.ts';
import { Combat } from '../src/domain/combat.ts';
import { Progression } from '../src/domain/progression.ts';
import { ExpeditionShop } from '../src/domain/shop.ts';
import { Exploration } from '../src/domain/exploration.ts';
import { Run } from '../src/domain/run.ts';
import type { ClassRuntime, HeroKit, HeroKitState, HeroKitContext } from '../src/domain/hero-kit.ts';
import { PLAYER } from '../src/content/config.ts';

const bounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 }, body = { x: 0, z: 0, yaw: 0 };
const baseline = JSON.parse(readFileSync(new URL('./fixtures/warrior-0.1.16.json', import.meta.url), 'utf8'));
for (const affinity of ['physical', 'fire', 'water'] as const) test(`Warrior ${affinity} matches the pre-extraction 0.1.16 trace for 3600 steps`, () => {
  assert.deepEqual(warriorTrace(affinity === 'physical' ? undefined : affinity), baseline[affinity]);
});

test('only implemented classes are registered and their shared definition is immutable', () => {
  assert.deepEqual(Object.keys(CLASSES), ['warrior', 'mage', 'archer']); assert.equal(classDefinition('warrior'), WARRIOR_RUNTIME.definition);
  for (const id of ['armored','toString','missing']) {
    assert.throws(() => classDefinition(id as ClassId)); assert.throws(() => classRuntime(id as ClassId));
  }
  assert.throws(() => { (WARRIOR.stats as { hp: number }).hp = 500; });
  assert.throws(() => { (WARRIOR.affinities.fire as { mastery: string }).mastery = 'Changed'; });
  const run = new Run(bounds, [], 19, 'warrior', undefined, TRAINING_EXPEDITION);
  assert.equal(run.definition, run.combat.definition); assert.equal(run.definition, run.progression.definition);
  assert.equal(run.combat.hp, 100); assert.equal(run.progression.speed, 5);
});

test('kits, elemental effects, upgrades and shop stocks never leak between expeditions', () => {
  const a = new Run(bounds, [], 19, undefined, undefined, TRAINING_EXPEDITION), b = new Run(bounds, [], 19, undefined, undefined, TRAINING_EXPEDITION);
  a.combat.impetusStacks = 4; a.combat.impetusRemaining = 3; a.combat.whirlwindCooldown = 15;
  a.progression.ranks.damage = 2; a.exploration.coins = 50; a.shop.open();
  assert.ok(a.shop.buy('damage', a.shop.revision, a.exploration, a.progression, a.combat));
  assert.notEqual(a.combat.heroKit, b.combat.heroKit); assert.notEqual(a.combat.elementalEffects, b.combat.elementalEffects);
  assert.equal(b.combat.impetusStacks, 0); assert.equal(b.combat.whirlwindCooldown, 0);
  assert.equal(b.progression.ranks.damage, 0); assert.equal(b.shop.stock.damage, 1); assert.equal(b.exploration.coins, 0);
  assert.equal(WARRIOR.basic.damage, 18);
});

const variant: ClassDefinition = {
  ...WARRIOR, name: 'Variante solo de prueba', stats: { hp: 80, armor: 100, protection: .2 },
  movement: { ...WARRIOR.movement, speed: 3, maxSpeed: 4, radius: .8 },
  basic: { ...WARRIOR.basic, damage: 30, range: 4 },
  weapon: { id: 'test-weapon', name: 'Arma de prueba' }, skill: { id: 'test-skill', name: 'Técnica de prueba' },
};
const variantRuntime: ClassRuntime = { ...WARRIOR_RUNTIME, definition: variant, createKit: () => new WarriorKit(variant) };

test('class statistics drive basic reach/damage, projectile collision, armor, speed and purchases', () => {
  const attack = new Combat(bounds, [], [{ x: 0, z: -3.5 }], false, variantRuntime);
  attack.whirlwindCooldown = 999; attack.enemies[0].cooldown = 999;
  for (let i = 0; i < 10; i++) attack.step(PLAYER.step, body);
  const hit = attack.takeEvents().find(e => e.source === 'basic'); assert.ok(hit); assert.equal(hit.amount, 30);
  const c = new Combat(bounds, [], [], false, variantRuntime); c.projectiles.fire({ x: .7, z: 1 }, 0, 9, 10);
  c.step(.1, body); assert.equal(c.hp, 75); assert.equal(c.protection, .2);
  const p = new Progression(variant), e = new Exploration(bounds, [], 19, variant.movement.radius, undefined, TRAINING_EXPEDITION), shop = new ExpeditionShop();
  assert.equal(p.speed, 3); p.ranks.speed = 3; assert.equal(p.speed, 4);
  assert.ok(p.upgradeDescription('damage').includes('arma de prueba')); assert.ok(p.upgradeDescription('damage').includes('Técnica de prueba'));
  e.coins = 100; shop.open(); assert.ok(shop.buy('vitality', shop.revision, e, p, c));
  assert.equal(c.maxHp, 100); assert.equal(c.hp, 95); assert.equal(e.coins, 82);
});

test('a separate kit can use shared armor, rewards, lifecycle and progression without Warrior actions', () => {
  class ProbeKit implements HeroKit {
    state: HeroKitState = { cooldown: 0, passiveStacks: 0, passiveRemaining: 0, skillCooldown: 0 };
    finished = 0; cancelled = false;
    advance() {}
    act(c: HeroKitContext) { return c.alive.map(target => ({ target, amount: 20 * c.damageMultiplier, source: 'basic' as const, attackId: c.nextId(), loadout: c.loadout })); }
    finishStep() { this.finished++; }
    cancel() { this.cancelled = true; }
  }
  const kit = new ProbeKit();
  const runtime: ClassRuntime = { definition: variant, createKit: () => kit,
    createEffects: () => ({ update: () => [], direct: () => ({ hits: [], visuals: [] }), explosions: () => ({ hits: [], visuals: [] }), cleanup() {} }) };
  const combat = new Combat(bounds, [], [{ x: 0, z: -8 }], true, runtime);
  combat.loadout = { element: 'fire', rank: 3, mastery: true }; combat.enemies[0].hp = 10; combat.enemies[0].armor = 100;
  combat.step(PLAYER.step, body); const events = combat.takeEvents();
  assert.equal(events.find(e => e.type === 'hit')!.amount, 10); assert.equal(combat.kills, 1); assert.equal(combat.status, 'victory');
  assert.equal(combat.enemies[0].burn, undefined); assert.equal(kit.finished, 1); assert.equal(kit.cancelled, true);
  assert.equal(combat.attack, undefined); assert.equal(combat.whirlwind, undefined); assert.equal(combat.impetusStacks, 0);
  const p = new Progression(variant); p.receive(events); p.step(PLAYER.step, combat.enemies[0], []);
  assert.equal(p.totalEssence, 1); combat.step(PLAYER.step, body); assert.deepEqual(combat.takeEvents(), []);
});
