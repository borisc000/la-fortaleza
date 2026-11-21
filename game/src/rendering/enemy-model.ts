import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { EnemyKind } from '../content/enemies.ts';
import { addChargerKit } from './enemy-charger.ts';
import { addInfantryKit } from './enemy-infantry.ts';
import { addLordKit } from './enemy-lords.ts';
import { beveledBox, type EnemyMaterial, type EnemyPartBuilder, type EnemySlot, shade } from './enemy-shapes.ts';

export type ArticulatedEnemy = Exclude<EnemyKind, 'thrall' | 'hunter'>;
type EnemyParts = { slot: EnemySlot; material: EnemyMaterial; geometry: THREE.BufferGeometry }[];
export type EnemyPartCache = Map<ArticulatedEnemy, EnemyParts>;

const oval = () => new THREE.SphereGeometry(1, 10, 6);
const bone = () => new THREE.CylinderGeometry(0.82, 1, 1, 6);
const boot = () => new THREE.CylinderGeometry(0.84, 1, 1, 7);

function bootFoot() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.32, -0.4);
  shape.lineTo(0.3, -0.4);
  shape.lineTo(0.39, 0.08);
  shape.quadraticCurveTo(0.48, 0.42, 0.15, 0.42);
  shape.lineTo(-0.16, 0.42);
  shape.quadraticCurveTo(-0.44, 0.42, -0.4, 0.1);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.68,
    curveSegments: 2,
    bevelThickness: 0.16,
    bevelSize: 0.065,
    bevelSegments: 1,
  })
    .translate(0, 0, -0.34)
    .rotateX(-Math.PI / 2);
}

function skull() {
  const geometry = new THREE.SphereGeometry(1, 12, 8);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const taper = THREE.MathUtils.lerp(0.62, 1, THREE.MathUtils.smoothstep(y, -0.95, 0.25));
    position.setX(i, position.getX(i) * taper);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function rib(sign: number, level: number) {
  const width = 0.19 - level * 0.017;
  const y = 1.3 - level * 0.057;
  const silhouette = [
    [0.075 * sign, y + 0.02, 0.083],
    [width * sign, y + 0.009, 0.036],
    [width * 0.8 * sign, y - 0.011, -0.087],
    [0.037 * sign, y - 0.028, -0.125],
  ];
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(silhouette.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    5,
    0.018 - 0.0015 * level,
    5,
    false,
  );
}

function graveAnatomy(put: EnemyPartBuilder, kind: ArticulatedEnemy) {
  const heavy = kind === 'charger' || kind === 'elite' || kind === 'boss';
  const clothArms = kind === 'archer';
  for (const [leg, arm, direction] of [
    ['leg0', 'arm0', -1],
    ['leg1', 'arm1', 1],
  ] as const) {
    put(leg, 'bone', shade(bone(), 0.74), direction * 0.005, -0.195, 0, 0.051, 0.38, 0.057, 0.1, -direction * 0.06);
    put(leg, 'bone', shade(oval(), 0.56), 0, -0.42, -0.004, 0.064, 0.068, 0.067);
    put(leg, 'bone', shade(bone(), 0.71), 0.012, -0.6, 0.013, 0.043, 0.32, 0.045, -0.12);
    put(leg, 'iron', shade(boot(), 0.54), 0, -0.767, -0.005, 0.066, 0.17, 0.086, -0.12);
    put(leg, 'iron', shade(bootFoot(), 0.72, 0.32), 0, -0.826, -0.049, heavy ? 0.158 : 0.143, 0.107, 0.24);
    if (clothArms) {
      put(leg, 'cloth', shade(boot(), 0.74), 0, -0.68, 0, 0.064, 0.17, 0.076);
    } else {
      put(
        leg,
        'iron',
        shade(beveledBox(), 1.13),
        0,
        -0.609,
        -0.049,
        heavy ? 0.134 : 0.106,
        heavy ? 0.31 : 0.27,
        0.081,
        0.08,
      );
      put(leg, 'iron', shade(beveledBox(), 1.06, 0.26), 0, -0.422, -0.067, 0.12, 0.112, 0.083, 0.11, 0.76);
    }

    put(arm, 'bone', shade(oval(), 0.76), direction * 0.015, -0.031, 0, 0.083, 0.099, 0.089);
    put(arm, 'bone', shade(bone(), 0.73), direction * 0.031, -0.167, -0.008, 0.053, 0.28, 0.055, -0.06);
    put(arm, 'bone', shade(oval(), 0.75), direction * 0.039, -0.298, -0.029, 0.049, 0.061, 0.052);
    put(arm, 'bone', shade(bone(), 0.88), direction * 0.04, -0.42, -0.066, 0.046, 0.24, 0.048, 0.28);
    put(arm, 'bone', shade(beveledBox(), 0.9), direction * 0.04, -0.551, -0.105, 0.076, 0.105, 0.093, 0.18);
    if (!clothArms) {
      put(
        arm,
        'iron',
        shade(beveledBox(), 1.06),
        direction * 0.044,
        -0.411,
        -0.083,
        heavy ? 0.118 : 0.09,
        0.2,
        0.088,
        0.24,
      );
    }
  }

  put('body', 'cloth', shade(oval(), 0.64), 0, 0.946, 0.009, 0.183, 0.149, 0.13);
  put('body', 'bone', shade(bone(), 0.58), 0, 1.15, 0.054, 0.051, 0.52, 0.048, 0.06);
  if (!heavy) {
    for (const sign of [-1, 1]) {
      for (let level = 0; level < 4; level++) put('body', 'bone', shade(rib(sign, level), 0.91), 0, 0, 0, 1, 1, 1);
      put('body', 'bone', shade(bone(), 1.16), 0.115 * sign, 1.37, -0.04, 0.026, 0.211, 0.045, 0, 1.48 * sign);
    }
    put('body', 'bone', shade(oval(), 0.86), 0, 1.243, -0.112, 0.035, 0.127, 0.043);
  }
  put('body', 'bone', shade(bone(), 0.66), 0, 1.445, -0.028, 0.058, 0.194, 0.056, 0.19);
  put('body', 'bone', shade(skull(), 1.06), 0, 1.616, -0.091, 0.118, 0.125, 0.117, -0.08);
  put('body', 'bone', shade(beveledBox(), 0.82), 0, 1.493, -0.109, 0.129, 0.055, 0.144, -0.12);
  for (const sign of [-1, 1]) {
    put('body', 'bone', shade(oval(), 1.16), sign * 0.064, 1.569, -0.158, 0.037, 0.023, 0.044, 0, sign * 0.2);
    put('body', 'dark', shade(oval(), 0.3), sign * 0.046, 1.613, -0.187, 0.035, 0.029, 0.028, 0, -sign * 0.13);
    put('body', 'bone', shade(oval(), 1.06), sign * 0.046, 1.638, -0.183, 0.041, 0.014, 0.027, 0, -sign * 0.19);
  }
  put('body', 'dark', shade(new THREE.ConeGeometry(1, 1, 3), 0.36), 0, 1.577, -0.205, 0.019, 0.034, 0.019);
  put('body', 'dark', shade(beveledBox(), 0.45), 0, 1.52, -0.172, 0.103, 0.017, 0.034);
  if (kind !== 'charger') {
    for (const x of [-0.034, -0.011, 0.012, 0.035])
      put('body', 'bone', shade(new THREE.BoxGeometry(), 0.94), x, 1.529, -0.187, 0.018, 0.018, 0.018);
  }
  put('body', 'dark', shade(beveledBox(), 0.9), 0, 0.985, 0.009, 0.363, 0.064, 0.277);
  put('body', 'iron', shade(beveledBox(), 1.3), 0.084, 0.986, -0.136, 0.056, 0.048, 0.027);
}

export function buildEnemyParts(kind: ArticulatedEnemy): EnemyParts {
  type Bucket = { slot: EnemySlot; material: EnemyMaterial; meshes: THREE.BufferGeometry[] };
  const buckets = new Map<string, Bucket>();
  const put: EnemyPartBuilder = (slot, material, geometry, x, y, z, sx, sy, sz, rx = 0, rz = 0, ry = 0) => {
    if (!geometry.hasAttribute('normal')) geometry.computeVertexNormals();
    if (!geometry.hasAttribute('color')) shade(geometry, 1, 0);
    geometry.deleteAttribute('uv');
    if (!geometry.index) {
      const indices = new Uint16Array(geometry.getAttribute('position').count);
      for (let i = 0; i < indices.length; i++) indices[i] = i;
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }
    geometry.scale(sx, sy, sz);
    if (rx) geometry.rotateX(rx);
    if (rz) geometry.rotateZ(rz);
    if (ry) geometry.rotateY(ry);
    geometry.translate(x, y, z);
    const key = `${slot}:${material}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { slot, material, meshes: [] };
      buckets.set(key, bucket);
    }
    bucket.meshes.push(geometry);
  };

  graveAnatomy(put, kind);
  if (kind === 'soldier' || kind === 'archer') addInfantryKit(put, kind);
  else if (kind === 'charger') addChargerKit(put);
  else addLordKit(put, kind);
  return Array.from(buckets.values(), ({ slot, material, meshes }) => {
    const geometry = mergeGeometries(meshes)!;
    for (const piece of meshes) piece.dispose();
    return { slot, material, geometry };
  });
}
