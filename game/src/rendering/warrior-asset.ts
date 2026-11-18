import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { BasicAttackDefinition } from '../content/class-definition.ts';

let source: THREE.Group | undefined;
let loading: Promise<void> | undefined;
export function loadWarriorAsset() {
  return (loading ??= new GLTFLoader()
    .loadAsync(`${import.meta.env.BASE_URL}assets/models/warrior-veteran.glb`)
    .then(asset => {
      source = asset.scene;
    })
    .catch(error => {
      loading = undefined;
      throw error;
    }));
}

export function createWarriorAsset(basic: BasicAttackDefinition, template = source) {
  if (!template) return undefined;
  const root = template.clone(true);
  root.name = 'Guerrero — malla del veterano';
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
    if (!node) throw new Error(`Falta la articulación ${name} del Guerrero`);
    return node;
  }
  const torso = joint('Torso'),
    head = joint('Head'),
    sword = joint('Sword');
  const arms = ['Left', 'Right'].map(side => ({
    upper: joint('Upper' + side),
    fore: joint('Fore' + side),
    hand: joint('Hand' + side),
    leg: joint('Leg' + side),
  }));
  let stride = 0,
    gait = 0;
  function rest() {
    const swing = Math.sin(stride) * gait;
    torso.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    sword.rotation.set(0, 0, 0);
    arms.forEach((arm, i) => {
      const sign = i === 0 ? -1 : 1;
      arm.upper.rotation.set(sign * swing * 0.2, 0, sign * 0.18);
      arm.fore.rotation.set(0.09, 0, 0);
      arm.hand.rotation.set(i === 1 ? -0.42 : 0, 0, 0);
      arm.leg.rotation.set(-sign * swing * 0.42, 0, sign * 0.035);
    });
  }
  rest();
  return {
    root,
    walk(dt: number, speed: number) {
      stride += speed * dt * 2.8;
      gait = THREE.MathUtils.damp(gait, Math.min(1, speed / 3), 14, dt);
      rest();
    },
    combatPose(age: number | undefined, flash: number, spinning = false, impetus = 0) {
      rest();
      if (age !== undefined || spinning) {
        const time = Math.max(0, age ?? 0);
        const windup = THREE.MathUtils.smoothstep(time, 0, basic.windup);
        const cut = THREE.MathUtils.smoothstep(time, basic.windup, basic.windup + basic.active);
        const recovery = 1 - THREE.MathUtils.smoothstep(time, basic.windup + basic.active, basic.duration);
        const lift = spinning ? 1 : windup * recovery;
        const sweep = spinning ? 0.35 : (-0.6 + cut * 1.25) * lift;
        torso.rotation.y = sweep;
        head.rotation.y = -sweep * 0.7;
        arms[1].upper.rotation.set(1.2 * lift, -0.3 * lift, 0.18 - 0.65 * lift);
        arms[1].fore.rotation.x = 0.09 + 0.55 * lift;
        arms[1].hand.rotation.x = -0.42 + 0.7 * lift;
        arms[0].upper.rotation.set(0.35 * lift, 0, -0.18 - 0.3 * lift);
        arms[0].fore.rotation.x = 0.09 + 0.65 * lift;
      }
      for (const material of materials.values()) {
        material.emissive.set(flash > 0 ? 0xac3927 : 0x7c6e42);
        material.emissiveIntensity = flash > 0 ? flash : impetus * 0.03;
      }
    },
    resetPose() {
      stride = gait = 0;
      rest();
    },
    fade(opacity: number) {
      for (const material of materials.values()) {
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.depthWrite = opacity > 0.5;
      }
    },
  };
}
