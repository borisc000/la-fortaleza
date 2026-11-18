import { loadWarriorAsset } from './rendering/warrior-asset.ts';
import { loadArcherAsset } from './rendering/archer.ts';
import { loadMageAsset } from './rendering/mage-asset.ts';
import { createRangedArsenalView } from './rendering/ranged-arsenal.ts';
import { RangedArsenal } from './domain/classes/ranged-arsenal.ts';
import { abilityData } from './content/ranged-abilities.ts';
import './style.css';
import { WarriorArsenal } from './domain/classes/warrior-arsenal.ts';
import { GENERAL_STATS } from './content/warrior-abilities.ts';
import { createWarriorArsenalView } from './rendering/warrior-arsenal.ts';
import { relicSummary, affinitySummary } from './app/relics.ts';
import { RELICS, isRelic } from './content/relics.ts';
import { secondaryElement } from './domain/progression.ts';
import { techniqueSummary, techniqueCatalog } from './app/techniques.ts';
import { isTechnique, techniqueValue } from './content/techniques.ts';
import * as THREE from 'three';
import { loadAssets } from './rendering/assets.ts';
import { createWorld } from './rendering/world.ts';
import { ThirdPersonCamera } from './rendering/camera.ts';
import { bindControls } from './input/controls.ts';
import { PreviewState } from './app/state.ts';
import { CAMERA, SIMULATION_STEP, PLAY_AREA, VIEWS } from './content/config.ts';
import { EXPEDITION } from './content/expedition.ts';
import { angleDelta, stepMovement } from './domain/movement.ts';
import { Run } from './domain/run.ts';
import { UPGRADES, UPGRADE_IDS } from './content/progression.ts';
import { createEssenceView } from './rendering/essence.ts';
import { IMPETUS, WHIRLWIND } from './content/combat.ts';
import { classDefinition } from './content/classes.ts';
import type { ClassId } from './content/class-definition.ts';
import { createCombatView } from './rendering/combat.ts';
import { classAffinity } from './content/class-definition.ts';
import { ELEMENTS, isElement } from './content/elements.ts';
import { createElementView } from './rendering/elements.ts';
import { createProjectileView } from './rendering/projectiles.ts';
import { ENEMIES, actionStats } from './content/enemies.ts';
import { CAMPAIGN } from './content/campaign.ts';
import { regionAt } from './content/map.ts';
import type { Point } from './domain/movement.ts';
import { createExplorationView } from './rendering/exploration.ts';
import { CAPTURE } from './content/activities.ts';
import { GameAudio, AudioFeedback } from './audio/game-audio.ts';
import { incomingProjectile, HudCadence, edgeAnchor, radarPoint } from './app/guidance.ts';
import { createIcon, iconPath, upgradeKind } from './app/icons.ts';
import { DamageTally } from './app/damage-tally.ts';
import type { CombatSource } from './domain/combat.ts';
import { ARCHER_KIT, archerRange, arrowArmorIgnore } from './content/classes/archer.ts';
import { createArcherArrowView } from './rendering/archer-arrows.ts';
import { MAGE_KIT, mageRange } from './content/classes/mage.ts';
import type { Element } from './content/elements.ts';
import { createMageSpellView } from './rendering/mage-spells.ts';

const elements = new Map<string, HTMLElement>();
function element<T extends HTMLElement = HTMLElement>(id: string) { const el = elements.get(id) ?? document.getElementById(id); if (!el) throw new Error(`Falta el control ${id}`); elements.set(id, el); return el as T; }
const sound = new GameAudio();
const state = new PreviewState();
const canvas = element<HTMLCanvasElement>('world');
const events = new AbortController();
let disposed = false, disposeScene = () => {};
function showError(message: string) {
  sound.setPlaying(false); state.fail(); element('loading').hidden = true; element('welcome').hidden = true; element('paused').hidden = true;
  element('results').hidden = true; element('level-up').hidden = true; element('combat-hud').hidden = true;
  element('shop').hidden = true;
  element('boss-panel').hidden = true; element('encounter-banner').hidden = true;
  for (const id of ['exploration-hud', 'interaction-prompt', 'loot-feedback']) element(id).hidden = true;
  element('fatal').hidden = false; element('fatal-message').textContent = message;
  element('controls').hidden = true; element<HTMLButtonElement>('pause').disabled = true;
  if (document.pointerLockElement) document.exitPointerLock();
}
element('reload').addEventListener('click', () => location.reload(), { signal: events.signal });
async function boot() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const start = performance.now();
  disposeScene = () => renderer.dispose();
  const assets = await loadAssets(renderer.capabilities.getMaxAnisotropy(), done => {
    element<HTMLProgressElement>('load-progress').value = done;
    element('load-message').textContent = `Preparando materiales e iluminación · ${done} / 13`;
  });
  await Promise.all([loadMageAsset(), loadArcherAsset(), loadWarriorAsset()]);
  if (disposed) { assets.dispose(); renderer.dispose(); return; }
  disposeScene = () => { assets.dispose(); renderer.dispose(); };
  let selectedClass: ClassId = 'warrior';
  let selectedElement: Element = 'fire';
  let definition = classDefinition(selectedClass);
  const world = createWorld(assets, definition);
  element('class-name').textContent = definition.name;
  element('passive-name').textContent = definition.passive.name;
  element('skill-name').textContent = definition.skill.name;
  const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
  let run = new Run(PLAY_AREA, world.movementSolids, newSeed(), selectedClass), combat = run.combat;
  let combatView = createCombatView(world.scene, definition);
  const mageSpellView = createMageSpellView(world.scene);
  const archerArrowView = createArcherArrowView(world.scene);
  const essenceView = createEssenceView(world.scene);
  const elementView = createElementView(world.scene);
  const rangedView = createRangedArsenalView(world.scene);
  const arsenalView = createWarriorArsenalView(world.scene);
  const projectileView = createProjectileView(world.scene);
  const explorationView = createExplorationView(world.scene);
  const camera = new ThirdPersonCamera();
  const visibleFrustum = new THREE.Frustum(), viewMatrix = new THREE.Matrix4(), actorSphere = new THREE.Sphere(new THREE.Vector3(), 2.5);
  const isVisible = (point: Point) => { actorSphere.center.set(point.x, 1, point.z); return visibleFrustum.intersectsSphere(actorSphere); };
  const body = { ...EXPEDITION.start }, previousBody = { ...body };
  let accumulator = 0, movementSpeed = 0;
  const distanceControl = element<HTMLInputElement>('distance');
  distanceControl.min = String(CAMERA.minDistance); distanceControl.max = String(CAMERA.maxDistance);
  distanceControl.value = String(camera.desiredDistance);
  const loadSeconds = (performance.now() - start) / 1000;
  let quality = 'high', sensitivity = .003, invert = false, time = 0, previous = 0, frame = 0, raf = 0;
  let frames: number[] = [], frameTime = 0, samples = 0;
  let hudStamp = '', saturatedFrames = 0;
  const hudCadence = new HudCadence(), cameraTarget = new THREE.Vector3();
  const stackPips = [...document.querySelectorAll<HTMLElement>('[data-stack]')];
  const abilitySlots = Array.from({ length: 4 }, () => {
    const item = document.createElement('div'), icon = document.createElement('i'), name = document.createElement('strong'), level = document.createElement('em'), status = document.createElement('span');
    item.className = 'ability-slot empty'; icon.className = 'slot-icon'; item.append(icon, name, level, status);
    return { item, icon, name, level, status, peak: 0, id: '' };
  });
  const relicLabel = document.createElement('span'); relicLabel.textContent = 'Reliquias';
  const relicSockets = Array.from({ length: 4 }, () => { const socket = document.createElement('i'); socket.className = 'relic-socket'; return socket; });
  element('relics-hud').replaceChildren(relicLabel, ...relicSockets);
  let shownEssence = 0, shownLevel = 1;
  /** Turns "3 → 4" inside a rank line into a before/after step so the change reads at a glance. */
  function rankNodes(text: string) {
    return text.split(/(\d+ → \d+)/).map((part, index) => {
      if (index % 2 === 0) return document.createTextNode(part);
      const [from, to] = part.split(' → '), step = document.createElement('span'), before = document.createElement('i'), after = document.createElement('b');
      step.className = 'rank-step'; before.textContent = from; after.textContent = to; step.append(before, '→', after); return step;
    });
  }
  element('ability-bar').replaceChildren(...abilitySlots.map(slot => slot.item));
  // Fixed slots per kind: 0 major enemy, 1-3 attackers, 4-5 projectiles, 6 core.
  const edgeMarkers = Array.from({ length: 7 }, () => {
    const item = document.createElement('i'), label = document.createElement('b');
    item.className = 'edge-marker'; item.hidden = true; item.append(label);
    return { item, label };
  });
  element('edge-markers').replaceChildren(...edgeMarkers.map(marker => marker.item));
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedEffects = false, tally = new DamageTally();
  const quiet = () => calm.matches || reducedEffects;
  function fillTiles(container: HTMLElement, tiles: ReadonlyArray<readonly [string, string | number]>, count = false) {
    container.replaceChildren(...tiles.map(([label, value]) => {
      const tile = document.createElement('div'), term = document.createElement('dt'), data = document.createElement('dd');
      term.textContent = label; data.textContent = String(value); tile.append(term, data);
      if (count && typeof value === 'number' && value > 0 && !quiet()) {
        const started = performance.now();
        const step = (now: number) => { const t = Math.min(1, (now - started) / 800); data.textContent = String(Math.round(value * (1 - (1 - t) ** 3))); if (t < 1 && data.isConnected) requestAnimationFrame(step); };
        data.textContent = '0'; requestAnimationFrame(step);
      }
      return tile;
    }));
  }
  function buildChip(path: string | undefined, text: string, detail = '', affinity = '') {
    const item = document.createElement('li'), name = document.createElement('span'); item.className = 'build-chip'; item.dataset.element = affinity;
    if (path) item.append(createIcon(path)); name.textContent = text; item.append(name);
    if (detail) { const value = document.createElement('b'); value.textContent = detail; item.append(value); }
    return item;
  }
  /** Current configuration as icon chips, shared by the pause and results screens. */
  function renderBuild(container: HTMLElement) {
    const p = run.progression, groups: Array<[string, HTMLElement[]]> = [];
    if (p.development) groups.push(['Habilidades', p.development.book.snapshot.map(s => buildChip(iconPath(s.id), abilityData(s.id).name, `${s.level}/10`))]);
    else groups.push(['Técnicas', [buildChip(undefined, techniqueSummary(p))]]);
    const affinity: HTMLElement[] = [];
    if (p.element) affinity.push(buildChip(iconPath(p.element), ELEMENTS[p.element].name, `${p.affinityRank}/3`, p.element));
    if (p.element && p.mastery) affinity.push(buildChip(iconPath('mastery'), classAffinity(definition, p.element).mastery, '', p.element));
    if (p.secondaryElement) affinity.push(buildChip(iconPath(p.secondaryElement), `Apoyo: ${ELEMENTS[p.secondaryElement].name}`, `${p.secondaryRank}/3`, p.secondaryElement));
    if (affinity.length) groups.push(['Afinidad', affinity]);
    if (p.relics.length) groups.push(['Reliquias', p.relics.map(id => buildChip(iconPath(id), RELICS[id].name))]);
    const stats = p.development ? Object.entries(p.development.ranks(p)).filter(([, rank]) => rank).map(([id, rank]) => buildChip(iconPath(`stat:${id}`), GENERAL_STATS[id as keyof typeof GENERAL_STATS][0], `${rank}/4`))
      : UPGRADE_IDS.filter(id => p.ranks[id]).map(id => buildChip(iconPath(id), UPGRADES[id].name, String(p.ranks[id])));
    if (stats.length) groups.push(['Estadísticas', stats]);
    container.replaceChildren(...groups.map(([label, chips]) => { const row = document.createElement('div'), heading = document.createElement('p'), list = document.createElement('ul'); heading.className = 'section-label'; heading.textContent = label; list.append(...chips); row.append(heading, list); return row; }));
  }
  const clockText = () => { const elapsed = Math.floor(combat.time); return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`; };
  let shownHp = combat.hp;
  function bearingTo(target: Point) { return angleDelta(camera.yaw, Math.atan2(body.x - target.x, body.z - target.z)); }
  function placeMarker(slot: number, kind: string, target: Point | undefined, label = '') {
    const marker = edgeMarkers[slot]; marker.item.hidden = !target; if (!target) return;
    const bearing = bearingTo(target), anchor = edgeAnchor(bearing);
    marker.item.dataset.kind = kind; marker.label.textContent = label;
    marker.item.style.left = `${(50 + anchor.x * 50).toFixed(2)}%`; marker.item.style.top = `${(50 - anchor.y * 50).toFixed(2)}%`;
    marker.item.style.setProperty('--angle', `${(-bearing).toFixed(3)}rad`);
  }
  /** Brief arc towards whoever just landed a melee blow; projectiles keep only the full-screen flash. */
  function showHitDirection(attacker: Point) {
    const arc = element('hit-direction'); arc.style.setProperty('--angle', `${(-bearingTo(attacker)).toFixed(3)}rad`);
    arc.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 700, easing: 'ease-in' });
  }
  const radar = element<HTMLCanvasElement>('radar'), radarContext = radar.getContext('2d');
  const RADAR_RANGE = 32, RADAR_COLORS: Record<string, string> = { shop: '#ecd599', chest: '#e0a050', fountain: '#7fc8e8', capture: '#a8d890' };
  /** Hero-centred radar, camera forward at the top. Reads positions only; nothing here feeds back into the run. */
  function drawRadar() {
    const g = radarContext; if (!g) return;
    const size = radar.clientWidth || 150, ratio = Math.min(devicePixelRatio, 2), half = size / 2, reach = half - 9;
    if (radar.width !== Math.round(size * ratio)) radar.width = radar.height = Math.round(size * ratio);
    g.setTransform(ratio, 0, 0, ratio, 0, 0); g.clearRect(0, 0, size, size);
    g.strokeStyle = '#c5ced838'; g.lineWidth = 1;
    for (const ring of [.5, 1]) { g.beginPath(); g.arc(half, half, reach * ring, 0, Math.PI * 2); g.stroke(); }
    const at = (target: Point) => { const p = radarPoint(bearingTo(target), Math.hypot(target.x - body.x, target.z - body.z), RADAR_RANGE); return { x: half + p.x * reach, y: half + p.y * reach, pinned: p.pinned }; };
    const mark = (target: Point, color: string, shape: 'dot' | 'square' | 'ring' | 'diamond', r: number, dim = false) => {
      const p = at(target); g.globalAlpha = dim ? .35 : 1; g.fillStyle = g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
      if (shape === 'square') g.rect(p.x - r, p.y - r, r * 2, r * 2);
      else if (shape === 'diamond') { g.moveTo(p.x, p.y - r); g.lineTo(p.x + r, p.y); g.lineTo(p.x, p.y + r); g.lineTo(p.x - r, p.y); g.closePath(); }
      else g.arc(p.x, p.y, r, 0, Math.PI * 2);
      if (shape === 'ring') g.stroke(); else g.fill();
      g.globalAlpha = 1;
    };
    g.fillStyle = '#d8634fd9';
    for (const enemy of combat.enemies) { if (enemy.dead || enemy.kind === 'elite' || enemy.kind === 'boss') continue; const p = at(enemy); if (!p.pinned) g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
    for (const object of run.exploration.objects) {
      if (!object.discovered || !Object.hasOwn(RADAR_COLORS, object.kind)) continue;
      mark(object, RADAR_COLORS[object.kind], object.kind === 'shop' ? 'diamond' : object.kind === 'chest' ? 'square' : object.kind === 'capture' ? 'ring' : 'dot', object.kind === 'capture' ? 6 : object.kind === 'shop' ? 5 : 3.5, object.status !== 'available');
    }
    const core = run.progression.drops.find(drop => drop.core); if (core) { mark(core, '#fff0b8', 'dot', 3.5); mark(core, '#fff0b8', 'ring', 7); }
    const major = run.boss && !run.boss.dead ? run.boss : run.elite; if (major && !major.dead) mark(major, '#ff5a3c', 'diamond', 6.5);
    g.fillStyle = '#f1f4f7'; g.beginPath(); g.moveTo(half, half - 6); g.lineTo(half + 4.5, half + 5); g.lineTo(half, half + 2.5); g.lineTo(half - 4.5, half + 5); g.closePath(); g.fill();
  }
  // First-steps checklist: each line latches once its condition has been seen; nothing here changes the run.
  const TUTORIAL_KEY = 'fortaleza.primeros-pasos';
  let tutorialOn = true, tutorialYaw: number | undefined;
  try { tutorialOn = localStorage.getItem(TUTORIAL_KEY) !== 'hecho'; } catch { /* Storage is optional. */ }
  const tutorialSteps = [
    { text: 'Camina con WASD', done: () => Math.hypot(body.x - EXPEDITION.start.x, body.z - EXPEDITION.start.z) > 3 },
    { text: 'Mira con el ratón · rueda para el zoom', done: () => tutorialYaw !== undefined && Math.abs(angleDelta(tutorialYaw, camera.yaw)) > .35 },
    { text: 'Acércate a un enemigo: atacas solo', done: () => combat.kills > 0 },
    { text: 'Recoge la esencia que dejan', done: () => run.progression.totalEssence > 0 },
    { text: 'Pulsa E junto a un cofre o al mercader', done: () => run.exploration.chestsOpened > 0 || run.shop.isOpen || run.shop.purchases > 0 },
  ].map(step => { const item = document.createElement('li'); item.textContent = step.text; return { ...step, item, met: false }; });
  element('tutorial-steps').replaceChildren(...tutorialSteps.map(step => step.item));
  function updateTutorial() {
    element('tutorial').hidden = !state.active || !tutorialOn;
    if (!state.active || !tutorialOn) return;
    tutorialYaw ??= camera.yaw;
    for (const step of tutorialSteps) if (!step.met && step.done()) { step.met = true; step.item.classList.add('met'); sound.cue('select'); }
    if (tutorialSteps.every(step => step.met) && !element('tutorial').classList.contains('complete')) {
      element('tutorial').classList.add('complete');
      try { localStorage.setItem(TUTORIAL_KEY, 'hecho'); } catch { /* Storage is optional. */ }
      setTimeout(() => { tutorialOn = false; element('tutorial').hidden = true; }, 2600);
    }
  }
  const freshAnnounced = () => ({ started: false, phase: 'waves', elite: false, fury: false, capture: 'idle' });
  let announced = freshAnnounced();
  /** Large, brief centre-screen title for the moments that change what the player should do. */
  function announce(title: string, detail: string, tone = '') {
    const box = element('announce'); box.dataset.tone = tone;
    element('announce-title').textContent = title; element('announce-detail').textContent = detail;
    for (const running of box.getAnimations()) running.cancel();
    box.animate(quiet() ? [{ opacity: 1 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [{ opacity: 0, transform: 'translate(-50%, 14px) scale(.94)' }, { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: .1 }, { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: .84 }, { opacity: 0, transform: 'translate(-50%, -8px) scale(1)' }], { duration: 3400, easing: 'ease-out' });
  }
  function announceChanges() {
    if (!announced.started) { announced.started = true; announce('Los dominios exteriores', run.objective); }
    if (run.eliteSpawned && !announced.elite) { announced.elite = true; announce(ENEMIES.elite.name, 'Derrótalo y recoge su núcleo', 'danger'); }
    if (run.phase !== announced.phase) {
      announced.phase = run.phase;
      if (run.phase === 'elite-gate') announce('Último obstáculo', run.objective, 'danger');
      else if (run.phase === 'arrival') announce('El Castellano se aproxima', 'Las hordas se retiran', 'danger');
      else if (run.phase === 'boss') announce(ENEMIES.boss.name, 'Duelo en el territorio', 'danger');
    }
    if (!announced.fury && run.boss && !run.boss.dead && run.boss.hp <= run.boss.maxHp / 2) { announced.fury = true; announce('Furia', 'El Castellano ataca más rápido y dispara más flechas', 'danger'); }
    if (run.capture.state !== announced.capture) {
      announced.capture = run.capture.state;
      if (run.capture.state === 'warning') announce('Captura inminente', `Resiste ${CAPTURE.duration} s dentro del círculo`);
      else if (run.capture.state === 'completed') announce('Puesto asegurado', `+${CAPTURE.reward} monedas`, 'gain');
    }
  }
  let audioFeedback = new AudioFeedback(definition.stats.hp);
  const projected = new THREE.Vector3();
  function notice(message: string) { element('notice').textContent = message; element('notice').hidden = !message; }
  function sync() {
    element('app').dataset.phase = state.phase;
    sound.setPlaying(state.active);
    if (!state.active) { frames = []; frameTime = 0; element('threat').hidden = true; element('damage-flash').style.opacity = '0'; for (const marker of edgeMarkers) marker.item.hidden = true; }
    element('welcome').hidden = state.phase !== 'ready';
    element('paused').hidden = state.phase !== 'paused';
    element('results').hidden = state.phase !== 'results';
    element('level-up').hidden = state.phase !== 'choosing';
    element('shop').hidden = state.phase !== 'shopping';
    element('combat-hud').hidden = state.phase === 'loading' || state.phase === 'ready' || state.phase === 'error';
    element('controls').hidden = state.phase !== 'active';
    if (!state.active) for (const id of ['exploration-hud', 'interaction-prompt', 'loot-feedback']) element(id).hidden = true;
    element<HTMLButtonElement>('pause').disabled = !state.active;
    for (const id of ['world', 'settings', 'controls']) element(id).inert = state.phase === 'choosing' || state.phase === 'shopping';
    document.querySelector<HTMLElement>('.masthead')!.inert = state.phase === 'choosing' || state.phase === 'shopping';
  }
  function pause(reason: string) {
    if (!state.active) return;
    state.pause(); element('pause-reason').textContent = reason; sound.cue('menu', true);
    fillTiles(element('pause-grid'), [['Tiempo', clockText()], ['Abatidos', combat.kills], ['Nivel', run.progression.level], ['Monedas', run.exploration.coins]]);
    renderBuild(element('pause-build'));
    controls.clear(); if (document.pointerLockElement === canvas) document.exitPointerLock();
    cancelAnimationFrame(raf); previous = 0; accumulator = 0; movementSpeed = 0; Object.assign(previousBody, body); frames = []; frameTime = 0; sync();
  }
  const controls = bindControls(canvas, element('joystick'), element('joystick-thumb'), {
    active: () => state.active,
    rotate: (dx, dy) => camera.rotate(dx, dy, sensitivity, invert),
    zoom: delta => { camera.zoom(delta); distanceControl.value = String(camera.desiredDistance); },
    pause, notice,
    interactionButton: element<HTMLButtonElement>('interact'),
  });
  function render(dt: number) {
    const alpha = Math.min(1, accumulator / SIMULATION_STEP);
    world.hero.root.position.set(THREE.MathUtils.lerp(previousBody.x, body.x, alpha), 0, THREE.MathUtils.lerp(previousBody.z, body.z, alpha));
    world.hero.root.rotation.y = combat.whirlwind ? combat.whirlwind.yaw - (selectedClass === 'warrior' ? combat.whirlwind.age / WHIRLWIND.interval * Math.PI * 2 : 0) : combat.attack?.yaw ?? previousBody.yaw + angleDelta(previousBody.yaw, body.yaw) * alpha;
    world.hero.walk(dt, movementSpeed);
    camera.update(world.hero.root.position, world.obstacles, dt);
    camera.camera.updateMatrixWorld();
    visibleFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(camera.camera.projectionMatrix, camera.camera.matrixWorldInverse));
    const feedback = combatView.update(combat, world.hero.root.position, camera.camera, alpha, dt);
    essenceView.update(run.progression.drops, combat.time);
    elementView.update(combat, world.hero.root.position, alpha, dt); arsenalView.update(combat); rangedView.update(combat);
    projectileView.update(combat.projectiles.items, alpha);
    mageSpellView.update(combat, alpha); archerArrowView.update(combat, alpha);
    explorationView.update(run.exploration.objects, run.exploration.focus(body)?.id, combat.time, run.capture);
    world.hero.combatPose(combat.attack?.age, feedback.heroFlash, !!combat.whirlwind, combat.impetusStacks);
    element('damage-flash').style.opacity = String(feedback.damageFlash * (reducedEffects ? .2 : .65));
    world.hero.fade(THREE.MathUtils.clamp((camera.distance - .6) / .85, .08, 1));
    world.update(time); renderer.render(world.scene, camera.camera); frame++;
    if (hudCadence.due(dt)) {
    canvas.dataset.frame = String(frame); canvas.dataset.cameraDistance = camera.distance.toFixed(2); canvas.dataset.obstructed = String(camera.obstructed);
    canvas.dataset.yaw = camera.yaw.toFixed(3); canvas.dataset.pitch = camera.pitch.toFixed(3);
    canvas.dataset.playerX = body.x.toFixed(3); canvas.dataset.playerZ = body.z.toFixed(3);
    canvas.dataset.hp = String(combat.hp); canvas.dataset.kills = String(combat.kills); canvas.dataset.encounter = combat.status;
    canvas.dataset.impetus = String(combat.impetusStacks); canvas.dataset.whirlwind = String(!!combat.whirlwind);
    canvas.dataset.level = String(run.progression.level); canvas.dataset.xp = String(run.progression.xp); canvas.dataset.wave = String(run.wave); canvas.dataset.stage = run.phase; canvas.dataset.seed = String(run.seed); canvas.dataset.classId = run.definition.id;
    canvas.dataset.affinity = run.progression.element ?? ''; canvas.dataset.mastery = String(run.progression.mastery);
    canvas.dataset.coins = String(run.exploration.coins); canvas.dataset.openedChests = String(run.exploration.chestsOpened);
    canvas.dataset.captureProgress = run.capture.progress.toFixed(2); canvas.dataset.captureState = run.capture.state; canvas.dataset.shopping = String(run.shop.isOpen);
    updateHud();
    }
  }
  function updateHud() {
    const seconds = Math.floor(combat.time), clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    const mage = selectedClass === 'mage', archer = selectedClass === 'archer';
    const action = combat.cleared && run.progression.drops.length ? 'Recoge la esencia restante' : combat.whirlwind ? `${definition.skill.name} en curso` : combat.attack ? mage ? 'Lanzando hechizo' : archer ? combat.attack.age < definition.basic.windup ? 'Tensando el arco' : 'Flecha liberada' : combat.attack.age < definition.basic.windup ? 'Preparando espadazo' : combat.attack.age < definition.basic.windup + definition.basic.active ? (combat.attack.multiplier ?? 1) > 1 ? 'Espadazo potenciado' : 'Espadazo' : 'Recuperando postura' : combat.enemies.some(e => e.spawnRemaining > 0) ? 'Se acercan refuerzos' : combat.targetId ? 'Objetivo a alcance' : mage || archer ? `Busca un objetivo a menos de ${mage ? mageRange(combat.loadout) : archerRange(combat.loadout)} m` : 'Acércate a un enemigo';
    const remaining = Math.ceil(combat.whirlwindCooldown * 10) / 10;
    const windLabel = combat.whirlwind ? `${Math.max(0, combat.whirlwind.duration - combat.whirlwind.age).toFixed(1)} s · activo` : remaining > 0 ? `${remaining.toFixed(1)} s` : 'Listo · automático';
    const impetusTime = Math.ceil(combat.impetusRemaining * 10) / 10;
    const progress = run.progression;
    const basicState = progress.development?.book.snapshot[0];
    const arcaneCharges = basicState?.finisher === 0 ? 2 : MAGE_KIT.arcane.charges;
    const passiveTimeout = basicState?.finisher === 0 ? archer ? 6 : 5 : archer ? ARCHER_KIT.precision.timeout : IMPETUS.timeout;
    const untilBoss = Math.ceil(Math.max(0, CAMPAIGN.bossAt - combat.time));
    const stamp = `${combat.heroKit.state.barrier?.amount}:${combat.heroKit.state.barrier?.remaining.toFixed(1)}:${combat.heroKit.state.barrierCooldown?.toFixed(1)}:${combat.hp}:${combat.maxHp}:${combat.kills}:${clock}:${action}:${combat.impetusStacks}:${impetusTime}:${windLabel}:${progress.level}:${progress.xp}:${run.wave}:${run.phase}:${progress.element}:${progress.affinityRank}:${progress.core}:${progress.mastery}:${JSON.stringify(progress.techniques)}:${progress.development?.book.revision}:${Math.floor(combat.time * 10)}:${progress.secondaryElement}:${progress.secondaryRank}:${progress.relics.join()} `;
    if (stamp !== hudStamp) {
      hudStamp = stamp; element<HTMLProgressElement>('health').value = combat.hp;
      element<HTMLProgressElement>('health').max = combat.maxHp;
      element('health-text').textContent = `${Math.ceil(combat.hp)} / ${combat.maxHp}`;
      // The pale "recent damage" segment trails the fill through a delayed CSS transition on --lag.
      element('health').style.setProperty('--lag', `${(combat.hp / combat.maxHp * 100).toFixed(1)}%`);
      if (Math.abs(combat.hp - shownHp) > .01) {
        if (combat.hp < shownHp) { if (!quiet()) element('health').parentElement!.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], { duration: 170 }); }
        else if (combat.hp - shownHp >= 1) element('health-text').animate([{ color: '#c4f5b3', textShadow: '0 0 10px #7fdc6a' }, {}], { duration: 800 });
        shownHp = combat.hp;
      }
      element('kills').textContent = String(combat.kills);
      element('relics-hud').setAttribute('aria-label', `Reliquias ${progress.relics.length}/4`); element('relics-hud').title = relicSummary(progress);
      relicSockets.forEach((socket, i) => {
        const id = progress.relics[i]; if (socket.dataset.relic === (id ?? '')) return;
        const path = id && iconPath(id); socket.dataset.relic = id ?? ''; socket.classList.toggle('filled', !!id);
        socket.replaceChildren(...(path ? [createIcon(path)] : []));
      });
      element('techniques-hud').textContent = techniqueSummary(progress);
      const bar = element('ability-bar'); bar.hidden = !progress.development;
      if (progress.development && (combat.heroKit instanceof WarriorArsenal || combat.heroKit instanceof RangedArsenal)) {
        const kit = combat.heroKit, slots = progress.development.book.snapshot.filter(s => !['warrior:sword', 'mage:orb', 'archer:arrow'].includes(s.id));
        // Slots persist between refreshes so cooldown fills and highlights can animate.
        abilitySlots.forEach((slot, i) => {
          const s = slots[i]; slot.item.classList.toggle('empty', !s);
          if (!s) { slot.name.textContent = 'Espacio libre'; slot.level.textContent = slot.status.textContent = ''; slot.peak = 0; slot.id = ''; slot.icon.replaceChildren(); slot.item.classList.remove('active', 'ready'); slot.item.style.setProperty('--cooldown', '0'); return; }
          const active = kit.clock.active.some(a => a.ability.id === s.id), remaining = kit.clock.remaining(s.id), cooling = !active && remaining > .05;
          if (slot.id !== s.id) { const path = iconPath(s.id); slot.id = s.id; slot.icon.replaceChildren(...(path ? [createIcon(path)] : [])); }
          slot.peak = cooling ? Math.max(slot.peak, remaining) : 0;
          slot.name.textContent = abilityData(s.id).name; slot.level.textContent = `${s.level}/10`;
          slot.status.textContent = active ? 'Activo' : cooling ? `${remaining.toFixed(1)} s` : 'Listo';
          slot.item.classList.toggle('active', active); slot.item.classList.toggle('ready', !active && !cooling);
          slot.item.style.setProperty('--cooldown', cooling ? (remaining / slot.peak).toFixed(3) : '0');
        });
      }
      element('level-text').textContent = `Nivel ${progress.level}`;
      element('xp-text').textContent = `${progress.xp} / ${progress.threshold} esencia`;
      element<HTMLProgressElement>('experience').max = progress.threshold;
      element<HTMLProgressElement>('experience').value = progress.xp;
      if (progress.totalEssence > shownEssence && !quiet()) element('experience').animate([{ filter: 'brightness(2.2)' }, { filter: 'none' }], { duration: 380 });
      shownEssence = progress.totalEssence;
      element('group-text').textContent = run.phase === 'waves' ? `Oleada ${run.wave} · ${Math.floor(untilBoss / 60)}:${String(untilBoss % 60).padStart(2, '0')} hasta el jefe` : run.phase === 'elite-gate' ? 'Último obstáculo · el Portador' : 'Duelo en el territorio';
      element('affinity-text').textContent = affinitySummary(progress);
      element('affinity-text').dataset.element = progress.element ?? '';
      element('mastery-text').textContent = progress.mastery ? classAffinity(definition, progress.element!).mastery : `Maestría: afinidad ${progress.affinityRank}/3 · ${progress.core ? 'núcleo obtenido' : 'falta núcleo'}`;
      element('encounter-clock').textContent = clock; element('auto-action').textContent = action;
      element('impetus-text').textContent = archer ? `${combat.impetusStacks} / 3 · hasta ${ARCHER_KIT.precision.targets[combat.impetusStacks] + (progress.element === 'air' ? progress.mastery ? 2 : 1 : 0) + techniqueValue(progress.techniques, 'piercing')} blancos` : mage ? `${combat.impetusStacks} / ${arcaneCharges}${combat.impetusStacks === arcaneCharges ? ' · preparado' : ''}` : `${combat.impetusStacks} / ${IMPETUS.maxStacks} · +${Math.round(combat.impetusStacks * IMPETUS.damagePerStack * 100)} %`;
      element('impetus-expiry').textContent = archer ? combat.impetusStacks ? `Acierta de nuevo en ${impetusTime.toFixed(1)} s · fallar rompe la racha` : 'Encadena aciertos para atravesar enemigos' : mage ? combat.impetusStacks === arcaneCharges ? 'Próximo orbe: +60 % y daño en área' : `Cada ${arcaneCharges + 1} orbes se potencia · cargas sin caducidad` : combat.impetusStacks ? `Se pierde en ${impetusTime.toFixed(1)} s` : 'Acierta espadazos para acumular';
      element('impetus-time').hidden = mage;
      element<HTMLProgressElement>('impetus-time').max = passiveTimeout;
      element('impetus-time').setAttribute('aria-label', `Tiempo de ${definition.passive.name}`);
      element<HTMLProgressElement>('impetus-time').value = combat.impetusRemaining;
      stackPips.forEach((pip, index) => { pip.hidden = (mage || archer) && index >= (mage ? arcaneCharges : 3); pip.classList.toggle('filled', index < combat.impetusStacks); });
      element('whirlwind-text').textContent = windLabel;
      element<HTMLProgressElement>('whirlwind-time').value = combat.whirlwind ? 1 - combat.whirlwind.age / combat.whirlwind.duration : 1 - combat.whirlwindCooldown / (mage ? MAGE_KIT.cataclysm.cooldown : archer ? ARCHER_KIT.rain.cooldown : WHIRLWIND.cooldown);
      element('whirlwind-row').classList.toggle('skill-active', !!combat.whirlwind);
      const barrier = combat.heroKit.state.barrier;
      element('element-detail').hidden = progress.element !== 'earth' && progress.element !== 'air';
      element('element-detail').textContent = progress.element === 'earth'
        ? archer ? `Pedernal: ignora ${Math.round(arrowArmorIgnore(combat.loadout) * 100)} % de armadura · Quebranto +15 %`
          : barrier ? `Coraza: ${Math.ceil(barrier.amount)} puntos · ${Math.max(0, barrier.remaining).toFixed(1)} s`
          : `Coraza: ${(combat.heroKit.state.barrierCooldown ?? 0) > 0 ? `${combat.heroKit.state.barrierCooldown!.toFixed(1)} s` : mage ? 'al lanzar el cuarto hechizo' : 'al acertar con espada'} · Quebranto +15 %`
        : mage ? `Aire: alcance ${mageRange(combat.loadout)} m · empuje y vórtice` : archer ? `Aire: alcance ${archerRange(combat.loadout)} m · flechas rápidas y penetrantes` : 'Aire: tajos más largos · empuje y atracción';
    }
    const inGame = !['loading', 'ready', 'error', 'results'].includes(state.phase);
    element('encounter-banner').hidden = !inGame;
    element('encounter-banner').textContent = run.objective;
    element('encounter-banner').dataset.stage = run.phase;
    const major = run.boss && !run.boss.dead ? run.boss : run.elite;
    element('place').textContent = regionAt(body);
    const core = run.progression.drops.find(drop => drop.core);
    const heldPost = run.capture.pressure ? run.capture.point : undefined;
    const destination = core ?? major ?? heldPost ?? { x: 4, z: -18 };
    const delta = angleDelta(camera.yaw, Math.atan2(body.x - destination.x, body.z - destination.z));
    const bearing = Math.abs(delta) < Math.PI / 6 ? '↑ delante' : Math.abs(delta) > Math.PI * 5 / 6 ? '↓ detrás' : delta > 0 ? '← izquierda' : '→ derecha';
    element('wayfinder').textContent = `${core ? 'Núcleo' : major ? ENEMIES[major.kind].name : heldPost ? 'Puesto disputado' : 'Puerta de la fortaleza'} · ${Math.round(Math.hypot(destination.x - body.x, destination.z - body.z))} m · ${bearing}`;
    element('boss-panel').hidden = !inGame || !major;
    if (major) {
      element('boss-name').textContent = `${ENEMIES[major.kind].name}${major.kind === 'boss' && major.hp <= major.maxHp / 2 ? ' · Furia' : ''}`;
      element<HTMLProgressElement>('boss-health').max = major.maxHp; element<HTMLProgressElement>('boss-health').value = major.hp;
      element('boss-life').textContent = `${Math.ceil(major.hp)} / ${major.maxHp}`;
      element('boss-action').textContent = major.spawnRemaining > 0 ? 'Se aproxima…' : major.attack ? ({ melee: 'Barrido · sal del arco', slam: 'Golpe al suelo · sal del círculo', volley: 'Andanada · muévete de lado', shot: 'Disparo', charge: 'Carga' }[major.attack.action ?? 'melee']) : 'Reposicionándose';
    }
    let warning = '';
    const offscreen = (point: Point) => { projected.set(point.x, 1, point.z).project(camera.camera); return projected.z > 1 || projected.z < -1 ? 'behind' : Math.abs(projected.x) > .95 || Math.abs(projected.y) > .95 ? projected.x < 0 ? 'left' : 'right' : ''; };
    const attackers: Point[] = [], shots: Point[] = [];
    if (state.active) for (const enemy of combat.enemies) {
      if (enemy.dead || !enemy.attack || enemy.attack.age >= actionStats(enemy.kind, enemy.attack.action).windup || Math.hypot(enemy.x - body.x, enemy.z - body.z) > (enemy.kind === 'archer' || enemy.kind === 'charger' || enemy.kind === 'boss' ? 16 : 4)) continue;
      const side = offscreen(enemy); if (!side) continue;
      warning ||= side === 'behind' ? '¡Ataque a tu espalda!' : side === 'left' ? '¡Ataque por la izquierda!' : '¡Ataque por la derecha!';
      if (enemy !== major && attackers.push(enemy) === 3) break;
    }
    if (state.active) for (const p of combat.projectiles.items) {
      if (!incomingProjectile(p, body, world.movementSolids, definition.movement.radius) || !offscreen(p)) continue;
      warning ||= '¡Proyectil fuera de vista! Muévete de lado';
      if (shots.push(p) === 2) break;
    }
    const majorAway = state.active && major && !major.dead && offscreen(major) ? major : undefined;
    placeMarker(0, majorAway?.attack ? 'attack' : 'major', majorAway, majorAway ? `${Math.round(Math.hypot(majorAway.x - body.x, majorAway.z - body.z))} m` : '');
    for (let i = 0; i < 3; i++) placeMarker(1 + i, 'attack', attackers[i]);
    for (let i = 0; i < 2; i++) placeMarker(4 + i, 'shot', shots[i]);
    placeMarker(6, 'goal', state.active && core && offscreen(core) ? core : undefined, 'Núcleo');
    const low = state.active && combat.hp > 0 && combat.hp / combat.maxHp <= .3;
    element('combat-hud').classList.toggle('low-health', low);
    element('threat').dataset.kind = warning ? 'attack' : 'health';
    element('threat').hidden = !warning && !low;
    element('threat').textContent = warning || (low ? 'Vida baja · busca un suministro o una fuente' : '');
    element('encounter-banner').hidden = !inGame || !!warning || low;
    if (state.active) announceChanges();
    updateTutorial();
    updateExplorationHud();
    if (warning || low) element('loot-feedback').hidden = true;
  }
  function updateExplorationHud() {
    const exploration = run.exploration;
    element('exploration-hud').hidden = !state.active;
    element('coin-count').textContent = String(exploration.coins);
    const destinations = exploration.destinations(body);
    const list = element('nearby-objects');
    // Only replace DOM when displayed names/distances/bearings actually change.
    if (state.active) drawRadar();
    const descriptions = destinations.map(object => {
      const direction = angleDelta(camera.yaw, Math.atan2(body.x - object.x, body.z - object.z));
      const arrow = Math.abs(direction) < Math.PI / 6 ? '↑' : Math.abs(direction) > Math.PI * 5 / 6 ? '↓' : direction > 0 ? '←' : '→';
      return `${object.status === 'closed' ? '×' : object.status === 'used' ? '✓' : arrow} ${exploration.label(object)} · ${Math.round(Math.hypot(object.x - body.x, object.z - body.z))} m`;
    });
    const stamp = descriptions.join('|');
    if (list.dataset.stamp !== stamp) {
      list.dataset.stamp = stamp;
      list.replaceChildren(...descriptions.map((text, i) => { const line = document.createElement('li'); line.textContent = text; line.dataset.kind = destinations[i].kind; return line; }));
    }
    element('exploration-help').hidden = !!destinations.length;
    const focus = exploration.focus(body);
    element('interaction-prompt').hidden = !state.active || !focus;
    if (focus) {
      const full = focus.kind === 'fountain' && combat.hp >= combat.maxHp;
      element('interaction-description').textContent = focus.status === 'used' ? exploration.label(focus) : focus.kind === 'shop' ? 'Mercader · comprar pausa la expedición' : focus.kind === 'chest' ? `Cofre · ${focus.amount} monedas` : full ? 'Vida completa · conserva sus usos' : `Fuente · +${focus.amount} vida · ${focus.uses} usos`;
      const button = element<HTMLButtonElement>('interact'); button.disabled = focus.status === 'used' || full;
      element('interaction-verb').textContent = focus.kind === 'shop' ? 'Ver mercancías' : focus.kind === 'chest' ? 'Abrir cofre' : 'Beber';
    }
    const capture = run.capture, point = capture.point;
    element('capture-panel').hidden = !point?.discovered || Math.hypot(point.x - body.x, point.z - body.z) > CAPTURE.radius + 10;
    element('capture-title').textContent = capture.state === 'completed' ? `Puesto asegurado · +${CAPTURE.reward} monedas` : capture.state === 'closed' ? 'Captura cerrada' : capture.state === 'warning' ? `La captura comienza en ${Math.ceil(capture.warningRemaining)} s` : 'Puesto de la fortaleza';
    element<HTMLProgressElement>('capture-progress').max = CAPTURE.duration; element<HTMLProgressElement>('capture-progress').value = capture.progress;
    element('capture-description').textContent = capture.state === 'completed' ? 'Recompensa obtenida' : capture.state === 'closed' ? 'La llegada del Castellano cierra este objetivo.' : capture.state === 'idle' ? `Entra al círculo · resiste ${CAPTURE.duration} s · gana ${CAPTURE.reward} monedas` : capture.inside ? `${capture.progress.toFixed(1)} / ${CAPTURE.duration} s · atraes refuerzos mientras resistes` : 'Fuera del círculo · avance conservado';
    element('loot-feedback').hidden = !state.active || exploration.noticeRemaining <= 0;
    if (element('loot-feedback').textContent !== exploration.notice) element('loot-feedback').textContent = exploration.notice;
  }
  function showChoices() {
    const cards = element('upgrade-options'), nextButton = element<HTMLButtonElement>('upgrade-continue');
    cards.replaceChildren(); nextButton.hidden = true;
    const refreshTechniques = () => {
      element('relic-summary').textContent = relicSummary(run.progression);
      const inventory = element('relic-inventory'); inventory.replaceChildren();
      for (const id of run.progression.relics) { const li = document.createElement('li'); li.textContent = `${RELICS[id].name} · ${RELICS[id].description}`; inventory.append(li); }
      const catalog = element('technique-catalog'); catalog.replaceChildren();
      catalog.parentElement!.hidden = run.progression.choice()?.kind === 'relic';
      element('catalog-heading').textContent = run.progression.development ? `Repertorio: ${run.definition.name}` : 'Las cuatro técnicas de tu clase';
      element('catalog-help').textContent = run.progression.development ? 'Hasta cuatro habilidades equipadas; ataque básico aparte. Hasta nivel 10, con elecciones exclusivas en 5 y 10. Aprender y mejorar compiten con estadísticas y afinidades.' : 'Tres técnicas como máximo, rangos I–III a niveles 3, 5 y 7.';
      element('technique-slots').textContent = techniqueSummary(run.progression);
      for (const entry of techniqueCatalog(run.progression, run.progression.choice()?.level ?? run.progression.level)) {
        const item = document.createElement('li'), name = document.createElement('strong'), description = document.createElement('span'), status = document.createElement('small');
        name.textContent = entry.name; description.textContent = entry.description; status.textContent = entry.status; item.append(name, description, status); catalog.append(item);
      }
    };
    let choice = run.progression.choice(), compensated = 0;
    while (choice && !choice.options.length) {
      if (!run.fallback(choice.id)) break;
      compensated++; choice = run.progression.choice();
    }
    refreshTechniques();
    if (!choice) {
      element('upgrade-title').textContent = 'Preparado para continuar';
      element('upgrade-description').textContent = compensated ? 'No quedan mejoras elegibles para estos niveles. Recuperas un 25 % de vida máxima por elección pendiente.' : 'Tu mejora está lista.';
      nextButton.hidden = false; nextButton.textContent = 'Continuar'; return;
    }
    element('upgrade-title').textContent = choice.kind === 'relic' ? `${choice.source} · Elige tu recompensa` : choice.kind === 'element' ? 'Nivel 2 · Elige tu afinidad' : choice.kind === 'mastery' ? 'Despierta tu maestría' : `Nivel ${choice.level} · Elige una mejora`;
    element('upgrade-description').textContent = choice.kind === 'relic' ? 'Elige una reliquia compatible o toma las monedas. Máximo cuatro reliquias, sin duplicados ni sustituciones. No consume nivel.' : choice.kind === 'mastery' ? 'Afinidad III y núcleo reunidos. Activa tu transformación; no consume una subida de nivel.' : `Combate en pausa. ${choice.kind === 'element' ? 'Esta afinidad define tu kit y tu única maestría. Puedes añadir otra de apoyo desde nivel 5.' : 'La mejora dura hasta el final del encuentro.'}${run.progression.pending > 1 ? ` Tienes ${run.progression.pending} elecciones pendientes.` : ''}`;
    cards.dataset.count = String(choice.options.length);
    const choiceId = choice.id;
    for (const id of choice.options) {
      const upgrade = run.progression.option(id);
      const button = document.createElement('button'); button.className = 'upgrade-card';
      button.classList.toggle('technique-card', isTechnique(id) || isRelic(id) || id.startsWith('ability:'));
      button.dataset.element = secondaryElement(id) ?? (id === 'secondary-affinity' ? run.progression.secondaryElement : isElement(id) ? id : id === 'affinity' || id === 'mastery' ? run.progression.element : '');
      const { kind, label } = upgradeKind(id), path = iconPath(id, button.dataset.element);
      button.dataset.kind = kind; button.style.setProperty('--i', String(cards.childElementCount));
      const tag = document.createElement('em'); tag.className = 'upgrade-kind'; tag.textContent = label;
      const symbol = document.createElement('span'); symbol.className = 'upgrade-symbol'; symbol.textContent = upgrade.symbol; symbol.setAttribute('aria-hidden', 'true');
      if (path) symbol.replaceChildren(createIcon(path));
      const name = document.createElement('strong'); name.textContent = upgrade.name;
      const description = document.createElement('span'); description.textContent = upgrade.description;
      const rankText = document.createElement('small'); rankText.append(...rankNodes(upgrade.rank));
      const key = document.createElement('kbd'); key.textContent = String(cards.childElementCount + 1); key.setAttribute('aria-hidden', 'true');
      button.append(tag, symbol, name, description, rankText, key);
      button.addEventListener('click', () => {
        if (state.phase !== 'choosing' || !run.choose(choiceId, id)) return;
        refreshTechniques();
        audioFeedback.update(run, [], () => {}); sound.cue('upgrade', true);
        const acquired = document.createElement('div'); acquired.className = 'upgrade-acquired'; acquired.dataset.kind = kind; acquired.dataset.element = button.dataset.element ?? ''; acquired.append(symbol, tag);
        cards.dataset.count = '1'; cards.replaceChildren(acquired); element('upgrade-title').textContent = `${upgrade.name} · adquirido`;
        element('upgrade-description').textContent = upgrade.description;
        nextButton.textContent = run.progression.pending ? 'Siguiente mejora' : 'Continuar'; nextButton.hidden = false;
        render(0); nextButton.focus({ preventScroll: true });
      });
      cards.append(button);
    }
    (cards.firstElementChild as HTMLButtonElement | null)?.focus({ preventScroll: true });
  }
  function openLevelUp() {
    state.choose(); controls.clear(); movementSpeed = 0; accumulator = 0; previous = 0;
    Object.assign(previousBody, body); for (const enemy of combat.enemies) enemy.previous = { x: enemy.x, z: enemy.z };
    for (const p of combat.projectiles.items) p.previous = { x: p.x, z: p.z };
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    cancelAnimationFrame(raf); sync(); showChoices(); sound.cue('upgrade', true);
  }
  function continueUpgrade() {
    if (state.phase !== 'choosing') return;
    if (run.progression.pending) { showChoices(); return; }
    if (portrait.matches) return;
    void sound.unlock(); state.resumeChoice(); controls.clear(); sync(); previous = 0; accumulator = 0;
    if (run.progression.level !== shownLevel) { shownLevel = run.progression.level; if (!quiet()) element('level-text').animate([{ transform: 'scale(1.45)', boxShadow: '0 0 20px #ecd599', background: '#5b4a22' }, {}], { duration: 700, easing: 'ease-out' }); }
    canvas.focus({ preventScroll: true }); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    void controls.capture(true);
  }
  function showShopOffers() {
    const cards = element('shop-offers'); cards.replaceChildren();
    element('shop-balance').textContent = `${run.exploration.coins} monedas · Vida ${Math.ceil(combat.hp)} / ${combat.maxHp}`;
    const revision = run.shop.revision;
    element('shop-relics').textContent = relicSummary(run.progression);
    element('shop-description').textContent = `Combate y reloj en pausa. Estadísticas compartidas con las mejoras de nivel: máximo ${run.progression.development ? 4 : 3} rangos.`;
    for (const offer of run.shop.offers) {
      const button = document.createElement('button'); button.className = 'shop-offer';
      const name = document.createElement('strong'); name.textContent = offer.name;
      const description = document.createElement('span'); description.textContent = offer.upgrade ? run.progression.upgradeDescription(offer.upgrade) : offer.description;
      const tag = document.createElement('em'); tag.className = 'upgrade-kind'; tag.textContent = offer.relic ? 'Reliquia' : offer.upgrade ? 'Estadística' : 'Provisión';
      const head = document.createElement('div'), price = document.createElement('span'), path = iconPath(offer.relic ?? offer.upgrade ?? 'recovery');
      head.className = 'shop-head'; price.className = 'shop-price'; price.textContent = `${offer.cost} monedas`;
      if (path) head.append(createIcon(path)); head.append(name, price);
      const details = document.createElement('small'), rank = offer.upgrade ? run.progression.ranks[offer.upgrade] : 0, max = offer.upgrade ? run.progression.upgradeMax(offer.upgrade) : 0;
      details.append(`${run.shop.stock[offer.id]} disponibles`, ...(offer.upgrade ? rankNodes(rank < max ? ` · Rango ${rank} → ${rank + 1} / ${max}` : ` · Rango ${rank}/${max}`) : []));
      const reason = run.shop.reason(offer, run.exploration, run.progression, combat), short = reason === 'Monedas insuficientes';
      const action = document.createElement('span'); action.className = 'shop-buy'; button.disabled = !!reason; button.classList.toggle('short', short);
      action.textContent = short ? `Faltan ${offer.cost - run.exploration.coins} monedas` : reason || 'Comprar';
      button.append(tag, head, description, details, action);
      button.addEventListener('click', () => {
        if (state.phase !== 'shopping' || !run.shop.buy(offer.id, revision, run.exploration, run.progression, combat)) return;
        audioFeedback.update(run, [], () => {}); sound.cue('purchase', true);
        element('shop-message').textContent = `${offer.name} · adquirido`;
        showShopOffers(); render(0); element('shop-continue').focus({ preventScroll: true });
      });
      cards.append(button);
    }
  }
  function openShop() {
    state.shop(); controls.clear(); movementSpeed = 0; accumulator = 0; previous = 0;
    Object.assign(previousBody, body);
    for (const enemy of combat.enemies) enemy.previous = { x: enemy.x, z: enemy.z };
    for (const projectile of combat.projectiles.items) projectile.previous = { x: projectile.x, z: projectile.z };
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    cancelAnimationFrame(raf); element('shop-message').textContent = ''; sync(); showShopOffers();
    (element('shop-offers').querySelector<HTMLButtonElement>('button:not(:disabled)') ?? element('shop-continue')).focus({ preventScroll: true });
  }
  function continueShop() {
    if (state.phase !== 'shopping' || portrait.matches) return;
    void sound.unlock(); run.shop.close(); state.resumeShop(); controls.clear(); sync(); previous = 0; accumulator = 0;
    canvas.focus({ preventScroll: true }); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); void controls.capture(true);
  }
  function finishEncounter() {
    state.finish(); controls.clear(); movementSpeed = 0; accumulator = 0; Object.assign(previousBody, body);
    for (const enemy of combat.enemies) enemy.previous = { x: enemy.x, z: enemy.z };
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    element('result-title').textContent = combat.status === 'victory' ? 'El Castellano ha caído' : 'Has caído';
    element('result-description').textContent = combat.status === 'victory' ? 'Sobreviviste al asedio y derrotaste al señor de la fortaleza.' : 'La fortaleza conserva a su señor. Esquiva los disparos lateralmente y abandona las líneas y círculos antes del impacto.';
    const p = run.progression;
    fillTiles(element('result-grid'), [['Abatidos', combat.kills], ['Tiempo', clockText()], ['Oleada', run.wave], ['Nivel', p.level], ['Esencia', p.totalEssence], ['Vida', `${Math.ceil(combat.hp)} / ${combat.maxHp}`], ['Monedas', run.exploration.coins], ['Gastadas', run.shop.spent]], true);
    const sourceName = (source: CombatSource) => source === 'basic' || source === 'spell' || source === 'arrow' ? 'Ataque básico' : source === 'whirlwind' || source === 'cataclysm' || source === 'rain' ? definition.skill.name
      : ({ ability: 'Habilidades', 'ability-extra': 'Efectos de habilidades', burn: 'Quemadura', splash: 'Salpicadura', explosion: 'Explosión', quake: 'Temblor', gust: 'Ráfaga', enemy: 'Otros' } as Record<string, string>)[source];
    const damage = element('result-damage'), rows = tally.rows(sourceName), heading = document.createElement('p');
    heading.className = 'section-label'; heading.textContent = `Daño infligido ${Math.round(tally.dealt).toLocaleString('es-CL')} · recibido ${Math.round(tally.taken).toLocaleString('es-CL')}`;
    damage.replaceChildren(...(rows.length ? [heading] : []), ...rows.map(row => {
      const line = document.createElement('div'), name = document.createElement('span'), bar = document.createElement('i'), value = document.createElement('b');
      line.className = 'damage-row'; name.textContent = row.name; bar.style.setProperty('--share', row.share.toFixed(3)); value.textContent = `${Math.round(row.amount).toLocaleString('es-CL')} · ${Math.round(row.share * 100)} %`;
      line.append(name, bar, value); return line;
    }));
    renderBuild(element('result-build'));
    element('results').dataset.outcome = combat.status === 'victory' ? 'victory' : 'defeat';
    element('result-stats').textContent = `${run.exploration.chestsOpened} cofres · ${run.capture.state === 'completed' ? 'Puesto asegurado' : 'Puesto sin asegurar'}`;
    sync(); sound.cue(combat.status === 'victory' ? 'victory' : 'defeat', true);
  }
  function tick(now: number) {
    if (!state.active || disposed) return;
    const raw = previous ? now - previous : 0; previous = now;
    if (raw / 1000 > SIMULATION_STEP * 5) saturatedFrames++;
    const dt = Math.min(raw / 1000, SIMULATION_STEP * 5); time += dt; accumulator += dt;
    camera.update(cameraTarget.set(body.x, 0, body.z), world.obstacles, 0);
    camera.camera.updateMatrixWorld();
    visibleFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(camera.camera.projectionMatrix, camera.camera.matrixWorldInverse));
    while (accumulator + 1e-9 >= SIMULATION_STEP) {
      Object.assign(previousBody, body);
      movementSpeed = stepMovement(body, controls.movement(), camera.yaw, SIMULATION_STEP, { ...definition.movement, speed: run.progression.speed }, PLAY_AREA, world.movementSolids);
      const interactionId = controls.consumeInteraction() ? run.exploration.focus(body)?.id : undefined;
      const combatEvents = run.step(SIMULATION_STEP, body, isVisible, interactionId); combatView.events(combatEvents); elementView.events(combatEvents); tally.add(combatEvents);
      for (const event of combatEvents) if (event.type === 'hit' && event.target === 0) { const attacker = combat.enemies.find(enemy => enemy.attack?.id === event.attackId); if (attacker) showHitDirection(attacker); }
      audioFeedback.update(run, combatEvents, cue => sound.cue(cue));
      accumulator = Math.max(0, accumulator - SIMULATION_STEP);
      if (combat.status !== 'running') { finishEncounter(); break; }
      if (run.progression.pending) { openLevelUp(); break; }
      if (run.shop.isOpen) { openShop(); break; }
    }
    render(state.active ? dt : 0);
    if (state.active && raw > 0) { frames.push(raw); frameTime += raw; samples++; }
    if (frameTime >= 1000) {
      const sorted = [...frames].sort((a, b) => a - b);
      const fps = frames.length * 1000 / frameTime, p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))];
      element('metrics').textContent = `${fps.toFixed(1)} FPS · p95 ${p95.toFixed(1)} ms\n${combat.enemies.filter(e => !e.dead).length} enemigos vivos · objetivo local ${run.stage.localTarget}\n${renderer.info.render.calls} llamadas · ${renderer.info.render.triangles.toLocaleString('es-CL')} triángulos\n${canvas.width} × ${canvas.height} · DPR ${renderer.getPixelRatio().toFixed(2)}\nCámara ${camera.distance.toFixed(2)} / ${camera.desiredDistance.toFixed(1)} m\n${camera.obstructed ? 'Obstáculo: cámara acercada' : 'Vista despejada'}\nCarga ${loadSeconds.toFixed(2)} s · ${assets.failures.length} fallos\n${samples} fotogramas · ${saturatedFrames} limitados`;
      frames = []; frameTime = 0;
    }
    if (state.active) raf = requestAnimationFrame(tick);
  }
  const portrait = matchMedia('(orientation: portrait) and (max-width: 800px)');
  function resume() {
    if (portrait.matches) return;
    const entering = state.phase === 'ready';
    void sound.unlock(); state.resume(); if (!state.active) return;
    if (entering && !quiet()) {
      // The timer clears the curtain even if the browser stalls the animation (background or throttled tab).
      const fade = element('curtain').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-in' }); setTimeout(() => fade.cancel(), 1300);
      for (const part of document.querySelectorAll('.hero-plate, .action-bar, #exploration-hud, .top-stack')) part.animate([{ opacity: 0 }, { opacity: 0, offset: .45 }, { opacity: 1 }], { duration: 1100 });
    }
    element<HTMLDetailsElement>('settings').open = false;
    controls.clear(); accumulator = 0; movementSpeed = 0; Object.assign(previousBody, body);
    sync(); canvas.focus({ preventScroll: true }); previous = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    void controls.capture(true);
  }
  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'high' ? 1.5 : 1));
    const { width, height } = canvas.getBoundingClientRect(); renderer.setSize(width, height, false); camera.resize(width, height);
    if (portrait.matches) pause('Gira el dispositivo y pulsa Continuar.');
    if (!state.active && state.phase !== 'error') render(0);
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  function setView(index: number) {
    const view = VIEWS[index];
    controls.clear(); accumulator = 0; movementSpeed = 0;
    body.x = view.position[0]; body.z = view.position[2]; body.yaw = view.yaw;
    Object.assign(previousBody, body); world.hero.resetPose(); camera.reset(view.yaw);
    element('place').textContent = view.label;
    render(0);
  }
  function resetExpedition() {
    cancelAnimationFrame(raf); controls.clear(); combatView.reset(); essenceView.reset(); elementView.reset(); arsenalView.reset(); rangedView.reset(); projectileView.reset(); explorationView.reset(); mageSpellView.reset(); archerArrowView.reset();
    run = new Run(PLAY_AREA, world.movementSolids, newSeed(), selectedClass, selectedElement); combat = run.combat;
    element('upgrade-options').replaceChildren(); element('shop-offers').replaceChildren(); element('shop-message').textContent = '';
    sound.reset(); audioFeedback = new AudioFeedback(definition.stats.hp); shownHp = combat.hp; shownEssence = 0; shownLevel = 1; announced = freshAnnounced(); tally = new DamageTally();
    time = 0; previous = 0; frames = []; frameTime = 0; hudStamp = ''; setView(0); sync();
  }
  function restartEncounter() {
    if (state.phase !== 'results' && state.phase !== 'paused') return;
    state.restart(); resetExpedition(); resume();
  }
  function selection() {
    if (state.phase !== 'results' && state.phase !== 'paused') return;
    state.restart(); resetExpedition(); document.querySelector<HTMLElement>('.class-card[aria-pressed=true]')?.focus({ preventScroll: true });
  }
  function changeSelection() {
    if (state.phase !== 'ready') return;
    const id = element<HTMLSelectElement>('select-class').value;
    if (id !== 'warrior' && id !== 'mage' && id !== 'archer') return;
    selectedClass = id;
    const affinityValue = element<HTMLSelectElement>('select-element').value;
    selectedElement = isElement(affinityValue) ? affinityValue : 'fire';
    definition = classDefinition(selectedClass);
    combatView.dispose(); world.replaceHero(definition); combatView = createCombatView(world.scene, definition);
    element('class-name').textContent = definition.name;
    element('passive-name').textContent = definition.passive.name;
    element('skill-name').textContent = definition.skill.name;
    element('combat-hud').setAttribute('aria-label', `Estado del ${definition.name}`);
    element('whirlwind-time').setAttribute('aria-label', `Disponibilidad de ${definition.skill.name}`);
    element('initial-element').hidden = selectedClass !== 'mage';
    element('class-description').textContent = selectedClass === 'archer' ? '90 de vida · alcance de 12 m. Encadena aciertos para que tus flechas atraviesen hasta tres enemigos. Lluvia de flechas automática. Elige Fuego, Agua, Tierra o Aire al nivel 2.' : selectedClass === 'mage' ? `80 de vida · alcance de ${mageRange({ element: selectedElement, rank: 1, mastery: false })} m. ${classAffinity(definition, selectedElement).description} Cada cuarto orbe gana +60 % de daño y estalla en área. Cataclismo se activa automáticamente.` : '100 de vida · espada a corta distancia. Aprende hasta cuatro habilidades automáticas y mejóralas hasta nivel 10. Torbellino y espada pueden actuar a la vez. Elige Fuego, Agua, Tierra o Aire al nivel 2.';
    resetExpedition();
  }
  function on(id: string, fn: () => void) { element(id).addEventListener('click', () => { fn(); if (state.active) canvas.focus({ preventScroll: true }); }, { signal: events.signal }); }
  on('enter', resume); on('resume', resume); on('pause', () => pause('Pausaste la vista.'));
  on('restart', restartEncounter); on('restart-paused', restartEncounter);
  on('select-results', selection); on('select-paused', selection);
  element('select-class').addEventListener('change', changeSelection, { signal: events.signal });
  element('select-element').addEventListener('change', changeSelection, { signal: events.signal });
  // Class and affinity cards drive the original selects, which stay the single source of truth.
  function bindCards(selector: string, selectId: string, value: (card: HTMLElement) => string | undefined) {
    const cards = [...document.querySelectorAll<HTMLButtonElement>(selector)], select = element<HTMLSelectElement>(selectId);
    for (const card of cards) card.addEventListener('click', () => {
      if (state.phase !== 'ready') return;
      select.value = value(card) ?? select.value; select.dispatchEvent(new Event('change'));
      for (const other of cards) other.setAttribute('aria-pressed', String(value(other) === select.value));
    }, { signal: events.signal });
  }
  bindCards('.class-card', 'select-class', card => card.dataset.class);
  bindCards('.element-chip', 'select-element', card => card.dataset.element);
  document.addEventListener('keydown', event => {
    const digit = /^(?:Digit|Numpad)([1-4])$/.exec(event.code);
    if (!digit || state.phase !== 'choosing' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const card = element('upgrade-options').children[Number(digit[1]) - 1];
    if (card instanceof HTMLButtonElement) { event.preventDefault(); card.click(); }
  }, { signal: events.signal });
  on('upgrade-continue', continueUpgrade);
  on('shop-continue', continueShop);
  document.addEventListener('keydown', event => {
    if (event.code !== 'Escape' || state.phase !== 'shopping') return;
    event.preventDefault(); run.shop.close(); state.pauseShop(); controls.clear();
    element('pause-reason').textContent = 'Saliste del mercader. Pulsa Continuar para retomar la expedición.'; sync(); render(0);
  }, { signal: events.signal });
  element<HTMLInputElement>('sound-enabled').addEventListener('change', event => { sound.setEnabled((event.target as HTMLInputElement).checked); void sound.unlock(); }, { signal: events.signal });
  element<HTMLInputElement>('sound-volume').addEventListener('input', event => { sound.setVolume(Number((event.target as HTMLInputElement).value) / 100); }, { signal: events.signal });
  element<HTMLDetailsElement>('settings').addEventListener('toggle', () => { if (element<HTMLDetailsElement>('settings').open) pause('Ajustes abiertos. Pulsa Continuar para volver a la expedición.'); }, { signal: events.signal });
  window.addEventListener('blur', () => sound.silence(), { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) sound.silence(); }, { signal: events.signal });
  on('capture', () => { void controls.capture(); });
  on('left', () => { if (state.active) camera.rotate(-150, 0); });
  on('right', () => { if (state.active) camera.rotate(150, 0); });
  on('reset', () => { if (state.active) camera.reset(body.yaw); });
  element<HTMLSelectElement>('quality').addEventListener('change', event => {
    quality = (event.target as HTMLSelectElement).value; renderer.shadowMap.enabled = quality === 'high'; resize();
  }, { signal: events.signal });
  distanceControl.addEventListener('input', () => { camera.setDistance(Number(distanceControl.value)); }, { signal: events.signal });
  element<HTMLInputElement>('sensitivity').addEventListener('input', event => { sensitivity = Number((event.target as HTMLInputElement).value); }, { signal: events.signal });
  // Interface sounds: a soft tick when a control gains hover or focus, a click when it is pressed. Cards and offers keep their own cues.
  let ticked: HTMLElement | null = null;
  const control = (target: EventTarget | null) => target instanceof HTMLElement ? target.closest<HTMLElement>('button:not(:disabled), summary') : null;
  const uiTick = (event: Event) => { const hit = control(event.target); if (hit && hit !== ticked) sound.cue('tick', true); ticked = hit; };
  element('app').addEventListener('pointerover', uiTick, { signal: events.signal });
  element('app').addEventListener('focusin', uiTick, { signal: events.signal });
  element('app').addEventListener('click', event => { const hit = control(event.target); if (hit && !hit.matches('.upgrade-card, .shop-offer, #pause')) { void sound.unlock(); sound.cue('select', true); } }, { signal: events.signal });
  element<HTMLInputElement>('ui-scale').addEventListener('input', event => { element('app').style.setProperty('--ui-scale', String(Number((event.target as HTMLInputElement).value) / 100)); }, { signal: events.signal });
  element<HTMLInputElement>('reduce-effects').addEventListener('change', event => { reducedEffects = (event.target as HTMLInputElement).checked; element('app').dataset.effects = reducedEffects ? 'reduced' : ''; }, { signal: events.signal });
  element<HTMLInputElement>('invert').addEventListener('change', event => { invert = (event.target as HTMLInputElement).checked; }, { signal: events.signal });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); controls.clear(); cancelAnimationFrame(raf); showError('Se perdió la conexión con la tarjeta gráfica. Vuelve a cargar la página; si se repite, cierra otras pestañas 3D.'); }, { signal: events.signal });
  state.loaded(); element('loading').hidden = true; sync(); setView(0); resize();
  if (assets.failures.length) notice(`No se cargaron ${assets.failures.length} recursos. La vista usa materiales básicos donde fue necesario. Recarga la página para reintentar.`);
  disposeScene = () => { cancelAnimationFrame(raf); observer.disconnect(); controls.dispose(); combatView.dispose(); essenceView.dispose(); elementView.dispose(); arsenalView.dispose(); rangedView.dispose(); projectileView.dispose(); explorationView.dispose(); mageSpellView.dispose(); archerArrowView.dispose(); world.dispose(); assets.dispose(); renderer.dispose(); };
}
void boot().catch(error => { console.error(error); disposeScene(); showError('No pudimos crear la escena 3D. Comprueba que tu navegador tenga WebGL 2 y aceleración gráfica disponibles, y vuelve a cargar.'); });
function dispose() { if (disposed) return; disposed = true; events.abort(); sound.dispose(); disposeScene(); }
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);
