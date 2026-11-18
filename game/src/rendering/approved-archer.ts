import { polishCharacter } from './approved-character-polish.ts';
import * as THREE from 'three';
import { ARCHER } from '../content/classes/archer.ts';

/** Articulated provisional archer with a curved bow, string, quiver and nocked arrow. */
export function createArcher() {
  const root = new THREE.Group();
  root.name = 'Arquero — figura provisional';
  const leather = new THREE.MeshStandardMaterial({ color: 0x594130, roughness: 0.9 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x455048, roughness: 1 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x8c6741, roughness: 0.8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb6b6a4, metalness: 0.6, roughness: 0.5 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xa08369, roughness: 1 });
  const materials = [leather, cloth, wood, metal, skin];
  function part(
    g: THREE.BufferGeometry,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root,
  ) {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function oval(
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    parent: THREE.Object3D = root,
  ) {
    const mesh = part(new THREE.SphereGeometry(1, 12, 10), m, x, y, z, parent);
    mesh.scale.set(sx, sy, sz);
    return mesh;
  }
  oval(cloth, 0, 1.2, 0, 0.25, 0.33, 0.14);
  oval(leather, 0, 1.23, 0, 0.23, 0.28, 0.155);
  part(new THREE.BoxGeometry(0.43, 0.065, 0.3), leather, 0, 0.95, 0);
  oval(skin, 0, 1.58, 0, 0.065, 0.1, 0.065);
  oval(skin, 0, 1.72, -0.02, 0.105, 0.14, 0.105);
  oval(cloth, 0, 1.79, 0.025, 0.12, 0.085, 0.12);
  const legs = [-1, 1].map(sign => {
    const leg = new THREE.Group();
    leg.position.set(sign * 0.13, 0.93, 0);
    root.add(leg);
    oval(cloth, 0, -0.22, 0, 0.105, 0.25, 0.11, leg);
    oval(leather, 0, -0.61, 0, 0.09, 0.23, 0.1, leg);
    oval(leather, 0, -0.85, -0.06, 0.095, 0.075, 0.17, leg);
    return leg;
  });
  const arms = [-1, 1].map(sign => {
    const arm = new THREE.Group();
    arm.position.set(sign * 0.28, 1.43, 0);
    root.add(arm);
    oval(cloth, 0, -0.17, 0, 0.085, 0.2, 0.09, arm);
    oval(leather, 0, -0.36, -0.015, 0.075, 0.14, 0.075, arm);
    oval(skin, 0, -0.49, -0.025, 0.065, 0.08, 0.06, arm);
    return arm;
  });
  const quiver = part(new THREE.CylinderGeometry(0.09, 0.07, 0.65, 10, 1, true), leather, 0.13, 1.23, 0.22);
  quiver.rotation.z = -0.3;
  for (let i = 0; i < 4; i++) {
    const arrow = part(new THREE.CylinderGeometry(0.009, 0.009, 0.65, 6), wood, 0.1 + i * 0.035, 1.55, 0.22);
    arrow.rotation.z = -0.3;
    part(new THREE.BoxGeometry(0.04, 0.11, 0.013), cloth, 0.19 + i * 0.035, 1.81, 0.22);
  }
  const bow = new THREE.Group();
  root.add(bow);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.53, 0),
    new THREE.Vector3(0, -0.28, -0.16),
    new THREE.Vector3(0, 0, -0.23),
    new THREE.Vector3(0, 0.28, -0.16),
    new THREE.Vector3(0, 0.53, 0),
  ]);
  part(new THREE.TubeGeometry(curve, 20, 0.022, 8, false), wood, 0, 0, 0, bow);
  part(new THREE.CylinderGeometry(0.005, 0.005, 1.06, 6), metal, 0, 0, 0, bow);
  const nocked = part(new THREE.CylinderGeometry(0.009, 0.009, 0.8, 6), wood, 0, 0, -0.18, bow);
  nocked.rotation.x = Math.PI / 2;
  let stride = 0,
    gait = 0;
  polishCharacter(root, 'archer', { cloth, leather, metal, skin }, arms);
  bow.position.set(-0.34, 1.02, -0.14);
  bow.rotation.z = -0.15;
  nocked.visible = false;
  return {
    root,
    walk(dt: number, speed: number) {
      stride += speed * dt * 2.8;
      gait += (Math.min(1, speed / 3) - gait) * (1 - Math.exp(-14 * dt));
      const swing = Math.sin(stride) * gait;
      legs[0].rotation.x = swing * 0.6;
      legs[1].rotation.x = -swing * 0.6;
      arms[0].rotation.set(-swing * 0.2, 0, 0);
      arms[1].rotation.set(swing * 0.3, 0, 0);
    },
    combatPose(age: number | undefined, flash: number, raining = false, precision = 0) {
      const drawing = age !== undefined && age < ARCHER.basic.windup;
      const aiming = age !== undefined || raining;
      if (aiming) {
        arms[0].rotation.x = raining ? 2 : 1.1;
        arms[1].rotation.set(0.9, drawing ? -0.65 : -0.2, -0.5);
      }
      bow.position.set(-0.34, aiming ? 1.27 : 1.02, aiming ? -0.43 : -0.14);
      bow.rotation.set(raining ? 0.7 : 0, 0, aiming ? 0 : -0.15);
      nocked.visible = drawing;
      nocked.position.z = -0.18 + (drawing ? (age! / ARCHER.basic.windup) * 0.15 : 0);
      for (const m of materials) {
        m.emissive.set(flash > 0 ? 0xac3927 : 0x626e40);
        m.emissiveIntensity = flash > 0 ? flash : precision * 0.025;
      }
    },
    resetPose() {
      stride = 0;
      gait = 0;
      for (const joint of [...arms, ...legs]) joint.rotation.set(0, 0, 0);
      nocked.visible = false;
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
