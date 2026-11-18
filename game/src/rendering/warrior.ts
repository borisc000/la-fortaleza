import { createWarriorAsset } from './warrior-asset.ts';
import { createWarrior as organicWarrior } from './organic-warrior.ts';
import { WARRIOR } from '../content/classes/warrior.ts';
import type { BasicAttackDefinition } from '../content/class-definition.ts';

export function createWarrior(basic: BasicAttackDefinition = WARRIOR.basic) {
  return createWarriorAsset(basic) ?? organicWarrior(basic);
}
