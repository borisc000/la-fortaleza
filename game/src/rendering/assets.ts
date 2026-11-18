import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

export const MATERIAL_IDS = ['castle_wall_slates', 'cobblestone_floor_04', 'brown_mud_02', 'weathered_brown_planks'] as const;
export type MaterialId = typeof MATERIAL_IDS[number];
export type Assets = { materials: Record<MaterialId, THREE.MeshStandardMaterial>; environment?: THREE.DataTexture; failures: string[]; dispose(): void };
// fetch owns the timeout; object URLs keep Three's decoding local and release immediately.
async function loadFile(file: string, hdr: boolean): Promise<THREE.Texture> {
  const response = await fetch(`${import.meta.env.BASE_URL}assets/${file}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try { return hdr ? await new HDRLoader().loadAsync(url) : await new THREE.TextureLoader().loadAsync(url); }
  finally { URL.revokeObjectURL(url); }
}
export async function loadAssets(anisotropy: number, progress: (done: number) => void): Promise<Assets> {
  let done = 0;
  const textures: THREE.Texture[] = [], failures: string[] = [];
  const materials = {} as Assets['materials'];
  async function get(file: string, hdr = false) {
    try {
      const texture = await loadFile(file, hdr); textures.push(texture);
      if (!hdr) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = Math.min(4, anisotropy); }
      return texture;
    } catch { failures.push(file); return undefined; }
    finally { progress(++done); }
  }
  const jobs = MATERIAL_IDS.map(async (id) => {
    const [map, normalMap, roughnessMap] = await Promise.all(['Diffuse', 'nor_gl', 'rough'].map(channel => get(`${id}-${channel}.jpg`)));
    if (map) map.colorSpace = THREE.SRGBColorSpace;
    materials[id] = new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, color: map ? 0xffffff : 0x686b5c, roughness: 0.94, normalScale: new THREE.Vector2(0.65, 0.65) });
  });
  const environmentPromise = get('overcast.hdr', true);
  await Promise.all(jobs);
  const environment = await environmentPromise as THREE.DataTexture | undefined;
  if (environment) environment.mapping = THREE.EquirectangularReflectionMapping;
  return { materials, environment, failures, dispose() { textures.forEach(t => t.dispose()); Object.values(materials).forEach(m => m.dispose()); } };
}
