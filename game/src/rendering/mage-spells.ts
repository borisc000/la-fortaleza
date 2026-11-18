import * as THREE from 'three';
import type { Combat } from '../domain/combat.ts';
import { ELEMENTS } from '../content/elements.ts';
import { MAGE_KIT } from '../content/classes/mage.ts';

export function createMageSpellView(scene: THREE.Scene) {
  const root = new THREE.Group(); scene.add(root);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const rockGeometry = new THREE.DodecahedronGeometry(1), windGeometry = new THREE.TorusGeometry(.8, .16, 5, 12, Math.PI * 1.6);
  const materials = { earth: new THREE.MeshBasicMaterial({ color: ELEMENTS.earth.color }), air: new THREE.MeshBasicMaterial({ color: ELEMENTS.air.color }), fire: new THREE.MeshBasicMaterial({ color: ELEMENTS.fire.color }), water: new THREE.MeshBasicMaterial({ color: ELEMENTS.water.color }) };
  const bolts = new Map<number, THREE.Mesh>();
  const ringGeometry = new THREE.RingGeometry(.94, 1, 64);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(ringGeometry, material); ring.rotation.x = -Math.PI / 2; ring.visible = false; root.add(ring);
  const inner = new THREE.Mesh(ringGeometry, material); inner.rotation.x = -Math.PI / 2; inner.visible = false; root.add(inner);
  const vortex = new THREE.Group(); vortex.name = 'mage-vortex'; root.add(vortex); vortex.visible = false;
  for (let i = 0; i < 3; i++) { const arc = new THREE.Mesh(windGeometry, materials.air); arc.rotation.x = -Math.PI / 2; arc.position.y = .3 + i * .4; vortex.add(arc); }
  return {
    update(combat: Combat, alpha: number) {
      const active = new Set<number>();
      for (const p of combat.definition.id === 'mage' ? combat.heroKit.state.projectiles ?? [] : []) {
        if ((p.delay ?? 0) > 0) continue;
        active.add(p.id); let bolt = bolts.get(p.id);
        if (!bolt) { bolt = new THREE.Mesh(p.loadout.element === 'earth' ? rockGeometry : p.loadout.element === 'air' ? windGeometry : geometry, materials[p.loadout.element ?? 'fire']); bolts.set(p.id, bolt); root.add(bolt); }
        bolt.position.set(THREE.MathUtils.lerp(p.previous.x, p.x, alpha), 1.15, THREE.MathUtils.lerp(p.previous.z, p.z, alpha));
        bolt.scale.setScalar(p.empowered ? .3 : p.echo ? .11 : .16); bolt.rotation.set(p.age * 4, p.age * 7, 0);
      }
      for (const [id, bolt] of bolts) if (!active.has(id)) { root.remove(bolt); bolts.delete(id); }
      const area = combat.definition.id === 'mage' ? combat.heroKit.state.area : undefined;
      vortex.visible = area?.loadout.element === 'air';
      if (vortex.visible && area?.center) { vortex.position.set(area.center.x, 0, area.center.z); vortex.rotation.y = -area.age * 5; vortex.children.forEach((arc, i) => arc.scale.setScalar(area.radius * (1 - i * .2))); }
      ring.visible = inner.visible = combat.definition.id === 'mage' && !!area;
      if (ring.visible && area?.center) {
        material.color.set(ELEMENTS[area.loadout.element!].color);
        material.opacity = area.age < MAGE_KIT.cataclysm.windup ? .3 + .4 * area.age / MAGE_KIT.cataclysm.windup : .65;
        ring.position.set(area.center.x, .09, area.center.z); ring.scale.setScalar(area.radius);
        inner.position.copy(ring.position); inner.position.y = .1;
        inner.scale.setScalar(area.radius * (area.age < MAGE_KIT.cataclysm.windup ? Math.max(.03, area.age / MAGE_KIT.cataclysm.windup) : .2 + .8 * ((area.age - MAGE_KIT.cataclysm.windup) % MAGE_KIT.cataclysm.interval) / MAGE_KIT.cataclysm.interval));
      }
    },
    reset() { for (const b of bolts.values()) root.remove(b); bolts.clear(); vortex.visible = false; ring.visible = inner.visible = false; },
    dispose() { this.reset(); scene.remove(root); geometry.dispose(); rockGeometry.dispose(); windGeometry.dispose(); ringGeometry.dispose(); material.dispose(); Object.values(materials).forEach(m => m.dispose()); },
  };
}
