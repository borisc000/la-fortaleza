import { AbilityBook } from '../ability-book.ts';
import type { AbilityState } from '../ability-book.ts';
import { AbilityClock } from '../ability-clock.ts';
import { rangedParameters, abilityData } from '../../content/ranged-abilities.ts';
import type { GeneralRanks } from '../../content/warrior-abilities.ts';
import { MAGE, MAGE_KIT, mageProjectile, mageRange } from '../../content/classes/mage.ts';
import { ARCHER, ARCHER_KIT, arrowSpeed, archerRange, arrowArmorIgnore } from '../../content/classes/archer.ts';
import type { HeroKit, HeroKitState, HeroKitContext, HeroHit, HeroProjectile } from '../hero-kit.ts';
import type { Enemy, CombatSource } from '../combat.ts';
import type { ElementalLoadout } from '../../content/elements.ts';
import type { Bounds, Point } from '../movement.ts';
import { clearPath } from '../navigation.ts';
import { chooseTarget } from '../targeting.ts';
import { segmentDistance } from '../projectiles.ts';
import { displaceFrom } from '../forced-movement.ts';
import { ENEMIES } from '../../content/enemies.ts';

type Params = ReturnType<typeof rangedParameters>;
type Node = Point & { uses: number; last: Map<number, number>; triggered?: number };
type Action = {
  id: number;
  skill: AbilityState;
  p: Params;
  age: number;
  duration: number;
  center: Point;
  origin: Point;
  yaw: number;
  target: number;
  multiplier: number;
  loadout: ElementalLoadout;
  pulses: number;
  count: number;
  fractures?: (Point & { radius: number })[];
  nodes: Node[];
  struck: Map<number, number>;
  casts: number;
};
type Shot = HeroProjectile & {
  skill: AbilityState;
  source: CombatSource;
  range: number;
  traveled: number;
  hitIds: Set<number>;
  maxHits: number;
  decay: number;
  width: number;
  precision: boolean;
  timeout: number;
  blast: number;
  blastFactor: number;
  firstBonus: number;
  eliteBonus: number;
  endBlast: number;
  legs: number;
  leg: number;
  legFactor: number;
  bounceLeft: number;
  bounceRange: number;
  visited: Set<number>;
  firstTarget?: number;
  lastTarget?: number;
  duelUsed: boolean;
  allowedBounce?: number;
  life: number;
};
export type RangedVisual = Readonly<{
  id: string;
  kind:
    | 'zone'
    | 'beam'
    | 'orb'
    | 'trap'
    | 'stake'
    | 'mirror'
    | 'beacon'
    | 'seal'
    | 'seal-flash'
    | 'pierce'
    | 'fissure'
    | 'nova-front'
    | 'crystal-fall'
    | 'splinters'
    | 'echo'
    | 'trap-snap'
    | 'stake-hit'
    | 'bend'
    | 'mark'
    | 'lance-hit'
    | 'snared';
  x: number;
  z: number;
  radius: number;
  yaw: number;
  width?: number;
  ready?: boolean;
  phase?: number;
  residual?: boolean;
}>;

/** Shared scheduling/collision only; the two repertoires retain distinct executors. */
export class RangedArsenal implements HeroKit {
  readonly classId: 'mage' | 'archer';
  readonly state: HeroKitState & { projectiles: Shot[] } = {
    cooldown: 0,
    skillCooldown: 0,
    passiveStacks: 0,
    passiveRemaining: 0,
    projectiles: [],
  };
  readonly clock = new AbilityClock();
  abilities: readonly AbilityState[];
  stats: GeneralRanks = {};
  defenseBonus = 0;
  private defenseUntil = 0;
  private time = 0;
  private dt = 0;
  private wardAt = 0;
  private stopped = false;
  private actions: Action[] = [];
  private pendingBasic?: {
    skill: AbilityState;
    p: Params;
    loadout: ElementalLoadout;
    multiplier: number;
    pierce: number;
  };
  private marks = new Map<number, { bonus: number; until: number }>();
  private trapSlowUntil = 0;
  private impactFlashes: { birth: number; visual: RangedVisual }[] = [];
  private visuals: RangedVisual[] = [];
  private bounds: Bounds;
  constructor(classId: 'mage' | 'archer', bounds: Bounds) {
    this.classId = classId;
    this.bounds = bounds;
    this.abilities = new AbilityBook(classId).snapshot;
  }
  get presentation(): readonly RangedVisual[] {
    return this.visuals;
  }
  targetBonus(enemy: Enemy) {
    const mark = this.marks.get(enemy.id);
    return mark && mark.until > this.time ? mark.bonus : 0;
  }
  private barrier(amount: number, duration: number) {
    this.state.barrier = {
      amount: Math.min(40, Math.max(amount, this.state.barrier?.amount ?? 0)),
      remaining: Math.min(5, Math.max(duration, this.state.barrier?.remaining ?? 0)),
    };
  }
  advance(dt: number) {
    if (this.stopped) return;
    this.dt = dt;
    this.time += dt;
    this.clock.step(dt);
    const s = this.state;
    if (s.siegeTrail) {
      s.siegeTrail.fade -= dt;
      if (s.siegeTrail.fade <= 0) s.siegeTrail = undefined;
    }
    if (s.siegePose && s.siegePose.age < 0) s.siegePose = undefined;
    if (s.siegePose) {
      s.siegePose.age += dt;
      if (s.siegePose.age >= 0.36) s.siegePose = undefined;
    }
    s.cooldown = Math.max(0, s.cooldown - dt);
    s.passiveRemaining = Math.max(0, s.passiveRemaining - dt);
    if (this.classId === 'archer' && s.passiveRemaining <= 1e-8) s.passiveStacks = 0;
    if (s.attack) {
      s.attack.age += dt;
      if (s.attack.age >= (this.classId === 'mage' ? 0.4 : 0.32)) s.attack = undefined;
    }
    if (s.barrier) {
      s.barrier.remaining -= dt;
      if (s.barrier.remaining <= 0) s.barrier = undefined;
    }
    s.barrierCooldown = Math.max(0, (s.barrierCooldown ?? 0) - dt);
    for (const a of this.actions) a.age += dt;
    for (const [id, mark] of this.marks) if (mark.until <= this.time) this.marks.delete(id);
    this.defenseBonus = this.time < this.defenseUntil ? 0.2 : 0;
  }
  act(c: HeroKitContext): HeroHit[] {
    if (this.stopped) return [];
    const { hero, alive, solids } = c,
      s = this.state,
      hits: HeroHit[] = [];
    this.visuals = [];
    s.beamYaw = undefined;
    const near = (point: Point, radius: number) =>
      alive
        .filter(e => Math.hypot(e.x - point.x, e.z - point.z) <= radius + e.radius && clearPath(point, e, solids, 0.04))
        .sort(
          (a, b) => Math.hypot(a.x - point.x, a.z - point.z) - Math.hypot(b.x - point.x, b.z - point.z) || a.id - b.id,
        );
    const emit = (point: Point, radius: number, source: CombatSource = 'ability') =>
      c.emit(
        this.classId === 'archer'
          ? 'rain-pulse'
          : c.loadout.element === 'fire'
            ? 'explosion'
            : c.loadout.element === 'earth'
              ? 'quake'
              : c.loadout.element === 'air'
                ? 'gust'
                : 'splash',
        0,
        radius,
        point,
        source,
      );
    const hit = (
      target: Enemy,
      amount: number,
      source: CombatSource,
      id: number,
      loadout: ElementalLoadout,
      origin: Point,
    ) =>
      hits.push({
        target,
        amount,
        source,
        attackId: id,
        loadout,
        origin,
        armorIgnore: this.classId === 'archer' ? arrowArmorIgnore(loadout, source === 'rain') : 0,
      });
    const flash = (kind: RangedVisual['kind'], id: string, point: Point, radius: number, yaw = 0) =>
      this.impactFlashes.push({ birth: this.time, visual: { kind, id, x: point.x, z: point.z, radius, yaw } });
    const area = (
      a: Action,
      point: Point,
      radius: number,
      factor = 1,
      derived = false,
      source: CombatSource = 'ability',
    ) => {
      const id = c.nextId();
      emit(point, radius, source);
      const kind = a.p.id;
      if (kind === 'cataclysm') flash('fissure', `crack:${id}`, point, radius, a.pulses * 0.3);
      if (kind === 'nova') flash('nova-front', `nova:${id}`, point, radius);
      if (kind === 'fragments') flash('splinters', `crystal:${id}`, point, radius);
      if (kind === 'spike-trap') flash('trap-snap', `spring:${id}`, point, radius);
      for (const e of near(point, radius)) {
        let bonus = 1;
        if (a.p.id === 'rain' && a.skill.finisher === 1 && (e.kind === 'elite' || e.kind === 'boss')) bonus *= 1.6;
        if (a.p.id === 'detonation' && a.skill.finisher === 1 && Math.hypot(e.x - point.x, e.z - point.z) <= 0.8)
          bonus *= 2;
        if (a.p.id === 'nova' && a.skill.mutation === 1 && Math.hypot(e.x - point.x, e.z - point.z) >= radius * 0.65)
          bonus *= 1.5;
        if (a.p.id === 'spike-trap' && !derived && a.skill.mutation === 0 && e.hp >= e.maxHp) bonus *= 1.35;
        hit(e, a.p.damage * a.multiplier * factor * bonus, derived ? 'ability-extra' : source, id, a.loadout, point);
        if (a.p.id === 'spike-trap' && !derived) {
          e.trapSlowRemaining = Math.max(e.trapSlowRemaining ?? 0, a.skill.finisher === 0 ? 4 : 2);
          this.trapSlowUntil = Math.max(this.trapSlowUntil, this.time + e.trapSlowRemaining);
        }
        if (
          (a.p.id === 'nova' || (a.p.id === 'detonation' && a.skill.mutation === 1)) &&
          !derived &&
          e.pushProtection <= 0
        ) {
          displaceFrom(
            e,
            point,
            (a.p.id === 'nova' ? 0.15 + a.skill.branches.specialization * 0.1 : -0.3) * ENEMIES[e.kind].push,
            this.bounds,
            solids,
            hero,
          );
          e.pushProtection = 0.5;
        }
      }
    };
    const shoot = (
      skill: AbilityState,
      p: Params,
      loadout: ElementalLoadout,
      multiplier: number,
      origin: Point,
      yaw: number,
      source: CombatSource = 'ability',
      extra: Partial<Shot> = {},
    ) => {
      if (s.projectiles.length >= 32 || !clearPath(hero, origin, solids, 0.04)) return;
      const speed = p.speed * (this.classId === 'mage' ? mageProjectile(loadout).speed / 16 : arrowSpeed(loadout) / 24);
      s.projectiles.push({
        ...origin,
        previous: { ...origin },
        id: c.nextId(),
        vx: -Math.sin(yaw) * speed,
        vz: -Math.cos(yaw) * speed,
        age: 0,
        damage: p.damage * multiplier,
        empowered: false,
        siege: p.id === 'siege-shot',
        abilityId: p.id,
        flightOrigin: p.id === 'return-arrows' ? { ...origin } : undefined,
        loadout,
        skill,
        source,
        range: p.radius,
        traveled: 0,
        hitIds: new Set(),
        maxHits: 1,
        decay: 0.85,
        width: this.classId === 'mage' ? mageProjectile(loadout).radius : 0.09,
        precision: false,
        echo: source === 'ability-extra',
        timeout: 4,
        blast: 0,
        blastFactor: 1,
        firstBonus: 1,
        eliteBonus: 1,
        endBlast: 0,
        legs: 1,
        leg: 0,
        legFactor: 1,
        bounceLeft: 0,
        bounceRange: 3,
        visited: new Set(),
        duelUsed: false,
        life: 0,
        ...extra,
      });
    };
    if ((this.stats.ward ?? 0) && this.time >= this.wardAt) {
      this.barrier(this.stats.ward! * 4, 5);
      this.wardAt = this.time + 25;
    }

    // Existing projectiles advance before new casts. Each leg has its own hit set.
    for (let i = 0; i < s.projectiles.length; ) {
      const q = s.projectiles[i];
      q.previous = { x: q.x, z: q.z };
      q.life += this.dt;
      q.age += this.dt;
      const speed = Math.hypot(q.vx, q.vz),
        travel = Math.min(speed * this.dt, q.range - q.traveled);
      const steps = Math.max(1, Math.ceil(travel / 0.07));
      let ended = false,
        bounced = false;
      for (let j = 0; j < steps && !ended && !bounced; j++) {
        const to = { x: q.x + ((q.vx / speed) * travel) / steps, z: q.z + ((q.vz / speed) * travel) / steps };
        if (
          to.x < this.bounds.minX ||
          to.x > this.bounds.maxX ||
          to.z < this.bounds.minZ ||
          to.z > this.bounds.maxZ ||
          !clearPath(q, to, solids, q.width)
        ) {
          ended = true;
          break;
        }
        const targets = alive
          .filter(
            e =>
              q.hitIds.size < q.maxHits &&
              !q.hitIds.has(e.id) &&
              (q.allowedBounce === undefined || q.allowedBounce === e.id) &&
              segmentDistance(q, to, e) <= e.radius + q.width &&
              clearPath(q, e, solids, 0.04),
          )
          .sort((a, b) => Math.hypot(a.x - q.x, a.z - q.z) - Math.hypot(b.x - q.x, b.z - q.z));
        q.x = to.x;
        q.z = to.z;
        q.traveled += travel / steps;
        for (const e of targets) {
          const first = !q.hitIds.size;
          if (q.precision && first) {
            s.passiveStacks = Math.min(3, s.passiveStacks + 1);
            s.passiveRemaining = q.timeout;
          }
          const factor =
            q.decay ** q.hitIds.size *
            (first ? q.firstBonus : 1) *
            (e.kind === 'boss' || e.kind === 'elite' ? q.eliteBonus : 1);
          hit(e, q.damage * factor, q.source, q.id, q.loadout, q.previous);
          if (q.siege) {
            this.impactFlashes.push({
              birth: this.time,
              visual: {
                id: `pierce:${q.id}:${e.id}`,
                kind: 'pierce',
                x: q.x,
                z: q.z,
                yaw: Math.atan2(q.vx, q.vz),
                radius: Math.max(0.55, e.radius),
              },
            });
          }
          if (q.skill.id === 'mage:arcane-lances')
            flash('lance-hit', `lance:${q.id}:${e.id}`, q, 0.46, Math.atan2(q.vx, q.vz));
          q.hitIds.add(e.id);
          q.visited.add(e.id);
          q.firstTarget ??= e.id;
          q.lastTarget = e.id;
          if (q.blast && first) {
            emit(e, q.blast);
            for (const other of near(e, q.blast))
              if (other.id !== e.id) hit(other, q.damage * q.blastFactor, 'ability-extra', q.id, q.loadout, e);
          }
          if (q.bounceLeft > 0) {
            const candidates = near(e, q.bounceRange).filter(other => other.id !== e.id);
            const candidate =
              q.skill.mutation === 0
                ? candidates.find(other => !q.visited.has(other.id))
                : q.skill.mutation === 1
                  ? candidates.find(other => !q.visited.has(other.id) || (other.id === q.firstTarget && !q.duelUsed))
                  : candidates[0];
            if (candidate) {
              if (q.visited.has(candidate.id)) q.duelUsed = true;
              flash('bend', `bounce:${q.id}:${q.bounceLeft}`, q, Math.min(2, q.traveled), Math.atan2(-q.vx, -q.vz));
              q.allowedBounce = candidate.id;
              q.bounceLeft--;
              q.damage *= q.skill.finisher === 0 ? 1 : 0.8;
              const angle = Math.atan2(e.x - candidate.x, e.z - candidate.z);
              q.vx = -Math.sin(angle) * speed;
              q.vz = -Math.cos(angle) * speed;
              q.range = q.bounceRange;
              q.traveled = 0;
              q.hitIds = new Set([e.id]);
              q.maxHits = 2;
              q.firstBonus = 1;
              bounced = true;
              break;
            }
          }
          if (q.hitIds.size >= q.maxHits) {
            if (q.legs === 1) ended = true;
            break;
          }
        }
      }
      if (q.siege) {
        if (s.siegeTrail?.id !== q.id)
          s.siegeTrail = {
            start: { ...q.previous },
            end: { x: q.x, z: q.z },
            id: q.id,
            fade: 0.18,
            element: q.loadout.element,
          };
        s.siegeTrail.end.x = q.x;
        s.siegeTrail.end.z = q.z;
        s.siegeTrail.fade = 0.18;
      }
      if (!bounced && (ended || q.traveled >= q.range - 1e-8 || q.life > 8)) {
        if (!ended && q.leg + 1 < q.legs && q.life <= 8) {
          flash('bend', `turn:${q.id}:${q.leg}`, q, 0.8, Math.atan2(-q.vx, -q.vz));
          q.leg++;
          q.traveled = 0;
          q.vx *= -1;
          q.vz *= -1;
          q.hitIds.clear();
          if (q.leg === 1) q.damage *= q.legFactor;
          else {
            q.damage *= 0.4 / q.legFactor;
            q.source = 'ability-extra';
          }
        } else {
          if (q.endBlast) {
            emit(q, 2);
            for (const e of near(q, 2)) hit(e, q.damage * q.endBlast, 'ability-extra', q.id, q.loadout, q);
          }
          if (q.precision && !q.hitIds.size) {
            s.passiveStacks = 0;
            s.passiveRemaining = 0;
          }
          s.projectiles.splice(i, 1);
          continue;
        }
      }
      i++;
    }

    const basic = this.abilities.find(a => a.id === `${this.classId}:${this.classId === 'mage' ? 'orb' : 'arrow'}`)!;
    const bp = rangedParameters(basic, this.stats),
      definition = this.classId === 'mage' ? MAGE : ARCHER;
    const range = Math.min(
      definition.basic.range * 1.75,
      bp.radius + (this.classId === 'mage' ? mageRange(c.loadout) : archerRange(c.loadout)) - definition.basic.range,
    );
    s.targetId = chooseTarget(hero, alive, s.targetId, solids, range);
    const target = alive.find(e => e.id === s.targetId);
    if (!s.attack && s.cooldown <= 1e-8 && target && (this.classId !== 'mage' || c.loadout.element)) {
      const loadout = { ...c.loadout, pureElemental: this.classId === 'mage' };
      this.pendingBasic = {
        skill: basic,
        p: { ...bp, radius: range },
        loadout,
        multiplier: c.damageMultiplier * (this.classId === 'mage' ? 1 + 0.1 * Math.max(0, c.loadout.rank - 1) : 1),
        pierce:
          this.classId === 'mage'
            ? 1 + basic.branches.specialization
            : ARCHER_KIT.precision.targets[s.passiveStacks] +
              basic.branches.expansion +
              (loadout.element === 'air' ? (loadout.mastery ? 2 : 1) : 0),
      };
      s.attack = {
        id: c.nextId(),
        yaw: Math.atan2(hero.x - target.x, hero.z - target.z),
        age: 0,
        hits: new Set(),
        loadout,
      };
      s.cooldown = bp.cooldown;
    }
    if (s.attack && !s.attack.released && s.attack.age + 1e-8 >= definition.basic.windup && this.pendingBasic) {
      const a = this.pendingBasic;
      s.attack.released = true;
      const empowered = this.classId === 'mage' && s.passiveStacks >= (a.skill.finisher === 0 ? 2 : 3);
      if (this.classId === 'mage') s.passiveStacks = empowered ? 0 : s.passiveStacks + 1;
      if (empowered && a.loadout.element === 'earth' && !s.barrierCooldown) {
        this.barrier(MAGE_KIT.earth.guard[Math.max(0, Math.min(2, a.loadout.rank - 1))], 4);
        s.barrierCooldown = 6;
      }
      shoot(
        a.skill,
        a.p,
        a.loadout,
        a.multiplier * (empowered ? 1.6 : 1),
        hero,
        s.attack.yaw,
        this.classId === 'mage' ? 'spell' : 'arrow',
        {
          maxHits: Math.min(10, a.pierce),
          decay: 1,
          precision: this.classId === 'archer',
          timeout: a.skill.finisher === 0 ? 6 : 4,
          empowered,
          blast: empowered
            ? Math.min(
                1.7 * 1.8,
                (1.7 + a.skill.branches.expansion * 0.3 + (a.skill.mutation === 0 ? 0.4 : 0)) *
                  (1 + (this.stats.area ?? 0) * 0.04),
              )
            : 0,
          blastFactor: a.skill.finisher === 1 ? 1.6 : 1,
        },
      );
      if (this.classId === 'archer' && a.skill.mutation === 0)
        for (const side of [-1, 1])
          shoot(a.skill, a.p, a.loadout, a.multiplier * 0.4, hero, s.attack.yaw + side * 0.16, 'ability-extra');
      for (const mirror of this.actions.filter(a => a.p.id === 'mirror' && a.age < a.duration)) {
        mirror.casts++;
        if (mirror.casts % (mirror.skill.finisher === 0 ? 2 : 3) === 0) {
          flash('echo', `echo:${mirror.id}:${mirror.casts}`, { x: hero.x + 0.8, z: hero.z }, 0.6, s.attack.yaw);
          for (let j = 0; j < (mirror.skill.mutation === 0 ? 2 : 1); j++)
            shoot(
              a.skill,
              a.p,
              mirror.loadout,
              mirror.multiplier *
                (0.35 + mirror.skill.branches.expansion * 0.1) *
                (1 + mirror.skill.branches.power * 0.12) *
                (mirror.skill.finisher === 1 ? 1.6 : 1) *
                (mirror.skill.mutation === 0 ? 0.6 : 1),
              hero,
              s.attack.yaw + (j ? 0.08 : 0),
              'ability-extra',
              { maxHits: mirror.skill.mutation === 1 ? a.pierce + 2 : a.pierce },
            );
        }
      }
      c.emit(this.classId === 'mage' ? 'spell-cast' : 'arrow-shot', 0, empowered ? 1 : a.pierce, hero);
    }

    for (const skill of this.abilities.filter(a => a.id !== basic.id)) {
      const p = rangedParameters(skill, this.stats),
        id = p.id;
      const targets = near(hero, ['nova', 'guardian-orbs'].includes(id) ? p.radius : id === 'spike-trap' ? 8 : range);
      if (!targets.length || (this.classId === 'mage' && !c.loadout.element)) continue;
      const loadout = { ...c.loadout, pureElemental: this.classId === 'mage' };
      let count =
        id === 'cataclysm'
          ? 3 + skill.branches.specialization
          : id === 'rain'
            ? 4 + skill.branches.specialization + (skill.finisher === 0 ? 3 : 0)
            : id === 'runic-beam'
              ? 4 + (skill.finisher === 0 ? 3 : 0)
              : id === 'fragments'
                ? 4 + skill.branches.expansion + (skill.finisher === 1 ? 4 : 0)
                : 1;
      if ((id === 'cataclysm' || id === 'rain') && loadout.element === 'fire' && loadout.mastery) count += 2;
      let duration = p.duration;
      if (id === 'cataclysm' || id === 'rain') duration = 0.65 + count * 0.35;
      if (id === 'runic-beam') duration = count * 0.35;
      if (id === 'detonation')
        duration = Math.max(0.3, 0.7 - skill.branches.specialization * 0.1) + (skill.finisher === 0 ? 0.85 : 0.05);
      if (id === 'spike-trap') duration = 6;
      if (id === 'siege-shot') {
        const remaining = this.clock.remaining(skill.id);
        if (remaining > 0 && remaining <= 0.22)
          s.siegePose = { age: -remaining, yaw: Math.atan2(hero.x - targets[0].x, hero.z - targets[0].z) };
      }
      if (!this.clock.start(skill, true, duration, p.cooldown)) continue;
      const a: Action = {
        id: c.nextId(),
        skill,
        p,
        age: 0,
        duration,
        center: { x: targets[0].x, z: targets[0].z },
        origin: { x: hero.x, z: hero.z },
        yaw: Math.atan2(hero.x - targets[0].x, hero.z - targets[0].z),
        target: targets[0].id,
        multiplier: c.damageMultiplier * (this.classId === 'mage' ? 1 + 0.1 * Math.max(0, loadout.rank - 1) : 1),
        loadout,
        pulses: 0,
        count,
        nodes: [],
        struck: new Map(),
        casts: 0,
      };
      if (id === 'detonation' || id === 'spike-trap') {
        const n = id === 'spike-trap' ? 1 + skill.branches.expansion : skill.mutation === 0 ? 2 : 1;
        for (let j = 0; j < n; j++) {
          const t = targets[j];
          const point = t ?? { x: a.center.x + Math.cos(j * 2.4) * 1.3, z: a.center.z + Math.sin(j * 2.4) * 1.3 };
          if (clearPath(hero, point, solids, 0.1)) a.nodes.push({ x: point.x, z: point.z, uses: 0, last: new Map() });
        }
      }
      if (id === 'stakes')
        for (let j = 0; j < 3 + skill.branches.expansion; j++) {
          const n = 3 + skill.branches.expansion,
            angle = a.yaw + (j / Math.max(1, n - 1) - 0.5) * (skill.mutation === 0 ? Math.PI : Math.PI * 0.65);
          const point =
            skill.mutation === 1
              ? {
                  x:
                    hero.x - Math.sin(a.yaw) * (1.5 + Math.floor(j / 2) * 0.8) + Math.cos(a.yaw) * (j % 2 ? 0.8 : -0.8),
                  z:
                    hero.z - Math.cos(a.yaw) * (1.5 + Math.floor(j / 2) * 0.8) - Math.sin(a.yaw) * (j % 2 ? 0.8 : -0.8),
                }
              : { x: hero.x - Math.sin(angle) * 2.5, z: hero.z - Math.cos(angle) * 2.5 };
          if (clearPath(hero, point, solids, 0.1)) a.nodes.push({ ...point, uses: 0, last: new Map() });
        }
      if (id === 'guardian-orbs' && skill.finisher === 1) this.barrier(15, 5);
      if (id === 'nova' && skill.finisher === 1) {
        this.defenseUntil = this.time + 2;
        this.defenseBonus = 0.2;
      }
      if (id === 'siege-shot') s.siegePose = { age: 0, yaw: a.yaw };
      this.actions.push(a);
    }
    for (const a of this.actions) {
      const { skill, p } = a,
        id = p.id,
        b = skill.branches,
        m = skill.mutation,
        f = skill.finisher;
      if (id === 'cataclysm' || id === 'rain') {
        const masteryRadius = a.loadout.mastery
          ? a.loadout.element === 'water'
            ? this.classId === 'mage'
              ? 1.25
              : 1.2
            : a.loadout.element === 'air'
              ? this.classId === 'mage'
                ? 1.3
                : 1.25
              : 1
          : 1;
        const radius = Math.min(abilityData(skill.id).radius * 1.8, p.radius * masteryRadius);
        this.visuals.push({ id: `area:${a.id}`, kind: 'zone', ...a.center, radius, yaw: 0 });
        if (id === 'cataclysm' && m === 1 && !a.fractures) {
          // Both the telegraph and pulses use these fixed footprints for this cast.
          const lobeRadius = Math.min(2 * 1.8, (radius / abilityData(skill.id).radius) * 2);
          a.fractures = [-1, 1]
            .map(sign => ({
              x: a.center.x + Math.cos(a.yaw) * sign,
              z: a.center.z - Math.sin(a.yaw) * sign,
              radius: lobeRadius,
            }))
            .filter(point => clearPath(a.center, point, solids, 0.04));
        }
        s.area = {
          fractures: a.fractures,
          id: a.id,
          age: a.age,
          duration: a.duration,
          pulses: a.pulses,
          maxPulses: a.count,
          radius,
          center: a.center,
          yaw: a.yaw,
          loadout: a.loadout,
          multiplier: a.multiplier,
        };
        while (a.pulses < a.count && a.age + 1e-8 >= 0.65 + a.pulses * 0.35) {
          a.pulses++;
          const final = a.pulses === a.count,
            factor =
              (final && a.loadout.element === 'earth' && a.loadout.mastery ? 2 : 1) *
              (id === 'cataclysm' && final && f === 0 ? 2 : 1);
          if (a.fractures)
            for (const point of a.fractures) area(a, point, point.radius, factor * 0.55, false, 'cataclysm');
          else area(a, a.center, radius, factor, false, id === 'cataclysm' ? 'cataclysm' : 'rain');
        }
      } else if (id === 'guardian-orbs') {
        const n = 1 + b.expansion + (f === 0 ? 2 : 0);
        for (let j = 0; j < n; j++) {
          const outer = j >= 1 + b.expansion,
            angle = a.age * 4 * (m === 1 ? 1.5 : 1) + (j * Math.PI * 2) / n,
            radius = p.radius + (outer ? 0.6 : 0),
            point = { x: hero.x + Math.sin(angle) * radius, z: hero.z + Math.cos(angle) * radius };
          this.visuals.push({ id: `orb:${a.id}:${j}`, kind: 'orb', ...point, radius: 0.22, width: radius, yaw: angle });
          if (clearPath(hero, point, solids, 0.04))
            for (const e of near(point, 0.35))
              if (this.time - (a.struck.get(e.id) ?? -Infinity) >= 0.4) {
                a.struck.set(e.id, this.time);
                hit(
                  e,
                  p.damage * a.multiplier * (outer ? 0.35 : j ? 0.5 : 1),
                  outer ? 'ability-extra' : 'ability',
                  c.nextId(),
                  a.loadout,
                  hero,
                );
              }
        }
      } else if (id === 'detonation') {
        const delay = Math.max(0.3, 0.7 - b.specialization * 0.1);
        const residual = a.age >= delay;
        if (!residual || (f === 0 && a.age < delay + 0.8))
          for (const [j, node] of a.nodes.entries())
            this.visuals.push({
              id: `seal:${a.id}:${j}`,
              kind: 'seal',
              ...node,
              radius: p.radius,
              yaw: 0,
              phase: residual ? (a.age - delay) / 0.8 : a.age / delay,
              residual,
            });
        while (a.pulses < (f === 0 ? 2 : 1) && a.age + 1e-8 >= delay + a.pulses * 0.8) {
          const derived = a.pulses++ > 0;
          for (const [j, node] of a.nodes.entries()) {
            area(a, node, p.radius, (m === 0 ? 0.6 : 1) * (derived ? 0.4 : 1), derived);
            this.impactFlashes.push({
              birth: this.time,
              visual: {
                id: `seal-hit:${a.id}:${j}:${a.pulses}`,
                kind: 'seal-flash',
                ...node,
                radius: p.radius,
                yaw: 0,
                residual: derived,
              },
            });
          }
        }
      } else if (id === 'runic-beam') {
        const yaw = a.yaw + (m === 0 ? ((Math.min(1, a.age / a.duration) - 0.5) * Math.PI) / 4 : 0),
          angles = m === 1 ? [yaw - 0.22, yaw + 0.22] : [yaw];
        s.beamYaw = yaw;
        for (const [j, angle] of angles.entries())
          this.visuals.push({
            id: `beam:${a.id}:${j}`,
            kind: 'beam',
            x: a.origin.x - (Math.sin(angle) * p.radius) / 2,
            z: a.origin.z - (Math.cos(angle) * p.radius) / 2,
            radius: p.radius,
            width: p.width,
            phase: (a.age % 0.35) / 0.35,
            yaw: angle,
          });
        while (a.pulses < a.count && a.age + 1e-8 >= a.pulses * 0.35) {
          a.pulses++;
          const shotId = c.nextId();
          for (const angle of angles) {
            const end = { x: a.origin.x - Math.sin(angle) * p.radius, z: a.origin.z - Math.cos(angle) * p.radius },
              targets = near(a.origin, p.radius)
                .filter(e => segmentDistance(a.origin, end, e) <= p.width / 2 + e.radius)
                .slice(0, 4 + b.specialization);
            for (const e of targets)
              hit(
                e,
                p.damage * a.multiplier * (m === 1 ? 0.6 : 1) * (f === 1 && targets.length === 1 ? 1.75 : 1),
                'ability',
                shotId,
                a.loadout,
                a.origin,
              );
          }
        }
      } else if (id === 'nova') {
        while (a.pulses < (m === 0 ? 2 : 1) && a.age + 1e-8 >= a.pulses * 0.6) {
          const derived = a.pulses++ > 0;
          area(a, a.origin, p.radius, derived ? 0.4 : 1, derived);
        }
      } else if (id === 'fragments') {
        const original = 4 + b.expansion;
        while (a.pulses < a.count && a.age + 1e-8 >= (a.pulses * 2) / a.count) {
          const index = a.pulses++,
            moving = alive.find(e => e.id === a.target);
          if (m === 1 && moving && clearPath(a.origin, moving, solids, 0.04)) a.center = { x: moving.x, z: moving.z };
          const final = index === a.count - 1,
            point = final
              ? a.center
              : {
                  x: a.center.x + Math.sin(index * 2.4) * p.radius * 0.55,
                  z: a.center.z + Math.cos(index * 2.4) * p.radius * 0.55,
                };
          if (clearPath(a.center, point, solids, 0.04))
            area(
              a,
              point,
              final && f === 0 ? 1.5 : 0.9,
              final && f === 0 ? 3 : index >= original ? 0.5 : 1,
              index >= original,
            );
        }
        if (a.pulses < a.count) {
          const until = (a.pulses * 2) / a.count - a.age;
          const final = a.pulses === a.count - 1;
          const center = m === 1 ? (alive.find(e => e.id === a.target) ?? a.center) : a.center;
          const point = final
            ? center
            : {
                x: center.x + Math.sin(a.pulses * 2.4) * p.radius * 0.55,
                z: center.z + Math.cos(a.pulses * 2.4) * p.radius * 0.55,
              };
          if (until <= 0.28 && clearPath(a.center, point, solids, 0.04))
            this.visuals.push({
              kind: 'crystal-fall',
              id: `fall:${a.id}:${a.pulses}`,
              x: point.x,
              z: point.z,
              radius: final && f === 0 ? 1.5 : 0.9,
              yaw: a.yaw,
              phase: 1 - until / 0.28,
            });
        }
        this.visuals.push({ id: `fragments:${a.id}`, kind: 'zone', ...a.center, radius: p.radius, yaw: 0 });
      } else if (id === 'mirror')
        this.visuals.push({
          id: `mirror:${a.id}`,
          kind: 'mirror',
          x: hero.x + 0.8,
          z: hero.z,
          radius: 0.6,
          yaw: hero.yaw,
        });
      else if (id === 'hunting-beacon') {
        const target = alive.find(e => e.id === a.target);
        if (m === 0 && target && clearPath(a.center, target, solids, 0.04)) a.center = { x: target.x, z: target.z };
        for (const e of near(a.center, p.radius))
          this.marks.set(e.id, {
            bonus: p.banner + (f === 0 && (e.kind === 'elite' || e.kind === 'boss') ? 0.15 : 0),
            until: this.time + (f === 1 ? 2 : this.dt * 1.5),
          });
        this.visuals.push({ id: `beacon:${a.id}`, kind: 'beacon', ...a.center, radius: p.radius, yaw: 0 });
      } else if (id === 'spike-trap') {
        for (const [j, node] of a.nodes.entries()) {
          const factor = j ? 0.5 : 1;
          if (node.triggered === undefined && a.age >= 0.6 && near(node, p.radius).length) {
            node.triggered = a.age;
            area(a, node, p.radius, factor * (f === 1 ? 1.7 : 1));
          }
          if (node.triggered !== undefined && m === 1)
            while (node.uses < 2 && a.age >= node.triggered + node.uses + 1) {
              node.uses++;
              area(a, node, p.radius, factor * 0.25, true);
            }
          if (node.triggered === undefined || (m === 1 && a.age < node.triggered + 2))
            this.visuals.push({
              id: `trap:${a.id}:${j}`,
              kind: 'trap',
              ...node,
              radius: p.radius,
              yaw: 0,
              ready: a.age >= 0.6,
              phase: Math.min(1, a.age / 0.6),
            });
        }
      } else if (id === 'stakes') {
        for (const [j, node] of a.nodes.entries())
          if (node.uses < (f === 0 ? 2 : 1)) {
            this.visuals.push({
              id: `stake:${a.id}:${j}`,
              kind: 'stake',
              ...node,
              radius: 0.4,
              yaw: a.yaw,
              phase: Math.max(0, Math.min(1, (a.age - j * 0.045) / 0.18)),
            });
            const e = alive.find(
              e =>
                segmentDistance(e.previous, e, node) <= 0.35 + e.radius &&
                clearPath(node, e, solids, 0.04) &&
                this.time - (node.last.get(e.id) ?? -Infinity) >= 0.8,
            );
            if (e) {
              node.uses++;
              node.last.set(e.id, this.time);
              flash('stake-hit', `stake-hit:${a.id}:${j}:${node.uses}`, node, 0.4, a.yaw);
              hit(e, p.damage * a.multiplier, 'ability', c.nextId(), a.loadout, node);
              if (f === 1) area(a, node, 1, 0.4, true);
            }
          }
      } else {
        const repeats = id === 'fan-volley' && f === 0 ? 2 : 1;
        while (a.pulses < repeats && a.age + 1e-8 >= a.pulses * 0.3) {
          const repeat = a.pulses++ > 0,
            source = repeat ? 'ability-extra' : 'ability';
          const count =
            id === 'arcane-lances'
              ? 1 + b.expansion
              : id === 'fan-volley'
                ? 3 + b.expansion * 2
                : id === 'return-arrows'
                  ? 2 + b.expansion
                  : id === 'ricochet' && f === 1
                    ? 2
                    : 1;
          for (let j = 0; j < count; j++) {
            const offset = j === 0 ? 0 : (j % 2 ? 1 : -1) * Math.ceil(j / 2),
              spread =
                id === 'fan-volley'
                  ? ((m === 0 ? 25 : m === 1 ? 110 : 55) * Math.PI) / 180 / Math.max(2, count - 1)
                  : m === 1
                    ? (50 * Math.PI) / 180 / Math.max(1, count - 1)
                    : 0.14;
            const parallel = id === 'return-arrows' || (id === 'arcane-lances' && m === 0);
            const origin = parallel
              ? {
                  x: a.origin.x + Math.cos(a.yaw) * offset * (id === 'return-arrows' && m === 0 ? 1.35 : 0.35),
                  z: a.origin.z - Math.sin(a.yaw) * offset * (id === 'return-arrows' && m === 0 ? 1.35 : 0.35),
                }
              : a.origin;
            const factor =
              (repeat ? 0.5 : 1) *
              (j
                ? id === 'fan-volley'
                  ? j <= 2
                    ? 0.4
                    : 0.35
                  : id === 'return-arrows'
                    ? j === 1
                      ? 1
                      : 0.45
                    : id === 'ricochet'
                      ? 0.45
                      : 0.4
                : 1);
            const pierce =
              id === 'arcane-lances' || id === 'return-arrows'
                ? 2 + b.specialization
                : id === 'siege-shot'
                  ? 4 + b.expansion
                  : id === 'fan-volley'
                    ? 1 + b.specialization
                    : 1;
            shoot(
              skill,
              p,
              a.loadout,
              a.multiplier * factor,
              origin,
              a.yaw + (parallel ? 0 : offset * spread),
              source,
              {
                lateral: j !== 0,
                maxHits: Math.min(10, pierce),
                decay:
                  (id === 'arcane-lances' && f === 1) || (id === 'siege-shot' && f === 0) || id === 'ricochet'
                    ? 1
                    : 0.85,
                firstBonus: id === 'arcane-lances' && f === 0 ? 1.8 : 1,
                eliteBonus: id === 'siege-shot' && m === 0 ? 1.35 : 1,
                width: 0.09 + (id === 'siege-shot' && m === 1 ? 0.25 : 0),
                endBlast: id === 'siege-shot' && f === 1 ? 0.75 : 0,
                legs: id === 'return-arrows' ? (f === 0 ? 3 : 2) : 1,
                legFactor: id === 'return-arrows' && m === 1 ? 1.5 : 1,
                bounceLeft: id === 'ricochet' ? 2 + b.expansion : 0,
                bounceRange: 3 + b.specialization * 0.5,
              },
            );
          }
        }
      }
    }
    if (this.impactFlashes.length) {
      this.impactFlashes = this.impactFlashes.filter(flash => this.time - flash.birth < 0.28);
      for (const flash of this.impactFlashes)
        this.visuals.push({ ...flash.visual, phase: (this.time - flash.birth) / 0.28 });
    }
    if (this.marks.size || this.time < this.trapSlowUntil)
      for (const e of alive) {
        if (this.visuals.length >= 64) break;
        if ((e.trapSlowRemaining ?? 0) > 0)
          this.visuals.push({ kind: 'snared', id: `snared:${e.id}`, x: e.x, z: e.z, radius: e.radius, yaw: e.yaw });
        if (this.targetBonus(e) > 0)
          this.visuals.push({ kind: 'mark', id: `mark:${e.id}`, x: e.x, z: e.z, radius: e.radius, yaw: 0 });
      }
    return hits;
  }
  finishStep() {
    this.actions = this.actions.filter(a => a.age + 1e-8 < a.duration);
    const initial = `${this.classId}:${this.classId === 'mage' ? 'cataclysm' : 'rain'}`;
    if (!this.actions.some(a => a.skill.id === initial)) this.state.area = undefined;
    this.state.skillCooldown = this.state.area ? 0 : this.clock.remaining(initial);
  }
  cancel() {
    this.impactFlashes.length = 0;
    this.trapSlowUntil = 0;
    this.state.siegeTrail = undefined;
    this.state.siegePose = undefined;
    this.state.beamYaw = undefined;
    this.stopped = true;
    this.clock.stop();
    this.actions = [];
    this.marks.clear();
    this.visuals = [];
    this.pendingBasic = undefined;
    this.state.projectiles.length = 0;
    this.state.attack = undefined;
    this.state.area = undefined;
    this.state.barrier = undefined;
    this.state.passiveStacks = 0;
    this.state.passiveRemaining = 0;
    this.defenseBonus = 0;
  }
}
