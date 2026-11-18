import type { CombatEvent } from '../domain/combat.ts';

/** Merge same-frame pulses; add hero damage last so it survives the visual pool cap. */
export function damageLabels(events: readonly CombatEvent[]): CombatEvent[] {
  const grouped = new Map<number, CombatEvent>();
  for (const e of events)
    if (e.type === 'hit' && e.amount > 0) {
      const previous = grouped.get(e.target);
      grouped.set(e.target, { ...e, amount: e.amount + (previous?.amount ?? 0) });
    }
  const hero = grouped.get(0);
  grouped.delete(0);
  const labels = [...grouped.values()]
    .sort((a, b) => b.amount - a.amount || a.target - b.target)
    .slice(0, hero ? 7 : 8);
  if (hero) labels.push(hero);
  return labels;
}

export type DamageTone = 'hurt' | 'fire' | 'water' | 'earth' | 'air' | 'plain';
export const DAMAGE_TONES: Record<DamageTone, string> = {
  hurt: '#ff8f73',
  fire: '#ffb056',
  water: '#7fd6f2',
  earth: '#e2bd7c',
  air: '#cdf0c0',
  plain: '#f4e6bd',
};
/** Colour by what caused the damage; only sources that are elemental by definition get an element tone. */
export function damageTone(event: Pick<CombatEvent, 'target' | 'source'>): DamageTone {
  if (event.target === 0) return 'hurt';
  switch (event.source) {
    case 'burn':
    case 'explosion':
      return 'fire';
    case 'splash':
      return 'water';
    case 'quake':
      return 'earth';
    case 'gust':
      return 'air';
    default:
      return 'plain';
  }
}
/** Bigger blows read bigger, within a narrow range so hordes stay legible. */
export function damageScale(amount: number) {
  return 1 + Math.min(0.6, Math.log10(Math.max(1, amount)) * 0.25);
}
