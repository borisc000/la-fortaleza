import type { Point } from '../domain/movement.ts';
import { radarPoint } from '../app/guidance.ts';
import type { UiContext } from './context.ts';

const RADAR_RANGE = 32;
const RADAR_COLORS: Record<string, string> = { shop: '#ecd599', chest: '#e0a050', fountain: '#7fc8e8', capture: '#a8d890' };
type Shape = 'dot' | 'square' | 'ring' | 'diamond';

/** Hero-centred radar, camera forward at the top. Reads positions only; nothing here feeds back into the run. */
export function createRadar(radar: HTMLCanvasElement, ctx: UiContext) {
  const g = radar.getContext('2d');
  function draw() {
    if (!g) return;
    const { body, run } = ctx, combat = run.combat;
    const size = radar.clientWidth || 150, ratio = Math.min(devicePixelRatio, 2), half = size / 2, reach = half - 9;
    if (radar.width !== Math.round(size * ratio)) radar.width = radar.height = Math.round(size * ratio);
    g.setTransform(ratio, 0, 0, ratio, 0, 0); g.clearRect(0, 0, size, size);
    g.strokeStyle = '#c5ced838'; g.lineWidth = 1;
    for (const ring of [.5, 1]) { g.beginPath(); g.arc(half, half, reach * ring, 0, Math.PI * 2); g.stroke(); }
    const at = (target: Point) => {
      const p = radarPoint(ctx.bearingTo(target), Math.hypot(target.x - body.x, target.z - body.z), RADAR_RANGE);
      return { x: half + p.x * reach, y: half + p.y * reach, pinned: p.pinned };
    };
    const mark = (target: Point, color: string, shape: Shape, r: number, dim = false) => {
      const p = at(target); g.globalAlpha = dim ? .35 : 1; g.fillStyle = g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
      if (shape === 'square') g.rect(p.x - r, p.y - r, r * 2, r * 2);
      else if (shape === 'diamond') { g.moveTo(p.x, p.y - r); g.lineTo(p.x + r, p.y); g.lineTo(p.x, p.y + r); g.lineTo(p.x - r, p.y); g.closePath(); }
      else g.arc(p.x, p.y, r, 0, Math.PI * 2);
      if (shape === 'ring') g.stroke(); else g.fill();
      g.globalAlpha = 1;
    };
    g.fillStyle = '#d8634fd9';
    for (const enemy of combat.enemies) {
      if (enemy.dead || enemy.kind === 'elite' || enemy.kind === 'boss') continue;
      const p = at(enemy); if (!p.pinned) g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    for (const object of run.exploration.objects) {
      if (!object.discovered || !Object.hasOwn(RADAR_COLORS, object.kind)) continue;
      const shape: Shape = object.kind === 'shop' ? 'diamond' : object.kind === 'chest' ? 'square' : object.kind === 'capture' ? 'ring' : 'dot';
      mark(object, RADAR_COLORS[object.kind], shape, object.kind === 'capture' ? 6 : object.kind === 'shop' ? 5 : 3.5, object.status !== 'available');
    }
    const core = run.progression.drops.find(drop => drop.core);
    if (core) { mark(core, '#fff0b8', 'dot', 3.5); mark(core, '#fff0b8', 'ring', 7); }
    const major = run.boss && !run.boss.dead ? run.boss : run.elite;
    if (major && !major.dead) mark(major, '#ff5a3c', 'diamond', 6.5);
    g.fillStyle = '#f1f4f7'; g.beginPath();
    g.moveTo(half, half - 6); g.lineTo(half + 4.5, half + 5); g.lineTo(half, half + 2.5); g.lineTo(half - 4.5, half + 5); g.closePath(); g.fill();
  }
  return { draw };
}
