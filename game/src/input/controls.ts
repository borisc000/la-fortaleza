import { ControlState } from './state.ts';
import { MouseLook } from './mouse-look.ts';

export function bindControls(canvas: HTMLCanvasElement, joystick: HTMLElement, thumb: HTMLElement, options: { active(): boolean; rotate(dx: number, dy: number): void; zoom(deltaPixels: number): void; pause(reason: string): void; notice(message: string): void; interactionButton?: HTMLButtonElement }) {
  const controller = new AbortController(), events = { signal: controller.signal };
  const state = new ControlState();
  const mouse = new MouseLook();
  let lastPointer = '', capturePending = false, hadLock = false;
  let interactionQueued = false, interactionHeld = false;
  const isInteraction = (target: EventTarget | null) => !!options.interactionButton && (target === options.interactionButton || target instanceof Element && options.interactionButton.contains(target));
  const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
  const onInterface = (target: EventTarget | null) => target instanceof Element && !!target.closest('button, input, select, textarea, summary, details, [contenteditable="true"]');
  function drawStick() {
    joystick.hidden = state.movePointer === undefined;
    joystick.style.left = `${state.origin.x}px`; joystick.style.top = `${state.origin.y}px`;
    thumb.style.transform = `translate(${state.stick.x * 36}px, ${state.stick.y * 36}px)`;
  }
  function clear() {
    interactionQueued = false;
    const ids = [state.movePointer, state.lookPointer]; state.clear(); mouse.clear(); drawStick();
    for (const id of ids) if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }
  canvas.addEventListener('wheel', event => {
    if (!options.active() || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
    options.zoom(event.deltaY * unit);
  }, { ...events, passive: false });
  canvas.addEventListener('pointerdown', event => {
    if (!options.active() || event.button !== 0 || document.pointerLockElement === canvas) return;
    if (event.pointerType === 'mouse') { canvas.focus({ preventScroll: true }); void capture(); return; }
    const rect = canvas.getBoundingClientRect();
    const movement = event.pointerType === 'touch' && event.clientX < rect.left + rect.width / 2;
    if (!state.begin(event.pointerId, movement, event.clientX, event.clientY)) return;
    event.preventDefault(); canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true }); drawStick();
  }, events);
  document.addEventListener('pointermove', event => {
    if (!options.active()) return;
    if (event.pointerType !== 'mouse') {
      const look = state.drag(event.pointerId, event.clientX, event.clientY);
      if (look) options.rotate(look.dx, look.dy);
      drawStick();
    }
  }, events);
  document.addEventListener('mousemove', event => {
    const delta = mouse.move({ x: event.clientX, y: event.clientY, dx: event.movementX, dy: event.movementY, active: options.active(), locked: document.pointerLockElement === canvas, overScene: event.target === canvas });
    if (delta) options.rotate(delta.dx, delta.dy);
  }, events);
  canvas.addEventListener('mouseleave', () => mouse.clear(), events);
  const release = (event: PointerEvent) => {
    state.release(event.pointerId); drawStick();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup', release, events);
  canvas.addEventListener('pointercancel', release, events);
  canvas.addEventListener('lostpointercapture', event => { state.release(event.pointerId); drawStick(); }, events);
  document.addEventListener('pointerdown', event => { lastPointer = event.pointerType; if (onInterface(event.target) && !isInteraction(event.target)) clear(); }, events);
  document.addEventListener('focusin', event => { if (onInterface(event.target) && !isInteraction(event.target)) clear(); }, events);
  options.interactionButton?.addEventListener('pointerdown', event => { event.preventDefault(); }, events);
  options.interactionButton?.addEventListener('click', () => { if (options.active()) interactionQueued = true; }, events);
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape') { clear(); options.pause('Pausaste la exploración.'); return; }
    if (event.code === 'KeyE') {
      const fresh = !interactionHeld && !event.repeat; interactionHeld = true;
      if (options.active() && !onInterface(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); if (fresh) interactionQueued = true; }
      return;
    }
    if (!movementKeys.has(event.code) || !options.active() || onInterface(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    // A held key cleared by a menu/pause must be released before it moves again.
    if (!event.repeat) state.keys.add(event.code);
  }, events);
  document.addEventListener('keyup', event => { state.keys.delete(event.code); if (event.code === 'KeyE') interactionHeld = false; }, events);
  window.addEventListener('blur', () => { clear(); options.pause('La ventana perdió el foco. Continúa cuando estés listo.'); }, events);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clear(); options.pause('Saliste de la pestaña. La exploración permanece en pausa.'); } }, events);
  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas, lost = hadLock && !locked; hadLock = locked; mouse.clear();
    if (locked && !options.active()) { document.exitPointerLock(); return; }
    if (locked) options.notice('');
    if (lost) { clear(); options.pause('El ratón se ha liberado. Pulsa Continuar para volver a mirar con el mouse.'); }
  }, events);
  const fallback = () => { if (options.active()) options.notice('El navegador no capturó el ratón. Mueve el mouse sobre el paisaje para mirar, sin pulsar botones. Puedes reintentar con «Capturar ratón».'); };
  document.addEventListener('pointerlockerror', fallback, events);
  async function capture(automatic = false) {
    if (!options.active() || capturePending || document.pointerLockElement === canvas) return;
    if (automatic && (lastPointer === 'touch' || !matchMedia('(any-pointer: fine)').matches)) return;
    canvas.focus({ preventScroll: true }); mouse.clear(); capturePending = true;
    try { await canvas.requestPointerLock(); } catch { fallback(); } finally { capturePending = false; }
  }
  return {
    movement: () => state.movement(),
    consumeInteraction() { const queued = interactionQueued; interactionQueued = false; return queued; },
    capture,
    clear,
    dispose() { clear(); controller.abort(); if (document.pointerLockElement === canvas) document.exitPointerLock(); },
  };
}
