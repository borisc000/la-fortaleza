import { RangedArsenal } from './classes/ranged-arsenal.ts';
import { WarriorArsenal } from './classes/warrior-arsenal.ts';
import type { Progression } from './progression.ts';
import type { Combat } from './combat.ts';
import { hasRelic } from '../content/relics.ts';

export function syncLoadout(progression: Progression, combat: Combat) {
  const heart = hasRelic(progression.relics, 'relic_heart') && !hasRelic(combat.relics, 'relic_heart');
  combat.damageMultiplier = progression.damageMultiplier;
  combat.loadout = progression.loadout;
  combat.techniques = progression.development ? {} : progression.techniques;
  if (progression.development && (combat.heroKit instanceof WarriorArsenal || combat.heroKit instanceof RangedArsenal)) { combat.heroKit.abilities = progression.development.book.snapshot; combat.heroKit.stats = progression.development.ranks(progression); }
  combat.relics = progression.relics;
  if (heart) combat.increaseMaxHp(25);
}
