import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Enemy } from '../domain/combat.ts';
import { CAMPAIGN } from '../content/campaign.ts';
import { ENEMIES } from '../content/enemies.ts';

/** Shared low-detail bodies and warnings: three draw calls for the weak horde. */
export function createHordeView(parent: THREE.Group) {
  const parts: THREE.BufferGeometry[] = [];
  function part(g: THREE.BufferGeometry, tint = 0xa19b86) {
    const color = new THREE.Color(tint), values = new Float32Array(g.getAttribute('position').count * 3);
    for (let i = 0; i < values.length; i += 3) { values[i] = color.r; values[i + 1] = color.g; values[i + 2] = color.b; }
    g.setAttribute('color', new THREE.BufferAttribute(values, 3)); parts.push(g);
  }
  function bone(x: number, y: number, z: number, w: number, h: number, d: number, tint?: number) { part(new THREE.BoxGeometry(w, h, d).translate(x, y, z), tint); }
  part(new THREE.SphereGeometry(1, 10, 8).scale(.15, .17, .14).translate(0, 1.52, 0));
  bone(0, 1.38, -.035, .17, .09, .17);
  bone(-.06, 1.54, -.132, .045, .05, .025, 0x252622); bone(.06, 1.54, -.132, .045, .05, .025, 0x252622);
  bone(0, 1.06, .025, .065, .54, .07);
  for (let y = .99; y < 1.3; y += .09) bone(0, y, -.015, .35, .035, .18);
  bone(0, .83, 0, .29, .11, .16, 0x514c40);
  for (const x of [-.12, .12]) { part(new THREE.CylinderGeometry(.043, .038, .73, 6).translate(x, .45, 0)); bone(x, .07, -.045, .1, .08, .2); }
  for (const x of [-.25, .25]) part(new THREE.CylinderGeometry(.038, .032, .55, 6).translate(x, 1.04, -.09));
  // Hunched shoulders, torn shroud and a rusted cleaver give the mass a readable outline from the game camera.
  bone(0, 1.36, .0, .46, .05, .1); bone(-.25, 1.34, -.02, .1, .09, .11); bone(.25, 1.34, -.02, .1, .09, .11);
  bone(0, 1.42, .1, .34, .2, .05, 0x5d5a4c); bone(0, 1.05, .12, .3, .56, .03, 0x5d5a4c); bone(.07, .68, .125, .13, .2, .025, 0x5d5a4c);
  bone(-.03, .98, -.115, .2, .34, .02, 0x6b6654); bone(-.06, .72, -.115, .09, .2, .02, 0x6b6654);
  bone(0, 1.47, -.15, .1, .03, .05); bone(0, 1.66, -.02, .2, .05, .2, 0x8f8a76);
  bone(.25, .73, -.13, .03, .12, .03, 0x2a2420); bone(.25, .52, -.13, .09, .32, .014, 0x6f6257); bone(.25, .34, -.13, .06, .06, .014, 0x6f6257);
  const bodyGeometry = mergeGeometries(parts)!; parts.forEach(p => p.dispose());
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .95 });
  const warningMaterial = new THREE.MeshBasicMaterial({ color: 0xf09160, transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide });
  const spawnMaterial = new THREE.MeshBasicMaterial({ color: 0xd3bd83, transparent: true, opacity: .7, depthWrite: false, side: THREE.DoubleSide });
  const sector = new THREE.RingGeometry(.2, 1.5, 16, 1, Math.PI / 2 - Math.PI / 4, Math.PI / 2); sector.rotateX(-Math.PI / 2);
  const ring = new THREE.RingGeometry(.48, .57, 20); ring.rotateX(-Math.PI / 2);
  const bodies = new THREE.InstancedMesh(bodyGeometry, material, CAMPAIGN.maxEnemies);
  const warnings = new THREE.InstancedMesh(sector, warningMaterial, CAMPAIGN.maxEnemies);
  const spawns = new THREE.InstancedMesh(ring, spawnMaterial, CAMPAIGN.maxEnemies);
  bodies.name = 'Despojos · cuerpos instanciados'; warnings.name = 'Despojos · ataques'; spawns.name = 'Despojos · apariciones';
  for (const mesh of [bodies, warnings, spawns]) { mesh.count = 0; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parent.add(mesh); }
  bodies.receiveShadow = true; warnings.renderOrder = 12; spawns.renderOrder = 11;
  const transform = new THREE.Object3D(), color = new THREE.Color();
  return {
    update(enemies: readonly Enemy[], alpha: number, time: number) {
      let count = 0, attacking = 0, appearing = 0;
      for (const e of enemies) {
        if (e.kind !== 'thrall' || e.dead || count >= CAMPAIGN.maxEnemies) continue;
        transform.position.set(THREE.MathUtils.lerp(e.previous.x, e.x, alpha), e.spawnRemaining > 0 ? -.8 * e.spawnRemaining / CAMPAIGN.spawnWarning : Math.sin(time * 9 + e.id) * .025 * Math.min(1, e.speed), THREE.MathUtils.lerp(e.previous.z, e.z, alpha));
        transform.rotation.set(0, e.attack?.yaw ?? e.yaw, 0); transform.scale.setScalar(.93 + e.id * 37 % 15 / 100); transform.updateMatrix(); bodies.setMatrixAt(count, transform.matrix);
        color.setHex(e.burn ? 0xe18a55 : e.wetRemaining > 0 ? 0x86b9c4 : e.hp < e.maxHp ? 0xc0ac90 : 0xffffff); bodies.setColorAt(count++, color);
        transform.position.y = .055; transform.scale.setScalar(1); transform.updateMatrix();
        if (e.spawnRemaining > 0) spawns.setMatrixAt(appearing++, transform.matrix);
        else if (e.attack && e.attack.age <= ENEMIES.thrall.windup + ENEMIES.thrall.active) warnings.setMatrixAt(attacking++, transform.matrix);
      }
      bodies.count = count; warnings.count = attacking; spawns.count = appearing;
      for (const mesh of [bodies, warnings, spawns]) mesh.instanceMatrix.needsUpdate = true;
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    },
    reset() { bodies.count = warnings.count = spawns.count = 0; },
    dispose() { for (const mesh of [bodies, warnings, spawns]) { parent.remove(mesh); mesh.dispose(); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); } },
  };
}
