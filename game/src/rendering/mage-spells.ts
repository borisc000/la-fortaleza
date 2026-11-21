import * as THREE from 'three';
import type { Combat } from '../domain/combat.ts';
import { ELEMENTS } from '../content/elements.ts';
import { MAGE_KIT } from '../content/classes/mage.ts';

export function createMageSpellView(scene: THREE.Scene) {
  const root = new THREE.Group();
  scene.add(root);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const rockGeometry = new THREE.DodecahedronGeometry(1),
    windGeometry = new THREE.TorusGeometry(0.8, 0.16, 5, 12, Math.PI * 1.6);
  const materials = {
    earth: new THREE.MeshBasicMaterial({ color: ELEMENTS.earth.color }),
    air: new THREE.MeshBasicMaterial({ color: ELEMENTS.air.color }),
    fire: new THREE.MeshBasicMaterial({ color: ELEMENTS.fire.color }),
    water: new THREE.MeshBasicMaterial({ color: ELEMENTS.water.color }),
  };
  const needle = new THREE.OctahedronGeometry(1);
  const coreGeo = new THREE.OctahedronGeometry(0.56);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffdf });
  const comet = new THREE.ConeGeometry(0.65, 2.7, 8);
  comet.rotateX(-Math.PI / 2);
  const halo = new THREE.TorusGeometry(1.3, 0.13, 6, 24);
  const arcaneLight = new THREE.MeshBasicMaterial({ color: 0xcbabff });
  const bolts = new Map<number, THREE.Mesh>();
  const ringGeometry = new THREE.RingGeometry(0.972, 1, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const markers = Array.from({ length: 2 }, (_, i) => {
    const ring = new THREE.Mesh(ringGeometry, material);
    ring.rotation.x = -Math.PI / 2;
    const inner = ring.clone();
    const vortex = new THREE.Group();
    vortex.name = i === 0 ? 'mage-vortex' : 'mage-vortex-secondary';
    for (let j = 0; j < 3; j++) {
      const arc = new THREE.Mesh(windGeometry, materials.air);
      arc.rotation.x = -Math.PI / 2;
      arc.position.y = 0.3 + j * 0.4;
      vortex.add(arc);
    }
    ring.visible = inner.visible = vortex.visible = false;
    root.add(ring, inner, vortex);
    return { ring, inner, vortex };
  });
  return {
    update(combat: Combat, alpha: number) {
      const active = new Set<number>();
      for (const p of combat.definition.id === 'mage' ? (combat.heroKit.state.projectiles ?? []) : []) {
        if ((p.delay ?? 0) > 0) continue;
        active.add(p.id);
        let bolt = bolts.get(p.id);
        if (!bolt) {
          bolt = new THREE.Mesh(
            p.abilityId === 'arcane-lances'
              ? needle
              : p.loadout.element === 'earth'
                ? rockGeometry
                : p.loadout.element === 'air'
                  ? windGeometry
                  : geometry,
            materials[p.loadout.element ?? 'fire'],
          );
          const core = new THREE.Mesh(coreGeo, coreMat);
          core.position.y = 0.65;
          bolt.add(core);
          if (p.abilityId === 'orb' && !p.echo) {
            const tail = new THREE.Mesh(comet, arcaneLight);
            tail.position.z = -1.42;
            bolt.add(tail);
            if (p.empowered) bolt.add(new THREE.Mesh(halo, arcaneLight));
          }
          bolts.set(p.id, bolt);
          root.add(bolt);
        }
        bolt.position.set(
          THREE.MathUtils.lerp(p.previous.x, p.x, alpha),
          1.15,
          THREE.MathUtils.lerp(p.previous.z, p.z, alpha),
        );
        bolt.scale.setScalar(p.empowered ? 0.3 : p.echo ? 0.11 : 0.16);
        if (p.abilityId === 'arcane-lances') {
          bolt.scale.set(0.13, 0.13, 1.18);
          bolt.rotation.set(0, Math.atan2(p.vx, p.vz), 0);
        } else if (p.abilityId === 'orb' && !p.echo) {
          bolt.rotation.y = Math.atan2(p.vx, p.vz);
          bolt.scale.setScalar(p.empowered ? 0.36 : 0.23);
          bolt.children[0].position.set(0, 0.22, 0.68);
          if (p.empowered) bolt.children[2].rotation.set(0.52, p.age * 7, 0);
        } else {
          bolt.rotation.set(p.age * 4, p.age * 7, 0);
          bolt.children[0].scale.setScalar(p.empowered ? 1.4 + Math.sin(p.age * 25) * 0.24 : 0.9);
        }
      }
      for (const [id, bolt] of bolts)
        if (!active.has(id)) {
          root.remove(bolt);
          bolts.delete(id);
        }
      const area = combat.definition.id === 'mage' ? combat.heroKit.state.area : undefined;
      for (const [i, { ring, inner, vortex }] of markers.entries()) {
        const footprint = area?.fractures?.[i];
        const center = area?.fractures ? footprint : i === 0 ? area?.center : undefined;
        ring.visible = inner.visible = !!center;
        vortex.visible = !!center && area?.loadout.element === 'air';
        if (!center || !area) continue;
        const radius = footprint?.radius ?? area.radius;
        material.color.set(area.loadout.element ? ELEMENTS[area.loadout.element].color : 0xffffff);
        const preparing = area.age < MAGE_KIT.cataclysm.windup;
        const phase = preparing
          ? area.age / MAGE_KIT.cataclysm.windup
          : ((area.age - MAGE_KIT.cataclysm.windup) % MAGE_KIT.cataclysm.interval) / MAGE_KIT.cataclysm.interval;
        material.opacity = preparing ? 0.28 + 0.25 * phase : 0.46;
        ring.position.set(center.x, 0.09, center.z);
        ring.scale.setScalar(radius);
        inner.position.set(center.x, 0.1, center.z);
        inner.scale.setScalar(radius * (preparing ? Math.max(0.03, phase) : 0.2 + 0.8 * phase));
        if (vortex.visible) {
          vortex.position.set(center.x, 0, center.z);
          vortex.rotation.y = -area.age * 5;
          vortex.children.forEach((arc, j) => arc.scale.setScalar(radius * (1 - j * 0.2)));
        }
      }
    },
    reset() {
      for (const b of bolts.values()) root.remove(b);
      bolts.clear();
      for (const { ring, inner, vortex } of markers) ring.visible = inner.visible = vortex.visible = false;
    },
    dispose() {
      this.reset();
      scene.remove(root);
      geometry.dispose();
      needle.dispose();
      comet.dispose();
      halo.dispose();
      arcaneLight.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      rockGeometry.dispose();
      windGeometry.dispose();
      ringGeometry.dispose();
      material.dispose();
      Object.values(materials).forEach(m => m.dispose());
    },
  };
}
