import type { PreviewState } from '../app/state.ts';
import type { ClassId } from '../content/class-definition.ts';
import { classAffinity } from '../content/class-definition.ts';
import { mageRange } from '../content/classes/mage.ts';
import { classDefinition } from '../content/classes.ts';
import type { Element } from '../content/elements.ts';
import { isElement } from '../content/elements.ts';
import { EXPEDITION_TITLES } from '../content/expedition.ts';
import type { ExpeditionId } from '../content/expedition.ts';
import { element } from './dom.ts';

const SCREENS = { home: 'campaign-play', expeditions: 'expedition-title', welcome: 'welcome-title' } as const;
type CampaignScreen = keyof typeof SCREENS;
type PlayableClass = Exclude<ClassId, 'armored'>;
const DESCRIPTIONS = {
  warrior: 'La espada ataca de cerca. Encadena golpes para acumular Ímpetu y elige tu afinidad al nivel 2.',
  archer: 'Los aciertos consecutivos hacen que tus flechas atraviesen más enemigos. Elige tu afinidad al nivel 2.',
};

export function bindCampaign(state: PreviewState, portrait: MediaQueryList, signal: AbortSignal) {
  const campaign = element('campaign');
  const classSelect = element<HTMLSelectElement>('select-class');
  const elementSelect = element<HTMLSelectElement>('select-element');
  const portraitImage = element<HTMLImageElement>('class-portrait');
  const preview = element('loadout-preview');
  const classCards = [...campaign.querySelectorAll<HTMLButtonElement>('.class-card')];
  const elementChips = [...campaign.querySelectorAll<HTMLButtonElement>('.element-chip')];
  let screen: CampaignScreen = 'home';
  let expedition: ExpeditionId = 'exterior';

  function selection(): { expedition: ExpeditionId; classId: PlayableClass; affinity: Element } {
    const id = classSelect.value;
    const affinity = elementSelect.value;
    return {
      expedition,
      classId: id === 'mage' || id === 'archer' ? id : 'warrior',
      affinity: isElement(affinity) ? affinity : 'fire',
    };
  }

  function selectExpedition(id: ExpeditionId) {
    expedition = id;
    element('prepare-stage').textContent = EXPEDITION_TITLES[id];
    element('guide-mastery').textContent =
      id === 'stone-heart'
        ? 'Usa los flancos del salón para esquivar al capitán. La nave central queda libre para retroceder.'
        : 'Derrota al Portador. Reúne su núcleo y afinidad III para despertar tu maestría.';
    element('guide-objective').textContent =
      id === 'stone-heart'
        ? 'Despeja el patio para levantar el rastrillo. Recupera el salón y pulsa E o toca el botón para encender la almenara.'
        : 'Resiste seis minutos entre oleadas e incursiones y derrota al Castellano Vacío.';
  }

  function refreshLoadout() {
    const { classId, affinity } = selection();
    const definition = classDefinition(classId);
    const range =
      classId === 'mage' ? mageRange({ element: affinity, rank: 1, mastery: false }) : definition.basic.range;
    if (preview.dataset.class !== classId) {
      preview.dataset.class = classId;
      portraitImage.src = `${import.meta.env.BASE_URL}assets/interface/${classId}.webp`;
    }
    element('loadout-health').textContent = String(definition.stats.hp);
    element('loadout-range').textContent = `${range.toLocaleString('es-CL')} m`;
    element('loadout-passive').textContent = definition.passive.name;
    element('class-description').textContent =
      classId === 'mage'
        ? `${classAffinity(definition, affinity).description} Cada cuarto proyectil estalla en área.`
        : DESCRIPTIONS[classId];
    element('initial-element').hidden = classId !== 'mage';
    for (const card of classCards) card.setAttribute('aria-pressed', String(card.dataset.class === classId));
    for (const chip of elementChips) chip.setAttribute('aria-pressed', String(chip.dataset.element === affinity));
  }

  function show(next: CampaignScreen) {
    screen = next;
    campaign.dataset.screen = screen;
    for (const id of Object.keys(SCREENS)) element(id).hidden = id !== screen;
    element(screen).scrollTop = 0;
    element(SCREENS[screen]).focus({ preventScroll: true });
  }

  for (const button of campaign.querySelectorAll<HTMLButtonElement>('[data-screen-link]')) {
    button.addEventListener(
      'click',
      () => {
        const stage = button.dataset.expedition;
        if (stage === 'exterior' || stage === 'stone-heart') selectExpedition(stage);
        const target = button.dataset.screenLink;
        if (target === 'home' || target === 'expeditions' || target === 'welcome') show(target);
      },
      { signal },
    );
  }

  for (const card of classCards) {
    card.addEventListener(
      'click',
      () => {
        classSelect.value = card.dataset.class ?? 'warrior';
        refreshLoadout();
      },
      { signal },
    );
  }
  for (const chip of elementChips) {
    chip.addEventListener(
      'click',
      () => {
        elementSelect.value = chip.dataset.element ?? 'fire';
        refreshLoadout();
      },
      { signal },
    );
  }
  for (const select of [classSelect, elementSelect]) select.addEventListener('change', refreshLoadout, { signal });

  document.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Escape' || event.defaultPrevented || campaign.hidden || document.querySelector('dialog[open]'))
        return;
      if (screen === 'home') return;
      event.preventDefault();
      show(screen === 'welcome' ? 'expeditions' : 'home');
    },
    { signal },
  );
  refreshLoadout();

  return {
    show,
    selection,
    sync() {
      const ready = state.phase === 'ready';
      campaign.hidden = !ready && state.phase !== 'loading';
      element('loading').hidden = state.phase !== 'loading';
      element('landscape-hint').hidden = !ready || !portrait.matches;
      element<HTMLButtonElement>('enter').disabled = !ready || portrait.matches;
    },
  };
}
