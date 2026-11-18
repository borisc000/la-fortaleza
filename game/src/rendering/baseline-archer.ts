import * as THREE from 'three';
import { ARCHER } from '../content/classes/archer.ts';

/** Articulated provisional archer with a curved bow, string, quiver and nocked arrow. */
export function createArcher() {
  const root = new THREE.Group(); root.name = 'Arquero — figura provisional';
  const leather = new THREE.MeshStandardMaterial({ color: 0x594130, roughness: .9 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x455048, roughness: 1 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x8c6741, roughness: .8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb6b6a4, metalness: .6, roughness: .5 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xa08369, roughness: 1 });
  const materials = [leather, cloth, wood, metal, skin];
  function part(g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) {
    const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function oval(m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, parent: THREE.Object3D = root) { const mesh = part(new THREE.SphereGeometry(1, 12, 10), m, x, y, z, parent); mesh.scale.set(sx, sy, sz); return mesh; }
  oval(cloth, 0, 1.2, 0, .25, .33, .14); oval(leather, 0, 1.23, 0, .23, .28, .155);
  part(new THREE.BoxGeometry(.43, .065, .3), leather, 0, .95, 0);
  oval(skin, 0, 1.58, 0, .065, .1, .065); oval(skin, 0, 1.72, -.02, .105, .14, .105);
  oval(cloth, 0, 1.79, .025, .12, .085, .12);
  const legs = [-1, 1].map(sign => {
    const leg = new THREE.Group(); leg.position.set(sign * .13, .93, 0); root.add(leg);
    oval(cloth, 0, -.22, 0, .105, .25, .11, leg); oval(leather, 0, -.61, 0, .09, .23, .1, leg); oval(leather, 0, -.85, -.06, .095, .075, .17, leg); return leg;
  });
  const arms = [-1, 1].map(sign => {
    const arm = new THREE.Group(); arm.position.set(sign * .28, 1.43, 0); root.add(arm);
    oval(cloth, 0, -.17, 0, .085, .2, .09, arm); oval(leather, 0, -.36, -.015, .075, .14, .075, arm); oval(skin, 0, -.49, -.025, .065, .08, .06, arm); return arm;
  });
  const quiver = part(new THREE.CylinderGeometry(.09, .07, .65, 10, 1, true), leather, .13, 1.23, .22); quiver.rotation.z = -.3;
  for (let i = 0; i < 4; i++) { const arrow = part(new THREE.CylinderGeometry(.009, .009, .65, 6), wood, .1 + i * .035, 1.55, .22); arrow.rotation.z = -.3; part(new THREE.BoxGeometry(.04, .11, .013), cloth, .19 + i * .035, 1.81, .22); }
  const bow = new THREE.Group(); root.add(bow);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -.53, 0), new THREE.Vector3(0, -.28, -.16), new THREE.Vector3(0, 0, -.23), new THREE.Vector3(0, .28, -.16), new THREE.Vector3(0, .53, 0)]);
  part(new THREE.TubeGeometry(curve, 20, .022, 8, false), wood, 0, 0, 0, bow);
  part(new THREE.CylinderGeometry(.005, .005, 1.06, 6), metal, 0, 0, 0, bow);
  const nocked = part(new THREE.CylinderGeometry(.009, .009, .8, 6), wood, 0, 0, -.18, bow); nocked.rotation.x = Math.PI / 2;
  let stride = 0, gait = 0;
  return {
    root,
    walk(dt: number, speed: number) { stride += speed * dt * 2.8; gait += (Math.min(1, speed / 3) - gait) * (1 - Math.exp(-14 * dt)); const swing = Math.sin(stride) * gait; legs[0].rotation.x = swing * .6; legs[1].rotation.x = -swing * .6; arms[0].rotation.set(-swing * .2, 0, 0); arms[1].rotation.set(swing * .3, 0, 0); },
    combatPose(age: number | undefined, flash: number, raining = false, precision = 0) {
      const drawing = age !== undefined && age < ARCHER.basic.windup;
      const aiming = age !== undefined || raining;
      if (aiming) { arms[0].rotation.x = raining ? 2 : 1.1; arms[1].rotation.set(.9, drawing ? -.65 : -.2, -.5); }
      bow.position.set(-.34, aiming ? 1.27 : 1.02, aiming ? -.43 : -.14); bow.rotation.set(raining ? .7 : 0, 0, aiming ? 0 : -.15);
      nocked.visible = drawing; nocked.position.z = -.18 + (drawing ? age! / ARCHER.basic.windup * .15 : 0);
      for (const m of materials) { m.emissive.set(flash > 0 ? 0xac3927 : 0x626e40); m.emissiveIntensity = flash > 0 ? flash : precision * .025; }
    },
    resetPose() { stride = 0; gait = 0; for (const joint of [...arms, ...legs]) joint.rotation.set(0, 0, 0); nocked.visible = false; },
    fade(opacity: number) { for (const m of materials) { m.transparent = opacity < 1; m.opacity = opacity; m.depthWrite = opacity > .5; } },
  };
}
