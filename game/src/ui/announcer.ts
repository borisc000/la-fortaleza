import { CAPTURE } from '../content/activities.ts';
import { ENEMIES } from '../content/enemies.ts';
import type { UiContext } from './context.ts';
import { element } from './dom.ts';

const fresh = () => ({ started: false, phase: 'waves', elite: false, fury: false, capture: 'idle' });

/** Large, brief centre-screen titles for the moments that change what the player should do. */
export function createAnnouncer(ctx: UiContext) {
  let announced = fresh();

  function announce(title: string, detail: string, tone = '') {
    const box = element('announce');
    box.dataset.tone = tone;
    element('announce-title').textContent = title;
    element('announce-detail').textContent = detail;
    for (const running of box.getAnimations()) running.cancel();
    box.animate(
      ctx.quiet()
        ? [{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }]
        : [
            { opacity: 0, transform: 'translate(-50%, 14px) scale(.94)' },
            { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: 0.1 },
            { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: 0.84 },
            { opacity: 0, transform: 'translate(-50%, -8px) scale(1)' },
          ],
      { duration: 3400, easing: 'ease-out' },
    );
  }

  /** Announces each transition once per expedition. */
  function check() {
    const run = ctx.run;
    if (!announced.started) {
      announced.started = true;
      announce('Los dominios exteriores', run.objective);
    }
    if (run.eliteSpawned && !announced.elite) {
      announced.elite = true;
      announce(ENEMIES.elite.name, 'Derrótalo y recoge su núcleo', 'danger');
    }
    if (run.phase !== announced.phase) {
      announced.phase = run.phase;
      if (run.phase === 'elite-gate') announce('Último obstáculo', run.objective, 'danger');
      else if (run.phase === 'arrival') announce('El Castellano se aproxima', 'Las hordas se retiran', 'danger');
      else if (run.phase === 'boss') announce(ENEMIES.boss.name, 'Duelo en el territorio', 'danger');
    }
    if (!announced.fury && run.boss && !run.boss.dead && run.boss.hp <= run.boss.maxHp / 2) {
      announced.fury = true;
      announce('Furia', 'El Castellano ataca más rápido y dispara más flechas', 'danger');
    }
    if (run.capture.state !== announced.capture) {
      announced.capture = run.capture.state;
      if (run.capture.state === 'warning')
        announce('Captura inminente', `Resiste ${CAPTURE.duration} s dentro del círculo`);
      else if (run.capture.state === 'completed') announce('Puesto asegurado', `+${CAPTURE.reward} monedas`, 'gain');
    }
  }

  return {
    check,
    reset() {
      announced = fresh();
    },
  };
}
