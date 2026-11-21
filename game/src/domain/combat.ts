import { HORDE_HIT_GRACE } from '../content/progression.ts';
import { SpatialBuckets } from './spatial-buckets.ts';
import { RangedArsenal } from './classes/ranged-arsenal.ts';
import { WarriorArsenal } from './classes/warrior-arsenal.ts';
import { hasRelic } from '../content/relics.ts';
import type { RelicId } from '../content/relics.ts';
import { primaryEffectDamage, extendPrimaryStatus, secondaryEffects } from './secondary-effects.ts';
import { techniqueValue } from '../content/techniques.ts';
import type { TechniqueRanks } from '../content/techniques.ts';
import { SOLDIER, ENCOUNTER } from '../content/combat.ts';
import type { ClassDefinition } from '../content/class-definition.ts';
import type { ClassRuntime, HeroKit, ClassEffects, AreaAction } from './hero-kit.ts';
import { WARRIOR_RUNTIME } from './classes.ts';
import { inArc } from './targeting.ts';
import { angleDelta } from './movement.ts';
import type { Body, Bounds, Point, Solid } from './movement.ts';
import { Navigation } from './navigation.ts';
import { ELEMENT_RULES as R, splitDirectDamage } from '../content/elements.ts';
import type { ElementalLoadout } from '../content/elements.ts';
import { ENEMIES, actionStats, BOSS_FURY, BOSS_ROTATION, isGroundAttack } from '../content/enemies.ts';
import type { EnemyKind, EnemyAction } from '../content/enemies.ts';
import { Projectiles, segmentDistance } from './projectiles.ts';

export type Attack = {
  swordStroke?: 'cut' | 'backhand' | 'thrust';
  id: number;
  yaw: number;
  age: number;
  hits: Set<number>;
  multiplier?: number;
  impetusGranted?: boolean;
  loadout?: ElementalLoadout;
  action?: EnemyAction;
  groundTarget?: Point;
  released?: boolean;
  pierce?: number;
  range?: number;
  arc?: number;
  techniques?: TechniqueRanks;
  impetusTimeout?: number;
};
export type Whirlwind = AreaAction;
export type Enemy = Body & {
  stationary?: boolean;
  id: number;
  kind: EnemyKind;
  maxHp: number;
  radius: number;
  armor: number;
  actionCount: number;
  retired: boolean;
  hp: number;
  cooldown: number;
  attack?: Attack;
  dead: boolean;
  deathAge: number;
  speed: number;
  previous: Point;
  waypoint?: Point;
  spawnRemaining: number;
  wetRemaining: number;
  pushProtection: number;
  exposedRemaining?: number;
  trapSlowRemaining?: number;
  brokenRemaining?: number;
  burn?: { remaining: number; dps: number; clock: number; attackId: number };
};
export type CombatSource =
  | 'ability'
  | 'ability-extra'
  | 'basic'
  | 'whirlwind'
  | 'enemy'
  | 'burn'
  | 'splash'
  | 'explosion'
  | 'spell'
  | 'cataclysm'
  | 'arrow'
  | 'rain'
  | 'quake'
  | 'gust';
export type CombatEvent = {
  id: number;
  type:
    | 'ability-pulse'
    | 'hit'
    | 'death'
    | 'whirlwind-start'
    | 'whirlwind-pulse'
    | 'splash'
    | 'explosion'
    | 'spell-cast'
    | 'cataclysm-start'
    | 'arrow-shot'
    | 'rain-start'
    | 'rain-pulse'
    | 'quake'
    | 'gust'
    | 'stone-guard'
    | 'guard-block';
  target: number;
  amount: number;
  x: number;
  z: number;
  source?: CombatSource;
  attackId?: number;
  enemyKind?: EnemyKind;
  reward?: number;
  core?: boolean;
};
export type CombatStatus = 'running' | 'victory' | 'defeat';
export { chooseTarget, inArc } from './targeting.ts';
export function damageAfterArmor(damage: number, armor: number) {
  return (Math.max(0, damage) * 100) / (100 + Math.max(0, armor));
}

export class Combat {
  hp: number;
  maxHp: number;
  readonly definition: ClassDefinition;
  readonly heroKit: HeroKit;
  damageMultiplier = 1;
  techniques: TechniqueRanks = Object.freeze({});
  relics: readonly RelicId[] = Object.freeze([]);
  private renewalCooldown?: number;
  loadout: ElementalLoadout = { rank: 0, mastery: false };
  readonly elementalEffects: ClassEffects;
  readonly projectiles: Projectiles;
  protection = 0;
  // Compatibility accessors for existing Warrior presentation and regression fixtures.
  get attack() {
    return this.heroKit.state.attack;
  }
  set attack(value: Attack | undefined) {
    this.heroKit.state.attack = value;
  }
  get cooldown() {
    return this.heroKit.state.cooldown;
  }
  set cooldown(value: number) {
    this.heroKit.state.cooldown = value;
  }
  get targetId() {
    return this.heroKit.state.targetId;
  }
  set targetId(value: number | undefined) {
    this.heroKit.state.targetId = value;
  }
  get impetusStacks() {
    return this.heroKit.state.passiveStacks;
  }
  set impetusStacks(value: number) {
    this.heroKit.state.passiveStacks = value;
  }
  get impetusRemaining() {
    return this.heroKit.state.passiveRemaining;
  }
  set impetusRemaining(value: number) {
    this.heroKit.state.passiveRemaining = value;
  }
  get whirlwindCooldown() {
    return this.heroKit.state.skillCooldown;
  }
  set whirlwindCooldown(value: number) {
    this.heroKit.state.skillCooldown = value;
  }
  get whirlwind() {
    return this.heroKit.state.area;
  }
  set whirlwind(value: Whirlwind | undefined) {
    this.heroKit.state.area = value;
  }
  kills = 0;
  time = 0;
  status: CombatStatus = 'running';
  readonly enemies: Enemy[];
  private events: CombatEvent[] = [];
  private sequence = 0;
  private pathClock = 0;
  private neighbors = new SpatialBuckets<Enemy>();
  private navigation: Navigation;
  private largeNavigation = new Map<number, Navigation>();
  private nextEnemyId = 0;
  private bounds: Bounds;
  private solids: readonly Solid[];
  private finishWhenClear: boolean;
  constructor(
    bounds: Bounds,
    solids: readonly Solid[],
    spawns: readonly Point[] = ENCOUNTER,
    finishWhenClear = true,
    runtime: ClassRuntime = WARRIOR_RUNTIME,
  ) {
    this.definition = runtime.definition;
    this.heroKit = runtime.createKit();
    this.hp = this.maxHp = this.definition.stats.hp;
    this.bounds = bounds;
    this.solids = solids;
    this.navigation = new Navigation(bounds, solids, SOLDIER.radius);
    this.elementalEffects = runtime.createEffects(bounds, solids);
    this.projectiles = new Projectiles(bounds, solids, this.definition.movement.radius);
    this.finishWhenClear = finishWhenClear;
    this.enemies = [];
    this.addEnemies(spawns);
  }
  get cleared() {
    return this.enemies.length > 0 && this.enemies.every(enemy => enemy.dead);
  }
  addEnemies(spawns: readonly Point[], warning = 0, kind: EnemyKind = 'soldier') {
    if (this.status !== 'running') return;
    const stats = ENEMIES[kind];
    for (const p of spawns) {
      const id = ++this.nextEnemyId;
      this.enemies.push({
        ...p,
        yaw: 0,
        previous: { ...p },
        id,
        kind,
        maxHp: stats.hp,
        radius: stats.radius,
        armor: stats.armor,
        actionCount: 0,
        retired: false,
        hp: stats.hp,
        cooldown: 0.2 + ((id - 1) % 5) * 0.13,
        dead: false,
        deathAge: 0,
        speed: 0,
        spawnRemaining: warning,
        wetRemaining: 0,
        pushProtection: 0,
      });
    }
  }
  retireNormal(e: Enemy) {
    if (e.dead || e.kind === 'elite' || e.kind === 'boss') return false;
    e.dead = true;
    e.retired = true;
    e.hp = 0;
    e.attack = undefined;
    e.burn = undefined;
    delete e.brokenRemaining;
    e.wetRemaining = 0;
    e.speed = 0;
    if (this.targetId === e.id) this.targetId = undefined;
    // Retirement emits no death and does not erase already fired projectiles.
    return true;
  }
  retireNormals() {
    for (const e of this.enemies) this.retireNormal(e);
    this.targetId = undefined;
    this.projectiles.clear();
  }
  pruneCorpses(seconds: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--)
      if (
        this.enemies[i].dead &&
        this.enemies[i].deathAge >= seconds &&
        this.enemies[i].kind !== 'boss' &&
        this.enemies[i].kind !== 'elite'
      )
        this.enemies.splice(i, 1);
  }
  heal(amount: number) {
    if (this.hp > 0 && this.status === 'running') this.hp = Math.min(this.maxHp, this.hp + Math.max(0, amount));
  }
  increaseMaxHp(amount: number) {
    if (this.hp > 0 && this.status === 'running') {
      this.maxHp += Math.max(0, amount);
      this.heal(amount);
    }
  }
  complete() {
    if (this.cleared && this.hp > 0 && this.status === 'running') {
      this.status = 'victory';
      this.heroKit.cancel();
      this.projectiles.clear();
    }
  }
  takeEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
  private emit(
    type: CombatEvent['type'],
    target: number,
    amount: number,
    position: Point,
    source?: CombatSource,
    attackId?: number,
  ) {
    this.events.push({ id: ++this.sequence, type, target, amount, x: position.x, z: position.z, source, attackId });
  }
  private begin(yaw: number): Attack {
    return { id: ++this.sequence, yaw, age: 0, hits: new Set() };
  }
  private startEnemyAttack(enemy: Enemy, hero: Body, furious: boolean) {
    const distance = Math.hypot(hero.x - enemy.x, hero.z - enemy.z);
    const reach = distance - this.definition.movement.radius;
    let action: EnemyAction = 'melee';
    switch (enemy.kind) {
      case 'archer':
        action = 'shot';
        break;
      case 'charger':
      case 'hunter':
        action = 'charge';
        break;
      case 'elite':
        action = enemy.actionCount % 2 === 1 ? 'slam' : 'melee';
        break;
      case 'boss': {
        action = BOSS_ROTATION[enemy.actionCount % BOSS_ROTATION.length];
        const canCharge =
          distance > 4 &&
          reach <= actionStats('boss', 'charge').range &&
          this.navigation.clearPath(enemy, hero, enemy.radius);
        if (action === 'charge' && !canCharge) action = 'melee';
        if (
          !isGroundAttack(action) &&
          (reach > actionStats('boss', action).range || !this.navigation.clearPath(enemy, hero, 0.04))
        ) {
          // An unreachable melee strike must not stall the rotation indefinitely.
          action = canCharge ? 'charge' : enemy.actionCount % 2 === 0 ? 'rupture' : 'edict';
        }
        break;
      }
    }
    const data = actionStats(enemy.kind, action);
    const activationRange = action === 'charge' && enemy.kind !== 'boss' ? ENEMIES[enemy.kind].range : data.range;
    if (!isGroundAttack(action) && (reach > activationRange || !this.navigation.clearPath(enemy, hero, 0.04))) return;

    const attack = this.begin(Math.atan2(enemy.x - hero.x, enemy.z - hero.z));
    attack.action = action;
    if (isGroundAttack(action)) attack.groundTarget = { x: hero.x, z: hero.z };
    enemy.attack = attack;
    enemy.actionCount++;
    enemy.yaw = attack.yaw;
    enemy.cooldown = data.cooldown * (furious ? BOSS_FURY.cooldownMultiplier : 1);
  }
  step(dt: number, hero: Body) {
    if (this.status !== 'running' || dt <= 0) return;
    if (this.renewalCooldown !== undefined) this.renewalCooldown = Math.max(0, this.renewalCooldown - dt);
    this.time += dt;
    this.protection = Math.max(0, this.protection - dt);
    this.heroKit.advance(dt);
    this.pathClock -= dt;
    if (this.pathClock <= 0) {
      this.navigation.update(hero);
      this.pathClock = 0.3;
      for (const enemy of this.enemies)
        if (!enemy.dead) {
          let navigation = this.navigation;
          if (enemy.radius > SOLDIER.radius) {
            navigation = this.largeNavigation.get(enemy.radius)!;
            if (!navigation) {
              navigation = new Navigation(this.bounds, this.solids, enemy.radius);
              this.largeNavigation.set(enemy.radius, navigation);
            }
            navigation.update(hero);
          }
          enemy.waypoint = navigation.waypoint(enemy, hero);
        }
    }
    // Actors alive at the beginning of this step can land simultaneous valid hits.
    const alive = this.enemies.filter(enemy => !enemy.dead && enemy.spawnRemaining <= 0);
    this.neighbors.rebuild(alive);
    for (const enemy of alive)
      if (enemy.brokenRemaining !== undefined) {
        enemy.brokenRemaining = Math.max(0, enemy.brokenRemaining - dt);
        if (enemy.brokenRemaining <= 1e-8) delete enemy.brokenRemaining;
      }
    for (const e of alive) if (e.exposedRemaining) e.exposedRemaining = Math.max(0, e.exposedRemaining - dt);
    for (const e of alive) if (e.trapSlowRemaining) e.trapSlowRemaining = Math.max(0, e.trapSlowRemaining - dt);
    const periodic = this.elementalEffects.update(dt, alive);
    const projectileHits = this.projectiles.step(dt, hero);
    for (const enemy of this.enemies) {
      enemy.previous = { x: enemy.x, z: enemy.z };
      if (enemy.dead) {
        enemy.deathAge += dt;
        continue;
      }
      if (enemy.spawnRemaining > 0) {
        enemy.spawnRemaining = Math.max(0, enemy.spawnRemaining - dt);
        enemy.speed = 0;
        continue;
      }
      // Training targets retain damage/status processing without autonomous movement or attacks.
      if (enemy.stationary) {
        enemy.speed = 0;
        continue;
      }
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      const stats = ENEMIES[enemy.kind];
      const furious = enemy.kind === 'boss' && enemy.hp <= enemy.maxHp * BOSS_FURY.healthFraction;
      if (enemy.attack) {
        enemy.attack.age += dt;
        if (enemy.attack.age >= actionStats(enemy.kind, enemy.attack.action).duration) enemy.attack = undefined;
      }
      let vx = 0,
        vz = 0;
      const moveSpeed =
        stats.speed *
        (furious ? BOSS_FURY.speedMultiplier : 1) *
        (1 - Math.max(enemy.wetRemaining > 0 ? R.slow : 0, (enemy.trapSlowRemaining ?? 0) > 0 ? 0.2 : 0) * stats.slow);
      const distance = Math.hypot(hero.x - enemy.x, hero.z - enemy.z);
      const visible = this.navigation.clearPath(enemy, hero, enemy.radius);
      const keepDistance = enemy.kind === 'archer' ? 7 : 0.95 + enemy.radius - SOLDIER.radius;
      if (!enemy.attack && (distance > keepDistance || !visible)) {
        const waypoint = visible ? hero : enemy.waypoint;
        if (waypoint) {
          const dx = waypoint.x - enemy.x,
            dz = waypoint.z - enemy.z,
            length = Math.hypot(dx, dz);
          if (length > 0.05) {
            vx = (dx / length) * moveSpeed;
            vz = (dz / length) * moveSpeed;
          }
        }
      }
      if (!enemy.attack && enemy.kind === 'archer' && visible && distance < 4 && distance > 0.01) {
        vx = ((enemy.x - hero.x) / distance) * moveSpeed;
        vz = ((enemy.z - hero.z) / distance) * moveSpeed;
      }
      const charge =
        enemy.attack?.action === 'charge' && !enemy.attack.released ? actionStats(enemy.kind, 'charge') : undefined;
      const charging =
        charge && enemy.attack!.age >= charge.windup && enemy.attack!.age < charge.windup + charge.active;
      // Soft separation, never contact damage or a rigid wall of enemies.
      for (const other of this.neighbors.near(enemy, enemy.radius + 0.65 + 0.18)) {
        if (other.id === enemy.id || charging) continue;
        const dx = enemy.x - other.x,
          dz = enemy.z - other.z,
          length = Math.hypot(dx, dz);
        const spacing = enemy.radius + other.radius + 0.18;
        if (length < spacing) {
          const scale = (spacing - length) * 4;
          vx += (length > 0.001 ? dx / length : enemy.id < other.id ? -1 : 1) * scale;
          vz += (length > 0.001 ? dz / length : 0) * scale;
        }
      }
      const speed = Math.hypot(vx, vz);
      if (speed > moveSpeed) {
        vx *= moveSpeed / speed;
        vz *= moveSpeed / speed;
      }
      if (charging) {
        const chargeSpeed = charge.range / charge.active;
        const chargeSlow = enemy.wetRemaining > 0 ? 1 - R.slow * stats.slow : 1;
        vx = -Math.sin(enemy.attack!.yaw) * chargeSpeed * chargeSlow;
        vz = -Math.cos(enemy.attack!.yaw) * chargeSpeed * chargeSlow;
      }
      const intended = { x: enemy.x + vx * dt, z: enemy.z + vz * dt };
      if (charging && !this.navigation.clearPath(enemy, intended, enemy.radius)) {
        vx = 0;
        vz = 0;
        enemy.attack!.released = true;
      }
      let next = this.navigation.move(enemy, { x: vx * dt, z: vz * dt }, enemy.radius);
      const hx = next.x - hero.x,
        hz = next.z - hero.z,
        overlap = Math.hypot(hx, hz),
        separation = this.definition.movement.radius + enemy.radius;
      if (!charging && overlap < separation)
        next = this.navigation.move(
          next,
          {
            x: (overlap > 0.001 ? hx / overlap : 1) * (separation - overlap),
            z: (overlap > 0.001 ? hz / overlap : 0) * (separation - overlap),
          },
          enemy.radius,
        );
      enemy.speed = Math.hypot(next.x - enemy.x, next.z - enemy.z) / dt;
      enemy.x = next.x;
      enemy.z = next.z;
      this.neighbors.update(enemy);
      if (!enemy.attack && Math.hypot(hero.x - enemy.x, hero.z - enemy.z) > 0.01)
        enemy.yaw +=
          angleDelta(enemy.yaw, Math.atan2(enemy.x - hero.x, enemy.z - hero.z)) *
          (1 - Math.exp(-SOLDIER.turnSpeed * dt));
      if (!enemy.attack && enemy.cooldown <= 1e-8) this.startEnemyAttack(enemy, hero, furious);
      if (
        enemy.attack &&
        (enemy.attack.action === 'shot' || enemy.attack.action === 'volley') &&
        !enemy.attack.released &&
        enemy.attack.age + 1e-8 >= actionStats(enemy.kind, enemy.attack.action).windup
      ) {
        enemy.attack.released = true;
        const angles =
          enemy.attack.action === 'shot' ? [0] : furious ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.24, 0, 0.24];
        for (const angle of angles)
          this.projectiles.fire(
            enemy,
            enemy.attack.yaw + angle,
            enemy.id,
            actionStats(enemy.kind, enemy.attack.action).damage,
          );
      }
    }
    const damage = this.heroKit.act({
      hero,
      alive,
      solids: this.solids,
      damageMultiplier: this.damageMultiplier,
      loadout: this.loadout,
      techniques: this.techniques,
      nextId: () => ++this.sequence,
      emit: (type, target, amount, position, source, attackId) =>
        this.emit(type, target, amount, position, source, attackId),
    });
    let heroHit = false;
    for (const hit of projectileHits)
      if (this.protection <= 1e-8 && !heroHit) {
        heroHit = true;
        damage.push({
          target: undefined,
          amount: damageAfterArmor(hit.damage, this.definition.stats.armor),
          source: 'enemy',
          attackId: hit.id,
        });
      }
    for (const enemy of alive) {
      const attack = enemy.attack;
      if (!attack || attack.action === 'shot' || attack.action === 'volley') continue;
      const actionData = actionStats(enemy.kind, attack.action);
      if (
        attack.hits.has(0) ||
        attack.age + 1e-8 < actionData.windup ||
        attack.age >= actionData.windup + actionData.active - 1e-8
      )
        continue;
      let hit: boolean;
      if (isGroundAttack(attack.action)) {
        if (!attack.groundTarget) continue;
        // Ground spells resolve once at the warned position, even through cover.
        attack.hits.add(0);
        const inside = Math.hypot(hero.x - attack.groundTarget.x, hero.z - attack.groundTarget.z) <= actionData.range;
        hit = attack.action === 'edict' ? !inside : inside;
      } else {
        hit =
          (attack.action === 'charge'
            ? !attack.released &&
              segmentDistance(enemy.previous, enemy, hero) <= enemy.radius + this.definition.movement.radius
            : inArc(enemy, hero, attack.yaw, actionData.range, actionData.arc, this.definition.movement.radius)) &&
          this.navigation.clearPath(enemy, hero, 0.04);
      }
      if (hit) {
        attack.hits.add(0);
        if (this.protection <= 1e-8 && !heroHit) {
          heroHit = true;
          damage.push({
            target: undefined,
            amount: damageAfterArmor(actionData.damage, this.definition.stats.armor),
            source: 'enemy',
            attackId: attack.id,
          });
        }
      }
    }
    const killers = new Map<number, CombatSource>();
    const apply = (hit: {
      target: Enemy;
      amount: number;
      source: CombatSource;
      attackId: number;
      loadout?: ElementalLoadout;
      armorIgnore?: number;
    }) => {
      // Both components currently share armor; elemental resistance is not in this slice.
      const mark = this.heroKit instanceof RangedArsenal ? 1 + this.heroKit.targetBonus(hit.target) : 1;
      const parts = hit.loadout ? splitDirectDamage(hit.amount, hit.loadout) : { physical: hit.amount, elemental: 0 };
      const armor = hit.target.armor * (1 - Math.max(0, Math.min(1, hit.armorIgnore ?? 0)));
      const amount =
          mark *
          (damageAfterArmor(parts.physical, armor) + damageAfterArmor(parts.elemental, armor)) *
          (1 +
            Math.max(
              (hit.target.brokenRemaining ?? 0) > 0 ? R.brokenBonus : 0,
              (hit.target.exposedRemaining ?? 0) > 0 ? 0.12 : 0,
            )),
        before = hit.target.hp;
      hit.target.hp = Math.max(0, before - amount);
      if (before > 0 && hit.target.hp <= 0) killers.set(hit.target.id, hit.source);
      this.emit('hit', hit.target.id, amount, hit.target, hit.source, hit.attackId);
    };
    // Status ticks and direct blows share the same simultaneous-impact window.
    for (const hit of periodic) apply(hit);
    for (const hit of damage) {
      if (hit.target) {
        apply({ ...hit, target: hit.target });
        if (hit.exposeDuration) hit.target.exposedRemaining = hit.exposeDuration;
        if (hit.source === 'ability-extra') continue;
        const loadout = hit.loadout ?? this.loadout;
        const effects = this.elementalEffects.direct(
          hit.target,
          hit.source,
          primaryEffectDamage(hit.amount, loadout),
          hit.attackId,
          hit.origin ?? hero,
          alive,
          loadout,
          hero,
        );
        extendPrimaryStatus(hit.target, loadout);
        effects.visuals.push(
          ...secondaryEffects(
            hit.target,
            hit.source,
            hit.amount,
            hit.attackId,
            hit.origin ?? hero,
            hero,
            loadout,
            this.bounds,
            this.solids,
          ),
        );
        for (const extra of effects.hits) {
          apply(extra);
          extendPrimaryStatus(extra.target, loadout);
        }
        for (const fx of effects.visuals) this.emit(fx.type, 0, fx.radius, fx.position, fx.type, hit.attackId);
      } else {
        const incoming =
          hit.amount *
          (this.heroKit instanceof WarriorArsenal || this.heroKit instanceof RangedArsenal
            ? 1 - this.heroKit.defenseBonus
            : 1) *
          (1 -
            (this.heroKit instanceof WarriorArsenal
              ? (this.heroKit.stats.temple ?? 0) * 0.05
              : this.definition.id === 'warrior'
                ? techniqueValue(this.techniques, 'guard')
                : 0)) *
          (hasRelic(this.relics, 'relic_shell') ? 0.9 : 1);
        const barrier = this.heroKit.state.barrier;
        const blocked = barrier ? Math.min(barrier.amount, incoming) : 0;
        if (barrier && blocked > 0) {
          barrier.amount -= blocked;
          this.emit('guard-block', 0, blocked, hero, hit.source, hit.attackId);
          if (barrier.amount <= 1e-8) this.heroKit.state.barrier = undefined;
        }
        const received = incoming - blocked;
        this.hp = Math.max(0, this.hp - received);
        this.protection =
          this.heroKit instanceof WarriorArsenal || this.heroKit instanceof RangedArsenal
            ? Math.max(this.definition.stats.protection, HORDE_HIT_GRACE)
            : this.definition.stats.protection;
        if (received > 0) this.emit('hit', 0, received, hero, hit.source, hit.attackId);
      }
    }
    if (this.hp > 0) {
      const effects = this.elementalEffects.explosions(
        alive.filter(e => e.hp <= 0),
        alive,
        killers,
        this.loadout,
      );
      for (const extra of effects.hits) apply(extra);
      for (const fx of effects.visuals) this.emit(fx.type, 0, fx.radius, fx.position, fx.type);
    }
    const killsBefore = this.kills;
    let slain = false;
    for (const enemy of alive)
      if (enemy.hp <= 0) {
        slain = true;
        enemy.dead = true;
        delete enemy.brokenRemaining;
        enemy.attack = undefined;
        enemy.speed = 0;
        this.kills++;
        this.events.push({
          id: ++this.sequence,
          type: 'death',
          target: enemy.id,
          amount: 0,
          x: enemy.x,
          z: enemy.z,
          enemyKind: enemy.kind,
          reward: ENEMIES[enemy.kind].essence,
          core: enemy.kind === 'elite',
        });
      }
    if (slain && this.hp > 0 && hasRelic(this.relics, 'relic_mender') && (this.renewalCooldown ?? 0) <= 1e-8) {
      this.heal(2);
      this.renewalCooldown = 1;
    }
    if (
      this.hp > 0 &&
      (this.heroKit instanceof WarriorArsenal || this.heroKit instanceof RangedArsenal) &&
      this.heroKit.stats.recovery
    ) {
      const crossed = Math.floor(this.kills / 20) - Math.floor(killsBefore / 20);
      if (crossed > 0) this.heal(crossed * (1 + this.heroKit.stats.recovery));
    }
    this.elementalEffects.cleanup(this.enemies);
    // Defeat wins ties; no later actions or rewards can resurrect the encounter.
    if (this.hp <= 0) {
      this.status = 'defeat';
      this.attack = undefined;
      this.emit('death', 0, 0, hero);
    } else if (this.finishWhenClear && this.cleared) this.status = 'victory';
    this.heroKit.finishStep();
    if (this.status !== 'running') {
      this.heroKit.cancel();
      this.projectiles.clear();
      for (const enemy of this.enemies) enemy.attack = undefined;
    }
  }
}
