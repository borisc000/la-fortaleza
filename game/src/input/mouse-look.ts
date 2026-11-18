/** Relative mouse motion when captured; hover deltas as an unlocked fallback. */
export class MouseLook {
  private previous?: { x: number; y: number };
  clear() {
    this.previous = undefined;
  }
  move(sample: { x: number; y: number; dx: number; dy: number; active: boolean; locked: boolean; overScene: boolean }) {
    if (!sample.active) {
      this.clear();
      return undefined;
    }
    if (sample.locked) {
      this.clear();
      return { dx: sample.dx, dy: sample.dy };
    }
    if (!sample.overScene) {
      this.clear();
      return undefined;
    }
    const previous = this.previous;
    this.previous = { x: sample.x, y: sample.y };
    return previous ? { dx: sample.x - previous.x, dy: sample.y - previous.y } : undefined;
  }
}
