import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindControls } from '../src/input/controls.ts';

class Surface extends EventTarget {
  style: Record<string, string> = {};
  hidden = false;
  clientHeight = 800;
  interface = false;
  closest() { return this.interface ? this : null; }
  contains(target: unknown) { return target === this; }
  focus() {}
  hasPointerCapture() { return false; }
  releasePointerCapture() {}
  setPointerCapture() {}
  getBoundingClientRect() { return { left: 0, width: 1200 }; }
}
function event(type: string, properties: Record<string, unknown> = {}) { const e = new Event(type); for (const [key, value] of Object.entries(properties)) Object.defineProperty(e, key, { value }); return e; }

test('capture, lock loss, rejected capture and touch preserve the input contract', async () => {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const install = (name: string, value: unknown) => { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { configurable: true, value }); };
  const doc = Object.assign(new Surface(), { pointerLockElement: null as Surface | null, hidden: false, exitPointerLock() { this.pointerLockElement = null; this.dispatchEvent(event('pointerlockchange')); } });
  const win = new Surface(), canvas = Object.assign(new Surface(), { async requestPointerLock() { captures++; if (reject) throw new Error('denied'); doc.pointerLockElement = canvas; doc.dispatchEvent(event('pointerlockchange')); } });
  install('document', doc); install('window', win); install('Element', Surface); install('matchMedia', () => ({ matches: true }));
  let active = true, captures = 0, reject = false; const rotations: number[][] = [], notices: string[] = [], pauses: string[] = [];
  const controls = bindControls(canvas as unknown as HTMLCanvasElement, new Surface() as unknown as HTMLElement, new Surface() as unknown as HTMLElement, { active: () => active, rotate: (x, y) => rotations.push([x, y]), zoom() {}, pause: reason => { pauses.push(reason); active = false; }, notice: message => notices.push(message) });
  try {
    await controls.capture(true); assert.equal(captures, 1); assert.equal(doc.pointerLockElement, canvas);
    doc.dispatchEvent(event('mousemove', { target: canvas, movementX: 12, movementY: -2, clientX: 500, clientY: 300, buttons: 0 }));
    assert.deepEqual(rotations, [[12, -2]]);
    doc.exitPointerLock(); assert.equal(active, false); assert.equal(pauses.length, 1);
    doc.dispatchEvent(event('mousemove', { target: canvas, movementX: 100, movementY: 100, clientX: 900, clientY: 900, buttons: 0 })); assert.equal(rotations.length, 1);
    active = true; reject = true; await controls.capture(true); assert.equal(captures, 2); assert.ok(notices.at(-1)!.includes('sin pulsar botones'));
    doc.dispatchEvent(event('mousemove', { target: canvas, movementX: 0, movementY: 0, clientX: 10, clientY: 10, buttons: 0 }));
    doc.dispatchEvent(event('mousemove', { target: canvas, movementX: 0, movementY: 0, clientX: 15, clientY: 12, buttons: 0 })); assert.deepEqual(rotations.at(-1), [5, 2]);
    doc.dispatchEvent(event('pointerdown', { pointerType: 'touch' })); reject = false; await controls.capture(true); assert.equal(captures, 2);
    active = false; await controls.capture(); assert.equal(captures, 2);
  } finally { controls.dispose(); for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); } }
});

test('E is one-shot, pause clears queued interaction and touch interaction preserves both sticks', () => {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const install = (name: string, value: unknown) => { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { configurable: true, value }); };
  const doc = Object.assign(new Surface(), { pointerLockElement: null, hidden: false }), win = new Surface(), canvas = new Surface();
  const button = new Surface(); button.interface = true;
  install('document', doc); install('window', win); install('Element', Surface);
  let active = true, turns = 0;
  const controls = bindControls(canvas as unknown as HTMLCanvasElement, new Surface() as unknown as HTMLElement, new Surface() as unknown as HTMLElement, {
    active: () => active, rotate() { turns++; }, zoom() {}, pause() { active = false; }, notice() {}, interactionButton: button as unknown as HTMLButtonElement,
  });
  const key = (repeat = false, target: Surface = canvas) => doc.dispatchEvent(event('keydown', { code: 'KeyE', repeat, target }));
  const up = () => doc.dispatchEvent(event('keyup', { code: 'KeyE' }));
  try {
    key(); assert.equal(controls.consumeInteraction(), true); assert.equal(controls.consumeInteraction(), false);
    key(true); assert.equal(controls.consumeInteraction(), false);
    controls.clear(); key(); assert.equal(controls.consumeInteraction(), false); up();
    key(); controls.clear(); assert.equal(controls.consumeInteraction(), false); up();
    active = false; key(); active = true; key(true); assert.equal(controls.consumeInteraction(), false); up();
    key(false, button); assert.equal(controls.consumeInteraction(), false); up();
    canvas.dispatchEvent(event('pointerdown', { pointerType: 'touch', pointerId: 1, button: 0, clientX: 100, clientY: 100 }));
    canvas.dispatchEvent(event('pointerdown', { pointerType: 'touch', pointerId: 2, button: 0, clientX: 900, clientY: 100 }));
    doc.dispatchEvent(event('pointermove', { pointerType: 'touch', pointerId: 1, clientX: 120, clientY: 80 }));
    const movement = controls.movement(); assert.ok(movement.forward > 0);
    doc.dispatchEvent(event('pointerdown', { pointerType: 'touch', target: button }));
    doc.dispatchEvent(event('focusin', { target: button })); button.dispatchEvent(event('click'));
    assert.equal(controls.consumeInteraction(), true); assert.deepEqual(controls.movement(), movement);
    doc.dispatchEvent(event('pointermove', { pointerType: 'touch', pointerId: 2, clientX: 910, clientY: 110 })); assert.equal(turns, 1);
    active = false; button.dispatchEvent(event('click')); assert.equal(controls.consumeInteraction(), false);
  } finally { controls.dispose(); for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); } }
});
