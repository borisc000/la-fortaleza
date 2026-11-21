import * as THREE from 'three';
import { actionStats, isGroundAttack } from '../content/enemies.ts';
import type { Attack } from '../domain/combat.ts';

function outerDangerGeometry() {
  const geometry = new THREE.RingGeometry(1, 5.5, 64, 8);
  const vertices = geometry.getAttribute('position');
  const colors = new Float32Array(vertices.count * 4);
  for (let i = 0; i < vertices.count; i++) {
    const radius = Math.hypot(vertices.getX(i), vertices.getY(i));
    colors.set([1, 1, 1, Math.max(0, (5.5 - radius) / 4.5) ** 2], i * 4);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  return geometry;
}

export function createCastellanWarning(parent: THREE.Group) {
  const root = new THREE.Group();
  root.name = 'Aviso global del Castellano';
  root.visible = false;
  parent.add(root);
  const make = (geometry: THREE.BufferGeometry, height: number, vertexColors = false) => {
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexColors,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = height;
    mesh.renderOrder = 13;
    root.add(mesh);
    return mesh;
  };
  const floor = make(new THREE.CircleGeometry(1, 64), 0.045);
  const rim = make(new THREE.RingGeometry(0.94, 1, 64), 0.055);
  const outerDanger = make(outerDangerGeometry(), 0.046, true);
  outerDanger.material.color.setHex(0xb74776);
  const anchor = new THREE.Vector3();

  return {
    update(attack?: Attack) {
      root.visible = false;
      if (!attack?.groundTarget || !isGroundAttack(attack.action)) return;
      const data = actionStats('boss', attack.action);
      if (attack.age >= data.windup + data.active) return;

      const refuge = attack.action === 'edict';
      const impact = attack.age >= data.windup;
      const progress = impact ? 1 - (attack.age - data.windup) / data.active : attack.age / data.windup;
      root.visible = true;
      anchor.set(attack.groundTarget.x, 0, attack.groundTarget.z);
      root.position.copy(parent.worldToLocal(anchor));
      root.scale.setScalar(data.range);
      floor.material.color.setHex(refuge ? 0x45dee3 : 0xf45149);
      floor.material.opacity = refuge ? 0.1 + 0.12 * progress : 0.23 + 0.35 * progress;
      rim.material.color.setHex(refuge ? 0x8cfff3 : 0xffae75);
      rim.material.opacity = 0.65 + 0.35 * progress;
      outerDanger.visible = refuge;
      outerDanger.material.opacity = 0.24 + 0.34 * progress;
    },
    dispose() {
      for (const mesh of [floor, rim, outerDanger]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    },
  };
}
