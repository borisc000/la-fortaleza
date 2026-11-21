import type { GameAudio } from '../audio/game-audio.ts';
import { CAMERA } from '../content/config.ts';
import { element } from './dom.ts';

const STORAGE_KEY = 'fortaleza-view-settings';
const DEFAULTS = {
  quality: 'high' as 'high' | 'low',
  distance: Number(CAMERA.distance),
  sensitivity: 0.003,
  invert: false,
  reducedEffects: false,
  uiScale: 100,
  soundEnabled: true,
  volume: 25,
};

export type ViewSettings = typeof DEFAULTS;
type SettingsHooks = {
  qualityChanged(): void;
  distanceChanged(distance: number): void;
};

function readSettings(): ViewSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<ViewSettings> | null;
    if (!saved) return { ...DEFAULTS };
    const value = (candidate: number | undefined, fallback: number, min: number, max: number) =>
      typeof candidate === 'number' && Number.isFinite(candidate) ? Math.min(max, Math.max(min, candidate)) : fallback;
    return {
      quality: saved.quality === 'low' ? 'low' : 'high',
      distance: value(saved.distance, DEFAULTS.distance, CAMERA.minDistance, CAMERA.maxDistance),
      sensitivity: value(saved.sensitivity, DEFAULTS.sensitivity, 0.001, 0.006),
      uiScale: value(saved.uiScale, DEFAULTS.uiScale, 85, 125),
      volume: value(saved.volume, DEFAULTS.volume, 0, 100),
      invert: saved.invert === true,
      reducedEffects: saved.reducedEffects === true,
      soundEnabled: saved.soundEnabled !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function bindSettings(sound: GameAudio, signal: AbortSignal, hooks: SettingsHooks): ViewSettings {
  const settings = readSettings();
  const app = element('app');
  const quality = element<HTMLSelectElement>('quality');
  const sliders = [
    ['distance', 'distance', n => `${n.toLocaleString('es-CL')} m`],
    ['sensitivity', 'sensitivity', n => `${Math.round((n / DEFAULTS.sensitivity) * 100)} %`],
    ['ui-scale', 'uiScale', n => `${n} %`],
    ['sound-volume', 'volume', n => `${n} %`],
  ] satisfies [string, 'distance' | 'sensitivity' | 'uiScale' | 'volume', (value: number) => string][];
  const toggles = [
    ['sound-enabled', 'soundEnabled'],
    ['reduce-effects', 'reducedEffects'],
    ['invert', 'invert'],
  ] as const;

  function sync() {
    quality.value = settings.quality;
    for (const [id, key, display] of sliders) {
      const control = element<HTMLInputElement>(id);
      control.value = String(settings[key]);
      settings[key] = control.valueAsNumber;
      element(`${id}-value`).textContent = display(settings[key]);
    }
    for (const [id, key] of toggles) element<HTMLInputElement>(id).checked = settings[key];
    app.style.setProperty('--ui-scale', String(settings.uiScale / 100));
    app.dataset.effects = settings.reducedEffects ? 'reduced' : '';
    sound.setEnabled(settings.soundEnabled);
    sound.setVolume(settings.volume / 100);
  }

  function update(changes: Partial<ViewSettings>) {
    const { quality: previousQuality, distance: previousDistance } = settings;
    Object.assign(settings, changes);
    sync();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Settings still apply for the current visit when storage is unavailable.
    }
    if (previousQuality !== settings.quality) hooks.qualityChanged();
    if (previousDistance !== settings.distance) hooks.distanceChanged(settings.distance);
  }

  quality.addEventListener('change', () => update({ quality: quality.value === 'low' ? 'low' : 'high' }), { signal });
  for (const [id, key] of sliders) {
    const control = element<HTMLInputElement>(id);
    control.addEventListener('input', () => update({ [key]: control.valueAsNumber }), { signal });
  }
  for (const [id, key] of toggles) {
    const control = element<HTMLInputElement>(id);
    control.addEventListener('change', () => update({ [key]: control.checked }), { signal });
  }
  element('reset-settings').addEventListener('click', () => update(DEFAULTS), { signal });
  sync();
  return settings;
}

/** Interface sounds: a soft tick when a control gains hover or focus, a click when it is pressed. Cards and offers keep their own cues. */
export function bindInterfaceSounds(sound: GameAudio, signal: AbortSignal) {
  const app = element('app');
  let ticked: HTMLElement | null = null;
  const control = (target: EventTarget | null) =>
    target instanceof HTMLElement ? target.closest<HTMLElement>('button:not(:disabled), summary') : null;
  const tick = (event: Event) => {
    const hit = control(event.target);
    if (hit && hit !== ticked) sound.cue('tick', true);
    ticked = hit;
  };
  app.addEventListener('pointerover', tick, { signal });
  app.addEventListener('focusin', tick, { signal });
  app.addEventListener(
    'click',
    event => {
      const hit = control(event.target);
      if (hit && !hit.matches('.upgrade-card, .shop-offer, #pause')) {
        void sound.unlock();
        sound.cue('select', true);
      }
    },
    { signal },
  );
}
