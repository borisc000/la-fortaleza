import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CAMPAIGN, INCURSION_WARNING, incursionSchedule } from '../src/content/campaign.ts';
import { PLAYER, PLAY_AREA } from '../src/content/config.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { STONE_HEART_BOUNDS, STONE_HEART_LAYOUT, STONE_HEART_SOLIDS } from '../src/content/stone-heart.ts';
import { Run } from '../src/domain/run.ts';
import { TRAINING_EXPEDITION } from './support/training-expedition.ts';

const hero = { x: 0, z: 0, yaw: 0 };
const seed = 19;

function exterior() {
  return new Run(PLAY_AREA, [], seed, 'archer', undefined, TRAINING_EXPEDITION);
}

test('global siege warns before calling one flanking group and shares the living cap', () => {
  const run = exterior();
  const [siege] = incursionSchedule(seed);
  assert.deepEqual(incursionSchedule(seed), incursionSchedule(run.seed));
  assert.notDeepEqual(
    incursionSchedule(seed + 1).map(event => event.at),
    incursionSchedule(seed).map(event => event.at),
  );
  run.combat.enemies.forEach(enemy => {
    enemy.spawnRemaining = 999;
  });
  while (run.combat.enemies.length < CAMPAIGN.maxEnemies - 1 - siege.enemies.length)
    run.combat.addEnemies([{ x: 21, z: 0 }], 999);

  run.combat.time = siege.at - INCURSION_WARNING;
  run.step(PLAYER.step, hero);
  assert.equal(run.incursion?.kind, 'siege');
  assert.match(run.objective, /Toque de asedio en 4 s/);
  assert.equal(run.combat.enemies.filter(enemy => enemy.kind === 'archer').length, 0);

  run.combat.time = siege.at;
  run.step(PLAYER.step, hero);
  assert.equal(run.combat.enemies.filter(enemy => enemy.kind === 'archer').length, 4);
  assert.equal(run.combat.enemies.filter(enemy => !enemy.dead).length, CAMPAIGN.maxEnemies - 1);
  assert.match(run.objective, /Muévete de lado/);
  run.combat.time = siege.at + 2;
  run.step(PLAYER.step, hero);
  assert.equal(run.combat.enemies.filter(enemy => enemy.kind === 'archer').length, 4);
  run.combat.time = siege.at + siege.duration;
  run.step(PLAYER.step, hero);
  assert.equal(run.incursion, undefined);
});

test('the hunter remains a threat away from the hero and withdraws before the duel without a core', () => {
  const run = exterior();
  const hunt = incursionSchedule(seed).find(event => event.kind === 'hunt')!;
  run.eliteSpawned = true;
  run.combat.time = hunt.at;
  run.step(PLAYER.step, hero);
  const hunter = run.hunter!;
  assert.ok(hunter && hunter.spawnRemaining > 0);
  assert.equal(hunter.hp, ENEMIES.hunter.hp);
  hunter.spawnRemaining = 999;
  run.combat.time = hunt.at + hunt.duration + 1;
  const far = { x: -31, z: 33, yaw: 0 };
  run.step(PLAYER.step, far);
  run.combat.time += 10;
  run.step(PLAYER.step, far);
  assert.equal(run.hunter?.id, hunter.id);
  assert.equal(run.combat.enemies.filter(enemy => enemy.kind === 'hunter').length, 1);

  run.combat.time = CAMPAIGN.bossAt;
  const events = run.step(PLAYER.step, hero);
  assert.equal(run.hunter, undefined);
  assert.ok(hunter.retired);
  assert.ok(run.boss);
  assert.ok(!events.some(event => event.target === hunter.id && event.type === 'death'));
  assert.ok(!run.progression.drops.some(drop => drop.core));
});

test('global incursions are exclusive to the exterior', () => {
  const run = new Run(STONE_HEART_BOUNDS, STONE_HEART_SOLIDS, seed, 'warrior', undefined, STONE_HEART_LAYOUT);
  for (const event of incursionSchedule(seed)) {
    run.combat.time = event.at;
    run.step(PLAYER.step, STONE_HEART_LAYOUT.start);
    assert.equal(run.incursion, undefined);
    assert.equal(run.hunter, undefined);
    assert.ok(!run.combat.enemies.some(enemy => enemy.kind === 'archer' || enemy.kind === 'charger'));
  }
});
