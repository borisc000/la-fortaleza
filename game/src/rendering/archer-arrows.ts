import * as THREE from 'three';
import type { Combat } from '../domain/combat.ts';
import { ARCHER_KIT as K } from '../content/classes/archer.ts';
import type { Element } from '../content/elements.ts';
import { ELEMENTS } from '../content/elements.ts';

export function createArcherArrowView(scene: THREE.Scene) {
  const root = new THREE.Group(); scene.add(root);
  const shaftGeometry = new THREE.CylinderGeometry(.014, .014, .7, 6); shaftGeometry.rotateX(Math.PI / 2);
  const tipGeometry = new THREE.ConeGeometry(.05, .15, 4); tipGeometry.rotateX(-Math.PI / 2);
  const featherGeometry = new THREE.BoxGeometry(.1, .018, .12);
  const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0xb49b71 });
  const materials = { earth: new THREE.MeshBasicMaterial({ color: ELEMENTS.earth.color }), air: new THREE.MeshBasicMaterial({ color: ELEMENTS.air.color }), physical: new THREE.MeshBasicMaterial({ color: 0xd4d9cc }), fire: new THREE.MeshBasicMaterial({ color: ELEMENTS.fire.color }), water: new THREE.MeshBasicMaterial({ color: ELEMENTS.water.color }) };
  function arrow() {
    const group = new THREE.Group(); const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial), tip = new THREE.Mesh(tipGeometry, materials.physical), feathers = new THREE.Mesh(featherGeometry, materials.physical);
    tip.position.z = -.4; feathers.position.z = .28; group.add(shaft, tip, feathers); root.add(group); return group;
  }
  function tint(group: THREE.Group, element?: Element) { group.children[1].scale.set(element === 'earth' ? 1.8 : 1, 1, 1); group.children[2].scale.set(1, 1, element === 'air' ? 2.2 : 1); (group.children[1] as THREE.Mesh).material = materials[element ?? 'physical']; (group.children[2] as THREE.Mesh).material = materials[element ?? 'physical']; }
  const flying = new Map<number, THREE.Group>();
  const rain = Array.from({ length: 16 }, () => { const a = arrow(); a.visible = false; return a; });
  const ringGeometry = new THREE.RingGeometry(.96, 1, 56);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xcdd2b5, side: THREE.DoubleSide, transparent: true, opacity: .5, depthWrite: false });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial); ring.rotation.x = -Math.PI / 2; ring.visible = false; root.add(ring);
  return {
    update(combat: Combat, alpha: number) {
      const active = new Set<number>();
      if (combat.definition.id === 'archer') for (const p of combat.heroKit.state.projectiles ?? []) {
        active.add(p.id); let view = flying.get(p.id); if (!view) { view = arrow(); flying.set(p.id, view); }
        tint(view, p.loadout.element); view.position.set(THREE.MathUtils.lerp(p.previous.x, p.x, alpha), 1.2, THREE.MathUtils.lerp(p.previous.z, p.z, alpha));
        view.rotation.y = Math.atan2(-p.vx, -p.vz); view.scale.setScalar(p.empowered ? 1.2 : 1);
      }
      for (const [id, view] of flying) if (!active.has(id)) { root.remove(view); flying.delete(id); }
      const area = combat.definition.id === 'archer' ? combat.heroKit.state.area : undefined;
      ring.visible = !!area;
      if (area?.center) {
        ring.position.set(area.center.x, .08, area.center.z); ring.scale.setScalar(area.radius);
        ringMaterial.color.set(area.loadout.element ? ELEMENTS[area.loadout.element].color : 0xcdd2b5);
        ringMaterial.opacity = area.age < K.rain.windup ? .25 + .35 * area.age / K.rain.windup : .55;
      }
      for (let i = 0; i < rain.length; i++) {
        const view = rain[i];
        view.visible = !!area?.center && area.age >= K.rain.windup - K.rain.interval && area.age <= K.rain.windup + (area.maxPulses - 1) * K.rain.interval;
        if (!view.visible || !area?.center) continue;
        const nextPulse = Math.max(0, Math.ceil((area.age - K.rain.windup - 1e-8) / K.rain.interval));
        const fall = THREE.MathUtils.clamp(1 - (K.rain.windup + nextPulse * K.rain.interval - area.age) / K.rain.interval, 0, 1);
        const angle = i * 2.39996, distance = area.radius * Math.sqrt((i + .5) / rain.length) * .9;
        view.position.set(area.center.x + Math.sin(angle) * distance, .2 + (1 - fall) * 4.5, area.center.z + Math.cos(angle) * distance);
        view.rotation.set(-Math.PI / 2, 0, .1); tint(view, area.loadout.element);
      }
    },
    reset() { for (const view of flying.values()) root.remove(view); flying.clear(); ring.visible = false; rain.forEach(view => { view.visible = false; }); },
    dispose() { this.reset(); scene.remove(root); shaftGeometry.dispose(); tipGeometry.dispose(); featherGeometry.dispose(); shaftMaterial.dispose(); Object.values(materials).forEach(m => m.dispose()); ringGeometry.dispose(); ringMaterial.dispose(); },
  };
}
