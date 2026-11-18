import { polishCharacter } from './approved-character-polish.ts';
import * as THREE from 'three';
import { WARRIOR } from '../content/classes/warrior.ts';
import type { BasicAttackDefinition } from '../content/class-definition.ts';

/** Articulated scale study only; replace with rigged art during character production. */
export function createWarrior(basic: BasicAttackDefinition = WARRIOR.basic) {
  const root = new THREE.Group();
  const legs: THREE.Group[] = [],
    arms: THREE.Group[] = [];
  let stride = 0,
    gait = 0;
  function joint(start: number, x: number, y: number) {
    const parts = root.children.slice(start),
      group = new THREE.Group();
    group.position.set(x, y, 0);
    root.add(group);
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
    mesh.position.set(position[0], position[1], position[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }
  function part(material: THREE.Material, position: number[], size: number[], rotation = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.z = rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }
  ellipsoid(materials.mail, [0, 1.22, 0], [0.265, 0.34, 0.14]);
  ellipsoid(materials.leather, [0, 1.24, 0.005], [0.245, 0.29, 0.155]);
  part(materials.leather, [0, 0.94, 0], [0.43, 0.075, 0.29]);
  part(materials.steel, [0, 0.94, -0.155], [0.07, 0.07, 0.015]);
  for (const sign of [-1, 1]) {
    const legStart = root.children.length;
    ellipsoid(materials.cloth, [sign * 0.13, 0.69, 0], [0.115, 0.26, 0.12]);
    ellipsoid(materials.leather, [sign * 0.14, 0.32, 0.015], [0.09, 0.22, 0.1]);
    ellipsoid(materials.steel, [sign * 0.14, 0.49, -0.035], [0.1, 0.105, 0.085]);
    part(materials.steel, [sign * 0.14, 0.27, -0.075], [0.115, 0.24, 0.06], sign * 0.025);
    ellipsoid(materials.leather, [sign * 0.14, 0.075, -0.055], [0.1, 0.075, 0.18]);
    legs.push(joint(legStart, sign * 0.13, 0.92));
    const armStart = root.children.length;
    ellipsoid(materials.mail, [sign * 0.3, 1.28, 0], [0.105, 0.22, 0.105]).rotation.z = sign * 0.15;
    ellipsoid(materials.steel, [sign * 0.29, 1.43, 0], [0.14, 0.1, 0.16]);
    ellipsoid(materials.leather, [sign * 0.35, 1.01, -0.025], [0.08, 0.17, 0.08]);
    part(materials.steel, [sign * 0.37, 1.015, 0.012], [0.09, 0.18, 0.1], sign * 0.06);
    ellipsoid(materials.leather, [sign * 0.37, 0.85, -0.035], [0.075, 0.095, 0.07]);
    arms.push(joint(armStart, sign * 0.29, 1.43));
    part(materials.cloth, [sign * 0.14, 0.83, 0.12], [0.24, 0.3, 0.04], sign * -0.08);
  }
  ellipsoid(materials.skin, [0, 1.57, 0], [0.075, 0.1, 0.075]);
  ellipsoid(materials.skin, [0, 1.72, -0.01], [0.105, 0.14, 0.105]);
  ellipsoid(materials.hair, [0, 1.78, 0.018], [0.112, 0.1, 0.105]);
  part(materials.leather, [0, 1.25, 0.155], [0.055, 0.52, 0.02], -0.48);
  // Sword rests down beside the right leg, with realistic one-and-a-half-hand proportions.
  arms[1].attach(part(materials.leather, [0.4, 0.84, -0.04], [0.035, 0.2, 0.035], -0.08));
  arms[1].attach(part(materials.steel, [0.4, 0.73, -0.04], [0.23, 0.035, 0.045]));
  arms[1].attach(part(materials.steel, [0.42, 0.39, -0.04], [0.055, 0.66, 0.018], 0.04));
  root.name = 'Guerrero — figura de escala provisional';
  polishCharacter(
    root,
    'warrior',
    { cloth: materials.cloth, leather: materials.leather, metal: materials.steel, skin: materials.skin },
    arms,
  );
  return {
    root,
    walk(dt: number, speed: number) {
      stride += speed * dt * 2.8;
      gait += (Math.min(1, speed / 3) - gait) * (1 - Math.exp(-14 * dt));
      const swing = Math.sin(stride) * gait;
      legs[0].rotation.x = swing * 0.62;
      legs[1].rotation.x = -swing * 0.62;
      arms[0].rotation.x = -swing * 0.36;
      arms[1].rotation.x = swing * 0.24;
      arms[1].rotation.y = 0;
      arms[1].rotation.z = 0;
      arms[0].rotation.z = 0;
    },
    combatPose(age: number | undefined, flash: number, spinning = false, impetus = 0) {
      if (age !== undefined) {
        const progress = THREE.MathUtils.clamp((age - basic.windup) / basic.active, 0, 1);
        const recovery =
          age > basic.windup + basic.active
            ? 1 -
              THREE.MathUtils.clamp(
                (age - basic.windup - basic.active) / (basic.duration - basic.windup - basic.active),
                0,
                1,
              )
            : 1;
        arms[1].rotation.x = 1.3 * recovery;
        arms[1].rotation.z = (-1 + progress * 2) * recovery;
        arms[1].rotation.y = (-0.6 + progress * 1.2) * recovery;
        arms[0].rotation.x = -0.6 * recovery;
      }
      if (spinning) {
        arms[1].rotation.set(1.5, 0, -0.65);
        arms[0].rotation.x = 0.6;
        arms[0].rotation.z = 0.25;
      }
      Object.values(materials).forEach(material => {
        material.emissive.set(flash > 0 ? 0xac3927 : 0x7c6e42);
        material.emissiveIntensity = flash > 0 ? flash : impetus * 0.03;
      });
    },
    resetPose() {
      stride = 0;
      gait = 0;
      [...legs, ...arms].forEach(joint => {
        joint.rotation.x = 0;
      });
    },
    fade(opacity: number) {
      Object.values(materials).forEach(material => {
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.depthWrite = opacity > 0.5;
      });
    },
  };
}
