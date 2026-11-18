import type { ClassId } from '../content/class-definition.ts';
import { classDefinition } from '../content/classes.ts';
import { WARRIOR } from '../content/classes/warrior.ts';
import type { ClassRuntime } from './hero-kit.ts';
import { WarriorKit } from './classes/warrior-kit.ts';
import { WarriorEffects } from './classes/warrior-effects.ts';
import { MAGE } from '../content/classes/mage.ts';
import { MageKit } from './classes/mage-kit.ts';
import { MageEffects } from './classes/mage-effects.ts';
import { ARCHER } from '../content/classes/archer.ts';
import { ArcherKit } from './classes/archer-kit.ts';
import { ArcherEffects } from './classes/archer-effects.ts';

export const ARCHER_RUNTIME: ClassRuntime = Object.freeze({
  definition: ARCHER,
  createKit: () => new ArcherKit(),
  createEffects: (_bounds, solids) => new ArcherEffects(solids),
});

export const MAGE_RUNTIME: ClassRuntime = Object.freeze({
  definition: MAGE,
  createKit: () => new MageKit(),
  createEffects: (bounds, solids) => new MageEffects(bounds, solids),
});

export const WARRIOR_RUNTIME: ClassRuntime = Object.freeze({
  definition: WARRIOR,
  createKit: () => new WarriorKit(WARRIOR),
  createEffects: (bounds, solids) => new WarriorEffects(bounds, solids),
});
export function classRuntime(id: ClassId): ClassRuntime {
  classDefinition(id); // Do not silently turn an unavailable class into a Warrior.
  if (id === 'warrior') return WARRIOR_RUNTIME;
  if (id === 'mage') return MAGE_RUNTIME;
  if (id === 'archer') return ARCHER_RUNTIME;
  throw new Error(`Falta la implementaciÃ³n de la clase: ${id}`);
}
