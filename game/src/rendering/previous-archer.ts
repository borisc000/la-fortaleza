import { tailoredVolume, tailoredPanel } from './tailored-geometry.ts';
import { polishCharacter } from './character-polish.ts';
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
  part(tailoredVolume([[.91,.18,.12],[1.02,.175,.125],[1.15,.20,.135],[1.34,.23,.145],[1.45,.22,.11],[1.51,.085,.07]],.02),cloth,0,0,0);
  part(tailoredVolume([[.98,.18,.13],[1.10,.183,.145],[1.24,.216,.15],[1.39,.225,.14],[1.43,.20,.12]]),leather,0,0,0);
  part(new THREE.BoxGeometry(.43, .065, .3), leather, 0, .95, 0);
  oval(skin, 0, 1.58, 0, .065, .1, .065); oval(skin, 0, 1.72, -.02, .105, .14, .105);
  oval(cloth, 0, 1.79, .025, .12, .085, .12);
  const legs = [-1, 1].map(sign => {
    const leg = new THREE.Group(); leg.position.set(sign * .13, .93, 0); root.add(leg);
    part(tailoredVolume([[-.47,.068,.078],[-.37,.08,.09],[-.20,.097,.115],[.015,.102,.105]],.025),cloth,0,0,0,leg); part(tailoredVolume([[-.80,.065,.075],[-.70,.07,.082],[-.55,.085,.095],[-.43,.074,.08]],.01),leather,0,0,0,leg); oval(leather, 0, -.85, -.06, .095, .075, .17, leg); return leg;
  });
  const arms = [-1, 1].map(sign => {
    const arm = new THREE.Group(); arm.position.set(sign * .28, 1.43, 0); root.add(arm);
    part(tailoredVolume([[-.28,.06,.07],[-.20,.073,.08],[-.08,.085,.09],[.025,.085,.085]],.025),cloth,0,0,0,arm); part(tailoredVolume([[-.44,.05,.055],[-.33,.062,.066],[-.23,.066,.07]]),leather,0,0,-.015,arm); oval(skin, 0, -.49, -.025, .065, .08, .06, arm); return arm;
  });
  const quiver = part(new THREE.CylinderGeometry(.09, .07, .65, 10, 1, true), leather, .13, 1.23, .22); quiver.rotation.z = -.3;
  for (let i = 0; i < 4; i++) { const arrow = part(new THREE.CylinderGeometry(.009, .009, .65, 6), wood, .1 + i * .035, 1.55, .22); arrow.rotation.z = -.3; part(new THREE.BoxGeometry(.04, .11, .013), cloth, .19 + i * .035, 1.81, .22); }
  const bow = new THREE.Group(); root.add(bow);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -.53, 0), new THREE.Vector3(0, -.28, -.16), new THREE.Vector3(0, 0, -.23), new THREE.Vector3(0, .28, -.16), new THREE.Vector3(0, .53, 0)]);
  part(new THREE.TubeGeometry(curve, 20, .022, 8, false), wood, 0, 0, 0, bow);
  part(new THREE.CylinderGeometry(.005, .005, 1.06, 6), metal, 0, 0, 0, bow);
  const nocked = part(new THREE.CylinderGeometry(.009, .009, .8, 6), wood, 0, 0, -.18, bow); nocked.rotation.x = Math.PI / 2;
  let stride = 0, gait = 0;
  polishCharacter(root, 'archer', { cloth, leather, metal, skin }, arms);
  // Balance the shoulder silhouette; keep the bow-arm bracer as functional equipment.
  const oldShoulder = arms[0].children.find(o => o instanceof THREE.Mesh && o.geometry instanceof THREE.SphereGeometry && Math.abs(o.scale.x-.18)<.001);
  if(oldShoulder instanceof THREE.Mesh) { arms[0].remove(oldShoulder); oldShoulder.geometry.dispose(); }
  for(const arm of arms) {
    const shoulder = part(tailoredVolume([[-.075,.10,.11],[-.015,.115,.12],[.035,.10,.105],[.055,.06,.07]]),cloth,0,0,.015,arm);
    shoulder.name='Hombrera equilibrada';
  }

  // Preserve the harness, pouches and stitches; replace flat vest/cape panels.
  for(const o of [...root.children]) if(o instanceof THREE.Mesh && o.geometry instanceof THREE.BoxGeometry && ((o.material===cloth && Math.abs(o.position.y-1.12)<.001) || (o.material===leather && Math.abs(o.position.y-1.14)<.001))) {root.remove(o);o.geometry.dispose();}
  for(const sign of [-1,1]) {
    part(tailoredPanel(.14,.29,.018),leather,sign*.115,1.14,-.158);
    const cape = part(tailoredPanel(.24,.62,.016,.025),cloth,sign*.12,1.12,.20); cape.rotation.z=sign*.09; cape.scale.x=sign; cape.name='Paño de capa reflejado';
  }
  root.name='Arquero — prendas y silueta';
  bow.position.set(-.34, 1.02, -.14); bow.rotation.z = -.15; nocked.visible = false;
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
