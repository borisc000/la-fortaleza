import * as THREE from 'three';
import type { WorldObject } from '../domain/exploration.ts';
import { CAPTURE } from '../content/activities.ts';
import type { Capture } from '../domain/capture.ts';

export function createExplorationView(scene: THREE.Scene) {
  const root = new THREE.Group(); scene.add(root);
  const wood = new THREE.MeshStandardMaterial({ color: 0x634732, roughness: .88 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x494c4a, metalness: .6, roughness: .65 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x929b91, roughness: .95 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffd878, emissive: 0xa96c18, emissiveIntensity: .65, metalness: .65, roughness: .4 });
  const water = new THREE.MeshStandardMaterial({ color: 0x83d8d7, emissive: 0x276461, emissiveIntensity: .55, roughness: .25 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0xe2d7b2, roughness: 1 });
  const red = new THREE.MeshStandardMaterial({ color: 0xac4940, roughness: .8 });
  const ringGeo = new THREE.RingGeometry(.78, .85, 24); ringGeo.rotateX(-Math.PI / 2);
  const coinGeo = new THREE.CylinderGeometry(.17, .17, .045, 12);
  const geometries = new Set<THREE.BufferGeometry>([ringGeo, coinGeo]);
  type ObjectView = { root: THREE.Group; lid?: THREE.Group; water?: THREE.Mesh; ring?: THREE.Mesh; flag?: THREE.Mesh; progress?: THREE.Mesh };
  const instances = new Map<number, ObjectView>();
  function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
    geometries.add(geometry); const part = new THREE.Mesh(geometry, material); part.position.set(x, y, z); part.castShadow = true; part.receiveShadow = true; group.add(part); return part;
  }
  // Shared primitives keep dropped coins cheap and make cleanup independent of reward rules.
  const box = new THREE.BoxGeometry(1, 1, 1), basin = new THREE.CylinderGeometry(.7, .6, .28, 16);
  const rim = new THREE.TorusGeometry(.64, .10, 6, 20), surface = new THREE.CircleGeometry(.56, 20);
  const merchantHead = new THREE.SphereGeometry(.22, 10, 8), merchantHood = new THREE.ConeGeometry(.3, .4, 8);
  geometries.add(merchantHead); geometries.add(merchantHood);
  const captureRing = new THREE.RingGeometry(CAPTURE.radius - .12, CAPTURE.radius, 64); captureRing.rotateX(-Math.PI / 2);
  const captureProgress = new THREE.RingGeometry(CAPTURE.radius - .33, CAPTURE.radius - .18, 64); captureProgress.rotateX(-Math.PI / 2);
  geometries.add(captureRing); geometries.add(captureProgress);
  geometries.add(box); geometries.add(basin); geometries.add(rim); geometries.add(surface);
  function block(group: THREE.Group, material: THREE.Material, position: number[], scale: number[]) { const part = mesh(group, box, material, ...position as [number, number, number]); part.scale.set(...scale as [number, number, number]); return part; }
  function create(object: WorldObject) {
    const group = new THREE.Group(); group.position.set(object.x, 0, object.z); root.add(group);
    const view: ObjectView = { root: group };
    if (object.kind === 'chest') {
      block(group, wood, [0, .23, 0], [1.05, .46, .7]);
      for (const x of [-.36, .36]) block(group, iron, [x, .24, 0], [.09, .48, .74]);
      block(group, gold, [0, .31, .37], [.16, .19, .06]);
      const lid = new THREE.Group(); lid.position.set(0, .48, -.35); group.add(lid);
      block(lid, wood, [0, .07, .35], [1.1, .14, .76]); view.lid = lid;
    } else if (object.kind === 'fountain') {
      mesh(group, basin, stone, 0, .14, 0);
      const edge = mesh(group, rim, stone, 0, .32, 0); edge.rotation.x = -Math.PI / 2;
      view.water = mesh(group, surface, water, 0, .29, 0); view.water.rotation.x = -Math.PI / 2;
      block(group, stone, [0, .53, -.43], [.23, .78, .23]);
    } else if (object.kind === 'coins') {
      for (let i = 0; i < 3; i++) mesh(group, coinGeo, gold, (i - 1) * .15, .08 + i * .04, i % 2 * .13);
    } else if (object.kind === 'shop') {
      block(group, wood, [0, .72, .3], [1.9, .15, .85]);
      for (const x of [-.8, .8]) { block(group, wood, [x, .35, .3], [.12, .7, .12]); block(group, wood, [x, 1.2, -.3], [.1, 2.4, .1]); }
      block(group, cloth, [0, 2.4, -.2], [2.4, .12, 1.8]);
      block(group, red, [0, 2.22, .72], [2.3, .32, .06]);
      block(group, cloth, [0, 1.1, -.58], [.52, .92, .38]);
      mesh(group, merchantHead, wood, 0, 1.75, -.58);
      mesh(group, merchantHood, cloth, 0, 1.99, -.58);
      mesh(group, coinGeo, gold, .5, .84, .3);
    } else if (object.kind === 'capture') {
      block(group, wood, [0, 1.4, 0], [.12, 2.8, .12]);
      view.flag = block(group, red, [.55, 2.2, 0], [1.1, .7, .06]);
      view.ring = mesh(group, captureRing, red, 0, .018, 0);
      view.progress = mesh(group, captureProgress, gold, 0, .022, 0);
    } else {
      block(group, cloth, [0, .20, 0], [.48, .30, .36]);
      block(group, red, [0, .36, 0], [.10, .02, .28]); block(group, red, [0, .36, 0], [.32, .02, .10]);
    }
    if (object.kind === 'chest' || object.kind === 'fountain' || object.kind === 'shop') view.ring = mesh(group, ringGeo, object.kind === 'fountain' ? water : gold, 0, .025, 0);
    return view;
  }
  return {
    update(objects: readonly WorldObject[], focusId: number | undefined, time: number, capture?: Capture) {
      const ids = new Set(objects.map(o => o.id));
      for (const [id, view] of instances) if (!ids.has(id)) { root.remove(view.root); instances.delete(id); }
      for (const object of objects) {
        let view = instances.get(object.id); if (!view) { view = create(object); instances.set(object.id, view); }
        if (view.lid) view.lid.rotation.x = object.status === 'used' ? -1.45 : 0;
        if (view.water) view.water.visible = object.status === 'available';
        if (view.ring) { view.ring.visible = object.status === 'available'; view.ring.scale.setScalar(object.id === focusId ? 1.1 + Math.sin(time * 4) * .06 : 1); }
        if (view.flag) view.flag.material = object.status === 'used' ? water : object.status === 'closed' ? stone : red;
        if (view.progress) {
          view.progress.visible = object.status !== 'closed';
          const fraction = object.status === 'used' ? 1 : capture?.point?.id === object.id ? capture.progress / CAPTURE.duration : 0;
          captureProgress.setDrawRange(0, Math.floor(fraction * 64) * 6);
        }
        if (object.kind === 'coins' || object.kind === 'supply') view.root.position.y = .06 + Math.sin(time * 2 + object.id) * .04;
      }
    },
    reset() { root.clear(); instances.clear(); },
    dispose() { this.reset(); scene.remove(root); geometries.forEach(g => g.dispose()); [wood, iron, stone, gold, water, cloth, red].forEach(m => m.dispose()); },
  };
}
