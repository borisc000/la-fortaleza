import * as THREE from 'three';
import type { ClassId } from '../content/class-definition.ts';
import type { CombatEvent } from '../domain/combat.ts';

function sliver(x: number, y: number, dx: number, dy: number, width: number) {
  const length = Math.hypot(dx, dy);
  const crossX = (-dy * width) / length;
  const crossY = (dx * width) / length;
  const shape = new THREE.Shape();
  shape.moveTo(x, y);
  shape.lineTo(x + dx * 0.55 + crossX, y + dy * 0.55 + crossY);
  shape.lineTo(x + dx, y + dy);
  shape.lineTo(x + dx * 0.55 - crossX, y + dy * 0.55 - crossY);
  shape.closePath();
  return shape;
}

/** A single brief accent on the first direct hit of the newest basic attack. */
export function createBasicImpact(classId: ClassId) {
  const mage = classId === 'mage';
  const archer = classId === 'archer';
  const source = mage ? 'spell' : archer ? 'arrow' : 'basic';
  const geometry = mage
    ? new THREE.RingGeometry(0.25, 0.37, 6)
    : new THREE.ShapeGeometry(
        archer
          ? [sliver(-0.34, 0.21, 0.27, -0.28, 0.06), sliver(0.34, 0.21, -0.27, -0.28, 0.06)]
          : [sliver(-0.38, -0.4, 0.72, 0.9, 0.085), sliver(0.04, -0.24, 0.28, 0.34, 0.05)],
      );
  const material = new THREE.MeshBasicMaterial({
    color: mage ? 0xd3b1ff : archer ? 0xd6ffae : 0xffe6bd,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  // Offset in billboard space so the light contact stays readable over fire and pale armor.
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x292335, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(geometry, shadowMaterial);
  shadow.position.set(0.055, -0.065, -0.01);
  shadow.renderOrder = 1;
  mesh.renderOrder = 2;
  mesh.add(shadow);
  const contact = new THREE.Vector3();
  let newest = -1;
  let started = -Infinity;
  return {
    mesh,
    hit(event: CombatEvent, time: number) {
      if (
        event.source !== source ||
        event.target <= 0 ||
        event.amount <= 0 ||
        event.attackId === undefined ||
        event.attackId <= newest
      )
        return;
      newest = event.attackId;
      started = time;
      contact.set(event.x, 1.45, event.z);
    },
    update(camera: THREE.Camera, time: number) {
      const t = (time - started) / 0.19;
      mesh.visible = t >= 0 && t < 1;
      if (!mesh.visible) return;
      mesh.quaternion.copy(camera.quaternion);
      mesh.position.copy(contact);
      mesh.translateZ(0.48);
      mesh.scale.setScalar(archer ? 1.3 - 0.55 * t : 0.8 + 0.65 * t);
      material.opacity = 1 - t * t;
      shadowMaterial.opacity = material.opacity * 0.85;
    },
    reset() {
      started = -Infinity;
      newest = -1;
      mesh.visible = false;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      shadowMaterial.dispose();
    },
  };
}
