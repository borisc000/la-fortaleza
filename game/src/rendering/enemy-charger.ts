import * as THREE from 'three';
import { beveledBox, type EnemyPartBuilder, shade } from './enemy-shapes.ts';

function forgedPlate(points: readonly (readonly [number, number])[], bevel = 0.07) {
  const [start, ...rest] = points;
  const contour = new THREE.Shape();
  contour.moveTo(...start);
  for (const point of rest) contour.lineTo(...point);
  contour.closePath();
  return new THREE.ExtrudeGeometry(contour, {
    depth: 0.64,
    bevelThickness: 0.18,
    bevelSize: bevel,
    bevelSegments: 1,
  }).translate(0, 0, -0.32);
}

function horn(sign: number) {
  const segments = [
    [0.123, 1.713, -0.056, 0.048],
    [0.179, 1.735, -0.062, 0.042],
    [0.216, 1.802, -0.052, 0.032],
    [0.238, 1.872, -0.038, 0.021],
    [0.231, 1.941, -0.015, 0.012],
    [0.204, 1.979, 0.008, 0.002],
  ];
  const sides = 7;
  const positions: number[] = [],
    triangles: number[] = [];
  for (const [i, [x, y, z, radius]] of segments.entries()) {
    const lo = segments[Math.max(0, i - 1)],
      hi = segments[Math.min(segments.length - 1, i + 1)];
    const tangent = new THREE.Vector3(sign * (hi[0] - lo[0]), hi[1] - lo[1], hi[2] - lo[2]).normalize();
    const side = new THREE.Vector3(tangent.y, -tangent.x, 0).normalize();
    const up = new THREE.Vector3().crossVectors(tangent, side);
    for (let edge = 0; edge < sides; edge++) {
      const angle = (edge / sides) * Math.PI * 2;
      const vertex = new THREE.Vector3(sign * x, y, z)
        .addScaledVector(side, Math.cos(angle) * radius)
        .addScaledVector(up, Math.sin(angle) * radius);
      positions.push(vertex.x, vertex.y, vertex.z);
      if (i === 0) continue;
      const first = (i - 1) * sides + edge,
        next = (i - 1) * sides + ((edge + 1) % sides);
      triangles.push(first, next, first + sides, next, next + sides, first + sides);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

const cuirass = [
  [-0.45, 0.34],
  [-0.27, 0.45],
  [0.27, 0.45],
  [0.45, 0.34],
  [0.38, -0.12],
  [0.25, -0.38],
  [0, -0.46],
  [-0.25, -0.38],
  [-0.38, -0.12],
] as const;
const visor = [
  [-0.42, 0.43],
  [0.42, 0.43],
  [0.4, -0.24],
  [0.22, -0.41],
  [-0.22, -0.41],
  [-0.4, -0.24],
] as const;
const hammer = [
  [-0.45, 0.3],
  [-0.34, 0.43],
  [0.31, 0.39],
  [0.46, 0.22],
  [0.44, -0.28],
  [0.3, -0.42],
  [-0.36, -0.41],
  [-0.47, -0.28],
] as const;
const tornBanner = [
  [-0.42, 0.47],
  [0.44, 0.47],
  [0.37, -0.13],
  [0.44, -0.38],
  [0.14, -0.49],
  [0.02, -0.31],
  [-0.18, -0.44],
  [-0.34, -0.29],
] as const;

function siegeMaul(put: EnemyPartBuilder) {
  const haft = () => new THREE.CylinderGeometry(0.84, 1, 1, 7);
  put('arm1', 'dark', shade(haft(), 1.27), 0.091, -0.805, -0.109, 0.034, 0.807, 0.034, 0, 0.18);
  for (const y of [-0.463, -0.491, -0.605, -0.633, -0.966, -1.004]) {
    put(
      'arm1',
      'iron',
      shade(haft(), y > -0.7 ? 0.74 : 1.13),
      0.04 - (y + 0.55) * 0.18,
      y,
      -0.109,
      0.036,
      0.02,
      0.036,
      0,
      0.18,
    );
  }
  put('arm1', 'iron', shade(forgedPlate(hammer), 0.9, 0.21), 0.153, -1.116, -0.109, 0.347, 0.23, 0.224, 0, 0.18);
  for (const direction of [-1, 1]) {
    put(
      'arm1',
      'iron',
      shade(beveledBox(), 1.32),
      0.153 + direction * 0.157,
      -1.116 + direction * 0.029,
      -0.109,
      0.073,
      0.219,
      0.242,
      0,
      0.18,
    );
    put(
      'arm1',
      'iron',
      shade(new THREE.CylinderGeometry(0.72, 1, 1, 6), 0.84),
      0.127,
      -1.116,
      -0.109 + direction * 0.109,
      0.064,
      0.055,
      0.064,
      Math.PI / 2,
    );
  }
  put(
    'arm1',
    'iron',
    shade(new THREE.CylinderGeometry(0.62, 1, 1, 6), 1.14),
    0.177,
    -1.237,
    -0.109,
    0.067,
    0.076,
    0.067,
    Math.PI,
    0.18,
  );
}

function siegeColors(put: EnemyPartBuilder) {
  put(
    'body',
    'cloth',
    shade(forgedPlate(tornBanner, 0.02), 1.7, 0.33),
    -0.043,
    0.847,
    -0.125,
    0.199,
    0.345,
    0.045,
    0.2,
    0.09,
  );
  put(
    'body',
    'cloth',
    shade(forgedPlate(tornBanner, 0.02), 1.42, 0.3),
    0.097,
    1.032,
    0.176,
    0.164,
    0.509,
    0.043,
    -0.2,
    0.11,
  );
  put('body', 'cloth', shade(beveledBox(), 1.3, 0.19), 0.096, 1.47, 0.093, 0.14, 0.072, 0.13, -0.2, 0.11);
  // Old siege stripes read through the breaks in the banner and the armour.
  for (const x of [-0.082, -0.035]) {
    put('body', 'bone', shade(beveledBox(), 0.95), x, 0.924, -0.152, 0.023, 0.087, 0.008, 0.2, -0.32);
    put('body', 'bone', shade(beveledBox(), 0.72), 0.143 + x, 1.033, 0.204, 0.021, 0.071, 0.008, -0.2, -0.34);
  }
  for (const x of [-0.171, 0.171]) {
    put('body', 'iron', shade(new THREE.IcosahedronGeometry(1), 1.65), x, 1.3, -0.197, 0.019, 0.019, 0.016);
    put('body', 'iron', shade(new THREE.IcosahedronGeometry(1), 1.35), x, 1.25, 0.17, 0.017, 0.017, 0.014);
  }
  put('body', 'iron', shade(beveledBox(), 1.37), -0.122, 1.214, -0.188, 0.104, 0.013, 0.018, -0.1, 0.36);
  put('body', 'iron', shade(beveledBox(), 1.23), -0.132, 1.187, -0.185, 0.061, 0.011, 0.017, -0.1, 0.36);
}

export function addChargerKit(put: EnemyPartBuilder) {
  put(
    'body',
    'iron',
    shade(new THREE.CylinderGeometry(0.67, 1, 1, 12), 0.95),
    0,
    1.728,
    -0.061,
    0.158,
    0.191,
    0.149,
    -0.11,
  );
  put('body', 'iron', shade(forgedPlate(visor), 0.94), 0, 1.626, -0.158, 0.29, 0.242, 0.153, -0.14);
  put('body', 'iron', shade(beveledBox(), 1.33), 0, 1.737, -0.214, 0.269, 0.036, 0.064, -0.14);
  put('body', 'iron', shade(beveledBox(), 1.34), 0, 1.626, -0.239, 0.034, 0.188, 0.046, -0.14);
  put('body', 'iron', shade(new THREE.CylinderGeometry(0.79, 1, 1, 9), 0.68), 0, 1.48, -0.051, 0.153, 0.09, 0.139);
  for (const sign of [-1, 1]) {
    put('body', 'bone', shade(horn(sign), 0.75, 0.46), 0, 0, 0, 1, 1, 1);
    put(
      'body',
      'iron',
      shade(new THREE.CylinderGeometry(0.84, 1, 1, 8), 0.88),
      sign * 0.133,
      1.724,
      -0.056,
      0.06,
      0.075,
      0.058,
      0.13,
      -sign * 1.19,
    );
    put('body', 'dark', shade(beveledBox(), 0.16), sign * 0.068, 1.678, -0.24, 0.092, 0.025, 0.027, -0.14, sign * 0.13);
    put(
      'body',
      'iron',
      shade(forgedPlate(visor), 0.68),
      sign * 0.125,
      1.625,
      -0.081,
      0.146,
      0.221,
      0.109,
      -0.15,
      sign * 0.16,
      sign * -0.75,
    );
  }
  put('body', 'dark', shade(beveledBox(), 0.7), 0, 1.194, 0.021, 0.354, 0.446, 0.268);
  put('body', 'iron', shade(forgedPlate(cuirass), 0.96), 0, 1.222, -0.075, 0.444, 0.47, 0.218, -0.08);
  put('body', 'iron', shade(forgedPlate(cuirass), 1.21), 0, 1.285, -0.166, 0.402, 0.141, 0.081, -0.14);
  put('body', 'iron', shade(beveledBox(), 1.31), 0, 1.215, -0.181, 0.055, 0.324, 0.065, -0.09);
  put('body', 'iron', shade(forgedPlate(cuirass), 0.86), 0, 1.263, 0.077, 0.432, 0.374, 0.184, 0.16);
  for (const y of [1.091, 1.047]) {
    put('body', 'iron', shade(forgedPlate(cuirass), 1.12), 0, y, -0.146, 0.354, 0.085, 0.091, 0.16);
    put('body', 'iron', shade(forgedPlate(cuirass), 0.87), 0, y, 0.134, 0.347, 0.085, 0.085, -0.16);
  }
  for (const [arm, sign] of [
    ['arm0', -1],
    ['arm1', 1],
  ] as const) {
    put(
      arm,
      'iron',
      shade(forgedPlate(hammer), sign < 0 ? 1.12 : 0.97, 0.26),
      sign * 0.049,
      -0.017,
      -0.015,
      0.291,
      0.209,
      0.334,
      0.06,
      sign * -0.18,
    );
    put(
      arm,
      'iron',
      shade(forgedPlate(hammer), 0.83),
      sign * 0.07,
      -0.118,
      0.005,
      0.241,
      0.113,
      0.284,
      -0.16,
      sign * -0.11,
    );
    put(arm, 'iron', shade(beveledBox(), 1.33), sign * 0.098, -0.005, -0.166, 0.185, 0.055, 0.051, 0.08, sign * -0.17);
    put(arm, 'dark', shade(beveledBox(), 0.78), sign * 0.047, -0.211, -0.017, 0.139, 0.058, 0.143, 0.08, sign * -0.12);
  }
  siegeMaul(put);
  siegeColors(put);
}
