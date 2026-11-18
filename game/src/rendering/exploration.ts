import * as THREE from 'three';
import type { WorldObject } from '../domain/exploration.ts';
import { CAPTURE } from '../content/activities.ts';
import type { Capture } from '../domain/capture.ts';

export function createExplorationView(scene: THREE.Scene) {
  const root = new THREE.Group();
  scene.add(root);
  const wood = new THREE.MeshStandardMaterial({ color: 0x634732, roughness: 0.88 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x494c4a, metalness: 0.6, roughness: 0.65 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x929b91, roughness: 0.95 });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xffd878,
    emissive: 0xa96c18,
    emissiveIntensity: 0.65,
    metalness: 0.65,
    roughness: 0.4,
  });
  const water = new THREE.MeshStandardMaterial({
    color: 0x83d8d7,
    emissive: 0x276461,
    emissiveIntensity: 0.55,
    roughness: 0.25,
  });
  const cloth = new THREE.MeshStandardMaterial({ color: 0xe2d7b2, roughness: 1 });
  const red = new THREE.MeshStandardMaterial({ color: 0xac4940, roughness: 0.8 });
  const ringGeo = new THREE.RingGeometry(0.78, 0.85, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const coinGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.045, 12);
  const geometries = new Set<THREE.BufferGeometry>([ringGeo, coinGeo]);
  type ObjectView = {
    root: THREE.Group;
    lid?: THREE.Group;
    water?: THREE.Mesh;
    ring?: THREE.Mesh;
    flag?: THREE.Mesh;
    progress?: THREE.Mesh;
  };
  const instances = new Map<number, ObjectView>();
  function mesh(
    group: THREE.Group,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) {
    geometries.add(geometry);
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    group.add(part);
    return part;
  }
  // Shared primitives keep dropped coins cheap and make cleanup independent of reward rules.
  const box = new THREE.BoxGeometry(1, 1, 1),
    basin = new THREE.CylinderGeometry(0.7, 0.6, 0.28, 16);
  const rim = new THREE.TorusGeometry(0.64, 0.1, 6, 20),
    surface = new THREE.CircleGeometry(0.56, 20);
  const merchantHead = new THREE.SphereGeometry(0.22, 10, 8),
    merchantHood = new THREE.ConeGeometry(0.3, 0.4, 8);
  geometries.add(merchantHead);
  geometries.add(merchantHood);
  const captureRing = new THREE.RingGeometry(CAPTURE.radius - 0.12, CAPTURE.radius, 64);
  captureRing.rotateX(-Math.PI / 2);
  const captureProgress = new THREE.RingGeometry(CAPTURE.radius - 0.33, CAPTURE.radius - 0.18, 64);
  captureProgress.rotateX(-Math.PI / 2);
  geometries.add(captureRing);
  geometries.add(captureProgress);
  geometries.add(box);
  geometries.add(basin);
  geometries.add(rim);
  geometries.add(surface);
  function block(group: THREE.Group, material: THREE.Material, position: number[], scale: number[]) {
    const part = mesh(group, box, material, ...(position as [number, number, number]));
    part.scale.set(...(scale as [number, number, number]));
    return part;
  }
  function create(object: WorldObject) {
    const group = new THREE.Group();
    group.position.set(object.x, 0, object.z);
    root.add(group);
    const view: ObjectView = { root: group };
    if (object.kind === 'chest') {
      block(group, wood, [0, 0.23, 0], [1.05, 0.46, 0.7]);
      for (const x of [-0.36, 0.36]) block(group, iron, [x, 0.24, 0], [0.09, 0.48, 0.74]);
      block(group, gold, [0, 0.31, 0.37], [0.16, 0.19, 0.06]);
      const lid = new THREE.Group();
      lid.position.set(0, 0.48, -0.35);
      group.add(lid);
      block(lid, wood, [0, 0.07, 0.35], [1.1, 0.14, 0.76]);
      view.lid = lid;
    } else if (object.kind === 'fountain') {
      mesh(group, basin, stone, 0, 0.14, 0);
      const edge = mesh(group, rim, stone, 0, 0.32, 0);
      edge.rotation.x = -Math.PI / 2;
      view.water = mesh(group, surface, water, 0, 0.29, 0);
      view.water.rotation.x = -Math.PI / 2;
      block(group, stone, [0, 0.53, -0.43], [0.23, 0.78, 0.23]);
    } else if (object.kind === 'coins') {
      for (let i = 0; i < 3; i++) mesh(group, coinGeo, gold, (i - 1) * 0.15, 0.08 + i * 0.04, (i % 2) * 0.13);
    } else if (object.kind === 'shop') {
      block(group, wood, [0, 0.72, 0.3], [1.9, 0.15, 0.85]);
      for (const x of [-0.8, 0.8]) {
        block(group, wood, [x, 0.35, 0.3], [0.12, 0.7, 0.12]);
        block(group, wood, [x, 1.2, -0.3], [0.1, 2.4, 0.1]);
      }
      block(group, cloth, [0, 2.4, -0.2], [2.4, 0.12, 1.8]);
      block(group, red, [0, 2.22, 0.72], [2.3, 0.32, 0.06]);
      block(group, cloth, [0, 1.1, -0.58], [0.52, 0.92, 0.38]);
      mesh(group, merchantHead, wood, 0, 1.75, -0.58);
      mesh(group, merchantHood, cloth, 0, 1.99, -0.58);
      mesh(group, coinGeo, gold, 0.5, 0.84, 0.3);
    } else if (object.kind === 'capture') {
      block(group, wood, [0, 1.4, 0], [0.12, 2.8, 0.12]);
      view.flag = block(group, red, [0.55, 2.2, 0], [1.1, 0.7, 0.06]);
      view.ring = mesh(group, captureRing, red, 0, 0.018, 0);
      view.progress = mesh(group, captureProgress, gold, 0, 0.022, 0);
    } else {
      block(group, cloth, [0, 0.2, 0], [0.48, 0.3, 0.36]);
      block(group, red, [0, 0.36, 0], [0.1, 0.02, 0.28]);
      block(group, red, [0, 0.36, 0], [0.32, 0.02, 0.1]);
    }
    if (object.kind === 'chest' || object.kind === 'fountain' || object.kind === 'shop')
      view.ring = mesh(group, ringGeo, object.kind === 'fountain' ? water : gold, 0, 0.025, 0);
    return view;
  }
  return {
    update(objects: readonly WorldObject[], focusId: number | undefined, time: number, capture?: Capture) {
      const ids = new Set(objects.map(o => o.id));
      for (const [id, view] of instances)
        if (!ids.has(id)) {
          root.remove(view.root);
          instances.delete(id);
        }
      for (const object of objects) {
        let view = instances.get(object.id);
        if (!view) {
          view = create(object);
          instances.set(object.id, view);
        }
        if (view.lid) view.lid.rotation.x = object.status === 'used' ? -1.45 : 0;
        if (view.water) view.water.visible = object.status === 'available';
        if (view.ring) {
          view.ring.visible = object.status === 'available';
          view.ring.scale.setScalar(object.id === focusId ? 1.1 + Math.sin(time * 4) * 0.06 : 1);
        }
        if (view.flag) view.flag.material = object.status === 'used' ? water : object.status === 'closed' ? stone : red;
        if (view.progress) {
          view.progress.visible = object.status !== 'closed';
          const fraction =
            object.status === 'used' ? 1 : capture?.point?.id === object.id ? capture.progress / CAPTURE.duration : 0;
          captureProgress.setDrawRange(0, Math.floor(fraction * 64) * 6);
        }
        if (object.kind === 'coins' || object.kind === 'supply')
          view.root.position.y = 0.06 + Math.sin(time * 2 + object.id) * 0.04;
      }
    },
    reset() {
      root.clear();
      instances.clear();
    },
    dispose() {
      this.reset();
      scene.remove(root);
      geometries.forEach(g => g.dispose());
      [wood, iron, stone, gold, water, cloth, red].forEach(m => m.dispose());
    },
  };
}
