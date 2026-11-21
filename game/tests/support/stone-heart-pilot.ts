import { actionStats } from '../../src/content/enemies.ts';
import {
  STONE_HEART_ARCH,
  STONE_HEART_BEACON,
  STONE_HEART_COURT,
  STONE_HEART_SOLIDS,
} from '../../src/content/stone-heart.ts';
import type { Body, Point } from '../../src/domain/movement.ts';
import { Navigation, clearPath } from '../../src/domain/navigation.ts';
import type { ChoiceOption } from '../../src/domain/progression.ts';
import type { Run } from '../../src/domain/run.ts';

function gap(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function stoneHeartChoice(options: readonly ChoiceOption[]) {
  return (
    options.find(id => id === 'fire') ??
    options.find(id => id.startsWith('ability:') && id.includes('/learn/')) ??
    options.find(id => id === 'affinity' || id === 'damage') ??
    options[0]
  );
}

/** Drives the ordinary movement, automatic combat and contextual interactions at normal health. */
export function createStoneHeartPilot(run: Run, armory: boolean) {
  const mission = run.stoneHeart!;
  const nav = new Navigation(run.bounds, STONE_HEART_SOLIDS, run.definition.movement.radius);
  let waypoint: Point | undefined;
  let previousTarget: Point | undefined;
  let refreshAt = 0;
  let retreatGoal: Point | undefined;
  let retreatUntil = 0;

  function act(hero: Body, cameraYaw: number) {
    const combat = run.combat;
    const { phase } = mission;
    const now = combat.time;
    const near = <T extends Point>(list: T[]) =>
      list.reduce<T | undefined>(
        (best, point) => (!best || gap(hero, point) < gap(hero, best) ? point : best),
        undefined,
      );
    const enemy = near(combat.enemies.filter(unit => !unit.dead && unit.spawnRemaining <= 0));
    const loot = near(run.progression.drops.filter(drop => !drop.core && gap(hero, drop) <= 5));
    const chest =
      armory && phase === 'passage'
        ? run.exploration.objects.find(object => object.kind === 'chest' && object.status === 'available')
        : undefined;
    const hurt = combat.maxHp - combat.hp > 22;
    const heal =
      hurt && phase === 'passage' && !chest
        ? run.exploration.objects.find(
            object =>
              object.kind === 'supply' && object.region === 'Paso del rastrillo' && object.status === 'available',
          )
        : hurt && (phase === 'captain' || (phase === 'hall' && combat.hp < combat.maxHp / 2))
          ? run.exploration.objects.find(
              object =>
                object.kind === 'supply' && object.region === 'Salón principal' && object.status === 'available',
            )
          : undefined;
    if (phase === 'captain' && enemy?.attack && now >= retreatUntil) {
      const timing = actionStats(enemy.kind, enemy.attack.action);
      const distance = gap(hero, enemy);
      if (distance > 0.01 && distance < timing.range + 0.55 && enemy.attack.age < timing.windup) {
        const x = (hero.x - enemy.x) / distance;
        const z = (hero.z - enemy.z) / distance;
        const goal = { x: hero.x + x * 4.6, z: hero.z + z * 4.6 };
        if (clearPath(hero, goal, STONE_HEART_SOLIDS, 0.6)) {
          retreatGoal = goal;
          retreatUntil = now + timing.windup - enemy.attack.age + 0.22;
        }
      }
    }
    let target: Point | undefined;
    if (phase === 'entry') target = STONE_HEART_COURT;
    else if (phase === 'passage') target = chest || heal || STONE_HEART_ARCH;
    else if (phase === 'signal') target = STONE_HEART_BEACON;
    else if (phase !== 'complete') target = now < retreatUntil ? retreatGoal : (heal ?? loot ?? enemy);

    if (target && (target !== previousTarget || now >= refreshAt)) {
      nav.update(target);
      waypoint = nav.waypoint(hero, target);
      refreshAt = now + 0.12;
    }
    previousTarget = target;
    const focus = run.focus(hero);
    const interaction =
      focus?.kind === 'beacon' || (focus?.kind === 'chest' && focus.status === 'available') ? focus.id : undefined;
    const range = run.definition.id === 'warrior' ? 1.48 : 5.9;
    if (
      interaction ||
      !target ||
      !waypoint ||
      gap(hero, waypoint) < 0.14 ||
      (enemy === target && gap(hero, enemy) <= range && clearPath(hero, enemy, STONE_HEART_SOLIDS, 0.08))
    ) {
      return { right: 0, forward: 0, interaction };
    }
    const x = waypoint.x - hero.x;
    const z = waypoint.z - hero.z;
    const right = x * Math.cos(cameraYaw) - z * Math.sin(cameraYaw);
    const forward = -x * Math.sin(cameraYaw) - z * Math.cos(cameraYaw);
    const threshold = Math.hypot(x, z) * 0.38;
    return {
      right: Math.abs(right) > threshold ? Math.sign(right) : 0,
      forward: Math.abs(forward) > threshold ? Math.sign(forward) : 0,
      interaction,
    };
  }

  return { act };
}
