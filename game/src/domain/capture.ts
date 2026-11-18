import { CAPTURE } from '../content/activities.ts';
import type { WorldObject } from './exploration.ts';
import type { Point, Solid } from './movement.ts';
import { clearPath } from './navigation.ts';

export class Capture {
  readonly point?: WorldObject;
  state: 'idle' | 'warning' | 'active' | 'completed' | 'closed' = 'idle';
  progress = 0;
  warningRemaining: number = CAPTURE.warning;
  inside = false;
  private solids: readonly Solid[];
  constructor(point: WorldObject | undefined, solids: readonly Solid[]) { this.point = point; this.solids = solids; }
  get pressure() { return this.state === 'active' && this.inside; }
  step(dt: number, hero: Point, enabled: boolean): 'completed' | 'closed' | undefined {
    if (!this.point || dt <= 0 || this.state === 'completed' || this.state === 'closed') return;
    if (!enabled) { this.state = 'closed'; this.inside = false; this.point.status = 'closed'; return 'closed'; }
    this.inside = Math.hypot(hero.x - this.point.x, hero.z - this.point.z) <= CAPTURE.radius && clearPath(hero, this.point, this.solids, .04);
    if (!this.inside) return;
    this.point.discovered = true;
    if (this.state === 'idle') this.state = 'warning';
    if (this.state === 'warning') {
      const elapsed = Math.min(dt, this.warningRemaining); this.warningRemaining = Math.max(0, this.warningRemaining - elapsed); dt -= elapsed;
      if (this.warningRemaining > 1e-8) return;
      this.state = 'active';
    }
    this.progress = Math.min(CAPTURE.duration, this.progress + dt);
    if (this.progress + 1e-8 >= CAPTURE.duration) { this.progress = CAPTURE.duration; this.state = 'completed'; this.point.status = 'used'; return 'completed'; }
  }
}
