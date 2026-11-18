import { tailoredVolume, tailoredPanel } from './tailored-geometry.ts';
import { polishCharacter } from './approved-character-polish.ts';
import * as THREE from 'three';

/** Procedural scale model: hood, long robe and staff, pending final character art. */
export function createMage() {
  const root = new THREE.Group();
  root.name = 'Mago — figura provisional';
  const cloth = new THREE.MeshStandardMaterial({ color: 0x383b55, roughness: 0.95 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x9b8760, metalness: 0.4, roughness: 0.65 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x47372e, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9c7960, roughness: 1 });
  const crystal = new THREE.MeshStandardMaterial({
    color: 0xc4dcf3,
    emissive: 0x7599d0,
    emissiveIntensity: 0.8,
    roughness: 0.25,
  });
  const materials = [cloth, trim, wood, skin, crystal];
  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root,
  ) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }
  const robe = mesh(
    tailoredVolume(
      [
        [-0.53, 0.34, 0.235],
        [-0.45, 0.33, 0.23],
        [-0.22, 0.29, 0.205],
        [0, 0.26, 0.18],
        [0.2, 0.225, 0.16],
        [0.33, 0.205, 0.15],
      ],
      0.065,
      40,
    ),
    cloth,
    0,
    0.7,
    0,
  );
  mesh(
    tailoredVolume(
      [
        [1.02, 0.205, 0.15],
        [1.13, 0.215, 0.16],
        [1.32, 0.24, 0.16],
        [1.44, 0.235, 0.13],
        [1.51, 0.1, 0.085],
      ],
      0.018,
    ),
    cloth,
    0,
    0,
    0,
  );
  const belt = mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.06, 16), trim, 0, 1.02, 0);
  belt.scale.z = 0.72;
  const hood = mesh(new THREE.SphereGeometry(1, 16, 12), cloth, 0, 1.69, 0.035);
  hood.scale.set(0.16, 0.2, 0.15);
  const face = mesh(new THREE.SphereGeometry(1, 12, 10), skin, 0, 1.69, -0.08);
  face.scale.set(0.095, 0.125, 0.065);
  const arms = [-1, 1].map(sign => {
    const arm = new THREE.Group();
    arm.position.set(sign * 0.28, 1.43, 0);
    root.add(arm);
    mesh(
      tailoredVolume(
        [
          [-0.43, 0.115, 0.105],
          [-0.37, 0.12, 0.11],
          [-0.24, 0.09, 0.09],
          [-0.1, 0.1, 0.105],
          [0.015, 0.09, 0.09],
        ],
        0.055,
      ),
      cloth,
      sign * 0.04,
      0,
      0,
      arm,
    );
    mesh(new THREE.SphereGeometry(0.075, 12, 10), skin, sign * 0.05, -0.46, -0.03, arm);
    return arm;
  });
  mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.65, 10), wood, 0.05, -0.23, -0.07, arms[1]);
  mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), trim, 0.05, 0.58, -0.07, arms[1]);
  mesh(new THREE.OctahedronGeometry(0.11), crystal, 0.05, 0.58, -0.07, arms[1]);
  const feet = [-1, 1].map(sign => {
    const foot = mesh(new THREE.SphereGeometry(1, 12, 8), wood, sign * 0.13, 0.09, -0.05);
    foot.scale.set(0.09, 0.09, 0.17);
    return foot;
  });
  let stride = 0;
  polishCharacter(root, 'mage', { cloth, leather: wood, metal: trim, skin }, arms);
  // Replace flat stole panels with fitted cloth; keep the approved embroidery and book.
  for (const o of [...root.children])
    if (
      o instanceof THREE.Mesh &&
      o.geometry instanceof THREE.BoxGeometry &&
      o.material === cloth &&
      Math.abs(o.position.y - 0.65) < 0.001
    ) {
      root.remove(o);
      o.geometry.dispose();
    }
  for (const sign of [-1, 1])
    mesh(tailoredPanel(0.17, 0.8, 0.018, 0.016), cloth, sign * 0.13, 0.65, -0.247).rotation.z = sign * 0.055;
  mesh(
    tailoredVolume(
      [
        [1.37, 0.29, 0.175],
        [1.43, 0.285, 0.17],
        [1.49, 0.205, 0.13],
        [1.54, 0.115, 0.09],
      ],
      0.018,
    ),
    cloth,
    0,
    0,
    0.025,
  );
  // Back drape follows the shoulder mantle, with depth and folds clear in profile.
  mesh(tailoredPanel(0.43, 0.67, 0.018, 0.025), cloth, 0, 1.13, 0.18).rotation.x = -0.08;
  root.name = 'Mago — prendas y silueta';
  return {
    root,
    walk(dt: number, speed: number) {
      stride += speed * dt * 2.8;
      const swing = Math.sin(stride) * Math.min(1, speed / 3);
      feet.forEach((f, i) => {
        f.position.z = -0.05 + swing * (i ? -0.1 : 0.1);
      });
      arms[0].rotation.x = -0.15 * swing;
      arms[1].rotation.x = 0.08 * swing;
      robe.rotation.z = swing * 0.015;
    },
    combatPose(age: number | undefined, flash: number, casting = false, charges = 0) {
      if (age !== undefined || casting) {
        arms[0].rotation.x = -0.9;
        arms[1].rotation.x = -0.35;
      }
      for (const m of [cloth, trim, wood, skin]) {
        m.emissive.set(0xac3927);
        m.emissiveIntensity = flash;
      }
      crystal.emissiveIntensity = 0.8 + charges * 0.3;
    },
    resetPose() {
      stride = 0;
      arms.forEach(arm => arm.rotation.set(0, 0, 0));
    },
    fade(opacity: number) {
      for (const m of materials) {
        m.transparent = opacity < 1;
        m.opacity = opacity;
        m.depthWrite = opacity > 0.5;
      }
    },
  };
}
