import type { ClassDefinition } from '../content/class-definition.ts';
import { createWarrior } from './warrior.ts';
import { createMage } from './mage.ts';
import { createArcher } from './archer.ts';

/** Keep model-specific animation out of world construction. */
export function createHeroView(definition: ClassDefinition) {
  if (definition.id === 'warrior') return createWarrior(definition.basic);
  if (definition.id === 'mage') return createMage();
  if (definition.id === 'archer') return createArcher();
  throw new Error(`Falta la representación de la clase: ${definition.id}`);
}
