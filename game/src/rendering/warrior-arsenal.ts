import * as THREE from 'three';
import { WarriorArsenal } from '../domain/classes/warrior-arsenal.ts';
import type { Combat } from '../domain/combat.ts';
import { ELEMENTS } from '../content/elements.ts';

/** Bounded procedural shapes; presentation never deals damage. */
export function createWarriorArsenalView(scene: THREE.Scene) {
  const root = new THREE.Group(); root.name = 'Arsenal del Guerrero'; scene.add(root);
  const metal = new THREE.MeshStandardMaterial({ color: 0xaebbbf, metalness: .75, roughness: .4 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xefd9a4, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide });
  const wood = new THREE.MeshStandardMaterial({ color: 0x533a28 });
  const ring = new THREE.RingGeometry(.94, 1, 40), blade = new THREE.BoxGeometry(.12, .14, 1.5), head = new THREE.BoxGeometry(.65, .4, .4), pole = new THREE.CylinderGeometry(.045, .045, 2.3, 6), flag = new THREE.PlaneGeometry(.9, .65);
  const objects = new Map<string, THREE.Group>();
  function make(kind: string) {
    const group = new THREE.Group(); group.userData.kind = kind;
    if (kind === 'banner') {
      const shaft = new THREE.Mesh(pole, wood); shaft.position.y = 1.15; group.add(shaft);
      const cloth = new THREE.Mesh(flag, glow); cloth.position.set(.4, 1.9, 0); group.add(cloth);
      const circle = new THREE.Mesh(ring, glow); circle.rotation.x = -Math.PI / 2; circle.position.y = .06; group.add(circle);
    } else if (kind === 'hammer') {
      const circle = new THREE.Mesh(ring, glow); circle.rotation.x = -Math.PI / 2; group.add(circle);
      const block = new THREE.Mesh(head, metal); block.position.y = .8; group.add(block);
    } else {
      const shaft = new THREE.Mesh(blade, kind === 'chain' || kind === 'wave' ? glow : metal); group.add(shaft);
      if (kind === 'axe') { const edge = new THREE.Mesh(head, metal); edge.position.z = -.4; group.add(edge); }
    }
    root.add(group); return group;
  }
  return {
    update(combat: Combat) {
      const kit = combat.heroKit;
      glow.color.set(combat.loadout.element ? ELEMENTS[combat.loadout.element].color : 0xefd9a4);
      const active = new Set<string>();
      if (kit instanceof WarriorArsenal) for (const item of kit.presentation.slice(0, 64)) {
        active.add(item.id); let mesh = objects.get(item.id);
        if (!mesh) { mesh = make(item.kind); objects.set(item.id, mesh); }
        mesh.position.set(item.x, item.kind === 'banner' ? 0 : .55, item.z); mesh.rotation.y = item.yaw;
        if (item.kind === 'chain') mesh.scale.set(.35, .35, item.radius * 2 / 1.5);
        else if (item.kind === 'wave') mesh.scale.set(2, .5, .35);
        else if (item.kind === 'banner') mesh.children[2].scale.setScalar(item.radius);
        else if (item.kind === 'hammer') mesh.children[0].scale.setScalar(item.radius);
      }
      for (const [id, mesh] of objects) if (!active.has(id)) { root.remove(mesh); objects.delete(id); }
    },
    reset() { root.clear(); objects.clear(); },
    dispose() { this.reset(); scene.remove(root); for (const g of [ring, blade, head, pole, flag]) g.dispose(); for (const m of [metal, glow, wood]) m.dispose(); },
  };
}
