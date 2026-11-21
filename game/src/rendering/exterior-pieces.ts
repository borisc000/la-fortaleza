import * as THREE from 'three';
import type { Assets } from './assets.ts';
import { IRON_WEATHERING, STONE_WEATHERING, WOOD_WEATHERING, weather } from './weathering.ts';

// E2.4 reusable exterior pieces. The gate of E2.1–E2.2 and the siege remains of E2.3 are built here once and
// used both by the world (merged by material, with collision) and by the model lab (as an inspectable group).

export type PieceMaterials = {
  stone: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  keepStone: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  banner: THREE.MeshStandardMaterial;
  slate: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  feather: THREE.MeshStandardMaterial;
};

/** E2.2 materials: cooler, weathered stone; greyed timber; rusting iron. `soot` holds the torch plumes. */
export function createPieceMaterials(assets: Assets, soot: THREE.Vector4[]): PieceMaterials {
  const stone = weather(assets.materials.castle_wall_slates.clone(), STONE_WEATHERING, soot);
  stone.color.set(0xcac9c3);
  stone.normalScale.set(0.9, 0.9);
  const wood = weather(assets.materials.weathered_brown_planks.clone(), WOOD_WEATHERING, soot);
  wood.color.set(0xb3a797);
  const iron = weather(
    new THREE.MeshStandardMaterial({ color: 0x3a403e, metalness: 0.75, roughness: 0.6 }),
    IRON_WEATHERING,
    soot,
  );
  const trim = weather(stone.clone(), STONE_WEATHERING, soot);
  trim.color.set(0xa9a89d);
  const keepStone = weather(stone.clone(), STONE_WEATHERING, soot);
  keepStone.color.set(0x8f9291);
  return {
    stone,
    trim,
    keepStone,
    wood,
    iron,
    dark: new THREE.MeshStandardMaterial({ color: 0x18201c, roughness: 1 }),
    banner: new THREE.MeshStandardMaterial({ color: 0x5b3428, roughness: 1, side: THREE.DoubleSide }),
    slate: new THREE.MeshStandardMaterial({ color: 0x2b3238, roughness: 0.85, flatShading: true }),
    bark: new THREE.MeshStandardMaterial({ color: 0x3a2e25, roughness: 1 }),
    feather: new THREE.MeshStandardMaterial({ color: 0xd4cdbd, roughness: 1, side: THREE.DoubleSide }),
  };
}

type Bounds = { x: number; y: number; z: number };
/** Where pieces go: finished geometry by material, and collision boxes. */
export type PieceSink = {
  geometry(geometry: THREE.BufferGeometry, material: THREE.Material): void;
  solid(min: Bounds, max: Bounds): void;
};

/** Building helpers shared by the world and the lab. Coordinates are world metres. */
export function createKit(sink: PieceSink, fallback: THREE.Material) {
  function add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: ArrayLike<number> = [0, 0, 0],
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
      sink.solid({ ...box.min }, { ...box.max });
    }
    sink.geometry(geometry, material);
  }
  function solid(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
    sink.solid({ x: x0, y: y0, z: z0 }, { x: x1, y: y1, z: z1 });
  }
  // Boxes take their texture coordinates from world position, so neighbouring blocks continue the masonry.
  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material = fallback,
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
        sink.solid(
          { x: Math.min(a.x, b.x) - radius, y: Math.min(a.y, b.y) - radius, z: Math.min(a.z, b.z) - radius },
          { x: Math.max(a.x, b.x) + radius, y: Math.max(a.y, b.y) + radius, z: Math.max(a.z, b.z) + radius },
        );
      }
    }
  }
  // Extruded and cylindrical masonry is measured in metres; share box()'s 2.4 m texture repeat.
  function metreUV(geometry: THREE.BufferGeometry) {
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4);
    return geometry;
  }
  // Round masonry wraps a whole number of repeats with the seam at the back; caps use plan coordinates like box().
  function drum(x: number, y: number, z: number, top: number, bottom: number, h: number, mat: THREE.Material) {
    const geo = new THREE.CylinderGeometry(top, bottom, h, 20, 1, false, Math.PI);
    const uv = geo.getAttribute('uv'),
      normal = geo.getAttribute('normal'),
      pos = geo.getAttribute('position'),
      repeats = Math.max(1, Math.round((Math.PI * (top + bottom)) / 2.4));
    for (let i = 0; i < uv.count; i++)
      if (Math.abs(normal.getY(i)) > 0.9) uv.setXY(i, (pos.getX(i) + x) / 2.4, (pos.getZ(i) + z) / 2.4);
      else uv.setXY(i, uv.getX(i) * repeats, (pos.getY(i) + y) / 2.4);
    add(geo, mat, [x, y, z]);
  }
  // A round footprint collides as strips no narrower than the wall at any depth, so nothing walks into the stone.
  function roundSolid(x: number, z: number, r: number, h: number, strips = 12) {
    for (let i = 0; i < strips; i++) {
      const a = -1 + (2 * i) / strips,
        b = a + 2 / strips,
        near = Math.min(Math.abs(a), Math.abs(b)),
        half = r * Math.sqrt(1 - near * near);
      solid(x - half, 0, z + a * r, x + half, h, z + b * r);
    }
  }
  return { add, solid, box, cylinderBetween, metreUV, drum, roundSolid };
}
export type Kit = ReturnType<typeof createKit>;

/** Lab helper: collects a piece into one mesh per material. */
export function pieceGroup(build: (kit: Kit) => void, fallback: THREE.Material) {
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  build(
    createKit(
      {
        geometry(geometry, material) {
          const list = batches.get(material) ?? [];
          list.push(geometry.index ? geometry.toNonIndexed() : geometry);
          batches.set(material, list);
        },
        solid() {},
      },
      fallback,
    ),
  );
  const group = new THREE.Group();
  for (const [material, geometries] of batches)
    for (const geometry of geometries) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
  return group;
}

/** Items fixed to a round wall: angle 0 faces the approach (+Z), positive angles turn east. */
export function onDrum(x: number, z: number, r: number, angle: number) {
  return { x: x + Math.sin(angle) * r, z: z + Math.cos(angle) * r };
}

/** E2.1 gate layout, in world metres. The gate axis is x = 4; +Z faces the approach. */
export const GATE = {
  x: 4,
  face: -16.2,
  rear: -19.8,
  span: 2.2,
  spring: 3.3,
  arch: 5.5,
  top: 10,
  grille: -16.75,
  hoardFront: -15.05,
  towerZ: -15,
  towerRadius: 3.1,
  towerFoot: 3.55,
  towerTop: 12.4,
  towers: [
    { x: -2, side: -1 },
    { x: 10, side: 1 },
  ],
} as const;

function archOutline<T extends THREE.Path>(path: T) {
  path.moveTo(-GATE.span, 0);
  path.lineTo(GATE.span, 0);
  path.lineTo(GATE.span, GATE.spring);
  path.absarc(0, GATE.spring, GATE.span, 0, Math.PI, false);
  path.lineTo(-GATE.span, 0);
  return path;
}

/**
 * The fortress gate after the «Puerta de hierro» concept: two round towers stand forward of the curtain and frame a
 * recessed gatehouse. Its arch holds a lowered portcullis before the timber door; a timber hoarding crowns it.
 * Torches are not included: they animate and live in the world.
 */
export function buildGate(kit: Kit, m: PieceMaterials) {
  const { add, solid, box, cylinderBetween, metreUV, drum, roundSolid } = kit;
  const { stone, trim, wood, iron, dark, banner, slate } = m;
  const gateX = GATE.x,
    gateFace = GATE.face,
    gateRear = GATE.rear,
    gateSpan = GATE.span,
    gateSpring = GATE.spring,
    gateArch = GATE.arch,
    gateTop = GATE.top;
  // Gatehouse block with the passage vault cut through it.
  const gatehouse = new THREE.Shape();
  gatehouse.moveTo(-3.4, 0);
  gatehouse.lineTo(3.4, 0);
  gatehouse.lineTo(3.4, gateTop);
  gatehouse.lineTo(-3.4, gateTop);
  gatehouse.lineTo(-3.4, 0);
  gatehouse.holes.push(archOutline(new THREE.Path()));
  add(
    metreUV(
      new THREE.ExtrudeGeometry(gatehouse, { depth: gateFace - gateRear, bevelEnabled: false, curveSegments: 20 }),
    ),
    stone,
    [gateX, 0, gateRear],
  );
  solid(gateX - 3.4, 0, gateRear, gateX - gateSpan, gateTop, gateFace);
  solid(gateX + gateSpan, 0, gateRear, gateX + 3.4, gateTop, gateFace);
  solid(gateX - gateSpan, gateSpring, gateRear, gateX + gateSpan, gateTop, gateFace); // Above head height: camera only.
  // Voussoirs, keystone and imposts stand slightly proud of the face.
  for (let i = 0; i < 13; i++) {
    const a = ((i + 0.5) * Math.PI) / 13,
      key = i === 6,
      r = gateSpan + 0.27 + (key ? 0.06 : 0);
    const g = new THREE.BoxGeometry(0.56, key ? 0.62 : 0.5, key ? 0.48 : 0.4);
    g.rotateZ(a - Math.PI / 2);
    add(g, trim, [gateX + Math.cos(a) * r, gateSpring + Math.sin(a) * r, gateFace + 0.12]);
  }
  for (const side of [-1, 1])
    box(gateX + side * (gateSpan + 0.3), gateSpring - 0.12, gateFace + 0.1, 0.72, 0.24, 0.32, trim);
  // Timber door deep in the passage, seen through the portcullis.
  add(
    metreUV(
      new THREE.ExtrudeGeometry(archOutline(new THREE.Shape()), { depth: 0.3, bevelEnabled: false, curveSegments: 20 }),
    ),
    wood,
    [gateX, 0, -19],
  );
  for (let n = -1.8; n <= 1.81; n += 0.6)
    box(
      gateX + n,
      (gateSpring + Math.sqrt(gateSpan ** 2 - n * n)) / 2,
      -18.69,
      0.04,
      gateSpring + Math.sqrt(gateSpan ** 2 - n * n) - 0.1,
      0.02,
      dark,
    );
  for (const y of [0.8, 2.1, 3.4]) box(gateX, y, -18.66, 2 * gateSpan - 0.12, 0.14, 0.06, iron);
  // Lowered portcullis: the fortress is shut, and the grid reads against the lit door from the approach.
  const grille = GATE.grille;
  for (let n = -2; n <= 2.01; n += 0.4) {
    const h = gateSpring + Math.sqrt(Math.max(0, gateSpan ** 2 - n * n)) - 0.04;
    box(gateX + n, h / 2, grille, 0.11, h, 0.11, iron);
  }
  for (let y = 0.45; y < gateArch - 0.2; y += 0.6) {
    const lift = Math.max(0, y - gateSpring),
      half = Math.sqrt(gateSpan ** 2 - lift * lift) - 0.03;
    box(gateX, y, grille + 0.08, 2 * half, 0.09, 0.07, iron);
  }
  solid(gateX - gateSpan, 0, grille - 0.1, gateX + gateSpan, gateArch, grille + 0.15);
  // Timber hoarding on joists and struts between the towers, under a slate pentice.
  const hoardFront = GATE.hoardFront;
  for (const n of [-2.4, -0.8, 0.8, 2.4]) {
    box(gateX + n, 6.86, (gateFace + hoardFront) / 2 + 0.05, 0.22, 0.24, gateFace - hoardFront + 0.3, wood);
    cylinderBetween(
      new THREE.Vector3(gateX + n, 6.05, gateFace),
      new THREE.Vector3(gateX + n, 6.8, hoardFront + 0.2),
      0.08,
      0.08,
      wood,
    );
  }
  box(gateX, 7.03, (gateFace + hoardFront) / 2, 5.7, 0.1, gateFace - hoardFront, wood);
  box(gateX, 8, hoardFront, 5.7, 1.9, 0.16, wood);
  box(gateX, 8.95, hoardFront + 0.02, 5.8, 0.18, 0.24, wood);
  for (let n = -2.6; n <= 2.61; n += 0.45) box(gateX + n, 8, hoardFront + 0.085, 0.035, 1.86, 0.02, dark);
  for (const n of [-1.8, -0.6, 0.6, 1.8]) box(gateX + n, 8.1, hoardFront + 0.09, 0.22, 0.5, 0.02, dark);
  // Siege damage: a board torn out and another hanging from a single nail.
  box(gateX + 1.22, 7.55, hoardFront + 0.095, 0.4, 0.9, 0.02, dark);
  const loose = new THREE.BoxGeometry(0.38, 1.05, 0.05);
  loose.rotateZ(0.55);
  add(loose, wood, [gateX + 1.5, 6.95, hoardFront + 0.16]);
  const pentice = new THREE.BoxGeometry(5.9, 0.1, 1.6);
  pentice.rotateX(Math.atan2(0.85, 1.35));
  add(pentice, slate, [gateX, 9.35, (gateFace + hoardFront) / 2 - 0.05]);
  // Crenellations front and back on the gatehouse roof, over a cornice; capped merlons, one broken at the front.
  box(gateX, gateTop - 0.08, (gateFace + gateRear) / 2, 6.92, 0.16, gateFace - gateRear + 0.12, trim);
  for (const z of [gateFace - 0.25, gateRear + 0.25])
    for (const n of [-2.7, -1.35, 0, 1.35, 2.7]) {
      if (z === gateFace - 0.25 && n === 1.35) {
        box(gateX + n, gateTop + 0.25, z, 0.8, 0.5, 0.5);
        box(gateX + n - 0.16, gateTop + 0.58, z + 0.04, 0.42, 0.22, 0.4, stone, false, 0.35);
        continue;
      }
      box(gateX + n, gateTop + 0.45, z, 0.8, 0.9, 0.5);
      box(gateX + n, gateTop + 0.96, z, 0.92, 0.12, 0.6, trim);
    }
  // Flanking towers: battered foot, string course, machicolated crown, slits, banners and a flag.
  for (const { x, side } of GATE.towers) {
    const r = GATE.towerRadius,
      top = GATE.towerTop,
      z = GATE.towerZ;
    drum(x, 1.3, z, r, GATE.towerFoot, 2.6, stone);
    drum(x, 2.75, z, r + 0.1, r + 0.1, 0.3, trim);
    drum(x, (2.6 + top) / 2, z, r, r, top - 2.6, stone);
    drum(x, top + 0.25, z, r + 0.42, r + 0.42, 0.5, trim);
    drum(x, top + 0.72, z, r + 0.42, r + 0.42, 0.45, stone);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2,
        p = onDrum(x, z, r + 0.2, a);
      box(p.x, top - 0.3, p.z, 0.36, 0.6, 0.44, trim, false, a);
    }
    // Capped merlons; two per tower lost to the siege, their stones lying at the foot.
    const damage = side < 0 ? { broken: 10, fallen: 4 } : { broken: 2, fallen: 1 };
    for (let i = 0; i < 12; i++) {
      const a = ((i + 0.5) / 12) * Math.PI * 2,
        p = onDrum(x, z, r + 0.24, a);
      if (i === damage.fallen) continue;
      if (i === damage.broken) {
        box(p.x, top + 1.2, p.z, 0.95, 0.5, 0.45, stone, false, a);
        const chip = onDrum(x, z, r + 0.2, a - 0.06);
        box(chip.x, top + 1.53, chip.z, 0.42, 0.24, 0.36, stone, false, a + 0.4);
        continue;
      }
      box(p.x, top + 1.4, p.z, 0.95, 0.9, 0.45, stone, false, a);
      box(p.x, top + 1.91, p.z, 1.06, 0.12, 0.56, trim, false, a);
    }
    for (const [i, count] of [
      [damage.fallen, 4],
      [damage.broken, 2],
    ]) {
      const a = ((i + 0.5) / 12) * Math.PI * 2;
      for (let k = 0; k < count; k++) {
        const chunk = new THREE.IcosahedronGeometry(1, 0),
          size = 0.42 - k * 0.06,
          p = onDrum(x, z, GATE.towerFoot + 0.45 + k * 0.38, a + (k % 2 ? 0.09 : -0.07) * (k + 1));
        chunk.scale(size * 1.3, size * 0.75, size);
        chunk.rotateX(0.4 * k + 0.2);
        add(chunk, k % 2 ? trim : stone, [p.x, size * 0.45, p.z], a + k * 1.3);
      }
    }
    roundSolid(x, z, GATE.towerFoot, top + 1.85);
    for (const [angle, y] of [
      [0, 5.4],
      [side * 0.95, 6.8],
      [-side * 0.95, 6.8],
      [-side * 1.65, 9.6],
    ]) {
      const p = onDrum(x, z, r + 0.01, angle),
        sill = onDrum(x, z, r + 0.06, angle);
      box(p.x, y, p.z, 0.18, 1.25, 0.06, dark, false, angle);
      box(sill.x, y - 0.68, sill.z, 0.5, 0.12, 0.16, trim, false, angle);
    }
    const front = z + r;
    box(x, 11.35, front + 0.14, 1.7, 0.07, 0.07, iron);
    const cloth = new THREE.Shape();
    cloth.moveTo(-0.65, 1.9);
    cloth.lineTo(0.65, 1.9);
    cloth.lineTo(0.65, -0.6);
    cloth.lineTo(0.58, -0.75);
    cloth.lineTo(0.62, -1.3);
    for (const [px, py] of [
      [0.45, -1.62],
      [0.34, -1.45],
      [0.2, -1.88],
      [0.02, -1.6],
      [-0.12, -1.9],
      [-0.3, -1.52],
      [-0.42, -1.74],
      [-0.65, -1.5],
    ])
      cloth.lineTo(px, py);
    cloth.lineTo(-0.65, 1.9);
    const tear = new THREE.Path();
    tear.moveTo(0.18, -0.95);
    tear.lineTo(0.3, -1.08);
    tear.lineTo(0.2, -1.22);
    tear.lineTo(0.12, -1.06);
    cloth.holes.push(tear);
    // Mirrored on the west tower so the two banners are torn differently.
    add(new THREE.ShapeGeometry(cloth).scale(side, 1, 1), banner, [x, 9.4, front + 0.1]);
    box(x, 9.1, front + 0.13, 0.12, 2.1, 0.02, trim);
    box(x, 9.45, front + 0.14, 0.7, 0.12, 0.02, trim);
    box(x, top + 3.1, z, 0.09, 4.3, 0.09, iron);
    const pennant = new THREE.Shape();
    pennant.moveTo(0, 0.36);
    pennant.lineTo(1.5, 0.3);
    pennant.lineTo(1.05, 0);
    pennant.lineTo(1.5, -0.3);
    pennant.lineTo(0, -0.36);
    pennant.lineTo(0, 0.36);
    const flag = new THREE.ShapeGeometry(pennant);
    flag.scale(-side, 1, 1);
    add(flag, banner, [x + side * 0.05, top + 4.6, z]);
  }
}

/** The battering ram that never reached the gate: one wheel lost, its south roof burnt away. Head towards local −X. */
export function buildRam(kit: Kit, m: PieceMaterials, x: number, z: number, heading: number) {
  const { wood, bark, iron } = m;
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, local: number[]) => {
    geo.translate(local[0], local[1], local[2]);
    kit.add(geo, mat, [x, 0, z], heading);
  };
  for (const [lx, lz] of [
    [1.6, 1.15],
    [1.6, -1.15],
    [-1.6, -1.15],
  ]) {
    const wheel = new THREE.CylinderGeometry(0.55, 0.55, 0.18, 12);
    wheel.rotateX(Math.PI / 2);
    part(wheel, wood, [lx, 0.55, lz]);
  }
  part(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 12), wood, [-2.4, 0.09, 2.2]);
  for (const lz of [-0.95, 0.95]) {
    part(new THREE.BoxGeometry(5, 0.22, 0.24), wood, [0, 0.75, lz]);
    part(new THREE.BoxGeometry(4.2, 0.18, 0.18), wood, [0, 2.5, lz]);
  }
  for (const lx of [-2, 0, 2]) part(new THREE.BoxGeometry(0.2, 0.2, 2.1), wood, [lx, 0.75, 0]);
  for (const lx of [-1.9, 1.9])
    for (const lz of [-0.95, 0.95]) part(new THREE.BoxGeometry(0.18, 1.75, 0.18), wood, [lx, 1.62, lz]);
  part(new THREE.BoxGeometry(4.6, 0.16, 0.16), wood, [0, 3.2, 0]);
  const slope = Math.atan2(0.75, 1.25);
  const north = new THREE.BoxGeometry(4.6, 0.08, 1.5);
  north.rotateX(-slope);
  part(north, wood, [0, 2.83, -0.62]);
  const burnt = new THREE.BoxGeometry(2.4, 0.08, 1.5);
  burnt.rotateX(slope);
  part(burnt, bark, [1.1, 2.83, 0.62]);
  const log = new THREE.CylinderGeometry(0.22, 0.25, 5.6, 10);
  log.rotateZ(Math.PI / 2);
  part(log, bark, [-0.5, 1.55, 0]);
  const head = new THREE.CylinderGeometry(0.3, 0.32, 0.5, 10);
  head.rotateZ(Math.PI / 2);
  part(head, iron, [-3.45, 1.55, 0]);
  for (const lx of [-1.2, 1.2]) part(new THREE.BoxGeometry(0.05, 0.85, 0.05), iron, [lx, 2.05, 0]);
  // Collision: the rotated frame and the ram's head, as world-aligned bounds.
  const c = Math.cos(heading),
    s = Math.sin(heading),
    xs: number[] = [],
    zs: number[] = [];
  for (const lx of [-3.75, 2.55])
    for (const lz of [-1.3, 1.3]) {
      xs.push(x + c * lx + s * lz);
      zs.push(z - s * lx + c * lz);
    }
  kit.solid(Math.min(...xs), 0, Math.min(...zs), Math.max(...xs), 2.6, Math.max(...zs));
}

/** An upright barrel with two iron hoops; it collides. */
export function buildBarrel(kit: Kit, m: PieceMaterials, x: number, z: number) {
  kit.add(new THREE.CylinderGeometry(0.4, 0.4, 0.95, 12), m.wood, [x, 0.475, z]);
  for (const y of [0.18, 0.77]) kit.add(new THREE.CylinderGeometry(0.415, 0.415, 0.06, 12, 1, true), m.iron, [x, y, z]);
  kit.solid(x - 0.42, 0, z - 0.42, x + 0.42, 0.95, z + 0.42);
}

/** A siege ladder from `foot` to `top`, one rung missing. No collision: the caller adds one where it is needed. */
export function buildLadder(kit: Kit, m: PieceMaterials, foot: THREE.Vector3, top: THREE.Vector3, missing: number) {
  const heading = Math.atan2(top.x - foot.x, top.z - foot.z),
    across = new THREE.Vector3(0.38, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
  for (const sign of [-1, 1])
    kit.cylinderBetween(
      foot.clone().addScaledVector(across, sign),
      top.clone().addScaledVector(across, sign),
      0.06,
      0.05,
      m.wood,
    );
  const rungs = Math.floor(foot.distanceTo(top) / 0.42);
  for (let i = 1; i < rungs; i++) {
    if (i === missing) continue;
    const p = foot.clone().lerp(top, i / rungs);
    kit.cylinderBetween(p.clone().sub(across), p.clone().add(across), 0.03, 0.03, m.wood);
  }
}

/** An arrow stuck in the ground at `base`, its shaft along the unit vector `dir`. */
export function buildArrow(kit: Kit, m: PieceMaterials, base: THREE.Vector3, dir: THREE.Vector3) {
  const tail = base.clone().addScaledVector(dir, 0.72),
    spin = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  kit.cylinderBetween(base, tail, 0.012, 0.012, m.wood);
  for (const [w, d] of [
    [0.06, 0.008],
    [0.008, 0.06],
  ]) {
    const fin = new THREE.BoxGeometry(w, 0.12, d);
    fin.applyQuaternion(spin);
    kit.add(fin, m.feather, tail.clone().addScaledVector(dir, -0.08).toArray());
  }
}

/** A round shield on the ground, tipped `tilt` radians onto its rim. */
export function buildShield(kit: Kit, m: PieceMaterials, x: number, z: number, tilt: number, turn: number) {
  const parts: [THREE.BufferGeometry, THREE.Material][] = [
    [new THREE.CylinderGeometry(0.46, 0.46, 0.05, 14), m.wood],
    [new THREE.TorusGeometry(0.46, 0.03, 5, 16).rotateX(Math.PI / 2), m.iron],
    [new THREE.SphereGeometry(0.09, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.02, 0), m.iron],
  ];
  for (const [geo, mat] of parts) {
    geo.rotateZ(tilt);
    geo.translate(0, 0.05 + Math.sin(tilt) * 0.46, 0);
    kit.add(geo, mat, [x, 0, z], turn);
  }
}

/** A cold siege fire: ring of stones, charred logs and ash. `random` varies the stones. */
export function buildCampfire(kit: Kit, m: PieceMaterials, x: number, z: number, random: () => number) {
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2,
      rock = new THREE.IcosahedronGeometry(1, 0),
      s = 0.15 + random() * 0.08;
    rock.scale(s * 1.2, s * 0.8, s);
    kit.add(rock, m.stone, [x + Math.cos(a) * 0.62, s * 0.4, z + Math.sin(a) * 0.62], random() * 6);
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 0.8 + 0.3;
    kit.cylinderBetween(
      new THREE.Vector3(x + Math.cos(a) * 0.45, 0.06, z + Math.sin(a) * 0.45),
      new THREE.Vector3(x - Math.cos(a) * 0.3, 0.14, z - Math.sin(a) * 0.3),
      0.07,
      0.06,
      m.dark,
    );
  }
  const ash = new THREE.CircleGeometry(0.5, 14);
  ash.rotateX(-Math.PI / 2);
  kit.add(ash, m.dark, [x, 0.012, z]);
}

/** A sharpened stake from `start` to its point at `end`. */
export function buildStake(kit: Kit, m: PieceMaterials, start: THREE.Vector3, end: THREE.Vector3) {
  const along = end.clone().sub(start).normalize();
  kit.cylinderBetween(start, end, 0.07, 0.07, m.wood);
  const tip = new THREE.ConeGeometry(0.07, 0.3, 6);
  tip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), along));
  kit.add(tip, m.wood, end.clone().addScaledVector(along, 0.15).toArray());
}
