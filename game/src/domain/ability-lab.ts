import { ABILITY_CATALOG, BRANCHES, type Branch, type PlayableClass } from '../content/ability-schema.ts';
import type { Element } from '../content/elements.ts';
import { AbilityBook } from './ability-book.ts';
import { Combat } from './combat.ts';
import { classRuntime } from './classes.ts';
import { WarriorArsenal } from './classes/warrior-arsenal.ts';
import { RangedArsenal } from './classes/ranged-arsenal.ts';

export type TrialConfig = {
  abilityId: string;
  testGuardHits?: boolean;
  testStakeCrossing?: boolean;
  level: number;
  focus: Branch;
  mutation: 0 | 1;
  finisher: 0 | 1;
  element: Element;
};
export const TRIAL_DURATION = 12;
export const TRIAL_STEP = 1 / 60;
const bounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };

/** Build only through legal progression choices, keeping levels 5 and 10 distinct. */
export function trialBuild(config: TrialConfig) {
  const definition = ABILITY_CATALOG.find(a => a.id === config.abilityId);
  if (
    !definition ||
    !Number.isInteger(config.level) ||
    config.level < 1 ||
    config.level > 10 ||
    !BRANCHES.includes(config.focus)
  )
    throw Error('Configuración de habilidad inválida');
  const book = new AbilityBook(definition.classId);
  if (!book.snapshot.some(s => s.id === definition.id)) book.apply(book.revision, { id: definition.id, kind: 'learn' });
  while (book.snapshot.find(s => s.id === definition.id)!.level < config.level) {
    const options = book.options().filter(o => o.id === definition.id);
    const chosen =
      options.find(o => o.kind === 'branch' && o.branch === config.focus) ??
      options.find(
        o =>
          (o.kind === 'mutation' && o.option === config.mutation) ||
          (o.kind === 'finisher' && o.option === config.finisher),
      ) ??
      options[0];
    if (!chosen || !book.apply(book.revision, chosen)) throw Error('No se pudo construir esta mejora');
  }
  const basic = ABILITY_CATALOG.find(a => a.classId === definition.classId && a.kind === 'basic')!;
  return {
    definition,
    state: book.snapshot.find(s => s.id === definition.id)!,
    abilities: book.snapshot.filter(s => s.id === definition.id || s.id === basic.id),
  };
}

/** Isolated combat fixture. It never touches a Run, saved progression or the campaign. */
export function createAbilityTrial(config: TrialConfig) {
  const build = trialBuild(config),
    classId: PlayableClass = build.definition.classId;
  const kit = classId === 'warrior' ? new WarriorArsenal(bounds) : new RangedArsenal(classId, bounds);
  kit.abilities = build.abilities;
  const combat = new Combat(bounds, [], [], false, { ...classRuntime(classId), createKit: () => kit });
  const hero = { x: 0, z: 0, yaw: 0 };
  const crossing = config.abilityId === 'archer:stakes' && config.testStakeCrossing;
  // Close targets expose melee/orbits; the row and flank expose penetration and ricochets.
  combat.addEnemies([
    { x: 0, z: -1.7 },
    { x: -1.6, z: -0.8 },
    { x: 1.6, z: -0.8 },
    { x: crossing ? 0.72 : 0, z: -4 },
    { x: 0, z: -6.3 },
    { x: 2, z: -4 },
  ]);
  for (const enemy of combat.enemies) {
    enemy.stationary = true;
    enemy.hp = enemy.maxHp = 1_000_000;
    enemy.armor = 0;
  }
  if (config.abilityId === 'warrior:retaliation' && config.testGuardHits) combat.enemies[0].stationary = false;
  if (crossing) combat.enemies[3].stationary = false;
  combat.loadout = { element: config.element, rank: 1, mastery: false };
  const basicEnabled =
    build.definition.kind === 'basic' ||
    ['mage:mirror', 'archer:hunting-beacon', 'warrior:war-banner'].includes(config.abilityId);
  let hits = 0,
    damage = 0;
  return {
    combat,
    kit,
    hero,
    build,
    basicEnabled,
    get hits() {
      return hits;
    },
    get damage() {
      return damage;
    },
    step() {
      if (!basicEnabled) kit.state.cooldown = 1000;
      combat.step(TRIAL_STEP, hero);
      const events = combat.takeEvents();
      for (const event of events)
        if (event.type === 'hit' && event.target > 0) {
          hits++;
          damage += event.amount;
        }
      // Preserve status effects and displacements, but allow unlimited repeated damage tests.
      for (const enemy of combat.enemies) enemy.hp = enemy.maxHp;
      return events;
    },
  };
}
