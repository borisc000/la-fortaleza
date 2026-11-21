import type { ClassDefinition } from '../content/class-definition.ts';
import { createWarrior } from './warrior.ts';
import { createMage } from './mage.ts';
import { createArcher } from './archer.ts';

import { WHIRLWIND } from '../content/combat.ts';
import type { Combat } from '../domain/combat.ts';
import { WarriorArsenal } from '../domain/classes/warrior-arsenal.ts';
import { RangedArsenal } from '../domain/classes/ranged-arsenal.ts';

/** Keep model-specific animation out of world construction. */
export function createHeroView(definition: ClassDefinition) {
  if (definition.id === 'warrior') return createWarrior(definition.basic);
  if (definition.id === 'mage') return createMage();
  if (definition.id === 'archer') return createArcher();
  throw new Error(`Falta la representación de la clase: ${definition.id}`);
}

export function heroFacing(combat: Combat, movementYaw: number) {
  const { beamYaw, siegePose, area, attack } = combat.heroKit.state;
  if (beamYaw !== undefined) return beamYaw;
  if (siegePose) return siegePose.yaw;
  if (area && combat.definition.id === 'warrior') return area.yaw - (area.age / WHIRLWIND.interval) * Math.PI * 2;
  return attack?.yaw ?? area?.yaw ?? movementYaw;
}

export function playCombatPose(hero: ReturnType<typeof createHeroView>, combat: Combat, flash: number) {
  const kit = combat.heroKit;
  let fanAge: number | undefined;
  if (combat.definition.id === 'archer' && kit instanceof RangedArsenal && !kit.state.siegePose) {
    const id = 'archer:fan-volley';
    const remaining = kit.clock.remaining(id);
    if (remaining > 0 && remaining <= 0.35) {
      const cast = kit.clock.active.find(a => a.ability.id === id);
      if (cast) {
        const age = cast.activeSeconds - remaining;
        fanAge = cast.ability.finisher === 0 && age >= 0.3 ? age - 0.3 : age;
      }
    }
  }
  hero.combatPose(
    combat.attack?.age,
    flash,
    !!combat.whirlwind || kit.state.beamYaw !== undefined,
    combat.impetusStacks,
    kit.state.siegePose?.age,
    combat.attack?.swordStroke,
    fanAge,
  );
  if (kit instanceof WarriorArsenal && 'pullChain' in hero && typeof hero.pullChain === 'function') {
    const chain = kit.presentation.find(v => v.kind === 'chain');
    if (chain) hero.pullChain(chain.phase ?? 0);
  }
}
