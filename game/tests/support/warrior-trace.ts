import { createHash } from 'node:crypto';
import { Combat } from '../../src/domain/combat.ts';
import { PLAYER } from '../../src/content/config.ts';
import type { ElementalLoadout } from '../../src/content/elements.ts';

/** Public-state trace captured on 0.1.16, before the class extraction. */
export function warriorTrace(element?: 'fire' | 'water') {
  const bounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };
  const solids = [{ min: { x: 4, y: 0, z: -4 }, max: { x: 5, y: 3, z: 5 } }];
  const combat = new Combat(
    bounds,
    solids,
    [
      { x: -1, z: -2 },
      { x: 1, z: -2 },
      { x: 6, z: 2 },
    ],
    false,
  );
  combat.hp = combat.maxHp = 10000;
  const loadout: ElementalLoadout = { element, rank: element ? 3 : 0, mastery: !!element };
  combat.loadout = loadout;
  const hash = createHash('sha256');
  let hits = 0;
  for (let i = 0; i < 3600; i++) {
    const hero = { x: Math.sin(i / 180) * 2, z: Math.cos(i / 240) * 2, yaw: i / 240 };
    if (i % 600 === 0)
      combat.addEnemies(
        [
          { x: -4, z: -4 },
          { x: 7, z: 1 },
        ],
        1.5,
        i % 1200 === 0 ? 'archer' : 'charger',
      );
    combat.step(PLAYER.step, hero);
    const events = combat.takeEvents();
    hits += events.filter(e => e.type === 'hit').length;
    hash.update(
      JSON.stringify({
        hp: combat.hp,
        time: combat.time,
        kills: combat.kills,
        status: combat.status,
        attack: combat.attack && { ...combat.attack, hits: [...combat.attack.hits] },
        cooldown: combat.cooldown,
        stacks: combat.impetusStacks,
        timeout: combat.impetusRemaining,
        whirlwind: combat.whirlwind,
        skillCooldown: combat.whirlwindCooldown,
        target: combat.targetId,
        enemies: combat.enemies.map(e => ({ ...e, attack: e.attack && { ...e.attack, hits: [...e.attack.hits] } })),
        projectiles: combat.projectiles.items,
        events,
      }),
    );
  }
  return { hash: hash.digest('hex'), hp: combat.hp, kills: combat.kills, hits };
}
