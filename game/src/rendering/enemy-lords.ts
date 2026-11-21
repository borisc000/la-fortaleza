import * as THREE from 'three';
import { beveledBox, type EnemyPartBuilder, shade } from './enemy-shapes.ts';

type Point = readonly [number, number];

// A raised face and recessed perimeter give the plates a readable profile under oblique light.
function raisedPlate(outline: readonly Point[], depth: number, rise: number, tone: number) {
  const centerX = outline.reduce((sum, [x]) => sum + x, 0) / outline.length;
  const centerY = outline.reduce((sum, [, y]) => sum + y, 0) / outline.length;
  const surface: number[] = [];
  const colors: number[] = [];
  const vertex = ([x, y]: Point, z: number, light: number) => {
    surface.push(x, y, z);
    colors.push(tone * light, tone * light, tone * light);
  };
  const center: Point = [centerX, centerY];
  const winding = outline.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = outline[(index + 1) % outline.length];
    return sum + x * nextY - y * nextX;
  }, 0);
  const rim = winding < 0 ? outline : [...outline].reverse();
  for (const [index, point] of rim.entries()) {
    const next = rim[(index + 1) % rim.length];
    const inset: Point = [THREE.MathUtils.lerp(point[0], centerX, 0.11), THREE.MathUtils.lerp(point[1], centerY, 0.11)];
    const nextInset: Point = [
      THREE.MathUtils.lerp(next[0], centerX, 0.11),
      THREE.MathUtils.lerp(next[1], centerY, 0.11),
    ];
    vertex(point, 0, 1.04);
    vertex(next, 0, 1.04);
    vertex(inset, -rise * 0.35, 1.24);
    vertex(next, 0, 1.04);
    vertex(nextInset, -rise * 0.35, 1.24);
    vertex(inset, -rise * 0.35, 1.24);
    vertex(inset, -rise * 0.35, 0.89);
    vertex(nextInset, -rise * 0.35, 0.89);
    vertex(center, -rise, 1);
    vertex(point, depth, 0.73);
    vertex(next, 0, 0.95);
    vertex(point, 0, 0.95);
    vertex(point, depth, 0.73);
    vertex(next, depth, 0.73);
    vertex(next, 0, 0.95);
    vertex(next, depth, 0.78);
    vertex(point, depth, 0.78);
    vertex(center, depth, 0.82);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(surface, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// Two-sided mantle with sewn edges and an irregular hem. +Z is the back.
function mantle(boss: boolean) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const rows = 5;
  const hem = boss ? [0.43, 0.37, 0.44, 0.31, 0.36, 0.28, 0.43] : [0.69, 0.58, 0.62, 0.66, 0.72, 0.85, 0.9];
  const fold = [0, 0.043, -0.023, 0.051, -0.024, 0.038, 0];
  const columns = hem.length;
  const skinSize = rows * columns;
  for (const layer of [0, 1]) {
    for (let row = 0; row < rows; row++) {
      const t = row / (rows - 1);
      const width = boss ? 0.3 + 0.075 * t : 0.235 + 0.045 * t;
      for (let column = 0; column < columns; column++) {
        const u = (2 * column) / (columns - 1) - 1;
        const x = width * u - (boss ? 0 : 0.055 * t);
        const y = THREE.MathUtils.lerp(1.445 - 0.05 * u * u, hem[column], t);
        const z = (boss ? 0.175 : 0.155) + (0.315 - 0.052 * u * u) * t + fold[column] * t - 0.06 * u * u;
        positions.push(x, y, z + layer * 0.014);
        const wornEdge = column === 0 || column === columns - 1;
        const tone = (0.78 + (column % 2) * 0.27 - 0.18 * t + (wornEdge ? 0.24 : 0)) * (layer === 0 ? 0.86 : 1);
        colors.push(tone * (boss ? 1 : 1.09), tone, tone * (boss ? 1.11 : 0.92));
      }
    }
  }
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      const a = row * columns + column;
      const b = a + columns;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
      indices.push(a + skinSize, b + skinSize, a + skinSize + 1, a + skinSize + 1, b + skinSize, b + skinSize + 1);
    }
  }
  const border = [
    ...hem.map((_, index) => index),
    ...Array.from({ length: rows - 1 }, (_, index) => (index + 2) * columns - 1),
    ...hem.slice(1).map((_, index) => skinSize - 2 - index),
    ...Array.from({ length: rows - 2 }, (_, index) => (rows - 2 - index) * columns),
  ];
  for (const [index, a] of border.entries()) {
    const b = border[(index + 1) % border.length];
    indices.push(a, a + skinSize, b, b, a + skinSize, b + skinSize);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const BREASTPLATE: readonly Point[] = [
  [-0.15, 0.205],
  [0.15, 0.205],
  [0.225, 0.14],
  [0.205, -0.08],
  [0.145, -0.18],
  [0, -0.21],
  [-0.145, -0.18],
  [-0.205, -0.08],
  [-0.225, 0.14],
];
const TASSET: readonly Point[] = [
  [-0.072, 0.081],
  [0.071, 0.075],
  [0.082, -0.043],
  [0.031, -0.134],
  [-0.052, -0.103],
  [-0.081, -0.025],
];
const PAULDRON: readonly Point[] = [
  [-0.086, 0.026],
  [-0.048, 0.096],
  [0.077, 0.124],
  [0.115, 0.083],
  [0.126, 0.02],
  [0.061, -0.052],
  [-0.066, -0.05],
];

function addLordArmor(put: EnemyPartBuilder, boss: boolean) {
  put(
    'body',
    'iron',
    raisedPlate(BREASTPLATE, 0.125, 0.045, boss ? 0.94 : 0.88),
    0,
    1.228,
    -0.154,
    boss ? 1.11 : 1,
    1,
    1,
  );
  put(
    'body',
    'iron',
    raisedPlate(BREASTPLATE, 0.07, 0.024, 0.81),
    0,
    1.226,
    0.153,
    boss ? 1.12 : 1,
    0.99,
    1,
    0,
    0,
    Math.PI,
  );
  put(
    'body',
    'iron',
    shade(new THREE.CylinderGeometry(1, 0.77, 1, 8), 1.1),
    0,
    1.431,
    -0.009,
    boss ? 0.202 : 0.176,
    0.074,
    0.152,
  );
  put('body', 'iron', shade(new THREE.CylinderGeometry(1, 1, 1, 8), 0.88), 0, 1.38, -0.008, 0.22, 0.052, 0.163);

  for (const sign of [-1, 1] as const) {
    const slot = sign === -1 ? 'arm0' : 'arm1';
    const size = boss ? 1.1 : sign === -1 ? 1.02 : 0.72;
    for (const layer of [0, 1, 2]) {
      const volume = size * (1 - 0.12 * layer);
      const cap = new THREE.SphereGeometry(1, 8, 3, 0, Math.PI * 2, 0, Math.PI * 0.64);
      put(
        slot,
        'iron',
        shade(cap, 1.06 - layer * 0.13, 0.19),
        sign * (0.075 + 0.016 * layer),
        0.058 - 0.075 * layer,
        0,
        0.158 * volume,
        0.087 * volume,
        0.162 * volume,
        0,
        sign * 0.2,
      );
    }
    const edge = PAULDRON.map(([x, y]): Point => [sign * x, y + (boss && x > 0.05 ? 0.034 : 0)]);
    put(
      slot,
      'iron',
      raisedPlate(edge, 0.08, 0.038, boss ? 1.2 : 1.29),
      sign * 0.096,
      0.066,
      -0.14 * size,
      size,
      size,
      1,
      0.28,
      sign * 0.08,
      -sign * 0.38,
    );
    put(
      slot,
      'iron',
      shade(new THREE.OctahedronGeometry(1), 1.52),
      sign * 0.126,
      0.112,
      -0.157 * size,
      0.024 * size,
      0.025 * size,
      0.015,
    );
    put(
      'body',
      'iron',
      raisedPlate(TASSET, 0.027, 0.024, 0.92),
      sign * 0.126,
      0.93,
      -0.139,
      1,
      1,
      1,
      -0.15,
      sign * 0.17,
      -sign * 0.24,
    );
    put(
      'body',
      'iron',
      raisedPlate(TASSET, 0.029, 0.026, 1.02),
      sign * 0.148,
      0.88,
      -0.154,
      0.95,
      boss ? 1.2 : 0.91,
      1,
      -0.16,
      sign * 0.17,
      -sign * 0.29,
    );
  }
}

function addCoreSetting(put: EnemyPartBuilder, boss: boolean) {
  put(
    'body',
    'dark',
    shade(new THREE.CylinderGeometry(1, 1, 1, 10), 0.68),
    0,
    1.255,
    -0.203,
    0.097,
    0.034,
    0.098,
    Math.PI / 2,
  );
  const setting = boss ? new THREE.TorusGeometry(1, 0.16, 5, 4) : new THREE.TorusGeometry(1, 0.15, 5, 12);
  put('body', 'iron', shade(setting, 1.21), 0, 1.255, -0.232, boss ? 0.126 : 0.095, boss ? 0.139 : 0.1, 0.09);
  const core = boss ? new THREE.OctahedronGeometry(1) : new THREE.IcosahedronGeometry(1);
  const normals = core.getAttribute('normal');
  const colors: number[] = [];
  for (let vertex = 0; vertex < normals.count; vertex++) {
    const light = 1.07 + normals.getY(vertex) * 0.42 - normals.getX(vertex) * 0.29;
    colors.push(light, light * (boss ? 0.91 : 1), light * (boss ? 1.04 : 0.8));
  }
  core.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  put(
    'body',
    'glow',
    core,
    0,
    1.256,
    -0.245,
    boss ? 0.069 : 0.078,
    boss ? 0.096 : 0.074,
    0.051,
    0.13,
    boss ? 0 : 0.22,
    -0.2,
  );
  for (const sign of [-1, 1]) {
    put('body', 'iron', shade(new THREE.IcosahedronGeometry(1), 1.29), sign * 0.153, 1.39, -0.173, 0.026, 0.026, 0.017);
    const chain = raisedPlate(
      [
        [-0.033, 0.059],
        [0.031, 0.059],
        [0, -0.055],
      ],
      0.014,
      0.013,
      boss ? 1.17 : 1.34,
    );
    put('body', 'iron', chain, sign * 0.153, 1.336, -0.184, 0.77, 1, 1, 0, sign * 0.12);
  }
}

const CHEEK_GUARD: readonly Point[] = [
  [-0.035, 0.082],
  [0.048, 0.075],
  [0.049, -0.024],
  [0.018, -0.097],
  [-0.019, -0.054],
];

function addHeadgear(put: EnemyPartBuilder, boss: boolean) {
  put('body', 'iron', shade(new THREE.SphereGeometry(1, 10, 6), 0.99), 0, 1.718, -0.072, 0.151, 0.1, 0.14);
  for (const sign of [-1, 1]) {
    const cheek = CHEEK_GUARD.map(([x, y]): Point => [x * sign, y]);
    put(
      'body',
      'iron',
      raisedPlate(cheek, 0.027, 0.025, boss ? 1.1 : 0.9),
      sign * 0.104,
      1.625,
      -0.17,
      1,
      boss ? 1.16 : 0.93,
      1,
      0.04,
      -sign * 0.16,
      -sign * 0.67,
    );
  }

  if (boss) {
    put('body', 'iron', shade(new THREE.CylinderGeometry(1, 0.9, 1, 10), 1.24), 0, 1.782, -0.072, 0.152, 0.045, 0.143);
    for (let crest = -2; crest <= 2; crest++) {
      const height = 0.143 - 0.026 * Math.abs(crest) - (crest === -1 ? 0.033 : 0);
      const spike = raisedPlate(
        [
          [-0.032, 0],
          [0.032, 0],
          [0.008, height],
        ],
        0.022,
        0.019,
        1.27,
      );
      put(
        'body',
        'iron',
        spike,
        crest * 0.063,
        1.789,
        -0.207 + 0.016 * Math.abs(crest),
        1,
        1,
        1,
        -0.17,
        -crest * 0.13,
        -crest * 0.25,
      );
    }
    for (const sign of [-1, 1]) {
      const brow = raisedPlate(
        [
          [-0.06, 0.021],
          [0.053, 0],
          [0.035, -0.026],
          [-0.052, -0.014],
        ],
        0.026,
        0.017,
        1.21,
      );
      put('body', 'iron', brow, sign * 0.056, 1.653, -0.212, 1, 1, 1, 0, sign * 0.26, -sign * 0.26);
      put(
        'body',
        'glow',
        shade(new THREE.OctahedronGeometry(1), 0.85),
        sign * 0.049,
        1.623,
        -0.227,
        0.025,
        0.011,
        0.009,
        0,
        sign * 0.15,
      );
      const rearProng = raisedPlate(
        [
          [-0.03, 0],
          [0.032, 0],
          [sign * 0.01, 0.079],
        ],
        0.019,
        0.014,
        1.12,
      );
      put('body', 'iron', rearProng, sign * 0.099, 1.788, 0.034, 1, 1, 1, 0.17, -sign * 0.1, Math.PI - sign * 0.65);
    }
  } else {
    put('body', 'iron', shade(beveledBox(), 1.11), 0, 1.683, -0.07, 0.302, 0.03, 0.274);
    const crest = raisedPlate(
      [
        [-0.108, -0.073],
        [-0.099, 0.021],
        [-0.02, 0.068],
        [0.104, 0.048],
        [0.128, -0.085],
      ],
      0.042,
      0.018,
      1.34,
    );
    put('body', 'cloth', crest, 0.017, 1.833, -0.039, 1, 1, 1, 0, 0, Math.PI / 2);
    put('body', 'iron', shade(beveledBox(), 1.32), 0, 1.798, -0.05, 0.071, 0.034, 0.214, 0.18);
  }
}

function addMarks(put: EnemyPartBuilder, boss: boolean) {
  const signet = raisedPlate(
    [
      [0, 0.084],
      [0.062, 0.024],
      [0, -0.094],
      [-0.062, 0.024],
    ],
    0.013,
    0.008,
    boss ? 1.02 : 1.14,
  );
  const pitch = boss ? 0.32 : 0.44;
  put('body', 'iron', signet, boss ? 0 : -0.02, boss ? 1.11 : 1.154, boss ? 0.311 : 0.31, 1, 1, 1, pitch, 0, Math.PI);
  const inlay = raisedPlate(
    [
      [0, 0.051],
      [0.02, 0],
      [0, -0.053],
      [-0.02, 0],
    ],
    0.012,
    0.014,
    boss ? 0.55 : 0.73,
  );
  put('body', 'glow', inlay, boss ? 0 : -0.02, boss ? 1.11 : 1.154, boss ? 0.322 : 0.321, 1, 1, 1, pitch, 0, Math.PI);
}

function forgedBlade(boss: boolean) {
  const length = boss ? 0.75 : 0.61;
  const width = boss ? 0.066 : 0.047;
  const sections = [
    [0, 0.85, 1],
    [0.09, 1, 1],
    [0.68, 0.96, 0.85],
    [0.86, 0.78, 0.66],
  ];
  const cut = [
    [-1, 0],
    [-0.64, -0.84],
    [0, -1],
    [0.64, -0.84],
    [1, 0],
    [0.64, 0.84],
    [0, 1],
    [-0.64, 0.84],
  ];
  const positions: number[] = [];
  const colors: number[] = [];
  const vertex = (ring: number, side: number, brightness: number) => {
    const [distance, sectionWidth, height] = sections[ring];
    const [x, z] = cut[side];
    positions.push(x * width * sectionWidth, -length * distance, z * 0.023 * height);
    colors.push(brightness * (boss ? 0.88 : 1.04), brightness, brightness * (boss ? 1.08 : 0.83));
  };
  for (let side = 0; side < cut.length; side++) {
    const next = (side + 1) % cut.length;
    const edge = side % 4 === 0 || side % 4 === 3;
    const brightness = edge ? 1.72 : 1.24;
    const last = sections.length - 1;
    positions.push(0, 0, 0);
    colors.push(1, 1, 1);
    vertex(0, next, brightness);
    vertex(0, side, brightness);
    for (let ring = 0; ring < last; ring++) {
      vertex(ring, side, brightness - ring * 0.08);
      vertex(ring, next, brightness - ring * 0.08);
      vertex(ring + 1, side, brightness - (ring + 1) * 0.08);
      vertex(ring, next, brightness - ring * 0.08);
      vertex(ring + 1, next, brightness - (ring + 1) * 0.08);
      vertex(ring + 1, side, brightness - (ring + 1) * 0.08);
    }
    vertex(last, side, brightness - 0.24);
    vertex(last, next, brightness - 0.24);
    positions.push(width * (boss ? -0.19 : 0.08), -length, 0);
    colors.push(brightness, brightness, brightness);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function addSword(put: EnemyPartBuilder, boss: boolean) {
  const pitch = boss ? 0.55 : 0.44;
  const cant = boss ? 0.29 : 0.22;
  const grip = new THREE.Vector3(0.04, -0.55, -0.105);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const swordPart = (material: 'iron' | 'dark', geometry: THREE.BufferGeometry, localY: number) => {
    const mount = new THREE.Vector3(0, localY, 0).applyAxisAngle(xAxis, pitch).applyAxisAngle(zAxis, cant).add(grip);
    put('arm1', material, geometry, mount.x, mount.y, mount.z, 1, 1, 1, pitch, cant);
  };
  swordPart('dark', shade(new THREE.CylinderGeometry(0.022, 0.022, 0.174, 7), 0.93), -0.006);
  swordPart('iron', shade(new THREE.CylinderGeometry(0.027, 0.028, 0.036, 8), 1.19), -0.096);
  swordPart('iron', shade(new THREE.IcosahedronGeometry(1).scale(0.035, 0.036, 0.03), 1.19), 0.089);
  const guard: Point[] = [
    [0.011, 0.018],
    [boss ? 0.15 : 0.106, boss ? -0.014 : -0.043],
    [boss ? 0.109 : 0.074, boss ? -0.055 : -0.061],
    [0, -0.024],
  ];
  for (const sign of [-1, 1]) {
    swordPart(
      'iron',
      raisedPlate(
        guard.map(([x, y]) => [x * sign, y]),
        0.022,
        0.027,
        boss ? 1.55 : 1.25,
      ),
      -0.109,
    );
  }
  swordPart('iron', forgedBlade(boss), -0.123);
}

export function addLordKit(put: EnemyPartBuilder, kind: 'elite' | 'boss') {
  const boss = kind === 'boss';
  put('body', 'cloth', mantle(boss), 0, 0, 0, 1, 1, 1);
  addLordArmor(put, boss);
  addHeadgear(put, boss);
  addCoreSetting(put, boss);
  addMarks(put, boss);
  addSword(put, boss);
}
