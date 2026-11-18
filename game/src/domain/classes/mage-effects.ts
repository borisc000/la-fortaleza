import { ELEMENT_RULES as R } from '../../content/elements.ts';
import type { ElementalLoadout } from '../../content/elements.ts';
import { MAGE_KIT } from '../../content/classes/mage.ts';
import { ENEMIES } from '../../content/enemies.ts';
import type { Enemy, CombatSource } from '../combat.ts';
import type { Bounds, Point, Solid } from '../movement.ts';
import { moveCircle } from '../movement.ts';
import type { ElementalDamage, ElementalVisual } from '../effect-types.ts';
import type { ClassEffects } from '../hero-kit.ts';
import { updateStatuses, applyBurn, cleanupStatuses } from '../status-effects.ts';
import { displaceFrom } from '../forced-movement.ts';

export class MageEffects implements ClassEffects {
  private bounds: Bounds;
  private solids: readonly Solid[];
  constructor(bounds: Bounds, solids: readonly Solid[]) {
    this.bounds = bounds;
    this.solids = solids;
  }
  update(dt: number, enemies: readonly Enemy[]) {
    return updateStatuses(dt, enemies);
  }
  direct(
    target: Enemy,
    source: CombatSource,
    rawDamage: number,
    attackId: number,
    origin: Point,
    _enemies: readonly Enemy[],
    loadout: ElementalLoadout,
    protectedHero?: Point,
  ) {
    if (source === 'ability' || source === 'spell' || source === 'cataclysm') {
      if (loadout.element === 'earth') {
        target.brokenRemaining = R.brokenDuration;
      } else if (loadout.element === 'air' && target.pushProtection <= 1e-8) {
        const rank = Math.max(0, Math.min(2, loadout.rank - 1)),
          air = MAGE_KIT.air;
        const amount =
          source === 'cataclysm' ? -air.pull[rank] * (loadout.mastery ? air.masteryPull : 1) : air.push[rank];
        displaceFrom(target, origin, amount * ENEMIES[target.kind].push, this.bounds, this.solids, protectedHero);
        target.pushProtection = air.protection;
      } else if (loadout.element === 'fire') {
        applyBurn(target, rawDamage, attackId);
      } else if (loadout.element === 'water') {
        target.wetRemaining = R.wetDuration;
        if (source === 'cataclysm' && loadout.mastery && target.pushProtection <= 1e-8) {
          const dx = target.x - origin.x,
            dz = target.z - origin.z,
            d = Math.hypot(dx, dz);
          if (d > 1e-8) {
            const push = MAGE_KIT.mastery.push * ENEMIES[target.kind].push;
            Object.assign(
              target,
              moveCircle(target, { x: (dx / d) * push, z: (dz / d) * push }, target.radius, this.bounds, this.solids),
            );
          }
          target.pushProtection = 0.3;
        }
      }
    }
    return { hits: [] as ElementalDamage[], visuals: [] as ElementalVisual[] };
  }
  explosions() {
    return { hits: [] as ElementalDamage[], visuals: [] as ElementalVisual[] };
  }
  cleanup(enemies: readonly Enemy[]) {
    cleanupStatuses(enemies);
  }
}
