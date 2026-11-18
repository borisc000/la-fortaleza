import type { ClassDefinition } from './content/class-definition.ts';
import type { createHeroView } from './rendering/hero.ts';

export type AnimationMode = 'rest' | 'walk' | 'attack' | 'cast' | 'hit' | 'fade';
export const FRAME_STEP = 1 / 60;

/** Fixed-step replay makes a paused frame reproducible when scrubbing backwards. */
export function createModelAnimation(view: ReturnType<typeof createHeroView>, definition: ClassDefinition) {
  let mode: AnimationMode | undefined;
  let frame = -1;
  function duration(next: AnimationMode) {
    if (next === 'attack') return definition.basic.duration + .5;
    if (next === 'hit') return 1;
    if (next === 'fade') return 1.5;
    return 3;
  }
  function sample(next: AnimationMode, time: number, dt: number) {
    view.walk(dt, next === 'walk' ? 3 : 0);
    const age = next === 'attack' && time <= definition.basic.duration ? time : undefined;
    const casting = next === 'cast' && time >= .3 && time < 2.2;
    const flash = next === 'hit' ? Math.max(0, 1 - time / .3) : 0;
    view.combatPose(age, flash, casting);
    view.fade(next === 'fade' ? Math.max(0, 1 - time / 1.2) : 1);
  }
  return {
    duration,
    seek(next: AnimationMode, time: number) {
      const target = Math.floor(Math.max(0, Math.min(duration(next), time)) / FRAME_STEP + 1e-7);
      if (next !== mode || target < frame) {
        view.resetPose();
        mode = next;
        frame = -1;
      }
      while (frame < target) {
        frame++;
        sample(next, frame * FRAME_STEP, frame === 0 ? 0 : FRAME_STEP);
      }
    },
  };
}
