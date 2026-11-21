import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Assets } from './assets.ts';
import type { Obstacle } from './collision.ts';
import { createHeroView } from './hero.ts';
import { disposeSceneMeshes } from './scene-meshes.ts';
import {
  buildArrow,
  buildBarrel,
  buildCampfire,
  buildGate,
  buildLadder,
  buildRam,
  buildShield,
  buildStake,
  createKit,
  createPieceMaterials,
  GATE,
  onDrum,
} from './exterior-pieces.ts';
import { type GroundSectors, type GroundZone, ROCK_WEATHERING, wearGround, weather } from './weathering.ts';
import { WARRIOR } from '../content/classes/warrior.ts';
import type { ClassDefinition } from '../content/class-definition.ts';
import { PLAY_AREA } from '../content/config.ts';
import { EXPEDITION } from '../content/expedition.ts';
import { LANDMARKS } from '../content/map.ts';
import { ROUTES, routeClearance, SECTOR_SURFACES, SECTORS, sectorAt } from '../content/terrain-layout.ts';

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
  // E2.2 materials: cooler, weathered stone; greyed timber; rusting iron. Soot sources are the gate torches.
  const soot = [new THREE.Vector4(), new THREE.Vector4()];
  const materials = createPieceMaterials(assets, soot);
  const { stone, trim, keepStone, wood, iron, dark, banner, slate, bark } = materials;
  // E3.2 natural rock: the masonry texture, darker and faceted, with the same moss and lichen as the walls.
  const rockStone = weather(assets.materials.castle_wall_slates.clone(), ROCK_WEATHERING, soot);
  rockStone.color.set(0xb4b4aa);
  rockStone.flatShading = true;
  const mud = assets.materials.brown_mud_02;
  const path = assets.materials.cobblestone_floor_04.clone();
  path.color.set(0xb6b29e);
  const track = assets.materials.brown_mud_02.clone();
  track.color.set(0xe6dac4);
  const clearing = assets.materials.brown_mud_02.clone();
  clearing.color.set(0xe3e4d8);
  // E3.1 surfaces: the worn ground of the E2.3 sample now covers the whole map, and each sector adds its own
  // character (damp patches, moss, brightness, wheel ruts), blended across 12 m at sector borders.
  const surfaces: GroundZone = { x: 4, z: 110, inner: 1e4, outer: 1e4 + 1 };
  const open = (value: number, limit: number) => (value === limit ? Math.sign(limit) * 1e4 : value);
  const sectors: GroundSectors = {
    rects: SECTORS.map(
      s =>
        new THREE.Vector4(
          open(s.minX, PLAY_AREA.minX),
          open(s.minZ, PLAY_AREA.minZ),
          open(s.maxX, PLAY_AREA.maxX),
          open(s.maxZ, PLAY_AREA.maxZ),
        ),
    ),
    params: SECTORS.map(s => {
      const c = SECTOR_SURFACES[s.id];
      return new THREE.Vector4(c.wet, c.green, c.light, c.ruts);
    }),
  };
  const mudRim = new THREE.Color(0x5a5044);
  wearGround(path, surfaces, { fray: 1, bomb: 1, variation: 1, rim: mudRim, sectors });
  wearGround(track, surfaces, { fray: 1, bomb: 1, variation: 1, rim: mudRim, shade: 0.58, ruts: 1, sectors });
  wearGround(clearing, surfaces, { fray: 1, bomb: 1, variation: 1, rim: mudRim, shade: 0.56, sectors });
  // Old paving in ruined courtyards: the road's cobbles, darker and mossier.
  const paving = wearGround(assets.materials.cobblestone_floor_04.clone(), surfaces, {
    fray: 1,
    bomb: 1,
    variation: 1,
    rim: mudRim,
    shade: 0.68,
    sectors,
  });
  paving.color.set(0xa9a690);
  // Wet mud at the wall foot and around puddles; puddles themselves mirror the overcast sky.
  const damp = wearGround(assets.materials.brown_mud_02.clone(), surfaces, {
    fray: 1,
    bomb: 1,
    variation: 1,
    rim: new THREE.Color(0x5d5446),
    sectors,
  });
  damp.color.set(0x8c8273);
  damp.roughness = 0.55;
  const puddle = new THREE.MeshStandardMaterial({ color: 0x48524f, roughness: 0.04, metalness: 0.3 });
  const grass = new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.DoubleSide, vertexColors: true });
  const distant = new THREE.MeshStandardMaterial({ color: 0x353f41, roughness: 1 });
  // Dressing materials. Vertex colours carry the variation, so each stays one draw call.
  const soil = wearGround(mud.clone(), surfaces, { fray: 0, bomb: 1, variation: 0.8, rim: mudRim, sectors });
  soil.vertexColors = true;
  const needles = new THREE.MeshStandardMaterial({ roughness: 1, vertexColors: true, flatShading: true });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffb45e });
  // Shared building helpers (exterior-pieces.ts): geometry is batched by material; collision feeds `obstacles`.
  const kit = createKit(
    {
      geometry(geometry, material) {
        const list = batches.get(material) ?? [];
        list.push(geometry);
        batches.set(material, list);
      },
      solid(min, max) {
        obstacles.push({ min, max });
      },
    },
    stone,
  );
  const { add, box, cylinderBetween, solid } = kit;
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
      dz = Math.max(z - PLAY_AREA.maxZ, 0),
      d = Math.hypot(dx, dz);
    const t = Math.min(1, Math.max(0, (d - 8) / 110)),
      s = t * t * (3 - 2 * t);
    // E3.2 bank: from 1.5 m beyond the fences the land climbs 3.5–7 m in about 11 m, a natural limit to the clearing.
    const b = Math.min(1, Math.max(0, (d - 1.5) / 10.5)),
      bank = b * b * (3 - 2 * b) * (3.5 + fbm(x * 0.08 + 41, z * 0.08 + 7) * 3.5);
    return bank + s * (7 + fbm(x * 0.03, z * 0.03) * 12);
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
  // Terrain keeps the playable clearing flat; relief is confined to distant slopes.
  const width = PLAY_AREA.maxX - PLAY_AREA.minX,
    depth = PLAY_AREA.maxZ - PLAY_AREA.minZ;
  const centerX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2,
    centerZ = (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2;
  const terrainMargin = 160; // Covers the camera's exterior view and full distant-hill footprints.
  // The ground keeps its 4 m grid (same vertices as before E3.2 inside the clearing) and refines to 1 m across the
  // 20 m bands beyond the fences where the bank climbs.
  function gridLines(from: number, to: number, fine: readonly [number, number][]) {
    const lines = [from];
    while (lines.at(-1)! < to - 1e-6) {
      const at = lines.at(-1)!;
      lines.push(at + (fine.some(([a, b]) => at >= a - 1e-6 && at < b - 1e-6) ? 1 : 4));
    }
    return lines;
  }
  const groundX0 = centerX - width / 2 - terrainMargin,
    groundZ1 = centerZ + depth / 2 + terrainMargin;
  const xs = gridLines(groundX0, centerX + width / 2 + terrainMargin, [
      [PLAY_AREA.minX - 20, PLAY_AREA.minX],
      [PLAY_AREA.maxX, PLAY_AREA.maxX + 20],
    ]),
    zs = gridLines(centerZ - depth / 2 - terrainMargin, groundZ1, [[PLAY_AREA.maxZ, PLAY_AREA.maxZ + 20]]);
  const groundVertices: number[] = [],
    groundUVs: number[] = [],
    groundIndex: number[] = [];
  for (const z of zs)
    for (const x of xs) {
      groundVertices.push(x, 0, z);
      groundUVs.push((x - groundX0) / 4, (groundZ1 - z) / 4);
    }
  for (let j = 0; j < zs.length - 1; j++)
    for (let i = 0; i < xs.length - 1; i++) {
      const a = j * xs.length + i,
        b = a + xs.length;
      groundIndex.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const ground = new THREE.BufferGeometry();
  ground.setAttribute('position', new THREE.Float32BufferAttribute(groundVertices, 3));
  ground.setAttribute('uv', new THREE.Float32BufferAttribute(groundUVs, 2));
  ground.setIndex(groundIndex);
  // Broad damp, dry and mossy patches break the texture's tiling; outside the fences the land climbs into the hills.
  const groundPos = ground.getAttribute('position'),
    groundColors = new Float32Array(groundPos.count * 3);
  for (let i = 0; i < groundPos.count; i++) {
    const x = groundPos.getX(i),
      z = groundPos.getZ(i),
      height = rise(x, z);
    groundPos.setY(i, height);
    const light = 0.62 + fbm(x * 0.035, z * 0.035) * 0.62,
      moss = Math.min(1, Math.max(0, fbm(x * 0.05 + 9, z * 0.05 + 2) - 0.4) * 2.4) * 0.8 + Math.min(0.5, height * 0.06);
    groundColors.set([light * (1 - 0.26 * moss), light * (1 - 0.04 * moss), light * (1 - 0.42 * moss)], i * 3);
  }
  ground.setAttribute('color', new THREE.BufferAttribute(groundColors, 3));
  ground.computeVertexNormals();
  add(ground, soil, [0, -0.035, 0]);
  // The camera does not collide with terrain. Stepped boxes under the bank stop it there instead; they sit outside the
  // clearing, so they never enter movement, navigation or spawning (`cameraOnly`).
  const cameraOnly = new Set<Obstacle>();
  function cameraSolid(x0: number, z0: number, x1: number, z1: number) {
    let top = 0;
    for (let x = x0; x <= x1 + 1e-6; x += 1) for (let z = z0; z <= z1 + 1e-6; z += 1) top = Math.max(top, rise(x, z));
    if (top < 0.3) return;
    const box: Obstacle = { min: { x: x0, y: -1, z: z0 }, max: { x: x1, y: top + 0.15, z: z1 } };
    obstacles.push(box);
    cameraOnly.add(box);
  }
  for (let d = 0; d < 20; d += 2)
    for (let z = -40; z < PLAY_AREA.maxZ + 20; z += 20) {
      cameraSolid(PLAY_AREA.minX - d - 2, z, PLAY_AREA.minX - d, z + 20);
      cameraSolid(PLAY_AREA.maxX + d, z, PLAY_AREA.maxX + d + 2, z + 20);
    }
  for (let d = 0; d < 20; d += 2)
    for (let x = PLAY_AREA.minX - 20; x < PLAY_AREA.maxX + 20; x += 20)
      cameraSolid(x, PLAY_AREA.maxZ + d, x + 20, PLAY_AREA.maxZ + d + 2);
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
  // E2.1–E2.2 gate, built in exterior-pieces.ts: round flanking towers, recessed gatehouse, lowered portcullis
  // and timber hoarding. The world keeps the torches, the paved mouth and everything that grows around it.
  const gateX = GATE.x,
    gateSpan = GATE.span,
    gateTowers = GATE.towers,
    gateTowerZ = GATE.towerZ,
    gateTowerRadius = GATE.towerRadius,
    gateTowerFoot = GATE.towerFoot,
    grille = GATE.grille;
  buildGate(kit, materials);
  // Paved gate mouth and tower feet: no grass or loose rocks grow there.
  function inGateFoot(x: number, z: number) {
    return (
      (Math.abs(x - gateX) < gateSpan + 0.4 && z < gateTowerZ + gateTowerFoot + 0.3) ||
      gateTowers.some(t => Math.hypot(x - t.x, z - gateTowerZ) < gateTowerFoot + 0.15)
    );
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
      edges: number[] = [],
      indices: number[] = [];
    points.forEach(({ x, z }, i) => {
      const before = points[Math.max(0, i - 1)],
        after = points[Math.min(points.length - 1, i + 1)];
      const dx = after.x - before.x,
        dz = after.z - before.z,
        length = Math.hypot(dx, dz) || 1;
      // Left, centre and right: `edge` runs 0 on the centre line to 1 on each border, for frayed edges.
      for (const side of [-1, 0, 1]) {
        const px = x + (((dz / length) * width) / 2) * side,
          pz = z - (((dx / length) * width) / 2) * side;
        vertices.push(px, y, pz);
        uvs.push(px / 2.4, pz / 2.4);
        edges.push(Math.abs(side));
      }
      if (i < points.length - 1) {
        const j = i * 3;
        indices.push(j, j + 3, j + 1, j + 1, j + 3, j + 4, j + 1, j + 4, j + 2, j + 2, j + 4, j + 5);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('edge', new THREE.Float32BufferAttribute(edges, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    add(geo, material, [0, 0, 0]);
  }
  function groundPatch(x: number, z: number, radius: number, stretch = 1, material = clearing, y = -0.018) {
    const geo = new THREE.CircleGeometry(radius, 28);
    geo.rotateX(-Math.PI / 2);
    geo.scale(stretch, 1, 1);
    const pos = geo.getAttribute('position'),
      uv = geo.getAttribute('uv');
    const edges = new Float32Array(uv.count);
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (pos.getX(i) + x) / 4, (pos.getZ(i) + z) / 4);
      edges[i] = Math.hypot(pos.getX(i) / stretch, pos.getZ(i)) / radius;
    }
    geo.setAttribute('edge', new THREE.BufferAttribute(edges, 1));
    add(geo, material, [x, y, z]);
  }
  for (const spot of LANDMARKS.slice(1)) groundPatch(spot.x, spot.z, spot.radius);
  groundPatch(EXPEDITION.start.x, EXPEDITION.start.z, 16, 1.15);
  // E3.1: broken paving survives in the old courtyards of the ruins, the abbey and the crossroads.
  for (const name of ['Ruinas del camino', 'Abadía derruida', 'Encrucijada del exilio']) {
    const spot = LANDMARKS.find(l => l.name === name)!;
    groundPatch(spot.x, spot.z, spot.radius * 0.55, 1.2, paving, -0.014);
  }
  for (const route of ROUTES) {
    // Only the cobbled road keeps a mud verge; on dirt tracks a second frayed ribbon drew a double outline.
    if (route.kind === 'main') trail(route.points, route.width + 1.4, track, -0.009);
    trail(route.points, route.width, route.kind === 'main' ? path : track, route.kind === 'main' ? 0.008 : 0.003);
  }
  // The paved approach narrows between the towers and runs into the passage up to the portcullis.
  trail(
    [
      { x: gateX, z: -8 },
      { x: gateX, z: gateTowerZ + 3.6 },
    ],
    6,
    path,
    0.008,
  );
  trail(
    [
      { x: gateX, z: gateTowerZ + 3.6 },
      { x: gateX, z: grille - 0.1 },
    ],
    2 * gateSpan,
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
  // E2.3 · Explanada y camino inmediato: wet mud at the wall foot, puddles, loose cobbles and the debris of a
  // failed assault. Only the ram, a barrel and the ladder's foot collide; everything else lies flat or thin,
  // clear of the fighting circles, and draws from its own random stream.
  let wildSeed = 60917;
  function wild() {
    wildSeed = (Math.imul(wildSeed, 1664525) + 1013904223) >>> 0;
    return wildSeed / 4294967296;
  }
  // Geometry for a frayed material that should keep its full outline.
  function edged(geo: THREE.BufferGeometry, value = 0) {
    const count = geo.getAttribute('position').count;
    geo.setAttribute('edge', new THREE.Float32BufferAttribute(new Float32Array(count).fill(value), 1));
    return geo;
  }
  // Wet apron along the whole curtain (E3.1; E2.3 covered only the gate): full at the wall, frayed towards the field.
  const apronX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2,
    apron = new THREE.PlaneGeometry(PLAY_AREA.maxX - PLAY_AREA.minX + 2, 2.9, 1, 1);
  apron.rotateX(-Math.PI / 2);
  {
    const pos = apron.getAttribute('position'),
      uv = apron.getAttribute('uv'),
      edges = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) + apronX) / 4, (pos.getZ(i) - 15.75) / 4);
      edges[i] = (pos.getZ(i) + 1.45) / 2.9;
    }
    apron.setAttribute('edge', new THREE.BufferAttribute(edges, 1));
  }
  add(apron, damp, [apronX, -0.004, -15.75]);
  // Puddles in ruts and low spots, each with a darker wet rim. `random` shapes the outline.
  function puddleAt(x: number, z: number, r: number, turn: number, random: () => number) {
    const outline = new THREE.Shape();
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2,
        k = 0.86 + random() * 0.28,
        px = Math.cos(a) * r * k * 1.35,
        pz = Math.sin(a) * r * k * 0.85;
      if (i) outline.lineTo(px, pz);
      else outline.moveTo(px, pz);
    }
    outline.closePath();
    const water = new THREE.ShapeGeometry(outline);
    water.rotateX(-Math.PI / 2);
    add(water, puddle, [x, 0.014, z], turn);
    const rim = edged(new THREE.ShapeGeometry(outline).scale(1.15, 1.15, 1));
    const rimUV = rim.getAttribute('uv');
    for (let i = 0; i < rimUV.count; i++) rimUV.setXY(i, rimUV.getX(i) / 4, rimUV.getY(i) / 4);
    rim.rotateX(-Math.PI / 2);
    add(rim, damp, [x, 0.011, z], turn);
  }
  for (const [x, z, r, turn] of [
    [3, -12.4, 0.7, 0.3],
    [5.6, -9.6, 0.5, 1.2],
    [-1.8, -6.8, 1, 0.5],
    [6.8, -1, 0.8, 2.1],
    [2.2, 7.5, 0.65, 0.9],
    [6, 16, 0.9, 0.2],
    [-8.5, -15, 0.9, 0.1],
    [16.5, -14.6, 0.8, 0.4],
    [21, -6.6, 1, 1.6],
    [12.8, -5.4, 0.6, 2.6],
    [-4.2, 3, 0.7, 1.1],
  ])
    puddleAt(x, z, r, turn, wild);
  // E3.1: puddles along the rest of the routes and at clearing edges, more of them in wetter sectors.
  // Their own random stream keeps every E2.3 placement where it was.
  let spreadSeed = 81233;
  function spread() {
    spreadSeed = (Math.imul(spreadSeed, 1664525) + 1013904223) >>> 0;
    return spreadSeed / 4294967296;
  }
  const nearGate = (x: number, z: number) => Math.hypot(x - 4, z + 4) < 34;
  for (const route of ROUTES) {
    let next = 10 + spread() * 20,
      walked = 0;
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1],
        b = route.points[i],
        length = Math.hypot(b.x - a.x, b.z - a.z);
      while (length > 0 && walked + length >= next) {
        const t = (next - walked) / length,
          across = (spread() - 0.5) * route.width * 0.6,
          x = a.x + (b.x - a.x) * t - ((b.z - a.z) / length) * across,
          z = a.z + (b.z - a.z) * t + ((b.x - a.x) / length) * across,
          chance = spread(),
          r = 0.45 + spread() * 0.65,
          turn = spread() * Math.PI;
        if (chance < SECTOR_SURFACES[sectorAt({ x, z }).id].wet * 0.8 && !nearGate(x, z))
          puddleAt(x, z, r, turn, spread);
        next += 18 + spread() * 16;
      }
      walked += length;
    }
  }
  for (const spot of LANDMARKS.slice(1)) {
    const wet = SECTOR_SURFACES[sectorAt(spot).id].wet;
    for (let k = 0; k < 2; k++) {
      const a = spread() * Math.PI * 2,
        d = spot.radius * (0.55 + spread() * 0.35),
        chance = spread(),
        r = 0.5 + spread() * 0.6,
        turn = spread() * Math.PI;
      if (chance < wet) puddleAt(spot.x + Math.cos(a) * d, spot.z + Math.sin(a) * d, r, turn, spread);
    }
  }
  // Cobbles worked loose along the frayed road edges and around the explanada.
  for (let i = 0; i < 60; i++) {
    const around = i < 16,
      a = wild() * Math.PI * 2,
      side = wild() < 0.5 ? -1 : 1,
      reach = wild(),
      x = around ? 4 + Math.cos(a) * (4.5 + reach * 2) : gateX + side * (3.5 + reach * 1.6),
      z = around ? -6 + Math.sin(a) * (4.5 + reach * 2) : -8 + wild() * 40,
      size = 0.1 + wild() * 0.07,
      turn = wild() * Math.PI;
    if (z < gateTowerZ + gateTowerFoot) continue;
    const cobble = new THREE.IcosahedronGeometry(1, 0);
    cobble.scale(size * 1.25, size * 0.55, size);
    add(cobble, stone, [x, size * 0.25, z], turn);
  }
  // The battering ram that never reached the gate (exterior-pieces.ts).
  buildRam(kit, materials, 20.5, -10.2, 0.1);
  // A barrel beside the crates and another smashed into staves.
  buildBarrel(kit, materials, 12.4, -10.6);
  for (let i = 0; i < 7; i++) {
    const a = wild() * Math.PI * 2,
      d = 0.3 + wild() * 0.6;
    box(15.3 + Math.cos(a) * d, 0.03, -11.8 + Math.sin(a) * d, 0.12, 0.04, 0.9, wood, false, a);
  }
  add(new THREE.TorusGeometry(0.4, 0.025, 5, 16).rotateX(Math.PI / 2), iron, [15.1, 0.03, -11.5]);
  // Siege ladders: one still against the curtain, one thrown down.
  buildLadder(kit, materials, new THREE.Vector3(-21, 0, -14.3), new THREE.Vector3(-21, 7.1, -16.85), 7);
  solid(-21.55, 0, -14.6, -20.45, 0.7, -14.05); // Low enough that the camera passes over it.
  buildLadder(kit, materials, new THREE.Vector3(-15, 0.06, -10.6), new THREE.Vector3(-11.4, 0.06, -12.8), 4);
  // Arrows from the walls stand in the mud, tails leaning back towards the battlements.
  for (const [cx, cz, count, spread] of [
    [4, -11, 12, 5],
    [-3, -9.5, 7, 4],
    [-19, -12, 8, 4],
    [17, -12.5, 7, 4],
    [9, 1, 6, 5],
  ]) {
    for (let i = 0; i < count; i++) {
      const x = cx + (wild() - 0.5) * spread,
        z = cz + (wild() - 0.5) * spread,
        lean = 0.3 + wild() * 0.35,
        turn = Math.PI + (wild() - 0.5) * 0.8;
      if (routeClearance({ x, z }) < 0 || inGateFoot(x, z) || z < -16.7) continue;
      buildArrow(
        kit,
        materials,
        new THREE.Vector3(x, -0.05, z),
        new THREE.Vector3(Math.sin(turn) * Math.sin(lean), Math.cos(lean), Math.cos(turn) * Math.sin(lean)),
      );
    }
  }
  // Dropped shields, face up or tipped on their rims.
  for (const [x, z, tilt, turn] of [
    [-2.5, -10.8, 0.08, 0.4],
    [9.8, -5.6, 0.3, 2.2],
    [-17, -12.6, 0.12, 1.1],
  ]) {
    buildShield(kit, materials, x, z, tilt, turn);
  }
  // A cold siege fire: ring of stones, charred logs and ash.
  buildCampfire(kit, materials, -7.5, -9.5, wild);
  // Sharpened stakes from a broken abatis, mostly thrown down.
  for (let i = 0; i < 7; i++) {
    const x = -25.5 + (wild() - 0.5) * 3,
      z = -10.5 + (wild() - 0.5) * 2.6,
      a = wild() * Math.PI,
      standing = i < 2,
      length = 2 + wild() * 0.5;
    const end = standing
      ? new THREE.Vector3(x + Math.cos(a) * 0.9, length * 0.85, z + Math.sin(a) * 0.9)
      : new THREE.Vector3(x + Math.cos(a) * length, 0.07, z + Math.sin(a) * length);
    buildStake(kit, materials, new THREE.Vector3(x, standing ? -0.1 : 0.07, z), end);
  }
  // A fallen standard on the ronda, its cloth in the mud.
  cylinderBetween(new THREE.Vector3(10.6, 0.06, -3.4), new THREE.Vector3(13.8, 0.08, -2.1), 0.05, 0.045, wood);
  {
    const cloth = new THREE.Shape();
    cloth.moveTo(0, 0);
    for (const [px, py] of [
      [1.1, 0.05],
      [1.25, -0.7],
      [1.0, -0.95],
      [1.18, -1.4],
      [0.7, -1.2],
      [0.45, -1.55],
      [0.15, -1.1],
      [-0.05, -1.3],
    ])
      cloth.lineTo(px, py);
    cloth.closePath();
    const fallen = new THREE.ShapeGeometry(cloth);
    fallen.rotateX(-Math.PI / 2);
    add(fallen, banner, [12.6, 0.025, -2.55], 0.4);
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
    if (routeClearance({ x, z }) < 0.5 || inGateFoot(x, z)) dummy.scale.setScalar(0);
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
    // Still draw every random number so the gate never shifts grass elsewhere.
    const paved = inGateFoot(x, z);
    for (let blade = 0; blade < 2; blade++) {
      const bx = x + (random() - 0.5) * 0.3,
        bz = z + (random() - 0.5) * 0.3;
      const h = (0.13 + random() * 0.3) * (0.7 + lush * 0.6),
        w = 0.03 + random() * 0.04,
        a = random() * Math.PI;
      const dx = Math.cos(a) * w,
        dz = Math.sin(a) * w,
        tipX = bx + (random() - 0.5) * 0.22,
        tipZ = bz + (random() - 0.5) * 0.22;
      if (paved) continue;
      blades.push(bx - dx, 0, bz - dz, bx + dx, 0, bz + dz, tipX, h, tipZ);
      bladeUV.push(0, 0, 1, 0, 0.5, 1);
      bladeNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      for (const k of [0.7, 0.7, 0.95]) bladeColors.push(bladeColor.r * k, bladeColor.g * k, bladeColor.b * k);
    }
  }
  // E2.3 weeds: tall clumps along the wall foot and round the gate towers, short tufts in the worn road edges.
  const weedTone = new THREE.Color(),
    strawTone = new THREE.Color(0x8a8350);
  function weeds(x: number, z: number, count: number, height: number) {
    weedTone
      .setHex(0x4f6233)
      .lerp(strawTone, wild() * 0.6)
      .multiplyScalar(0.75 + wild() * 0.35);
    for (let b = 0; b < count; b++) {
      const bx = x + (wild() - 0.5) * 0.5,
        bz = z + (wild() - 0.5) * 0.5,
        h = height * (0.6 + wild() * 0.6),
        w = 0.025 + wild() * 0.03,
        a = wild() * Math.PI,
        dx = Math.cos(a) * w,
        dz = Math.sin(a) * w,
        tipX = bx + (wild() - 0.5) * 0.35,
        tipZ = bz + (wild() - 0.5) * 0.35;
      blades.push(bx - dx, 0, bz - dz, bx + dx, 0, bz + dz, tipX, h, tipZ);
      bladeUV.push(0, 0, 1, 0, 0.5, 1);
      bladeNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      for (const k of [0.6, 0.6, 0.95]) bladeColors.push(weedTone.r * k, weedTone.g * k, weedTone.b * k);
    }
  }
  for (let x = -29; x < 37; x += 0.8 + wild() * 0.9) {
    const z = -16.55 + wild() * 0.9;
    if (
      Math.abs(x - gateX) < gateSpan + 0.6 ||
      gateTowers.some(t => Math.hypot(x - t.x, z - gateTowerZ) < gateTowerFoot)
    )
      continue;
    weeds(x, z, 4 + Math.floor(wild() * 5), 0.55);
  }
  for (const t of gateTowers)
    for (let i = 0; i < 26; i++) {
      const p = onDrum(t.x, gateTowerZ, gateTowerFoot + 0.15 + wild() * 0.5, (i / 26) * Math.PI * 2 + wild() * 0.2);
      if (Math.abs(p.x - gateX) < gateSpan + 0.4 || p.z < -16.9) continue;
      weeds(p.x, p.z, 3 + Math.floor(wild() * 4), 0.5);
    }
  for (let i = 0; i < 90; i++) {
    const side = wild() < 0.5 ? -1 : 1,
      z = -9 + wild() * 42,
      x = gateX + side * (3.3 + wild() * 1.4);
    weeds(x, z, 2 + Math.floor(wild() * 3), 0.22);
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
  // E2.3 brambles in the corners at the wall foot.
  for (const [bx, bz] of [
    [-27.6, -15.2],
    [-7.2, -15.6],
    [14.6, -15.3],
    [31.5, -15.3],
  ])
    for (let lobe = 0; lobe < 4; lobe++) {
      const r = 0.4 + wild() * 0.35,
        shrub = new THREE.IcosahedronGeometry(1, 1);
      shrub.deleteAttribute('uv');
      shrub.scale(r * (1 + wild() * 0.5), r * (0.55 + wild() * 0.3), r * (1 + wild() * 0.4));
      shrub.computeVertexNormals();
      shrubTone.setHex(0x3a4a2b).multiplyScalar(0.65 + wild() * 0.5);
      add(
        paint(shrub, shrubTone, 0.55),
        needles,
        [bx + (wild() - 0.5) * 1.6, r * 0.3, bz + (wild() - 0.5) * 0.7],
        wild() * 6,
      );
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
  const trees: { x: number; z: number }[] = [];
  // Woodland masses frame the eastern loop; reserve both road width and fighting circles.
  // Independent stream keeps tree positions stable when grass density changes.
  seed = 32491;
  for (let i = 0; i < 150; i++) {
    const x = i < 125 ? 44 + random() * 88 : -126 + random() * 28;
    const z = 40 + random() * (i < 125 ? 122 : 44);
    if (reserved(x, z, 3.1)) continue;
    const h = 5 + random() * 5;
    trees.push({ x, z });
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
      trees.push({ x, z });
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
  // E3.2 rocks. A displaced icosahedron gives each rock its own facets; displacement depends on direction only, so
  // shared vertices stay joined. Texture coordinates follow world position like the masonry.
  let rockSeed = 44017;
  function rockRandom() {
    rockSeed = (Math.imul(rockSeed, 1664525) + 1013904223) >>> 0;
    return rockSeed / 4294967296;
  }
  function rock(x: number, z: number, size: number, base: number, collide: 'none' | 'camera' | 'all') {
    const geo = new THREE.IcosahedronGeometry(1, 1),
      pos = geo.getAttribute('position'),
      phase = rockRandom() * 100,
      sx = size * (0.9 + rockRandom() * 0.5),
      sy = size * (0.75 + rockRandom() * 0.4),
      sz = size * (0.8 + rockRandom() * 0.4),
      turn = rockRandom() * Math.PI * 2;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i),
        vy = pos.getY(i),
        vz = pos.getZ(i),
        k = 0.7 + 0.6 * hash(Math.round(vx * 7 + phase), Math.round(vz * 7 + vy * 13 + phase));
      // Sunk into the ground: flat, wide footing instead of a ball resting on a point.
      pos.setXYZ(i, vx * k * sx, Math.max(vy * k, -0.25) * sy, vz * k * sz);
    }
    geo.rotateY(turn);
    geo.computeVertexNormals();
    // Faces take the projection of their dominant axis, like box(), so the texture never stretches.
    const uv = geo.getAttribute('uv'),
      normal = geo.getAttribute('normal');
    for (let i = 0; i < uv.count; i++) {
      const nx = Math.abs(normal.getX(i)),
        ny = Math.abs(normal.getY(i)),
        nz = Math.abs(normal.getZ(i)),
        px = pos.getX(i) + x,
        py = pos.getY(i) + base,
        pz = pos.getZ(i) + z;
      if (ny >= nx && ny >= nz) uv.setXY(i, px / 2.4, pz / 2.4);
      else if (nx >= nz) uv.setXY(i, pz / 2.4, py / 2.4);
      else uv.setXY(i, px / 2.4, py / 2.4);
    }
    add(geo, rockStone, [x, base + 0.2 * sy, z]);
    if (collide === 'none') return;
    // Bounds after placement, in world coordinates; the footing starts at the ground.
    geo.computeBoundingBox();
    const b = geo.boundingBox!,
      solid: Obstacle = { min: { x: b.min.x, y: base, z: b.min.z }, max: { x: b.max.x, y: b.max.y, z: b.max.z } };
    obstacles.push(solid);
    if (collide === 'camera') cameraOnly.add(solid);
  }
  // Rock clusters on the bank, half buried in the slope, every 12–20 m along the fences.
  for (const edge of ['west', 'east', 'south'] as const) {
    const length = edge === 'south' ? PLAY_AREA.maxX - PLAY_AREA.minX : PLAY_AREA.maxZ - PLAY_AREA.minZ + 10;
    for (let along = 5; along < length; along += 9 + rockRandom() * 7) {
      if (rockRandom() < 0.25) continue;
      const out = 4 + rockRandom() * 9,
        x = edge === 'west' ? PLAY_AREA.minX - out : edge === 'east' ? PLAY_AREA.maxX + out : PLAY_AREA.minX + along,
        z = edge === 'south' ? PLAY_AREA.maxZ + out : PLAY_AREA.minZ + along;
      const count = 1 + Math.floor(rockRandom() * 3);
      for (let k = 0; k < count; k++) {
        const rx = x + (rockRandom() - 0.5) * 3,
          rz = z + (rockRandom() - 0.5) * 3;
        rock(rx, rz, 0.8 + rockRandom() * (k ? 0.9 : 1.9), rise(rx, rz) - 0.2, 'camera');
      }
    }
  }
  // Outcrops inside the clearing: in dead ground away from routes, fighting circles, activities, trees and the
  // map corners, at least 30 m apart. Their larger rocks collide.
  const outcrops: { x: number; z: number }[] = [];
  rockSeed = 70123; // Own stream: tuning the bank rocks never moves an outcrop.
  const corners = [
    { x: PLAY_AREA.minX + 2, z: PLAY_AREA.maxZ - 3 },
    { x: PLAY_AREA.maxX - 2, z: PLAY_AREA.maxZ - 3 },
    { x: PLAY_AREA.minX + 2, z: -12 },
    { x: PLAY_AREA.maxX - 2, z: -12 },
  ];
  for (let i = 0; i < 600 && outcrops.length < 12; i++) {
    const x = PLAY_AREA.minX + 8 + rockRandom() * (width - 16),
      z = 30 + rockRandom() * (PLAY_AREA.maxZ - 38);
    if (
      reserved(x, z, 9) ||
      trees.some(t => Math.hypot(t.x - x, t.z - z) < 6) ||
      // Nor against ruins, camps or carts: at least 5 m from any solid already standing.
      obstacles.some(
        o =>
          !cameraOnly.has(o) &&
          Math.hypot(Math.max(o.min.x - x, 0, x - o.max.x), Math.max(o.min.z - z, 0, z - o.max.z)) < 5,
      ) ||
      corners.some(c => Math.hypot(c.x - x, c.z - z) < 26) ||
      outcrops.some(o => Math.hypot(o.x - x, o.z - z) < 30)
    )
      continue;
    outcrops.push({ x, z });
    rock(x, z, 1.6 + rockRandom() * 1.1, 0, 'all');
    const satellites = 2 + Math.floor(rockRandom() * 3);
    for (let k = 0; k < satellites; k++) {
      const a = rockRandom() * Math.PI * 2,
        r = 1.8 + rockRandom() * 1.6;
      rock(x + Math.cos(a) * r, z + Math.sin(a) * r, 0.55 + rockRandom() * 0.6, 0, 'all');
    }
    for (let k = 0; k < 6; k++) {
      const a = rockRandom() * Math.PI * 2,
        r = 2.5 + rockRandom() * 2.5;
      rock(x + Math.cos(a) * r, z + Math.sin(a) * r, 0.12 + rockRandom() * 0.18, 0, 'none');
    }
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
      material !== paving &&
      material !== grass &&
      material !== distant &&
      material !== soil &&
      material !== damp &&
      material !== puddle &&
      material !== glow;
    scene.add(mesh);
    geometries.forEach(g => g.dispose());
  }
  const flames: THREE.Mesh[] = [],
    lights: THREE.PointLight[] = [];
  // Torches on the towers' inner flanks light the gate passage and portcullis.
  gateTowers.forEach(({ x, side }, index) => {
    const angle = -side * 0.75,
      wallPoint = onDrum(x, gateTowerZ, gateTowerRadius, angle),
      tip = onDrum(x, gateTowerZ, gateTowerRadius + 0.55, angle);
    const from = new THREE.Vector3(wallPoint.x, 3.15, wallPoint.z),
      to = new THREE.Vector3(tip.x, 3.5, tip.z);
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, from.distanceTo(to), 8), iron);
    bracket.position.copy(from).add(to).multiplyScalar(0.5);
    bracket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    scene.add(bracket);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.07, 0.2, 8), iron);
    cup.position.set(to.x, to.y + 0.06, to.z);
    scene.add(cup);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffa94a }),
    );
    flame.position.set(to.x, to.y + 0.3, to.z);
    flame.scale.set(0.62, 1.7, 0.62);
    scene.add(flame);
    flames.push(flame);
    const light = new THREE.PointLight(0xffa441, 24, 7, 2);
    light.position.copy(flame.position);
    scene.add(light);
    lights.push(light);
    // The stone above each torch is blackened by its smoke.
    soot[index].set(wallPoint.x, to.y + 0.2, wallPoint.z, 0.6);
  });
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
  const movementSolids = obstacles.filter(
    box => !cameraOnly.has(box) && box.max.y > 0.08 && box.min.y < definition.movement.height,
  );
  return {
    scene,
    obstacles,
    movementSolids,
    /** Visual terrain height; the clearing itself stays at 0. */
    terrainHeight: rise,
    /** E3.2 rock outcrop centres inside the clearing. */
    outcrops,
    get hero() {
      return warrior;
    },
    get warrior() {
      return warrior;
    },
    sun,
    replaceHero(next: ClassDefinition) {
      scene.remove(warrior.root);
      disposeSceneMeshes(warrior.root);
      warrior = createHeroView(next);
      scene.add(warrior.root);
      movementSolids.splice(
        0,
        movementSolids.length,
        ...obstacles.filter(box => !cameraOnly.has(box) && box.max.y > 0.08 && box.min.y < next.movement.height),
      );
    },
    update(time: number) {
      // Keep the shadow footprint near the hero as the expedition leaves the original clearing.
      const x = Math.round(warrior.root.position.x * 8) / 8,
        z = Math.round(warrior.root.position.z * 8) / 8;
      sun.position.set(x - 30, 30, z + 20);
      sun.target.position.set(x, 0, z);
      flames.forEach((flame, i) => {
        flame.scale.y = 1.7 + Math.sin(time * 8 + i) * 0.25;
        lights[i].intensity = 24 + Math.sin(time * 6 + i * 3) * 3;
      });
    },
    dispose() {
      disposeSceneMeshes(scene);
      sun.shadow.map?.dispose();
    },
  };
}
