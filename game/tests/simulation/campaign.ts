import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { EXPEDITION } from '../../src/content/expedition.ts';
import { CAMPAIGN } from '../../src/content/campaign.ts';
import { classTechniques, isTechnique } from '../../src/content/techniques.ts';
import { isRelic } from '../../src/content/relics.ts';
import { PLAYER, PLAY_AREA } from '../../src/content/config.ts';
import { secondaryElement } from '../../src/domain/progression.ts';
import { overlaps, stepMovement } from '../../src/domain/movement.ts';
import { Run } from '../../src/domain/run.ts';
import { Navigation } from '../../src/domain/navigation.ts';
import { createWorld } from '../../src/rendering/world.ts';

export type Affinity = 'fire' | 'water' | 'earth' | 'air';

/**
 * Full six-minute expedition on the real map, driven by a simple autopilot until the boss falls.
 * Slow (about three minutes each): lives in the simulation suite, not in `npm test`.
 * `optional` routes through two chests, the capture and the merchant and aims for a four-skill build;
 * otherwise the route is combat only and must reach the mastery.
 */
export function campaignTest(classId: 'warrior' | 'mage' | 'archer', optional: boolean, affinity: Affinity) {
  test(`the full six-minute actual-map ${classId} run reaches ${affinity} ${optional ? 'four-skill build' : 'mastery'} and boss victory (${optional ? 'capture and shop' : 'combat route'})`, () => {
    const material = new THREE.MeshStandardMaterial();
    const world = createWorld({
      materials: {
        castle_wall_slates: material,
        cobblestone_floor_04: material,
        brown_mud_02: material,
        weathered_brown_planks: material,
      },
      failures: [],
      dispose() {},
    });
    const run = new Run(PLAY_AREA, world.movementSolids, 19, classId, affinity),
      body = { ...EXPEDITION.start };
    const nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius);
    // Isolate full-cycle correctness from human balance; only the fixture has extra health.
    run.combat.maxHp = 100000;
    run.combat.hp = 100000;
    let peak = 0,
      choices = 0,
      bought = false;
    const deaths = new Set<number>();
    const kinds = new Set<string>();
    const merchant = run.exploration.objects.find(o => o.kind === 'shop')!;
    const chests = run.exploration.objects.filter(o => o.kind === 'chest').slice(0, 2);
    const desiredSecondary = (['fire', 'water', 'earth', 'air'] as const)[
      (['fire', 'water', 'earth', 'air'].indexOf(affinity) + (classId === 'mage' ? 2 : 1)) % 4
    ];
    const reserved = run.shop.offers.filter(o => o.relic).map(o => o.relic!);
    try {
      for (let frame = 0; frame < 36000 && run.combat.status === 'running'; frame++) {
        if (run.progression.pending) {
          const choice = run.progression.choice()!;
          const excluded = classTechniques(classId)[['fire', 'water', 'earth', 'air'].indexOf(affinity)];
          const offered = optional ? choice.options.filter(id => isTechnique(id) && id !== excluded) : [];
          const ability = run.progression.development
            ? (choice.options.find(id => id.startsWith('ability:') && id.includes('/learn/')) ??
              choice.options.find(id => id.startsWith('ability:')))
            : undefined;
          const technique =
            ability ??
            offered.find(id => !run.progression.techniques[id as keyof typeof run.progression.techniques]) ??
            offered[0];
          const relic = choice.options.find(id => isRelic(id) && id !== 'relic_solitude' && !reserved.includes(id));
          const secondary = optional
            ? (choice.options.find(id => secondaryElement(id) === desiredSecondary) ??
              (choice.options.includes('secondary-affinity') ? 'secondary-affinity' : undefined))
            : undefined;
          // This fixture fills its third technique before spending another level on support.
          // The other routes exercise the opposite investment order.
          const fillsSlotsFirst =
            (classId === 'mage' && affinity === 'air') || (classId !== 'mage' && affinity === 'water');
          const learnFirst = ability?.includes('/learn/')
            ? ability
            : fillsSlotsFirst &&
                secondary === 'secondary-affinity' &&
                technique &&
                !run.progression.techniques[technique as keyof typeof run.progression.techniques]
              ? technique
              : undefined;
          const option =
            choice.kind === 'relic'
              ? (relic ?? 'salvage')
              : choice.kind === 'element'
                ? affinity
                : choice.options.includes('affinity')
                  ? 'affinity'
                  : (learnFirst ??
                    secondary ??
                    technique ??
                    (choice.options.includes('damage')
                      ? 'damage'
                      : choice.options.find(id => id !== excluded && !secondaryElement(id))));
          if (option) assert.ok(run.choose(choice.id, option));
          else assert.ok(run.fallback(choice.id));
          choices++;
          continue;
        }
        const enemies = run.combat.enemies.filter(e => !e.dead && e.spawnRemaining <= 0);
        const nearest = <T extends { x: number; z: number }>(items: T[]) =>
          [...items].sort((a, b) => Math.hypot(a.x - body.x, a.z - body.z) - Math.hypot(b.x - body.x, b.z - body.z))[0];
        const core = run.progression.drops.find(d => d.core);
        const nearbyLoot = nearest(run.progression.drops);
        const excursion =
          optional && !bought
            ? chests[0].status === 'available'
              ? chests[0]
              : run.capture.state !== 'completed'
                ? run.capture.point
                : chests[1].status === 'available'
                  ? chests[1]
                  : merchant
            : undefined;
        const target =
          excursion ??
          core ??
          (nearbyLoot && Math.hypot(nearbyLoot.x - body.x, nearbyLoot.z - body.z) < 6
            ? nearbyLoot
            : (run.elite ?? nearest(enemies) ?? nearbyLoot));
        if (target) {
          nav.update(target);
          const waypoint = nav.waypoint(body, target);
          if (waypoint && Math.hypot(body.x - waypoint.x, body.z - waypoint.z) > 0.2) {
            const yaw = Math.atan2(body.x - waypoint.x, body.z - waypoint.z);
            stepMovement(
              body,
              { right: 0, forward: 1 },
              yaw,
              PLAYER.step,
              { ...PLAYER, speed: run.progression.speed },
              PLAY_AREA,
              world.movementSolids,
            );
          }
        }
        const events = run.step(
          PLAYER.step,
          body,
          undefined,
          excursion?.kind === 'shop' || excursion?.kind === 'chest' ? excursion.id : undefined,
        );
        if (run.shop.isOpen) {
          assert.equal(run.capture.state, 'completed');
          const offer = run.shop.offers.find(
            o => o.relic && !run.shop.reason(o, run.exploration, run.progression, run.combat),
          );
          assert.ok(offer, `No affordable eligible relic: ${run.exploration.coins} coins / ${run.progression.relics}`);
          assert.ok(run.shop.buy(offer.id, run.shop.revision, run.exploration, run.progression, run.combat));
          bought = true;
          run.shop.close();
        }
        for (const e of events)
          if (e.type === 'death') {
            assert.equal(deaths.has(e.target), false);
            deaths.add(e.target);
            if (e.enemyKind) kinds.add(e.enemyKind);
          }
        peak = Math.max(peak, run.combat.enemies.filter(e => !e.dead).length);
        if (frame % 60 === 0)
          for (const enemy of run.combat.enemies)
            if (!enemy.dead)
              assert.equal(
                world.movementSolids.some(s => overlaps(enemy, enemy.radius, s)),
                false,
              );
      }
      console.log(
        'End state',
        JSON.stringify({
          classId,
          affinity,
          optional,
          level: run.progression.level,
          rank: run.progression.affinityRank,
          core: run.progression.core,
          mastery: run.progression.mastery,
          slots: run.progression.development?.book.slotsUsed,
          secondary: run.progression.secondaryElement,
        }),
      );
      assert.equal(run.combat.status, 'victory');
      assert.ok(run.combat.time >= 366);
      if (optional) {
        // Four skills compete with affinity/support; acquiring all is not guaranteed in thirteen levels.
        assert.equal(run.progression.mastery, run.progression.affinityRank === 3);
        assert.ok(run.progression.mastery || run.progression.core, 'Elite core must be collected');
      } else assert.equal(run.progression.mastery, true);
      assert.deepEqual([...kinds].sort(), ['archer', 'boss', 'charger', 'elite', 'soldier', 'thrall']);
      assert.ok(peak <= CAMPAIGN.maxEnemies);
      assert.equal(run.progression.pending, 0);
      assert.equal(run.combat.projectiles.items.length, 0);
      assert.equal(run.combat.kills, deaths.size);
      assert.ok(run.boss?.dead);
      if (classId !== 'warrior') assert.equal(run.combat.heroKit.state.projectiles!.length, 0);
      if (optional) {
        assert.ok(bought);
        assert.equal(run.capture.state, 'completed');
        assert.ok(run.shop.spent >= 22);
        assert.equal(run.progression.development!.book.slotsUsed, 4);
        assert.ok(Object.values(run.progression.techniques).every(rank => rank >= 1 && rank <= 3));
        assert.equal(run.progression.relics.length, 4);
        if (run.progression.secondaryElement) {
          assert.equal(run.progression.secondaryElement, desiredSecondary);
          assert.ok(run.progression.secondaryRank >= 1);
        }
        assert.equal(run.exploration.chestsOpened, 2);
      } else assert.equal(run.shop.purchases, 0);
      console.log(
        `Campaña ${classId} ${affinity} ${optional ? 'con captura/tienda' : 'ruta de combate'}: ${run.combat.time.toFixed(2)} s, ${run.combat.kills} bajas, nivel ${run.progression.level}, ${choices} elecciones, pico ${peak} enemigos, saldo ${run.exploration.coins}, gasto ${run.shop.spent}, técnicas ${JSON.stringify(run.progression.techniques)}, apoyo ${run.progression.secondaryElement ?? 'ninguno'} ${run.progression.secondaryRank}, reliquias ${JSON.stringify(run.progression.relics)} (sin GPU; vida ampliada solo en test).`,
      );
    } finally {
      world.dispose();
    }
  });
}
