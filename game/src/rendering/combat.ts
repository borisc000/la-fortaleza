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
const BOX = () => new THREE.BoxGeometry(1, 1, 1),
  BALL = () => new THREE.SphereGeometry(1, 10, 8);
const ROD = () => new THREE.CylinderGeometry(1, 1, 1, 7),
  CONE = () => new THREE.CylinderGeometry(0, 1, 1, 7);

/**
 * Static geometry for one enemy kind, merged per articulated group and material.
 * Slots: body, leg0/leg1, arm0 (left) / arm1 (right, weapon). Materials: bone, iron, cloth, dark and glow.
 * Merging keeps a full silhouette at roughly a dozen draw calls per enemy instead of one per primitive.
 */
function enemyGeometry(kind: EnemyKind) {
  const buckets = new Map<string, THREE.BufferGeometry[]>();
  const put = (
    slot: string,
    mat: string,
    g: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rx = 0,
    rz = 0,
  ) => {
    g.scale(sx, sy, sz);
    if (rx) g.rotateX(rx);
    if (rz) g.rotateZ(rz);
    g.translate(x, y, z);
    const key = `${slot}:${mat}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(g);
  };
  const armoured = kind !== 'archer',
    heavy = kind === 'charger' || kind === 'elite' || kind === 'boss',
    lord = kind === 'elite' || kind === 'boss';
  for (const [i, sign] of [
    [0, -1],
    [1, 1],
  ] as const) {
    const leg = `leg${i}`,
      arm = `arm${i}`;
    put(leg, 'bone', ROD(), 0, -0.23, 0, 0.052, 0.43, 0.052);
    put(leg, 'bone', BALL(), 0, -0.44, 0, 0.075, 0.07, 0.075);
    put(leg, 'bone', ROD(), 0, -0.64, 0.01, 0.043, 0.37, 0.043);
    put(leg, 'iron', BOX(), 0, -0.81, -0.055, 0.13, 0.12, 0.27);
    if (armoured) {
      put(leg, 'iron', BOX(), 0, -0.62, -0.035, 0.105, 0.3, 0.05);
      put(leg, 'iron', BALL(), 0, -0.44, -0.05, 0.07, 0.065, 0.05);
    } else put(leg, 'cloth', BOX(), 0, -0.66, 0, 0.1, 0.2, 0.1);
    put(arm, 'bone', ROD(), sign * 0.03, -0.17, 0, 0.045, 0.29, 0.045);
    put(arm, 'bone', ROD(), sign * 0.04, -0.41, -0.06, 0.04, 0.25, 0.04, 0.25);
    put(arm, 'bone', BALL(), sign * 0.04, -0.55, -0.085, 0.052, 0.07, 0.06);
    // Shoulders: bare joint, a single worn pauldron, or full spiked plates.
    if (heavy) {
      put(arm, 'iron', BALL(), sign * 0.02, 0.02, 0, 0.16, 0.115, 0.16);
      put(arm, 'iron', BOX(), sign * 0.05, -0.1, 0, 0.2, 0.05, 0.22);
      if (kind !== 'elite') put(arm, 'iron', CONE(), sign * 0.09, 0.17, 0, 0.04, 0.18, 0.04, 0, -sign * 0.45);
    } else if (kind === 'soldier' && sign === 1) put(arm, 'iron', BALL(), 0, 0.01, 0, 0.125, 0.095, 0.125);
    else put(arm, 'bone', BALL(), 0, 0, 0, 0.1, 0.085, 0.1);
    if (armoured) put(arm, 'iron', BOX(), sign * 0.04, -0.4, -0.065, 0.075, 0.2, 0.075, 0.25);
  }
  // Rib cage, spine, pelvis and skull shared by every kind.
  put('body', 'cloth', BOX(), 0, 0.87, 0.02, 0.35, 0.28, 0.24);
  put('body', 'bone', ROD(), 0, 1.17, 0.035, 0.045, 0.52, 0.045);
  for (let i = 0; i < 4; i++) put('body', 'bone', BALL(), 0, 1.11 + i * 0.075, -0.035, 0.21 - i * 0.013, 0.024, 0.11);
  put('body', 'bone', BOX(), 0, 1.4, -0.035, 0.42, 0.035, 0.06);
  put('body', 'bone', BALL(), 0, 1.6, -0.09, 0.12, 0.14, 0.11);
  put('body', 'bone', BOX(), 0, 1.49, -0.115, 0.13, 0.055, 0.11);
  for (const sign of [-1, 1]) put('body', 'dark', BALL(), sign * 0.048, 1.61, -0.184, 0.031, 0.033, 0.025);
  put('body', 'dark', BOX(), 0, 1.56, -0.196, 0.028, 0.04, 0.02);
  // Ragged tabard: uneven strips below the belt read as torn cloth from the game camera.
  put('body', 'cloth', BOX(), 0, 1.0, -0.125, 0.22, 0.46, 0.02);
  put('body', 'dark', BOX(), 0, 0.99, -0.02, 0.37, 0.05, 0.27);
  put('body', 'cloth', BOX(), -0.06, 0.66, -0.128, 0.09, 0.22, 0.018);
  put('body', 'cloth', BOX(), 0.055, 0.7, -0.128, 0.075, 0.14, 0.018);
  put('body', 'cloth', BOX(), 0.03, 0.68, 0.14, 0.2, 0.2, 0.018);

  if (kind === 'soldier') {
    // Kettle hat, round shield and an arming sword.
    put('body', 'iron', BALL(), 0, 1.71, -0.065, 0.135, 0.085, 0.13);
    put('body', 'iron', BOX(), 0, 1.68, -0.07, 0.31, 0.035, 0.28);
    put('body', 'cloth', BOX(), 0.08, 1.18, 0.085, 0.14, 0.44, 0.1, 0, -0.2);
    put('arm0', 'dark', ROD(), -0.07, -0.42, -0.15, 0.21, 0.035, 0.21, Math.PI / 2);
    put('arm0', 'iron', BALL(), -0.07, -0.42, -0.175, 0.06, 0.06, 0.04);
    put('arm0', 'iron', ROD(), -0.07, -0.42, -0.158, 0.215, 0.02, 0.215, Math.PI / 2);
    put('arm1', 'dark', BOX(), 0.04, -0.55, -0.085, 0.035, 0.18, 0.035);
    put('arm1', 'iron', BOX(), 0.04, -0.65, -0.085, 0.2, 0.035, 0.045);
    put('arm1', 'iron', BOX(), 0.04, -0.93, -0.085, 0.055, 0.52, 0.018);
    put('arm1', 'iron', CONE(), 0.04, -1.22, -0.085, 0.028, 0.07, 0.01, Math.PI);
  }
  if (kind === 'archer') {
    // Hood and cowl, belt quiver and a crossbow with prod, string and stirrup.
    put('body', 'cloth', BALL(), 0, 1.63, -0.045, 0.15, 0.17, 0.155);
    put('body', 'cloth', BOX(), 0, 1.44, -0.01, 0.46, 0.07, 0.27);
    put('body', 'cloth', BOX(), 0, 1.36, 0.1, 0.3, 0.34, 0.06);
    put('body', 'cloth', CONE(), 0, 1.78, 0.1, 0.07, 0.2, 0.07, -1.1);
    put('body', 'dark', ROD(), -0.2, 0.92, 0.12, 0.055, 0.32, 0.055, 0, 0.3);
    for (const dx of [-0.02, 0.015, 0.04])
      put('body', 'bone', BOX(), -0.25 + dx, 1.1, 0.12, 0.012, 0.12, 0.012, 0, 0.3);
    put('arm1', 'dark', BOX(), 0, -0.45, -0.25, 0.07, 0.08, 0.56);
    put('arm1', 'iron', BOX(), 0, -0.45, -0.46, 0.6, 0.035, 0.05);
    for (const sign of [-1, 1]) put('arm1', 'iron', BOX(), sign * 0.31, -0.45, -0.43, 0.04, 0.035, 0.09);
    put('arm1', 'bone', BOX(), 0, -0.45, -0.37, 0.6, 0.01, 0.01);
    put('arm1', 'iron', BOX(), 0, -0.45, -0.56, 0.09, 0.02, 0.06);
    put('arm1', 'bone', BOX(), 0, -0.4, -0.3, 0.012, 0.012, 0.34);
  }
  if (kind === 'charger') {
    // Horned, visored helm, a breastplate and a long maul held low.
    put('body', 'iron', BALL(), 0, 1.71, -0.065, 0.15, 0.1, 0.145);
    put('body', 'iron', BOX(), 0, 1.675, -0.19, 0.23, 0.05, 0.04);
    put('body', 'iron', BOX(), 0, 1.545, -0.19, 0.2, 0.09, 0.04);
    for (const sign of [-1, 1])
      put('body', 'bone', CONE(), sign * 0.19, 1.81, -0.06, 0.045, 0.26, 0.045, 0, -sign * 0.55);
    put('body', 'iron', BOX(), 0, 1.32, 0, 0.58, 0.16, 0.32);
    put('body', 'iron', BOX(), 0, 1.2, -0.07, 0.4, 0.3, 0.22);
    put('body', 'iron', BOX(), 0, 1.2, -0.185, 0.05, 0.3, 0.03);
    put('arm1', 'dark', ROD(), 0.04, -0.72, -0.085, 0.028, 1.05, 0.028);
    put('arm1', 'iron', BOX(), 0.04, -1.22, -0.085, 0.2, 0.2, 0.17);
    put('arm1', 'iron', CONE(), 0.04, -1.37, -0.085, 0.05, 0.12, 0.05, Math.PI);
    for (const sign of [-1, 1])
      put('arm1', 'iron', CONE(), 0.04 + sign * 0.15, -1.22, -0.085, 0.05, 0.12, 0.05, 0, (-sign * Math.PI) / 2);
  }
  if (lord) {
    // Plate, tassets, cloak and the core burning in the rib cage.
    const boss = kind === 'boss';
    put('body', 'iron', BOX(), 0, 1.23, -0.03, 0.42, 0.45, 0.26);
    put('body', 'iron', BOX(), 0, 1.3, -0.165, 0.05, 0.3, 0.03);
    for (const sign of [-1, 1]) put('body', 'iron', BOX(), sign * 0.13, 0.86, -0.135, 0.17, 0.28, 0.03);
    put('body', 'cloth', BOX(), 0, boss ? 1.0 : 1.1, 0.2, boss ? 0.62 : 0.48, boss ? 1.08 : 0.85, 0.05);
    put('body', 'cloth', BOX(), 0, 1.44, 0.03, boss ? 0.66 : 0.5, 0.09, 0.36);
    put('body', 'iron', ROD(), 0, 1.25, -0.166, 0.1, 0.03, 0.1, Math.PI / 2);
    put('body', 'glow', BALL(), 0, 1.25, -0.175, 0.07, 0.07, 0.035);
    put('body', 'iron', BALL(), 0, 1.71, -0.065, 0.14, 0.09, 0.135);
    if (boss) {
      // Crown of spikes over an open helm, hollow eyes alight.
      for (let i = -2; i <= 2; i++)
        put(
          'body',
          'iron',
          CONE(),
          i * 0.058,
          1.87 - Math.abs(i) * 0.012,
          -0.07,
          0.022,
          0.24 - Math.abs(i) * 0.035,
          0.022,
        );
      put('body', 'iron', ROD(), 0, 1.76, -0.065, 0.145, 0.04, 0.14);
      for (const sign of [-1, 1]) put('body', 'glow', BALL(), sign * 0.048, 1.61, -0.196, 0.02, 0.022, 0.016);
    } else {
      put('body', 'iron', BOX(), 0, 1.68, -0.07, 0.29, 0.035, 0.27);
      put('body', 'cloth', BOX(), 0, 1.86, -0.01, 0.04, 0.16, 0.28);
    }
    const length = boss ? 1.05 : 0.85;
    put('arm1', 'dark', BOX(), 0.04, -0.55, -0.085, 0.04, 0.22, 0.04);
    put('arm1', 'iron', BOX(), 0.04, -0.66, -0.085, boss ? 0.32 : 0.25, 0.04, 0.05);
    put('arm1', 'iron', BOX(), 0.04, -0.68 - length / 2, -0.085, 0.075, length, 0.022);
    put('arm1', 'iron', CONE(), 0.04, -0.68 - length - 0.05, -0.085, 0.038, 0.1, 0.012, Math.PI);
    put('arm1', 'iron', BALL(), 0.04, -0.44, -0.085, 0.04, 0.04, 0.04);
  }
  const merged = new Map<string, THREE.BufferGeometry>();
  for (const [key, list] of buckets) {
    merged.set(key, mergeGeometries(list)!);
    for (const g of list) g.dispose();
  }
  return merged;
}

/** Articulated undead soldier; every kind shares the skeleton and adds its own kit, deliberately distinct from the hero. */
function skeleton(cache: PartCache, kind: EnemyKind) {
  const stats = ENEMIES[kind];
  if (!cache.has(kind)) cache.set(kind, enemyGeometry(kind));
  const parts = cache.get(kind)!;
  const root = new THREE.Group(),
    body = new THREE.Group();
  root.add(body);
  const bone = new THREE.MeshStandardMaterial({ color: 0xc4b99d, roughness: 0.92 });
  const iron = new THREE.MeshStandardMaterial({
    color: kind === 'boss' ? 0x3a3340 : 0x4c514a,
    roughness: 0.7,
    metalness: 0.55,
  });
  const cloth = new THREE.MeshStandardMaterial({ color: stats.color, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x161c17, roughness: 1 });
  const glow = new THREE.MeshBasicMaterial({ color: kind === 'boss' ? 0xb98cff : 0xffd27a });
  const materials = [bone, iron, cloth, dark],
    lookup: Record<string, THREE.Material> = { bone, iron, cloth, dark, glow };
  const legs: THREE.Group[] = [],
    arms: THREE.Group[] = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sign * 0.13, 0.88, 0);
    body.add(leg);
    legs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(sign * 0.25, 1.37, -0.03);
    body.add(arm);
    arms.push(arm);
  }
  for (const [key, geometry] of parts) {
    const [slot, mat] = key.split(':'),
      parent = slot === 'body' ? body : slot.startsWith('leg') ? legs[Number(slot[3])] : arms[Number(slot[3])];
    const m = new THREE.Mesh(geometry, lookup[mat]);
    m.castShadow = mat !== 'glow';
    m.receiveShadow = mat !== 'glow';
    parent.add(m);
  }
  const mesh = (
    parent: THREE.Group,
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  };
  body.scale.setScalar(stats.scale);
  const warningMat = new THREE.MeshBasicMaterial({
    color: 0xc68032,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const warning = new THREE.Mesh(
    new THREE.RingGeometry(0.18, stats.range + 0.4, 32, 1, Math.PI / 2 - stats.arc / 2, stats.arc),
    warningMat,
  );
  warning.rotation.x = -Math.PI / 2;
  warning.position.y = 0.04;
  root.add(warning);
  const circle = new THREE.Mesh(new THREE.RingGeometry(0.02, 1, 48), warningMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.045;
  root.add(circle);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), warningMat);
  lane.rotation.x = -Math.PI / 2;
  lane.position.y = 0.05;
  root.add(lane);
  const fan = new THREE.Mesh(new THREE.RingGeometry(0.2, 15, 32, 1, Math.PI / 2 - 0.45, 0.9), warningMat);
  fan.rotation.x = -Math.PI / 2;
  fan.position.y = 0.04;
  root.add(fan);
  const spawnMaterial = new THREE.MeshBasicMaterial({
    color: 0xcbd4b3,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (const signal of [warning, circle, lane, fan]) signal.renderOrder = 12;
  const spawnRing = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.57, 32), spawnMaterial);
  spawnRing.rotation.x = -Math.PI / 2;
  spawnRing.position.y = 0.05;
  root.add(spawnRing);
  const bar = new THREE.Group();
  bar.position.y = 2.04 * stats.scale;
  root.add(bar);
  const backMaterial = new THREE.MeshBasicMaterial({ color: 0x1a211c, depthTest: false });
  const hpMaterial = new THREE.MeshBasicMaterial({ color: 0xb9a578, depthTest: false });
  mesh(bar, UNIT_BOX, backMaterial, 0, 0, 0, 0.67, 0.065, 0.01);
  const hp = mesh(bar, UNIT_BOX, hpMaterial, 0, 0, 0.01, 0.63, 0.035, 0.01);
  let stride = 0;
  return {
    root,
    update(enemy: Enemy, dt: number, flash: number, selected: boolean, camera: THREE.Camera) {
      stride += Math.min(enemy.speed, 3) * dt * 3;
      const swing = Math.sin(stride) * Math.min(1, enemy.speed / 1.5);
      legs[0].rotation.x = swing * 0.5;
      legs[1].rotation.x = -swing * 0.5;
      arms[0].rotation.x = -0.17 - swing * 0.2;
      arms[1].rotation.set(swing * 0.16, 0, 0);
      body.rotation.z = enemy.dead ? Math.PI / 2 : 0;
      body.position.y = enemy.dead ? 0.08 : 0;
      body.rotation.x = enemy.dead ? 0 : 0.1;
      if (enemy.attack) {
        const data = actionStats(kind, enemy.attack.action),
          a = enemy.attack.age,
          progress = THREE.MathUtils.clamp((a - data.windup) / data.active, 0, 1);
        arms[1].rotation.x = a < data.windup ? -2.1 * Math.min(1, a / 0.25) : -2.1 + progress * 2.4;
        arms[0].rotation.x = -0.5;
        if (enemy.attack.action === 'shot' || enemy.attack.action === 'volley') {
          arms[1].rotation.x = -1.3;
          arms[0].rotation.x = -1.2;
        }
        if (enemy.attack.action === 'charge') {
          body.rotation.x = 0.3;
          arms[1].rotation.x = -0.8;
        }
        if (enemy.attack.action === 'slam') {
          arms[1].rotation.x = a < data.windup ? -2.7 : 0.5;
          arms[0].rotation.x = arms[1].rotation.x;
        }
      }
      root.visible = !enemy.dead || enemy.deathAge < 1.6;
      spawnRing.visible = enemy.spawnRemaining > 0;
      spawnRing.scale.setScalar(1 + enemy.spawnRemaining * 0.5);
      const attack = enemy.attack,
        data = actionStats(kind, attack?.action),
        preparing = !!attack && attack.age < data.windup;
      const showing = !enemy.dead && !!attack && attack.age < data.windup + data.active;
      warning.visible = showing && (!attack?.action || attack.action === 'melee');
      circle.visible = showing && attack?.action === 'slam';
      circle.scale.setScalar(data.range + 0.4);
      lane.visible = !enemy.dead && preparing && (attack?.action === 'shot' || attack?.action === 'charge');
      const length = attack?.action === 'charge' ? CHARGE.length : stats.range;
      lane.scale.set(attack?.action === 'charge' ? 2 * (enemy.radius + 0.4) : 0.12, length, 1);
      lane.position.z = -length / 2;
      fan.visible = !enemy.dead && preparing && attack?.action === 'volley';
      warningMat.color.set(
        !preparing ? 0xbd4435 : attack?.action === 'shot' || attack?.action === 'volley' ? 0x80c7dc : 0xc68032,
      );
      warningMat.opacity = preparing ? 0.2 + (0.3 * attack!.age) / data.windup : 0.45;
      bar.visible =
        !enemy.dead && (selected || enemy.hp < enemy.maxHp || !!enemy.attack || kind === 'elite' || kind === 'boss');
      bar.quaternion.copy(root.quaternion).invert().multiply(camera.quaternion);
      const fraction = enemy.hp / enemy.maxHp;
      hp.scale.x = 0.63 * fraction;
      hp.position.x = -0.315 * (1 - fraction);
      hpMaterial.color.set(selected ? 0xe0c785 : 0x9b6d55);
      glow.transparent = enemy.spawnRemaining > 0;
      glow.opacity = enemy.spawnRemaining > 0 ? 0.3 : 1;
      for (const material of materials) {
        material.transparent = enemy.spawnRemaining > 0;
        material.opacity = enemy.spawnRemaining > 0 ? 0.3 : 1;
        material.emissive.set(flash > 0 ? 0xa54c28 : enemy.burn ? 0xd95b16 : 0x206c8a);
        material.emissiveIntensity = flash > 0 ? flash * 2 : enemy.burn || enemy.wetRemaining > 0 ? 0.35 : 0;
      }
    },
    dispose() {
      [...materials, glow, warningMat, spawnMaterial, backMaterial, hpMaterial].forEach(m => m.dispose());
      [warning, circle, lane, fan, spawnRing].forEach(m => m.geometry.dispose());
    },
  };
}

/** Isolated inspection of the same enemy geometry used in combat, without HUD or warnings. */
export function createEnemyModelPreview(kind: Exclude<EnemyKind, 'thrall'>) {
  const cache: PartCache = new Map();
  const view = skeleton(cache, kind);
  for (const child of view.root.children.slice(1)) child.visible = false;
  return {
    root: view.root,
    dispose() {
      view.dispose();
      for (const g of cache.get(kind)!.values()) g.dispose();
    },
  };
}

export function createCombatView(scene: THREE.Scene, definition: ClassDefinition = WARRIOR, showEnemies = true) {
  const root = new THREE.Group();
  scene.add(root);
  const horde = createHordeView(root);
  const partCache: PartCache = new Map();
  const enemies = new Map<number, ReturnType<typeof skeleton>>();
  const flashes = new Map<number, number>();
  const numbers: Array<{ sprite: THREE.Sprite; age: number; size: number; drift: number }> = [];
  const numberMaps = new Map<string, THREE.CanvasTexture>();
  const slashMaterial = new THREE.MeshBasicMaterial({
    color: 0xe7d7af,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  let slashArc = definition.basic.arc;
  const slash = new THREE.Mesh(
    new THREE.RingGeometry(
      1.25,
      definition.basic.range,
      24,
      1,
      Math.PI / 2 - definition.basic.arc / 2,
      definition.basic.arc,
    ),
    slashMaterial,
  );
  slash.rotation.x = -Math.PI / 2;
  slash.visible = false;
  const slashRoot = new THREE.Group();
  slashRoot.add(slash);
  root.add(slashRoot);
  const spinRoot = new THREE.Group();
  root.add(spinRoot);
  spinRoot.visible = false;
  const spinMaterial = new THREE.MeshBasicMaterial({
    color: 0xdad6c1,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pulseMaterial = spinMaterial.clone();
  pulseMaterial.opacity = 0.22;
  const spinGeometry = new THREE.RingGeometry(WHIRLWIND.radius * 0.72, WHIRLWIND.radius, 28, 1, 0, Math.PI * 0.75);
  for (let i = 0; i < 2; i++) {
    const arc = new THREE.Mesh(spinGeometry, spinMaterial);
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = i * Math.PI;
    arc.position.y = 0.75 + i * 0.12;
    spinRoot.add(arc);
  }
  const pulseGeometry = new THREE.RingGeometry(WHIRLWIND.radius - 0.06, WHIRLWIND.radius, 64);
  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = 0.06;
  spinRoot.add(pulse);
  let damageFlash = 0;
  function numberMap(amount: number, tone: DamageTone) {
    const display = amount > 0 && amount < 1 ? Math.max(0.1, Math.round(amount * 10) / 10) : Math.round(amount);
    const key = `${display}:${tone}`;
    const cached = numberMaps.get(key);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.font = 'bold 42px "Palatino Linotype", Georgia, serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.lineWidth = 7;
      context.lineJoin = 'round';
      context.strokeStyle = '#0f1512';
      context.strokeText(String(display), 64, 32);
      context.fillStyle = DAMAGE_TONES[tone];
      context.fillText(String(display), 64, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    numberMaps.set(key, texture);
    return texture;
  }
  function clearNumbers() {
    for (const item of numbers) {
      root.remove(item.sprite);
      item.sprite.material.dispose();
    }
    numbers.length = 0;
  }
  return {
    events(events: CombatEvent[]) {
      for (const event of events)
        if (event.type === 'hit') {
          flashes.set(event.target, 0.16);
          if (event.target === 0) damageFlash = 0.28;
        }
      for (const event of damageLabels(events)) {
        if (numbers.length >= 24) {
          const old = numbers.shift()!;
          root.remove(old.sprite);
          old.sprite.material.dispose();
        }
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: numberMap(event.amount, damageTone(event)),
            transparent: true,
            depthTest: false,
          }),
        );
        // Deterministic spread so simultaneous labels on a pack do not stack on one spot.
        const drift = (((event.id * 37) % 11) - 5) / 5,
          size = (event.target === 0 ? 1.25 : 1) * damageScale(event.amount);
        sprite.position.set(event.x + drift * 0.25, 2, event.z);
        sprite.scale.set(0, 0, 1);
        sprite.renderOrder = 20;
        root.add(sprite);
        numbers.push({ sprite, age: 0, size, drift });
      }
    },
    update(combat: Combat, hero: THREE.Vector3, camera: THREE.Camera, alpha: number, dt: number) {
      if (showEnemies) horde.update(combat.enemies, alpha, combat.time);
      const existing = new Set(combat.enemies.map(e => e.id));
      for (const [id, view] of enemies)
        if (!existing.has(id)) {
          root.remove(view.root);
          view.dispose();
          enemies.delete(id);
        }
      for (const [id, time] of flashes) {
        if (time <= dt) flashes.delete(id);
        else flashes.set(id, time - dt);
      }
      damageFlash = Math.max(0, damageFlash - dt);
      for (const enemy of showEnemies ? combat.enemies : []) {
        if (enemy.kind === 'thrall') continue;
        let view = enemies.get(enemy.id);
        if (!view) {
          view = skeleton(partCache, enemy.kind);
          enemies.set(enemy.id, view);
          root.add(view.root);
        }
        view.root.position.set(
          THREE.MathUtils.lerp(enemy.previous.x, enemy.x, alpha),
          0,
          THREE.MathUtils.lerp(enemy.previous.z, enemy.z, alpha),
        );
        view.root.rotation.y = enemy.attack?.yaw ?? enemy.yaw;
        view.update(enemy, dt, (flashes.get(enemy.id) ?? 0) / 0.16, combat.targetId === enemy.id, camera);
      }
      for (let i = numbers.length - 1; i >= 0; i--) {
        const item = numbers[i];
        item.age += dt;
        // Pop in, settle, then rise while fading.
        const pop =
          item.age < 0.08 ? 0.5 + (item.age / 0.08) * 0.8 : item.age < 0.18 ? 1.3 - ((item.age - 0.08) / 0.1) * 0.3 : 1;
        item.sprite.scale.set(item.size * pop, item.size * pop * 0.5, 1);
        item.sprite.position.y += dt * Math.max(0.2, 1.5 - item.age * 1.4);
        item.sprite.position.x += item.drift * dt * 0.3;
        item.sprite.material.opacity = Math.max(0, Math.min(1, (0.9 - item.age) / 0.35));
        if (item.age >= 0.9) {
          root.remove(item.sprite);
          item.sprite.material.dispose();
          numbers.splice(i, 1);
        }
      }
      slash.visible =
        definition.id === 'warrior' &&
        !!combat.attack &&
        combat.attack.age >= definition.basic.windup &&
        combat.attack.age < definition.basic.windup + definition.basic.active;
      const currentArc = combat.attack?.arc ?? definition.basic.arc;
      if (slash.visible && currentArc !== slashArc) {
        slash.geometry.dispose();
        slash.geometry = new THREE.RingGeometry(
          1.25,
          definition.basic.range,
          24,
          1,
          Math.PI / 2 - currentArc / 2,
          currentArc,
        );
        slashArc = currentArc;
      }
      slash.scale.setScalar((combat.attack?.range ?? definition.basic.range) / definition.basic.range);
      slashRoot.position.copy(hero).y = 0.8;
      slashRoot.rotation.y = combat.attack?.yaw ?? 0;
      const slashElement = combat.attack?.loadout?.element;
      slashMaterial.color.set(
        slashElement ? ELEMENTS[slashElement].color : (combat.attack?.multiplier ?? 1) > 1 ? 0xf4d68c : 0xe7d7af,
      );
      slashMaterial.opacity = 0.4 + (combat.impetusStacks / IMPETUS.maxStacks) * 0.18;
      spinRoot.visible = definition.id === 'warrior' && !!combat.whirlwind;
      if (definition.id === 'warrior' && combat.whirlwind) {
        const phase = combat.whirlwind.age / WHIRLWIND.interval;
        spinRoot.scale.setScalar(combat.whirlwind.radius / WHIRLWIND.radius);
        const affinity = combat.whirlwind.loadout.element;
        spinMaterial.color.set(affinity ? ELEMENTS[affinity].color : 0xdad6c1);
        pulseMaterial.color.copy(spinMaterial.color);
        spinRoot.position.copy(hero);
        spinRoot.rotation.y = combat.whirlwind.yaw - phase * Math.PI * 2;
        const pulsePhase = phase - Math.floor(phase);
        pulse.scale.setScalar(0.85 + pulsePhase * 0.15);
        pulseMaterial.opacity = 0.32 * (1 - pulsePhase);
      }
      return { damageFlash: damageFlash / 0.28, heroFlash: (flashes.get(0) ?? 0) / 0.16 };
    },
    reset() {
      horde.reset();
      clearNumbers();
      flashes.clear();
      damageFlash = 0;
      slash.visible = false;
      spinRoot.visible = false;
      for (const enemy of enemies.values()) {
        root.remove(enemy.root);
        enemy.dispose();
      }
      enemies.clear();
    },
    dispose() {
      this.reset();
      horde.dispose();
      scene.remove(root);
      for (const kindParts of partCache.values()) for (const g of kindParts.values()) g.dispose();
      partCache.clear();
      slash.geometry.dispose();
      slashMaterial.dispose();
      spinGeometry.dispose();
      pulseGeometry.dispose();
      spinMaterial.dispose();
      pulseMaterial.dispose();
      numberMaps.forEach(t => t.dispose());
    },
  };
}
