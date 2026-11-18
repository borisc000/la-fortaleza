import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARCHER } from '../content/classes/archer.ts';
import { createArcher as previousArcher } from './previous-archer.ts';

let source: THREE.Group | undefined;
let loading: Promise<void> | undefined;

export function loadArcherAsset() {
  return loading ??= new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/models/archer-ranger.glb`)
    .then(asset => { source = asset.scene; })
    .catch(error => { loading = undefined; throw error; });
}

const up = new THREE.Vector3(0, 1, 0);
const down = new THREE.Vector3(0, -1, 0);
const upperLength = .297;
const foreLength = .281;

export function createArcher(template = source) {
  if (!template) return previousArcher();
  const root = template.clone(true);
  root.name = 'Arquero — malla de explorador';
  const materials = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  function ownMaterial(original: THREE.Material) {
    let material = materials.get(original);
    if (!material) {
      material = original.clone() as THREE.MeshStandardMaterial;
      materials.set(original, material);
    }
    return material;
  }
  root.traverse(node => {
    if (node instanceof THREE.Mesh) {
      node.geometry = node.geometry.clone();
      node.material = Array.isArray(node.material) ? node.material.map(ownMaterial) : ownMaterial(node.material);
      node.castShadow = node.receiveShadow = true;
    }
  });
  function joint(name: string) {
    const node = root.getObjectByName(name);
    if (!node) throw new Error(`Falta la articulación ${name} del Arquero`);
    return node;
  }
  const torso = joint('Doublet'), head = joint('RangerHead');
  const bow = joint('Longbow'), arrow = joint('NockedArrow');
  const strings = [joint('CordTop'), joint('CordBottom')];
  const arms = ['Left', 'Right'].map(side => ({
    sleeve: joint('Sleeve' + side), bracer: joint('Bracer' + side), glove: joint('Glove' + side),
    leg: joint('Leg' + side),
  }));
  const grip = new THREE.Vector3(), nock = new THREE.Vector3(), cheek = new THREE.Vector3(.078, 1.656, -.067);
  const restHand = new THREE.Vector3(), shoulder = new THREE.Vector3(), elbow = new THREE.Vector3();
  const axis = new THREE.Vector3(), bend = new THREE.Vector3(), tip = new THREE.Vector3();
  let stride = 0, gait = 0;

  // Resolve each elbow from two fixed limb lengths so the bow grip and nock stay in the hands.
  function reach(index: number, hand: THREE.Vector3, draw: number) {
    const side = index === 0 ? -1 : 1;
    const arm = arms[index];
    shoulder.set(side * .198, 1.44, 0).applyAxisAngle(up, torso.rotation.y);
    axis.subVectors(hand, shoulder);
    const distance = Math.max(.001, axis.length());
    axis.divideScalar(distance);
    const along = (upperLength ** 2 - foreLength ** 2 + distance ** 2) / (2 * distance);
    bend.set(side * (.6 + draw), -.28, .7 + draw);
    bend.addScaledVector(axis, -bend.dot(axis)).normalize();
    elbow.copy(shoulder).addScaledVector(axis, along)
      .addScaledVector(bend, Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2)));
    arm.sleeve.position.copy(shoulder);
    arm.sleeve.quaternion.setFromUnitVectors(down, axis.subVectors(elbow, shoulder).normalize());
    arm.bracer.position.copy(elbow);
    arm.bracer.quaternion.setFromUnitVectors(down, axis.subVectors(hand, elbow).normalize());
    arm.glove.position.copy(hand);
    arm.glove.rotation.z = index === 1 ? draw * 1.30 : bow.rotation.z;
  }

  function pose(draw: number, tension: number, nocked: boolean, released = false) {
    const swing = Math.sin(stride) * gait;
    torso.rotation.y = -.94 * draw;
    for (const [i, arm] of arms.entries()) {
      const side = i === 0 ? -1 : 1;
      arm.leg.position.set(side * .113, .94, 0).applyAxisAngle(up, torso.rotation.y);
      arm.leg.rotation.set(-side * swing * .42, torso.rotation.y * .6, side * .075 * draw, 'YXZ');
    }
    head.rotation.y = -torso.rotation.y * .97;
    grip.set(THREE.MathUtils.lerp(-.32, .020, draw), THREE.MathUtils.lerp(.948, 1.585, draw),
      THREE.MathUtils.lerp(-.074 - swing * .055, -.652, draw));
    bow.position.copy(grip);
    bow.rotation.z = -.20 + draw * .28;
    // Both halves terminate at the same point before, during and after a release.
    nock.set(0, 0, .135).applyQuaternion(bow.quaternion).add(grip).lerp(cheek, tension);
    strings.forEach((string, i) => {
      tip.set(0, i === 0 ? .62 : -.62, .135).applyQuaternion(bow.quaternion).add(grip);
      string.position.copy(tip);
      axis.subVectors(nock, tip);
      string.scale.set(1, axis.length(), 1);
      string.quaternion.setFromUnitVectors(up, axis.normalize());
    });
    reach(0, grip, draw);
    restHand.set(.32, .948, -.074 + swing * .055);
    // Meet the string as the bow rises. The drawing hand stays at the cheek upon release.
    restHand.lerp(nock, THREE.MathUtils.smoothstep(draw, 0, .72));
    if (released) restHand.lerp(cheek, Math.max(0, draw - tension) * draw);
    reach(1, restHand, draw);
    arrow.visible = nocked;
    if (nocked) {
      arrow.position.copy(nock);
      tip.copy(grip); tip.y += .025;
      arrow.quaternion.setFromUnitVectors(up, axis.subVectors(tip, nock).normalize());
    }
  }

  pose(0, 0, false);
  return {
    root,
    walk(dt: number, speed: number) {
      stride += dt * speed * 2.8;
      gait = THREE.MathUtils.damp(gait, Math.min(speed / 3, 1), 14, dt);
    },
    combatPose(age: number | undefined, flash: number, raining = false, precision = 0) {
      const { windup, duration } = ARCHER.basic;
      let draw = 0, tension = 0;
      if (raining) {
        draw = tension = 1;
      } else if (age !== undefined && age <= windup) {
        draw = THREE.MathUtils.smoothstep(age, 0, windup);
        tension = THREE.MathUtils.smoothstep(draw, .55, 1);
      } else if (age !== undefined) {
        draw = 1 - THREE.MathUtils.smoothstep(age, windup + .035, duration);
        tension = 1 - THREE.MathUtils.smoothstep(age, windup, windup + .025);
      }
      const released = !raining && age !== undefined && age >= windup;
      pose(draw, tension, raining || (age !== undefined && !released && draw >= .72), released);
      for (const material of materials.values()) {
        material.emissive.set(flash > 0 ? 0xac3927 : 0x626e40);
        material.emissiveIntensity = flash > 0 ? flash : precision * .025;
      }
    },
    resetPose() { stride = gait = 0; pose(0, 0, false); },
    fade(opacity: number) {
      for (const material of materials.values()) {
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.depthWrite = opacity > .5;
      }
    },
  };
}
