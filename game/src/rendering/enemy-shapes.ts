import * as THREE from 'three';

export type EnemySlot = 'body' | 'leg0' | 'leg1' | 'arm0' | 'arm1';
export type EnemyMaterial = 'bone' | 'iron' | 'cloth' | 'dark' | 'glow';
export type EnemyPartBuilder = (
  slot: EnemySlot,
  material: EnemyMaterial,
  geometry: THREE.BufferGeometry,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  rx?: number,
  rz?: number,
  ry?: number,
) => void;

/** Centered unit plate with a silhouette and a rim that catch separate highlights. */
export function beveledBox() {
  const outline = new THREE.Shape();
  outline.moveTo(-0.37, -0.37);
  outline.lineTo(0.37, -0.37);
  outline.lineTo(0.37, 0.37);
  outline.lineTo(-0.37, 0.37);
  outline.closePath();
  return new THREE.ExtrudeGeometry(outline, {
    depth: 0.74,
    bevelThickness: 0.13,
    bevelSize: 0.13,
    bevelSegments: 1,
  }).translate(0, 0, -0.37);
}

/** Vertex shading keeps highlights and grime in the existing material batches. */
export function shade(geometry: THREE.BufferGeometry, brightness = 1, variation = 0.14) {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const height = (positions.getY(i) - min.y) / Math.max(max.y - min.y, 0.0001);
    const tint = brightness * (1 + (height * 2 - 1) * variation);
    colors.fill(tint, i * 3, i * 3 + 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}
