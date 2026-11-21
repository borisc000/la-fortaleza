import { heroFacing, playCombatPose } from './rendering/hero.ts';
import * as THREE from 'three';
import { loadWarriorAsset } from './rendering/warrior-asset.ts';
import { loadArcherAsset } from './rendering/archer.ts';
import { loadMageAsset } from './rendering/mage-asset.ts';
import { loadAssets } from './rendering/assets.ts';
import { createWorld } from './rendering/world.ts';
import { createStoneHeartWorld } from './rendering/stone-heart-world.ts';
import { createExpeditionViews } from './rendering/expedition-views.ts';
import { ThirdPersonCamera } from './rendering/camera.ts';
import { bindControls } from './input/controls.ts';
import { PreviewState } from './app/state.ts';
import { DamageTally } from './app/damage-tally.ts';
import { GameAudio, AudioFeedback } from './audio/game-audio.ts';
import { SIMULATION_STEP, PLAY_AREA } from './content/config.ts';
import { EXPEDITION } from './content/expedition.ts';
import type { ExpeditionId } from './content/expedition.ts';
import { STONE_HEART_BOUNDS, STONE_HEART_LAYOUT } from './content/stone-heart.ts';
import { classDefinition } from './content/classes.ts';
import type { ClassId } from './content/class-definition.ts';
import type { Element } from './content/elements.ts';
import { angleDelta, stepMovement } from './domain/movement.ts';
import type { Point } from './domain/movement.ts';
import { Run } from './domain/run.ts';
import type { UiContext } from './ui/context.ts';
import { bindCampaign } from './ui/campaign.ts';
import { element } from './ui/dom.ts';
import { createHud } from './ui/hud.ts';
import { bindInterfaceDialogs } from './ui/interface-dialogs.ts';
import { createLevelUpScreen } from './ui/level-up.ts';
import { createShopScreen } from './ui/shop.ts';
import { renderPauseSummary, renderResults } from './ui/results.ts';
import { bindInterfaceSounds, bindSettings } from './ui/settings.ts';

const EXPEDITION_OVERLAYS: Partial<Record<PreviewState['phase'], string>> = {
  paused: 'paused',
  results: 'results',
  choosing: 'level-up',
  shopping: 'shop',
};

const sound = new GameAudio();
const state = new PreviewState();
const canvas = element<HTMLCanvasElement>('world');
const events = new AbortController();
const portrait = matchMedia('(orientation: portrait) and (max-width: 800px)');
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const campaign = bindCampaign(state, portrait, events.signal);
const confirmExpedition = bindInterfaceDialogs(events.signal);
const settingsHooks = { qualityChanged: () => {}, distanceChanged: (_distance: number) => {} };
const settings = bindSettings(sound, events.signal, settingsHooks);
bindInterfaceSounds(sound, events.signal);
campaign.sync();
let disposed = false,
  disposeScene = () => {};

function showError(message: string) {
  sound.setPlaying(false);
  state.fail();
  campaign.sync();
  element('app').dataset.phase = state.phase;
  canvas.inert = true;
  for (const id of [
    'paused',
    'results',
    'level-up',
    'combat-hud',
    'shop',
    'boss-panel',
    'encounter-banner',
    'exploration-hud',
    'interaction-prompt',
    'loot-feedback',
    'portrait',
  ])
    element(id).hidden = true;
  for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) dialog.close();
  element('fatal').hidden = false;
  element('fatal-message').textContent = message;
  element('controls').hidden = true;
  element<HTMLButtonElement>('pause').disabled = true;
  if (document.pointerLockElement) document.exitPointerLock();
  element('reload').focus();
}
element('reload').addEventListener('click', () => location.reload(), { signal: events.signal });

async function boot() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = settings.quality === 'high';
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const start = performance.now();
  disposeScene = () => renderer.dispose();
  const assets = await loadAssets(renderer.capabilities.getMaxAnisotropy(), done => {
    element<HTMLProgressElement>('load-progress').value = done;
    element('load-message').textContent =
      done < 13 ? `Cargando materiales · ${done} de 13` : 'Preparando personajes y escenario…';
  });
  await Promise.all([loadMageAsset(), loadArcherAsset(), loadWarriorAsset()]);
  if (disposed) {
    assets.dispose();
    renderer.dispose();
    return;
  }
  disposeScene = () => {
    assets.dispose();
    renderer.dispose();
  };

  // Scene resources belong to the selected expedition. A retry only resets its run.
  let selectedExpedition: ExpeditionId = 'exterior';
  let selectedClass: ClassId = 'warrior';
  let selectedElement: Element = 'fire';
  let definition = classDefinition(selectedClass);
  let world: ReturnType<typeof createWorld> | ReturnType<typeof createStoneHeartWorld> = createWorld(
    assets,
    definition,
  );
  element('class-name').textContent = definition.name;
  element('passive-name').textContent = definition.passive.name;
  element('skill-name').textContent = definition.skill.name;
  const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
  let run = new Run(PLAY_AREA, world.movementSolids, newSeed(), selectedClass),
    combat = run.combat;
  let audioFeedback = new AudioFeedback(definition.stats.hp),
    tally = new DamageTally();

  let views = createExpeditionViews(world.scene, definition);

  // Camera, hero body and frame loop bookkeeping.
  const camera = new ThirdPersonCamera();
  const visibleFrustum = new THREE.Frustum(),
    viewMatrix = new THREE.Matrix4(),
    actorSphere = new THREE.Sphere(new THREE.Vector3(), 2.5);
  const isVisible = (point: Point) => {
    actorSphere.center.set(point.x, 1, point.z);
    return visibleFrustum.intersectsSphere(actorSphere);
  };
  const body = { ...EXPEDITION.start },
    previousBody = { ...body };
  const cameraTarget = new THREE.Vector3();
  let accumulator = 0,
    movementSpeed = 0,
    time = 0,
    previous = 0,
    frame = 0,
    raf = 0;
  let frames: number[] = [],
    frameTime = 0,
    samples = 0,
    saturatedFrames = 0;
  const loadSeconds = (performance.now() - start) / 1000;
  camera.setDistance(settings.distance);
  renderer.shadowMap.enabled = settings.quality === 'high';
  settingsHooks.qualityChanged = () => {
    renderer.shadowMap.enabled = settings.quality === 'high';
    resize();
  };
  settingsHooks.distanceChanged = distance => {
    camera.setDistance(distance);
    if (state.phase === 'paused') {
      camera.distance = camera.desiredDistance;
      render(0);
    }
  };

  // Interface modules read the expedition through this live view.
  const ctx: UiContext = {
    get run() {
      return run;
    },
    get definition() {
      return definition;
    },
    get classId() {
      return selectedClass;
    },
    body,
    camera,
    state,
    quiet: () => calm.matches || settings.reducedEffects,
    bearingTo: target => angleDelta(camera.yaw, Math.atan2(body.x - target.x, body.z - target.z)),
  };
  const hud = createHud(ctx, cue => sound.cue(cue));
  const levelUp = createLevelUpScreen(ctx, {
    chosen: () => {
      audioFeedback.update(run, [], () => {});
      sound.cue('upgrade', true);
    },
    redraw: () => render(0),
  });
  const shop = createShopScreen(ctx, {
    purchased: () => {
      audioFeedback.update(run, [], () => {});
      sound.cue('purchase', true);
    },
    redraw: () => render(0),
  });

  function notice(message: string) {
    element('notice').textContent = message;
    element('notice').hidden = !message;
  }

  /** Shows the panels that belong to the current phase. */
  function sync() {
    const phase = state.phase;
    const inExpedition = phase !== 'loading' && phase !== 'ready' && phase !== 'error';
    const needsRotation = inExpedition && portrait.matches;
    const activeOverlay = needsRotation ? 'portrait' : EXPEDITION_OVERLAYS[phase];
    const newlyShown = activeOverlay && element(activeOverlay).hidden;
    element('app').dataset.phase = phase;
    canvas.inert = !state.active;
    sound.setPlaying(state.active);
    if (!state.active) {
      frames = [];
      frameTime = 0;
      element('threat').hidden = true;
      element('damage-flash').style.opacity = '0';
      element<HTMLDetailsElement>('camera-menu').open = false;
      hud.hideMarkers();
    }
    campaign.sync();
    for (const id of ['paused', 'results', 'level-up', 'shop', 'portrait']) element(id).hidden = id !== activeOverlay;
    element('combat-hud').hidden = !inExpedition;
    element('controls').hidden = phase !== 'active';
    if (!state.active)
      for (const id of ['exploration-hud', 'interaction-prompt', 'loot-feedback']) element(id).hidden = true;
    element<HTMLButtonElement>('pause').disabled = !state.active;
    if (newlyShown) element(activeOverlay).querySelector('.panel-scroll')?.scrollTo(0, 0);
    if (newlyShown && activeOverlay === 'paused') element('resume').focus({ preventScroll: true });
    if (newlyShown && activeOverlay === 'results') element('result-title').focus({ preventScroll: true });
    if (newlyShown && activeOverlay === 'portrait') element('portrait-title').focus({ preventScroll: true });
  }

  /** Stops the loop and freezes interpolation so a menu can open over a still frame. */
  function halt() {
    controls.clear();
    movementSpeed = 0;
    accumulator = 0;
    previous = 0;
    Object.assign(previousBody, body);
    for (const enemy of combat.enemies) enemy.previous = { x: enemy.x, z: enemy.z };
    for (const projectile of combat.projectiles.items) projectile.previous = { x: projectile.x, z: projectile.z };
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    cancelAnimationFrame(raf);
  }

  /** Restarts the loop after a menu closes and asks for pointer capture again. */
  function startLoop() {
    canvas.focus({ preventScroll: true });
    previous = 0;
    accumulator = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    void controls.capture(true);
  }

  function pause(reason = '') {
    if (!state.active) return;
    state.pause();
    element('pause-reason').textContent = reason;
    sound.cue('menu', true);
    renderPauseSummary(ctx);
    controls.clear();
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    cancelAnimationFrame(raf);
    previous = 0;
    accumulator = 0;
    movementSpeed = 0;
    Object.assign(previousBody, body);
    frames = [];
    frameTime = 0;
    sync();
  }

  const controls = bindControls(canvas, element('joystick'), element('joystick-thumb'), {
    active: () => state.active,
    rotate: (dx, dy) => camera.rotate(dx, dy, settings.sensitivity, settings.invert),
    zoom: delta => camera.zoom(delta),
    pause,
    notice,
    interactionButton: element<HTMLButtonElement>('interact'),
  });

  /** Exposes a few live values on the canvas for browser checks and diagnostics. */
  function publishDiagnostics() {
    const data = canvas.dataset,
      progress = run.progression;
    data.frame = String(frame);
    data.cameraDistance = camera.distance.toFixed(2);
    data.obstructed = String(camera.obstructed);
    data.yaw = camera.yaw.toFixed(3);
    data.pitch = camera.pitch.toFixed(3);
    data.playerX = body.x.toFixed(3);
    data.playerZ = body.z.toFixed(3);
    data.hp = String(combat.hp);
    data.kills = String(combat.kills);
    data.encounter = combat.status;
    data.impetus = String(combat.impetusStacks);
    data.whirlwind = String(!!combat.whirlwind);
    data.level = String(progress.level);
    data.xp = String(progress.xp);
    data.wave = String(run.wave);
    data.expedition = run.expeditionId;
    data.stage = run.stoneHeart?.phase ?? run.phase;
    data.gateOpen = String(run.stoneHeart?.gateOpen ?? false);
    data.living = String(combat.enemies.filter(enemy => !enemy.dead).length);
    data.seed = String(run.seed);
    data.classId = run.definition.id;
    data.affinity = progress.element ?? '';
    data.mastery = String(progress.mastery);
    data.coins = String(run.exploration.coins);
    data.openedChests = String(run.exploration.chestsOpened);
    data.captureProgress = run.capture.progress.toFixed(2);
    data.captureState = run.capture.state;
    data.shopping = String(run.shop.isOpen);
  }

  function render(dt: number) {
    if ('setMission' in world && run.stoneHeart) {
      const mission = run.stoneHeart;
      world.setMission(mission.gateOpen, mission.phase === 'signal', mission.phase === 'complete', time);
    }
    const alpha = Math.min(1, accumulator / SIMULATION_STEP);
    world.hero.root.position.set(
      THREE.MathUtils.lerp(previousBody.x, body.x, alpha),
      0,
      THREE.MathUtils.lerp(previousBody.z, body.z, alpha),
    );
    world.hero.root.rotation.y = heroFacing(combat, previousBody.yaw + angleDelta(previousBody.yaw, body.yaw) * alpha);
    world.hero.walk(dt, movementSpeed);
    camera.update(world.hero.root.position, world.obstacles, dt);
    camera.camera.updateMatrixWorld();
    visibleFrustum.setFromProjectionMatrix(
      viewMatrix.multiplyMatrices(camera.camera.projectionMatrix, camera.camera.matrixWorldInverse),
    );
    const feedback = views.combat.update(combat, world.hero.root.position, camera.camera, alpha, dt);
    views.essence.update(run.progression.drops, combat.time);
    views.elements.update(combat, world.hero.root.position, alpha, dt);
    views.arsenal.update(combat);
    views.ranged.update(combat);
    views.projectiles.update(combat.projectiles.items, alpha);
    views.mageSpells.update(combat, alpha);
    views.archerArrows.update(combat, alpha);
    views.exploration.update(run.exploration.objects, run.exploration.focus(body)?.id, combat.time, run.capture);
    playCombatPose(world.hero, combat, feedback.heroFlash);
    element('damage-flash').style.opacity = String(feedback.damageFlash * (settings.reducedEffects ? 0.2 : 0.65));
    world.hero.fade(THREE.MathUtils.clamp((camera.distance - 0.6) / 0.85, 0.08, 1));
    world.update(time);
    renderer.render(world.scene, camera.camera);
    frame++;
    if (hud.due(dt)) {
      publishDiagnostics();
      hud.update();
    }
  }

  function openLevelUp() {
    state.choose();
    halt();
    sync();
    levelUp.show();
    sound.cue('upgrade', true);
  }
  function continueUpgrade() {
    if (state.phase !== 'choosing') return;
    if (run.progression.pending) {
      levelUp.show();
      return;
    }
    if (portrait.matches) return;
    void sound.unlock();
    state.resumeChoice();
    controls.clear();
    sync();
    hud.celebrateLevel();
    startLoop();
  }
  function openShop() {
    state.shop();
    halt();
    element('shop-message').textContent = '';
    sync();
    shop.show();
    shop.focusFirst();
  }
  function continueShop() {
    if (state.phase !== 'shopping' || portrait.matches) return;
    void sound.unlock();
    run.shop.close();
    state.resumeShop();
    controls.clear();
    sync();
    startLoop();
  }
  function finishEncounter() {
    state.finish();
    controls.clear();
    movementSpeed = 0;
    accumulator = 0;
    Object.assign(previousBody, body);
    for (const enemy of combat.enemies) enemy.previous = { x: enemy.x, z: enemy.z };
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    renderResults(ctx, tally);
    sync();
    sound.cue(combat.status === 'victory' ? 'victory' : 'defeat', true);
  }

  /** Samples frame intervals once per second for the diagnostics panel. */
  function sampleFrame(raw: number) {
    if (state.active && raw > 0) {
      frames.push(raw);
      frameTime += raw;
      samples++;
    }
    if (frameTime < 1000) return;
    const sorted = [...frames].sort((a, b) => a - b);
    const fps = (frames.length * 1000) / frameTime,
      p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    element('metrics').textContent = [
      `${fps.toFixed(1)} FPS · p95 ${p95.toFixed(1)} ms`,
      `${combat.enemies.filter(e => !e.dead).length} enemigos vivos · ${run.stoneHeart?.section ?? `objetivo local ${run.stage.localTarget}`}`,
      `${renderer.info.render.calls} llamadas · ${renderer.info.render.triangles.toLocaleString('es-CL')} triángulos`,
      `${canvas.width} × ${canvas.height} · DPR ${renderer.getPixelRatio().toFixed(2)}`,
      `Cámara ${camera.distance.toFixed(2)} / ${camera.desiredDistance.toFixed(1)} m`,
      camera.obstructed ? 'Obstáculo: cámara acercada' : 'Vista despejada',
      `Carga ${loadSeconds.toFixed(2)} s · ${assets.failures.length} fallos`,
      `${samples} fotogramas · ${saturatedFrames} limitados`,
    ].join('\n');
    frames = [];
    frameTime = 0;
  }

  function tick(now: number) {
    if (!state.active || disposed) return;
    const raw = previous ? now - previous : 0;
    previous = now;
    if (raw / 1000 > SIMULATION_STEP * 5) saturatedFrames++;
    const dt = Math.min(raw / 1000, SIMULATION_STEP * 5);
    time += dt;
    accumulator += dt;
    camera.update(cameraTarget.set(body.x, 0, body.z), world.obstacles, 0);
    camera.camera.updateMatrixWorld();
    visibleFrustum.setFromProjectionMatrix(
      viewMatrix.multiplyMatrices(camera.camera.projectionMatrix, camera.camera.matrixWorldInverse),
    );
    while (accumulator + 1e-9 >= SIMULATION_STEP) {
      Object.assign(previousBody, body);
      movementSpeed = stepMovement(
        body,
        controls.movement(),
        camera.yaw,
        SIMULATION_STEP,
        { ...definition.movement, speed: run.progression.speed },
        run.bounds,
        run.movementSolids,
      );
      const interactionId = controls.consumeInteraction() ? run.focus(body)?.id : undefined;
      const combatEvents = run.step(SIMULATION_STEP, body, isVisible, interactionId);
      views.combat.events(combatEvents, combat.time);
      views.elements.events(combatEvents);
      tally.add(combatEvents);
      for (const event of combatEvents)
        if (event.type === 'hit' && event.target === 0) {
          const attacker = combat.enemies.find(enemy => enemy.attack?.id === event.attackId);
          if (attacker) hud.showHitDirection(attacker);
        }
      audioFeedback.update(run, combatEvents, cue => sound.cue(cue));
      accumulator = Math.max(0, accumulator - SIMULATION_STEP);
      if (combat.status !== 'running') {
        finishEncounter();
        break;
      }
      if (run.progression.pending) {
        openLevelUp();
        break;
      }
      if (run.shop.isOpen) {
        openShop();
        break;
      }
    }
    render(state.active ? dt : 0);
    sampleFrame(raw);
    if (state.active) raf = requestAnimationFrame(tick);
  }

  function resume() {
    if (portrait.matches) return;
    const entering = state.phase === 'ready';
    void sound.unlock();
    state.resume();
    if (!state.active) return;
    if (entering && !ctx.quiet()) {
      // The timer clears the curtain even if the browser stalls the animation (background or throttled tab).
      const fade = element('curtain').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-in' });
      setTimeout(() => fade.cancel(), 1300);
      for (const part of document.querySelectorAll('.hero-plate, .action-bar, #exploration-hud, .top-stack'))
        part.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }], { duration: 1100 });
    }
    controls.clear();
    accumulator = 0;
    movementSpeed = 0;
    Object.assign(previousBody, body);
    sync();
    startLoop();
  }
  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, settings.quality === 'high' ? 1.5 : 1));
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.resize(width, height);
    if (portrait.matches && state.active) pause('Gira el dispositivo y pulsa Continuar.');
    else sync();
    if (!state.active && state.phase !== 'error') render(0);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  function setArrival() {
    const { start, arrivalName } = run.layout;
    controls.clear();
    accumulator = 0;
    movementSpeed = 0;
    Object.assign(body, start);
    Object.assign(previousBody, body);
    world.hero.resetPose();
    camera.reset(start.yaw);
    element('place').textContent = arrivalName;
    element('pause-stage').textContent = run.title;
    canvas.setAttribute(
      'aria-label',
      `${run.title}. WASD para caminar, ratón para mirar y rueda para ajustar la cámara.`,
    );
    render(0);
  }
  function resetExpedition() {
    cancelAnimationFrame(raf);
    controls.clear();
    views.reset();
    const interior = selectedExpedition === 'stone-heart';
    run = new Run(
      interior ? STONE_HEART_BOUNDS : PLAY_AREA,
      world.movementSolids,
      newSeed(),
      selectedClass,
      selectedElement,
      interior ? STONE_HEART_LAYOUT : EXPEDITION,
    );
    combat = run.combat;
    element('upgrade-options').replaceChildren();
    element('shop-offers').replaceChildren();
    element('shop-message').textContent = '';
    sound.reset();
    audioFeedback = new AudioFeedback(definition.stats.hp);
    tally = new DamageTally();
    hud.reset();
    time = 0;
    previous = 0;
    frames = [];
    frameTime = 0;
    camera.setDistance(settings.distance);
    setArrival();
    sync();
  }
  function restartEncounter() {
    if (state.phase !== 'results' && state.phase !== 'paused') return;
    state.restart();
    resetExpedition();
    resume();
  }
  function leaveExpedition(screen: 'welcome' | 'home') {
    if (state.phase !== 'results' && state.phase !== 'paused') return;
    state.restart();
    sync();
    campaign.show(screen);
  }
  function enterExpedition() {
    if (state.phase !== 'ready' || portrait.matches) return;
    const { expedition, classId, affinity } = campaign.selection();
    const nextDefinition = classDefinition(classId);
    if (expedition !== selectedExpedition) {
      const nextWorld =
        expedition === 'stone-heart'
          ? createStoneHeartWorld(assets, nextDefinition)
          : createWorld(assets, nextDefinition);
      const nextViews = createExpeditionViews(nextWorld.scene, nextDefinition);
      views.dispose();
      world.dispose();
      world = nextWorld;
      views = nextViews;
      selectedExpedition = expedition;
    } else if (classId !== selectedClass) {
      world.replaceHero(nextDefinition);
      views.replaceCombat(nextDefinition);
    }
    selectedElement = affinity;
    if (selectedClass !== classId) {
      selectedClass = classId;
      definition = nextDefinition;
      element('class-name').textContent = definition.name;
      element('passive-name').textContent = definition.passive.name;
      element('skill-name').textContent = definition.skill.name;
      element('combat-hud').setAttribute('aria-label', `Estado del ${definition.name}`);
      element('whirlwind-time').setAttribute('aria-label', `Disponibilidad de ${definition.skill.name}`);
    }
    resetExpedition();
    resume();
  }

  // Buttons and keys.
  function on(id: string, fn: () => void) {
    element(id).addEventListener(
      'click',
      () => {
        fn();
        if (state.active) canvas.focus({ preventScroll: true });
      },
      { signal: events.signal },
    );
  }
  on('enter', enterExpedition);
  on('resume', resume);
  on('pause', pause);
  on('restart', restartEncounter);
  on('restart-paused', () => confirmExpedition('¿Reiniciar la expedición?', 'Reiniciar', restartEncounter));
  on('select-paused', () => confirmExpedition('¿Cambiar de clase?', 'Elegir clase', () => leaveExpedition('welcome')));
  on('home-paused', () => confirmExpedition('¿Volver al inicio?', 'Volver al inicio', () => leaveExpedition('home')));
  on('select-results', () => leaveExpedition('welcome'));
  on('home-results', () => leaveExpedition('home'));
  document.addEventListener(
    'keydown',
    event => {
      const digit = /^(?:Digit|Numpad)([1-4])$/.exec(event.code);
      if (!digit || state.phase !== 'choosing' || event.repeat || event.ctrlKey || event.metaKey || event.altKey)
        return;
      const card = element('upgrade-options').children[Number(digit[1]) - 1];
      if (card instanceof HTMLButtonElement) {
        event.preventDefault();
        card.click();
      }
    },
    { signal: events.signal },
  );
  on('upgrade-continue', continueUpgrade);
  on('shop-continue', continueShop);
  document.addEventListener(
    'keydown',
    event => {
      if (event.code !== 'Escape' || state.phase !== 'shopping') return;
      event.preventDefault();
      run.shop.close();
      state.pauseShop();
      controls.clear();
      element('pause-reason').textContent = 'Saliste del mercader. Pulsa Continuar para retomar la expedición.';
      renderPauseSummary(ctx);
      sync();
      render(0);
    },
    { signal: events.signal },
  );
  window.addEventListener('blur', () => sound.silence(), { signal: events.signal });
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) sound.silence();
    },
    { signal: events.signal },
  );
  on('capture', () => {
    element<HTMLDetailsElement>('camera-menu').open = false;
    void controls.capture();
  });
  on('left', () => {
    if (state.active) camera.rotate(-150, 0);
  });
  on('right', () => {
    if (state.active) camera.rotate(150, 0);
  });
  on('reset', () => {
    if (state.active) camera.reset(body.yaw);
  });
  canvas.addEventListener(
    'webglcontextlost',
    event => {
      event.preventDefault();
      controls.clear();
      cancelAnimationFrame(raf);
      showError(
        'Se perdió la conexión con la tarjeta gráfica. Vuelve a cargar la página; si se repite, cierra otras pestañas 3D.',
      );
    },
    { signal: events.signal },
  );

  state.loaded();
  sync();
  setArrival();
  resize();
  if (assets.failures.length)
    notice(
      `No se cargaron ${assets.failures.length} recursos. La vista usa materiales básicos donde fue necesario. Recarga la página para reintentar.`,
    );
  disposeScene = () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    controls.dispose();
    views.dispose();
    world.dispose();
    assets.dispose();
    renderer.dispose();
  };
}

void boot().catch(error => {
  console.error(error);
  disposeScene();
  showError(
    'No pudimos crear la escena 3D. Comprueba que tu navegador tenga WebGL 2 y aceleración gráfica disponibles, y vuelve a cargar.',
  );
});
function dispose() {
  if (disposed) return;
  disposed = true;
  events.abort();
  sound.dispose();
  disposeScene();
}
window.addEventListener('pagehide', event => {
  if (!event.persisted) dispose();
});
if (import.meta.hot) import.meta.hot.dispose(dispose);
