import { polishCharacter } from './approved-character-polish.ts';
import * as THREE from 'three';

/** Procedural scale model: hood, long robe and staff, pending final character art. */
export function createMage() {
  const root = new THREE.Group(); root.name = 'Mago — figura provisional';
  const cloth = new THREE.MeshStandardMaterial({ color: 0x383b55, roughness: .95 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x9b8760, metalness: .4, roughness: .65 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x47372e, roughness: .9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9c7960, roughness: 1 });
  const crystal = new THREE.MeshStandardMaterial({ color: 0xc4dcf3, emissive: 0x7599d0, emissiveIntensity: .8, roughness: .25 });
  const materials = [cloth, trim, wood, skin, crystal];
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) {
    const part = new THREE.Mesh(geometry, material); part.position.set(x, y, z); part.castShadow = true; part.receiveShadow = true; parent.add(part); return part;
  }
  const robe = mesh(new THREE.CylinderGeometry(.2, .36, 1.08, 16), cloth, 0, .7, 0); robe.scale.z = .7;
  const torso = mesh(new THREE.SphereGeometry(1, 16, 12), cloth, 0, 1.3, 0); torso.scale.set(.27, .3, .16);
  const belt = mesh(new THREE.CylinderGeometry(.235, .235, .06, 16), trim, 0, 1.02, 0); belt.scale.z = .72;
  const hood = mesh(new THREE.SphereGeometry(1, 16, 12), cloth, 0, 1.69, .035); hood.scale.set(.16, .2, .15);
  const face = mesh(new THREE.SphereGeometry(1, 12, 10), skin, 0, 1.69, -.08); face.scale.set(.095, .125, .065);
  const arms = [-1, 1].map(sign => {
    const arm = new THREE.Group(); arm.position.set(sign * .28, 1.43, 0); root.add(arm);
    mesh(new THREE.CylinderGeometry(.095, .12, .46, 12), cloth, sign * .04, -.21, 0, arm);
    mesh(new THREE.SphereGeometry(.075, 12, 10), skin, sign * .05, -.46, -.03, arm); return arm;
  });
  mesh(new THREE.CylinderGeometry(.025, .035, 1.65, 10), wood, .05, -.23, -.07, arms[1]);
  mesh(new THREE.TorusGeometry(.1, .025, 8, 16), trim, .05, .58, -.07, arms[1]);
  mesh(new THREE.OctahedronGeometry(.11), crystal, .05, .58, -.07, arms[1]);
  const feet = [-1, 1].map(sign => { const foot = mesh(new THREE.SphereGeometry(1, 12, 8), wood, sign * .13, .09, -.05); foot.scale.set(.09, .09, .17); return foot; });
  let stride = 0;
  polishCharacter(root, 'mage', { cloth, leather: wood, metal: trim, skin }, arms);
  return {
    root,
    walk(dt: number, speed: number) { stride += speed * dt * 2.8; const swing = Math.sin(stride) * Math.min(1, speed / 3); feet.forEach((f, i) => { f.position.z = -.05 + swing * (i ? -.1 : .1); }); arms[0].rotation.x = -.15 * swing; arms[1].rotation.x = .08 * swing; robe.rotation.z = swing * .015; },
    combatPose(age: number | undefined, flash: number, casting = false, charges = 0) {
      if (age !== undefined || casting) { arms[0].rotation.x = -.9; arms[1].rotation.x = -.35; }
      for (const m of [cloth, trim, wood, skin]) { m.emissive.set(0xac3927); m.emissiveIntensity = flash; }
      crystal.emissiveIntensity = .8 + charges * .3;
    },
    resetPose() { stride = 0; arms.forEach(arm => arm.rotation.set(0, 0, 0)); },
    fade(opacity: number) { for (const m of materials) { m.transparent = opacity < 1; m.opacity = opacity; m.depthWrite = opacity > .5; } },
  };
}
