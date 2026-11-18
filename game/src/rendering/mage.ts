import { createMageAsset } from './mage-asset.ts';
import { tailoredVolume, tailoredPanel } from './tailored-geometry.ts';
import { polishCharacter } from './character-polish.ts';
import * as THREE from 'three';

/** Procedural scale model: hood, long robe and staff, pending final character art. */
export function createMage() {
  const asset = createMageAsset(); if (asset) return asset;
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
  const robe = mesh(tailoredVolume([[-.53,.34,.235],[-.45,.33,.23],[-.22,.29,.205],[0,.26,.18],[.20,.225,.16],[.33,.205,.15]],.065,40), cloth, 0, .7, 0);
  mesh(tailoredVolume([[1.02,.205,.15],[1.13,.215,.16],[1.32,.24,.16],[1.44,.235,.13],[1.51,.10,.085]],.018),cloth,0,0,0);
  const belt = mesh(new THREE.CylinderGeometry(.235, .235, .06, 16), trim, 0, 1.02, 0); belt.scale.z = .72;
  const hood = mesh(new THREE.SphereGeometry(1, 16, 12), cloth, 0, 1.69, .035); hood.scale.set(.16, .2, .15);
  const face = mesh(new THREE.SphereGeometry(1, 12, 10), skin, 0, 1.69, -.08); face.scale.set(.095, .125, .065);
  const arms = [-1, 1].map(sign => {
    const arm = new THREE.Group(); arm.position.set(sign * .28, 1.43, 0); root.add(arm);
    mesh(tailoredVolume([[-.43,.115,.105],[-.37,.12,.11],[-.24,.09,.09],[-.10,.10,.105],[.015,.09,.09]],.055), cloth, sign * .04, 0, 0, arm);
    mesh(new THREE.SphereGeometry(.075, 12, 10), skin, sign * .05, -.46, -.03, arm); return arm;
  });
  mesh(new THREE.CylinderGeometry(.025, .035, 1.65, 10), wood, .05, -.23, -.07, arms[1]);
  mesh(new THREE.TorusGeometry(.1, .025, 8, 16), trim, .05, .58, -.07, arms[1]);
  mesh(new THREE.OctahedronGeometry(.11), crystal, .05, .58, -.07, arms[1]);
  const feet = [-1, 1].map(sign => { const foot = mesh(new THREE.SphereGeometry(1, 12, 8), wood, sign * .13, .09, -.05); foot.scale.set(.09, .09, .17); return foot; });
  let stride = 0;
  polishCharacter(root, 'mage', { cloth, leather: wood, metal: trim, skin }, arms);
  // Replace flat stole panels with fitted cloth; keep the approved embroidery and book.
  for(const o of [...root.children]) if(o instanceof THREE.Mesh && o.geometry instanceof THREE.BoxGeometry && o.material===cloth && Math.abs(o.position.y-.65)<.001) {root.remove(o);o.geometry.dispose();}
  for(const sign of [-1,1])mesh(tailoredPanel(.17,.80,.018,.016),cloth,sign*.13,.65,-.247).rotation.z=sign*.055;
  mesh(tailoredVolume([[1.37,.29,.175],[1.43,.285,.17],[1.49,.205,.13],[1.54,.115,.09]],.018),cloth,0,0,.025);
  // Back drape follows the shoulder mantle, with depth and folds clear in profile.
  mesh(tailoredPanel(.43,.67,.018,.025),cloth,0,1.13,.18).rotation.x=-.08;
  root.name='Mago — prendas y silueta';
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
