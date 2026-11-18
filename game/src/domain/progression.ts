import { hordeThreshold } from '../content/progression.ts';
import { AbilityDevelopment } from './ability-development.ts';
import type { DevelopmentOption } from './ability-development.ts';
import { GENERAL_STATS } from '../content/warrior-abilities.ts';
import { PROGRESSION, UPGRADES, UPGRADE_IDS } from '../content/progression.ts';
import type { UpgradeId } from '../content/progression.ts';
import type { CombatEvent } from './combat.ts';
import type { Point, Solid } from './movement.ts';
import { clearPath } from './navigation.ts';
import type { ClassDefinition } from '../content/class-definition.ts';
import { WARRIOR } from '../content/classes/warrior.ts';
import { classAffinity } from '../content/class-definition.ts';
import { ELEMENTS, isElement } from '../content/elements.ts';
import type { Element } from '../content/elements.ts';

import { TECHNIQUES, TECHNIQUE_SLOTS, TECHNIQUE_LEVELS, classTechniques, isTechnique } from '../content/techniques.ts';
import type { TechniqueId, TechniqueRanks } from '../content/techniques.ts';

import { RELICS, RELIC_IDS, RELIC_SLOTS, isRelic, hasRelic } from '../content/relics.ts';
import type { RelicId } from '../content/relics.ts';
export type SecondaryOption = `secondary_${Element}`;
export function secondaryElement(id: string): Element | undefined { const value = id.startsWith('secondary_') ? id.slice(10) : ''; return isElement(value) ? value : undefined; }
export function isSecondaryOption(id: string): id is SecondaryOption { return secondaryElement(id) !== undefined; }
export const SECONDARY_DESCRIPTIONS = { fire: 'Quemadura de apoyo durante 3 s: 3/4/5 % del daño del impacto por segundo.', water: 'Añade Empapado: ralentiza un 15 % durante 0,8/1,2/1,6 s.', earth: 'Añade Quebranto durante 0,8/1,2/1,6 s: +15 % de daño posterior.', air: 'Tus ataques básicos empujan 0,1/0,16/0,22 m; respeta resistencias y muros.' };

export type Essence = Point & { id: number; value: number; core?: boolean };
export type ChoiceOption = DevelopmentOption | UpgradeId | Element | TechniqueId | RelicId | SecondaryOption | 'secondary-affinity' | 'salvage' | 'affinity' | 'mastery';
export type Choice = { id: number; level: number; kind: 'element' | 'upgrade' | 'mastery' | 'relic'; source?: string; options: ChoiceOption[] };
export class Progression {
  readonly definition: ClassDefinition;
  readonly development?: AbilityDevelopment;
  constructor(definition: ClassDefinition = WARRIOR, initialElement?: Element, modern = false, seed = 1) {
    this.definition = definition;
    if (modern && ['warrior', 'mage', 'archer'].includes(definition.id)) this.development = new AbilityDevelopment(seed, definition.id as 'warrior' | 'mage' | 'archer');
    if (definition.id === 'mage') {
      if (!initialElement || !isElement(initialElement) || !definition.affinities[initialElement]) throw new Error('El Mago requiere una afinidad válida antes de comenzar.');
      this.element = initialElement; this.affinityRank = 1;
    }
  }
  upgradeMax(id: UpgradeId) { return this.development ? 4 : UPGRADES[id].maxRank; }
  vitalityAmount() { return this.development ? 15 : 20; }
  upgradeDescription(id: UpgradeId) {
    if (this.development) return GENERAL_STATS[id][1];
    if (id === 'damage') return `+10 % de daño base a ${this.definition.weapon.name.toLowerCase()} y ${this.definition.skill.name}.`;
    if (id === 'speed') return `+0,5 m/s al caminar, hasta un máximo de ${String(this.definition.movement.maxSpeed).replace('.', ',')} m/s.`;
    return UPGRADES[id].description;
  }
  level = 1;
  xp = 0;
  totalEssence = 0;
  element?: Element;
  affinityRank = 0;
  secondaryElement?: Element;
  secondaryRank = 0;
  private equippedRelics: RelicId[] = [];
  get relics(): readonly RelicId[] { return Object.freeze([...this.equippedRelics]); }
  private relicRewards: Array<{ id: number; source: string; options: RelicId[]; coins: number }> = [];
  private creditedRewards = new Set<string>();
  relicReason(id: RelicId) {
    if (!isRelic(id)) return 'Reliquia desconocida';
    if (this.stopped) return 'Expedición terminada';
    if (this.equippedRelics.includes(id)) return 'Ya equipada';
    if (this.equippedRelics.length >= RELIC_SLOTS) return 'Cuatro espacios ocupados';
    const item = RELICS[id];
    if (item.element && item.element !== this.element && item.element !== this.secondaryElement) return `Requiere ${ELEMENTS[item.element].name}`;
    if (item.mode === 'pure' && (!this.element || this.secondaryElement)) return 'Requiere una única afinidad';
    if (item.mode === 'dual' && !this.secondaryElement) return 'Requiere dos afinidades';
    return '';
  }
  equipRelic(id: RelicId) { if (this.pending || this.relicReason(id)) return false; this.equippedRelics.push(id); return true; }
  offerRelics(key: string, source: string, seed: number, coins: number) {
    if (this.stopped || this.creditedRewards.has(key)) return false;
    this.creditedRewards.add(key); const offset = (seed >>> 0) % RELIC_IDS.length;
    const options = [...RELIC_IDS.slice(offset), ...RELIC_IDS.slice(0, offset)].filter(id => !this.relicReason(id)).slice(0, 3);
    this.relicRewards.push({ id: ++this.sequence, source, options, coins }); return true;
  }
  get salvageCoins() { return this.relicRewards[0]?.coins ?? 0; }
  core = false;
  mastery = false;
  private masteryChoice?: number;
  private techniqueRanks: Partial<Record<TechniqueId, number>> = {};
  get techniques(): TechniqueRanks { return Object.freeze({ ...this.techniqueRanks }); }
  get equippedTechniques() { return Object.keys(this.techniqueRanks) as TechniqueId[]; }
  techniqueOptions(level: number) {
    if (this.development) return [];
    return classTechniques(this.definition.id).filter(id => { const rank = this.techniqueRanks[id] ?? 0; return rank < 3 && level >= TECHNIQUE_LEVELS[rank] && (rank > 0 || this.equippedTechniques.length < TECHNIQUE_SLOTS); });
  }
  ranks: Record<UpgradeId, number> = { damage: 0, vitality: 0, speed: 0, collection: 0 };
  readonly drops: Essence[] = [];
  private queue: Array<{ id: number; level: number }> = [];
  private credited = new Set<number>();
  private sequence = 0;
  private stopped = false;
  get threshold() { return this.development ? hordeThreshold(this.level) : 4 + 2 * (this.level - 1); }
  get pending() { return this.queue.length + this.relicRewards.length + (this.masteryChoice === undefined ? 0 : 1); }
  get loadout() { return { element: this.element, rank: this.affinityRank, mastery: this.mastery, ...(this.secondaryElement ? { secondary: Object.freeze({ element: this.secondaryElement, rank: this.secondaryRank }) } : {}), ...(this.equippedRelics.length ? { relics: this.relics } : {}) }; }
  grantCore() { if (!this.stopped && !this.mastery) { this.core = true; this.checkMastery(); } }
  private checkMastery() { if (this.core && this.affinityRank === 3 && !this.mastery && this.masteryChoice === undefined) this.masteryChoice = ++this.sequence; }
  option(id: ChoiceOption) {
    if (id.startsWith('ability:') || id.startsWith('stat:')) return this.development!.describe(id as DevelopmentOption, this);
    const legacyId = id as Exclude<ChoiceOption, DevelopmentOption>;
    if (isRelic(id)) return { name: RELICS[id].name, description: RELICS[id].description, symbol: '◈', rank: `Reliquia · espacio ${this.equippedRelics.length + 1}/4` };
    if (id === 'salvage') return { name: 'Tomar monedas', description: `Recibe ${this.salvageCoins} monedas en lugar de una reliquia.`, symbol: '◉', rank: 'No ocupa un espacio' };
    if (isSecondaryOption(id)) { const second = secondaryElement(id)!; return { name: `Añadir ${ELEMENTS[second].name}`, description: `${SECONDARY_DESCRIPTIONS[second]} Conservas el kit y la única maestría de ${ELEMENTS[this.element!].name}.${this.element === 'fire' ? ' Su quemadura pasa al 70 % de potencia.' : ''}`, symbol: ELEMENTS[second].symbol, rank: 'Segunda afinidad I · máximo dos' }; }
    if (id === 'secondary-affinity') return { name: `${ELEMENTS[this.secondaryElement!].name} de apoyo`, description: SECONDARY_DESCRIPTIONS[this.secondaryElement!], symbol: ELEMENTS[this.secondaryElement!].symbol, rank: `Afinidad secundaria ${this.secondaryRank} → ${this.secondaryRank + 1}/3` };
    if (isTechnique(id)) { const t = TECHNIQUES[id], rank = this.techniqueRanks[id] ?? 0; return { name: t.name, description: t.descriptions[Math.min(2, rank)], symbol: t.symbol, rank: rank ? `Técnica ${rank} → ${rank + 1} / 3 · mismo espacio` : `Aprender I · espacio ${this.equippedTechniques.length + 1}/${TECHNIQUE_SLOTS}` }; }
    if (isElement(id)) return { name: ELEMENTS[id].name, description: classAffinity(this.definition, id).description, symbol: ELEMENTS[id].symbol, rank: 'Afinidad principal I · define tu maestría' };
    if (id === 'affinity') return { name: `Afinidad de ${ELEMENTS[this.element!].name}`, description: classAffinity(this.definition, this.element!).upgradeDescription, symbol: ELEMENTS[this.element!].symbol, rank: `Rango ${this.affinityRank} → ${this.affinityRank + 1} / 3` };
    if (id === 'mastery') return { name: classAffinity(this.definition, this.element!).mastery, description: classAffinity(this.definition, this.element!).masteryDescription, symbol: '✧', rank: 'Consume un núcleo · no consume nivel' };
    const general = legacyId as UpgradeId;
    return { ...UPGRADES[general], name: this.development ? GENERAL_STATS[general][0] : UPGRADES[general].name, description: this.upgradeDescription(general), rank: `Rango ${this.ranks[general]} → ${this.ranks[general] + 1} / ${this.upgradeMax(general)}` };
  }
  get damageMultiplier() { return 1 + this.ranks.damage * (this.development ? .08 : UPGRADES.damage.amount) + (hasRelic(this.equippedRelics, 'relic_edge') ? .12 : 0) + (hasRelic(this.equippedRelics, 'relic_solitude') ? .15 : 0) + (hasRelic(this.equippedRelics, 'relic_concord') ? .12 : 0); }
  get speed() { return Math.min(this.definition.movement.maxSpeed, this.definition.movement.speed + this.ranks.speed * (this.development ? .3 : UPGRADES.speed.amount) + (hasRelic(this.equippedRelics, 'relic_boots') ? .4 : 0) + (hasRelic(this.equippedRelics, 'relic_wind') ? .5 : 0)); }
  get absorbRadius() { return PROGRESSION.absorb + this.ranks.collection * (this.development ? .4 : UPGRADES.collection.amount) + (hasRelic(this.equippedRelics, 'relic_magnet') ? .8 : 0); }
  get attractRadius() { return PROGRESSION.attract + this.ranks.collection * (this.development ? .4 : UPGRADES.collection.amount) + (hasRelic(this.equippedRelics, 'relic_magnet') ? .8 : 0); }
  receive(events: readonly CombatEvent[]) {
    if (this.stopped) return;
    for (const event of events) if (event.type === 'death' && event.target > 0 && !this.credited.has(event.target)) {
      this.credited.add(event.target);
      if ((event.reward ?? 1) > 0 || event.core) this.drops.push({ id: event.target, x: event.x, z: event.z, value: event.reward ?? 1, core: event.core });
    }
  }
  gain(amount: number) {
    if (this.stopped || !Number.isFinite(amount) || amount <= 0) return;
    this.xp += amount; this.totalEssence += amount;
    while (this.xp >= this.threshold) {
      this.xp -= this.threshold; this.level++;
      this.queue.push({ id: ++this.sequence, level: this.level });
    }
  }
  step(dt: number, hero: Point, solids: readonly Solid[]) {
    if (this.stopped || dt <= 0) return;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i], dx = hero.x - drop.x, dz = hero.z - drop.z, distance = Math.hypot(dx, dz);
      if (!clearPath(drop, hero, solids, .025)) continue;
      if (distance <= this.absorbRadius) { this.drops.splice(i, 1); this.gain(drop.value); if (drop.core) this.grantCore(); }
      else if (distance <= this.attractRadius) {
        const move = Math.min(distance, PROGRESSION.attractionSpeed * dt);
        drop.x += dx / distance * move; drop.z += dz / distance * move;
        if (distance - move <= this.absorbRadius) { this.drops.splice(i, 1); this.gain(drop.value); if (drop.core) this.grantCore(); }
      }
    }
  }
  choice(): Choice | undefined {
    if (this.stopped) return undefined;
    if (this.masteryChoice !== undefined) return { id: this.masteryChoice, level: this.level, kind: 'mastery', options: ['mastery'] };
    const reward = this.relicRewards[0];
    if (reward) return { id: reward.id, level: this.level, kind: 'relic', source: reward.source, options: [...reward.options.filter(id => !this.relicReason(id)), 'salvage'] };
    const next = this.queue[0]; if (!next || this.stopped) return undefined;
    if (!this.element) return { ...next, kind: 'element', options: (Object.keys(ELEMENTS) as Element[]).filter(element => !!this.definition.affinities[element]) };
    if (this.development) return { ...next, kind: 'upgrade', options: this.development.options(next.level, this) };
    const eligible = UPGRADE_IDS.filter(id => this.ranks[id] < UPGRADES[id].maxRank);
    const offset = eligible.length ? (next.level - 2) % eligible.length : 0;
    const general = [...eligible.slice(offset), ...eligible.slice(0, offset)];
    const available = this.techniqueOptions(next.level), catalog = classTechniques(this.definition.id);
    const start = Math.max(0, next.level - 3) % catalog.length;
    const ordered = [...catalog.slice(start), ...catalog.slice(0, start)].filter(id => available.includes(id));
    const options: ChoiceOption[] = this.affinityRank < 3 ? ['affinity', ...general.slice(0, ordered.length ? 1 : 2)] : general.slice(0, ordered.length ? 2 : 3);
    for (const id of ordered) if (options.length < 3) options.push(id);
    if (next.level >= 5 && next.level % 2 === 1) {
      const others = (Object.keys(ELEMENTS) as Element[]).filter(e => e !== this.element && !!this.definition.affinities[e]);
      const second: ChoiceOption | undefined = this.secondaryElement ? this.secondaryRank < 3 ? 'secondary-affinity' : undefined : hasRelic(this.equippedRelics, 'relic_solitude') ? undefined : `secondary_${others[Math.floor((next.level - 5) / 2) % others.length]}`;
      if (second) { const replace = options.findIndex(id => UPGRADE_IDS.includes(id as UpgradeId)); if (options.length < 3) options.push(second); else if (replace >= 0) options[replace] = second; }
    }
    return { ...next, kind: 'upgrade', options };
  }
  choose(choiceId: number, upgradeId: ChoiceOption): boolean {
    const next = this.choice();
    if (!next || next.id !== choiceId || !next.options.includes(upgradeId)) return false;
    if (idIsDevelopment(upgradeId)) { if (!this.development?.apply(upgradeId, this)) return false; this.development.commit(); this.queue.shift(); return true; }
    if (next.kind === 'upgrade' && this.development) this.development.commit();
    if (next.kind === 'relic') { if (isRelic(upgradeId)) { if (this.relicReason(upgradeId)) return false; this.equippedRelics.push(upgradeId); } else if (upgradeId !== 'salvage') return false; this.relicRewards.shift(); return true; }
    if (isSecondaryOption(upgradeId)) { const second = secondaryElement(upgradeId)!; if (this.secondaryElement || second === this.element || hasRelic(this.equippedRelics, 'relic_solitude')) return false; this.secondaryElement = second; this.secondaryRank = 1; this.queue.shift(); return true; }
    if (upgradeId === 'secondary-affinity') { this.secondaryRank++; this.queue.shift(); return true; }
    if (upgradeId === 'salvage' || isRelic(upgradeId)) return false;
    if (upgradeId === 'mastery') { this.mastery = true; this.core = false; this.masteryChoice = undefined; return true; }
    if (isElement(upgradeId)) { this.element = upgradeId; this.affinityRank = 1; }
    else if (upgradeId === 'affinity') this.affinityRank++;
    else if (isTechnique(upgradeId)) this.techniqueRanks[upgradeId] = (this.techniqueRanks[upgradeId] ?? 0) + 1;
    else this.ranks[upgradeId as UpgradeId]++;
    this.queue.shift(); this.checkMastery(); return true;
  }
  fallback(choiceId: number): boolean {
    const next = this.choice(); if (!next || next.id !== choiceId || next.options.length) return false;
    this.development?.commit(); this.queue.shift(); return true;
  }
  grantUpgrade(id: UpgradeId): boolean {
    if (this.stopped || this.pending || !UPGRADE_IDS.includes(id) || this.ranks[id] >= this.upgradeMax(id)) return false;
    this.ranks[id]++; return true;
  }
  stop() { this.development?.stop(); this.stopped = true; this.relicRewards = []; this.queue = []; this.masteryChoice = undefined; this.drops.length = 0; }
}

function idIsDevelopment(id: ChoiceOption): id is DevelopmentOption { return id.startsWith('ability:') || id.startsWith('stat:'); }
