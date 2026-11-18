const cache = new Map<string, HTMLElement>();

/** Cached lookup of a required interface element; a missing id is a page bug, not a runtime condition. */
export function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = cache.get(id) ?? document.getElementById(id);
  if (!found) throw new Error(`Falta el control ${id}`);
  cache.set(id, found);
  return found as T;
}

/** m:ss for whole seconds. */
export function clockLabel(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Arrow word for a camera-relative bearing. */
export function bearingWord(delta: number) {
  return Math.abs(delta) < Math.PI / 6 ? '↑ delante' : Math.abs(delta) > Math.PI * 5 / 6 ? '↓ detrás' : delta > 0 ? '← izquierda' : '→ derecha';
}

/** Arrow alone for a camera-relative bearing. */
export function bearingArrow(delta: number) {
  return Math.abs(delta) < Math.PI / 6 ? '↑' : Math.abs(delta) > Math.PI * 5 / 6 ? '↓' : delta > 0 ? '←' : '→';
}
