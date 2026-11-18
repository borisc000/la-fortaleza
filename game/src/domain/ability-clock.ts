import type { AbilityState } from './ability-book.ts';

export type Activation = Readonly<{
  token: number;
  epoch: number;
  ability: AbilityState;
  activeSeconds: number;
  cooldown: number;
}>;
type Slot = { remaining: number; active?: Activation };
/** Scheduling only. The combat adapter must supply a valid target and resolve hits. */
export class AbilityClock {
  private slots = new Map<string, Slot>();
  private sequence = 0;
  private epoch = 0;
  private paused = false;
  private stopped = false;
  setPaused(value: boolean) {
    this.paused = value;
  }
  remaining(id: string) {
    return this.slots.get(id)?.remaining ?? 0;
  }
  get active(): readonly Activation[] {
    return Object.freeze([...this.slots.values()].flatMap(s => (s.active ? [s.active] : [])));
  }
  start(ability: AbilityState, hasTarget: boolean, activeSeconds: number, cooldown: number): Activation | undefined {
    if (
      this.paused ||
      this.stopped ||
      !hasTarget ||
      !Number.isFinite(activeSeconds) ||
      activeSeconds < 0 ||
      !Number.isFinite(cooldown) ||
      cooldown < 1
    )
      return;
    const slot = this.slots.get(ability.id);
    if (slot && (slot.active || slot.remaining > 0)) return;
    const snapshot = Object.freeze({ ...ability, branches: Object.freeze({ ...ability.branches }) });
    const activation = Object.freeze({
      token: ++this.sequence,
      epoch: this.epoch,
      ability: snapshot,
      activeSeconds,
      cooldown,
    });
    this.slots.set(
      ability.id,
      activeSeconds > 0 ? { remaining: activeSeconds, active: activation } : { remaining: cooldown },
    );
    return activation;
  }
  finish(id: string): boolean {
    const slot = this.slots.get(id);
    if (this.paused || this.stopped || !slot?.active) return false;
    slot.remaining = slot.active.cooldown;
    slot.active = undefined;
    return true;
  }
  step(dt: number) {
    if (this.paused || this.stopped || !Number.isFinite(dt) || dt <= 0) return;
    for (const slot of this.slots.values()) {
      if (slot.active && dt >= slot.remaining) {
        const overrun = dt - slot.remaining;
        slot.remaining = Math.max(0, slot.active.cooldown - overrun);
        slot.active = undefined;
      } else slot.remaining = Math.max(0, slot.remaining - dt);
    }
  }
  /** Reject delayed results from an expedition that has ended or restarted. */
  accepts(activation: Activation) {
    return !this.stopped && !this.paused && activation.epoch === this.epoch;
  }
  stop() {
    this.stopped = true;
    this.slots.clear();
    this.epoch++;
  }
  reset() {
    this.slots.clear();
    this.epoch++;
    this.stopped = false;
    this.paused = false;
  }
}
