import type { TechniqueRanks } from '../content/techniques.ts';
import type { ClassDefinition } from '../content/class-definition.ts';
import type { ElementalLoadout } from '../content/elements.ts';
import type { Attack, Enemy, CombatEvent, CombatSource } from './combat.ts';
import type { Body, Bounds, Point, Solid } from './movement.ts';
import type { ElementalDamage, ElementalVisual } from './effect-types.ts';

export type HeroHit = {
  target: Enemy | undefined;
  amount: number;
  source: CombatSource;
  attackId: number;
  loadout?: ElementalLoadout;
  armorIgnore?: number;
  exposeDuration?: number;
  origin?: Point;
};
export type AreaAction = {
  id: number;
  age: number;
  pulses: number;
  yaw: number;
  duration: number;
  radius: number;
  maxPulses: number;
  loadout: ElementalLoadout;
  center?: Point;
  multiplier?: number;
};
export type HeroProjectile = Point & {
  id: number;
  previous: Point;
  vx: number;
  vz: number;
  age: number;
  damage: number;
  empowered: boolean;
  loadout: ElementalLoadout;
  delay?: number;
  echo?: boolean;
  burstRadius?: number;
};
export type HeroKitState = {
  attack?: Attack;
  cooldown: number;
  targetId?: number;
  passiveStacks: number;
  passiveRemaining: number;
  area?: AreaAction;
  skillCooldown: number;
  projectiles?: HeroProjectile[];
  barrier?: { amount: number; remaining: number };
  barrierCooldown?: number;
};
export type HeroKitContext = {
  hero: Body;
  alive: readonly Enemy[];
  solids: readonly Solid[];
  damageMultiplier: number;
  loadout: ElementalLoadout;
  techniques?: TechniqueRanks;
  nextId(): number;
  emit(
    type: CombatEvent['type'],
    target: number,
    amount: number,
    position: Point,
    source?: CombatSource,
    attackId?: number,
  ): void;
};
/** The kit proposes hits; Combat alone applies armor, damage, death and rewards. */
export interface HeroKit {
  readonly state: HeroKitState;
  advance(dt: number): void;
  act(context: HeroKitContext): HeroHit[];
  finishStep(): void;
  cancel(): void;
}
export interface ClassEffects {
  update(dt: number, enemies: readonly Enemy[]): ElementalDamage[];
  direct(
    target: Enemy,
    source: CombatSource,
    rawDamage: number,
    attackId: number,
    hero: Point,
    enemies: readonly Enemy[],
    loadout: ElementalLoadout,
    protectedHero?: Point,
  ): { hits: ElementalDamage[]; visuals: ElementalVisual[] };
  explosions(
    dying: readonly Enemy[],
    enemies: readonly Enemy[],
    killers: ReadonlyMap<number, CombatSource>,
    loadout: ElementalLoadout,
  ): { hits: ElementalDamage[]; visuals: ElementalVisual[] };
  cleanup(enemies: readonly Enemy[]): void;
}
export type ClassRuntime = Readonly<{
  definition: ClassDefinition;
  createKit(): HeroKit;
  createEffects(bounds: Bounds, solids: readonly Solid[]): ClassEffects;
}>;
