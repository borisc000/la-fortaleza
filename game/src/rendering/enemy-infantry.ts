import * as THREE from 'three';
import { beveledBox, type EnemyPartBuilder, shade } from './enemy-shapes.ts';

type Point = [x: number, y: number, z: number];

function turnedProfile(profile: [radius: number, y: number][], sides = 12) {
  return new THREE.LatheGeometry(
    profile.map(([radius, y]) => new THREE.Vector2(radius, y)),
    sides,
  );
}

function plate(outline: [x: number, y: number][], thickness: number) {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 1 }).translate(
    0,
    0,
    -thickness / 2,
  );
}

function fabric(rows: Point[][], front: boolean) {
  const columns = rows[0].length;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(rows.flat(2), 3));
  const indices: number[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < columns - 1; j++) {
      const a = i * columns + j;
      const b = a + columns;
      if (front) indices.push(a, a + 1, b, a + 1, b + 1, b);
      else indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function segment(start: Point, end: Point, radius: number, sides = 5) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  const center = a.lerp(b, 0.5);
  return new THREE.CylinderGeometry(radius, radius, direction.length(), sides)
    .applyQuaternion(rotation)
    .translate(center.x, center.y, center.z);
}

function swordBlade() {
  const rings = [
    { y: 0, width: 0.04, thickness: 0.023 },
    { y: -0.072, width: 0.043, thickness: 0.023 },
    { y: -0.441, width: 0.031, thickness: 0.017 },
    { y: -0.559, width: 0.002, thickness: 0.005 },
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [i, { y, width, thickness }] of rings.entries()) {
    positions.push(-width, y, 0, 0, y, -thickness, width, y, 0, 0, y, thickness);
    if (i === 0) continue;
    const last = (i - 1) * 4;
    const current = i * 4;
    for (let j = 0; j < 4; j++) {
      const next = (j + 1) % 4;
      indices.push(last + j, last + next, current + j, last + next, current + next, current + j);
    }
  }
  indices.push(12, 13, 14, 12, 14, 15);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const faces = geometry.toNonIndexed();
  faces.computeVertexNormals();
  return faces;
}

/** Open at the face so the underlying skull stays visible beneath the hood. */
function archerHood() {
  const opening: [x: number, y: number][] = [
    [0, 0.135],
    [0.069, 0.099],
    [0.109, 0.037],
    [0.105, -0.04],
    [0.077, -0.119],
    [0, -0.143],
    [-0.078, -0.12],
    [-0.111, -0.038],
    [-0.114, 0.041],
    [-0.073, 0.101],
  ];
  const rows = [
    // Each row widens into the draped cloth, then pulls back into the tail.
    { width: 0.97, height: 0.94, y: 0, z: -0.151, point: 0.004, color: 0.48 },
    { width: 1, height: 0.99, y: 0.002, z: -0.198, point: 0.033, color: 0.82 },
    { width: 1.3, height: 1.18, y: 0.016, z: -0.131, point: 0.038, color: 1.32 },
    { width: 1.25, height: 1.23, y: 0.033, z: -0.023, point: 0.025, color: 1.1 },
    { width: 1.02, height: 1.0, y: 0.044, z: 0.08, point: 0.007, color: 0.82 },
    { width: 0.36, height: 0.37, y: 0.067, z: 0.167, point: 0, color: 0.78 },
    { width: 0, height: 0, y: 0.059, z: 0.195, point: 0, color: 0.69 },
  ];
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  rows.forEach((row, j) => {
    opening.forEach(([x, y], i) => {
      positions.push(x * row.width + j * 0.004, y * row.height + row.y, row.z - (y / 0.135) * row.point);
      const light = row.color * (1 + 0.31 * (y / 0.135) + (i % 3 === 2 ? -0.14 : 0.07));
      colors.push(light * 0.86, light, light * 1.06);
      if (j === 0) return;
      const previous = (j - 1) * opening.length;
      const current = j * opening.length;
      const next = (i + 1) % opening.length;
      indices.push(previous + i, current + i, previous + next);
      if (j < rows.length - 1) indices.push(previous + next, current + i, current + next);
    });
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function soldierHelmet(put: EnemyPartBuilder) {
  const brim = turnedProfile([
    [0.118, -0.003],
    [0.173, -0.035],
    [0.194, -0.027],
    [0.196, -0.014],
    [0.174, -0.011],
    [0.132, 0.016],
    [0.118, 0.011],
  ]);
  put('body', 'iron', shade(brim, 1.27, 0.29), 0, 1.695, -0.069, 1, 1, 0.95, 0.08, 0.035);
  const crown = turnedProfile([
    [0.128, -0.019],
    [0.145, 0.009],
    [0.122, 0.069],
    [0.069, 0.096],
    [0, 0.101],
  ]);
  put('body', 'iron', shade(crown, 1.13, 0.3), 0, 1.704, -0.062, 1, 1, 1.04, 0.08, 0.035);
  const seam = turnedProfile([
    [0.147, 0],
    [0.15, 0.007],
    [0.147, 0.017],
  ]);
  put('body', 'iron', shade(seam, 1.55, 0.27), 0, 1.704, -0.062, 1, 1, 1.04, 0.08, 0.035);
  for (const sign of [-1, 1]) {
    put('body', 'dark', shade(beveledBox(), 0.92), sign * 0.112, 1.58, -0.043, 0.036, 0.161, 0.123, 0.1, sign * 0.05);
    put('body', 'iron', shade(beveledBox(), 1.3), sign * 0.119, 1.634, -0.105, 0.035, 0.056, 0.037, 0, -sign * 0.22);
  }
}

function soldierWeapons(put: EnemyPartBuilder) {
  const shield = turnedProfile([
    [0, -0.028],
    [0.156, -0.023],
    [0.218, -0.008],
    [0.218, 0.019],
    [0.181, 0.034],
    [0.089, 0.06],
    [0, 0.064],
  ]);
  put('arm0', 'cloth', shade(shield, 1.29, 0.38), -0.065, -0.388, -0.142, 1, 1, 1.13, -Math.PI / 2, -0.12);
  const rim = turnedProfile([
    [0.202, -0.014],
    [0.223, -0.009],
    [0.226, 0.012],
    [0.218, 0.025],
    [0.199, 0.029],
  ]);
  put('arm0', 'iron', shade(rim, 1.27, 0.47), -0.065, -0.388, -0.142, 1, 1, 1.13, -Math.PI / 2, -0.12);
  const boss = turnedProfile(
    [
      [0.084, 0],
      [0.082, 0.011],
      [0.058, 0.016],
      [0.047, 0.044],
      [0.025, 0.054],
      [0, 0.058],
    ],
    10,
  );
  put('arm0', 'iron', shade(boss, 1.76, 0.41), -0.065, -0.388, -0.192, 1, 1, 1, -Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + 0.14;
    put(
      'arm0',
      'iron',
      shade(new THREE.CylinderGeometry(0.49, 0.5, 1, 5), 1.77),
      -0.065 + Math.cos(angle) * 0.208,
      -0.388 + Math.sin(angle) * 0.225,
      -0.178,
      0.021,
      0.022,
      0.022,
      Math.PI / 2,
    );
  }
  // A scuffed gate badge identifies the old garrison from across the clearing.
  const badge = plate(
    [
      [-0.086, -0.038],
      [-0.086, 0.03],
      [-0.057, 0.03],
      [-0.057, 0.012],
      [-0.031, 0.012],
      [-0.031, 0.035],
      [0.024, 0.035],
      [0.024, 0.013],
      [0.05, 0.013],
      [0.05, 0.03],
      [0.076, 0.03],
      [0.076, -0.038],
      [0.025, -0.038],
      [0.025, -0.018],
      [0, -0.006],
      [-0.026, -0.02],
      [-0.026, -0.038],
    ],
    0.003,
  );
  const surface = badge.getAttribute('position');
  for (let i = 0; i < surface.count; i++) {
    const u = surface.getX(i);
    const v = (surface.getY(i) + 0.129) / 1.13;
    const radius = Math.hypot(u, v);
    const depth = THREE.MathUtils.lerp(0.06, 0.034, (radius - 0.089) / (0.181 - 0.089));
    surface.setXYZ(i, u, depth + 0.008 - surface.getZ(i), v);
  }
  badge.computeVertexNormals();
  put('arm0', 'bone', shade(badge, 0.55, 0.24), -0.065, -0.388, -0.142, 1, 1, 1.13, -Math.PI / 2, -0.12);

  const guard = plate(
    [
      [-0.109, -0.013],
      [-0.088, 0.005],
      [-0.046, 0.008],
      [-0.033, 0.021],
      [0.032, 0.021],
      [0.049, 0.013],
      [0.098, 0.029],
      [0.106, 0.004],
      [0.062, -0.013],
      [0.034, -0.014],
      [-0.036, -0.014],
      [-0.086, -0.021],
    ],
    0.037,
  );
  put('arm1', 'iron', shade(guard, 1.26, 0.27), 0.04, -0.635, -0.107, 1, 1, 1);
  put('arm1', 'iron', shade(swordBlade(), 1.59, 0.46), 0.04, -0.64, -0.106, 1, 1, 1);
  put('arm1', 'dark', new THREE.CylinderGeometry(1, 1, 1, 7), 0.04, -0.563, -0.107, 0.027, 0.154, 0.026);
  put('arm1', 'iron', shade(beveledBox(), 1.59), 0.04, -0.478, -0.107, 0.064, 0.038, 0.05);
  const fuller = plate(
    [
      [-0.005, 0.04],
      [0.003, 0.04],
      [0.004, -0.26],
      [-0.002, -0.3],
    ],
    0.002,
  );
  put('arm1', 'iron', shade(fuller, 0.54), 0.04, -0.75, -0.13, 1, 1, 1, 0.014);
}

type CrossbowPart = (
  material: 'dark' | 'iron' | 'bone',
  geometry: THREE.BufferGeometry,
  at?: Point,
  size?: Point,
) => void;

function archerCrossbow(put: EnemyPartBuilder) {
  // The mount keeps the hand on the grip and the rail horizontal during the shot.
  const mount: CrossbowPart = (material, geometry, at = [0, 0, 0], size = [1, 1, 1]) => {
    geometry.scale(...size).translate(...at);
    put('arm1', material, geometry, 0.04, -0.55, -0.11, 1, 1, 1, -1.3);
  };
  const stock = plate(
    [
      [0.173, 0.066],
      [-0.401, 0.065],
      [-0.424, 0.032],
      [-0.394, -0.001],
      [-0.176, -0.005],
      [-0.087, -0.071],
      [-0.012, -0.086],
      [0.042, -0.021],
      [0.087, -0.04],
      [0.176, -0.049],
      [0.203, -0.006],
    ],
    0.058,
  ).rotateY(-Math.PI / 2);
  mount('dark', shade(stock, 1.43, 0.47));
  const prod = plate(
    [
      [-0.337, -0.274],
      [-0.274, -0.358],
      [-0.16, -0.405],
      [-0.042, -0.413],
      [0.042, -0.413],
      [0.16, -0.405],
      [0.274, -0.358],
      [0.337, -0.274],
      [0.303, -0.28],
      [0.254, -0.326],
      [0.147, -0.373],
      [0, -0.369],
      [-0.147, -0.373],
      [-0.254, -0.326],
      [-0.303, -0.28],
    ],
    0.025,
  ).rotateX(Math.PI / 2);
  mount('iron', shade(prod, 1.33, 0.34), [0, 0.033, 0]);
  mount('iron', shade(beveledBox(), 1.43), [0, 0.071, -0.214], [0.053, 0.018, 0.34]);
  mount('iron', shade(beveledBox(), 1.69), [0, 0.04, -0.391], [0.085, 0.065, 0.042]);
  mount('iron', shade(beveledBox(), 1.54), [0, 0.01, 0.17], [0.065, 0.11, 0.023]);
  mount('bone', shade(segment([0, 0.084, -0.13], [0, 0.084, -0.428], 0.006), 0.77));
  mount('iron', new THREE.ConeGeometry(0.015, 0.05, 4).rotateX(-Math.PI / 2), [0, 0.084, -0.449]);
  for (const sign of [-1, 1]) {
    mount('bone', shade(segment([sign * 0.317, 0.041, -0.284], [0, 0.079, -0.163], 0.006), 0.61));
    mount('iron', shade(segment([sign * 0.034, 0.019, -0.409], [sign * 0.033, 0.011, -0.483], 0.011), 1.62));
  }
  mount('iron', shade(segment([-0.034, 0.011, -0.483], [0.034, 0.011, -0.483], 0.011), 1.62));
}

function soldierArmor(put: EnemyPartBuilder) {
  const jack = fabric(
    [
      [
        [-0.143, 1.4, -0.081],
        [-0.051, 1.386, -0.14],
        [0.053, 1.388, -0.137],
        [0.155, 1.4, -0.074],
      ],
      [
        [-0.184, 1.27, -0.129],
        [-0.059, 1.244, -0.183],
        [0.066, 1.239, -0.181],
        [0.185, 1.268, -0.119],
      ],
      [
        [-0.13, 1.041, -0.12],
        [-0.036, 1.04, -0.155],
        [0.045, 1.057, -0.144],
        [0.143, 1.03, -0.086],
      ],
    ],
    true,
  );
  put('body', 'cloth', shade(jack, 1.36, 0.44), 0, 0, 0, 1, 1, 1);
  const tatters = fabric(
    [
      [
        [-0.126, 1.017, -0.142],
        [-0.045, 1.016, -0.172],
        [0.021, 1.018, -0.152],
        [0.1, 1.015, -0.138],
      ],
      [
        [-0.122, 0.82, -0.164],
        [-0.068, 0.847, -0.194],
        [0.032, 0.826, -0.152],
        [0.094, 0.821, -0.142],
      ],
      [
        [-0.113, 0.71, -0.171],
        [-0.05, 0.753, -0.181],
        [0.009, 0.685, -0.177],
        [0.074, 0.757, -0.137],
      ],
    ],
    true,
  );
  put('body', 'cloth', shade(tatters, 0.98, 0.63), 0, 0, 0, 1, 1, 1);
  const back = fabric(
    [
      [
        [-0.15, 1.373, 0.046],
        [-0.075, 1.365, 0.104],
        [0.017, 1.369, 0.108],
        [0.104, 1.35, 0.06],
      ],
      [
        [-0.182, 1.168, 0.058],
        [-0.103, 1.158, 0.127],
        [-0.013, 1.172, 0.159],
        [0.099, 1.195, 0.09],
      ],
      [
        [-0.161, 0.85, 0.092],
        [-0.11, 0.923, 0.139],
        [-0.052, 0.893, 0.155],
        [0.057, 1.025, 0.083],
      ],
    ],
    false,
  );
  put('body', 'cloth', shade(back, 1.17, 0.55), 0, 0, 0, 1, 1, 1);
  const shoulder = turnedProfile(
    [
      [0.123, -0.1],
      [0.146, -0.064],
      [0.141, -0.002],
      [0.105, 0.056],
      [0.056, 0.079],
      [0, 0.085],
    ],
    9,
  );
  put('arm1', 'iron', shade(shoulder, 1.22, 0.42), 0.018, 0.016, -0.004, 1, 1, 1.03, -0.09, -0.36);
  for (const [y, x, size] of [
    [-0.097, 0.034, 1],
    [-0.133, 0.043, 0.85],
  ]) {
    put('arm1', 'iron', shade(beveledBox(), 1.34), x, y, -0.008, 0.168 * size, 0.065, 0.226 * size, 0, -0.38);
  }
  const splitSleeve = turnedProfile(
    [
      [0.062, -0.198],
      [0.081, -0.147],
      [0.087, -0.022],
      [0.069, 0.058],
      [0, 0.076],
    ],
    8,
  );
  put('arm0', 'cloth', shade(splitSleeve, 1.03, 0.46), -0.025, -0.004, 0.003, 1.09, 1, 1.15, 0.02, -0.17);

  const strap = fabric(
    [
      [
        [0.134, 1.394, -0.091],
        [0.18, 1.374, -0.084],
      ],
      [
        [0.056, 1.255, -0.194],
        [0.111, 1.243, -0.19],
      ],
      [
        [-0.092, 1.01, -0.156],
        [-0.041, 1.018, -0.17],
      ],
    ],
    true,
  );
  put('body', 'dark', shade(strap, 1.85, 0.24), 0, 0, 0, 1, 1, 1);
  put('body', 'dark', shade(beveledBox(), 1.4), 0.047, 1.207, 0.145, 0.048, 0.42, 0.037, 0, 0.58);
  put('body', 'iron', shade(beveledBox(), 1.68), 0.075, 1.24, -0.199, 0.067, 0.057, 0.014, 0, -0.59);
  put('body', 'dark', shade(beveledBox(), 1.42), 0.075, 1.24, -0.207, 0.044, 0.034, 0.009, 0, -0.59);
  for (const [x, y, z] of [
    [-0.147, 1.29, -0.154],
    [-0.133, 1.215, -0.158],
    [0.145, 1.305, -0.143],
  ]) {
    put('body', 'iron', shade(beveledBox(), 1.31), x, y, z, 0.045, 0.055, 0.022, 0, 0.05);
  }
}

function archerClothes(put: EnemyPartBuilder) {
  const shoulderCape = fabric(
    [
      [
        [-0.142, 1.462, 0.015],
        [-0.092, 1.504, 0.086],
        [0, 1.533, 0.142],
        [0.094, 1.495, 0.074],
        [0.146, 1.468, 0.014],
      ],
      [
        [-0.274, 1.303, 0.065],
        [-0.129, 1.322, 0.146],
        [0, 1.34, 0.175],
        [0.137, 1.321, 0.16],
        [0.252, 1.331, 0.072],
      ],
      [
        [-0.19, 1.108, 0.089],
        [-0.103, 1.01, 0.138],
        [0.012, 1.123, 0.202],
        [0.114, 1.057, 0.153],
        [0.189, 1.206, 0.086],
      ],
    ],
    false,
  );
  put('body', 'cloth', shade(shoulderCape, 1.17, 0.76), 0, 0, 0, 1, 1, 1);
  const collar = fabric(
    [
      [
        [-0.137, 1.5, -0.048],
        [-0.063, 1.474, -0.14],
        [0, 1.44, -0.17],
        [0.081, 1.475, -0.134],
        [0.134, 1.48, -0.047],
      ],
      [
        [-0.246, 1.365, -0.035],
        [-0.129, 1.354, -0.15],
        [0.005, 1.355, -0.186],
        [0.14, 1.357, -0.141],
        [0.238, 1.377, -0.038],
      ],
      [
        [-0.181, 1.3, -0.095],
        [-0.087, 1.252, -0.168],
        [0.017, 1.224, -0.185],
        [0.128, 1.296, -0.138],
        [0.201, 1.33, -0.052],
      ],
    ],
    true,
  );
  put('body', 'cloth', shade(collar, 1.4, 0.61), 0, 0, 0, 1, 1, 1);
  const veil = fabric(
    [
      [
        [-0.099, 1.572, -0.154],
        [-0.048, 1.547, -0.22],
        [0.023, 1.553, -0.228],
        [0.106, 1.574, -0.151],
      ],
      [
        [-0.079, 1.497, -0.15],
        [-0.043, 1.493, -0.213],
        [0.026, 1.486, -0.199],
        [0.081, 1.498, -0.141],
      ],
      [
        [-0.055, 1.461, -0.139],
        [-0.027, 1.452, -0.183],
        [0.029, 1.454, -0.177],
        [0.059, 1.457, -0.133],
      ],
    ],
    true,
  );
  put('body', 'cloth', shade(veil, 0.85, 0.23), 0, 0, 0, 1, 1, 1);
  put('body', 'dark', shade(beveledBox(), 1.54), -0.073, 1.197, -0.171, 0.046, 0.42, 0.033, 0, 0.57);
  put('body', 'dark', shade(beveledBox(), 1.47), -0.051, 1.164, 0.173, 0.046, 0.448, 0.031, 0, 0.53);

  const caseProfile = turnedProfile(
    [
      [0, -0.205],
      [0.04, -0.2],
      [0.05, -0.168],
      [0.059, 0.186],
      [0.068, 0.211],
      [0.061, 0.229],
      [0.048, 0.229],
      [0.042, 0.185],
    ],
    8,
  );
  put('body', 'dark', shade(caseProfile, 1.5, 0.6), -0.087, 1.146, 0.216, 1, 1, 1.23, 0.08, 0.48);
  for (const [x, y, z, radius] of [
    [-0.006, 0.988, 0.203, 0.052],
    [-0.146, 1.263, 0.226, 0.064],
  ]) {
    const binding = new THREE.CylinderGeometry(radius, radius, 0.032, 8, 1, true);
    put('body', 'iron', shade(binding, 1.15), x, y, z, 1, 1, 1.23, 0.08, 0.48);
  }
  for (const [i, offset] of [-0.03, 0.003, 0.029].entries()) {
    const boltY = 1.356 + (i % 2) * 0.039 + offset * 0.3;
    const boltX = -0.202 + offset;
    const boltZ = i === 1 ? 0.246 : 0.212;
    put('body', 'dark', new THREE.CylinderGeometry(1, 1, 1, 4), boltX, boltY, boltZ, 0.005, 0.169, 0.005, 0, 0.48);
    const feather = plate(
      [
        [0.002, 0.04],
        [0.018, 0.025],
        [0.015, -0.021],
        [-0.001, -0.049],
      ],
      0.004,
    );
    put('body', 'bone', shade(feather, 0.72, 0.52), boltX - 0.022, boltY + 0.065, boltZ, 1, 1, 1, 0, 0.48, i * 0.8);
  }
  put('body', 'dark', shade(beveledBox(), 1.73), 0.176, 0.967, 0.071, 0.11, 0.144, 0.087, 0.19, -0.2);
  put('body', 'iron', shade(beveledBox(), 1.46), 0.184, 0.99, 0.123, 0.048, 0.045, 0.022, 0.19, -0.2);
  const seam: Point[] = [
    [0.007, 1.789, -0.168],
    [0.012, 1.813, -0.047],
    [0.016, 1.791, 0.072],
    [0.02, 1.729, 0.166],
  ];
  for (let i = 1; i < seam.length; i++) {
    put('body', 'cloth', shade(segment(seam[i - 1], seam[i], 0.007, 4), 0.78), 0, 0, 0, 1, 1, 1);
  }
  for (const [arm, leg, sign, length] of [
    ['arm0', 'leg0', -1, 0.21],
    ['arm1', 'leg1', 1, 0.28],
  ] as const) {
    const sleeve = turnedProfile(
      [
        [0.057, -length],
        [0.069, -0.16],
        [0.091, -0.045],
        [0.078, 0.039],
        [0.039, 0.079],
        [0, 0.087],
      ],
      8,
    );
    put(arm, 'cloth', shade(sleeve, 1.13, 0.4), sign * 0.032, -0.003, -0.006, 1.03, 1, 1.09, 0.06, -sign * 0.12);
    put(
      arm,
      'cloth',
      shade(new THREE.CylinderGeometry(0.054, 0.055, 0.087, 7), 0.9, 0.4),
      sign * 0.042,
      -0.458,
      -0.075,
      1,
      1,
      1,
      0.25,
      sign * 0.04,
    );
    const breeches = turnedProfile(
      [
        [0.053, -0.34],
        [0.064, -0.286],
        [0.072, -0.109],
        [0.064, -0.01],
        [0, 0.01],
      ],
      7,
    );
    put(leg, 'cloth', shade(breeches, 0.76, 0.46), sign * 0.013, 0.006, 0.003, 1.13, 1, 1.03, 0.03, sign * 0.07);
  }
}

function soldierKit(put: EnemyPartBuilder) {
  soldierHelmet(put);
  soldierWeapons(put);
  soldierArmor(put);
}

function archerKit(put: EnemyPartBuilder) {
  put('body', 'cloth', archerHood(), 0, 1.61, 0, 1, 1, 1);
  archerCrossbow(put);
  archerClothes(put);
}

export function addInfantryKit(put: EnemyPartBuilder, kind: 'soldier' | 'archer') {
  if (kind === 'soldier') soldierKit(put);
  else archerKit(put);
}
