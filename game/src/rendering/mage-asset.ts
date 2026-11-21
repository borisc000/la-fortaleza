import * as THREE from 'three';
import { MAGE } from '../content/classes/mage.ts';
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
  const sparks = new THREE.Group();
  const sparkGeo = new THREE.OctahedronGeometry(0.05);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xb8f3ff });
  for (let i = 0; i < 3; i++) sparks.add(new THREE.Mesh(sparkGeo, sparkMat));
  const staffLight = new THREE.Group();
  const release = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const ray = new THREE.Mesh(sparkGeo, sparkMat);
    const angle = Math.PI / 4 + (i * Math.PI) / 2;
    ray.position.set(0.22 * Math.cos(angle), 0.22 * Math.sin(angle), 0);
    ray.rotation.z = angle - Math.PI / 2;
    ray.scale.set(0.85, 3, 0.85);
    release.add(ray);
  }
  release.visible = false;
  staffLight.add(sparks, release);
  root.add(staffLight);
  staffLight.position.set(0.36, 2.06, -0.14);
  root.updateMatrixWorld(true);
  bones.get('foreR')?.attach(staffLight);
  sparks.visible = false;
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
        const lift = casting ? 1 : Math.sin(Math.min(1, (age ?? 0) / 0.4) * Math.PI);
        pose('upperL', 0.3 + 0.6 * lift);
        pose('foreL', 0.55);
        pose('upperR', casting ? 0.55 : 0.08);
      }
      const sinceRelease = (age ?? -1) - MAGE.basic.windup;
      release.visible = casting && sinceRelease >= 0 && sinceRelease < 0.16;
      if (release.visible) {
        const phase = sinceRelease / 0.16;
        release.scale.setScalar(1.35 * (1 - phase * phase));
        pose('foreR', -0.4 * Math.sin(phase * Math.PI));
      }
      sparks.visible = charges > 0;
      for (const [i, spark] of sparks.children.entries()) {
        const angle = time * 4 + (i * Math.PI * 2) / 3;
        spark.visible = i < charges;
        spark.position.set(Math.cos(angle) * 0.19, Math.sin(angle) * 0.14, Math.sin(angle) * 0.1);
      }
      for (const m of materials) {
        m.emissive.set(flash > 0 ? 0xac3927 : 0x000000);
        m.emissiveIntensity = flash;
        if (m.name.includes('Cristal')) {
          m.emissive.set(0x267e9b);
          m.emissiveIntensity =
            0.32 + charges * 0.57 + (age !== undefined ? 0.35 * Math.sin(Math.min(1, age / 0.4) * Math.PI) : 0);
        }
      }
    },
    resetPose() {
      release.visible = false;
      sparks.visible = false;
      time = gait = 0;
      bones.forEach((bone, name) => bone.quaternion.copy(bind.get(name)!));
      idle();
    },
    fade(opacity: number) {
      sparkMat.transparent = opacity < 1;
      sparkMat.opacity = opacity;
      sparkMat.depthWrite = opacity > 0.5;
      materials.forEach(m => {
        m.transparent = opacity < 1;
        m.opacity = opacity;
        m.depthWrite = opacity > 0.5;
      });
    },
  };
}
