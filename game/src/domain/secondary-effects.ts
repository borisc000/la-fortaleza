import type { ElementalLoadout } from '../content/elements.ts';
import type { Enemy, CombatSource } from './combat.ts';
import type { Bounds, Point, Solid } from './movement.ts';
import type { ElementalVisual } from './effect-types.ts';
import { ENEMIES } from '../content/enemies.ts';
import { hasRelic } from '../content/relics.ts';
import { applyBurn } from './status-effects.ts';
import { displaceFrom } from './forced-movement.ts';

export function primaryEffectDamage(amount: number, loadout: ElementalLoadout) {
  return (
    amount *
    (loadout.element === 'fire'
      ? (loadout.secondary ? 0.7 : 1) * (hasRelic(loadout.relics, 'relic_ember') ? 1.3 : 1)
      : 1)
  );
}
export function extendPrimaryStatus(target: Enemy, loadout: ElementalLoadout) {
  if (loadout.element === 'water' && target.wetRemaining > 0 && hasRelic(loadout.relics, 'relic_tide'))
    target.wetRemaining = Math.max(target.wetRemaining, 4.5);
  if (loadout.element === 'earth' && (target.brokenRemaining ?? 0) > 0 && hasRelic(loadout.relics, 'relic_stone'))
    target.brokenRemaining = Math.max(target.brokenRemaining!, 4.5);
}
/** Support effects run once after direct primary hits. Derived damage never calls this function. */
export function secondaryEffects(
  target: Enemy,
  source: CombatSource,
  amount: number,
  attackId: number,
  origin: Point,
  hero: Point,
  loadout: ElementalLoadout,
  bounds: Bounds,
  solids: readonly Solid[],
): ElementalVisual[] {
  const second = loadout.secondary;
  if (
    !second ||
    second.element === loadout.element ||
    !['ability', 'basic', 'whirlwind', 'spell', 'cataclysm', 'arrow', 'rain'].includes(source)
  )
    return [];
  const rank = Math.max(0, Math.min(2, second.rank - 1));
  if (second.element === 'fire')
    applyBurn(target, amount * [0.15, 0.2, 0.25][rank] * (hasRelic(loadout.relics, 'relic_ember') ? 1.3 : 1), attackId);
  if (second.element === 'water')
    target.wetRemaining = Math.max(
      target.wetRemaining,
      [0.8, 1.2, 1.6][rank] + (hasRelic(loadout.relics, 'relic_tide') ? 1.5 : 0),
    );
  if (second.element === 'earth')
    target.brokenRemaining = Math.max(
      target.brokenRemaining ?? 0,
      [0.8, 1.2, 1.6][rank] + (hasRelic(loadout.relics, 'relic_stone') ? 1.5 : 0),
    );
  if (second.element === 'air' && ['basic', 'spell', 'arrow'].includes(source) && target.pushProtection <= 1e-8) {
    const before = { x: target.x, z: target.z };
    displaceFrom(target, origin, [0.1, 0.16, 0.22][rank] * ENEMIES[target.kind].push, bounds, solids, hero);
    target.pushProtection = 0.5;
    if (Math.hypot(target.x - before.x, target.z - before.z) > 1e-8)
      return [{ type: 'gust', position: before, radius: 0.5 }];
  }
  return [];
}
