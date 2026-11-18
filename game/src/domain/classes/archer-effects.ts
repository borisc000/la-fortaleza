import { ELEMENT_RULES as R, splitDirectDamage } from '../../content/elements.ts';
import type { ElementalLoadout } from '../../content/elements.ts';
import { ARCHER_KIT as K } from '../../content/classes/archer.ts';
import type { Enemy, CombatSource } from '../combat.ts';
import type { Point, Solid } from '../movement.ts';
import { clearPath } from '../navigation.ts';
import type { ElementalDamage, ElementalVisual } from '../effect-types.ts';
import type { ClassEffects } from '../hero-kit.ts';
import { updateStatuses, applyBurn, cleanupStatuses } from '../status-effects.ts';

export class ArcherEffects implements ClassEffects {
  private solids: readonly Solid[];
  private splashed = new Map<number, number>();
  constructor(solids: readonly Solid[]) { this.solids = solids; }
  update(dt: number, enemies: readonly Enemy[]) {
    for (const [id, remaining] of this.splashed) { if (remaining <= dt) this.splashed.delete(id); else this.splashed.set(id, remaining - dt); }
    return updateStatuses(dt, enemies);
  }
  direct(target: Enemy, source: CombatSource, rawDamage: number, attackId: number, _hero: Point, enemies: readonly Enemy[], loadout: ElementalLoadout) {
    const hits: ElementalDamage[] = [], visuals: ElementalVisual[] = [];
    if (source !== 'ability' && source !== 'arrow' && source !== 'rain') return { hits, visuals };
    if (loadout.element === 'earth') target.brokenRemaining = R.brokenDuration;
    if (loadout.element === 'fire') applyBurn(target, splitDirectDamage(rawDamage, loadout).elemental, attackId);
    if (loadout.element === 'water') {
      target.wetRemaining = R.wetDuration;
      if (source === 'arrow' && !this.splashed.has(attackId)) {
        this.splashed.set(attackId, K.projectile.lifetime + .1);
        const radius = loadout.mastery ? K.mastery.splashRadius : K.water.splashRadius;
        visuals.push({ type: 'splash', position: { x: target.x, z: target.z }, radius });
        for (const other of enemies) if (other.id !== target.id && !other.dead && other.hp > 0 && other.spawnRemaining <= 0 && Math.hypot(other.x - target.x, other.z - target.z) <= radius + other.radius && clearPath(target, other, this.solids, .04)) {
          other.wetRemaining = R.wetDuration;
          hits.push({ target: other, amount: K.water.splashDamage[Math.max(0, Math.min(2, loadout.rank - 1))], source: 'splash', attackId });
        }
      }
    }
    return { hits, visuals };
  }
  explosions() { return { hits: [] as ElementalDamage[], visuals: [] as ElementalVisual[] }; }
  cleanup(enemies: readonly Enemy[]) { cleanupStatuses(enemies); }
}
