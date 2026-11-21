import type * as THREE from 'three';
import type { ClassDefinition } from '../content/class-definition.ts';
import { createArcherArrowView } from './archer-arrows.ts';
import { createCombatView } from './combat.ts';
import { createElementView } from './elements.ts';
import { createEssenceView } from './essence.ts';
import { createExplorationView } from './exploration.ts';
import { createMageSpellView } from './mage-spells.ts';
import { createProjectileView } from './projectiles.ts';
import { createRangedArsenalView } from './ranged-arsenal.ts';
import { createWarriorArsenalView } from './warrior-arsenal.ts';

export function createExpeditionViews(scene: THREE.Scene, definition: ClassDefinition) {
  let combat = createCombatView(scene, definition);
  const layers = {
    mageSpells: createMageSpellView(scene),
    archerArrows: createArcherArrowView(scene),
    essence: createEssenceView(scene),
    elements: createElementView(scene),
    ranged: createRangedArsenalView(scene),
    arsenal: createWarriorArsenalView(scene),
    projectiles: createProjectileView(scene),
    exploration: createExplorationView(scene),
  };
  return {
    ...layers,
    get combat() {
      return combat;
    },
    replaceCombat(next: ClassDefinition) {
      combat.dispose();
      combat = createCombatView(scene, next);
    },
    reset() {
      combat.reset();
      for (const layer of Object.values(layers)) layer.reset();
    },
    dispose() {
      combat.dispose();
      for (const layer of Object.values(layers)) layer.dispose();
    },
  };
}
