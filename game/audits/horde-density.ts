import * as THREE from 'three';
import { loadAssets } from '../src/rendering/assets.ts';
import { createWorld } from '../src/rendering/world.ts';
import { createCombatView } from '../src/rendering/combat.ts';
import { createWarriorArsenalView } from '../src/rendering/warrior-arsenal.ts';
import { Combat } from '../src/domain/combat.ts';
import { WarriorArsenal } from '../src/domain/classes/warrior-arsenal.ts';
import { WARRIOR_RUNTIME } from '../src/domain/classes.ts';
import { AbilityBook } from '../src/domain/ability-book.ts';
import { PLAY_AREA } from '../src/content/config.ts';
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.append(renderer.domElement);
renderer.setSize(960, 640);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const gl = renderer.getContext(),
  dbg = gl.getExtension('WEBGL_debug_renderer_info');
const gpu = dbg && gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
const assets = await loadAssets(renderer.capabilities.getMaxAnisotropy(), () => {}),
  world = createWorld(assets);
const camera = new THREE.PerspectiveCamera(55, 1.5, 0.1, 300);
camera.position.set(0, 12, 24);
camera.lookAt(0, 0, 5);
const hero = { x: 0, z: 7, yaw: 0 };
world.hero.root.position.set(0, 0, 7);
async function runCase(dense: boolean, skills: boolean) {
  const arsenal = new WarriorArsenal(PLAY_AREA),
    book = new AbilityBook('warrior');
  for (const name of ['steel-wave', 'orbiting-axes', 'war-hammer'])
    book.apply(book.revision, { kind: 'learn', id: 'warrior:' + name });
  if (book.slotsUsed !== 4) throw Error('Se requieren cuatro habilidades');
  arsenal.abilities = skills ? book.snapshot : book.snapshot.filter(s => s.id === 'warrior:sword');
  const combat = new Combat(PLAY_AREA, world.movementSolids, [], false, {
    ...WARRIOR_RUNTIME,
    createKit: () => arsenal,
  });
  const points = Array.from({ length: 60 }, (_, i) => ({
    x: ((i % 10) - 4.5) * (dense ? 0.6 : 2.3),
    z: hero.z + (Math.floor(i / 10) - 2.5) * (dense ? 0.6 : 2.3),
  }));
  combat.addEnemies(points, 0, 'thrall');
  combat.hp = 1e8;
  for (const e of combat.enemies) e.hp = e.maxHp = 1e8;
  const view = createCombatView(world.scene),
    arsenalView = createWarriorArsenalView(world.scene);
  let last = 0,
    hits = 0;
  const frame = [],
    cpu = [],
    renderCpu = [];
  for (let i = 0; i < 360; i++) {
    // Restore the formation every simulated second so the dispersed case stays dispersed.
    if (i % 60 === 0) for (const [j, e] of combat.enemies.entries()) Object.assign(e, points[j]);
    if (!skills) arsenal.state.cooldown = 1000;
    const now = await new Promise<number>(resolve => requestAnimationFrame(resolve));
    if (i >= 60) frame.push(now - last);
    last = now;
    const stepStart = performance.now();
    combat.step(1 / 60, hero);
    const events = combat.takeEvents();
    if (i >= 60) cpu.push(performance.now() - stepStart);
    hits += events.filter(e => e.type === 'hit' && e.target > 0).length;
    {
      const renderStart = performance.now();
      view.events(events, combat.time);
      view.update(combat, world.hero.root.position, camera, 1, 1 / 60);
      arsenalView.update(combat);
      world.update(combat.time);
      renderer.render(world.scene, camera);
      if (i >= 60) renderCpu.push(performance.now() - renderStart);
    }
  }
  const stats = (a: number[]) => {
    a.sort((a, b) => a - b);
    return [a[Math.floor(a.length * 0.5)], a[Math.floor(a.length * 0.95)]];
  };
  view.dispose();
  arsenalView.dispose();
  return {
    dense,
    skills,
    count: combat.enemies.filter(e => !e.dead).length,
    hits,
    frame: stats(frame),
    combat: stats(cpu),
    renderCPU: stats(renderCpu),
    solids: world.movementSolids.length,
  };
}

const button = document.querySelector<HTMLButtonElement>('#start')!;
const output = document.querySelector<HTMLOutputElement>('#results')!;
output.textContent = gpu ?? '';
button.disabled = false;
button.onclick = async () => {
  button.disabled = true;
  output.textContent = '';
  try {
    for (const dense of [false, true]) {
      for (const skills of [false, true]) {
        output.textContent += `${dense ? 'Juntos' : 'Dispersos'} · ${skills ? 'cuatro habilidades' : 'sin ataques'}… `;
        const result = await runCase(dense, skills);
        output.textContent += `${result.count} vivos · ${result.hits} impactos · p95 (ms): fotograma ${result.frame[1].toFixed(1)}, simulación ${result.combat[1].toFixed(1)}, render CPU ${result.renderCPU[1].toFixed(1)}\n`;
      }
    }
  } catch (error) {
    output.textContent += String(error);
  } finally {
    button.disabled = false;
  }
};
