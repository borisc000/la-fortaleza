import { techniqueValue as value } from '../../content/techniques.ts';
import { MAGE, MAGE_KIT as K, mageRange, mageProjectile } from '../../content/classes/mage.ts';
import type { HeroKit, HeroKitState, HeroKitContext, HeroHit } from '../hero-kit.ts';
import { chooseTarget } from '../targeting.ts';
import { clearPath } from '../navigation.ts';
import { segmentDistance } from '../projectiles.ts';

/** Fixed-direction bolts and a ground-targeted area; no aiming input or homing. */
export class MageKit implements HeroKit {
  readonly state: HeroKitState = {
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
    if (s.barrier) {
      s.barrier.remaining = Math.max(0, s.barrier.remaining - dt);
      if (s.barrier.remaining <= 1e-8) s.barrier = undefined;
    }
    if (s.barrierCooldown !== undefined) s.barrierCooldown = Math.max(0, s.barrierCooldown - dt);
    s.cooldown = Math.max(0, s.cooldown - dt);
    if (s.area) s.area.age += dt;
    else s.skillCooldown = Math.max(0, s.skillCooldown - dt);
    if (s.attack) {
      s.attack.age += dt;
      if (s.attack.age >= MAGE.basic.duration) s.attack = undefined;
    }
  }
  act(c: HeroKitContext): HeroHit[] {
    const s = this.state,
      hits: HeroHit[] = [],
      bolts = s.projectiles!;
    // Process existing projectiles first: newly released spells move next simulation step.
    for (let i = bolts.length - 1; i >= 0; i--) {
      const p = bolts[i];
      const waiting = Math.min(this.dt, p.delay ?? 0);
      if (p.delay) p.delay = Math.max(0, p.delay - this.dt);
      const flightDt = this.dt - waiting;
      if (flightDt <= 1e-8) continue;
      p.previous = { x: p.x, z: p.z };
      const travel = Math.min(flightDt, Math.max(0, K.projectile.lifetime - p.age));
      p.age += flightDt;
      const projectile = mageProjectile(p.loadout);
      const steps = Math.max(1, Math.ceil((projectile.speed * travel) / 0.06));
      let removed = false;
      for (let j = 0; j < steps; j++) {
        const to = { x: p.x + (p.vx * travel) / steps, z: p.z + (p.vz * travel) / steps };
        if (!clearPath(p, to, c.solids, projectile.radius)) {
          removed = true;
          break;
        }
        const target = c.alive
          .filter(e => segmentDistance(p, to, e) <= e.radius + projectile.radius)
          .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z) || a.id - b.id)[0];
        p.x = to.x;
        p.z = to.z;
        if (target) {
          hits.push({
            target,
            amount: p.damage,
            source: 'spell',
            attackId: p.id,
            loadout: p.loadout,
            origin: { ...p.previous },
          });
          if (p.empowered) {
            const burstRadius = p.burstRadius ?? K.arcane.radius;
            c.emit(
              p.loadout.element === 'earth'
                ? 'quake'
                : p.loadout.element === 'air'
                  ? 'gust'
                  : p.loadout.element === 'fire'
                    ? 'explosion'
                    : 'splash',
              0,
              burstRadius,
              target,
              'spell',
              p.id,
            );
            for (const other of c.alive)
              if (
                other.id !== target.id &&
                Math.hypot(other.x - target.x, other.z - target.z) <= burstRadius + other.radius &&
                clearPath(target, other, c.solids, 0.04)
              )
                hits.push({
                  target: other,
                  amount: p.damage,
                  source: 'spell',
                  attackId: p.id,
                  loadout: p.loadout,
                  origin: { ...p.previous },
                });
          }
          removed = true;
          break;
        }
      }
      if (removed || p.age >= K.projectile.lifetime) bolts.splice(i, 1);
    }
    if (!c.loadout.element) return hits; // A Mage cannot cast without an initial affinity.
    s.targetId = chooseTarget(c.hero, c.alive, s.targetId, c.solids, mageRange(c.loadout));
    const target = c.alive.find(e => e.id === s.targetId);
    const multiplier = c.damageMultiplier * (1 + 0.1 * Math.max(0, c.loadout.rank - 1));
    const loadout = { ...c.loadout, pureElemental: true };
    if (!s.area && !s.attack && s.skillCooldown <= 1e-8 && target) {
      const maxPulses = loadout.element === 'fire' && loadout.mastery ? K.mastery.firePulses : K.cataclysm.pulses;
      s.area = {
        id: c.nextId(),
        age: 0,
        pulses: 0,
        yaw: Math.atan2(c.hero.x - target.x, c.hero.z - target.z),
        center: { x: target.x, z: target.z },
        multiplier,
        duration: K.cataclysm.windup + (maxPulses - 1) * K.cataclysm.interval + K.cataclysm.recovery,
        radius:
          K.cataclysm.radius *
          (loadout.element === 'water' && loadout.mastery
            ? K.mastery.waterRadius
            : loadout.element === 'air' && loadout.mastery
              ? K.air.masteryRadius
              : 1) *
          (1 + value(c.techniques, 'convergence')),
        maxPulses,
        loadout,
      };
      c.emit('cataclysm-start', 0, s.area.radius, s.area.center!, 'cataclysm', s.area.id);
    }
    if (!s.area && !s.attack && s.cooldown <= 1e-8 && target) {
      s.attack = {
        id: c.nextId(),
        yaw: Math.atan2(c.hero.x - target.x, c.hero.z - target.z),
        age: 0,
        hits: new Set(),
        multiplier,
        loadout,
        techniques: { ...c.techniques },
      };
      s.cooldown = MAGE.basic.cooldown * (1 - value(c.techniques, 'focus'));
    }
    const attack = s.attack;
    if (attack && !attack.released && attack.age + 1e-8 >= MAGE.basic.windup && bolts.length < K.projectile.cap) {
      attack.released = true;
      const empowered = s.passiveStacks >= K.arcane.charges;
      s.passiveStacks = empowered ? 0 : s.passiveStacks + 1;
      const projectile = mageProjectile(attack.loadout!);
      if (empowered && attack.loadout!.element === 'earth' && (s.barrierCooldown ?? 0) <= 1e-8) {
        s.barrier = {
          amount: K.earth.guard[Math.max(0, Math.min(2, attack.loadout!.rank - 1))],
          remaining: K.earth.guardDuration,
        };
        s.barrierCooldown = K.earth.guardCooldown;
        c.emit('stone-guard', 0, s.barrier.amount, c.hero, 'spell', attack.id);
      }
      bolts.push({
        ...c.hero,
        previous: { x: c.hero.x, z: c.hero.z },
        id: attack.id,
        vx: -Math.sin(attack.yaw) * projectile.speed,
        vz: -Math.cos(attack.yaw) * projectile.speed,
        age: 0,
        damage: MAGE.basic.damage * attack.multiplier! * (empowered ? K.arcane.multiplier : 1),
        empowered,
        loadout: attack.loadout!,
        burstRadius: K.arcane.radius + value(attack.techniques, 'resonance'),
      });
      const echo = value(attack.techniques, 'echo');
      if (echo && bolts.length < K.projectile.cap) {
        const primary = bolts[bolts.length - 1];
        bolts.push({
          ...primary,
          previous: { ...primary.previous },
          id: c.nextId(),
          damage: MAGE.basic.damage * attack.multiplier! * echo,
          empowered: false,
          delay: 0.12,
          echo: true,
        });
      }
      c.emit('spell-cast', 0, empowered ? 1 : 0, c.hero, 'spell', attack.id);
    }
    const area = s.area;
    if (area)
      while (
        area.pulses < area.maxPulses &&
        area.age + 1e-8 >= K.cataclysm.windup + area.pulses * K.cataclysm.interval
      ) {
        area.pulses++;
        const id = c.nextId(),
          center = area.center!;
        c.emit(
          area.loadout.element === 'earth'
            ? 'quake'
            : area.loadout.element === 'air'
              ? 'gust'
              : area.loadout.element === 'fire'
                ? 'explosion'
                : 'splash',
          0,
          area.radius,
          center,
          'cataclysm',
          id,
        );
        for (const enemy of c.alive)
          if (
            Math.hypot(enemy.x - center.x, enemy.z - center.z) <= area.radius + enemy.radius &&
            clearPath(center, enemy, c.solids, 0.04)
          )
            hits.push({
              target: enemy,
              amount:
                K.cataclysm.damage *
                area.multiplier! *
                (area.loadout.element === 'earth' && area.loadout.mastery && area.pulses === area.maxPulses ? 2 : 1),
              source: 'cataclysm',
              attackId: id,
              loadout: area.loadout,
              origin: center,
            });
      }
    return hits;
  }
  finishStep() {
    if (this.state.area && this.state.area.age + 1e-8 >= this.state.area.duration) {
      this.state.area = undefined;
      this.state.skillCooldown = K.cataclysm.cooldown;
    }
  }
  cancel() {
    this.state.barrier = undefined;
    this.state.barrierCooldown = undefined;
    this.state.attack = undefined;
    this.state.area = undefined;
    this.state.projectiles!.length = 0;
  }
}
