import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Combat } from '../src/domain/combat.ts';
import { HERO_COMBAT, IMPETUS, WHIRLWIND, SOLDIER } from '../src/content/combat.ts';
import { PLAYER } from '../src/content/config.ts';
import { stepMovement } from '../src/domain/movement.ts';
import { PreviewState } from '../src/app/state.ts';

const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
const hero = () => ({ x: 0, z: 0, yaw: 0 });
const step = (combat: Combat, count = 1, body = hero()) => { for (let i = 0; i < count; i++) combat.step(PLAYER.step, body); };
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
function durable() {
  const combat = new Combat(bounds, [], [{ x: 0, z: -1 }]);
  combat.enemies[0].hp = 10000; combat.enemies[0].cooldown = 999; return combat;
}

test('a cleave grants exactly one stack and one damage multiplier to all targets', () => {
  const combat = new Combat(bounds, [], [{ x: -.5, z: -1 }, { x: .5, z: -1 }]);
  combat.whirlwindCooldown = 999; combat.cooldown = 999;
  combat.enemies.forEach(enemy => { enemy.hp = 1000; enemy.cooldown = 999; });
  combat.attack = { id: 100, yaw: 0, age: HERO_COMBAT.windup - PLAYER.step, hits: new Set() };
  step(combat); assert.equal(combat.impetusStacks, 1); close(combat.impetusRemaining, 3);
  assert.deepEqual(combat.takeEvents().filter(event => event.source === 'basic').map(event => event.amount), [18, 18]);
  step(combat, 5); assert.equal(combat.impetusStacks, 1); assert.equal(combat.takeEvents().filter(event => event.source === 'basic').length, 0);
  assert.ok(combat.impetusRemaining < 3);
});
test('successive basic hits ramp to four stacks, cap at +20%, and refresh at the cap', () => {
  const combat = durable(); combat.whirlwindCooldown = 999;
  const amounts: number[] = [];
  for (let i = 0; i < 5; i++) {
    combat.attack = undefined; combat.cooldown = 0;
    step(combat, 10);
    const hit = combat.takeEvents().find(event => event.type === 'hit' && event.source === 'basic'); assert.ok(hit); amounts.push(hit.amount);
    assert.equal(combat.impetusStacks, Math.min(i + 1, 4));
    assert.ok(combat.impetusRemaining > 2.9);
  }
  [18, 18.9, 19.8, 20.7, 21.6].forEach((amount, index) => close(amounts[index], amount));
});
test('a miss grants no stack; after three seconds without a new basic hit all stacks expire', () => {
  const combat = durable(); combat.whirlwindCooldown = 999; combat.cooldown = 999;
  combat.attack = { id: 100, yaw: Math.PI, age: HERO_COMBAT.windup - PLAYER.step, hits: new Set() };
  step(combat, 8); assert.equal(combat.impetusStacks, 0);
  combat.impetusStacks = 4; combat.impetusRemaining = IMPETUS.timeout; combat.attack = undefined;
  step(combat, 179); assert.equal(combat.impetusStacks, 4);
  step(combat); assert.equal(combat.impetusStacks, 0); assert.equal(combat.impetusRemaining, 0);
});
test('the damage bonus is fixed at swing start, even if stacks expire during its windup', () => {
  const combat = durable(); combat.whirlwindCooldown = 999; combat.impetusStacks = 4; combat.impetusRemaining = .07;
  step(combat); close(combat.attack!.multiplier!, 1.2);
  step(combat, 10); const hit = combat.takeEvents().find(event => event.type === 'hit' && event.source === 'basic');
  assert.ok(hit); close(hit.amount, 21.6); assert.equal(combat.impetusStacks, 1);
});
test('Torbellino activates on one target, replaces the basic attack and emits six unique pulses', () => {
  const combat = durable(); step(combat); assert.ok(combat.whirlwind); assert.equal(combat.attack, undefined);
  const events = combat.takeEvents();
  for (let i = 0; i < 144; i++) { step(combat); events.push(...combat.takeEvents()); if (combat.whirlwind) assert.equal(combat.attack, undefined); }
  const pulses = events.filter(event => event.type === 'whirlwind-pulse');
  const hits = events.filter(event => event.type === 'hit' && event.source === 'whirlwind');
  assert.equal(pulses.length, 6); assert.equal(hits.length, 6); assert.equal(new Set(pulses.map(event => event.attackId)).size, 6);
  assert.equal(new Set(hits.map(event => `${event.attackId}:${event.target}`)).size, 6);
  assert.equal(events.filter(event => event.source === 'basic').length, 0);
  close(combat.enemies[0].hp, 10000 - 72); assert.equal(combat.whirlwind, undefined); close(combat.whirlwindCooldown, 20);
});
test('pulses neither gain nor refresh Ímpetu and their damage does not inherit its bonus', () => {
  const combat = durable(); combat.impetusStacks = 4; combat.impetusRemaining = 3; combat.cooldown = 999;
  step(combat, 145); const hits = combat.takeEvents().filter(event => event.type === 'hit' && event.source === 'whirlwind');
  assert.equal(hits.length, 6); assert.ok(hits.every(hit => hit.amount === 12));
  assert.equal(combat.impetusStacks, 4); assert.ok(combat.impetusRemaining < .6);
  step(combat, 36); assert.equal(combat.impetusStacks, 0);
});
test('ready Torbellino waits behind a wall and keeps its charge without a target', () => {
  const wall = { min: { x: .8, y: 0, z: -4 }, max: { x: 1.2, y: 5, z: 4 } };
  const combat = new Combat(bounds, [wall], [{ x: 2, z: 0 }]); step(combat);
  assert.equal(combat.whirlwind, undefined); assert.equal(combat.whirlwindCooldown, 0);
  const empty = new Combat(bounds, [], []); step(empty, 1500);
  assert.equal(empty.whirlwind, undefined); assert.equal(empty.whirlwindCooldown, 0); assert.deepEqual(empty.takeEvents(), []);
});
test('every pulse rechecks walls and reach; leaving range does not bank extra pulses', () => {
  const wall = { min: { x: .8, y: 0, z: -4 }, max: { x: 1.2, y: 5, z: 4 } };
  const combat = new Combat(bounds, [wall], [{ x: -1, z: 0 }]); combat.enemies[0].hp = 1000; combat.enemies[0].cooldown = 999; combat.cooldown = 999;
  step(combat); close(combat.enemies[0].hp, 988); combat.takeEvents();
  combat.enemies[0].x = 2; combat.enemies[0].z = 0; step(combat, 24);
  close(combat.enemies[0].hp, 988);
  combat.enemies[0].x = 8; combat.enemies[0].z = 8; step(combat, 120);
  close(combat.enemies[0].hp, 988);
  assert.equal(combat.takeEvents().filter(event => event.type === 'whirlwind-pulse').length, 5);
});
test('cooldown starts after completion and reactivates only after the full 20 seconds', () => {
  const combat = durable(); combat.cooldown = 999;
  step(combat, 100); assert.ok(combat.whirlwind); assert.equal(combat.whirlwindCooldown, 0);
  step(combat, 45); assert.equal(combat.whirlwind, undefined); close(combat.whirlwindCooldown, 20); combat.takeEvents();
  step(combat, 1199); assert.equal(combat.whirlwind, undefined); assert.ok(combat.whirlwindCooldown > 0);
  step(combat); assert.ok(combat.whirlwind); assert.equal(combat.takeEvents().filter(event => event.type === 'whirlwind-start').length, 1);
});
test('a current sword swing completes before the ready skill takes over', () => {
  const combat = durable(); combat.attack = { id: 100, yaw: 0, age: 0, hits: new Set() };
  step(combat, 20); assert.equal(combat.whirlwind, undefined); assert.ok(combat.takeEvents().some(event => event.source === 'basic'));
  step(combat, 7); assert.ok(combat.whirlwind); assert.equal(combat.attack, undefined);
});
test('movement remains full speed during the spin and its visual facing does not turn the camera/body', () => {
  const combat = durable(), body = hero(); step(combat, 1, body); assert.ok(combat.whirlwind);
  for (let i = 0; i < 24; i++) { stepMovement(body, { right: 0, forward: 1 }, 0, PLAYER.step, PLAYER, bounds, []); combat.step(PLAYER.step, body); }
  close(body.z, -2); close(body.yaw, 0); assert.ok(combat.whirlwind);
});
test('pause gating freezes active skill, stacks, cooldown and enemy preparation', () => {
  const combat = durable(); combat.impetusStacks = 2; combat.impetusRemaining = 3;
  const state = new PreviewState(); state.loaded(); state.resume(); step(combat, 20); state.pause();
  const snapshot = JSON.stringify({ time: combat.time, whirlwind: combat.whirlwind, stacks: combat.impetusStacks, expiry: combat.impetusRemaining, cooldown: combat.whirlwindCooldown, enemy: combat.enemies[0].attack });
  for (let i = 0; i < 600; i++) if (state.active) step(combat);
  assert.equal(JSON.stringify({ time: combat.time, whirlwind: combat.whirlwind, stacks: combat.impetusStacks, expiry: combat.impetusRemaining, cooldown: combat.whirlwindCooldown, enemy: combat.enemies[0].attack }), snapshot);
  state.resume(); if (state.active) step(combat); assert.ok(combat.time > JSON.parse(snapshot).time);
});
test('death cancels the remaining pulses and a restart clears all warrior-kit state', () => {
  const combat = durable(); step(combat); combat.takeEvents(); combat.hp = 12;
  combat.enemies[0].attack = { id: 100, yaw: Math.PI, age: SOLDIER.windup - PLAYER.step, hits: new Set() };
  step(combat); assert.equal(combat.status, 'defeat'); assert.equal(combat.whirlwind, undefined); combat.takeEvents();
  step(combat, 600); assert.deepEqual(combat.takeEvents(), []);
  const fresh = durable(); assert.equal(fresh.whirlwind, undefined); assert.equal(fresh.whirlwindCooldown, 0); assert.equal(fresh.impetusStacks, 0); assert.equal(fresh.impetusRemaining, 0);
});
