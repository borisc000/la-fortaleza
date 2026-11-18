import type { CombatEvent, CombatSource } from '../domain/combat.ts';

/** Interface-side sum of the damage events the run already emits; it never feeds back into the rules. */
export class DamageTally {
  private totals = new Map<CombatSource, number>();
  taken = 0;
  add(events: readonly CombatEvent[]) {
    for (const event of events) {
      if (event.type !== 'hit' || !(event.amount > 0)) continue;
      if (event.target === 0) this.taken += event.amount;
      else if (event.source) this.totals.set(event.source, (this.totals.get(event.source) ?? 0) + event.amount);
    }
  }
  get dealt() { let total = 0; for (const amount of this.totals.values()) total += amount; return total; }
  /** Largest first; `label` may merge several sources under one name. */
  rows(label: (source: CombatSource) => string = source => source) {
    const merged = new Map<string, number>(), total = this.dealt;
    for (const [source, amount] of this.totals) merged.set(label(source), (merged.get(label(source)) ?? 0) + amount);
    return [...merged].map(([name, amount]) => ({ name, amount, share: total ? amount / total : 0 })).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  }
}
