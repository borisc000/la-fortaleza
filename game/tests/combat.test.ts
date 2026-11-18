import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Combat, chooseTarget, damageAfterArmor, inArc } from '../src/domain/combat.ts';
import { clearPath, Navigation } from '../src/domain/navigation.ts';
import { moveCircle } from '../src/domain/movement.ts';
import { HERO_COMBAT, SOLDIER } from '../src/content/combat.ts';
import { PLAYER } from '../src/content/config.ts';
import { PreviewState } from '../src/app/state.ts';

// Isolate the original sword/enemy rules; kit and map suites exercise automatic Torbellino.
function basicCombat(...args: ConstructorParameters<typeof Combat>) {
  const combat = new Combat(...args);
  combat.whirlwindCooldown = 999;
  return combat;
}
const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
const hero = () => ({ x: 0, z: 0, yaw: 0 });
const attack = (id: number, yaw: number, age: number) => ({ id, yaw, age, hits: new Set<number>() });
const tick = (combat: Combat, body = hero(), count = 1) => {
  for (let i = 0; i < count; i++) combat.step(PLAYER.step, body);
};

test('acquisition is stable, switches at 25% advantage, and resolves ties by ID', () => {
  const combat = basicCombat(
    bounds,
    [],
    [
      { x: 0, z: -2 },
      { x: 0, z: -1.8 },
    ],
  );
  assert.equal(chooseTarget(hero(), combat.enemies, 1, []), 1);
  combat.enemies[1].z = -1.4;
  assert.equal(chooseTarget(hero(), combat.enemies, 1, []), 2);
  combat.enemies[1].z = -2;
  assert.equal(chooseTarget(hero(), [...combat.enemies].reverse(), undefined, []), 1);
  combat.enemies[0].dead = true;
  assert.equal(chooseTarget(hero(), combat.enemies, 1, []), 2);
});
test('the blade uses its frozen arc, target radius and line of sight', () => {
  assert.equal(inArc(hero(), { x: 0, z: -2.3 }, 0, 2, (Math.PI * 2) / 3, 0.36), true);
  assert.equal(inArc(hero(), { x: 0, z: -2.4 }, 0, 2, (Math.PI * 2) / 3, 0.36), false);
  assert.equal(inArc(hero(), { x: 0, z: 1 }, 0, 2, (Math.PI * 2) / 3, 0.36), false);
  const wall = { min: { x: -4, y: 0, z: -0.8 }, max: { x: 4, y: 4, z: -0.6 } };
  const combat = basicCombat(bounds, [wall], [{ x: 0, z: -1.3 }]);
  assert.equal(chooseTarget(hero(), combat.enemies, undefined, [wall]), undefined);
  combat.attack = attack(1, 0, HERO_COMBAT.windup - PLAYER.step);
  combat.cooldown = 999;
  combat.enemies[0].attack = attack(2, Math.PI, SOLDIER.windup - PLAYER.step);
  tick(combat);
  assert.equal(combat.hp, 100);
  assert.equal(combat.enemies[0].hp, SOLDIER.hp);
});
test('one swing hits multiple eligible enemies once each and excludes the rear', () => {
  const combat = basicCombat(
    bounds,
    [],
    [
      { x: -0.6, z: -1.4 },
      { x: 0.6, z: -1.4 },
      { x: 0, z: 1.4 },
    ],
  );
  combat.attack = attack(40, 0, 0);
  combat.cooldown = 999;
  combat.enemies.forEach(e => {
    e.cooldown = 999;
  });
  tick(combat, hero(), 20);
  assert.deepEqual(
    combat.enemies.map(e => e.hp),
    [36, 36, 54],
  );
  const hits = combat.takeEvents().filter(e => e.type === 'hit');
  assert.equal(hits.length, 2);
  assert.equal(new Set(hits.map(e => e.target)).size, 2);
});
test('no target consumes no cooldown; camera/locomotion heading does not aim the sword', () => {
  const combat = basicCombat(bounds, [], [{ x: 0, z: -8 }]);
  const body = hero();
  body.yaw = 2;
  tick(combat, body, 10);
  assert.equal(combat.cooldown, 0);
  assert.equal(combat.attack, undefined);
  combat.enemies[0].z = -1.5;
  tick(combat, body, 6);
  assert.ok(combat.attack);
  assert.equal(combat.attack.yaw, 0);
  assert.equal(body.yaw, 2);
  const yaw = combat.attack.yaw;
  body.x = 1;
  tick(combat, body);
  assert.equal(combat.attack?.yaw, yaw);
});
test('touching does no damage; enemy needs its complete windup and a valid strike', () => {
  const combat = basicCombat(bounds, [], [{ x: 0, z: -0.77 }]);
  combat.cooldown = 999;
  combat.enemies[0].cooldown = 0;
  tick(combat, hero(), 30);
  assert.equal(combat.hp, 100);
  tick(combat, hero(), 10);
  assert.equal(combat.hp, 88);
  tick(combat, hero(), 5);
  assert.equal(combat.hp, 88);
});
test('leaving the telegraphed strike prevents damage without a dodge button', () => {
  const combat = basicCombat(bounds, [], [{ x: 0, z: -1 }]);
  combat.cooldown = 999;
  combat.enemies[0].cooldown = 0;
  const body = hero();
  tick(combat, body, 10);
  const yaw = combat.enemies[0].attack?.yaw;
  body.x = 4;
  tick(combat, body, 35);
  assert.equal(combat.hp, 100);
  assert.equal(combat.enemies[0].attack?.yaw, yaw);
});
test('simultaneous attackers cause one hit and protection blocks later external sources', () => {
  const combat = basicCombat(
    bounds,
    [],
    [
      { x: 0, z: -1 },
      { x: 0, z: 1 },
    ],
  );
  combat.cooldown = 999;
  combat.enemies.forEach((e, i) => {
    e.attack = attack(i + 1, i === 0 ? Math.PI : 0, SOLDIER.windup - PLAYER.step);
  });
  tick(combat);
  assert.equal(combat.hp, 88);
  assert.ok(combat.protection > 0.3);
  combat.enemies[1].attack = attack(3, 0, SOLDIER.windup - PLAYER.step);
  tick(combat);
  assert.equal(combat.hp, 88);
  tick(combat, hero(), 22);
  combat.enemies[1].attack = attack(4, 0, SOLDIER.windup - PLAYER.step);
  tick(combat);
  assert.equal(combat.hp, 76);
});
test('simultaneous lethal strikes resolve as defeat and deaths are emitted once', () => {
  const combat = basicCombat(bounds, [], [{ x: 0, z: -1 }]);
  combat.hp = 12;
  combat.enemies[0].hp = 18;
  combat.attack = attack(1, 0, HERO_COMBAT.windup - PLAYER.step);
  combat.enemies[0].attack = attack(2, Math.PI, SOLDIER.windup - PLAYER.step);
  tick(combat);
  assert.equal(combat.status, 'defeat');
  assert.equal(combat.hp, 0);
  assert.equal(combat.kills, 1);
  assert.equal(combat.takeEvents().filter(e => e.type === 'death').length, 2);
  const time = combat.time;
  tick(combat, hero(), 120);
  assert.equal(combat.kills, 1);
  assert.equal(combat.time, time);
  assert.deepEqual(combat.takeEvents(), []);
});
test('a dead enemy never awards a second kill while another enemy remains', () => {
  const combat = basicCombat(
    bounds,
    [],
    [
      { x: 0, z: -1 },
      { x: 8, z: 8 },
    ],
  );
  combat.enemies[0].hp = 18;
  combat.attack = attack(1, 0, HERO_COMBAT.windup - PLAYER.step);
  combat.cooldown = 999;
  tick(combat);
  assert.equal(combat.kills, 1);
  combat.takeEvents();
  tick(combat, hero(), 60);
  assert.equal(combat.kills, 1);
  assert.equal(
    combat.takeEvents().some(e => e.type === 'death'),
    false,
  );
});
test('a short encounter can finish and a new run resets health, clocks, target and attacks', () => {
  const combat = basicCombat(bounds, [], [{ x: 0, z: -1.5 }]);
  tick(combat, hero(), 240);
  assert.equal(combat.status, 'victory');
  assert.equal(combat.kills, 1);
  const fresh = basicCombat(bounds, [], [{ x: 0, z: -1.5 }]);
  assert.equal(fresh.hp, 100);
  assert.equal(fresh.kills, 0);
  assert.equal(fresh.time, 0);
  assert.equal(fresh.targetId, undefined);
  assert.equal(fresh.attack, undefined);
  assert.deepEqual(fresh.takeEvents(), []);
});
test('armor math keeps precision, clamps negative armor and never heals', () => {
  assert.equal(damageAfterArmor(18, 100), 9);
  assert.equal(damageAfterArmor(18, -10), 18);
  assert.equal(damageAfterArmor(-5, 0), 0);
  assert.equal(damageAfterArmor(18, 33), 1800 / 133);
});
test('navigation routes around a wall without stepping through it', () => {
  const wall = { min: { x: -2, y: 0, z: -0.5 }, max: { x: 2, y: 4, z: 0.5 } },
    solids = [wall];
  const nav = new Navigation(bounds, solids, 0.36),
    target = { x: 0, z: -3 };
  let position = { x: 0, z: 3 };
  nav.update(target);
  assert.equal(clearPath(position, target, solids, 0.36), false);
  for (let i = 0; i < 600; i++) {
    const next = nav.waypoint(position, target);
    assert.ok(next);
    const dx = next.x - position.x,
      dz = next.z - position.z,
      distance = Math.hypot(dx, dz);
    if (distance > 0.01)
      position = moveCircle(
        position,
        { x: (dx / distance) * Math.min(distance, 0.05), z: (dz / distance) * Math.min(distance, 0.05) },
        0.36,
        bounds,
        solids,
      );
  }
  assert.ok(Math.hypot(position.x - target.x, position.z - target.z) < 0.1);
});
test('results cannot resume an ended encounter; restart is explicit', () => {
  const state = new PreviewState();
  state.loaded();
  state.resume();
  state.finish();
  state.resume();
  assert.equal(state.phase, 'results');
  state.restart();
  assert.equal(state.phase, 'ready');
  state.resume();
  assert.equal(state.active, true);
});
