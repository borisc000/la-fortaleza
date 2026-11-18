import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
let source: THREE.Group | undefined, pending: Promise<void> | undefined;
export function loadMageAsset(): Promise<void> {
  if (source) return Promise.resolve();
  return (pending ??= new GLTFLoader()
    .loadAsync(`${import.meta.env.BASE_URL}assets/models/mage-slim.glb`)
    .then(gltf => {
      source = gltf.scene;
    })
    .catch(error => {
      pending = undefined;
      throw error;
    }));
}
export function createMageAsset(template = source) {
  if (!template) return undefined;
  const root = clone(template) as THREE.Group;
  root.name = 'Mago — malla subdividida y articulada';
  const materials = new Set<THREE.MeshStandardMaterial>(),
    bones = new Map<string, THREE.Bone>(),
    bind = new Map<string, THREE.Quaternion>();
  root.traverse(o => {
    if (o instanceof THREE.Bone) {
      bones.set(o.name, o);
      bind.set(o.name, o.quaternion.clone());
    }
    if (o instanceof THREE.Mesh) {
      o.geometry = o.geometry.clone();
      o.castShadow = true;
      o.receiveShadow = true;
      const copy = (m: THREE.Material) => {
        const c = m.clone() as THREE.MeshStandardMaterial;
        materials.add(c);
        return c;
      };
      o.material = Array.isArray(o.material) ? o.material.map(copy) : copy(o.material);
    }
  });
  let time = 0,
    gait = 0;
  const axis = new THREE.Vector3(1, 0, 0);
  function pose(name: string, angle: number) {
    const bone = bones.get(name);
    if (bone) bone.quaternion.copy(bind.get(name)!).multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
  }
  function idle() {
    pose('spine', Math.sin(time * 2) * 0.012);
    pose('upperL', Math.sin(time * 7) * gait * 0.13);
    pose('upperR', -Math.sin(time * 7) * gait * 0.06);
    pose('foreL', -0.08);
    pose('foreR', 0);
  }
  idle();
  return {
    root,
    walk(dt: number, speed: number) {
      time += dt;
      gait += (Math.min(speed / 3, 1) - gait) * Math.min(1, dt * 12);
      idle();
    },
    combatPose(age: number | undefined, flash: number, casting = false, charges = 0) {
      if (age !== undefined || casting) {
        pose('upperL', 0.65);
        pose('foreL', 0.55);
        pose('upperR', 0.08);
      }
      for (const m of materials) {
        m.emissive.set(flash > 0 ? 0xac3927 : 0x000000);
        m.emissiveIntensity = flash;
        if (m.name.includes('Cristal')) {
          m.emissive.set(0x267e9b);
          m.emissiveIntensity = 0.25 + charges * 0.08;
        }
      }
    },
    resetPose() {
      time = gait = 0;
      bones.forEach((bone, name) => bone.quaternion.copy(bind.get(name)!));
      idle();
    },
    fade(opacity: number) {
      materials.forEach(m => {
        m.transparent = opacity < 1;
        m.opacity = opacity;
        m.depthWrite = opacity > 0.5;
      });
    },
  };
}
