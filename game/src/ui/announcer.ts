import { CAPTURE } from '../content/activities.ts';
import { BOSS_FURY, ENEMIES } from '../content/enemies.ts';
import { STONE_HEART_CAPTAIN } from '../content/stone-heart.ts';
import type { UiContext } from './context.ts';
import { element } from './dom.ts';

const fresh = () => ({
  started: false,
  phase: 'waves',
  interior: 'entry',
  elite: false,
  fury: false,
  capture: 'idle',
  incursionAt: 0,
});

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
      announce(run.title, run.objective);
    }
    if (run.stoneHeart) {
      const { phase } = run.stoneHeart;
      if (phase !== announced.interior) {
        announced.interior = phase;
        switch (phase) {
          case 'reinforcements':
            announce('Refuerzos en el patio', 'Vigila los flancos', 'danger');
            break;
          case 'passage':
            announce('Patio asegurado', 'Rastrillo abierto · armería al oeste', 'gain');
            break;
          case 'captain':
            announce(STONE_HEART_CAPTAIN, 'Esquiva el barrido y el golpe al suelo', 'danger');
            break;
          case 'signal':
            announce('Salón recuperado', 'Enciende la almenara junto al muro del fondo', 'gain');
            break;
          case 'complete':
            announce('Almenara encendida', 'La expedición ha recuperado el recinto', 'gain');
            break;
        }
      }
      return;
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
    const boss = run.boss;
    if (!announced.fury && boss && !boss.dead && boss.hp <= boss.maxHp * BOSS_FURY.healthFraction) {
      announced.fury = true;
      announce('Furia', 'El Castellano se mueve y ataca más rápido', 'danger');
    }
    if (run.capture.state !== announced.capture) {
      announced.capture = run.capture.state;
      if (run.capture.state === 'warning')
        announce('Captura inminente', `Resiste ${CAPTURE.duration} s dentro del círculo`);
      else if (run.capture.state === 'completed') announce('Puesto asegurado', `+${CAPTURE.reward} monedas`, 'gain');
    }
    const incursion = run.incursion;
    if (incursion && incursion.at !== announced.incursionAt) {
      announced.incursionAt = incursion.at;
      announce(incursion.title, incursion.warning, 'danger');
    }
  }

  return {
    check,
    reset() {
      announced = fresh();
    },
  };
}
