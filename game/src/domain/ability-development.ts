import { abilityData, abilityParameters } from '../content/ranged-abilities.ts';
import type { PlayableClass } from '../content/ability-schema.ts';
import { AbilityBook, operationKey } from './ability-book.ts';
import type { AbilityOperation } from './ability-book.ts';
import { AbilityOffers } from './ability-offers.ts';
import type { OfferCandidate } from './ability-offers.ts';
import { GENERAL_STATS, warriorId, warriorParameters } from '../content/warrior-abilities.ts';
import type { GeneralStat, GeneralRanks } from '../content/warrior-abilities.ts';
import type { Progression, ChoiceOption } from './progression.ts';
import { ELEMENTS } from '../content/elements.ts';
import type { Element } from '../content/elements.ts';
import { hasRelic } from '../content/relics.ts';

export type DevelopmentOption = `ability:${string}` | `stat:${GeneralStat}`;
export class AbilityDevelopment {
  readonly book: AbilityBook;
  private offers: AbilityOffers;
  private extra: Partial<Record<GeneralStat, number>> = {};
  private revision = 0;
  private operations = new Map<string, AbilityOperation>();
  constructor(seed: number, classId: PlayableClass = 'warrior') { this.offers = new AbilityOffers(seed); this.book = new AbilityBook(classId); }
  ranks(p: Progression): GeneralRanks { return Object.freeze({ ...this.extra, ...p.ranks }); }
  eligible(stat: GeneralStat, p: Progression) {
    if ((this.ranks(p)[stat] ?? 0) >= 4) return false;
    if (stat === 'temple' && this.book.classId !== 'warrior') return false;
    if (stat === 'speed' && p.speed >= p.definition.movement.maxSpeed) return false;
    if (stat === 'ballistics' && this.book.classId === 'warrior' && !this.book.snapshot.some(a => ['steel-wave', 'spectral-spears'].includes(warriorId(a.id)))) return false;
    if (stat === 'persistence' && !this.book.snapshot.some(a => ['orbiting-axes', 'war-banner', 'guardian-orbs', 'mirror', 'stakes', 'hunting-beacon'].includes(a.id.split(':')[1]))) return false;
    if (['reach', 'area', 'persistence'].includes(stat)) {
      const ranks = this.ranks(p), after = { ...ranks, [stat]: (ranks[stat] ?? 0) + 1 };
      if (!this.book.snapshot.some(a => {
        const before = abilityParameters(a, ranks), next = abilityParameters(a, after);
        return before.radius !== next.radius || before.duration !== next.duration;
      })) return false;
    }
    return true;
  }
  options(level: number, p: Progression): ChoiceOption[] {
    const candidates: OfferCandidate[] = [];
    this.operations.clear();
    for (const op of this.book.options()) {
      if (op.kind === 'branch' && op.branch === 'specialization' && warriorId(op.id) === 'sword') {
        const state = this.book.snapshot.find(a => a.id === op.id)!;
        const next = { ...state, branches: { ...state.branches, specialization: state.branches.specialization + 1 } };
        if (warriorParameters(state, this.ranks(p)).radius === warriorParameters(next, this.ranks(p)).radius) continue;
      }
      const key = `ability:${operationKey(op)}`;
      this.operations.set(key, op);
      candidates.push({ key, investment: this.book.snapshot.find(a => a.id === op.id)?.level ?? 0, category: op.kind === 'learn' ? 'learn' : 'develop', ...(op.kind === 'mutation' || op.kind === 'finisher' ? { milestone: `${op.id}:${op.kind}` } : {}) });
    }
    for (const stat of Object.keys(GENERAL_STATS) as GeneralStat[]) if (this.eligible(stat, p)) candidates.push({ key: stat in p.ranks ? stat : `stat:${stat}`, category: 'stat' });
    if (p.affinityRank < 3) candidates.push({ key: 'affinity', category: 'affinity' });
    if (level >= 5 && !hasRelic(p.relics, 'relic_solitude')) {
      if (p.secondaryElement) { if (p.secondaryRank < 3) candidates.push({ key: 'secondary-affinity', category: 'affinity' }); }
      else for (const e of Object.keys(ELEMENTS) as Element[]) if (e !== p.element) candidates.push({ key: `secondary_${e}`, category: 'affinity' });
    }
    return (this.offers.open(this.revision, candidates)?.cards.map(c => c.key) ?? []) as ChoiceOption[];
  }
  apply(id: ChoiceOption, p: Progression): boolean {
    if (id.startsWith('ability:')) { const op = this.operations.get(id); return !!op && this.book.apply(this.book.revision, op); }
    if (id.startsWith('stat:')) {
      const stat = id.slice(5) as GeneralStat;
      if (!Object.hasOwn(GENERAL_STATS, stat) || !this.eligible(stat, p)) return false;
      this.extra[stat] = (this.extra[stat] ?? 0) + 1; return true;
    }
    return false;
  }
  commit() { const pending = this.offers.open(this.revision, []); if (pending) this.offers.commit(pending.id); this.revision++; }
  stop() { this.book.stop(); this.offers.stop(); }
  describe(id: DevelopmentOption, p: Progression) {
    if (id.startsWith('stat:')) { const stat = id.slice(5) as GeneralStat, d = GENERAL_STATS[stat]; return { name: d[0], description: d[1], symbol: '◆', rank: `Rango ${this.ranks(p)[stat] ?? 0} → ${(this.ranks(p)[stat] ?? 0) + 1}/4` }; }
    const op = this.operations.get(id) ?? this.book.options().find(o => `ability:${operationKey(o)}` === id)!;
    const d = abilityData(op.id), state = this.book.snapshot.find(s => s.id === op.id);
    const branch = op.kind === 'branch' ? op.branch : undefined;
    const description = op.kind === 'learn' ? d.base : op.kind === 'mutation' ? d.mutations[op.option] : op.kind === 'finisher' ? d.finishers[op.option] : branch === 'power' ? ['warrior:war-banner', 'archer:hunting-beacon'].includes(op.id) ? '+2 puntos porcentuales al bono de daño' : '+12 % de daño base de este ataque' : branch === 'expansion' ? d.b : branch === 'specialization' ? d.c : ['warrior:sword', 'mage:orb', 'archer:arrow'].includes(op.id) ? '−6 % de intervalo del básico' : '−8 % de recarga de esta habilidad';
    return { name: `${op.kind === 'learn' ? 'Aprender: ' : ''}${d.name}`, description, symbol: op.kind === 'learn' ? '✦' : op.kind === 'branch' ? '↑' : '✧', rank: op.kind === 'learn' ? `Nivel 1 · espacio ${this.book.slotsUsed + 1}/4` : `Nivel ${state!.level} → ${state!.level + 1}/10${op.kind === 'branch' ? ` · Rama ${state!.branches[op.branch] + 1}/3` : ' · Elección exclusiva'}` };
  }
}
