import { techniqueValue as value } from '../../content/techniques.ts';
import type { ClassDefinition } from '../../content/class-definition.ts';
import { WARRIOR, WARRIOR_KIT } from '../../content/classes/warrior.ts';
import type { HeroKit, HeroKitState, HeroKitContext, HeroHit } from '../hero-kit.ts';
import type { Attack, Enemy } from '../combat.ts';
import { clearPath } from '../navigation.ts';
import { chooseTarget, inArc } from '../targeting.ts';

/** Only Warrior decisions live here; the shared engine resolves their consequences. */
export class WarriorKit implements HeroKit {
  readonly state: HeroKitState = { cooldown: 0, passiveStacks: 0, passiveRemaining: 0, skillCooldown: 0 };
  private targetClock = 0;
  private definition: ClassDefinition;
  constructor(definition: ClassDefinition = WARRIOR) {
    this.definition = definition;
  }
  advance(dt: number) {
    if (this.state.barrierCooldown !== undefined)
      this.state.barrierCooldown = Math.max(0, this.state.barrierCooldown - dt);
    if (this.state.barrier) {
      this.state.barrier.remaining -= dt;
      if (this.state.barrier.remaining <= 1e-8) this.state.barrier = undefined;
    }
    this.state.cooldown = Math.max(0, this.state.cooldown - dt);
    this.state.passiveRemaining = Math.max(0, this.state.passiveRemaining - dt);
    if (this.state.passiveRemaining <= 1e-8) {
      this.state.passiveStacks = 0;
      this.state.passiveRemaining = 0;
    }
    if (this.state.area) this.state.area.age += dt;
    else this.state.skillCooldown = Math.max(0, this.state.skillCooldown - dt);
    this.targetClock -= dt;
    if (this.state.attack) {
      this.state.attack.age += dt;
      if (this.state.attack.age >= this.definition.basic.duration) this.state.attack = undefined;
    }
  }
  act(context: HeroKitContext): HeroHit[] {
    const { hero, alive, solids, damageMultiplier, loadout, nextId, emit, techniques } = context;
    const begin = (yaw: number): Attack => ({ id: nextId(), yaw, age: 0, hits: new Set() });
    const rank = Math.max(0, Math.min(2, loadout.rank - 1));
    const reach =
      this.definition.basic.range +
      value(techniques, 'lunge') +
      (loadout.element === 'air' ? WARRIOR_KIT.air.reach[rank] : 0);
    const current = alive.find(enemy => enemy.id === this.state.targetId);
    const invalidated =
      this.state.targetId !== undefined &&
      (!current ||
        Math.hypot(current.x - hero.x, current.z - hero.z) > reach + current.radius ||
        !clearPath(hero, current, solids, 0.04));
    if (this.targetClock <= 1e-8 || invalidated) {
      this.state.targetId = chooseTarget(hero, alive, this.state.targetId, solids, reach);
      this.targetClock = 0.1;
    }
    const target = alive.find(enemy => enemy.id === this.state.targetId);
    // Finish the current basic swing, then prioritise the ready automatic skill.
    const windRadius =
      this.state.area?.radius ??
      WARRIOR_KIT.whirlwind.radius *
        (loadout.element === 'water' && loadout.mastery
          ? WARRIOR_KIT.mastery.waterRadiusMultiplier
          : loadout.element === 'air' && loadout.mastery
            ? WARRIOR_KIT.air.masteryRadius
            : 1);
    const inWhirlwind = (enemy: Enemy) =>
      Math.hypot(enemy.x - hero.x, enemy.z - hero.z) <= windRadius + enemy.radius &&
      clearPath(hero, enemy, solids, 0.04);
    if (!this.state.area && !this.state.attack && this.state.skillCooldown <= 1e-8 && alive.some(inWhirlwind)) {
      const fireMastery = loadout.element === 'fire' && loadout.mastery;
      this.state.area = {
        id: nextId(),
        age: 0,
        pulses: 0,
        yaw: hero.yaw,
        radius: windRadius,
        duration:
          (fireMastery ? WARRIOR_KIT.mastery.fireDuration : WARRIOR_KIT.whirlwind.duration) +
          value(techniques, 'whirl') * WARRIOR_KIT.whirlwind.interval,
        maxPulses:
          (fireMastery ? WARRIOR_KIT.mastery.firePulses : WARRIOR_KIT.whirlwind.pulses) + value(techniques, 'whirl'),
        loadout: { ...loadout },
      };
      emit('whirlwind-start', 0, 0, hero, 'whirlwind', this.state.area.id);
    }
    if (!this.state.area && !this.state.attack && this.state.cooldown <= 1e-8 && target) {
      this.state.attack = begin(Math.atan2(hero.x - target.x, hero.z - target.z));
      this.state.attack.multiplier =
        (1 + this.state.passiveStacks * WARRIOR_KIT.impetus.damagePerStack) * damageMultiplier;
      this.state.attack.loadout = { ...loadout };
      if (loadout.element === 'air' || value(techniques, 'lunge')) this.state.attack.range = reach;
      if (value(techniques, 'sweep'))
        this.state.attack.arc = this.definition.basic.arc + (value(techniques, 'sweep') * Math.PI) / 180;
      this.state.cooldown = this.definition.basic.cooldown;
    }

    const damage: HeroHit[] = [];
    if (
      this.state.attack &&
      this.state.attack.age + 1e-8 >= this.definition.basic.windup &&
      this.state.attack.age < this.definition.basic.windup + this.definition.basic.active - 1e-8
    ) {
      this.state.attack.multiplier ??=
        (1 + this.state.passiveStacks * WARRIOR_KIT.impetus.damagePerStack) * damageMultiplier;
      this.state.attack.loadout ??= { ...loadout };
      let landed = false;
      for (const enemy of alive)
        if (
          !this.state.attack.hits.has(enemy.id) &&
          inArc(
            hero,
            enemy,
            this.state.attack.yaw,
            this.state.attack.range ?? this.definition.basic.range,
            this.state.attack.arc ?? this.definition.basic.arc,
            enemy.radius,
          ) &&
          clearPath(hero, enemy, solids, 0.04)
        ) {
          this.state.attack.hits.add(enemy.id);
          landed = true;
          damage.push({
            target: enemy,
            amount: this.definition.basic.damage * this.state.attack.multiplier,
            source: 'basic',
            attackId: this.state.attack.id,
            loadout: this.state.attack.loadout,
          });
        }
      if (landed && !this.state.attack.impetusGranted) {
        this.state.attack.impetusGranted = true;
        this.state.passiveStacks = Math.min(WARRIOR_KIT.impetus.maxStacks, this.state.passiveStacks + 1);
        this.state.passiveRemaining = WARRIOR_KIT.impetus.timeout;
        if (this.state.attack.loadout.element === 'earth' && (this.state.barrierCooldown ?? 0) <= 1e-8) {
          const earthRank = Math.max(0, Math.min(2, this.state.attack.loadout.rank - 1));
          this.state.barrier = {
            amount: WARRIOR_KIT.earth.guard[earthRank],
            remaining: WARRIOR_KIT.earth.guardDuration,
          };
          this.state.barrierCooldown = WARRIOR_KIT.earth.guardCooldown;
          emit('stone-guard', 0, this.state.barrier.amount, hero, 'basic', this.state.attack.id);
        }
      }
    }
    if (this.state.area) {
      // Pulses at 0, .4, .8, 1.2, 1.6 and 2 s; finish at 2.4 s.
      while (
        this.state.area.pulses < this.state.area.maxPulses &&
        this.state.area.age + 1e-8 >= this.state.area.pulses * WARRIOR_KIT.whirlwind.interval
      ) {
        const pulseId = nextId();
        this.state.area.pulses++;
        emit('whirlwind-pulse', 0, 0, hero, 'whirlwind', pulseId);
        for (const enemy of alive)
          if (inWhirlwind(enemy))
            damage.push({
              target: enemy,
              amount: WARRIOR_KIT.whirlwind.damage * damageMultiplier,
              source: 'whirlwind',
              attackId: pulseId,
              loadout: this.state.area.loadout,
            });
        if (
          this.state.area.loadout.element === 'earth' &&
          this.state.area.loadout.mastery &&
          this.state.area.pulses % 2 === 0
        ) {
          const quakeId = nextId();
          emit('quake', 0, WARRIOR_KIT.earth.quakeRadius, hero, 'quake', quakeId);
          for (const enemy of alive)
            if (
              Math.hypot(enemy.x - hero.x, enemy.z - hero.z) <= WARRIOR_KIT.earth.quakeRadius + enemy.radius &&
              clearPath(hero, enemy, solids, 0.04)
            )
              damage.push({
                target: enemy,
                amount: WARRIOR_KIT.earth.quakeDamage * damageMultiplier,
                source: 'quake',
                attackId: quakeId,
                loadout: this.state.area.loadout,
              });
        }
      }
    }
    return damage;
  }
  finishStep() {
    if (this.state.area && this.state.area.age + 1e-8 >= this.state.area.duration) {
      this.state.area = undefined;
      this.state.skillCooldown = WARRIOR_KIT.whirlwind.cooldown;
    }
  }
  cancel() {
    this.state.attack = undefined;
    this.state.area = undefined;
    this.state.barrier = undefined;
  }
}
