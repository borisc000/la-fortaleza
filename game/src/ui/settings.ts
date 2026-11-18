import type { GameAudio } from '../audio/game-audio.ts';
import { element } from './dom.ts';

export type ViewSettings = { quality: string; sensitivity: number; invert: boolean; reducedEffects: boolean };

export type SettingsHooks = {
  /** Rendering quality changed; shadows and resolution must be reapplied. */
  qualityChanged(): void;
  distanceChanged(distance: number): void;
  /** The settings panel was opened; the expedition should pause. */
  opened(): void;
};

/** Settings panel: binds every control and returns the live values the frame loop reads. */
export function bindSettings(sound: GameAudio, signal: AbortSignal, hooks: SettingsHooks): ViewSettings {
  const settings: ViewSettings = { quality: 'high', sensitivity: 0.003, invert: false, reducedEffects: false };
  const app = element('app'),
    panel = element<HTMLDetailsElement>('settings');
  const input = (id: string, type: 'input' | 'change', fn: (control: HTMLInputElement) => void) =>
    element<HTMLInputElement>(id).addEventListener(type, event => fn(event.target as HTMLInputElement), { signal });

  input('sound-enabled', 'change', control => {
    sound.setEnabled(control.checked);
    void sound.unlock();
  });
  input('sound-volume', 'input', control => sound.setVolume(Number(control.value) / 100));
  panel.addEventListener(
    'toggle',
    () => {
      if (panel.open) hooks.opened();
    },
    { signal },
  );
  element<HTMLSelectElement>('quality').addEventListener(
    'change',
    event => {
      settings.quality = (event.target as HTMLSelectElement).value;
      hooks.qualityChanged();
    },
    { signal },
  );
  input('distance', 'input', control => hooks.distanceChanged(Number(control.value)));
  input('sensitivity', 'input', control => {
    settings.sensitivity = Number(control.value);
  });
  input('ui-scale', 'input', control => app.style.setProperty('--ui-scale', String(Number(control.value) / 100)));
  input('reduce-effects', 'change', control => {
    settings.reducedEffects = control.checked;
    app.dataset.effects = control.checked ? 'reduced' : '';
  });
  input('invert', 'change', control => {
    settings.invert = control.checked;
  });
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
