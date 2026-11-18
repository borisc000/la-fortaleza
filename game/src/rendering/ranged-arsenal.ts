import * as THREE from 'three';
import { RangedArsenal } from '../domain/classes/ranged-arsenal.ts';
import type { Combat } from '../domain/combat.ts';
import { ELEMENTS } from '../content/elements.ts';

/** Projectiles retain their class renderer; this view owns persistent zones and constructs. */
export function createRangedArsenalView(scene: THREE.Scene) {
  const root = new THREE.Group(); root.name = 'Repertorio a distancia'; scene.add(root);
  const material = new THREE.MeshBasicMaterial({ color: 0xd8d5ba, transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9ba8ab, metalness: .6, roughness: .4 });
  const ring = new THREE.RingGeometry(.94, 1, 48), orb = new THREE.IcosahedronGeometry(.22, 1), beam = new THREE.BoxGeometry(1, .12, 1), stake = new THREE.ConeGeometry(.12, .9, 5), mirror = new THREE.TorusGeometry(.45, .05, 6, 24);
  const objects = new Map<string, THREE.Group>();
  return {
    update(combat: Combat) {
      const active = new Set<string>(), kit = combat.heroKit;
      material.color.set(combat.loadout.element ? ELEMENTS[combat.loadout.element].color : 0xd8d5ba);
      if (kit instanceof RangedArsenal) for (const item of kit.presentation.slice(0, 64)) {
        active.add(item.id); let group = objects.get(item.id);
        if (!group) {
          group = new THREE.Group(); const shape = new THREE.Mesh(item.kind === 'orb' ? orb : item.kind === 'beam' ? beam : item.kind === 'stake' ? stake : item.kind === 'mirror' ? mirror : ring, item.kind === 'stake' ? metal : material);
          if (['zone', 'trap', 'beacon'].includes(item.kind)) shape.rotation.x = -Math.PI / 2;
          group.add(shape);
          if (item.kind === 'trap') for (let j = 0; j < 5; j++) { const spike = new THREE.Mesh(stake, metal); spike.scale.setScalar(.45); spike.position.set(Math.sin(j * 1.256) * .55, .15, Math.cos(j * 1.256) * .55); group.add(spike); }
          if (item.kind === 'beacon') { const marker = new THREE.Mesh(mirror, material); marker.position.y = 1.3; group.add(marker); }
          root.add(group); objects.set(item.id, group);
        }
        group.position.set(item.x, item.kind === 'orb' || item.kind === 'mirror' ? 1 : item.kind === 'beam' ? .65 : item.kind === 'stake' ? .45 : .08, item.z); group.rotation.y = item.yaw;
        if (['zone', 'trap', 'beacon'].includes(item.kind)) group.children[0].scale.setScalar(item.radius);
        if (item.kind === 'beam') group.children[0].scale.set(item.width ?? .4, 1, item.radius);
      }
      for (const [id, group] of objects) if (!active.has(id)) { root.remove(group); objects.delete(id); }
    },
    reset() { root.clear(); objects.clear(); },
    dispose() { this.reset(); scene.remove(root); for (const g of [ring, orb, beam, stake, mirror]) g.dispose(); material.dispose(); metal.dispose(); },
  };
}
