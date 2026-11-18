import { damageLabels, damageScale, damageTone, DAMAGE_TONES } from './damage-labels.ts';
import type { DamageTone } from './damage-labels.ts';
import { createHordeView } from './horde.ts';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WHIRLWIND, IMPETUS } from '../content/combat.ts';
import { WARRIOR } from '../content/classes/warrior.ts';
import type { ClassDefinition } from '../content/class-definition.ts';
import type { Combat, CombatEvent, Enemy } from '../domain/combat.ts';
import { ELEMENTS } from '../content/elements.ts';
import { ENEMIES, actionStats, CHARGE } from '../content/enemies.ts';
import type { EnemyKind } from '../content/enemies.ts';

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
type PartCache = Map<EnemyKind, Map<string, THREE.BufferGeometry>>;
const BOX = () => new THREE.BoxGeometry(1, 1, 1), BALL = () => new THREE.SphereGeometry(1, 10, 8);
const ROD = () => new THREE.CylinderGeometry(1, 1, 1, 7), CONE = () => new THREE.CylinderGeometry(0, 1, 1, 7);

/**
 * Static geometry for one enemy kind, merged per articulated group and material.
 * Slots: body, leg0/leg1, arm0 (left) / arm1 (right, weapon). Materials: bone, iron, cloth, dark and glow.
 * Merging keeps a full silhouette at roughly a dozen draw calls per enemy instead of one per primitive.
 */
function enemyGeometry(kind: EnemyKind) {
  const buckets = new Map<string, THREE.BufferGeometry[]>();
  const put = (slot: string, mat: string, g: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, rz = 0) => {
    g.scale(sx, sy, sz); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); g.translate(x, y, z);
    const key = `${slot}:${mat}`; if (!buckets.has(key)) buckets.set(key, []); buckets.get(key)!.push(g);
  };
  const armoured = kind !== 'archer', heavy = kind === 'charger' || kind === 'elite' || kind === 'boss', lord = kind === 'elite' || kind === 'boss';
  for (const [i, sign] of [[0, -1], [1, 1]] as const) {
    const leg = `leg${i}`, arm = `arm${i}`;
    put(leg, 'bone', ROD(), 0, -.23, 0, .052, .43, .052); put(leg, 'bone', BALL(), 0, -.44, 0, .075, .07, .075);
    put(leg, 'bone', ROD(), 0, -.64, .01, .043, .37, .043); put(leg, 'iron', BOX(), 0, -.81, -.055, .13, .12, .27);
    if (armoured) { put(leg, 'iron', BOX(), 0, -.62, -.035, .105, .30, .05); put(leg, 'iron', BALL(), 0, -.44, -.05, .07, .065, .05); }
    else put(leg, 'cloth', BOX(), 0, -.66, 0, .1, .2, .1);
    put(arm, 'bone', ROD(), sign * .03, -.17, 0, .045, .29, .045); put(arm, 'bone', ROD(), sign * .04, -.41, -.06, .04, .25, .04, .25);
    put(arm, 'bone', BALL(), sign * .04, -.55, -.085, .052, .07, .06);
    // Shoulders: bare joint, a single worn pauldron, or full spiked plates.
    if (heavy) {
      put(arm, 'iron', BALL(), sign * .02, .02, 0, .16, .115, .16); put(arm, 'iron', BOX(), sign * .05, -.1, 0, .2, .05, .22);
      if (kind !== 'elite') put(arm, 'iron', CONE(), sign * .09, .17, 0, .04, .18, .04, 0, -sign * .45);
    } else if (kind === 'soldier' && sign === 1) put(arm, 'iron', BALL(), 0, .01, 0, .125, .095, .125);
    else put(arm, 'bone', BALL(), 0, 0, 0, .1, .085, .1);
    if (armoured) put(arm, 'iron', BOX(), sign * .04, -.4, -.065, .075, .2, .075, .25);
  }
  // Rib cage, spine, pelvis and skull shared by every kind.
  put('body', 'cloth', BOX(), 0, .87, .02, .35, .28, .24); put('body', 'bone', ROD(), 0, 1.17, .035, .045, .52, .045);
  for (let i = 0; i < 4; i++) put('body', 'bone', BALL(), 0, 1.11 + i * .075, -.035, .21 - i * .013, .024, .11);
  put('body', 'bone', BOX(), 0, 1.40, -.035, .42, .035, .06);
  put('body', 'bone', BALL(), 0, 1.60, -.09, .12, .14, .11); put('body', 'bone', BOX(), 0, 1.49, -.115, .13, .055, .11);
  for (const sign of [-1, 1]) put('body', 'dark', BALL(), sign * .048, 1.61, -.184, .031, .033, .025);
  put('body', 'dark', BOX(), 0, 1.56, -.196, .028, .04, .02);
  // Ragged tabard: uneven strips below the belt read as torn cloth from the game camera.
  put('body', 'cloth', BOX(), 0, 1.0, -.125, .22, .46, .02); put('body', 'dark', BOX(), 0, .99, -.02, .37, .05, .27);
  put('body', 'cloth', BOX(), -.06, .66, -.128, .09, .22, .018); put('body', 'cloth', BOX(), .055, .70, -.128, .075, .14, .018);
  put('body', 'cloth', BOX(), .03, .68, .14, .2, .2, .018);

  if (kind === 'soldier') {
    // Kettle hat, round shield and an arming sword.
    put('body', 'iron', BALL(), 0, 1.71, -.065, .135, .085, .13); put('body', 'iron', BOX(), 0, 1.68, -.07, .31, .035, .28);
    put('body', 'cloth', BOX(), .08, 1.18, .085, .14, .44, .1, 0, -.2);
    put('arm0', 'dark', ROD(), -.07, -.42, -.15, .21, .035, .21, Math.PI / 2); put('arm0', 'iron', BALL(), -.07, -.42, -.175, .06, .06, .04);
    put('arm0', 'iron', ROD(), -.07, -.42, -.158, .215, .02, .215, Math.PI / 2);
    put('arm1', 'dark', BOX(), .04, -.55, -.085, .035, .18, .035); put('arm1', 'iron', BOX(), .04, -.65, -.085, .2, .035, .045);
    put('arm1', 'iron', BOX(), .04, -.93, -.085, .055, .52, .018); put('arm1', 'iron', CONE(), .04, -1.22, -.085, .028, .07, .01, Math.PI);
  }
  if (kind === 'archer') {
    // Hood and cowl, belt quiver and a crossbow with prod, string and stirrup.
    put('body', 'cloth', BALL(), 0, 1.63, -.045, .15, .17, .155); put('body', 'cloth', BOX(), 0, 1.44, -.01, .46, .07, .27);
    put('body', 'cloth', BOX(), 0, 1.36, .1, .3, .34, .06); put('body', 'cloth', CONE(), 0, 1.78, .1, .07, .2, .07, -1.1);
    put('body', 'dark', ROD(), -.2, .92, .12, .055, .32, .055, 0, .3);
    for (const dx of [-.02, .015, .04]) put('body', 'bone', BOX(), -.25 + dx, 1.1, .12, .012, .12, .012, 0, .3);
    put('arm1', 'dark', BOX(), 0, -.45, -.25, .07, .08, .56); put('arm1', 'iron', BOX(), 0, -.45, -.46, .6, .035, .05);
    for (const sign of [-1, 1]) put('arm1', 'iron', BOX(), sign * .31, -.45, -.43, .04, .035, .09);
    put('arm1', 'bone', BOX(), 0, -.45, -.37, .6, .01, .01); put('arm1', 'iron', BOX(), 0, -.45, -.56, .09, .02, .06);
    put('arm1', 'bone', BOX(), 0, -.4, -.3, .012, .012, .34);
  }
  if (kind === 'charger') {
    // Horned, visored helm, a breastplate and a long maul held low.
    put('body', 'iron', BALL(), 0, 1.71, -.065, .15, .1, .145);
    put('body', 'iron', BOX(), 0, 1.675, -.19, .23, .05, .04); put('body', 'iron', BOX(), 0, 1.545, -.19, .2, .09, .04);
    for (const sign of [-1, 1]) put('body', 'bone', CONE(), sign * .19, 1.81, -.06, .045, .26, .045, 0, -sign * .55);
    put('body', 'iron', BOX(), 0, 1.32, 0, .58, .16, .32); put('body', 'iron', BOX(), 0, 1.2, -.07, .4, .3, .22);
    put('body', 'iron', BOX(), 0, 1.2, -.185, .05, .3, .03);
    put('arm1', 'dark', ROD(), .04, -.72, -.085, .028, 1.05, .028); put('arm1', 'iron', BOX(), .04, -1.22, -.085, .2, .2, .17);
    put('arm1', 'iron', CONE(), .04, -1.37, -.085, .05, .12, .05, Math.PI);
    for (const sign of [-1, 1]) put('arm1', 'iron', CONE(), .04 + sign * .15, -1.22, -.085, .05, .12, .05, 0, -sign * Math.PI / 2);
  }
  if (lord) {
    // Plate, tassets, cloak and the core burning in the rib cage.
    const boss = kind === 'boss';
    put('body', 'iron', BOX(), 0, 1.23, -.03, .42, .45, .26); put('body', 'iron', BOX(), 0, 1.3, -.165, .05, .3, .03);
    for (const sign of [-1, 1]) put('body', 'iron', BOX(), sign * .13, .86, -.135, .17, .28, .03);
    put('body', 'cloth', BOX(), 0, boss ? 1.0 : 1.1, .2, boss ? .62 : .48, boss ? 1.08 : .85, .05);
    put('body', 'cloth', BOX(), 0, 1.44, .03, boss ? .66 : .5, .09, .36);
    put('body', 'iron', ROD(), 0, 1.25, -.166, .1, .03, .1, Math.PI / 2); put('body', 'glow', BALL(), 0, 1.25, -.175, .07, .07, .035);
    put('body', 'iron', BALL(), 0, 1.71, -.065, .14, .09, .135);
    if (boss) {
      // Crown of spikes over an open helm, hollow eyes alight.
      for (let i = -2; i <= 2; i++) put('body', 'iron', CONE(), i * .058, 1.87 - Math.abs(i) * .012, -.07, .022, .24 - Math.abs(i) * .035, .022);
      put('body', 'iron', ROD(), 0, 1.76, -.065, .145, .04, .14);
      for (const sign of [-1, 1]) put('body', 'glow', BALL(), sign * .048, 1.61, -.196, .02, .022, .016);
    } else {
      put('body', 'iron', BOX(), 0, 1.68, -.07, .29, .035, .27); put('body', 'cloth', BOX(), 0, 1.86, -.01, .04, .16, .28);
    }
    const length = boss ? 1.05 : .85;
    put('arm1', 'dark', BOX(), .04, -.55, -.085, .04, .22, .04); put('arm1', 'iron', BOX(), .04, -.66, -.085, boss ? .32 : .25, .04, .05);
    put('arm1', 'iron', BOX(), .04, -.68 - length / 2, -.085, .075, length, .022); put('arm1', 'iron', CONE(), .04, -.68 - length - .05, -.085, .038, .1, .012, Math.PI);
    put('arm1', 'iron', BALL(), .04, -.44, -.085, .04, .04, .04);
  }
  const merged = new Map<string, THREE.BufferGeometry>();
  for (const [key, list] of buckets) { merged.set(key, mergeGeometries(list)!); for (const g of list) g.dispose(); }
  return merged;
}

/** Articulated undead soldier; every kind shares the skeleton and adds its own kit, deliberately distinct from the hero. */
function skeleton(cache: PartCache, kind: EnemyKind) {
  const stats = ENEMIES[kind];
  if (!cache.has(kind)) cache.set(kind, enemyGeometry(kind));
  const parts = cache.get(kind)!;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const bone = new THREE.MeshStandardMaterial({ color: 0xc4b99d, roughness: .92 });
  const iron = new THREE.MeshStandardMaterial({ color: kind === 'boss' ? 0x3a3340 : 0x4c514a, roughness: .7, metalness: .55 });
  const cloth = new THREE.MeshStandardMaterial({ color: stats.color, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x161c17, roughness: 1 });
  const glow = new THREE.MeshBasicMaterial({ color: kind === 'boss' ? 0xb98cff : 0xffd27a });
  const materials = [bone, iron, cloth, dark], lookup: Record<string, THREE.Material> = { bone, iron, cloth, dark, glow };
  const legs: THREE.Group[] = [], arms: THREE.Group[] = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(sign * .13, .88, 0); body.add(leg); legs.push(leg);
    const arm = new THREE.Group(); arm.position.set(sign * .25, 1.37, -.03); body.add(arm); arms.push(arm);
  }
  for (const [key, geometry] of parts) {
    const [slot, mat] = key.split(':'), parent = slot === 'body' ? body : slot.startsWith('leg') ? legs[Number(slot[3])] : arms[Number(slot[3])];
    const m = new THREE.Mesh(geometry, lookup[mat]); m.castShadow = mat !== 'glow'; m.receiveShadow = mat !== 'glow'; parent.add(m);
  }
  const mesh = (parent: THREE.Group, geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
  };
  body.scale.setScalar(stats.scale);
  const warningMat = new THREE.MeshBasicMaterial({ color: 0xc68032, transparent: true, opacity: .35, depthWrite: false, side: THREE.DoubleSide });
  const warning = new THREE.Mesh(new THREE.RingGeometry(.18, stats.range + .4, 32, 1, Math.PI / 2 - stats.arc / 2, stats.arc), warningMat);
  warning.rotation.x = -Math.PI / 2; warning.position.y = .04; root.add(warning);
  const circle = new THREE.Mesh(new THREE.RingGeometry(.02, 1, 48), warningMat); circle.rotation.x = -Math.PI / 2; circle.position.y = .045; root.add(circle);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), warningMat); lane.rotation.x = -Math.PI / 2; lane.position.y = .05; root.add(lane);
  const fan = new THREE.Mesh(new THREE.RingGeometry(.2, 15, 32, 1, Math.PI / 2 - .45, .9), warningMat); fan.rotation.x = -Math.PI / 2; fan.position.y = .04; root.add(fan);
  const spawnMaterial = new THREE.MeshBasicMaterial({ color: 0xcbd4b3, transparent: true, opacity: .65, depthWrite: false, side: THREE.DoubleSide });
  for (const signal of [warning, circle, lane, fan]) signal.renderOrder = 12;
  const spawnRing = new THREE.Mesh(new THREE.RingGeometry(.48, .57, 32), spawnMaterial);
  spawnRing.rotation.x = -Math.PI / 2; spawnRing.position.y = .05; root.add(spawnRing);
  const bar = new THREE.Group(); bar.position.y = 2.04 * stats.scale; root.add(bar);
  const backMaterial = new THREE.MeshBasicMaterial({ color: 0x1a211c, depthTest: false });
  const hpMaterial = new THREE.MeshBasicMaterial({ color: 0xb9a578, depthTest: false });
  mesh(bar, UNIT_BOX, backMaterial, 0, 0, 0, .67, .065, .01);
  const hp = mesh(bar, UNIT_BOX, hpMaterial, 0, 0, .01, .63, .035, .01);
  let stride = 0;
  return { root, update(enemy: Enemy, dt: number, flash: number, selected: boolean, camera: THREE.Camera) {
    stride += Math.min(enemy.speed, 3) * dt * 3;
    const swing = Math.sin(stride) * Math.min(1, enemy.speed / 1.5);
    legs[0].rotation.x = swing * .5; legs[1].rotation.x = -swing * .5;
    arms[0].rotation.x = -.17 - swing * .2; arms[1].rotation.set(swing * .16, 0, 0);
    body.rotation.z = enemy.dead ? Math.PI / 2 : 0; body.position.y = enemy.dead ? .08 : 0;
    body.rotation.x = enemy.dead ? 0 : .1;
    if (enemy.attack) {
      const data = actionStats(kind, enemy.attack.action), a = enemy.attack.age, progress = THREE.MathUtils.clamp((a - data.windup) / data.active, 0, 1);
      arms[1].rotation.x = a < data.windup ? -2.1 * Math.min(1, a / .25) : -2.1 + progress * 2.4;
      arms[0].rotation.x = -.5;
      if (enemy.attack.action === 'shot' || enemy.attack.action === 'volley') { arms[1].rotation.x = -1.3; arms[0].rotation.x = -1.2; }
      if (enemy.attack.action === 'charge') { body.rotation.x = .3; arms[1].rotation.x = -.8; }
      if (enemy.attack.action === 'slam') { arms[1].rotation.x = a < data.windup ? -2.7 : .5; arms[0].rotation.x = arms[1].rotation.x; }
    }
    root.visible = !enemy.dead || enemy.deathAge < 1.6;
    spawnRing.visible = enemy.spawnRemaining > 0;
    spawnRing.scale.setScalar(1 + enemy.spawnRemaining * .5);
    const attack = enemy.attack, data = actionStats(kind, attack?.action), preparing = !!attack && attack.age < data.windup;
    const showing = !enemy.dead && !!attack && attack.age < data.windup + data.active;
    warning.visible = showing && (!attack?.action || attack.action === 'melee');
    circle.visible = showing && attack?.action === 'slam'; circle.scale.setScalar(data.range + .4);
    lane.visible = !enemy.dead && preparing && (attack?.action === 'shot' || attack?.action === 'charge');
    const length = attack?.action === 'charge' ? CHARGE.length : stats.range;
    lane.scale.set(attack?.action === 'charge' ? 2 * (enemy.radius + .4) : .12, length, 1); lane.position.z = -length / 2;
    fan.visible = !enemy.dead && preparing && attack?.action === 'volley';
    warningMat.color.set(!preparing ? 0xbd4435 : attack?.action === 'shot' || attack?.action === 'volley' ? 0x80c7dc : 0xc68032);
    warningMat.opacity = preparing ? .2 + .3 * attack!.age / data.windup : .45;
    bar.visible = !enemy.dead && (selected || enemy.hp < enemy.maxHp || !!enemy.attack || kind === 'elite' || kind === 'boss');
    bar.quaternion.copy(root.quaternion).invert().multiply(camera.quaternion);
    const fraction = enemy.hp / enemy.maxHp; hp.scale.x = .63 * fraction; hp.position.x = -.315 * (1 - fraction);
    hpMaterial.color.set(selected ? 0xe0c785 : 0x9b6d55);
    glow.transparent = enemy.spawnRemaining > 0; glow.opacity = enemy.spawnRemaining > 0 ? .3 : 1;
    for (const material of materials) { material.transparent = enemy.spawnRemaining > 0; material.opacity = enemy.spawnRemaining > 0 ? .3 : 1; material.emissive.set(flash > 0 ? 0xa54c28 : enemy.burn ? 0xd95b16 : 0x206c8a); material.emissiveIntensity = flash > 0 ? flash * 2 : enemy.burn || enemy.wetRemaining > 0 ? .35 : 0; }
  }, dispose() { [...materials, glow, warningMat, spawnMaterial, backMaterial, hpMaterial].forEach(m => m.dispose()); [warning, circle, lane, fan, spawnRing].forEach(m => m.geometry.dispose()); } };
}

/** Isolated inspection of the same enemy geometry used in combat, without HUD or warnings. */
export function createEnemyModelPreview(kind: Exclude<EnemyKind, 'thrall'>) {
  const cache: PartCache = new Map();
  const view = skeleton(cache, kind);
  for (const child of view.root.children.slice(1)) child.visible = false;
  return { root: view.root, dispose() { view.dispose(); for (const g of cache.get(kind)!.values()) g.dispose(); } };
}

export function createCombatView(scene: THREE.Scene, definition: ClassDefinition = WARRIOR, showEnemies = true) {
  const root = new THREE.Group(); scene.add(root);
  const horde = createHordeView(root);
  const partCache: PartCache = new Map();
  const enemies = new Map<number, ReturnType<typeof skeleton>>();
  const flashes = new Map<number, number>();
  const numbers: Array<{ sprite: THREE.Sprite; age: number; size: number; drift: number }> = [];
  const numberMaps = new Map<string, THREE.CanvasTexture>();
  const slashMaterial = new THREE.MeshBasicMaterial({ color: 0xe7d7af, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide });
  let slashArc = definition.basic.arc;
  const slash = new THREE.Mesh(new THREE.RingGeometry(1.25, definition.basic.range, 24, 1, Math.PI / 2 - definition.basic.arc / 2, definition.basic.arc), slashMaterial);
  slash.rotation.x = -Math.PI / 2; slash.visible = false;
  const slashRoot = new THREE.Group(); slashRoot.add(slash); root.add(slashRoot);
  const spinRoot = new THREE.Group(); root.add(spinRoot); spinRoot.visible = false;
  const spinMaterial = new THREE.MeshBasicMaterial({ color: 0xdad6c1, transparent: true, opacity: .36, depthWrite: false, side: THREE.DoubleSide });
  const pulseMaterial = spinMaterial.clone(); pulseMaterial.opacity = .22;
  const spinGeometry = new THREE.RingGeometry(WHIRLWIND.radius * .72, WHIRLWIND.radius, 28, 1, 0, Math.PI * .75);
  for (let i = 0; i < 2; i++) {
    const arc = new THREE.Mesh(spinGeometry, spinMaterial); arc.rotation.x = -Math.PI / 2; arc.rotation.z = i * Math.PI; arc.position.y = .75 + i * .12; spinRoot.add(arc);
  }
  const pulseGeometry = new THREE.RingGeometry(WHIRLWIND.radius - .06, WHIRLWIND.radius, 64);
  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial); pulse.rotation.x = -Math.PI / 2; pulse.position.y = .06; spinRoot.add(pulse);
  let damageFlash = 0;
  function numberMap(amount: number, tone: DamageTone) {
    const display = amount > 0 && amount < 1 ? Math.max(.1, Math.round(amount * 10) / 10) : Math.round(amount);
    const key = `${display}:${tone}`; const cached = numberMaps.get(key); if (cached) return cached;
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) { context.font = 'bold 42px "Palatino Linotype", Georgia, serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.lineWidth = 7; context.lineJoin = 'round'; context.strokeStyle = '#0f1512'; context.strokeText(String(display), 64, 32); context.fillStyle = DAMAGE_TONES[tone]; context.fillText(String(display), 64, 32); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; numberMaps.set(key, texture); return texture;
  }
  function clearNumbers() { for (const item of numbers) { root.remove(item.sprite); item.sprite.material.dispose(); } numbers.length = 0; }
  return {
    events(events: CombatEvent[]) {
      for (const event of events) if (event.type === 'hit') { flashes.set(event.target, .16); if (event.target === 0) damageFlash = .28; }
      for (const event of damageLabels(events)) {
        if (numbers.length >= 24) { const old = numbers.shift()!; root.remove(old.sprite); old.sprite.material.dispose(); }
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: numberMap(event.amount, damageTone(event)), transparent: true, depthTest: false }));
        // Deterministic spread so simultaneous labels on a pack do not stack on one spot.
        const drift = ((event.id * 37) % 11 - 5) / 5, size = (event.target === 0 ? 1.25 : 1) * damageScale(event.amount);
        sprite.position.set(event.x + drift * .25, 2, event.z); sprite.scale.set(0, 0, 1); sprite.renderOrder = 20; root.add(sprite); numbers.push({ sprite, age: 0, size, drift });
      }
    },
    update(combat: Combat, hero: THREE.Vector3, camera: THREE.Camera, alpha: number, dt: number) {
      if (showEnemies) horde.update(combat.enemies, alpha, combat.time);
      const existing = new Set(combat.enemies.map(e => e.id));
      for (const [id, view] of enemies) if (!existing.has(id)) { root.remove(view.root); view.dispose(); enemies.delete(id); }
      for (const [id, time] of flashes) { if (time <= dt) flashes.delete(id); else flashes.set(id, time - dt); }
      damageFlash = Math.max(0, damageFlash - dt);
      for (const enemy of showEnemies ? combat.enemies : []) {
        if (enemy.kind === 'thrall') continue;
        let view = enemies.get(enemy.id);
        if (!view) { view = skeleton(partCache, enemy.kind); enemies.set(enemy.id, view); root.add(view.root); }
        view.root.position.set(THREE.MathUtils.lerp(enemy.previous.x, enemy.x, alpha), 0, THREE.MathUtils.lerp(enemy.previous.z, enemy.z, alpha));
        view.root.rotation.y = enemy.attack?.yaw ?? enemy.yaw;
        view.update(enemy, dt, (flashes.get(enemy.id) ?? 0) / .16, combat.targetId === enemy.id, camera);
      }
      for (let i = numbers.length - 1; i >= 0; i--) {
        const item = numbers[i]; item.age += dt;
        // Pop in, settle, then rise while fading.
        const pop = item.age < .08 ? .5 + item.age / .08 * .8 : item.age < .18 ? 1.3 - (item.age - .08) / .1 * .3 : 1;
        item.sprite.scale.set(item.size * pop, item.size * pop * .5, 1);
        item.sprite.position.y += dt * Math.max(.2, 1.5 - item.age * 1.4); item.sprite.position.x += item.drift * dt * .3;
        item.sprite.material.opacity = Math.max(0, Math.min(1, (.9 - item.age) / .35));
        if (item.age >= .9) { root.remove(item.sprite); item.sprite.material.dispose(); numbers.splice(i, 1); }
      }
      slash.visible = definition.id === 'warrior' && !!combat.attack && combat.attack.age >= definition.basic.windup && combat.attack.age < definition.basic.windup + definition.basic.active;
      const currentArc = combat.attack?.arc ?? definition.basic.arc;
      if (slash.visible && currentArc !== slashArc) { slash.geometry.dispose(); slash.geometry = new THREE.RingGeometry(1.25, definition.basic.range, 24, 1, Math.PI / 2 - currentArc / 2, currentArc); slashArc = currentArc; }
      slash.scale.setScalar((combat.attack?.range ?? definition.basic.range) / definition.basic.range);
      slashRoot.position.copy(hero).y = .8; slashRoot.rotation.y = combat.attack?.yaw ?? 0;
      const slashElement = combat.attack?.loadout?.element;
      slashMaterial.color.set(slashElement ? ELEMENTS[slashElement].color : (combat.attack?.multiplier ?? 1) > 1 ? 0xf4d68c : 0xe7d7af);
      slashMaterial.opacity = .4 + combat.impetusStacks / IMPETUS.maxStacks * .18;
      spinRoot.visible = definition.id === 'warrior' && !!combat.whirlwind;
      if (definition.id === 'warrior' && combat.whirlwind) {
        const phase = combat.whirlwind.age / WHIRLWIND.interval;
        spinRoot.scale.setScalar(combat.whirlwind.radius / WHIRLWIND.radius);
        const affinity = combat.whirlwind.loadout.element;
        spinMaterial.color.set(affinity ? ELEMENTS[affinity].color : 0xdad6c1); pulseMaterial.color.copy(spinMaterial.color);
        spinRoot.position.copy(hero); spinRoot.rotation.y = combat.whirlwind.yaw - phase * Math.PI * 2;
        const pulsePhase = phase - Math.floor(phase);
        pulse.scale.setScalar(.85 + pulsePhase * .15); pulseMaterial.opacity = .32 * (1 - pulsePhase);
      }
      return { damageFlash: damageFlash / .28, heroFlash: (flashes.get(0) ?? 0) / .16 };
    },
    reset() { horde.reset(); clearNumbers(); flashes.clear(); damageFlash = 0; slash.visible = false; spinRoot.visible = false; for (const enemy of enemies.values()) { root.remove(enemy.root); enemy.dispose(); } enemies.clear(); },
    dispose() { this.reset(); horde.dispose(); scene.remove(root); for (const kindParts of partCache.values()) for (const g of kindParts.values()) g.dispose(); partCache.clear(); slash.geometry.dispose(); slashMaterial.dispose(); spinGeometry.dispose(); pulseGeometry.dispose(); spinMaterial.dispose(); pulseMaterial.dispose(); numberMaps.forEach(t => t.dispose()); },
  };
}
