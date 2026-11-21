import { TRAINING_EXPEDITION } from '../support/training-expedition.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionStats } from '../../src/content/enemies.ts';
import { Run } from '../../src/domain/run.ts';

const bounds = { minX: -35, maxX: 35, minZ: -35, maxZ: 45 };

/** Twelve survival probes at normal health on the training map: three classes, two affinities, focused and four-skill builds. */
for (const cls of ['warrior', 'mage', 'archer'] as const)
  for (const affinity of ['fire', cls === 'warrior' ? 'earth' : cls === 'mage' ? 'water' : 'air'] as const)
    for (const mode of ['focused', 'four'] as const)
      test(`normal-health ${cls} ${affinity} ${mode} survival probe with earned upgrades`, () => {
        const run = new Run(bounds, [], 19, cls, affinity, TRAINING_EXPEDITION),
          p = run.progression,
          c = run.combat;
        const body = { x: 0, z: 7, yaw: 0 };
        let peak = 0,
          choices = 0;
        let bossStartHp: number | undefined;
        const choiceTimes: number[] = [];
        let move = { x: 0, z: 0 };
        for (let frame = 0; frame < 36000 && c.status === 'running'; frame++) {
          if (p.pending) {
            const choice = p.choice()!;
            const learning =
              mode === 'four' || p.development!.book.slotsUsed < 2
                ? choice.options.find(o => o.includes('/learn/'))
                : undefined;
            const develop = choice.options.find(o => o.startsWith('ability:') && !o.includes('/learn/'));
            const option =
              choice.kind === 'element'
                ? affinity
                : choice.options.includes('mastery')
                  ? 'mastery'
                  : c.hp < c.maxHp * 0.6 && choice.options.includes('vitality')
                    ? 'vitality'
                    : (learning ??
                      (choice.options.includes('affinity')
                        ? 'affinity'
                        : (develop ?? choice.options.find(o => !o.includes('/learn/')) ?? choice.options[0])));
            assert.ok(run.choose(choice.id, option));
            choices++;
            if (choice.kind === 'upgrade' || choice.kind === 'element') choiceTimes.push(c.time);
            continue;
          }
          if (frame % 6 === 0) {
            const enemies = c.enemies.filter(e => !e.dead && e.spawnRemaining <= 0);
            const nearest = <T extends { x: number; z: number }>(items: T[]) =>
              items.reduce<T | undefined>(
                (best, item) =>
                  !best || Math.hypot(item.x - body.x, item.z - body.z) < Math.hypot(best.x - body.x, best.z - body.z)
                    ? item
                    : best,
                undefined,
              );
            const supply =
              c.hp < c.maxHp * 0.8
                ? nearest(
                    run.exploration.objects.filter(
                      o =>
                        (o.kind === 'supply' ||
                          o.kind === 'fountain' ||
                          (o.kind === 'shop' && run.shop.stock.heal > 0 && run.exploration.coins >= 8)) &&
                        o.status === 'available',
                    ),
                  )
                : undefined;
            const loot = nearest(p.drops),
              target =
                (supply && Math.hypot(supply.x - body.x, supply.z - body.z) < 18 ? supply : undefined) ??
                p.drops.find(d => d.core) ??
                (loot && Math.hypot(loot.x - body.x, loot.z - body.z) < 12 ? loot : nearest(enemies));
            const bossAttack = run.boss?.attack;
            const groundAction = bossAttack?.action;
            const groundStats =
              groundAction === 'edict' || groundAction === 'rupture' ? actionStats('boss', groundAction) : undefined;
            const groundTarget =
              groundStats && bossAttack && bossAttack.age < groundStats.windup ? bossAttack.groundTarget : undefined;
            const mayWait = Boolean(groundTarget && groundAction === 'edict');
            let best = -Infinity;
            for (let i = 0; i < (mayWait ? 25 : 24); i++) {
              const waiting = i === 24;
              const x = waiting ? 0 : Math.sin((i * Math.PI) / 12),
                z = waiting ? 0 : Math.cos((i * Math.PI) / 12),
                ahead = { x: body.x + x * 2, z: body.z + z * 2 };
              if (Math.abs(ahead.x) > 30 || ahead.z < -30 || ahead.z > 40) continue;
              let score = target
                ? -Math.hypot(ahead.x - target.x, ahead.z - target.z) * 0.8
                : -Math.hypot(ahead.x, ahead.z - 7) * 0.2;
              for (const enemy of enemies) {
                const d = Math.hypot(ahead.x - enemy.x, ahead.z - enemy.z);
                score -= Math.max(0, (cls === 'warrior' ? 2.1 : 3.2) - d) * 6;
                if (enemy.attack && d < 4) score -= Math.max(0, 4 - d) * 4;
              }
              for (const bolt of c.projectiles.items) {
                const d = Math.hypot(ahead.x - bolt.x - bolt.vx * 0.3, ahead.z - bolt.z - bolt.vz * 0.3);
                score -= Math.max(0, 1.2 - d) * 8;
              }
              if (groundTarget && groundStats) {
                const distance = Math.hypot(ahead.x - groundTarget.x, ahead.z - groundTarget.z);
                const clearance = 0.25;
                if (groundAction === 'edict') {
                  const safeRadius = groundStats.range - clearance;
                  score -= Math.max(0, distance - safeRadius) * 30;
                  if (waiting && distance < safeRadius) score += 3;
                } else score -= Math.max(0, groundStats.range + clearance - distance) * 30;
              }
              score += (x * move.x + z * move.z) * 0.1;
              if (score > best) {
                best = score;
                move = { x, z };
              }
            }
          }
          body.x += (move.x * p.speed) / 60;
          body.z += (move.z * p.speed) / 60;
          const focus = run.exploration.focus(body);
          const interaction =
            c.hp < c.maxHp * 0.8 && focus && ['fountain', 'shop'].includes(focus.kind) ? focus.id : undefined;
          run.step(1 / 60, body, undefined, interaction);
          if (run.phase === 'boss') bossStartHp ??= c.hp;
          if (run.shop.isOpen) {
            run.shop.buy('heal', run.shop.revision, run.exploration, p, c);
            run.shop.close();
          }
          peak = Math.max(peak, c.enemies.filter(e => !e.dead).length);
        }
        console.log(
          JSON.stringify({
            cls,
            affinity,
            mode,
            status: c.status,
            time: c.time,
            hp: c.hp,
            bossStartHp,
            level: p.level,
            kills: c.kills,
            choices,
            slots: p.development!.book.slotsUsed,
            meanChoiceGap:
              choiceTimes.length > 1 ? (choiceTimes.at(-1)! - choiceTimes[0]) / (choiceTimes.length - 1) : 0,
            coins: run.exploration.coins,
            peak,
          }),
        );
        assert.ok(
          c.status === 'victory' || c.status === 'defeat',
          'Probe reaches a terminal state within its time budget',
        );
        assert.equal(c.maxHp, run.definition.stats.hp + p.ranks.vitality * p.vitalityAmount());
        assert.ok(c.hp >= 0 && c.hp <= c.maxHp);
        assert.equal(c.status === 'defeat', c.hp === 0);
        assert.ok(peak <= 100);
        const stoppedTime = c.time;
        run.step(1, body);
        assert.equal(c.time, stoppedTime);
        assert.ok(p.development!.book.slotsUsed <= (mode === 'four' ? 4 : 2));
        if (c.status === 'victory') assert.equal(p.development!.book.slotsUsed, mode === 'four' ? 4 : 2);
      });
