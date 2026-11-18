import { createIcon, iconPath } from '../app/icons.ts';
import { relicSummary } from '../app/relics.ts';
import { rankNodes } from './build-summary.ts';
import type { UiContext } from './context.ts';
import { element } from './dom.ts';

export type ShopHooks = {
  /** A purchase was applied to the run. */
  purchased(): void;
  /** Redraw the scene and HUD behind the menu. */
  redraw(): void;
};

/** Merchant screen. Purchases go through run.shop.buy; this module only presents offers. */
export function createShopScreen(ctx: UiContext, hooks: ShopHooks) {
  function show() {
    const run = ctx.run,
      combat = run.combat;
    const cards = element('shop-offers');
    cards.replaceChildren();
    element('shop-balance').textContent =
      `${run.exploration.coins} monedas · Vida ${Math.ceil(combat.hp)} / ${combat.maxHp}`;
    const revision = run.shop.revision;
    element('shop-relics').textContent = relicSummary(run.progression);
    element('shop-description').textContent =
      `Combate y reloj en pausa. Estadísticas compartidas con las mejoras de nivel: máximo ${run.progression.development ? 4 : 3} rangos.`;
    for (const offer of run.shop.offers) {
      const button = document.createElement('button');
      button.className = 'shop-offer';
      const name = document.createElement('strong');
      name.textContent = offer.name;
      const description = document.createElement('span');
      description.textContent = offer.upgrade ? run.progression.upgradeDescription(offer.upgrade) : offer.description;
      const tag = document.createElement('em');
      tag.className = 'upgrade-kind';
      tag.textContent = offer.relic ? 'Reliquia' : offer.upgrade ? 'Estadística' : 'Provisión';
      const head = document.createElement('div'),
        price = document.createElement('span'),
        path = iconPath(offer.relic ?? offer.upgrade ?? 'recovery');
      head.className = 'shop-head';
      price.className = 'shop-price';
      price.textContent = `${offer.cost} monedas`;
      if (path) head.append(createIcon(path));
      head.append(name, price);
      const details = document.createElement('small'),
        rank = offer.upgrade ? run.progression.ranks[offer.upgrade] : 0,
        max = offer.upgrade ? run.progression.upgradeMax(offer.upgrade) : 0;
      details.append(
        `${run.shop.stock[offer.id]} disponibles`,
        ...(offer.upgrade
          ? rankNodes(rank < max ? ` · Rango ${rank} → ${rank + 1} / ${max}` : ` · Rango ${rank}/${max}`)
          : []),
      );
      const reason = run.shop.reason(offer, run.exploration, run.progression, combat),
        short = reason === 'Monedas insuficientes';
      const action = document.createElement('span');
      action.className = 'shop-buy';
      button.disabled = !!reason;
      button.classList.toggle('short', short);
      action.textContent = short ? `Faltan ${offer.cost - run.exploration.coins} monedas` : reason || 'Comprar';
      button.append(tag, head, description, details, action);
      button.addEventListener('click', () => {
        if (
          ctx.state.phase !== 'shopping' ||
          !run.shop.buy(offer.id, revision, run.exploration, run.progression, combat)
        )
          return;
        hooks.purchased();
        element('shop-message').textContent = `${offer.name} · adquirido`;
        show();
        hooks.redraw();
        element('shop-continue').focus({ preventScroll: true });
      });
      cards.append(button);
    }
  }

  /** First enabled offer, or the continue button when nothing can be bought. */
  function focusFirst() {
    (
      element('shop-offers').querySelector<HTMLButtonElement>('button:not(:disabled)') ?? element('shop-continue')
    ).focus({ preventScroll: true });
  }

  return { show, focusFirst };
}
