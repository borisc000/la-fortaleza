import { angleDelta } from '../domain/movement.ts';
import type { UiContext } from './context.ts';
import { element } from './dom.ts';

const TUTORIAL_KEY = 'fortaleza.primeros-pasos';

/** Shows one current hint. Reaching a later milestone also counts toward the tutorial. */
export function createTutorial(ctx: UiContext, onStep: () => void) {
  let enabled = true,
    startYaw: number | undefined;
  try {
    enabled = localStorage.getItem(TUTORIAL_KEY) !== 'hecho';
  } catch {
    /* Storage is optional. */
  }
  const touch = matchMedia('(pointer: coarse)');
  const box = element('tutorial');
  const message = element('tutorial-step');
  const steps = [
    {
      text: 'Camina con WASD',
      touch: 'Toca y arrastra en el lado izquierdo para caminar',
      done: () => Math.hypot(ctx.body.x - ctx.run.layout.start.x, ctx.body.z - ctx.run.layout.start.z) > 3,
    },
    {
      text: 'Mira con el ratón · rueda para el zoom',
      touch: 'Arrastra en el lado derecho para mirar',
      done: () => startYaw !== undefined && Math.abs(angleDelta(startYaw, ctx.camera.yaw)) > 0.35,
    },
    { text: 'Acércate a un enemigo: atacas solo', done: () => ctx.run.combat.kills > 0 },
    { text: 'Recoge la esencia que dejan', done: () => ctx.run.progression.totalEssence > 0 },
    {
      text: 'Pulsa E junto a un cofre o al mercader',
      touch: 'Toca el botón que aparece junto a un cofre o al mercader',
      done: () => ctx.run.exploration.chestsOpened > 0 || ctx.run.shop.isOpen || ctx.run.shop.purchases > 0,
    },
  ].map(step => ({ ...step, met: false }));

  function update() {
    const active = ctx.state.active;
    box.hidden = !active || !enabled;
    if (!active || !enabled) return;
    startYaw ??= ctx.camera.yaw;
    let advanced = false;
    for (const step of steps)
      if (!step.met && step.done()) {
        step.met = true;
        advanced = true;
      }
    if (advanced) onStep();
    const next = steps.find(step => !step.met);
    if (next) {
      const text = (touch.matches && next.touch) || next.text;
      if (message.textContent !== text) message.textContent = text;
      return;
    }
    enabled = false;
    box.hidden = true;
    try {
      localStorage.setItem(TUTORIAL_KEY, 'hecho');
    } catch {
      /* Storage is optional. */
    }
  }
  return { update };
}
