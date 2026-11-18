import * as THREE from 'three';
import type { Essence } from '../domain/progression.ts';

export function createEssenceView(scene: THREE.Scene) {
  const root = new THREE.Group(); scene.add(root);
  const geometry = new THREE.OctahedronGeometry(.17);
  const material = new THREE.MeshStandardMaterial({ color: 0xa6ead5, emissive: 0x59bca1, emissiveIntensity: 1.5, roughness: .35 });
  const coreMaterial = new THREE.MeshStandardMaterial({ color: 0xffd895, emissive: 0xc88933, emissiveIntensity: 1.5, roughness: .3 });
  const drops = new Map<number, THREE.Mesh>();
  return {
    update(essence: readonly Essence[], time: number) {
      const ids = new Set(essence.map(drop => drop.id));
      for (const [id, mesh] of drops) if (!ids.has(id)) { root.remove(mesh); drops.delete(id); }
      for (const drop of essence) {
        let mesh = drops.get(drop.id);
        if (!mesh) { mesh = new THREE.Mesh(geometry, drop.core ? coreMaterial : material); mesh.scale.setScalar(drop.core ? 2 : 1); root.add(mesh); drops.set(drop.id, mesh); }
        mesh.position.set(drop.x, .38 + Math.sin(time * 3 + drop.id) * .08, drop.z);
        mesh.rotation.y = time + drop.id;
      }
    },
    reset() { root.clear(); drops.clear(); },
    dispose() { this.reset(); scene.remove(root); geometry.dispose(); material.dispose(); coreMaterial.dispose(); },
  };
}
