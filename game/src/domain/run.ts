import { RangedArsenal } from './classes/ranged-arsenal.ts';
import { WarriorArsenal } from './classes/warrior-arsenal.ts';
import { syncLoadout } from './loadout.ts';
import { Combat } from './combat.ts';
import { Progression } from './progression.ts';
import { Navigation } from './navigation.ts';
import { overlaps } from './movement.ts';
import type { Body, Bounds, Point, Solid } from './movement.ts';
import { SOLDIER } from '../content/combat.ts';
import { EXPEDITION, EXPEDITION_TITLES, OPENING_GUARD_OFFSETS } from '../content/expedition.ts';
import type { PlayableLayout } from '../content/expedition.ts';
import { PROGRESSION } from '../content/progression.ts';
import { CAMPAIGN, INCURSION_WARNING, LOCAL_HORDE, WAVES, incursionSchedule } from '../content/campaign.ts';
import { ENEMIES } from '../content/enemies.ts';
import type { ClassId, ClassDefinition } from '../content/class-definition.ts';
import { classRuntime } from './classes.ts';
import type { EnemyKind } from '../content/enemies.ts';
import type { ChoiceOption } from './progression.ts';
import { Exploration } from './exploration.ts';
import { Capture } from './capture.ts';
import { ExpeditionShop } from './shop.ts';
import { StoneHeartMission } from './stone-heart-mission.ts';
import { CAPTURE } from '../content/activities.ts';
import type { Element } from '../content/elements.ts';

export class Run {
  readonly combat: Combat;
  readonly progression: Progression;
  readonly definition: ClassDefinition;
  readonly seed: number;
  readonly exploration: Exploration;
  readonly capture: Capture;
  readonly shop: ExpeditionShop;
  readonly stoneHeart?: StoneHeartMission;
  readonly layout: PlayableLayout;
  phase: 'waves' | 'elite-gate' | 'arrival' | 'boss' = 'waves';
  wave = 1;
  totalSpawned: number;
  eliteSpawned = false;
  bossSpawned = false;
  bossArrivalAt = 0;
  private nextWaveAt = 3;
  private specialRetryAt = 0;
  private nextLocalCheck = 3;
  private lastNormalSpawn = 0;
  private readonly incursions: ReturnType<typeof incursionSchedule>;
  private incursionIndex = 0;
  private incursionSpawned = 0;
  private incursionRetryAt = 0;
  private distantSince = new Map<number, number>();
  private randomState: number;
  private navigations = new Map<number, Navigation>();
  readonly bounds: Bounds;
  private solids: readonly Solid[];
  constructor(
    bounds: Bounds,
    solids: readonly Solid[],
    seed = 1,
    classId: ClassId = 'warrior',
    initialElement?: Element,
    layout: PlayableLayout = EXPEDITION,
  ) {
    this.layout = layout;
    this.bounds = bounds;
    this.solids = solids;
    this.seed = seed >>> 0;
    this.randomState = this.seed;
    this.incursions = incursionSchedule(this.seed);
    this.shop = new ExpeditionShop(this.seed);
    const originalRuntime = classRuntime(classId);
    const runtime =
      classId === 'warrior'
        ? { ...originalRuntime, createKit: () => new WarriorArsenal(bounds) }
        : classId === 'mage' || classId === 'archer'
          ? { ...originalRuntime, createKit: () => new RangedArsenal(classId, bounds) }
          : originalRuntime;
    this.definition = runtime.definition;
    this.progression = new Progression(this.definition, initialElement, true, seed);
    const opening =
      'id' in layout
        ? []
        : OPENING_GUARD_OFFSETS.map(offset => ({ x: layout.start.x + offset.x, z: layout.start.z + offset.z }));
    this.totalSpawned = opening.length;
    if ('id' in layout) this.stoneHeart = new StoneHeartMission(solids);
    this.combat = new Combat(bounds, solids, opening, false, runtime);
    syncLoadout(this.progression, this.combat);
    this.exploration = new Exploration(bounds, solids, this.seed, this.definition.movement.radius, true, layout);
    this.capture = new Capture(
      this.exploration.objects.find(o => o.kind === 'capture'),
      solids,
    );
  }
  get expeditionId() {
    return 'id' in this.layout ? this.layout.id : 'exterior';
  }
  get title() {
    return EXPEDITION_TITLES[this.expeditionId];
  }
  get movementSolids() {
    return this.stoneHeart?.movementSolids ?? this.solids;
  }
  focus(hero: Point) {
    return this.stoneHeart?.focus(hero) ?? this.exploration.focus(hero);
  }
  get elite() {
    return this.combat.enemies.find(e => e.kind === 'elite' && !e.dead);
  }
  get boss() {
    return this.combat.enemies.find(e => e.kind === 'boss');
  }
  get hunter() {
    return this.combat.enemies.find(e => e.kind === 'hunter' && !e.dead);
  }
  get incursion() {
    const event = this.incursions[this.incursionIndex];
    const time = this.combat.time;
    return !this.stoneHeart &&
      this.phase === 'waves' &&
      time < CAMPAIGN.bossAt &&
      event &&
      time >= event.at - INCURSION_WARNING &&
      time < event.at + event.duration
      ? event
      : undefined;
  }
  get stage() {
    return [...WAVES].reverse().find(stage => this.combat.time >= stage.at)!;
  }
  get resting() {
    return this.phase === 'waves' && this.combat.time % 60 >= CAMPAIGN.restStart;
  }
  get objective() {
    if (this.stoneHeart) return this.stoneHeart.objective(this.combat);
    if (this.phase === 'elite-gate') return 'Derrota al Portador del núcleo para abrir paso al Castellano';
    if (this.phase === 'arrival')
      return `El Castellano se aproxima · ${Math.max(0, Math.ceil(CAMPAIGN.arrivalWarning - (this.combat.time - this.bossArrivalAt)))} s`;
    if (this.phase === 'boss') return 'Derrota al Castellano Vacío';
    const event = this.incursion;
    if (event) {
      const remaining = event.at - this.combat.time;
      if (remaining > 0) return `${event.title} en ${Math.ceil(remaining)} s · ${event.warning}`;
      if (event.kind === 'siege' || this.hunter) return `${event.title} · ${event.active}`;
    }
    if (this.elite) return 'El Portador ha llegado · derrótalo y recoge su núcleo';
    if (this.hunter) return 'Verdugo de la ronda · esquiva su carga hacia un lado';
    if (this.capture.pressure) return 'Puesto disputado · resiste dentro del círculo';
    return this.resting
      ? 'Breve respiro · recoge esencia y prepara tu configuración'
      : `${this.stage.label} · resiste hasta 6:00`;
  }
  private random() {
    this.randomState = (this.randomState + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.randomState ^ (this.randomState >>> 15), 1 | this.randomState);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  reinforcementPositions(
    hero: Point,
    count: number,
    radius: number = SOLDIER.radius,
    isVisible: (point: Point) => boolean = () => false,
  ): Point[] {
    // Spawn destinations must also be reachable by the hero collecting their loot.
    const clearance = Math.max(radius, this.definition.movement.radius);
    let navigation = this.navigations.get(clearance);
    if (!navigation) {
      navigation = new Navigation(this.bounds, this.solids, clearance);
      this.navigations.set(clearance, navigation);
    }
    navigation.update(hero);
    const candidates: Array<Point & { visible: boolean }> = [],
      offset = this.random() * Math.PI * 2;
    for (
      let distance: number = LOCAL_HORDE.minDistance;
      distance <= LOCAL_HORDE.maxDistance;
      distance += LOCAL_HORDE.ringStep
    )
      for (let angle = 4; angle < 32; angle++) {
        const a = (angle * Math.PI * 2) / 32 + offset;
        const p = { x: hero.x + Math.sin(a) * distance, z: hero.z + Math.cos(a) * distance },
          b = this.bounds;
        if (
          p.x < b.minX + clearance ||
          p.x > b.maxX - clearance ||
          p.z < b.minZ + clearance ||
          p.z > b.maxZ - clearance
        )
          continue;
        if (this.solids.some(s => overlaps(p, clearance + 0.1, s)) || !navigation.waypoint(p, hero)) continue;
        if (!this.exploration.allowsSpawn(p, radius)) continue;
        if (this.combat.enemies.some(e => !e.dead && Math.hypot(e.x - p.x, e.z - p.z) < e.radius + radius + 0.2))
          continue;
        candidates.push({ ...p, visible: isVisible(p) });
      }
    const result: Point[] = [];
    while (result.length < count && candidates.length) {
      let best = 0,
        bestScore = -Infinity;
      for (let i = 0; i < candidates.length; i++) {
        const value = score(candidates[i]);
        if (value > bestScore) {
          bestScore = value;
          best = i;
        }
      }
      const p = candidates.splice(best, 1)[0];
      if (result.every(other => Math.hypot(p.x - other.x, p.z - other.z) >= radius * 2 + 0.6))
        result.push({ x: p.x, z: p.z });
    }
    function score(p: Point & { visible: boolean }) {
      const distance = Math.hypot(p.x - hero.x, p.z - hero.z);
      return (
        (p.visible ? -100 : 0) +
        (result.length ? Math.min(12, ...result.map(o => Math.hypot(p.x - o.x, p.z - o.z))) : 0) -
        distance * 0.7
      );
    }
    return result;
  }
  private spawnSpecial(kind: 'elite' | 'boss', hero: Point, isVisible: (point: Point) => boolean) {
    if (this.combat.time < this.specialRetryAt) return false;
    const positions = this.reinforcementPositions(hero, 1, ENEMIES[kind].radius, isVisible);
    this.specialRetryAt = this.combat.time + 1;
    if (!positions.length) return false;
    this.combat.addEnemies(positions, kind === 'boss' ? CAMPAIGN.arrivalWarning : 3, kind);
    this.totalSpawned++;
    return true;
  }
  private advanceIncursion(hero: Point, isVisible: (point: Point) => boolean) {
    const time = this.combat.time;
    let event = this.incursions[this.incursionIndex];
    while (event && time >= event.at + event.duration) {
      this.incursionIndex++;
      this.incursionSpawned = 0;
      event = this.incursions[this.incursionIndex];
    }
    if (!event || time < event.at || time < this.incursionRetryAt || this.incursionSpawned >= event.enemies.length)
      return;
    this.incursionRetryAt = time + 1;
    const alive = this.combat.enemies.filter(enemy => !enemy.dead).length;
    const remaining = event.enemies.slice(this.incursionSpawned);
    const count = Math.min(remaining.length, CAMPAIGN.maxEnemies - 1 - alive);
    if (count <= 0) return;
    const clearance = Math.max(...remaining.map(kind => ENEMIES[kind].radius));
    const positions = this.reinforcementPositions(hero, count, clearance, isVisible);
    positions.forEach((point, index) => {
      this.combat.addEnemies([point], event.kind === 'hunt' ? 2.4 : CAMPAIGN.spawnWarning, remaining[index]);
    });
    this.incursionSpawned += positions.length;
    this.totalSpawned += positions.length;
  }
  private retireDistant(hero: Point, isVisible: (point: Point) => boolean) {
    const alive = new Set<number>();
    for (const enemy of this.combat.enemies) {
      if (enemy.dead || enemy.kind === 'elite' || enemy.kind === 'boss' || enemy.kind === 'hunter') continue;
      alive.add(enemy.id);
      if (Math.hypot(enemy.x - hero.x, enemy.z - hero.z) <= LOCAL_HORDE.retireDistance || isVisible(enemy)) {
        this.distantSince.delete(enemy.id);
        continue;
      }
      const since = this.distantSince.get(enemy.id);
      if (since === undefined) this.distantSince.set(enemy.id, this.combat.time);
      else if (this.combat.time - since >= LOCAL_HORDE.retireAfter) {
        this.combat.retireNormal(enemy);
        this.distantSince.delete(enemy.id);
      }
    }
    for (const id of this.distantSince.keys()) if (!alive.has(id)) this.distantSince.delete(id);
  }
  private useActivity(interactionId: number, hero: Point) {
    const focus = this.exploration.focus(hero);
    if (focus?.id === interactionId && focus.kind === 'shop') {
      this.shop.open();
      return true;
    }
    const object = this.exploration.objects.find(o => o.id === interactionId);
    if (!this.exploration.interact(interactionId, hero, this.combat) || object?.kind !== 'chest') return false;
    this.exploration.coins -= object.amount;
    this.progression.offerRelics(
      `chest:${object.id}`,
      this.stoneHeart ? 'Cofre de la armería' : 'Cofre de la fortaleza',
      this.seed + object.id * 37,
      object.amount,
    );
    this.exploration.announce('Cofre abierto · elige una reliquia o monedas');
    return true;
  }
  step(dt: number, hero: Body, isVisible: (point: Point) => boolean = () => false, interactionId?: number | 'beacon') {
    if (this.combat.status !== 'running' || this.progression.pending || this.shop.isOpen || dt <= 0) return [];
    this.combat.step(dt, hero);
    const events = this.combat.takeEvents();
    if (this.combat.hp <= 0) {
      this.progression.stop();
      this.exploration.stop();
      return events;
    }
    if (events.some(e => e.type === 'death' && e.enemyKind === 'boss')) {
      this.combat.complete();
      this.progression.stop();
      this.exploration.stop();
      return events;
    }
    this.exploration.receive(events);
    this.progression.receive(events);
    this.progression.step(dt, hero, this.solids);
    this.combat.pruneCorpses(CAMPAIGN.corpseSeconds);
    // Choices stop both the director and combat; no spawn backlog builds while choosing.
    if (this.progression.pending) return events;
    this.exploration.step(dt, hero, this.combat);
    if (this.stoneHeart) {
      this.stoneHeart.advance(this.combat, hero);
      this.wave = this.stoneHeart.wave;
      this.totalSpawned = this.stoneHeart.spawned;
      this.eliteSpawned ||= this.stoneHeart.phase === 'captain';
      if (interactionId === 'beacon' && this.stoneHeart.light(this.combat, hero)) {
        this.progression.stop();
        this.exploration.stop();
      } else if (typeof interactionId === 'number') this.useActivity(interactionId, hero);
      return events;
    }
    const time = this.combat.time;
    const captureEvent = this.capture.step(dt, hero, this.phase === 'waves' && time < CAMPAIGN.bossAt);
    if (captureEvent === 'completed') {
      this.exploration.coins += CAPTURE.reward;
      this.exploration.announce(`Puesto asegurado · +${CAPTURE.reward} monedas y elección de reliquia`);
      this.progression.offerRelics('capture', 'Puesto asegurado', this.seed + 97, 12);
    } else if (captureEvent === 'closed') this.exploration.announce('Captura cerrada · llega el Castellano');
    this.retireDistant(hero, isVisible);
    if (!this.eliteSpawned && time >= CAMPAIGN.eliteAt) this.eliteSpawned = this.spawnSpecial('elite', hero, isVisible);
    if (this.phase === 'waves' && time >= CAMPAIGN.bossAt) {
      this.combat.retireNormals();
      this.phase = 'elite-gate';
    }
    if (this.phase === 'waves') this.advanceIncursion(hero, isVisible);
    if (this.phase === 'elite-gate' && this.eliteSpawned && !this.elite) {
      this.combat.projectiles.clear();
      if (this.spawnSpecial('boss', hero, isVisible)) {
        this.bossSpawned = true;
        this.bossArrivalAt = time;
        this.phase = 'arrival';
      }
    }
    if (this.phase === 'arrival' && this.boss && this.boss.spawnRemaining <= 0) this.phase = 'boss';
    if (this.progression.pending) return events;
    // Final transition has priority even when E opens the merchant on this exact step.
    if (typeof interactionId === 'number' && this.useActivity(interactionId, hero)) return events;
    const checkLocal = time >= this.nextLocalCheck;
    if (checkLocal) this.nextLocalCheck = time + LOCAL_HORDE.checkInterval;
    const localCount = this.combat.enemies.filter(
      e => !e.dead && Math.hypot(e.x - hero.x, e.z - hero.z) <= LOCAL_HORDE.localRadius,
    ).length;
    const replenish =
      checkLocal && localCount < this.stage.localTarget && time - this.lastNormalSpawn >= LOCAL_HORDE.replenishInterval;
    // Capture shares this director, cooldown and population; never add an independent horde.
    const captureDue = checkLocal && this.capture.pressure && time - this.lastNormalSpawn >= CAPTURE.interval;
    if (this.phase === 'waves' && (time >= this.nextWaveAt || replenish || captureDue)) {
      if (this.resting && !this.capture.pressure) {
        this.nextWaveAt = (Math.floor(time / 60) + 1) * 60;
        return events;
      }
      const active = this.combat.enemies.filter(e => !e.dead).length;
      const incursion = this.incursions[this.incursionIndex];
      const reserve = (incursion?.enemies.length ?? 0) - this.incursionSpawned;
      const siege = incursion?.kind === 'siege' && time >= incursion.at;
      const normalRequested =
        time >= this.nextWaveAt ? this.stage.count : replenish ? this.stage.localTarget - localCount : 0;
      const requested = Math.max(normalRequested, captureDue ? CAPTURE.reinforcements : 0);
      const count = Math.min(
        this.stage.count,
        CAMPAIGN.maxEnemies - 1 - active - reserve,
        Math.max(0, this.stage.localTarget - localCount),
        requested,
      );
      if (count <= 0) {
        this.nextWaveAt = time + 2;
        return events;
      }
      const positions = this.reinforcementPositions(hero, count, SOLDIER.radius, isVisible);
      // Keep threats a minority even when replenishing tiny batches repeatedly.
      let archers = this.combat.enemies.filter(e => !e.dead && e.kind === 'archer').length;
      let chargers = this.combat.enemies.filter(e => !e.dead && e.kind === 'charger').length;
      const archerSlots = siege ? 3 : 1;
      const chargerSlots = siege ? 2 : 1;
      const archerLimit = Math.floor(this.stage.localTarget * (siege ? 0.16 : 0.08));
      const chargerLimit = Math.floor(this.stage.localTarget * (siege ? 0.1 : 0.06));
      positions.forEach((p, i) => {
        let kind: EnemyKind = 'thrall';
        if (i < archerSlots && this.stage.archers && archers < archerLimit) {
          kind = 'archer';
          archers++;
        } else if (
          i >= archerSlots &&
          i < archerSlots + chargerSlots &&
          this.stage.chargers &&
          chargers < chargerLimit
        ) {
          kind = 'charger';
          chargers++;
        } else if ((this.totalSpawned + i) % 8 === 0) kind = 'soldier';
        this.combat.addEnemies([p], CAMPAIGN.spawnWarning, kind);
      });
      if (positions.length) {
        this.wave++;
        this.totalSpawned += positions.length;
        this.lastNormalSpawn = time;
        this.nextWaveAt = time + (this.capture.pressure ? CAPTURE.interval : this.stage.interval);
      } else this.nextWaveAt = time + 2;
    }
    return events;
  }
  choose(choiceId: number, upgrade: ChoiceOption) {
    const salvage = upgrade === 'salvage' ? this.progression.salvageCoins : 0;
    if (this.combat.status !== 'running' || this.combat.hp <= 0 || !this.progression.choose(choiceId, upgrade))
      return false;
    this.exploration.coins += salvage;
    syncLoadout(this.progression, this.combat);
    if (upgrade === 'vitality') this.combat.increaseMaxHp(this.progression.vitalityAmount());
    return true;
  }
  fallback(choiceId: number) {
    if (this.combat.status !== 'running' || this.combat.hp <= 0 || !this.progression.fallback(choiceId)) return false;
    this.combat.heal(this.combat.maxHp * PROGRESSION.fallbackHealFraction);
    return true;
  }
}
