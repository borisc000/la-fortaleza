import { ELEMENT_RULES as R, splitDirectDamage } from '../../content/elements.ts';
import type { ElementalLoadout } from '../../content/elements.ts';
import { ENEMIES } from '../../content/enemies.ts';
import type { Enemy, CombatSource } from '../combat.ts';
import type { Bounds, Point, Solid } from '../movement.ts';
import { moveCircle } from '../movement.ts';
import { clearPath } from '../navigation.ts';

import type { ElementalDamage, ElementalVisual } from '../effect-types.ts';
import type { ClassEffects } from '../hero-kit.ts';
import { WARRIOR, WARRIOR_KIT } from '../../content/classes/warrior.ts';

export class WarriorEffects implements ClassEffects {
  splashRemaining = 0;
  private bounds: Bounds;
  private solids: readonly Solid[];
  constructor(bounds: Bounds, solids: readonly Solid[]) { this.bounds = bounds; this.solids = solids; }
  update(dt: number, enemies: readonly Enemy[]): ElementalDamage[] {
    this.splashRemaining = Math.max(0, this.splashRemaining - dt);
    const hits: ElementalDamage[] = [];
    for (const enemy of enemies) {
      if (enemy.dead || enemy.spawnRemaining > 0) continue;
      enemy.wetRemaining = Math.max(0, enemy.wetRemaining - dt);
      enemy.pushProtection = Math.max(0, enemy.pushProtection - dt);
      const burn = enemy.burn;
      if (burn) {
        const active = Math.min(dt, burn.remaining); burn.remaining = Math.max(0, burn.remaining - dt); burn.clock += active;
        while (burn.clock + 1e-8 >= R.burnInterval) { burn.clock = Math.max(0, burn.clock - R.burnInterval); hits.push({ target: enemy, amount: burn.dps * R.burnInterval, source: 'burn', attackId: burn.attackId }); }
        // Retain through this step so a final burn tick can trigger its death explosion.
      }
    }
    return hits;
  }
  direct(target: Enemy, source: CombatSource, rawDamage: number, attackId: number, hero: Point, enemies: readonly Enemy[], loadout: ElementalLoadout) {
    const hits: ElementalDamage[] = [], visuals: ElementalVisual[] = [];
    if (source !== 'ability' && source !== 'basic' && source !== 'whirlwind' && source !== 'quake') return { hits, visuals };
    if (loadout.element === 'earth') {
      target.brokenRemaining = R.brokenDuration;
    } else if (loadout.element === 'air' && target.pushProtection <= 1e-8) {
      const rank = Math.max(0, Math.min(2, loadout.rank - 1)), wind = WARRIOR_KIT.air;
      const dx = target.x - hero.x, dz = target.z - hero.z, distance = Math.hypot(dx, dz);
      const pulling = source === 'whirlwind';
      const magnitude = (pulling ? loadout.mastery ? wind.masteryPull : wind.pull[rank] : wind.push[rank]) * ENEMIES[target.kind].push;
      // Keep a small clearance around the hero; never pull through its center.
      const amount = pulling ? -Math.min(magnitude, Math.max(0, distance - target.radius - WARRIOR.movement.radius - .08)) : magnitude;
      if (distance > 1e-8 && Math.abs(amount) > 1e-8 && clearPath(hero, target, this.solids, .04)) {
        const before = { x: target.x, z: target.z };
        Object.assign(target, moveCircle(target, { x: dx / distance * amount, z: dz / distance * amount }, target.radius, this.bounds, this.solids));
        if (Math.hypot(target.x - before.x, target.z - before.z) > 1e-8) visuals.push({ type: 'gust', position: before, radius: pulling ? .45 : .7 });
      }
      target.pushProtection = pulling ? wind.pullCooldown : wind.pushCooldown;
    }
    if (loadout.element === 'fire') {
      const dps = splitDirectDamage(rawDamage, loadout).elemental * R.burnRatio;
      const current = target.burn;
      target.burn = { remaining: R.burnDuration, dps: Math.max(dps, current && current.remaining > 0 ? current.dps : 0), clock: current && current.remaining > 0 ? current.clock : 0, attackId };
    } else if (loadout.element === 'water') {
      const wasWet = target.wetRemaining > 0;
      const impact = { x: target.x, z: target.z };
      target.wetRemaining = R.wetDuration;
      if (source === 'basic' && target.pushProtection <= 1e-8) {
        const dx = target.x - hero.x, dz = target.z - hero.z, distance = Math.hypot(dx, dz);
        const push = WARRIOR_KIT.effects.pushes[Math.max(0, Math.min(2, loadout.rank - 1))] * (1 + WARRIOR_KIT.effects.wetPushBonus) * ENEMIES[target.kind].push;
        if (distance > 1e-8) Object.assign(target, moveCircle(target, { x: dx / distance * push, z: dz / distance * push }, target.radius, this.bounds, this.solids));
        target.pushProtection = WARRIOR_KIT.effects.pushProtection;
      }
      if (source === 'basic' && wasWet && loadout.mastery && this.splashRemaining <= 1e-8) {
        this.splashRemaining = WARRIOR_KIT.effects.splashCooldown;
        visuals.push({ type: 'splash', position: impact, radius: WARRIOR_KIT.effects.splashRadius });
        for (const other of enemies) if (other.id !== target.id && this.reachable(impact, other, WARRIOR_KIT.effects.splashRadius)) {
          other.wetRemaining = R.wetDuration;
          hits.push({ target: other, amount: WARRIOR_KIT.effects.splashDamage, source: 'splash', attackId });
        }
      }
    }
    return { hits, visuals };
  }
  explosions(dying: readonly Enemy[], enemies: readonly Enemy[], killers: ReadonlyMap<number, CombatSource>, loadout: ElementalLoadout) {
    const hits: ElementalDamage[] = [], visuals: ElementalVisual[] = [];
    if (loadout.element !== 'fire' || !loadout.mastery) return { hits, visuals };
    for (const enemy of dying) if (enemy.burn && killers.get(enemy.id) !== 'explosion') {
      visuals.push({ type: 'explosion', position: { x: enemy.x, z: enemy.z }, radius: WARRIOR_KIT.effects.explosionRadius });
      for (const other of enemies) if (other.id !== enemy.id && this.reachable(enemy, other, WARRIOR_KIT.effects.explosionRadius)) hits.push({ target: other, amount: WARRIOR_KIT.effects.explosionDamage, source: 'explosion', attackId: enemy.burn.attackId });
    }
    return { hits, visuals };
  }
  cleanup(enemies: readonly Enemy[]) { for (const enemy of enemies) { if (enemy.dead || (enemy.burn && enemy.burn.remaining <= 1e-8)) enemy.burn = undefined; if (enemy.dead) { enemy.wetRemaining = 0; enemy.pushProtection = 0; } } }
  private reachable(origin: Point, enemy: Enemy, radius: number) { return !enemy.dead && enemy.hp > 0 && enemy.spawnRemaining <= 0 && Math.hypot(enemy.x - origin.x, enemy.z - origin.z) <= radius + enemy.radius && clearPath(origin, enemy, this.solids, .04); }
}
