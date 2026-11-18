import { techniqueValue as value } from '../../content/techniques.ts';
import { ARCHER, ARCHER_KIT as K, archerRange, arrowSpeed, arrowArmorIgnore } from '../../content/classes/archer.ts';
import type { HeroKit, HeroKitState, HeroKitContext, HeroHit, HeroProjectile } from '../hero-kit.ts';
import { chooseTarget } from '../targeting.ts';
import { clearPath } from '../navigation.ts';
import { segmentDistance } from '../projectiles.ts';

export type Arrow = HeroProjectile & { hitIds: Set<number>; maxHits: number; grantsPrecision?: boolean };
/** Precision counts successful arrows, never individual pierced targets or rain pulses. */
export class ArcherKit implements HeroKit {
  readonly state: Omit<HeroKitState, 'projectiles'> & { projectiles: Arrow[] } = {
    cooldown: 0,
    passiveStacks: 0,
    passiveRemaining: 0,
    skillCooldown: 0,
    projectiles: [],
  };
  private dt = 0;
  advance(dt: number) {
    this.dt = dt;
    const s = this.state;
    s.cooldown = Math.max(0, s.cooldown - dt);
    s.passiveRemaining = Math.max(0, s.passiveRemaining - dt);
    if (s.passiveRemaining <= 1e-8) {
      s.passiveStacks = 0;
      s.passiveRemaining = 0;
    }
    if (s.area) s.area.age += dt;
    else s.skillCooldown = Math.max(0, s.skillCooldown - dt);
    if (s.attack) {
      s.attack.age += dt;
      if (s.attack.age >= ARCHER.basic.duration) s.attack = undefined;
    }
  }
  act(c: HeroKitContext): HeroHit[] {
    const s = this.state,
      hits: HeroHit[] = [];
    // Release order is deterministic, including a missed older arrow resetting Precision.
    for (let i = 0; i < s.projectiles.length; ) {
      const p = s.projectiles[i];
      p.previous = { x: p.x, z: p.z };
      const travel = Math.min(this.dt, Math.max(0, K.projectile.lifetime - p.age));
      p.age += this.dt;
      const steps = Math.max(1, Math.ceil((arrowSpeed(p.loadout) * travel) / 0.04));
      let removed = false;
      for (let j = 0; j < steps && !removed; j++) {
        const to = { x: p.x + (p.vx * travel) / steps, z: p.z + (p.vz * travel) / steps };
        if (!clearPath(p, to, c.solids, K.projectile.radius)) {
          removed = true;
          break;
        }
        const targets = c.alive
          .filter(e => !p.hitIds.has(e.id) && segmentDistance(p, to, e) <= e.radius + K.projectile.radius)
          .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z) || a.id - b.id);
        p.x = to.x;
        p.z = to.z;
        for (const target of targets) {
          if (!p.hitIds.size && p.grantsPrecision !== false) {
            s.passiveStacks = Math.min(K.precision.maxStacks, s.passiveStacks + 1);
            s.passiveRemaining = K.precision.timeout;
          }
          p.hitIds.add(target.id);
          hits.push({
            target,
            amount: p.damage,
            source: 'arrow',
            attackId: p.id,
            loadout: p.loadout,
            armorIgnore: arrowArmorIgnore(p.loadout),
          });
          if (p.hitIds.size >= p.maxHits) {
            removed = true;
            break;
          }
        }
      }
      if (removed || p.age >= K.projectile.lifetime) {
        if (!p.hitIds.size && p.grantsPrecision !== false) {
          s.passiveStacks = 0;
          s.passiveRemaining = 0;
        }
        s.projectiles.splice(i, 1);
      } else i++;
    }
    s.targetId = chooseTarget(c.hero, c.alive, s.targetId, c.solids, archerRange(c.loadout));
    const target = c.alive.find(e => e.id === s.targetId);
    if (!s.area && !s.attack && s.skillCooldown <= 1e-8 && target) {
      const loadout = { ...c.loadout },
        maxPulses = loadout.element === 'fire' && loadout.mastery ? K.mastery.firePulses : K.rain.pulses;
      s.area = {
        id: c.nextId(),
        age: 0,
        pulses: 0,
        yaw: Math.atan2(c.hero.x - target.x, c.hero.z - target.z),
        center: { x: target.x, z: target.z },
        multiplier: c.damageMultiplier,
        duration: K.rain.windup + (maxPulses - 1) * K.rain.interval + K.rain.recovery,
        radius:
          K.rain.radius *
          (loadout.element === 'water' && loadout.mastery
            ? K.mastery.waterRadius
            : loadout.element === 'air' && loadout.mastery
              ? K.air.masteryRadius
              : 1) *
          (1 + value(c.techniques, 'downpour')),
        maxPulses,
        loadout,
      };
      c.emit('rain-start', 0, s.area.radius, s.area.center!, 'rain', s.area.id);
    }
    if (!s.area && !s.attack && s.cooldown <= 1e-8 && target) {
      s.attack = {
        id: c.nextId(),
        yaw: Math.atan2(c.hero.x - target.x, c.hero.z - target.z),
        age: 0,
        hits: new Set(),
        multiplier: c.damageMultiplier,
        loadout: { ...c.loadout },
        techniques: { ...c.techniques },
        pierce:
          K.precision.targets[s.passiveStacks] +
          (c.loadout.element === 'air' ? (c.loadout.mastery ? 2 : 1) : 0) +
          value(c.techniques, 'piercing'),
      };
      s.cooldown = ARCHER.basic.cooldown * (1 - value(c.techniques, 'cadence'));
    }
    const attack = s.attack;
    if (
      attack &&
      !attack.released &&
      attack.age + 1e-8 >= ARCHER.basic.windup &&
      s.projectiles.length < K.projectile.cap
    ) {
      attack.released = true;
      s.projectiles.push({
        x: c.hero.x,
        z: c.hero.z,
        previous: { x: c.hero.x, z: c.hero.z },
        id: attack.id,
        vx: -Math.sin(attack.yaw) * arrowSpeed(attack.loadout!),
        vz: -Math.cos(attack.yaw) * arrowSpeed(attack.loadout!),
        age: 0,
        damage: ARCHER.basic.damage * attack.multiplier!,
        empowered: attack.pierce! > 1,
        maxHits: attack.pierce!,
        hitIds: new Set<number>(),
        loadout: attack.loadout!,
      });
      const fan = value(attack.techniques, 'fan'),
        primary = s.projectiles[s.projectiles.length - 1];
      if (fan)
        for (const side of [-1, 1]) {
          if (s.projectiles.length >= K.projectile.cap) break;
          const yaw = attack.yaw + side * 0.16;
          s.projectiles.push({
            ...primary,
            previous: { ...primary.previous },
            id: c.nextId(),
            vx: -Math.sin(yaw) * arrowSpeed(attack.loadout!),
            vz: -Math.cos(yaw) * arrowSpeed(attack.loadout!),
            damage: primary.damage * fan,
            empowered: false,
            maxHits: 1,
            hitIds: new Set(),
            grantsPrecision: false,
          });
        }
      c.emit('arrow-shot', 0, attack.pierce!, c.hero, 'arrow', attack.id);
    }
    const area = s.area;
    if (area)
      while (area.pulses < area.maxPulses && area.age + 1e-8 >= K.rain.windup + area.pulses * K.rain.interval) {
        area.pulses++;
        const id = c.nextId(),
          center = area.center!;
        c.emit('rain-pulse', 0, area.radius, center, 'rain', id);
        for (const enemy of c.alive)
          if (
            Math.hypot(enemy.x - center.x, enemy.z - center.z) <= area.radius + enemy.radius &&
            clearPath(center, enemy, c.solids, 0.04)
          )
            hits.push({
              target: enemy,
              amount:
                K.rain.damage *
                area.multiplier! *
                (area.loadout.element === 'earth' && area.loadout.mastery && area.pulses === area.maxPulses ? 2 : 1),
              source: 'rain',
              attackId: id,
              loadout: area.loadout,
              armorIgnore: arrowArmorIgnore(area.loadout, true),
              origin: center,
            });
      }
    return hits;
  }
  finishStep() {
    if (this.state.area && this.state.area.age + 1e-8 >= this.state.area.duration) {
      this.state.area = undefined;
      this.state.skillCooldown = K.rain.cooldown;
    }
  }
  cancel() {
    this.state.attack = undefined;
    this.state.area = undefined;
    this.state.projectiles.length = 0;
  }
}
