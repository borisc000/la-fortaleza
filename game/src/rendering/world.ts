import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Assets } from './assets.ts';
import type { Obstacle } from './collision.ts';
import { createHeroView } from './hero.ts';
import { WARRIOR } from '../content/classes/warrior.ts';
import type { ClassDefinition } from '../content/class-definition.ts';
import { PLAY_AREA } from '../content/config.ts';
import { EXPEDITION } from '../content/expedition.ts';
import { LANDMARKS } from '../content/map.ts';
import { ROUTES, routeClearance, sectorAt } from '../content/terrain-layout.ts';

export function createWorld(assets: Assets, definition: ClassDefinition = WARRIOR) {
  const scene = new THREE.Scene();
  scene.background = assets.environment ?? new THREE.Color(0x89958f);
  scene.backgroundBlurriness = 0.12;
  scene.backgroundIntensity = 0.5;
  scene.environment = assets.environment ?? null;
  scene.environmentIntensity = 0.6;
  scene.fog = new THREE.FogExp2(0x77837f, 0.0052);
  const obstacles: Obstacle[] = [];
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const stone = assets.materials.castle_wall_slates;
  const mud = assets.materials.brown_mud_02;
  const path = assets.materials.cobblestone_floor_04.clone();
  path.color.set(0xb6b29e);
  const track = assets.materials.brown_mud_02.clone();
  track.color.set(0xe6dac4);
  const clearing = assets.materials.brown_mud_02.clone();
  clearing.color.set(0xe3e4d8);
  const wood = assets.materials.weathered_brown_planks;
  const iron = new THREE.MeshStandardMaterial({ color: 0x323c39, metalness: 0.8, roughness: 0.65 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x18201c, roughness: 1 });
  const grass = new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.DoubleSide, vertexColors: true });
  const distant = new THREE.MeshStandardMaterial({ color: 0x353f41, roughness: 1 });
  const banner = new THREE.MeshStandardMaterial({ color: 0x5b3428, roughness: 1, side: THREE.DoubleSide });
  const trim = stone.clone();
  trim.color.set(0xb7b6a5);
  // Dressing materials. Vertex colours carry the variation, so each stays one draw call.
  const soil = mud.clone();
  soil.vertexColors = true;
  const needles = new THREE.MeshStandardMaterial({ roughness: 1, vertexColors: true, flatShading: true });
  const bark = new THREE.MeshStandardMaterial({ color: 0x3a2e25, roughness: 1 });
  const keepStone = stone.clone();
  keepStone.color.set(0x8f9291);
  const slate = new THREE.MeshStandardMaterial({ color: 0x2b3238, roughness: 0.85, flatShading: true });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffb45e });
  // Separate stream: decoration must never shift the seeded positions of colliding props.
  let decoSeed = 51877;
  function deco() {
    decoSeed = (Math.imul(decoSeed, 1664525) + 1013904223) >>> 0;
    return decoSeed / 4294967296;
  }
  const hash = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  function noise(x: number, z: number) {
    const i = Math.floor(x),
      j = Math.floor(z),
      fx = x - i,
      fz = z - j,
      u = fx * fx * (3 - 2 * fx),
      v = fz * fz * (3 - 2 * fz);
    return (
      (hash(i, j) * (1 - u) + hash(i + 1, j) * u) * (1 - v) + (hash(i, j + 1) * (1 - u) + hash(i + 1, j + 1) * u) * v
    );
  }
  const fbm = (x: number, z: number) =>
    noise(x, z) * 0.6 + noise(x * 2.3 + 17, z * 2.3 + 5) * 0.3 + noise(x * 5.1 + 3, z * 5.1 + 29) * 0.1;
  // Ground height: flat wherever anyone walks or the fortress stands; it only rises beyond the fences.
  function rise(x: number, z: number) {
    const dx = Math.max(PLAY_AREA.minX - x, x - PLAY_AREA.maxX, 0),
      dz = Math.max(z - PLAY_AREA.maxZ, 0);
    const t = Math.min(1, Math.max(0, (Math.hypot(dx, dz) - 8) / 110)),
      s = t * t * (3 - 2 * t);
    return s * (7 + fbm(x * 0.03, z * 0.03) * 12);
  }
  function paint(geometry: THREE.BufferGeometry, color: THREE.Color, gradient = 0) {
    const pos = geometry.getAttribute('position');
    geometry.computeBoundingBox();
    const min = geometry.boundingBox!.min.y,
      span = geometry.boundingBox!.max.y - min || 1,
      colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = 1 - gradient * (1 - (pos.getY(i) - min) / span);
      colors.set([color.r * k, color.g * k, color.b * k], i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }
  function add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: number[],
    rotation = 0,
    collide = false,
  ) {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(position[0], position[1], position[2]),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
      new THREE.Vector3(1, 1, 1),
    );
    geometry.applyMatrix4(matrix);
    if (collide) {
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      obstacles.push({ min: { ...box.min }, max: { ...box.max } });
    }
    const list = batches.get(material) ?? [];
    list.push(geometry);
    batches.set(material, list);
  }
  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material = stone,
    collide = false,
    rotation = 0,
  ) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const uv = geo.getAttribute('uv'),
      normal = geo.getAttribute('normal'),
      pos = geo.getAttribute('position');
    for (let i = 0; i < uv.count; i++) {
      const nx = Math.abs(normal.getX(i)),
        ny = Math.abs(normal.getY(i));
      uv.setXY(
        i,
        (nx > 0.5 ? pos.getZ(i) + z : pos.getX(i) + x) / 2.4,
        (ny > 0.5 ? pos.getZ(i) + z : pos.getY(i) + y) / 2.4,
      );
    }
    add(geo, mat, [x, y, z], rotation, collide);
  }
  function cylinderBetween(
    from: THREE.Vector3,
    to: THREE.Vector3,
    r1: number,
    r2: number,
    material: THREE.Material,
    collide = false,
  ) {
    const delta = to.clone().sub(from);
    const geometry = new THREE.CylinderGeometry(r2, r1, delta.length(), 7);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
    add(geometry, material, from.clone().add(to).multiplyScalar(0.5).toArray());
    if (collide) {
      // Small boxes follow slanted trunks/beams instead of blocking their entire footprint.
      const count = Math.ceil(from.distanceTo(to) / 0.4),
        radius = Math.max(r1, r2);
      for (let i = 0; i < count; i++) {
        const a = from.clone().lerp(to, i / count),
          b = from.clone().lerp(to, (i + 1) / count);
        obstacles.push({
          min: { x: Math.min(a.x, b.x) - radius, y: Math.min(a.y, b.y) - radius, z: Math.min(a.z, b.z) - radius },
          max: { x: Math.max(a.x, b.x) + radius, y: Math.max(a.y, b.y) + radius, z: Math.max(a.z, b.z) + radius },
        });
      }
    }
  }
  // Terrain keeps the playable clearing flat; relief is confined to distant slopes.
  const width = PLAY_AREA.maxX - PLAY_AREA.minX,
    depth = PLAY_AREA.maxZ - PLAY_AREA.minZ;
  const centerX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2,
    centerZ = (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2;
  const terrainMargin = 160; // Covers the camera's exterior view and full distant-hill footprints.
  const ground = new THREE.PlaneGeometry(width + terrainMargin * 2, depth + terrainMargin * 2, 150, 145);
  ground.rotateX(-Math.PI / 2);
  const groundUV = ground.getAttribute('uv');
  for (let i = 0; i < groundUV.count; i++)
    groundUV.setXY(
      i,
      (groundUV.getX(i) * (width + terrainMargin * 2)) / 4,
      (groundUV.getY(i) * (depth + terrainMargin * 2)) / 4,
    );
  // Broad damp, dry and mossy patches break the texture's tiling; outside the fences the land climbs into the hills.
  const groundPos = ground.getAttribute('position'),
    groundColors = new Float32Array(groundPos.count * 3);
  for (let i = 0; i < groundPos.count; i++) {
    const x = groundPos.getX(i) + centerX,
      z = groundPos.getZ(i) + centerZ,
      height = rise(x, z);
    groundPos.setY(i, height);
    const light = 0.62 + fbm(x * 0.035, z * 0.035) * 0.62,
      moss = Math.min(1, Math.max(0, fbm(x * 0.05 + 9, z * 0.05 + 2) - 0.4) * 2.4) * 0.8 + Math.min(0.5, height * 0.06);
    groundColors.set([light * (1 - 0.26 * moss), light * (1 - 0.04 * moss), light * (1 - 0.42 * moss)], i * 3);
  }
  ground.setAttribute('color', new THREE.BufferAttribute(groundColors, 3));
  ground.computeVertexNormals();
  add(ground, soil, [centerX, -0.035, centerZ]);
  function wall(x: number, z: number, width: number, height: number, depth = 2.2) {
    box(x, height / 2, z, width, height, depth, stone, true);
    box(x, 0.45, z, width + 0.35, 0.9, depth + 0.45, trim, true);
    box(x, height - 0.5, z, width + 0.25, 0.23, depth + 0.3, trim);
    for (let n = -width / 2 + 0.55; n < width / 2; n += 1.75)
      box(x + n, height + 0.48, z, 0.95, 0.96, depth + 0.15, stone, true);
    // Shallow pilasters and a corbel course give the long curtain walls a rhythm; too thin to need collision.
    if (width >= 18 && height > 6) {
      for (let n = -width / 2 + 4.5; n < width / 2 - 2; n += 9) {
        box(x + n, height * 0.44, z + depth / 2 + 0.2, 1.2, height * 0.88, 0.45, trim);
        box(x + n, height * 0.9, z + depth / 2 + 0.28, 1.5, 0.3, 0.6, trim);
      }
      for (let n = -width / 2 + 0.6; n < width / 2; n += 1.2)
        box(x + n, height - 0.82, z + depth / 2 + 0.16, 0.4, 0.42, 0.34, trim);
    }
  }
  wall(-14, -18, 30, 7.6);
  wall(22, -18, 30, 7.6);
  wall(-39, -18, 20, 6.8);
  wall(44, -18, 18, 7.1);
  wall(-78, -18, 58, 6.8);
  wall(81, -18, 62, 7.1);
  // Gate: rounded arch with individual stone voussoirs, a solid closed timber door.
  box(4, 2.15, -18.25, 5.9, 4.3, 0.5, wood, true);
  const doorShape = new THREE.Shape();
  doorShape.absarc(0, 0, 2.95, 0, Math.PI, false);
  doorShape.closePath();
  const doorTop = new THREE.ExtrudeGeometry(doorShape, { depth: 0.5, bevelEnabled: false, curveSegments: 16 });
  add(doorTop, wood, [4, 4.3, -18.5], 0, true);
  box(4, 7.3, -18, 6, 0.7, 2.2);
  for (let i = 0; i < 15; i++) {
    const a = ((i + 0.5) * Math.PI) / 15;
    const g = new THREE.BoxGeometry(0.69, 0.65, 2.35);
    g.rotateZ(a - Math.PI / 2);
    add(g, trim, [4 + Math.cos(a) * 3.22, 4.25 + Math.sin(a) * 3.22, -18], 0, true);
  }
  box(0.7, 2.1, -18, 0.6, 4.2, 2.35, trim, true);
  box(7.3, 2.1, -18, 0.6, 4.2, 2.35, trim, true);
  // Gatehouse: a crenellated fighting gallery bridges the two towers above the arch.
  box(4, 8.2, -17.9, 7.3, 1.1, 2.7);
  box(4, 7.56, -16.68, 7.1, 0.28, 0.42, trim);
  for (let n = -3; n <= 3; n += 1.2) box(4 + n, 7.9, -16.5, 0.34, 0.5, 0.36, trim);
  for (let n = -3; n <= 3; n += 1.5) box(4 + n, 9.2, -17.9, 0.9, 0.9, 2.85);
  for (const x of [2.3, 5.7]) box(x, 8.25, -16.53, 0.2, 0.7, 0.03, dark);
  for (const y of [0.65, 2, 3.5]) box(4, y, -17.96, 5.8, 0.15, 0.08, iron);
  box(4, 2.1, -17.91, 0.09, 4.2, 0.08, iron);
  for (const x of [2.9, 5.1]) {
    const ring = new THREE.TorusGeometry(0.16, 0.035, 6, 12);
    add(ring, iron, [x, 2.1, -17.82]);
  }
  function tower(x: number, z: number, height: number, size: number, roof = false, body: THREE.Material = stone) {
    box(x, height / 2, z, size, height, size, body, true);
    // Corbels under the parapet read as a shadow line from the game camera.
    for (let n = -size / 2 + 0.35; n <= size / 2 - 0.3; n += 0.95)
      for (const side of [-1, 1]) {
        box(x + n, height - 0.95, z + side * (size / 2 + 0.2), 0.38, 0.5, 0.4, trim);
        box(x + side * (size / 2 + 0.2), height - 0.95, z + n, 0.4, 0.5, 0.38, trim);
      }
    if (roof) {
      const cone = new THREE.ConeGeometry(size * 0.64, size * 0.95, 4);
      cone.rotateY(Math.PI / 4);
      add(cone, slate, [x, height + 0.65 + size * 0.475, z]);
      box(x, height + 0.65 + size * 0.95 + 0.5, z, 0.09, 1.3, 0.09, iron);
    }
    box(x, 0.65, z, size + 0.8, 1.3, size + 0.8, trim, true);
    box(x, height - 0.5, z, size + 0.5, 0.4, size + 0.5, trim);
    box(x, height, z, size + 0.65, 0.65, size + 0.65, body);
    for (let n = -size / 2; n <= size / 2; n += size / 4) {
      box(x + n, height + 0.8, z + size / 2, 0.85, 1.1, 0.85);
      box(x + n, height + 0.8, z - size / 2, 0.85, 1.1, 0.85);
      if (n > -size / 2 && n < size / 2) {
        box(x - size / 2, height + 0.8, z + n, 0.85, 1.1, 0.85);
        box(x + size / 2, height + 0.8, z + n, 0.85, 1.1, 0.85);
      }
    }
    for (const y of [4.5, 7.3]) {
      box(x, y, z + size / 2 + 0.012, 0.22, 1.4, 0.025, dark);
      box(x, y, z + size / 2 + 0.04, 0.55, 0.13, 0.08, trim);
    }
  }
  tower(-2.4, -19.1, 10, 5.6, true);
  tower(10.4, -19.1, 10, 5.6, true);
  tower(-29, -20, 9, 6.5);
  tower(35, -20, 10.4, 7, true);
  tower(-46, -20, 10.8, 6, true);
  tower(50, -20, 11.4, 6);
  tower(-103, -20, 11, 6);
  tower(107, -20, 12, 6, true);
  // Keep and inner rampart form a layered skyline beyond the inaccessible gate.
  // A cooler stone and lit windows separate it from the curtain wall in front.
  tower(14, -38, 18, 14, true, keepStone);
  tower(3, -39, 14, 6, true, keepStone);
  tower(25, -39, 15, 6, true, keepStone);
  for (const [x, y] of [
    [10.5, 11.5],
    [17.5, 11.5],
    [14, 14.6],
  ]) {
    box(x, y, -30.97, 0.55, 1.6, 0.05, glow);
    box(x, y - 0.95, -30.9, 0.9, 0.16, 0.12, trim);
  }
  for (const x of [3, 25]) box(x, 10.6, -35.97, 0.32, 1.1, 0.05, glow);
  wall(-13, -39, 27, 11);
  for (const x of [-24, -17, -10, 18, 26, 32]) {
    box(x, 2.7, -16.35, 1, 5.4, 1.5, trim, true);
    box(x, 0.4, -15.9, 1.4, 0.8, 2, stone, true);
  }
  for (const x of [-2.4, 10.4]) {
    box(x, 6.4, -16.22, 1, 2.9, 0.04, banner);
    box(x, 6.6, -16.18, 0.12, 1.7, 0.02, trim);
    box(x, 6.8, -16.16, 0.56, 0.12, 0.02, trim);
    box(x, 7.95, -16.1, 1.3, 0.06, 0.1, iron);
  }
  // Ruined roadside buildings leave the centre open for later enemy waves.
  for (const [x, z, width, height] of [
    [-14, -3, 7, 2.2],
    [-18, 1, 2.8, 1.3],
    [-11, -7, 4, 1.1],
    [17, 0, 5, 0.85],
  ]) {
    box(x, height / 2, z, width, height, 0.8, stone, true);
    for (let i = 0; i < Math.ceil(width); i++)
      box(x - width / 2 + i + 0.4, height + 0.15 + Math.sin(i * 7) * 0.12, z, 0.7, 0.35, 0.8);
  }
  box(-17.2, 1.55, -5.4, 0.85, 3.1, 5, stone, true);
  cylinderBetween(new THREE.Vector3(-17, 3, -4), new THREE.Vector3(-12, 0.3, -1), 0.14, 0.14, wood, true);
  box(12.5, 0.6, -9, 1.2, 1.2, 1.2, wood, true, 0.2);
  box(14, 0.4, -8.5, 0.9, 0.8, 1.1, wood, true, -0.18);
  for (const y of [0.2, 0.95]) box(12.5, y, -8.39, 1.25, 0.08, 0.04, iron);
  // A single route graph drives visible ribbons and foliage clearance.
  function trail(points: readonly { x: number; z: number }[], width: number, material: THREE.Material, y: number) {
    const vertices: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    points.forEach(({ x, z }, i) => {
      const before = points[Math.max(0, i - 1)],
        after = points[Math.min(points.length - 1, i + 1)];
      const dx = after.x - before.x,
        dz = after.z - before.z,
        length = Math.hypot(dx, dz) || 1;
      for (const side of [-1, 1]) {
        const px = x + (((dz / length) * width) / 2) * side,
          pz = z - (((dx / length) * width) / 2) * side;
        vertices.push(px, y, pz);
        uvs.push(px / 2.4, pz / 2.4);
      }
      if (i < points.length - 1) {
        const j = i * 2;
        indices.push(j, j + 2, j + 1, j + 1, j + 2, j + 3);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    add(geo, material, [0, 0, 0]);
  }
  function groundPatch(x: number, z: number, radius: number, stretch = 1) {
    const geo = new THREE.CircleGeometry(radius, 28);
    geo.rotateX(-Math.PI / 2);
    geo.scale(stretch, 1, 1);
    const pos = geo.getAttribute('position'),
      uv = geo.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + x) / 4, (pos.getZ(i) + z) / 4);
    add(geo, clearing, [x, -0.018, z]);
  }
  for (const spot of LANDMARKS.slice(1)) groundPatch(spot.x, spot.z, spot.radius);
  groundPatch(EXPEDITION.start.x, EXPEDITION.start.z, 16, 1.15);
  for (const route of ROUTES) {
    trail(route.points, route.width + 1.4, track, -0.009);
    trail(route.points, route.width, route.kind === 'main' ? path : track, route.kind === 'main' ? 0.008 : 0.003);
  }
  trail(
    [
      { x: 4, z: -8 },
      { x: 4, z: -15 },
    ],
    6,
    path,
    0.008,
  );
  function reserved(x: number, z: number, padding = 0) {
    const point = { x, z };
    return (
      routeClearance(point) < padding ||
      LANDMARKS.some(p => Math.hypot(x - p.x, z - p.z) < p.radius + padding) ||
      Math.hypot(x - EXPEDITION.start.x, z - EXPEDITION.start.z) < 16 + padding ||
      Math.hypot(x - EXPEDITION.capture.x, z - EXPEDITION.capture.z) < 8 + padding ||
      Math.hypot(x - EXPEDITION.shop.x, z - EXPEDITION.shop.z) < 4 + padding
    );
  }
  wall(-119, -18, 26, 6.8);
  wall(123, -18, 26, 7.1);
  // Extend only the terminal wall sections; preserve the gate and tower positions.
  wall((PLAY_AREA.minX - 1 - 131) / 2, -18, -131 - (PLAY_AREA.minX - 1), 6.8);
  wall((135 + PLAY_AREA.maxX + 1) / 2, -18, PLAY_AREA.maxX + 1 - 135, 7.1);
  tower(-126, -20, 11, 6, true);
  tower(130, -20, 12, 6);
  // E1.2 blockout: distinct silhouettes sit beside routes and fighting clearings.
  // Camp buildings flank the road, with open exits in every direction.
  for (const [x, z] of [
    [-56, 27],
    [-18, 20],
  ]) {
    for (const dz of [-2, 2]) box(x, 1.3, z + dz, 0.22, 2.6, 0.22, wood, true);
    box(x, 2.6, z, 0.18, 0.18, 4.5, wood);
    const canvas = new THREE.PlaneGeometry(3.8, 4.5);
    canvas.rotateX(-Math.PI / 2);
    canvas.rotateZ(0.25);
    add(canvas, banner, [x + 1.8, 2.1, z]);
  }
  // Roadside ruins: broken walls on one side, not a closed room around the anchor.
  box(-49, 1.7, 67, 1, 3.4, 14, stone, true);
  wall(-46, 75, 7, 2.2, 1);
  tower(43, 10, 7.5, 4.5);
  // Abbey north of the western approach; its roofless footprint does not cut the loop.
  wall(-53, 74, 24, 4.5, 1.2);
  box(-65, 3.4, 83, 1.2, 6.8, 18, stone, true);
  box(-41, 2.5, 80, 1.2, 5, 12, stone, true);
  for (const x of [-60, -47]) box(x, 4.8, 74.7, 2, 2, 0.08, dark);
  // Mill and watchtower stand outside their large combat circles.
  tower(-100, 103, 9, 5, true);
  const sails = new THREE.BoxGeometry(0.35, 13, 0.18);
  sails.rotateZ(0.65);
  add(sails, wood, [-100, 10, 105.7]);
  const crossSails = new THREE.BoxGeometry(13, 0.35, 0.18);
  crossSails.rotateZ(0.65);
  add(crossSails, wood, [-100, 10, 105.7]);
  tower(121, 64, 14, 6, true);
  // Open-ended siege lines create a recognisable western field without corridors.
  for (const [x, z] of [
    [-113, 145],
    [-112, 171],
    [-64, 158],
  ]) {
    if (reserved(x, z, 5)) continue;
    box(x, 0.3, z, 7, 0.6, 0.7, wood, true);
    for (const dx of [-2.5, 0, 2.5]) box(x + dx, 1, z, 0.28, 2, 0.28, wood, true, 0.12);
  }
  // Caravan silhouettes on the southern verge; carts do not add interactive rewards.
  for (const [x, z] of [
    [39, 216],
    [70, 212],
    [111, 201],
  ]) {
    box(x, 0.95, z, 2.4, 0.32, 4.3, wood, true);
    box(x, 1.55, z, 2.5, 0.8, 0.18, wood, true);
    for (const side of [-1, 1])
      for (const dz of [-1.4, 1.4]) {
        const wheel = new THREE.CylinderGeometry(0.68, 0.68, 0.16, 10);
        wheel.rotateZ(Math.PI / 2);
        add(wheel, wood, [x + side * 1.35, 0.68, z + dz], 0, true);
      }
    box(x + 1.1, 2.3, z - 1.5, 0.14, 2.5, 0.14, wood, true);
    box(x + 1.1, 2.9, z - 1.1, 0.05, 1.1, 0.8, banner);
  }
  // Repeatable dressing: seeded, never randomised by frame time.
  let seed = 9173;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const rockGeo = new THREE.IcosahedronGeometry(1, 0),
    rockMesh = new THREE.InstancedMesh(rockGeo, stone, 360);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 360; i++) {
    const x = PLAY_AREA.minX + random() * (PLAY_AREA.maxX - PLAY_AREA.minX),
      z = random() * (PLAY_AREA.maxZ + 14) - 14;
    dummy.position.set(x, 0.04, z);
    dummy.rotation.set(random(), random() * 6, random());
    const s = 0.1 + random() * 0.35;
    dummy.scale.set(s * 1.5, s * 0.65, s);
    if (routeClearance({ x, z }) < 0.5) dummy.scale.setScalar(0);
    dummy.updateMatrix();
    rockMesh.setMatrixAt(i, dummy.matrix);
    const tone = 0.55 + deco() * 0.5;
    rockMesh.setColorAt(i, new THREE.Color(tone, tone * (0.96 + deco() * 0.08), tone * 0.92));
  }
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  scene.add(rockMesh);
  // Grass grows in tufts of two blades; colour drifts from dry straw to damp green across the map.
  const blades: number[] = [],
    bladeUV: number[] = [],
    bladeColors: number[] = [],
    bladeNormals: number[] = [];
  const dryGrass = new THREE.Color(0x8a8550),
    wetGrass = new THREE.Color(0x55703a),
    bladeColor = new THREE.Color();
  for (let i = 0; i < 240000; i++) {
    const x = PLAY_AREA.minX + random() * (PLAY_AREA.maxX - PLAY_AREA.minX),
      z = random() * (PLAY_AREA.maxZ + 14) - 14;
    // Meadow patches: dense where the ground is damp, bare mud elsewhere. Cheap test first; most samples stop here.
    const lush = fbm(x * 0.05 + 9, z * 0.05 + 2);
    if (random() > (lush - 0.42) * 3.2) continue;
    if (routeClearance({ x, z }) < 0.35 || Math.hypot(x - EXPEDITION.start.x, z - EXPEDITION.start.z) < 2) continue;
    const sector = sectorAt({ x, z });
    if ((sector.id === 'B' || sector.id === 'E') && random() < 0.45) continue;
    bladeColor.copy(dryGrass).lerp(wetGrass, Math.min(1, Math.max(0, lush * 1.5 - 0.25 + (random() - 0.5) * 0.3)));
    for (let blade = 0; blade < 2; blade++) {
      const bx = x + (random() - 0.5) * 0.3,
        bz = z + (random() - 0.5) * 0.3;
      const h = (0.13 + random() * 0.3) * (0.7 + lush * 0.6),
        w = 0.03 + random() * 0.04,
        a = random() * Math.PI;
      const dx = Math.cos(a) * w,
        dz = Math.sin(a) * w;
      blades.push(
        bx - dx,
        0,
        bz - dz,
        bx + dx,
        0,
        bz + dz,
        bx + (random() - 0.5) * 0.22,
        h,
        bz + (random() - 0.5) * 0.22,
      );
      bladeUV.push(0, 0, 1, 0, 0.5, 1);
      bladeNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      for (const k of [0.7, 0.7, 0.95]) bladeColors.push(bladeColor.r * k, bladeColor.g * k, bladeColor.b * k);
    }
  }
  const grassGeo = new THREE.BufferGeometry();
  grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(blades, 3));
  grassGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bladeUV, 2));
  grassGeo.setAttribute('normal', new THREE.Float32BufferAttribute(bladeNormals, 3));
  grassGeo.setAttribute('color', new THREE.Float32BufferAttribute(bladeColors, 3));
  add(grassGeo, grass, [0, 0, 0]);
  // Low shrubs gather in the damp patches, well away from roads and fighting clearings.
  const shrubTone = new THREE.Color();
  for (let i = 0; i < 520; i++) {
    const x = PLAY_AREA.minX + 2 + deco() * (width - 4),
      z = 20 + deco() * (PLAY_AREA.maxZ - 22),
      r = 0.35 + deco() * 0.4;
    if (fbm(x * 0.05 + 9, z * 0.05 + 2) < 0.52 || reserved(x, z, 5)) continue;
    for (let lobe = 0; lobe < 2 + Math.floor(deco() * 2); lobe++) {
      const shrub = new THREE.IcosahedronGeometry(1, 1);
      shrub.deleteAttribute('uv');
      shrub.scale(r * (1 + deco() * 0.5), r * (0.6 + deco() * 0.3), r * (1 + deco() * 0.4));
      shrub.computeVertexNormals();
      shrubTone.setHex(0x34462a).multiplyScalar(0.7 + deco() * 0.6);
      add(
        paint(shrub, shrubTone, 0.55),
        needles,
        [x + (deco() - 0.5) * r * 2.4, r * 0.3, z + (deco() - 0.5) * r * 2.4],
        deco() * 6,
      );
    }
  }
  for (const [x, z, scale] of [
    [-27, 7, 1],
    [-24, -7, 0.85],
    [27, 5, 1.1],
    [-36, 22, 1.3],
    [34, 26, 0.95],
  ]) {
    if (reserved(x, z, 3)) continue;
    const base = new THREE.Vector3(x, 0, z),
      tip = new THREE.Vector3(x + 0.4, 6 * scale, z);
    cylinderBetween(base, tip, 0.35 * scale, 0.1, wood, true);
    for (let j = 0; j < 6; j++) {
      const angle = j * 2.4,
        start = new THREE.Vector3(x + 0.2, (2.6 + j * 0.4) * scale, z);
      const end = new THREE.Vector3(
        x + Math.sin(angle) * 2.8 * scale,
        (4 + j * 0.5) * scale,
        z + Math.cos(angle) * 2.8 * scale,
      );
      cylinderBetween(start, end, 0.12, 0.035, wood);
      cylinderBetween(end, end.clone().add(new THREE.Vector3(0.4, 1.2, -0.3)), 0.04, 0.008, wood);
    }
  }
  // A pine crown: five overlapping tiers, each tree with its own shade, lean and girth.
  const pineTone = new THREE.Color();
  function crown(x: number, base: number, z: number, h: number) {
    const bottom = h * 0.3,
      step = (h + 1.6 - bottom) / 5,
      girth = (2 + deco() * 1.1) * (0.75 + h / 22),
      leanX = (deco() - 0.5) * 0.5,
      leanZ = (deco() - 0.5) * 0.5;
    pineTone.setHex(0x2c4630).multiplyScalar(0.6 + deco() * 0.7);
    pineTone.r += deco() * 0.012;
    for (let tier = 0; tier < 5; tier++) {
      const cone = new THREE.ConeGeometry(girth * (1 - (tier / 5) * 0.8), step * 2, 7, 1, true).toNonIndexed();
      cone.deleteAttribute('uv');
      cone.computeVertexNormals();
      add(
        paint(cone, pineTone, 0.6),
        needles,
        [x + (leanX * tier) / 5, base + bottom + step * tier + step - 0.2, z + (leanZ * tier) / 5],
        deco() * 6,
      );
    }
  }
  // Woodland masses frame the eastern loop; reserve both road width and fighting circles.
  // Independent stream keeps tree positions stable when grass density changes.
  seed = 32491;
  for (let i = 0; i < 150; i++) {
    const x = i < 125 ? 44 + random() * 88 : -126 + random() * 28;
    const z = 40 + random() * (i < 125 ? 122 : 44);
    if (reserved(x, z, 3.1)) continue;
    const h = 5 + random() * 5;
    add(new THREE.CylinderGeometry(0.15, 0.35, h, 6), bark, [x, h / 2, z], 0, true);
    crown(x, 0, z, h);
  }
  // Small stands of pines break up the open fields; same clearance rule as the woodland, with a wider margin.
  for (const [gx, gz] of [
    [-112, 42],
    [-122, 122],
    [-22, 152],
    [44, 150],
    [-64, 204],
    [62, 230],
    [-104, 216],
    [22, 68],
    [-58, 134],
    [126, 216],
    [-8, 226],
    [118, 28],
  ])
    for (let i = 0; i < 7; i++) {
      const x = gx + (deco() - 0.5) * 24,
        z = gz + (deco() - 0.5) * 24,
        h = 5 + deco() * 5;
      if (reserved(x, z, 5.5) || x < PLAY_AREA.minX + 3 || x > PLAY_AREA.maxX - 3 || z < 24 || z > PLAY_AREA.maxZ - 3)
        continue;
      add(new THREE.CylinderGeometry(0.15, 0.35, h, 6), bark, [x, h / 2, z], 0, true);
      crown(x, 0, z, h);
    }
  // Forest beyond the fences: nobody walks there, so it needs no collision. It hides the horizon and gives the fog something to bite.
  for (let i = 0; i < 1500; i++) {
    const x = PLAY_AREA.minX - 95 + deco() * (width + 190),
      z = -8 + deco() * (PLAY_AREA.maxZ + 103);
    const dx = Math.max(PLAY_AREA.minX - x, x - PLAY_AREA.maxX, 0),
      dz = Math.max(z - PLAY_AREA.maxZ, 0),
      d = Math.hypot(dx, dz);
    if (d < 3.5 || deco() > 1.05 - d / 100) continue;
    const h = 6 + deco() * 8,
      base = rise(x, z) - 0.25;
    add(new THREE.CylinderGeometry(0.16, 0.4, h, 5), bark, [x, base + h / 2, z]);
    crown(x, base, z, h);
  }
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const sx = 28 + random() * 20,
      hill = new THREE.SphereGeometry(1, 12, 7);
    hill.scale(sx, 14 + random() * 22, 27);
    const dx = Math.sin(angle),
      dz = Math.cos(angle);
    // The full visual footprint stays outside walkable ground, including new corners.
    const radius = Math.min(
      (width / 2 + sx + 18) / Math.max(0.0001, Math.abs(dx)),
      (depth / 2 + 27 + 18) / Math.max(0.0001, Math.abs(dz)),
    );
    add(hill, distant, [centerX + dx * radius, -4, centerZ + dz * radius]);
  }
  // Visible perimeter: the fortress closes the north; old timber fences mark the clearing.
  const left = PLAY_AREA.minX - 0.2,
    right = PLAY_AREA.maxX + 0.2,
    back = PLAY_AREA.maxZ + 0.2;
  for (const x of [left, right]) {
    for (let z = -16; z < back; z += 2.6) box(x, 0.75, z, 0.18, 1.5, 0.18, wood, true);
    for (const y of [0.45, 1.05]) box(x, y, (back - 16) / 2, 0.13, 0.16, back + 16, wood, true);
  }
  for (let x = left; x <= right; x += 2.6) box(x, 0.75, back, 0.18, 1.5, 0.18, wood, true);
  for (const y of [0.45, 1.05]) box((left + right) / 2, y, back, right - left, 0.16, 0.13, wood, true);
  // All static meshes sharing a material are merged, avoiding hundreds of draw calls.
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries.map(g => (g.index ? g.toNonIndexed() : g)));
    if (!merged) throw new Error('No se pudo construir la geometría del entorno.');
    const mesh = new THREE.Mesh(merged, material);
    mesh.receiveShadow = true;
    mesh.castShadow =
      material !== mud &&
      material !== path &&
      material !== track &&
      material !== clearing &&
      material !== grass &&
      material !== distant &&
      material !== soil &&
      material !== glow;
    scene.add(mesh);
    geometries.forEach(g => g.dispose());
  }
  const flames: THREE.Mesh[] = [],
    lights: THREE.PointLight[] = [];
  for (const x of [0.1, 7.9]) {
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8), iron);
    bracket.position.set(x, 2.7, -15.65);
    bracket.rotation.x = -0.3;
    scene.add(bracket);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffc060 }),
    );
    flame.position.set(x, 3.1, -15.5);
    flame.scale.set(0.75, 2.1, 0.75);
    scene.add(flame);
    flames.push(flame);
    const light = new THREE.PointLight(0xffa441, 24, 7, 2);
    light.position.copy(flame.position);
    scene.add(light);
    lights.push(light);
  }
  scene.add(new THREE.HemisphereLight(0xb9c8d4, 0x5d5642, 1));
  const sun = new THREE.DirectionalLight(0xffe0b4, 2.7);
  sun.position.set(-30, 30, 14);
  sun.target.position.set(0, 0, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -34;
  sun.shadow.camera.right = 34;
  sun.shadow.camera.top = 34;
  sun.shadow.camera.bottom = -34;
  sun.shadow.camera.far = 110;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00015;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  let warrior = createHeroView(definition);
  scene.add(warrior.root);
  const movementSolids = obstacles.filter(box => box.max.y > 0.08 && box.min.y < definition.movement.height);
  return {
    scene,
    obstacles,
    movementSolids,
    get hero() {
      return warrior;
    },
    get warrior() {
      return warrior;
    },
    sun,
    replaceHero(next: ClassDefinition) {
      scene.remove(warrior.root);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      warrior.root.traverse(object => {
        if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
        }
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      warrior = createHeroView(next);
      scene.add(warrior.root);
      movementSolids.splice(
        0,
        movementSolids.length,
        ...obstacles.filter(box => box.max.y > 0.08 && box.min.y < next.movement.height),
      );
    },
    update(time: number) {
      // Keep the shadow footprint near the hero as the expedition leaves the original clearing.
      const x = Math.round(warrior.root.position.x * 8) / 8,
        z = Math.round(warrior.root.position.z * 8) / 8;
      sun.position.set(x - 30, 30, z + 20);
      sun.target.position.set(x, 0, z);
      flames.forEach((flame, i) => {
        flame.scale.y = 2 + Math.sin(time * 8 + i) * 0.3;
        lights[i].intensity = 24 + Math.sin(time * 6 + i * 3) * 3;
      });
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
        }
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      sun.shadow.map?.dispose();
    },
  };
}
