import * as THREE from 'three';
import { CAPTURE } from '../content/activities.ts';
import { CAMPAIGN } from '../content/campaign.ts';
import { classAffinity } from '../content/class-definition.ts';
import { ARCHER_KIT, archerRange, arrowArmorIgnore } from '../content/classes/archer.ts';
import { MAGE_KIT, mageRange } from '../content/classes/mage.ts';
import { IMPETUS, WHIRLWIND } from '../content/combat.ts';
import { ENEMIES, actionStats } from '../content/enemies.ts';
import { regionAt } from '../content/map.ts';
import { abilityData } from '../content/ranged-abilities.ts';
import { techniqueValue } from '../content/techniques.ts';
import { RangedArsenal } from '../domain/classes/ranged-arsenal.ts';
import { WarriorArsenal } from '../domain/classes/warrior-arsenal.ts';
import type { Point, Solid } from '../domain/movement.ts';
import { HudCadence, edgeAnchor, incomingProjectile } from '../app/guidance.ts';
import { createIcon, iconPath } from '../app/icons.ts';
import { affinitySummary, relicSummary } from '../app/relics.ts';
import { techniqueSummary } from '../app/techniques.ts';
import { createAnnouncer } from './announcer.ts';
import type { UiContext } from './context.ts';
import { bearingArrow, bearingWord, clockLabel, element } from './dom.ts';
import { createRadar } from './radar.ts';
import { createTutorial } from './tutorial.ts';

const BASIC_ABILITIES = ['warrior:sword', 'mage:orb', 'archer:arrow'];
const MAJOR_ACTIONS: Record<string, string> = { melee: 'Barrido · sal del arco', slam: 'Golpe al suelo · sal del círculo', volley: 'Andanada · muévete de lado', shot: 'Disparo', charge: 'Carga' };

/**
 * Combat and exploration HUD: health, passive, skill, ability bar, relics, objective, threats,
 * edge markers, radar, tutorial and announcements. Reads the run; never changes it.
 */
export function createHud(ctx: UiContext, solids: readonly Solid[], cue: (name: 'select') => void) {
  const radar = createRadar(element<HTMLCanvasElement>('radar'), ctx);
  const tutorial = createTutorial(ctx, () => cue('select'));
  const announcer = createAnnouncer(ctx);
  const cadence = new HudCadence(), projected = new THREE.Vector3();
  const stackPips = [...document.querySelectorAll<HTMLElement>('[data-stack]')];

  const abilitySlots = Array.from({ length: 4 }, () => {
    const item = document.createElement('div'), icon = document.createElement('i'), name = document.createElement('strong'), level = document.createElement('em'), status = document.createElement('span');
    item.className = 'ability-slot empty'; icon.className = 'slot-icon'; item.append(icon, name, level, status);
    return { item, icon, name, level, status, peak: 0, id: '' };
  });
  element('ability-bar').replaceChildren(...abilitySlots.map(slot => slot.item));

  const relicLabel = document.createElement('span'); relicLabel.textContent = 'Reliquias';
  const relicSockets = Array.from({ length: 4 }, () => { const socket = document.createElement('i'); socket.className = 'relic-socket'; return socket; });
  element('relics-hud').replaceChildren(relicLabel, ...relicSockets);

  // Fixed slots per kind: 0 major enemy, 1-3 attackers, 4-5 projectiles, 6 core.
  const edgeMarkers = Array.from({ length: 7 }, () => {
    const item = document.createElement('i'), label = document.createElement('b');
    item.className = 'edge-marker'; item.hidden = true; item.append(label);
    return { item, label };
  });
  element('edge-markers').replaceChildren(...edgeMarkers.map(marker => marker.item));

  let stamp = '', shownHp = ctx.run.combat.hp, shownEssence = 0, shownLevel = 1;

  function placeMarker(slot: number, kind: string, target: Point | undefined, label = '') {
    const marker = edgeMarkers[slot]; marker.item.hidden = !target; if (!target) return;
    const bearing = ctx.bearingTo(target), anchor = edgeAnchor(bearing);
    marker.item.dataset.kind = kind; marker.label.textContent = label;
    marker.item.style.left = `${(50 + anchor.x * 50).toFixed(2)}%`; marker.item.style.top = `${(50 - anchor.y * 50).toFixed(2)}%`;
    marker.item.style.setProperty('--angle', `${(-bearing).toFixed(3)}rad`);
  }

  /** Text describing what the automatic combat is doing right now. */
  function actionText() {
    const { run, definition } = ctx, combat = run.combat, mage = ctx.classId === 'mage', archer = ctx.classId === 'archer';
    if (combat.cleared && run.progression.drops.length) return 'Recoge la esencia restante';
    if (combat.whirlwind) return `${definition.skill.name} en curso`;
    if (combat.attack) {
      if (mage) return 'Lanzando hechizo';
      if (archer) return combat.attack.age < definition.basic.windup ? 'Tensando el arco' : 'Flecha liberada';
      if (combat.attack.age < definition.basic.windup) return 'Preparando espadazo';
      if (combat.attack.age < definition.basic.windup + definition.basic.active) return (combat.attack.multiplier ?? 1) > 1 ? 'Espadazo potenciado' : 'Espadazo';
      return 'Recuperando postura';
    }
    if (combat.enemies.some(e => e.spawnRemaining > 0)) return 'Se acercan refuerzos';
    if (combat.targetId) return 'Objetivo a alcance';
    if (mage || archer) return `Busca un objetivo a menos de ${mage ? mageRange(combat.loadout) : archerRange(combat.loadout)} m`;
    return 'Acércate a un enemigo';
  }

  function updateAbilityBar() {
    const progress = ctx.run.progression, kit = ctx.run.combat.heroKit;
    const bar = element('ability-bar'); bar.hidden = !progress.development;
    if (!progress.development || !(kit instanceof WarriorArsenal || kit instanceof RangedArsenal)) return;
    const slots = progress.development.book.snapshot.filter(s => !BASIC_ABILITIES.includes(s.id));
    // Slots persist between refreshes so cooldown fills and highlights can animate.
    abilitySlots.forEach((slot, i) => {
      const s = slots[i]; slot.item.classList.toggle('empty', !s);
      if (!s) {
        slot.name.textContent = 'Espacio libre'; slot.level.textContent = slot.status.textContent = ''; slot.peak = 0; slot.id = '';
        slot.icon.replaceChildren(); slot.item.classList.remove('active', 'ready'); slot.item.style.setProperty('--cooldown', '0');
        return;
      }
      const active = kit.clock.active.some(a => a.ability.id === s.id), remaining = kit.clock.remaining(s.id), cooling = !active && remaining > .05;
      if (slot.id !== s.id) { const path = iconPath(s.id); slot.id = s.id; slot.icon.replaceChildren(...(path ? [createIcon(path)] : [])); }
      slot.peak = cooling ? Math.max(slot.peak, remaining) : 0;
      slot.name.textContent = abilityData(s.id).name; slot.level.textContent = `${s.level}/10`;
      slot.status.textContent = active ? 'Activo' : cooling ? `${remaining.toFixed(1)} s` : 'Listo';
      slot.item.classList.toggle('active', active); slot.item.classList.toggle('ready', !active && !cooling);
      slot.item.style.setProperty('--cooldown', cooling ? (remaining / slot.peak).toFixed(3) : '0');
    });
  }

  /** Hero panel: only rebuilt when something it shows has changed. */
  function updateHeroPanel() {
    const { run, definition } = ctx, combat = run.combat, progress = run.progression;
    const mage = ctx.classId === 'mage', archer = ctx.classId === 'archer';
    const clock = clockLabel(combat.time), action = actionText();
    const remaining = Math.ceil(combat.whirlwindCooldown * 10) / 10;
    const windLabel = combat.whirlwind ? `${Math.max(0, combat.whirlwind.duration - combat.whirlwind.age).toFixed(1)} s · activo` : remaining > 0 ? `${remaining.toFixed(1)} s` : 'Listo · automático';
    const impetusTime = Math.ceil(combat.impetusRemaining * 10) / 10;
    const basicState = progress.development?.book.snapshot[0];
    const arcaneCharges = basicState?.finisher === 0 ? 2 : MAGE_KIT.arcane.charges;
    const passiveTimeout = basicState?.finisher === 0 ? archer ? 6 : 5 : archer ? ARCHER_KIT.precision.timeout : IMPETUS.timeout;
    const untilBoss = Math.ceil(Math.max(0, CAMPAIGN.bossAt - combat.time));
    const kitState = combat.heroKit.state;
    const next = `${kitState.barrier?.amount}:${kitState.barrier?.remaining.toFixed(1)}:${kitState.barrierCooldown?.toFixed(1)}:${combat.hp}:${combat.maxHp}:${combat.kills}:${clock}:${action}:${combat.impetusStacks}:${impetusTime}:${windLabel}:${progress.level}:${progress.xp}:${run.wave}:${run.phase}:${progress.element}:${progress.affinityRank}:${progress.core}:${progress.mastery}:${JSON.stringify(progress.techniques)}:${progress.development?.book.revision}:${Math.floor(combat.time * 10)}:${progress.secondaryElement}:${progress.secondaryRank}:${progress.relics.join()} `;
    if (next === stamp) return;
    stamp = next;

    const health = element<HTMLProgressElement>('health');
    health.value = combat.hp; health.max = combat.maxHp;
    element('health-text').textContent = `${Math.ceil(combat.hp)} / ${combat.maxHp}`;
    // The pale "recent damage" segment trails the fill through a delayed CSS transition on --lag.
    health.style.setProperty('--lag', `${(combat.hp / combat.maxHp * 100).toFixed(1)}%`);
    if (Math.abs(combat.hp - shownHp) > .01) {
      if (combat.hp < shownHp) { if (!ctx.quiet()) health.parentElement!.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], { duration: 170 }); }
      else if (combat.hp - shownHp >= 1) element('health-text').animate([{ color: '#c4f5b3', textShadow: '0 0 10px #7fdc6a' }, {}], { duration: 800 });
      shownHp = combat.hp;
    }
    element('kills').textContent = String(combat.kills);

    const relics = element('relics-hud');
    relics.setAttribute('aria-label', `Reliquias ${progress.relics.length}/4`); relics.title = relicSummary(progress);
    relicSockets.forEach((socket, i) => {
      const id = progress.relics[i]; if (socket.dataset.relic === (id ?? '')) return;
      const path = id && iconPath(id); socket.dataset.relic = id ?? ''; socket.classList.toggle('filled', !!id);
      socket.replaceChildren(...(path ? [createIcon(path)] : []));
    });
    element('techniques-hud').textContent = techniqueSummary(progress);
    updateAbilityBar();

    element('level-text').textContent = `Nivel ${progress.level}`;
    element('xp-text').textContent = `${progress.xp} / ${progress.threshold} esencia`;
    const experience = element<HTMLProgressElement>('experience');
    experience.max = progress.threshold; experience.value = progress.xp;
    if (progress.totalEssence > shownEssence && !ctx.quiet()) experience.animate([{ filter: 'brightness(2.2)' }, { filter: 'none' }], { duration: 380 });
    shownEssence = progress.totalEssence;
    element('group-text').textContent = run.phase === 'waves' ? `Oleada ${run.wave} · ${clockLabel(untilBoss)} hasta el jefe` : run.phase === 'elite-gate' ? 'Último obstáculo · el Portador' : 'Duelo en el territorio';
    element('affinity-text').textContent = affinitySummary(progress);
    element('affinity-text').dataset.element = progress.element ?? '';
    element('mastery-text').textContent = progress.mastery ? classAffinity(definition, progress.element!).mastery : `Maestría: afinidad ${progress.affinityRank}/3 · ${progress.core ? 'núcleo obtenido' : 'falta núcleo'}`;
    element('encounter-clock').textContent = clock; element('auto-action').textContent = action;

    const airTargets = progress.element === 'air' ? progress.mastery ? 2 : 1 : 0;
    element('impetus-text').textContent = archer
      ? `${combat.impetusStacks} / 3 · hasta ${ARCHER_KIT.precision.targets[combat.impetusStacks] + airTargets + techniqueValue(progress.techniques, 'piercing')} blancos`
      : mage ? `${combat.impetusStacks} / ${arcaneCharges}${combat.impetusStacks === arcaneCharges ? ' · preparado' : ''}`
        : `${combat.impetusStacks} / ${IMPETUS.maxStacks} · +${Math.round(combat.impetusStacks * IMPETUS.damagePerStack * 100)} %`;
    element('impetus-expiry').textContent = archer
      ? combat.impetusStacks ? `Acierta de nuevo en ${impetusTime.toFixed(1)} s · fallar rompe la racha` : 'Encadena aciertos para atravesar enemigos'
      : mage ? combat.impetusStacks === arcaneCharges ? 'Próximo orbe: +60 % y daño en área' : `Cada ${arcaneCharges + 1} orbes se potencia · cargas sin caducidad`
        : combat.impetusStacks ? `Se pierde en ${impetusTime.toFixed(1)} s` : 'Acierta espadazos para acumular';
    const impetusBar = element<HTMLProgressElement>('impetus-time');
    impetusBar.hidden = mage; impetusBar.max = passiveTimeout; impetusBar.value = combat.impetusRemaining;
    impetusBar.setAttribute('aria-label', `Tiempo de ${definition.passive.name}`);
    stackPips.forEach((pip, index) => { pip.hidden = (mage || archer) && index >= (mage ? arcaneCharges : 3); pip.classList.toggle('filled', index < combat.impetusStacks); });

    element('whirlwind-text').textContent = windLabel;
    const skillCooldown = mage ? MAGE_KIT.cataclysm.cooldown : archer ? ARCHER_KIT.rain.cooldown : WHIRLWIND.cooldown;
    element<HTMLProgressElement>('whirlwind-time').value = combat.whirlwind ? 1 - combat.whirlwind.age / combat.whirlwind.duration : 1 - combat.whirlwindCooldown / skillCooldown;
    element('whirlwind-row').classList.toggle('skill-active', !!combat.whirlwind);

    const barrier = kitState.barrier, detail = element('element-detail');
    detail.hidden = progress.element !== 'earth' && progress.element !== 'air';
    detail.textContent = progress.element === 'earth'
      ? archer ? `Pedernal: ignora ${Math.round(arrowArmorIgnore(combat.loadout) * 100)} % de armadura · Quebranto +15 %`
        : barrier ? `Coraza: ${Math.ceil(barrier.amount)} puntos · ${Math.max(0, barrier.remaining).toFixed(1)} s`
          : `Coraza: ${(kitState.barrierCooldown ?? 0) > 0 ? `${kitState.barrierCooldown!.toFixed(1)} s` : mage ? 'al lanzar el cuarto hechizo' : 'al acertar con espada'} · Quebranto +15 %`
      : mage ? `Aire: alcance ${mageRange(combat.loadout)} m · empuje y vórtice` : archer ? `Aire: alcance ${archerRange(combat.loadout)} m · flechas rápidas y penetrantes` : 'Aire: tajos más largos · empuje y atracción';
  }

  /** Objective, boss panel, off-screen threats and low-health warning. */
  function updateSituation() {
    const { run, body, state, camera, definition } = ctx, combat = run.combat;
    const inGame = !['loading', 'ready', 'error', 'results'].includes(state.phase);
    const banner = element('encounter-banner');
    banner.hidden = !inGame; banner.textContent = run.objective; banner.dataset.stage = run.phase;
    const major = run.boss && !run.boss.dead ? run.boss : run.elite;
    element('place').textContent = regionAt(body);
    const core = run.progression.drops.find(drop => drop.core);
    const heldPost = run.capture.pressure ? run.capture.point : undefined;
    const destination = core ?? major ?? heldPost ?? { x: 4, z: -18 };
    const goal = core ? 'Núcleo' : major ? ENEMIES[major.kind].name : heldPost ? 'Puesto disputado' : 'Puerta de la fortaleza';
    element('wayfinder').textContent = `${goal} · ${Math.round(Math.hypot(destination.x - body.x, destination.z - body.z))} m · ${bearingWord(ctx.bearingTo(destination))}`;
    element('boss-panel').hidden = !inGame || !major;
    if (major) {
      element('boss-name').textContent = `${ENEMIES[major.kind].name}${major.kind === 'boss' && major.hp <= major.maxHp / 2 ? ' · Furia' : ''}`;
      element<HTMLProgressElement>('boss-health').max = major.maxHp; element<HTMLProgressElement>('boss-health').value = major.hp;
      element('boss-life').textContent = `${Math.ceil(major.hp)} / ${major.maxHp}`;
      element('boss-action').textContent = major.spawnRemaining > 0 ? 'Se aproxima…' : major.attack ? MAJOR_ACTIONS[major.attack.action ?? 'melee'] : 'Reposicionándose';
    }

    let warning = '';
    const offscreen = (point: Point) => {
      projected.set(point.x, 1, point.z).project(camera.camera);
      return projected.z > 1 || projected.z < -1 ? 'behind' : Math.abs(projected.x) > .95 || Math.abs(projected.y) > .95 ? projected.x < 0 ? 'left' : 'right' : '';
    };
    const attackers: Point[] = [], shots: Point[] = [];
    if (state.active) for (const enemy of combat.enemies) {
      const reach = enemy.kind === 'archer' || enemy.kind === 'charger' || enemy.kind === 'boss' ? 16 : 4;
      if (enemy.dead || !enemy.attack || enemy.attack.age >= actionStats(enemy.kind, enemy.attack.action).windup || Math.hypot(enemy.x - body.x, enemy.z - body.z) > reach) continue;
      const side = offscreen(enemy); if (!side) continue;
      warning ||= side === 'behind' ? '¡Ataque a tu espalda!' : side === 'left' ? '¡Ataque por la izquierda!' : '¡Ataque por la derecha!';
      if (enemy !== major && attackers.push(enemy) === 3) break;
    }
    if (state.active) for (const p of combat.projectiles.items) {
      if (!incomingProjectile(p, body, solids, definition.movement.radius) || !offscreen(p)) continue;
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
    const threat = element('threat');
    threat.dataset.kind = warning ? 'attack' : 'health';
    threat.hidden = !warning && !low;
    threat.textContent = warning || (low ? 'Vida baja · busca un suministro o una fuente' : '');
    banner.hidden = !inGame || !!warning || low;
    return !!warning || low;
  }

  function updateExploration() {
    const { run, body, state } = ctx, exploration = run.exploration, combat = run.combat;
    element('exploration-hud').hidden = !state.active;
    element('coin-count').textContent = String(exploration.coins);
    const destinations = exploration.destinations(body);
    const list = element('nearby-objects');
    if (state.active) radar.draw();
    const descriptions = destinations.map(object => {
      const status = object.status === 'closed' ? '×' : object.status === 'used' ? '✓' : bearingArrow(ctx.bearingTo(object));
      return `${status} ${exploration.label(object)} · ${Math.round(Math.hypot(object.x - body.x, object.z - body.z))} m`;
    });
    // Only replace DOM when displayed names/distances/bearings actually change.
    const listStamp = descriptions.join('|');
    if (list.dataset.stamp !== listStamp) {
      list.dataset.stamp = listStamp;
      list.replaceChildren(...descriptions.map((text, i) => { const line = document.createElement('li'); line.textContent = text; line.dataset.kind = destinations[i].kind; return line; }));
    }
    element('exploration-help').hidden = !!destinations.length;
    const focus = exploration.focus(body);
    element('interaction-prompt').hidden = !state.active || !focus;
    if (focus) {
      const full = focus.kind === 'fountain' && combat.hp >= combat.maxHp;
      element('interaction-description').textContent = focus.status === 'used' ? exploration.label(focus) : focus.kind === 'shop' ? 'Mercader · comprar pausa la expedición' : focus.kind === 'chest' ? `Cofre · ${focus.amount} monedas` : full ? 'Vida completa · conserva sus usos' : `Fuente · +${focus.amount} vida · ${focus.uses} usos`;
      element<HTMLButtonElement>('interact').disabled = focus.status === 'used' || full;
      element('interaction-verb').textContent = focus.kind === 'shop' ? 'Ver mercancías' : focus.kind === 'chest' ? 'Abrir cofre' : 'Beber';
    }
    const capture = run.capture, point = capture.point;
    element('capture-panel').hidden = !point?.discovered || Math.hypot(point.x - body.x, point.z - body.z) > CAPTURE.radius + 10;
    element('capture-title').textContent = capture.state === 'completed' ? `Puesto asegurado · +${CAPTURE.reward} monedas` : capture.state === 'closed' ? 'Captura cerrada' : capture.state === 'warning' ? `La captura comienza en ${Math.ceil(capture.warningRemaining)} s` : 'Puesto de la fortaleza';
    element<HTMLProgressElement>('capture-progress').max = CAPTURE.duration; element<HTMLProgressElement>('capture-progress').value = capture.progress;
    element('capture-description').textContent = capture.state === 'completed' ? 'Recompensa obtenida' : capture.state === 'closed' ? 'La llegada del Castellano cierra este objetivo.' : capture.state === 'idle' ? `Entra al círculo · resiste ${CAPTURE.duration} s · gana ${CAPTURE.reward} monedas` : capture.inside ? `${capture.progress.toFixed(1)} / ${CAPTURE.duration} s · atraes refuerzos mientras resistes` : 'Fuera del círculo · avance conservado';
    const loot = element('loot-feedback');
    loot.hidden = !state.active || exploration.noticeRemaining <= 0;
    if (loot.textContent !== exploration.notice) loot.textContent = exploration.notice;
  }

  function update() {
    updateHeroPanel();
    const alarmed = updateSituation();
    if (ctx.state.active) announcer.check();
    tutorial.update();
    updateExploration();
    if (alarmed) element('loot-feedback').hidden = true;
  }

  return {
    update,
    /** Throttle for the frame loop: true when the HUD should refresh this frame. */
    due: (dt: number) => cadence.due(dt),
    /** Brief arc towards whoever just landed a melee blow; projectiles keep only the full-screen flash. */
    showHitDirection(attacker: Point) {
      const arc = element('hit-direction'); arc.style.setProperty('--angle', `${(-ctx.bearingTo(attacker)).toFixed(3)}rad`);
      arc.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 700, easing: 'ease-in' });
    },
    hideMarkers() { for (const marker of edgeMarkers) marker.item.hidden = true; },
    /** Pulses the level badge once after a level-up has been resolved. */
    celebrateLevel() {
      const level = ctx.run.progression.level; if (level === shownLevel) return;
      shownLevel = level;
      if (!ctx.quiet()) element('level-text').animate([{ transform: 'scale(1.45)', boxShadow: '0 0 20px #ecd599', background: '#5b4a22' }, {}], { duration: 700, easing: 'ease-out' });
    },
    /** Forget everything shown for the previous expedition. */
    reset() { stamp = ''; shownHp = ctx.run.combat.hp; shownEssence = 0; shownLevel = 1; announcer.reset(); },
  };
}
