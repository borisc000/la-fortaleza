import * as THREE from 'three';
import type { Projectile } from '../domain/projectiles.ts';
export function createProjectileView(scene: THREE.Scene) {
  const root = new THREE.Group();
  scene.add(root);
  const geometry = new THREE.BoxGeometry(0.09, 0.09, 0.65),
    material = new THREE.MeshBasicMaterial({ color: 0x9fdded });
  const meshes = new Map<number, THREE.Mesh>();
  return {
    update(projectiles: readonly Projectile[], alpha: number) {
      const active = new Set(projectiles.map(p => p.id));
      for (const [id, mesh] of meshes)
        if (!active.has(id)) {
          root.remove(mesh);
          meshes.delete(id);
        }
      for (const p of projectiles) {
        let mesh = meshes.get(p.id);
        if (!mesh) {
          mesh = new THREE.Mesh(geometry, material);
          root.add(mesh);
          meshes.set(p.id, mesh);
        }
        mesh.position.set(
          THREE.MathUtils.lerp(p.previous.x, p.x, alpha),
          0.95,
          THREE.MathUtils.lerp(p.previous.z, p.z, alpha),
        );
        mesh.rotation.y = Math.atan2(p.vx, p.vz);
      }
    },
    reset() {
      root.clear();
      meshes.clear();
    },
    dispose() {
      this.reset();
      scene.remove(root);
      geometry.dispose();
      material.dispose();
    },
  };
}
