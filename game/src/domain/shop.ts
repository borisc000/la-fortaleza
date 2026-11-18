import { RELICS, RELIC_IDS } from '../content/relics.ts';
import { syncLoadout } from './loadout.ts';
import { SHOP_OFFERS } from '../content/activities.ts';
import type { OfferId, ShopOffer } from '../content/activities.ts';
import type { Progression } from './progression.ts';
import type { Exploration } from './exploration.ts';
import type { Combat } from './combat.ts';

export class ExpeditionShop {
  isOpen = false;
  revision = 0;
  spent = 0;
  purchases = 0;
  readonly offers: readonly ShopOffer[];
  readonly stock: Record<OfferId, number>;
  constructor(seed = 0) {
    const i = (seed >>> 0) % 6,
      ids = [RELIC_IDS[i], RELIC_IDS[(i + 3) % 6], RELIC_IDS[6 + i]];
    this.offers = Object.freeze([...SHOP_OFFERS, ...ids.map(id => ({ id, ...RELICS[id], relic: id, stock: 1 }))]);
    this.stock = Object.fromEntries(this.offers.map(o => [o.id, o.stock])) as Record<OfferId, number>;
  }
  open() {
    if (!this.isOpen) {
      this.isOpen = true;
      this.revision++;
    }
  }
  close() {
    this.isOpen = false;
    this.revision++;
  }
  reason(offer: ShopOffer, exploration: Exploration, progression: Progression, combat: Combat) {
    if (combat.status !== 'running' || combat.hp <= 0) return 'Expedición terminada';
    if (progression.pending) return 'Resuelve tu mejora pendiente';
    if ((this.stock[offer.id] ?? 0) <= 0) return 'Agotado';
    if (offer.relic && progression.relicReason(offer.relic)) return progression.relicReason(offer.relic);
    if (offer.heal && combat.hp >= combat.maxHp) return 'Vida completa';
    if (offer.upgrade && progression.ranks[offer.upgrade] >= progression.upgradeMax(offer.upgrade))
      return 'Mejora al máximo';
    if (exploration.coins < offer.cost) return 'Monedas insuficientes';
    return '';
  }
  buy(id: OfferId, revision: number, exploration: Exploration, progression: Progression, combat: Combat) {
    const offer = this.offers.find(o => o.id === id);
    if (!this.isOpen || revision !== this.revision || !offer || this.reason(offer, exploration, progression, combat))
      return false;
    if (offer.relic) {
      if (!progression.equipRelic(offer.relic)) return false;
      syncLoadout(progression, combat);
    } else if (offer.upgrade) {
      if (!progression.grantUpgrade(offer.upgrade)) return false;
      syncLoadout(progression, combat);
      if (offer.upgrade === 'vitality') combat.increaseMaxHp(progression.vitalityAmount());
    } else if (offer.heal) combat.heal(offer.heal);
    exploration.coins -= offer.cost;
    this.stock[id]--;
    this.spent += offer.cost;
    this.purchases++;
    this.revision++;
    return true;
  }
}
