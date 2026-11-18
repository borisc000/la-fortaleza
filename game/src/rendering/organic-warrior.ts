import { organicVolume as tailoredVolume, organicShell } from './organic-geometry.ts';
import { polishCharacter } from './character-polish.ts';
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
    steel: new THREE.MeshStandardMaterial({ color: 0x77817d, roughness: 0.64, metalness: 0.72 }),
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
  function shaped(g: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(g, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }
  shaped(
    tailoredVolume(
      [
        [0.9, 0.195, 0.13],
        [1.02, 0.19, 0.13],
        [1.14, 0.23, 0.15],
        [1.35, 0.275, 0.16],
        [1.46, 0.255, 0.13],
        [1.52, 0.105, 0.085],
      ],
      0.015,
    ),
    materials.mail,
  );
  shaped(
    tailoredVolume(
      [
        [0.96, 0.198, 0.137],
        [1.06, 0.2, 0.14],
        [1.22, 0.247, 0.16],
        [1.38, 0.26, 0.16],
        [1.44, 0.22, 0.125],
      ],
      0.012,
    ),
    materials.leather,
  );
  shaped(
    tailoredVolume([
      [0.905, 0.207, 0.145],
      [0.92, 0.214, 0.15],
      [0.965, 0.214, 0.15],
      [0.978, 0.205, 0.145],
    ]),
    materials.leather,
  );
  part(materials.steel, [0, 0.94, -0.155], [0.07, 0.07, 0.015]);
  for (const sign of [-1, 1]) {
    const legStart = root.children.length;
    shaped(
      tailoredVolume(
        [
          [0.45, 0.075, 0.083],
          [0.5, 0.085, 0.091],
          [0.59, 0.09, 0.1],
          [0.73, 0.117, 0.13],
          [0.86, 0.123, 0.13],
          [0.96, 0.1, 0.1],
        ],
        0.025,
      ),
      materials.cloth,
      sign * 0.125,
    );
    shaped(
      tailoredVolume(
        [
          [0.12, 0.068, 0.08],
          [0.2, 0.068, 0.08],
          [0.31, 0.092, 0.112],
          [0.38, 0.09, 0.104],
          [0.46, 0.076, 0.086],
        ],
        0.01,
      ),
      materials.leather,
      sign * 0.135,
    );
    ellipsoid(materials.steel, [sign * 0.14, 0.49, -0.035], [0.1, 0.105, 0.085]);
    shaped(organicShell(0.082, 0.25, 0.103, 0.85), materials.steel, sign * 0.135, 0.29, 0.012);
    ellipsoid(materials.leather, [sign * 0.14, 0.075, -0.055], [0.1, 0.075, 0.18]);
    legs.push(joint(legStart, sign * 0.13, 0.92));
    const armStart = root.children.length;
    shaped(
      tailoredVolume(
        [
          [1.07, 0.06, 0.07],
          [1.14, 0.068, 0.073],
          [1.26, 0.095, 0.102],
          [1.38, 0.107, 0.11],
          [1.46, 0.078, 0.085],
        ],
        0.025,
      ),
      materials.mail,
      sign * 0.3,
    );
    shaped(
      tailoredVolume([
        [1.35, 0.082, 0.11],
        [1.4, 0.12, 0.14],
        [1.46, 0.126, 0.14],
        [1.51, 0.085, 0.1],
        [1.525, 0.025, 0.035],
      ]),
      materials.steel,
      sign * 0.3,
    );
    shaped(
      tailoredVolume([
        [0.86, 0.053, 0.06],
        [0.96, 0.068, 0.07],
        [1.09, 0.075, 0.079],
        [1.15, 0.062, 0.065],
      ]),
      materials.leather,
      sign * 0.35,
      0,
      -0.025,
    );
    shaped(organicShell(0.078, 0.19, 0.083, 1.1), materials.steel, sign * 0.35, 1.015, -0.025);
    ellipsoid(materials.leather, [sign * 0.37, 0.85, -0.035], [0.075, 0.095, 0.07]);
    arms.push(joint(armStart, sign * 0.29, 1.43));
    const rear = shaped(organicShell(0.23, 0.38, 0.16, 0.55, 0.014), materials.cloth, 0, 0.76, 0);
    rear.rotation.y = Math.PI + sign * 0.57;
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
  // Replace the accessory pass's flat breastplates and tabard with tailored surfaces.
  for (const object of [...root.children]) {
    if (!(object instanceof THREE.Mesh) || !(object.geometry instanceof THREE.BoxGeometry)) continue;
    if (
      object.position.x === 0 &&
      (Math.abs(object.position.z + 0.19) < 0.001 ||
        Math.abs(object.position.z + 0.165) < 0.001 ||
        Math.abs(object.position.y - 0.76) < 0.001)
    ) {
      root.remove(object);
      object.geometry.dispose();
    }
  }
  // Supple leather chest follows the ribs. Only the upper cuirass is rigid steel.
  shaped(organicShell(0.25, 0.38, 0.172, 1.05, 0, 0.22), materials.leather, 0, 1.22, 0);
  shaped(organicShell(0.262, 0.19, 0.18, 1.08, 0, 0.08), materials.steel, 0, 1.37, 0);
  shaped(organicShell(0.208, 0.11, 0.153, 1.1, 0, 0.04), materials.steel, 0, 1.1, 0);
  for (const sign of [-1, 1]) {
    const tail = shaped(organicShell(0.225, 0.36, 0.17, 0.51, 0.018), materials.cloth, 0, 0.765, 0);
    tail.rotation.y = sign * 0.56;
  }
  // Remove the old horizontal shoulder bars; articulated rounded caps remain.
  for (const arm of arms)
    for (const o of [...arm.children])
      if (
        o instanceof THREE.Mesh &&
        o.geometry instanceof THREE.BoxGeometry &&
        o.material === materials.steel &&
        o.position.y > -0.14 &&
        o.position.y < 0.01
      ) {
        arm.remove(o);
        o.geometry.dispose();
      }
  root.name = 'Guerrero — superficies orgánicas';

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
        joint.rotation.set(0, 0, 0);
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
