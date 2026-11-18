import type { MoveInput } from '../domain/movement.ts';

/** Separate pointer ownership means releasing one thumb never releases the other. */
export class ControlState {
  readonly keys = new Set<string>();
  movePointer: number | undefined;
  lookPointer: number | undefined;
  origin = { x: 0, y: 0 };
  lookPosition = { x: 0, y: 0 };
  stick = { x: 0, y: 0 };
  begin(id: number, movement: boolean, x: number, y: number) {
    if (movement) {
      if (this.movePointer !== undefined) return false;
      this.movePointer = id;
      this.origin = { x, y };
      this.stick = { x: 0, y: 0 };
    } else {
      if (this.lookPointer !== undefined) return false;
      this.lookPointer = id;
      this.lookPosition = { x, y };
    }
    return true;
  }
  drag(id: number, x: number, y: number): { dx: number; dy: number } | undefined {
    if (id === this.movePointer) {
      const dx = x - this.origin.x,
        dy = y - this.origin.y,
        length = Math.max(44, Math.hypot(dx, dy));
      this.stick = { x: dx / length, y: dy / length };
    } else if (id === this.lookPointer) {
      const delta = { dx: x - this.lookPosition.x, dy: y - this.lookPosition.y };
      this.lookPosition = { x, y };
      return delta;
    }
  }
  release(id: number) {
    if (id === this.movePointer) {
      this.movePointer = undefined;
      this.stick = { x: 0, y: 0 };
    }
    if (id === this.lookPointer) this.lookPointer = undefined;
  }
  movement(): MoveInput {
    const magnitude = Math.hypot(this.stick.x, this.stick.y);
    const gain = magnitude > 0.12 ? (magnitude - 0.12) / (0.88 * magnitude) : 0;
    return {
      right: Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')) + this.stick.x * gain,
      forward: Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS')) - this.stick.y * gain,
    };
  }
  clear() {
    this.keys.clear();
    this.movePointer = undefined;
    this.lookPointer = undefined;
    this.stick = { x: 0, y: 0 };
  }
}
