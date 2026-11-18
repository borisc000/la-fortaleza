import { RELICS, isRelic } from '../content/relics.ts';
import { isElement } from '../content/elements.ts';
import { isTechnique } from '../content/techniques.ts';
import { secondaryElement } from '../domain/progression.ts';
import { createIcon, iconPath, upgradeKind } from '../app/icons.ts';
import { relicSummary } from '../app/relics.ts';
import { techniqueCatalog, techniqueSummary } from '../app/techniques.ts';
import { rankNodes } from './build-summary.ts';
import type { UiContext } from './context.ts';
import { element } from './dom.ts';

export type LevelUpHooks = {
  /** A choice was applied to the run. */
  chosen(): void;
  /** Redraw the scene and HUD behind the menu. */
  redraw(): void;
};

/** Level-up, relic and mastery choice screen. Choices go through run.choose; this module only presents them. */
export function createLevelUpScreen(ctx: UiContext, hooks: LevelUpHooks) {
  function refreshCatalog() {
    const run = ctx.run, progression = run.progression;
    element('relic-summary').textContent = relicSummary(progression);
    const inventory = element('relic-inventory'); inventory.replaceChildren();
    for (const id of progression.relics) { const li = document.createElement('li'); li.textContent = `${RELICS[id].name} · ${RELICS[id].description}`; inventory.append(li); }
    const catalog = element('technique-catalog'); catalog.replaceChildren();
    catalog.parentElement!.hidden = progression.choice()?.kind === 'relic';
    element('catalog-heading').textContent = progression.development ? `Repertorio: ${run.definition.name}` : 'Las cuatro técnicas de tu clase';
    element('catalog-help').textContent = progression.development
      ? 'Hasta cuatro habilidades equipadas; ataque básico aparte. Hasta nivel 10, con elecciones exclusivas en 5 y 10. Aprender y mejorar compiten con estadísticas y afinidades.'
      : 'Tres técnicas como máximo, rangos I–III a niveles 3, 5 y 7.';
    element('technique-slots').textContent = techniqueSummary(progression);
    for (const entry of techniqueCatalog(progression, progression.choice()?.level ?? progression.level)) {
      const item = document.createElement('li'), name = document.createElement('strong'), description = document.createElement('span'), status = document.createElement('small');
      name.textContent = entry.name; description.textContent = entry.description; status.textContent = entry.status;
      item.append(name, description, status); catalog.append(item);
    }
  }

  function show() {
    const run = ctx.run;
    const cards = element('upgrade-options'), nextButton = element<HTMLButtonElement>('upgrade-continue');
    cards.replaceChildren(); nextButton.hidden = true;
    let choice = run.progression.choice(), compensated = 0;
    while (choice && !choice.options.length) {
      if (!run.fallback(choice.id)) break;
      compensated++; choice = run.progression.choice();
    }
    refreshCatalog();
    if (!choice) {
      element('upgrade-title').textContent = 'Preparado para continuar';
      element('upgrade-description').textContent = compensated ? 'No quedan mejoras elegibles para estos niveles. Recuperas un 25 % de vida máxima por elección pendiente.' : 'Tu mejora está lista.';
      nextButton.hidden = false; nextButton.textContent = 'Continuar';
      return;
    }
    element('upgrade-title').textContent = choice.kind === 'relic' ? `${choice.source} · Elige tu recompensa` : choice.kind === 'element' ? 'Nivel 2 · Elige tu afinidad' : choice.kind === 'mastery' ? 'Despierta tu maestría' : `Nivel ${choice.level} · Elige una mejora`;
    element('upgrade-description').textContent = choice.kind === 'relic'
      ? 'Elige una reliquia compatible o toma las monedas. Máximo cuatro reliquias, sin duplicados ni sustituciones. No consume nivel.'
      : choice.kind === 'mastery' ? 'Afinidad III y núcleo reunidos. Activa tu transformación; no consume una subida de nivel.'
        : `Combate en pausa. ${choice.kind === 'element' ? 'Esta afinidad define tu kit y tu única maestría. Puedes añadir otra de apoyo desde nivel 5.' : 'La mejora dura hasta el final del encuentro.'}${run.progression.pending > 1 ? ` Tienes ${run.progression.pending} elecciones pendientes.` : ''}`;
    cards.dataset.count = String(choice.options.length);
    const choiceId = choice.id;
    for (const id of choice.options) {
      const upgrade = run.progression.option(id);
      const button = document.createElement('button'); button.className = 'upgrade-card';
      button.classList.toggle('technique-card', isTechnique(id) || isRelic(id) || id.startsWith('ability:'));
      button.dataset.element = secondaryElement(id) ?? (id === 'secondary-affinity' ? run.progression.secondaryElement : isElement(id) ? id : id === 'affinity' || id === 'mastery' ? run.progression.element : '');
      const { kind, label } = upgradeKind(id), path = iconPath(id, button.dataset.element);
      button.dataset.kind = kind; button.style.setProperty('--i', String(cards.childElementCount));
      const tag = document.createElement('em'); tag.className = 'upgrade-kind'; tag.textContent = label;
      const symbol = document.createElement('span'); symbol.className = 'upgrade-symbol'; symbol.textContent = upgrade.symbol; symbol.setAttribute('aria-hidden', 'true');
      if (path) symbol.replaceChildren(createIcon(path));
      const name = document.createElement('strong'); name.textContent = upgrade.name;
      const description = document.createElement('span'); description.textContent = upgrade.description;
      const rankText = document.createElement('small'); rankText.append(...rankNodes(upgrade.rank));
      const key = document.createElement('kbd'); key.textContent = String(cards.childElementCount + 1); key.setAttribute('aria-hidden', 'true');
      button.append(tag, symbol, name, description, rankText, key);
      button.addEventListener('click', () => {
        if (ctx.state.phase !== 'choosing' || !run.choose(choiceId, id)) return;
        refreshCatalog();
        hooks.chosen();
        const acquired = document.createElement('div'); acquired.className = 'upgrade-acquired'; acquired.dataset.kind = kind; acquired.dataset.element = button.dataset.element ?? ''; acquired.append(symbol, tag);
        cards.dataset.count = '1'; cards.replaceChildren(acquired); element('upgrade-title').textContent = `${upgrade.name} · adquirido`;
        element('upgrade-description').textContent = upgrade.description;
        nextButton.textContent = run.progression.pending ? 'Siguiente mejora' : 'Continuar'; nextButton.hidden = false;
        hooks.redraw(); nextButton.focus({ preventScroll: true });
      });
      cards.append(button);
    }
    (cards.firstElementChild as HTMLButtonElement | null)?.focus({ preventScroll: true });
  }

  return { show };
}
