import type { ClassDefinition, ClassId } from './class-definition.ts';
import { WARRIOR } from './classes/warrior.ts';
import { ARCHER } from './classes/archer.ts';
import { MAGE } from './classes/mage.ts';

/** Planned IDs are not playable until their data, runtime and view exist. */
export const CLASSES: Readonly<Partial<Record<ClassId, ClassDefinition>>> = Object.freeze({ warrior: WARRIOR, mage: MAGE, archer: ARCHER });
export function classDefinition(id: ClassId): ClassDefinition {
  const definition = Object.hasOwn(CLASSES, id) ? CLASSES[id] : undefined;
  if (!definition) throw new Error(`Clase todavía no implementada: ${id}`);
  return definition;
}
