import * as THREE from 'three';
import type { ClassDefinition } from '../content/class-definition.ts';
import {
  STONE_HEART_BEACON,
  STONE_HEART_COLUMNS,
  STONE_HEART_GATE,
  STONE_HEART_SOLIDS,
  STONE_HEART_WALLS,
  stoneBounds,
} from '../content/stone-heart.ts';
import type { Assets } from './assets.ts';
import type { Obstacle } from './collision.ts';
import { buildBarrel, buildShield, createPieceMaterials, pieceGroup } from './exterior-pieces.ts';
import type { Kit, PieceMaterials } from './exterior-pieces.ts';
import { createHeroView } from './hero.ts';
import { disposeSceneMeshes } from './scene-meshes.ts';

function stoneArch(
  kit: Kit,
  material: THREE.Material,
  x: number,
  z: number,
  spring: number,
  span: number,
  rise: number,
  rotation = 0,
  cameraSolids?: Obstacle[],
) {
  const half = span / 2;
  const outer = 0.48;
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI + 0.009;
    const b = ((i + 1) / 13) * Math.PI - 0.009;
    const shape = new THREE.Shape();
    shape.moveTo(Math.cos(a) * half, Math.sin(a) * rise);
    shape.lineTo(Math.cos(a) * (half + outer), Math.sin(a) * (rise + outer));
    shape.lineTo(Math.cos(b) * (half + outer), Math.sin(b) * (rise + outer));
    shape.lineTo(Math.cos(b) * half, Math.sin(b) * rise);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.82, bevelEnabled: false });
    geometry.translate(0, 0, -0.41);
    if (cameraSolids) {
      geometry.computeBoundingBox();
      const transform = new THREE.Matrix4().makeRotationY(rotation).setPosition(x, spring, z);
      const { min, max } = geometry.boundingBox!.clone().applyMatrix4(transform);
      cameraSolids.push({ min, max });
    }
    kit.add(kit.metreUV(geometry), material, [x, spring, z], rotation);
  }
}

function dressArmory(kit: Kit, materials: PieceMaterials) {
  const { wood, iron, banner, trim } = materials;
  for (const z of [5.4, 9, 18.8]) {
    kit.box(-34.9, 0.86, z, 1.05, 0.2, 2.7, wood);
    kit.box(-35.2, 0.4, z - 0.95, 0.22, 0.8, 0.22, wood);
    kit.box(-35.2, 0.4, z + 0.95, 0.22, 0.8, 0.22, wood);
  }
  for (const z of [10.2, 11.8, 13.4, 15, 16.6]) {
    kit.box(-35.0, 1.45, z, 0.08, 1.16, 0.11, iron);
    kit.box(-35.0, 1.12, z, 0.08, 0.09, 0.38, iron);
    kit.box(-35.0, 0.99, z, 0.1, 0.22, 0.08, wood);
  }
  for (const z of [16.8, 18.1, 19.4]) buildBarrel(kit, materials, -34.1, z);
  kit.box(-35.12, 3.05, 12.5, 0.07, 2.1, 1.6, banner);
  kit.box(-35.1, 4.11, 12.5, 0.16, 0.12, 2.0, iron);
  kit.box(-29.3, 1.02, 20.12, 3.2, 0.11, 1.05, wood);
  kit.box(-29.3, 0.49, 20.12, 2.8, 0.98, 0.85, trim);
}

function dressHall(
  kit: Kit,
  materials: PieceMaterials,
  cloth: THREE.Material,
  brass: THREE.Material,
  cameraSolids: Obstacle[],
) {
  const { iron, stone, trim, slate } = materials;
  // The central runner and lit aisle are visible from the approach and leave side lanes around the columns.
  kit.box(0, 0.018, -29.7, 3.8, 0.036, 22.8, cloth);
  for (const x of [-1.84, 1.84]) kit.box(x, 0.041, -29.7, 0.095, 0.009, 22.7, brass);
  for (const z of [-19, -23, -27, -31, -35, -39]) {
    kit.box(0, 0.043, z, 0.32, 0.006, 0.32, brass, false, Math.PI / 4);
  }
  for (const x of [-11.8, 11.8]) {
    kit.box(x, 3.85, -42.12, 2.0, 3.6, 0.07, cloth);
    kit.box(x, 5.67, -42.04, 2.45, 0.12, 0.15, brass);
    kit.box(x, 3.27, -42.06, 0.12, 1.37, 0.09, brass);
  }
  for (const z of [-21.5, -29, -36.5]) stoneArch(kit, trim, 0, z, 5.7, 15.5, 3.2, 0, cameraSolids);
  // A closed stairwell gives the hint of the lower levels at the edge of the room.
  kit.box(10.35, 2.15, -41.99, 3.7, 4.25, 0.2, slate);
  stoneArch(kit, trim, 10.35, -41.77, 2.45, 3.65, 1.6);
  for (const x of [9.1, 9.72, 10.34, 10.96, 11.58]) {
    kit.box(x, 1.56, -41.64, 0.1, 3.04, 0.12, iron);
  }
  kit.box(10.35, 0.11, -40.92, 4.55, 0.22, 1.32, stone);
}

export function createStoneHeartWorld(assets: Assets, definition: ClassDefinition) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x65717d);
  scene.fog = new THREE.Fog(0x53606b, 32, 100);
  scene.environment = assets.environment ?? null;
  scene.environmentIntensity = 0.6;

  const materials = createPieceMaterials(assets, [new THREE.Vector4(), new THREE.Vector4()]);
  const { stone, trim, wood, iron, dark } = materials;
  stone.color.set(0xb3b7b8);
  trim.color.set(0xc0b7a4);
  const yardPaving = assets.materials.cobblestone_floor_04.clone();
  yardPaving.color.set(0x95988e);
  yardPaving.normalScale.set(0.48, 0.48);
  const wornPaving = yardPaving.clone();
  wornPaving.color.set(0xb7ad95);
  const hallPaving = yardPaving.clone();
  hallPaving.color.set(0x77757b);
  const cloth = new THREE.MeshStandardMaterial({ color: 0x642e31, roughness: 0.94 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x9f7137, roughness: 0.59, metalness: 0.3 });

  const movementSolids = STONE_HEART_SOLIDS;
  const columnCaps: Obstacle[] = STONE_HEART_COLUMNS.map(column => ({
    min: { x: column.x - 1.02, y: 6.85, z: column.z - 0.99 },
    max: { x: column.x + 1.02, y: 8.43, z: column.z + 0.99 },
  }));
  const obstacles = [...movementSolids, ...columnCaps];

  const architecture = pieceGroup(kit => {
    kit.box(-6.2, -0.52, -3.2, 85, 0.68, 96, dark);
    kit.box(0, -0.15, 9.3, 46, 0.28, 33, yardPaving);
    kit.box(0, -0.15, 31.9, 11.7, 0.28, 12.2, yardPaving);
    kit.box(-29.8, -0.15, 12.4, 13.6, 0.28, 18.4, wood);
    kit.box(0, -0.15, -11.2, 11.7, 0.28, 8, yardPaving);
    kit.box(0, -0.15, -29.6, 31.6, 0.28, 28.8, hallPaving);
    kit.box(0, -0.016, 9.3, 6.5, 0.019, 33, wornPaving);
    for (const x of [-3.29, 3.29]) kit.box(x, -0.012, 9.3, 0.16, 0.025, 33, trim);

    for (const wall of STONE_HEART_WALLS) {
      const { x, z, width, height, depth } = wall;
      kit.box(x, height / 2, z, width, height, depth, stone);
      kit.box(x, height - 0.2, z, width + 0.28, 0.42, depth + 0.28, trim);
      const alongX = width > depth;
      const length = alongX ? width : depth;
      if (length < 12) continue;
      for (let d = -(length / 2) + 0.9; d < length / 2 - 0.4; d += 2.35)
        kit.box(
          x + (alongX ? d : 0),
          height + 0.4,
          z + (alongX ? 0 : d),
          alongX ? 1.08 : depth,
          0.82,
          alongX ? depth : 1.08,
          stone,
        );
    }
    for (const column of STONE_HEART_COLUMNS) {
      kit.box(column.x, column.height / 2, column.z, column.width, column.height, column.depth, trim);
      kit.box(column.x, 0.2, column.z, 2, 0.4, 2, trim);
      kit.box(column.x, 7.34, column.z, 2.05, 0.4, 1.95, stone);
    }

    stoneArch(kit, trim, 0, 25.8, 3.84, 10, 2.8, 0, obstacles);
    stoneArch(kit, trim, 0, -7.2, 3.77, 9.6, 2.95, 0, obstacles);
    stoneArch(kit, trim, 0, -15.2, 3.62, 9.6, 3.0, 0, obstacles);
    stoneArch(kit, trim, -23, 12.6, 3.28, 8.9, 2.45, Math.PI / 2, obstacles);
    // Crossed blades on a low-relief panel mark the optional west armory.
    kit.box(-21.92, 3.1, 6.7, 0.18, 1.25, 1.32, dark);
    kit.cylinderBetween(
      new THREE.Vector3(-21.79, 2.69, 6.24),
      new THREE.Vector3(-21.79, 3.57, 7.09),
      0.043,
      0.016,
      brass,
    );
    kit.cylinderBetween(
      new THREE.Vector3(-21.79, 2.69, 7.13),
      new THREE.Vector3(-21.79, 3.57, 6.29),
      0.043,
      0.016,
      brass,
    );
    for (const x of [-10, 10]) {
      kit.box(x, 3.8, -6.13, 2.0, 3.5, 0.07, cloth);
      kit.box(x, 5.59, -6.02, 2.45, 0.13, 0.13, brass);
      kit.box(x, 3.7, -6.07, 0.14, 1.42, 0.08, brass);
      kit.box(x, 3.9, -6.06, 0.93, 0.12, 0.08, brass);
    }
    for (const z of [5, 2.4, 11.3, 15.5, 18.3]) {
      kit.box(20.9, 0.5, z, 0.79, 1, 0.95, wood);
      buildShield(kit, materials, 20.25, z, 0.9, -Math.PI / 2);
    }
    for (const z of [23.2, 20.5, 17.8, 15]) {
      kit.box(0, 0.012, z, 5.5, 0.024, 0.065, trim);
    }
    dressArmory(kit, materials);
    dressHall(kit, materials, cloth, brass, obstacles);
    const beaconZ = STONE_HEART_BEACON.z - 1.5;
    kit.box(0, 0.12, beaconZ, 2.5, 0.24, 2.1, trim);
    kit.drum(0, 0.46, beaconZ, 0.55, 0.78, 0.68, trim);
    kit.add(new THREE.CylinderGeometry(0.87, 0.53, 0.32, 12), brass, [0, 0.92, beaconZ]);
    kit.add(new THREE.CylinderGeometry(0.68, 0.7, 0.045, 12), iron, [0, 1.09, beaconZ]);
    for (const [x, z] of [
      [-6.1, -5.2],
      [6.1, -5.2],
      [-12.9, -23],
      [12.9, -24],
      [-32, 5.4],
      [-33.5, 18.3],
    ]) {
      kit.add(new THREE.CylinderGeometry(0.18, 0.3, 2.25, 8), iron, [x, 1.12, z]);
      kit.add(new THREE.CylinderGeometry(0.36, 0.16, 0.24, 10), iron, [x, 2.29, z]);
    }
  }, stone);
  architecture.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.receiveShadow = true;
      object.castShadow = true;
    }
  });
  scene.add(architecture);
  const closedObstacles = [...obstacles, stoneBounds(STONE_HEART_GATE)];

  const { z, width, height } = STONE_HEART_GATE;
  const gate = pieceGroup(kit => {
    for (let x = -4.68; x <= 4.7; x += 0.52) {
      kit.box(x, height / 2, z, 0.105, height, 0.16, iron);
      const tip = new THREE.ConeGeometry(0.13, 0.38, 4).rotateZ(Math.PI);
      kit.add(tip, iron, [x, 0.21, z]);
    }
    for (const y of [0.91, 2.56, 4.35, 5.42]) kit.box(0, y, z, width, 0.16, 0.21, iron);
  }, iron);
  scene.add(gate);

  const sun = new THREE.DirectionalLight(0xd1deff, 2.12);
  sun.position.set(-25, 37, 19);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -30;
  sun.shadow.camera.right = sun.shadow.camera.top = 30;
  sun.shadow.camera.far = 120;
  sun.shadow.normalBias = 0.04;
  sun.shadow.bias = -0.00012;
  scene.add(sun, sun.target, new THREE.HemisphereLight(0xc8d6ee, 0x635650, 1.35));
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa49 });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffecc5 });
  const flames: { group: THREE.Group; light: THREE.PointLight; power: number }[] = [];
  function fire(x: number, y: number, z: number, size: number, power: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(size * 0.37, size, 7), flameMat);
    flame.position.y = size * 0.39;
    flame.rotation.z = 0.12;
    const core = new THREE.Mesh(new THREE.ConeGeometry(size * 0.21, size * 0.63, 6), coreMat);
    core.position.y = size * 0.22;
    const light = new THREE.PointLight(0xff9c4c, power, size > 1 ? 15 : 9, 2);
    light.position.y = size * 0.55;
    group.add(flame, core, light);
    scene.add(group);
    const source = { group, light, power };
    flames.push(source);
    return source;
  }
  for (const [x, z] of [
    [-6.1, -5.2],
    [6.1, -5.2],
    [-12.9, -23],
    [12.9, -24],
    [-32, 5.4],
    [-33.5, 18.3],
  ]) {
    fire(x, 2.39, z, 0.65, 29);
  }
  const beacon = fire(0, 1.1, STONE_HEART_BEACON.z - 1.5, 1.75, 67);
  beacon.group.visible = false;
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xe4bb66,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.22, 1.33, 48).rotateX(-Math.PI / 2), haloMat);
  halo.position.set(STONE_HEART_BEACON.x, 0.066, STONE_HEART_BEACON.z);
  halo.visible = false;
  scene.add(halo);

  let hero = createHeroView(definition);
  scene.add(hero.root);
  let open = false;
  let openedAt = 0;
  return {
    scene,
    movementSolids,
    get obstacles() {
      return open ? obstacles : closedObstacles;
    },
    get hero() {
      return hero;
    },
    replaceHero(next: ClassDefinition) {
      scene.remove(hero.root);
      disposeSceneMeshes(hero.root);
      hero = createHeroView(next);
      scene.add(hero.root);
    },
    update(time: number) {
      const x = Math.round(hero.root.position.x * 8) / 8;
      const z = Math.round(hero.root.position.z * 8) / 8;
      sun.position.set(x - 26, 37, z + 19);
      sun.target.position.set(x, 0, z);
      gate.position.y = open ? 5.8 * THREE.MathUtils.smoothstep(time - openedAt, 0, 0.72) : 0;
      for (const [i, flame] of flames.entries()) {
        flame.group.scale.y = 1 + Math.sin(time * 7 + i * 2) * 0.13;
        flame.light.intensity = flame.power * (1 + Math.sin(time * 9 + i) * 0.11);
      }
      haloMat.opacity = 0.71 + Math.sin(time * 4) * 0.13;
    },
    setMission(gateOpen: boolean, signal: boolean, lit: boolean, time: number) {
      if (gateOpen && !open) openedAt = time;
      open = gateOpen;
      halo.visible = signal;
      beacon.group.visible = lit;
    },
    dispose() {
      disposeSceneMeshes(scene);
      sun.shadow.map?.dispose();
    },
  };
}
