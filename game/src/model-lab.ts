import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { catalog } from './model-catalog.ts';
import type { ModelView, CatalogItem } from './model-catalog.ts';
import { FRAME_STEP, type AnimationMode } from './model-animation.ts';
import { ABILITY_CATALOG } from './content/ability-schema.ts';
import { abilityData } from './content/ranged-abilities.ts';
import { trialBuild, type TrialConfig } from './domain/ability-lab.ts';
import { createAbilityLab } from './rendering/ability-lab.ts';
import './model-lab.css';
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>('scene'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, .01, 3000);
camera.position.set(4, 3, -6);
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.autoRotateSpeed = 1.2;
const ambient = new THREE.HemisphereLight(0xdde9ed, 0x393b28, 2.1), key = new THREE.DirectionalLight(0xfff0da, 3.1), rim = new THREE.DirectionalLight(0xa2bcc9, 1.8);
key.position.set(-4, 7, -5); rim.position.set(4, 3, 4); scene.add(ambient, key, rim);
const grid = new THREE.GridHelper(20, 20, 0x798779, 0x404b42); grid.position.y = -.015; scene.add(grid);
const container = new THREE.Group(); scene.add(container);
let current: ModelView | undefined, selected: CatalogItem, serial = 0, radius = 2, targetHeight = 1, frame = 0;
let animationTime = 0, playing = true;
const abilityMode = () => el<HTMLSelectElement>('lab-mode').value === 'abilities';
const animationMode = () => el<HTMLSelectElement>('pose').value as AnimationMode;
function updatePlayback() {
  const duration = current?.animation?.duration(animationMode()) ?? 3;
  el<HTMLInputElement>('timeline').max = String(duration);
  el<HTMLInputElement>('timeline').value = String(animationTime);
  el('animation-time').textContent = `${animationTime.toFixed(2)} / ${duration.toFixed(2)} s`;
  el('play').textContent = playing ? 'Pausar' : 'Reproducir';
}
function seek(time: number) {
  animationTime = Math.max(0, Math.min(current?.animation?.duration(animationMode()) ?? 0, time));
  current?.animation?.seek(animationMode(), animationTime);
  updatePlayback();
}
const storageKey = 'fortaleza:model-review:v1'; const notes: Record<string, string> = {};
try { const data: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}'); if (data && typeof data === 'object' && !Array.isArray(data)) for (const [k,v] of Object.entries(data)) if (typeof v === 'string') notes[k] = v; } catch { el('saved').textContent = 'Almacenamiento no disponible. Puedes exportar tus notas.'; }
function setWire(enabled: boolean) {
  // Keep the owned materials used by hit/fade animation instead of detached clones.
  current?.root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
      if ('wireframe' in material && material.wireframe !== enabled) {
        material.wireframe = enabled;
        material.needsUpdate = true;
      }
    }
  });
}
function restoreMaterials() { setWire(false); }
function wireframe() { setWire(el<HTMLInputElement>('wire').checked); }
function fit(direction = new THREE.Vector3(1, .55, -1.6)) { controls.target.set(0, targetHeight, 0); camera.position.copy(controls.target).add(direction.normalize().multiplyScalar(radius * 2.6)); controls.minDistance = radius * .15; controls.maxDistance = radius * 15; camera.near = Math.max(.001, radius / 1000); camera.far = radius * 100; camera.updateProjectionMatrix(); controls.update(); }
function list() { const query = el<HTMLInputElement>('search').value.trim().toLocaleLowerCase('es'); const filtered = catalog.filter(c => `${c.name} ${c.category}`.toLocaleLowerCase('es').includes(query)); el('count').textContent = `${filtered.length} / ${catalog.length}`; el('catalog').replaceChildren(); for (const category of [...new Set(filtered.map(c => c.category))]) { const heading = document.createElement('h3'); heading.textContent = category; el('catalog').append(heading); for (const item of filtered.filter(c => c.category === category)) { const button = document.createElement('button'); button.textContent = item.name; button.setAttribute('aria-current', String(item.id === selected?.id)); button.onclick = () => void select(item); el('catalog').append(button); } } if (!filtered.length) el('catalog').textContent = 'No hay modelos con ese nombre.'; }
async function select(item: CatalogItem) { const token = ++serial;
  el<HTMLFieldSetElement>('animation-controls').disabled = true;
  el('animation-note').textContent = 'Cargando animaciones…';
  const archerVariants = ['archer', 'archer-before', 'archer-previous', 'archer-approved'];
  const warriorVariants = ['warrior', 'warrior-before', 'warrior-organic', 'warrior-approved'];
  const compare = current && ((item.id.startsWith('trial-') && selected?.id === item.id)
    || [archerVariants, warriorVariants, ['mage', 'mage-before', 'mage-approved']].some(variants => variants.includes(selected?.id) && variants.includes(item.id)));
  const previousOffset = compare ? camera.position.clone().sub(controls.target).divideScalar(radius) : undefined;
  selected = item; list(); el('title').textContent = item.name; el('category').textContent = item.category; el('description').textContent = item.note; el('source').textContent = item.source; el<HTMLTextAreaElement>('notes').value = notes[item.id] ?? ''; el('status').textContent = 'Cargando modelo…'; restoreMaterials(); if (current) { container.remove(current.root); current.dispose(); current = undefined; } el('metrics').textContent = '';
  try { const view = await item.create(); if (token !== serial) { view.dispose(); return; } current = view; container.add(view.root); view.root.updateMatrixWorld(true);
    // Only visible meshes contribute: hidden health bars and warnings are not model bounds.
    const box = new THREE.Box3(); let meshes = 0, triangles = 0;
    view.root.traverseVisible(o => { if (!(o instanceof THREE.Mesh) || o instanceof THREE.InstancedMesh && o.count === 0) return; meshes++; const g = o.geometry; g.computeBoundingBox(); const b = g.boundingBox!.clone().applyMatrix4(o.matrixWorld); box.union(b); triangles += (g.index?.count ?? g.getAttribute('position').count) / 3 * (o instanceof THREE.InstancedMesh ? o.count : 1); });
    if (view.framing) box.copy(view.framing.box);
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3()); view.root.position.sub(new THREE.Vector3(center.x, box.min.y, center.z)); targetHeight = size.y * .5; radius = view.framing?.radius ?? Math.max(size.x, size.y, size.z, .2); grid.scale.setScalar(radius / 5); fit(view.framing ? new THREE.Vector3(1, 1.1, -1.5) : previousOffset?.clone());
    if (previousOffset) {
      camera.position.copy(controls.target).addScaledVector(previousOffset, radius);
      controls.update();
    }
    wireframe(); el('metrics').textContent = `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m · ancho / alto / fondo · ${meshes} mallas · ${Math.round(triangles).toLocaleString('es')} triángulos`; el('status').textContent = ''; history.replaceState(null, '', `#${item.id}`);
    el<HTMLFieldSetElement>('animation-controls').disabled = !view.animation;
    el('animation-note').textContent = abilityMode()
      ? 'Prueba de 12 segundos con efectos, impactos y recargas del juego. Puedes pausar, retroceder o avanzar un fotograma. Algunas habilidades comparten postura o aún no tienen un gesto corporal propio.'
      : view.animation
      ? 'Movimientos del juego, en el sitio. El gesto de habilidad muestra la postura del personaje, sin proyectiles ni efectos. Arrastra el tiempo para detenerte en un detalle.'
      : 'Este modelo se muestra estático. Las animaciones están disponibles para los personajes.';
    seek(0);
  } catch (error) { if (token !== serial) return; el('animation-note').textContent = 'Animaciones no disponibles.'; el('status').textContent = `No se pudo cargar el modelo: ${error instanceof Error ? error.message : error}`; }
}
function trialConfig(): TrialConfig {
  return {
    abilityId: el<HTMLSelectElement>('trial-ability').value,
    level: Number(el<HTMLSelectElement>('trial-level').value),
    focus: el<HTMLSelectElement>('trial-focus').value as TrialConfig['focus'],
    mutation: Number(el<HTMLSelectElement>('trial-mutation').value) as 0 | 1,
    finisher: Number(el<HTMLSelectElement>('trial-finisher').value) as 0 | 1,
    element: el<HTMLSelectElement>('trial-element').value as TrialConfig['element'],
  };
}
function trialChoices() {
  const abilities = ABILITY_CATALOG.filter(a => a.classId === el<HTMLSelectElement>('trial-class').value);
  el('trial-ability').replaceChildren(...abilities.map(a => new Option(a.name + (a.kind === 'basic' ? ' · básico' : ''), a.id)));
  el<HTMLSelectElement>('trial-ability').value = abilities[1].id;
  trialVariants();
}
function trialVariants() {
  const data = abilityData(el<HTMLSelectElement>('trial-ability').value);
  const option = (name: string, i: number) => { const item = new Option(name.split(':')[0], String(i)); item.title = name; return item; };
  el('trial-mutation').replaceChildren(...data.mutations.map(option));
  el('trial-finisher').replaceChildren(...data.finishers.map(option));
}
function runTrial() {
  const config = trialConfig(), build = trialBuild(config), data = abilityData(config.abilityId);
  el<HTMLSelectElement>('trial-mutation').disabled = config.level < 5;
  el<HTMLSelectElement>('trial-finisher').disabled = config.level < 10;
  el('trial-mutation-note').textContent = config.level >= 5 ? data.mutations[config.mutation] : 'Disponible desde el nivel 5.';
  el('trial-finisher-note').textContent = config.level >= 10 ? data.finishers[config.finisher] : 'Disponible en el nivel 10.';
  const b = build.state.branches;
  el('trial-branches').textContent = `Potencia ${b.power} · Expansión ${b.expansion} · Especialización ${b.specialization} · Ritmo ${b.rhythm}. Al completar una rama, se distribuye el resto en las siguientes.`;
  const support = ['mage:mirror', 'archer:hunting-beacon', 'warrior:war-banner'].includes(config.abilityId);
  playing = true;
  void select({ id: `trial-${build.definition.classId}`, name: `${build.definition.name} · Nivel ${config.level}`, category: 'Prueba de habilidades',
    source: '', note: data.base + (support ? ' Básico de nivel 1 habilitado para observar el apoyo de esta habilidad.' : ' Solo esta habilidad activa.') + ' Muñecos sin armadura, sin ataques y con vida restaurada. Los empujes sí se conservan.',
    create: () => createAbilityLab(config, camera, text => { el('metrics').textContent = text; }),
  });
}
el('trial-class').onchange = () => { trialChoices(); runTrial(); };
el('trial-ability').onchange = () => { trialVariants(); runTrial(); };
for (const id of ['trial-level', 'trial-element', 'trial-focus', 'trial-mutation', 'trial-finisher']) el(id).onchange = runTrial;
el('trial-run').onclick = () => { playing = true; seek(0); };
el('lab-mode').onchange = () => {
  const skills = abilityMode(); document.body.classList.toggle('ability-mode', skills);
  el('ability-settings').hidden = !skills; el('model-collection').hidden = skills;
  el('pose-settings').hidden = skills; el('model-notes').hidden = skills; el('source').hidden = skills;
  el(skills ? 'animation-note' : 'description').before(el('metrics'));
  if (skills) runTrial();
  else void select(catalog.find(c => c.id === el<HTMLSelectElement>('trial-class').value)!);
};
el('trial-level').replaceChildren(...Array.from({ length: 10 }, (_, i) => new Option(String(i + 1), String(i + 1))));
trialChoices();
el('pose').onchange = () => seek(0);
el('play').onclick = () => {
  playing = !playing;
  if (playing && animationTime >= (current?.animation?.duration(animationMode()) ?? 0)) seek(0);
  updatePlayback();
};
el('rewind').onclick = () => seek(0);
el('step').onclick = () => { playing = false; seek(animationTime + FRAME_STEP); };
el('timeline').oninput = () => { playing = false; seek(Number(el<HTMLInputElement>('timeline').value)); };
el('search').oninput = list; el('reset').onclick = () => fit(); el('front').onclick = () => fit(new THREE.Vector3(0, .1, -1)); el('side').onclick = () => fit(new THREE.Vector3(1, .1, 0)); el('back').onclick = () => fit(new THREE.Vector3(0, .1, 1));
el('rotate').onclick = () => { controls.autoRotate = !controls.autoRotate; el('rotate').setAttribute('aria-pressed', String(controls.autoRotate)); };
el('wire').onchange = wireframe; el('grid').onchange = () => { grid.visible = el<HTMLInputElement>('grid').checked; };
el('light').onchange = () => { const value = el<HTMLSelectElement>('light').value; ambient.intensity = value === 'dark' ? .45 : 2.1; key.color.set(value === 'warm' ? 0xffb566 : 0xfff0da); renderer.toneMappingExposure = value === 'dark' ? .8 : 1; };
el('notes').oninput = () => { notes[selected.id] = el<HTMLTextAreaElement>('notes').value; try { localStorage.setItem(storageKey, JSON.stringify(notes)); el('saved').textContent = 'Notas guardadas en este navegador.'; } catch { el('saved').textContent = 'No se pudo guardar. Exporta para conservar las notas.'; } };
el('export').onclick = () => { const text = '# La Fortaleza — revisión de modelos\n\n' + catalog.map(c => `## ${c.name} (${c.category})\nFuente: ${c.source}\n\n${notes[c.id] || 'Sin notas.'}\n`).join('\n'); const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'fortaleza-revision-modelos.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
const observer = new ResizeObserver(() => { const { width, height } = canvas.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); }); observer.observe(canvas);
let previous = performance.now();
function tick(now: number) {
  const dt = Math.min((now - previous) / 1000, .1); previous = now;
  if (current?.animation && playing) {
    const duration = current.animation.duration(animationMode());
    let next = animationTime + dt * Number(el<HTMLSelectElement>('animation-speed').value);
    if (next >= duration) {
      if (el<HTMLInputElement>('loop').checked) next %= duration;
      else { next = duration; playing = false; }
    }
    seek(next);
  }
  controls.update(dt); renderer.render(scene, camera); frame = requestAnimationFrame(tick);
}
frame = requestAnimationFrame(tick);
window.addEventListener('pagehide', () => { serial++; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); restoreMaterials(); current?.dispose(); grid.geometry.dispose(); (grid.material as THREE.Material).dispose(); renderer.dispose(); }, { once: true });
if (location.hash.startsWith('#trial-')) {
  const id = location.hash.slice(7);
  if (['warrior', 'mage', 'archer'].includes(id)) el<HTMLSelectElement>('trial-class').value = id;
  trialChoices(); el<HTMLSelectElement>('lab-mode').value = 'abilities'; el('lab-mode').dispatchEvent(new Event('change'));
} else void select(catalog.find(c => c.id === location.hash.slice(1)) ?? catalog[0]);
