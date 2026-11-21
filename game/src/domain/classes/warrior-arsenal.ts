import { WARRIOR, WARRIOR_KIT as K } from '../../content/classes/warrior.ts';
import { warriorParameters as parameters } from '../../content/warrior-abilities.ts';
import type { GeneralRanks } from '../../content/warrior-abilities.ts';
import type { AbilityState } from '../ability-book.ts';
import { AbilityBook } from '../ability-book.ts';
import { AbilityClock } from '../ability-clock.ts';
import type { HeroKit, HeroKitContext, HeroKitState, HeroHit } from '../hero-kit.ts';
import type { ElementalLoadout } from '../../content/elements.ts';
import type { Bounds, Point } from '../movement.ts';
import { clearPath } from '../navigation.ts';
import { inArc, chooseTarget } from '../targeting.ts';
import { segmentDistance } from '../projectiles.ts';
import { displaceFrom } from '../forced-movement.ts';
import { ENEMIES } from '../../content/enemies.ts';

type Params = ReturnType<typeof parameters>;
type Action = {
  id: number;
  skill: AbilityState;
  p: Params;
  age: number;
  origin: Point;
  yaw: number;
  loadout: ElementalLoadout;
  multiplier: number;
  pulses: number;
  struck: Map<number, number>;
  done?: boolean;
  links?: { id: string; target: Point }[];
};
type Blade = {
  action: Action;
  point: Point;
  origin: Point;
  dx: number;
  dz: number;
  distance: number;
  returning: boolean;
  factor: number;
  hits: Set<number>;
  count: number;
};
export type ArsenalVisual = Readonly<{
  id: string;
  kind: string;
  x: number;
  z: number;
  radius: number;
  yaw: number;
  phase?: number;
  damageFraction?: number;
}>;
export class WarriorArsenal implements HeroKit {
  readonly state: HeroKitState = { cooldown: 0, passiveStacks: 0, passiveRemaining: 0, skillCooldown: 0 };
  abilities: readonly AbilityState[] = new AbilityBook('warrior').snapshot;
  stats: GeneralRanks = {};
  readonly clock = new AbilityClock();
  private actions: Action[] = [];
  private blades: Blade[] = [];
  private dt = 0;
  private time = 0;
  private bannerUntil = 0;
  private bannerPower = 0;
  damageBonus = 0;
  defenseBonus = 0;
  private wardAt = 0;
  private stopped = false;
  private backhand = false;
  private spearHits: { birth: number; visual: ArsenalVisual }[] = [];
  private guardWave?: { birth: number; visual: ArsenalVisual };
  private visuals: ArsenalVisual[] = [];
  private bounds: Bounds;
  constructor(bounds: Bounds) {
    this.bounds = bounds;
  }
  get presentation(): readonly ArsenalVisual[] {
    return this.visuals;
  }
  private barrier(amount: number, duration: number) {
    this.state.barrier = {
      amount: Math.min(40, Math.max(amount, this.state.barrier?.amount ?? 0)),
      remaining: Math.min(5, Math.max(duration, this.state.barrier?.remaining ?? 0)),
    };
  }
  advance(dt: number) {
    this.dt = dt;
    this.time += dt;
    this.clock.step(dt);
    this.state.cooldown = Math.max(0, this.state.cooldown - dt);
    this.state.passiveRemaining = Math.max(0, this.state.passiveRemaining - dt);
    if (!this.state.passiveRemaining) this.state.passiveStacks = 0;
    if (this.state.attack) {
      this.state.attack.age += dt;
      if (this.state.attack.age >= 0.42) this.state.attack = undefined;
    }
    if (this.state.barrier) {
      this.state.barrier.remaining -= dt;
      if (this.state.barrier.remaining <= 0) this.state.barrier = undefined;
    }
    this.state.barrierCooldown = Math.max(0, (this.state.barrierCooldown ?? 0) - dt);
    for (const a of this.actions) a.age += dt;
  }
  act(c: HeroKitContext): HeroHit[] {
    if (this.stopped) return [];
    const hits: HeroHit[] = [],
      { hero, alive, solids } = c;
    this.visuals = [];
    this.damageBonus = 0;
    this.defenseBonus = 0;
    if ((this.stats.ward ?? 0) > 0 && this.time >= this.wardAt) {
      this.barrier(this.stats.ward! * 4, 5);
      this.wardAt = this.time + 25;
    }
    const nearby = (center: Point, r: number) =>
      alive.filter(
        e => Math.hypot(e.x - center.x, e.z - center.z) <= r + e.radius && clearPath(center, e, solids, 0.04),
      );
    const hit = (
      a: Action,
      target: (typeof alive)[number],
      amount: number,
      derived = false,
      origin: Point = a.origin,
      source: HeroHit['source'] = 'ability',
    ) =>
      hits.push({
        target,
        amount: amount * a.multiplier,
        source: derived ? 'ability-extra' : source,
        attackId: c.nextId(),
        loadout: a.loadout,
        origin,
      });
    const ring = (a: Action, center: Point, factor = 1, derived = false) => {
      for (const e of nearby(center, a.p.radius)) {
        let boost = 1;
        if (a.p.id === 'war-hammer')
          boost *=
            (e.kind === 'elite' || e.kind === 'boss' ? 1 + a.skill.branches.specialization * 0.15 : 1) *
            (a.skill.finisher === 1 && e.hp < e.maxHp * 0.35 ? 1.75 : 1);
        if (a.p.id === 'whirlwind' && a.skill.finisher === 1 && Math.hypot(e.x - hero.x, e.z - hero.z) <= 1.2)
          boost *= 1.6;
        hit(a, e, a.p.damage * factor * boost, derived, center, a.p.id === 'whirlwind' ? 'whirlwind' : 'ability');
      }
      c.emit('ability-pulse', 0, a.p.radius, center, 'ability', a.id);
    };
    // Auras are sampled before taking new damage snapshots; no feedback into themselves.
    for (const a of this.actions.filter(a => a.p.id === 'war-banner' && a.age < a.p.duration)) {
      const center = a.skill.mutation === 0 ? hero : a.origin;
      if (Math.hypot(hero.x - center.x, hero.z - center.z) <= a.p.radius) {
        this.damageBonus = a.p.banner;
        if (a.skill.finisher === 0) this.defenseBonus = 0.15;
        if (a.skill.finisher === 1) {
          this.bannerUntil = this.time + 3;
          this.bannerPower = a.p.banner;
        }
      }
    }
    if (this.time < this.bannerUntil) this.damageBonus = Math.max(this.damageBonus, this.bannerPower);
    const basic = this.abilities.find(s => s.id === 'warrior:sword')!;
    const bp = parameters(basic, this.stats),
      rank = Math.max(0, Math.min(2, c.loadout.rank - 1));
    const reach = Math.min(
      WARRIOR.basic.range * 1.75,
      bp.radius + (c.loadout.element === 'air' ? K.air.reach[rank] : 0),
    );
    this.state.targetId = chooseTarget(hero, alive, this.state.targetId, solids, reach);
    const target = alive.find(e => e.id === this.state.targetId);
    if (!this.state.attack && this.state.cooldown <= 1e-8 && target) {
      this.backhand = !this.backhand;
      this.state.attack = {
        swordStroke: basic.mutation === 1 ? 'thrust' : this.backhand ? 'cut' : 'backhand',
        id: c.nextId(),
        yaw: Math.atan2(hero.x - target.x, hero.z - target.z),
        age: 0,
        hits: new Set(),
        multiplier: bp.damage * c.damageMultiplier * (1 + this.damageBonus) * (1 + this.state.passiveStacks * 0.05),
        range: reach,
        arc: WARRIOR.basic.arc + ((basic.branches.expansion * 30 + (basic.mutation === 0 ? 30 : 0)) * Math.PI) / 180,
        loadout: c.loadout,
        impetusTimeout: basic.finisher === 0 ? 5 : 3,
      };
      this.state.cooldown = bp.cooldown;
    }
    const swing = this.state.attack;
    if (swing && swing.age >= 0.12 - 1e-8 && swing.age < 0.24 - 1e-8) {
      for (const e of alive)
        if (
          !swing.hits.has(e.id) &&
          inArc(hero, e, swing.yaw, swing.range!, swing.arc!, e.radius) &&
          clearPath(hero, e, solids, 0.04)
        ) {
          swing.hits.add(e.id);
          hits.push({
            target: e,
            amount: swing.multiplier!,
            source: 'basic',
            attackId: swing.id,
            loadout: swing.loadout,
          });
        }
      if (swing.hits.size && !swing.impetusGranted) {
        swing.impetusGranted = true;
        this.state.passiveStacks = Math.min(4, this.state.passiveStacks + 1);
        this.state.passiveRemaining = swing.impetusTimeout!;
        if (swing.loadout?.element === 'earth' && !this.state.barrierCooldown) {
          this.barrier(K.earth.guard[Math.max(0, Math.min(2, swing.loadout.rank - 1))], 4);
          this.state.barrierCooldown = 6;
        }
      }
    }
    for (const skill of this.abilities.filter(s => s.id !== 'warrior:sword')) {
      const remaining = this.clock.remaining(skill.id);
      // Only the hammer needs a target preview during the last part of its cooldown.
      if (remaining > 0 && (skill.id !== 'warrior:war-hammer' || remaining > 0.24)) continue;
      const p = parameters(skill, this.stats),
        enemies = nearby(
          hero,
          p.id === 'retaliation' ? 8 : p.id === 'war-banner' ? 12 : p.id === 'war-hammer' ? p.radius + 3.5 : p.radius,
        ).sort((a, b) => Math.hypot(a.x - hero.x, a.z - hero.z) - Math.hypot(b.x - hero.x, b.z - hero.z));
      if (!enemies.length) continue;
      let duration = p.duration;
      const actual = { ...p };
      if (p.id === 'whirlwind') {
        const extra = c.loadout.mastery && c.loadout.element === 'fire' ? 2 : 0;
        duration += extra * 0.4 + (skill.finisher === 0 ? 1.2 : 0);
        actual.radius = Math.min(
          2.6 * 1.8,
          p.radius *
            (c.loadout.mastery ? (c.loadout.element === 'water' ? 1.2 : c.loadout.element === 'air' ? 1.25 : 1) : 1),
        );
      }
      if (p.id === 'war-hammer') {
        if (remaining > 0 && remaining <= 0.24 && !this.actions.some(a => a.skill.id === skill.id)) {
          const yaw = Math.atan2(hero.x - enemies[0].x, hero.z - enemies[0].z);
          const distance = skill.mutation === 1 ? 0 : skill.mutation === 0 ? 3 : 1.5;
          const center = { x: hero.x - Math.sin(yaw) * distance, z: hero.z - Math.cos(yaw) * distance };
          if (clearPath(hero, center, solids, 0.04))
            this.visuals.push({
              kind: 'hammer',
              id: 'hammer-windup',
              ...center,
              radius: p.radius,
              yaw,
              phase: -remaining,
            });
        }
      }
      if (!this.clock.start(skill, true, duration, p.cooldown)) continue;
      const a: Action = {
        id: c.nextId(),
        skill,
        p: { ...actual, duration },
        age: 0,
        origin: { x: hero.x, z: hero.z },
        yaw: Math.atan2(hero.x - enemies[0].x, hero.z - enemies[0].z),
        loadout: c.loadout,
        multiplier: c.damageMultiplier * (1 + this.damageBonus),
        pulses: 0,
        struck: new Map(),
      };
      this.actions.push(a);
      if (p.id === 'retaliation') this.barrier(p.barrier, duration);
      if (p.id === 'steel-wave' || p.id === 'spectral-spears') {
        for (let i = 0; i < p.count && this.blades.length < 32; i++) {
          const selected =
            p.id === 'spectral-spears' && skill.mutation !== 0 ? enemies[i % enemies.length] : enemies[0];
          const yaw =
            Math.atan2(hero.x - selected.x, hero.z - selected.z) +
            (p.id === 'steel-wave' && i
              ? (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (skill.mutation === 0 ? 0.45 : 0.2)
              : 0);
          const origin =
            p.id === 'spectral-spears' && skill.mutation === 0
              ? {
                  x: hero.x + Math.cos(yaw) * (i - (p.count - 1) / 2) * 0.35,
                  z: hero.z - Math.sin(yaw) * (i - (p.count - 1) / 2) * 0.35,
                }
              : { x: hero.x, z: hero.z };
          if (!clearPath(hero, origin, solids, 0.04)) continue;
          this.blades.push({
            action: a,
            origin,
            point: { ...origin },
            dx: -Math.sin(yaw),
            dz: -Math.cos(yaw),
            distance: 0,
            returning: false,
            factor: i ? (p.id === 'steel-wave' ? 0.4 : 0.45) : 1,
            hits: new Set(),
            count: 0,
          });
        }
      }
    }
    for (const a of this.actions) {
      const { p, skill } = a;
      if (p.id === 'whirlwind') {
        const original =
          6 + skill.branches.specialization + (a.loadout.mastery && a.loadout.element === 'fire' ? 2 : 0);
        while (a.pulses < original + (skill.finisher === 0 ? 3 : 0) && a.age + 1e-8 >= a.pulses * 0.4) {
          const derived = a.pulses >= original;
          a.pulses++;
          ring(a, hero, derived ? 0.5 : 1, derived);
          if (!derived && a.loadout.element === 'earth' && a.loadout.mastery && a.pulses % 2 === 0)
            for (const e of nearby(hero, 3.2)) hit(a, e, 8, false, hero, 'quake');
        }
        this.state.area = {
          id: a.id,
          age: a.age,
          pulses: a.pulses,
          yaw: a.yaw,
          radius: p.radius,
          duration: p.duration,
          maxPulses: original,
          loadout: a.loadout,
        };
      } else if (p.id === 'war-hammer') {
        const center =
          skill.mutation === 1
            ? a.origin
            : {
                x: a.origin.x - Math.sin(a.yaw) * (skill.mutation === 0 ? 3 : 1.5),
                z: a.origin.z - Math.cos(a.yaw) * (skill.mutation === 0 ? 3 : 1.5),
              };
        if (a.pulses === 0) {
          if (clearPath(a.origin, center, solids, 0.04)) ring(a, center);
          a.pulses++;
        }
        if (skill.finisher === 0 && a.pulses === 1 && a.age >= 0.6) {
          if (clearPath(a.origin, center, solids, 0.04)) ring(a, center, 0.5, true);
          a.pulses++;
        }
        this.visuals.push({
          id: `hammer:${a.id}`,
          kind: 'hammer',
          ...center,
          radius: p.radius,
          yaw: a.yaw,
          phase: a.age - (a.pulses > 1 ? 0.6 : 0),
        });
      } else if (p.id === 'orbiting-axes') {
        const count = p.count + (skill.finisher === 0 ? 2 : 0);
        for (let i = 0; i < count; i++) {
          const outer = i >= p.count,
            angle = this.time * (skill.mutation === 1 ? 5.4 : 3.6) + (i * Math.PI * 2) / count;
          const pos = {
            x: hero.x + Math.sin(angle) * p.radius * (outer ? 1.35 : 1),
            z: hero.z + Math.cos(angle) * p.radius * (outer ? 1.35 : 1),
          };
          this.visuals.push({ id: `axe:${a.id}:${i}`, kind: 'axe', ...pos, radius: 0.45, yaw: angle });
          if (!clearPath(hero, pos, solids, 0.08)) continue;
          for (const e of nearby(pos, 0.45))
            if (this.time - (a.struck.get(e.id) ?? -Infinity) >= 0.4) {
              a.struck.set(e.id, this.time);
              hit(a, e, p.damage * (outer ? 0.35 : i ? 0.5 : 1), outer, hero);
            }
        }
      } else if (p.id === 'war-banner') {
        const center = skill.mutation === 0 ? hero : a.origin;
        this.visuals.push({ id: `banner:${a.id}`, kind: 'banner', ...center, radius: p.radius, yaw: 0, phase: a.age });
      } else if (p.id === 'retaliation') {
        if (this.state.barrier && a.age < p.duration) {
          this.visuals.push({
            id: `guard:${a.id}`,
            kind: 'guard',
            x: hero.x,
            z: hero.z,
            radius: 0.76,
            yaw: hero.yaw,
            phase: Math.min(1, a.age / 0.16),
            damageFraction: Math.max(0, 1 - this.state.barrier.amount / p.barrier),
          });
        }
        if (!a.pulses && (skill.mutation === 1 || !this.state.barrier || a.age + 1e-8 >= p.duration)) {
          ring(a, hero);
          this.guardWave = {
            birth: this.time,
            visual: {
              id: `guard-wave:${a.id}`,
              kind: 'guard-wave',
              x: hero.x,
              z: hero.z,
              radius: p.radius,
              yaw: hero.yaw,
            },
          };
          a.pulses++;
        }
        if (!this.state.barrier) {
          this.clock.finish(skill.id);
          a.done = true;
        }
      } else if (p.id === 'war-chain') {
        if (!a.links) {
          a.links = [];
          a.pulses++;
          const targets = nearby(hero, p.radius)
            .sort((x, y) => Math.hypot(x.x - hero.x, x.z - hero.z) - Math.hypot(y.x - hero.x, y.z - hero.z))
            .slice(0, p.count);
          for (let i = 0; i < targets.length; i++) {
            const e = targets[i];
            hit(a, e, p.damage * (i ? 0.5 : 1));
            if (skill.finisher === 0) hits[hits.length - 1].exposeDuration = 2;
            if (e.pushProtection <= 1e-8) {
              displaceFrom(
                e,
                hero,
                -(0.6 + skill.branches.specialization * 0.15) * ENEMIES[e.kind].push,
                this.bounds,
                solids,
                hero,
              );
              e.pushProtection = 0.5;
            }
            a.links.push({ id: `chain:${a.id}:${i}`, target: e });
          }
          if (skill.finisher === 1 && targets[0])
            for (const e of nearby(targets[0], 3)
              .filter(e => !targets.includes(e))
              .slice(0, 2))
              hit(a, e, p.damage * 0.35, true, targets[0]);
        }
        for (const { id, target } of a.links) {
          this.visuals.push({
            id,
            kind: 'chain',
            x: (hero.x + target.x) / 2,
            z: (hero.z + target.z) / 2,
            radius: Math.hypot(hero.x - target.x, hero.z - target.z) / 2,
            yaw: Math.atan2(hero.x - target.x, hero.z - target.z),
            phase: a.age / p.duration,
          });
        }
      }
    }
    for (let i = this.blades.length - 1; i >= 0; i--) {
      const b = this.blades[i],
        a = b.action,
        p = a.p;
      const travel = Math.min(p.speed * this.dt, p.radius - b.distance),
        old = { ...b.point };
      const next = { x: old.x + b.dx * travel, z: old.z + b.dz * travel };
      const blocked =
        !clearPath(old, next, solids, 0.12) ||
        next.x < this.bounds.minX ||
        next.x > this.bounds.maxX ||
        next.z < this.bounds.minZ ||
        next.z > this.bounds.maxZ;
      if (!blocked) {
        b.point = next;
        b.distance += travel;
        const candidates = alive
          .filter(
            e =>
              !b.hits.has(e.id) && segmentDistance(old, next, e) <= e.radius + 0.18 && clearPath(old, e, solids, 0.04),
          )
          .sort((x, y) => Math.hypot(x.x - old.x, x.z - old.z) - Math.hypot(y.x - old.x, y.z - old.z));
        for (const e of candidates) {
          const decay = a.p.id === 'spectral-spears' && a.skill.finisher === 1 ? 1 : Math.max(0.25, 0.85 ** b.count);
          const first = b.count === 0 && a.skill.finisher === 0 ? (p.id === 'steel-wave' ? 2 : 1.8) : 1;
          hit(a, e, p.damage * b.factor * decay * first * (b.returning ? 0.4 : 1), false, b.origin);
          if (p.id === 'spectral-spears')
            this.spearHits.push({
              birth: this.time,
              visual: {
                kind: 'spear-hit',
                id: `spear-hit:${a.id}:${i}:${e.id}`,
                x: b.point.x,
                z: b.point.z,
                radius: e.radius,
                yaw: Math.atan2(-b.dx, -b.dz),
              },
            });
          b.hits.add(e.id);
          b.count++;
          if (b.count >= p.pierce) break;
        }
      }
      this.visuals.push({
        id: `blade:${a.id}:${i}`,
        kind: p.id === 'steel-wave' ? 'wave' : 'spear',
        phase: b.returning ? -1 : b.distance,
        ...b.point,
        radius: 0.55,
        yaw: Math.atan2(-b.dx, -b.dz),
      });
      if (blocked || b.distance >= p.radius - 1e-8 || b.count >= p.pierce) {
        if (!blocked && !b.returning && p.id === 'steel-wave' && a.skill.mutation === 1) {
          b.returning = true;
          b.dx *= -1;
          b.dz *= -1;
          b.distance = p.radius - b.distance;
          b.hits.clear();
          b.count = 0;
        } else {
          if (p.id === 'steel-wave' && a.skill.finisher === 1)
            for (const e of nearby(b.point, 2)) hit(a, e, p.damage * b.factor * 0.6, true, b.point);
          this.blades.splice(i, 1);
        }
      }
    }
    if (this.damageBonus > 0)
      this.visuals.push({ id: 'standard-bonus', kind: 'standard-bonus', x: hero.x, z: hero.z, radius: 0.18, yaw: 0 });
    if (this.spearHits.length) {
      this.spearHits = this.spearHits.filter(h => this.time - h.birth < 0.25);
      for (const h of this.spearHits) this.visuals.push({ ...h.visual, phase: (this.time - h.birth) / 0.25 });
    }
    if (this.guardWave) {
      const phase = (this.time - this.guardWave.birth) / 0.32;
      if (phase < 1) this.visuals.push({ ...this.guardWave.visual, phase });
      else this.guardWave = undefined;
    }
    return hits;
  }
  finishStep() {
    this.actions = this.actions.filter(a => !a.done && a.age + 1e-8 < a.p.duration);
    if (!this.actions.some(a => a.p.id === 'whirlwind')) this.state.area = undefined;
    this.state.skillCooldown = this.state.area ? 0 : this.clock.remaining('warrior:whirlwind');
  }
  cancel() {
    this.spearHits.length = 0;
    this.guardWave = undefined;
    this.stopped = true;
    this.clock.stop();
    this.actions = [];
    this.blades = [];
    this.visuals = [];
    this.state.area = undefined;
    this.state.attack = undefined;
    this.state.barrier = undefined;
    this.damageBonus = this.defenseBonus = 0;
  }
}
