export type OfferCategory = 'stat' | 'develop' | 'learn' | 'affinity';
export type OfferCandidate = Readonly<{ key: string; category: OfferCategory; milestone?: string; investment?: number }>;
export type OfferHistory = Readonly<{ withoutLearning: number; withoutAffinity: number }>;
export type AbilityOffer = Readonly<{ id: number; revision: number; cards: readonly OfferCandidate[]; nextHistory: OfferHistory }>;

/** Receives already eligible candidates. Actual stat/affinity effects belong to Progression. */
export class AbilityOffers {
  private pending?: AbilityOffer;
  private sequence = 0;
  private history: OfferHistory = { withoutLearning: 0, withoutAffinity: 0 };
  private closed = false;
  private readonly seed: number;
  constructor(seed: number) { this.seed = seed; }
  open(revision: number, eligible: readonly OfferCandidate[]): AbilityOffer | undefined {
    if (this.closed) return;
    if (this.pending) return this.pending;
    const unique = [...new Map(eligible.map(c => [c.key, Object.freeze({ ...c })])).values()];
    let random = (this.seed ^ (++this.sequence * 0x9e3779b9)) >>> 0;
    const draw = () => { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; return random / 4294967296; };
    for (let i = unique.length - 1; i > 0; i--) { const j = Math.floor(draw() * (i + 1)); [unique[i], unique[j]] = [unique[j], unique[i]]; }
    const cards: OfferCandidate[] = [];
    const add = (card: OfferCandidate | undefined) => { if (card && cards.length < 3 && !cards.some(c => c.key === card.key)) cards.push(card); };
    const pick = (category: OfferCategory) => unique.find(c => c.category === category && !cards.some(x => x.key === c.key));
    const learn = pick('learn'), affinity = unique.find(c => c.key === 'affinity') ?? pick('affinity');
    const forceLearning = !!learn && (this.sequence === 1 || this.history.withoutLearning >= 2);
    const forceAffinity = !!affinity && this.history.withoutAffinity >= 3;
    if (forceLearning) add(learn);
    if (forceAffinity) add(affinity);
    const developments = unique.filter(c => c.category === 'develop');
    // Investing in an attack makes its next branches more likely, without excluding alternatives.
    const weight = (c: OfferCandidate) => Math.max(1, Math.min(10, c.investment ?? 1)) ** 2;
    let developRoll = draw() * developments.reduce((sum, c) => sum + weight(c), 0);
    const development = developments.find(c => (developRoll -= weight(c)) < 0);
    const pair = development?.milestone ? unique.filter(c => c.category === 'develop' && c.milestone === development.milestone) : [];
    // A milestone always leaves room for an alternative; defer if both guarantees are due.
    if (pair.length === 2 && cards.length < 2) {
      pair.forEach(add);
      add(unique.find(c => c.milestone !== development!.milestone));
    } else {
      if (!forceAffinity) add(pick('stat'));
      if (!development?.milestone) add(development);
      const weights: [OfferCategory, number][] = [['learn', 30], ['develop', 40], ['affinity', 20], ['stat', 10]];
      while (cards.length < 3) {
        const available = weights.filter(([category]) => unique.some(c => c.category === category && !c.milestone && !cards.some(x => x.key === c.key)));
        if (!available.length) break;
        let roll = draw() * available.reduce((sum, [, weight]) => sum + weight, 0);
        const category = available.find(([, weight]) => (roll -= weight) < 0)![0];
        add(unique.find(c => c.category === category && !c.milestone && !cards.some(x => x.key === c.key)));
      }
    }
    const nextHistory = Object.freeze({
      withoutLearning: !learn || cards.some(c => c.category === 'learn') ? 0 : this.history.withoutLearning + 1,
      withoutAffinity: !affinity || cards.some(c => c.key === affinity.key) ? 0 : this.history.withoutAffinity + 1,
    });
    this.pending = Object.freeze({ id: this.sequence, revision, cards: Object.freeze(cards), nextHistory });
    return this.pending;
  }
  /** Validate before the owner's synchronous mutation, then commit only on success. */
  canChoose(id: number, key: string, revision: number) {
    return !this.closed && !!this.pending && this.pending.id === id && this.pending.revision === revision && this.pending.cards.some(c => c.key === key);
  }
  commit(id: number): boolean {
    if (this.closed || !this.pending || this.pending.id !== id) return false;
    this.history = this.pending.nextHistory; this.pending = undefined; return true;
  }
  stop() { this.closed = true; this.pending = undefined; }
  reset() { this.pending = undefined; this.history = { withoutLearning: 0, withoutAffinity: 0 }; this.closed = false; /* IDs never reused. */ }
}
