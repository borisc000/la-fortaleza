import { ELEMENT_RULES as R } from '../content/elements.ts';
import type { Enemy } from './combat.ts';
import type { ElementalDamage } from './effect-types.ts';

export function updateStatuses(dt: number, enemies: readonly Enemy[]) {
  const hits: ElementalDamage[] = [];
  for (const e of enemies) {
    if (e.dead || e.spawnRemaining > 0) continue;
    e.wetRemaining = Math.max(0, e.wetRemaining - dt); e.pushProtection = Math.max(0, e.pushProtection - dt);
    if (e.burn) {
      const b = e.burn; b.clock += Math.min(dt, b.remaining); b.remaining = Math.max(0, b.remaining - dt);
      while (b.clock + 1e-8 >= R.burnInterval) { b.clock = Math.max(0, b.clock - R.burnInterval); hits.push({ target: e, amount: b.dps * R.burnInterval, source: 'burn', attackId: b.attackId }); }
    }
  }
  return hits;
}
export function applyBurn(target: Enemy, elementalDamage: number, attackId: number) {
  const previous = target.burn;
  target.burn = { remaining: R.burnDuration, dps: Math.max(elementalDamage * R.burnRatio, previous && previous.remaining > 0 ? previous.dps : 0), clock: previous && previous.remaining > 0 ? previous.clock : 0, attackId };
}
export function cleanupStatuses(enemies: readonly Enemy[]) { for (const e of enemies) { if (e.dead || (e.burn && e.burn.remaining <= 1e-8)) e.burn = undefined; if (e.dead) { e.wetRemaining = 0; e.pushProtection = 0; } } }
