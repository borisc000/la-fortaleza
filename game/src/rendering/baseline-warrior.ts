import * as THREE from 'three';
import { WARRIOR } from '../content/classes/warrior.ts';
import type { BasicAttackDefinition } from '../content/class-definition.ts';

/** Articulated scale study only; replace with rigged art during character production. */
export function createWarrior(basic: BasicAttackDefinition = WARRIOR.basic) {
  const root = new THREE.Group();
  const legs: THREE.Group[] = [], arms: THREE.Group[] = [];
  let stride = 0, gait = 0;
  function joint(start: number, x: number, y: number) {
    const parts = root.children.slice(start), group = new THREE.Group();
    group.position.set(x, y, 0); root.add(group);
    for (const part of parts) group.attach(part);
    return group;
  }
  const materials = {
    leather: new THREE.MeshStandardMaterial({ color: 0x49382c, roughness: 0.87 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x77817d, roughness: 0.5, metalness: 0.78 }),
    mail: new THREE.MeshStandardMaterial({ color: 0x414a47, roughness: 0.8, metalness: 0.65 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x34372e, roughness: 1 }),
    skin: new THREE.MeshStandardMaterial({ color: 0x9c7960, roughness: 0.95 }),
    hair: new THREE.MeshStandardMaterial({ color: 0x2d2822, roughness: 1 }),
  };
  function ellipsoid(material: THREE.Material, position: number[], scale: number[]) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), material);
    mesh.position.set(position[0], position[1], position[2]); mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  }
  function part(material: THREE.Material, position: number[], size: number[], rotation = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]); mesh.rotation.z = rotation;
    mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  }
  ellipsoid(materials.mail, [0, 1.22, 0], [.265, .34, .14]);
  ellipsoid(materials.leather, [0, 1.24, .005], [.245, .29, .155]);
  part(materials.leather, [0, .94, 0], [.43, .075, .29]);
  part(materials.steel, [0, .94, -.155], [.07, .07, .015]);
  for (const sign of [-1, 1]) {
    const legStart = root.children.length;
    ellipsoid(materials.cloth, [sign * .13, .69, 0], [.115, .26, .12]);
    ellipsoid(materials.leather, [sign * .14, .32, .015], [.09, .22, .1]);
    ellipsoid(materials.steel, [sign * .14, .49, -.035], [.1, .105, .085]);
    part(materials.steel, [sign * .14, .27, -.075], [.115, .24, .06], sign * .025);
    ellipsoid(materials.leather, [sign * .14, .075, -.055], [.1, .075, .18]);
    legs.push(joint(legStart, sign * .13, .92));
    const armStart = root.children.length;
    ellipsoid(materials.mail, [sign * .30, 1.28, 0], [.105, .22, .105]).rotation.z = sign * .15;
    ellipsoid(materials.steel, [sign * .29, 1.43, 0], [.14, .10, .16]);
    ellipsoid(materials.leather, [sign * .35, 1.01, -.025], [.08, .17, .08]);
    part(materials.steel, [sign * .37, 1.015, .012], [.09, .18, .10], sign * .06);
    ellipsoid(materials.leather, [sign * .37, .85, -.035], [.075, .095, .07]);
    arms.push(joint(armStart, sign * .29, 1.43));
    part(materials.cloth, [sign * .14, .83, .12], [.24, .30, .04], sign * -.08);
  }
  ellipsoid(materials.skin, [0, 1.57, 0], [.075, .10, .075]);
  ellipsoid(materials.skin, [0, 1.72, -.01], [.105, .14, .105]);
  ellipsoid(materials.hair, [0, 1.78, .018], [.112, .10, .105]);
  part(materials.leather, [0, 1.25, .155], [.055, .52, .02], -.48);
  // Sword rests down beside the right leg, with realistic one-and-a-half-hand proportions.
  arms[1].attach(part(materials.leather, [.40, .84, -.04], [.035, .20, .035], -.08));
  arms[1].attach(part(materials.steel, [.40, .73, -.04], [.23, .035, .045]));
  arms[1].attach(part(materials.steel, [.42, .39, -.04], [.055, .66, .018], .04));
  root.name = 'Guerrero — figura de escala provisional';
  return {
    root,
    walk(dt: number, speed: number) {
      stride += speed * dt * 2.8;
      gait += (Math.min(1, speed / 3) - gait) * (1 - Math.exp(-14 * dt));
      const swing = Math.sin(stride) * gait;
      legs[0].rotation.x = swing * .62; legs[1].rotation.x = -swing * .62;
      arms[0].rotation.x = -swing * .36; arms[1].rotation.x = swing * .24;
      arms[1].rotation.y = 0; arms[1].rotation.z = 0; arms[0].rotation.z = 0;
    },
    combatPose(age: number | undefined, flash: number, spinning = false, impetus = 0) {
      if (age !== undefined) {
        const progress = THREE.MathUtils.clamp((age - basic.windup) / basic.active, 0, 1);
        const recovery = age > basic.windup + basic.active ? 1 - THREE.MathUtils.clamp((age - basic.windup - basic.active) / (basic.duration - basic.windup - basic.active), 0, 1) : 1;
        arms[1].rotation.x = 1.3 * recovery;
        arms[1].rotation.z = (-1 + progress * 2) * recovery;
        arms[1].rotation.y = (-.6 + progress * 1.2) * recovery;
        arms[0].rotation.x = -.6 * recovery;
      }
      if (spinning) { arms[1].rotation.set(1.5, 0, -.65); arms[0].rotation.x = .6; arms[0].rotation.z = .25; }
      Object.values(materials).forEach(material => { material.emissive.set(flash > 0 ? 0xac3927 : 0x7c6e42); material.emissiveIntensity = flash > 0 ? flash : impetus * .03; });
    },
    resetPose() { stride = 0; gait = 0; [...legs, ...arms].forEach(joint => { joint.rotation.x = 0; }); },
    fade(opacity: number) { Object.values(materials).forEach(material => { material.transparent = opacity < 1; material.opacity = opacity; material.depthWrite = opacity > .5; }); },
  };
}
