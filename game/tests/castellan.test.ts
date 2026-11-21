import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { HERO_COMBAT } from '../src/content/combat.ts';
import { PLAYER } from '../src/content/config.ts';
import { actionStats, BOSS_FURY, ENEMIES } from '../src/content/enemies.ts';
import type { EnemyKind } from '../src/content/enemies.ts';
import { Combat } from '../src/domain/combat.ts';
import type { Solid } from '../src/domain/movement.ts';
import { createCombatView } from '../src/rendering/combat.ts';

const bounds = { minX: -36, maxX: 36, minZ: -36, maxZ: 36 };
const hero = { x: 0, z: 0, yaw: 0 };
const wall = { min: { x: -7, z: -6.1 }, max: { x: 7, z: -5.9 } };

function fight(kind: EnemyKind, distance: number, solids: readonly Solid[] = []) {
  const combat = new Combat(bounds, solids, [], false);
  combat.addEnemies([{ x: 0, z: -distance }], 0, kind);
  combat.cooldown = 999;
  combat.whirlwindCooldown = 999;
  const enemy = combat.enemies[0];
  enemy.cooldown = 0;
  return { combat, enemy };
}

function ticks(combat: Combat, seconds: number, body = hero) {
  for (let i = 0; i < Math.ceil(seconds / PLAYER.step); i++) combat.step(PLAYER.step, body);
}

test('the Castellano threatens a distant hero behind cover and its rupture locks in place', () => {
  for (const dodged of [false, true]) {
    const { combat, enemy } = fight('boss', 29, [wall]);
    combat.step(PLAYER.step, hero);
    assert.equal(enemy.attack?.action, 'rupture');
    assert.deepEqual(enemy.attack?.groundTarget, { x: 0, z: 0 });
    const { windup, damage } = actionStats('boss', 'rupture');
    const position = { ...hero, x: dodged ? 6 : 0 };
    ticks(combat, windup - 0.1, position);
    assert.equal(combat.hp, combat.maxHp);
    assert.deepEqual(enemy.attack?.groundTarget, { x: 0, z: 0 });
    ticks(combat, 0.5, position);
    assert.equal(combat.hp, combat.maxHp - (dodged ? 0 : damage));
  }
});

test('the Edicto strikes outside the refuge and only at the moment of impact', () => {
  for (const escaped of [false, true]) {
    const { combat, enemy } = fight('boss', 29, [wall]);
    enemy.actionCount = 4;
    combat.step(PLAYER.step, hero);
    assert.equal(enemy.attack?.action, 'edict');
    const { windup, active, damage } = actionStats('boss', 'edict');
    ticks(combat, windup + 0.02, { ...hero, x: escaped ? 12 : 1 });
    // Leaving after the strike is safe even while the visual is dissipating.
    ticks(combat, active, { ...hero, x: 12 });
    assert.equal(combat.hp, combat.maxHp - (escaped ? damage : 0));
  }
});

test('the Castellano charges ranged targets and locks a lane they can sidestep', () => {
  const { combat, enemy } = fight('boss', 13);
  combat.step(PLAYER.step, hero);
  assert.equal(enemy.attack?.action, 'charge');
  const yaw = enemy.attack!.yaw;
  const { windup, active } = actionStats('boss', 'charge');
  const start = enemy.z;
  ticks(combat, windup - 0.1, { ...hero, x: 3 });
  assert.equal(enemy.z, start);
  assert.equal(enemy.attack?.yaw, yaw);
  ticks(combat, active + 0.12, { ...hero, x: 3 });
  assert.ok(enemy.z > 0);
  assert.ok(Math.abs(enemy.x) < 1e-8);
  assert.equal(combat.hp, combat.maxHp);
});

test('fury shortens the cooldown of the same global attack', () => {
  const normal = fight('boss', 29, [wall]),
    furious = fight('boss', 29, [wall]);
  furious.enemy.hp = furious.enemy.maxHp * BOSS_FURY.healthFraction;
  normal.combat.step(PLAYER.step, hero);
  furious.combat.step(PLAYER.step, hero);
  assert.equal(normal.enemy.attack?.action, furious.enemy.attack?.action);
  assert.equal(furious.enemy.cooldown, normal.enemy.cooldown * BOSS_FURY.cooldownMultiplier);
});

test('the warning stays at the warned ground position even when the distant boss rotates', () => {
  const { combat, enemy } = fight('boss', 29, [wall]);
  const scene = new THREE.Scene();
  const view = createCombatView(scene);
  try {
    const target = { x: 2, z: 3, yaw: 0 };
    combat.step(PLAYER.step, target);
    view.update(combat, new THREE.Vector3(target.x, 0, target.z), new THREE.PerspectiveCamera(), 1, 0);
    const warning = scene.getObjectByName('Aviso global del Castellano');
    assert.ok(warning?.visible);
    assert.equal(warning.scale.x, actionStats('boss', 'rupture').range);
    assert.ok(warning.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(2, 0, 3)) < 1e-8);
    enemy.attack = undefined;
    view.update(combat, new THREE.Vector3(), new THREE.PerspectiveCamera(), 1, 0);
    assert.equal(warning.visible, false);
  } finally {
    view.dispose();
  }
  assert.equal(scene.children.length, 0);
});

test('the Verdugo reaches ranged targets, yields no core and can be retired as a normal foe', () => {
  const { combat, enemy } = fight('hunter', 12);
  combat.step(PLAYER.step, hero);
  assert.equal(enemy.attack?.action, 'charge');
  const { windup, active } = actionStats('hunter', 'charge');
  ticks(combat, windup + active, { ...hero, x: 3 });
  assert.ok(enemy.z > 0);
  assert.equal(combat.hp, combat.maxHp);

  const close = fight('hunter', 1.5);
  close.enemy.hp = 1;
  close.enemy.cooldown = 999;
  close.combat.attack = {
    id: 100,
    yaw: 0,
    age: HERO_COMBAT.windup - PLAYER.step,
    hits: new Set(),
  };
  close.combat.step(PLAYER.step, hero);
  const death = close.combat.takeEvents().find(event => event.type === 'death');
  assert.equal(death?.enemyKind, 'hunter');
  assert.equal(death?.reward, ENEMIES.hunter.essence);
  assert.equal(death?.core, false);
  assert.equal(combat.retireNormal(enemy), true);
  assert.ok(!combat.takeEvents().some(event => event.type === 'death'));
});
