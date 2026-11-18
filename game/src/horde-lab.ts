import * as THREE from 'three';
import { loadAssets } from './rendering/assets.ts';
import { createWorld } from './rendering/world.ts';
import { createHordeView } from './rendering/horde.ts';
import { Combat } from './domain/combat.ts';
import { PLAY_AREA } from './content/config.ts';
import { overlaps } from './domain/movement.ts';

// Separate development entry; never changes an expedition or the production entry.
if (import.meta.env.DEV) void boot();
async function boot() {
  const canvas = document.querySelector<HTMLCanvasElement>('#scene')!,
    output = document.querySelector<HTMLOutputElement>('#results')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const assets = await loadAssets(renderer.capabilities.getMaxAnisotropy(), () => {}),
    world = createWorld(assets);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 300);
  camera.position.set(0, 12, 24);
  camera.lookAt(0, 0, 5);
  const root = new THREE.Group();
  world.scene.add(root);
  const view = createHordeView(root);
  const hero = { x: 0, z: 7, yaw: 0 };
  world.hero.root.position.set(hero.x, 0, hero.z);
  let c: Combat,
    last = 0,
    accumulator = 0,
    frames: number[] = [],
    cpu: number[] = [],
    complete = false;
  function reset() {
    c = new Combat(PLAY_AREA, world.movementSolids, [], false);
    c.hp = 100000;
    c.cooldown = c.whirlwindCooldown = 99999;
    const count = Number(document.querySelector<HTMLSelectElement>('#population')!.value),
      points = [];
    for (let r = 5; r < 24 && points.length < count; r += 1.6)
      for (let a = 0; a < Math.PI * 2 && points.length < count; a += 1.6 / r) {
        const p = { x: Math.sin(a) * r, z: hero.z + Math.cos(a) * r };
        if (!world.movementSolids.some(s => overlaps(p, 0.46, s))) points.push(p);
      }
    c.addEnemies(points, 1.5, 'thrall');
    frames = [];
    cpu = [];
    last = 0;
    accumulator = 0;
    complete = false;
    output.textContent = 'Midiendo 600 fotogramas…';
  }
  document.querySelector('#population')!.addEventListener('change', reset);
  document.querySelector('#restart')!.addEventListener('click', reset);
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  reset();
  window.addEventListener('resize', resize);
  let raf = 0;
  function tick(now: number) {
    const raw = last ? now - last : 0;
    last = now;
    if (!complete) {
      accumulator += Math.min(raw / 1000, 5 / 60);
      const start = performance.now();
      while (accumulator >= 1 / 60) {
        c.step(1 / 60, hero);
        c.takeEvents();
        accumulator -= 1 / 60;
      }
      if (raw > 0) {
        frames.push(raw);
        cpu.push(performance.now() - start);
      }
      view.update(c.enemies, 1, c.time);
      world.update(c.time);
    }
    renderer.render(world.scene, camera);
    if (!complete && frames.length >= 600) {
      const sorted = frames.slice(60).sort((a, b) => a - b),
        cpuSorted = cpu.slice(60).sort((a, b) => a - b);
      output.textContent = `${c.enemies.length} enemigos · ${canvas.width} × ${canvas.height}\n${((1000 * sorted.length) / sorted.reduce((a, b) => a + b, 0)).toFixed(1)} FPS · p95 fotograma ${sorted[Math.floor(sorted.length * 0.95)].toFixed(2)} ms\nCPU simulación p95 ${cpuSorted[Math.floor(cpuSorted.length * 0.95)].toFixed(2)} ms\n${renderer.info.render.calls} llamadas · ${renderer.info.render.triangles} triángulos\n${assets.failures.length} fallos de recursos · 540 muestras tras calentamiento\nSin temporizador GPU; incluye render WebGL real. Muestra detenida.`;
      complete = true;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  window.addEventListener(
    'pagehide',
    () => {
      cancelAnimationFrame(raf);
      view.dispose();
      world.dispose();
      assets.dispose();
      renderer.dispose();
    },
    { once: true },
  );
}
