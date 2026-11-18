import { EXPEDITION } from '../content/expedition.ts';
import { angleDelta } from '../domain/movement.ts';
import type { UiContext } from './context.ts';
import { element } from './dom.ts';

const TUTORIAL_KEY = 'fortaleza.primeros-pasos';

/** First-steps checklist: each line latches once its condition has been seen; nothing here changes the run. */
export function createTutorial(ctx: UiContext, onStep: () => void) {
  let enabled = true,
    startYaw: number | undefined;
  try {
    enabled = localStorage.getItem(TUTORIAL_KEY) !== 'hecho';
  } catch {
    /* Storage is optional. */
  }
  const steps = [
    {
      text: 'Camina con WASD',
      done: () => Math.hypot(ctx.body.x - EXPEDITION.start.x, ctx.body.z - EXPEDITION.start.z) > 3,
    },
    {
      text: 'Mira con el ratón · rueda para el zoom',
      done: () => startYaw !== undefined && Math.abs(angleDelta(startYaw, ctx.camera.yaw)) > 0.35,
    },
    { text: 'Acércate a un enemigo: atacas solo', done: () => ctx.run.combat.kills > 0 },
    { text: 'Recoge la esencia que dejan', done: () => ctx.run.progression.totalEssence > 0 },
    {
      text: 'Pulsa E junto a un cofre o al mercader',
      done: () => ctx.run.exploration.chestsOpened > 0 || ctx.run.shop.isOpen || ctx.run.shop.purchases > 0,
    },
  ].map(step => {
    const item = document.createElement('li');
    item.textContent = step.text;
    return { ...step, item, met: false };
  });
  element('tutorial-steps').replaceChildren(...steps.map(step => step.item));

  function update() {
    const box = element('tutorial'),
      active = ctx.state.active;
    box.hidden = !active || !enabled;
    if (!active || !enabled) return;
    startYaw ??= ctx.camera.yaw;
    for (const step of steps)
      if (!step.met && step.done()) {
        step.met = true;
        step.item.classList.add('met');
        onStep();
      }
    if (steps.every(step => step.met) && !box.classList.contains('complete')) {
      box.classList.add('complete');
      try {
        localStorage.setItem(TUTORIAL_KEY, 'hecho');
      } catch {
        /* Storage is optional. */
      }
      setTimeout(() => {
        enabled = false;
        box.hidden = true;
      }, 2600);
    }
  }
  return { update };
}
