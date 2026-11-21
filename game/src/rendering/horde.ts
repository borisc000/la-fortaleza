import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Enemy } from '../domain/combat.ts';
import { CAMPAIGN } from '../content/campaign.ts';
import { ENEMIES } from '../content/enemies.ts';

type Point = [number, number, number];
const BONE = 0xb3a78d,
  SHROUD = 0x69574b,
  LINEN = 0x847059,
  EARTH = 0x544238;

function section([x, y, z]: Point, width: number, depth: number, sides = 8): Point[] {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (2 * Math.PI * (i + 0.5)) / sides;
    return [x + Math.cos(angle) * width, y, z + Math.sin(angle) * depth];
  });
}

/** Closed hull between equally sized rings, ordered from bottom to top. */
function hull(rings: Point[][], opening?: { ring: number; side: number }) {
  const sides = rings[0].length,
    top = (rings.length - 1) * sides,
    indices: number[] = [];
  for (let y = 0; y < top; y += sides) {
    for (let side = 0; side < sides; side++) {
      if (opening && y === opening.ring * sides && side === opening.side) continue;
      const a = y + side,
        b = y + ((side + 1) % sides);
      indices.push(a, a + sides, b, b, a + sides, b + sides);
    }
  }
  for (let i = 1; i < sides - 1; i++) indices.push(0, i, i + 1, top, top + i + 1, top + i);
  return surface(rings.flat(), indices);
}

function surface(points: Point[], indices: number[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Both sides of a folded cloth panel share the instanced body's opaque material. */
function rag(rows: Point[][]) {
  const width = rows[0].length,
    points = rows.flat(),
    back = points.length,
    indices: number[] = [];
  for (let row = 0; row < rows.length - 1; row++) {
    for (let col = 0; col < width - 1; col++) {
      const a = row * width + col,
        b = a + width;
      indices.push(
        a,
        a + 1,
        b,
        a + 1,
        b + 1,
        b,
        a + back,
        b + back,
        a + 1 + back,
        a + 1 + back,
        b + back,
        b + 1 + back,
      );
    }
  }
  return surface([...points, ...points], indices);
}

function createThrallGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  function part(g: THREE.BufferGeometry, tint = BONE) {
    g.deleteAttribute('uv');
    const pale = new THREE.Color(tint),
      stain = new THREE.Color(EARTH),
      worn = new THREE.Color(),
      position = g.getAttribute('position'),
      values = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const dirt = 0.38 * THREE.MathUtils.clamp(1 - position.getY(i), 0, 1);
      worn
        .copy(pale)
        .lerp(stain, dirt)
        .toArray(values, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(values, 3));
    parts.push(g);
  }
  function segment(base: Point, end: Point, rootWidth: number, tipWidth: number, tint?: number) {
    const origin = new THREE.Vector3(...base),
      tip = new THREE.Vector3(...end),
      direction = tip.clone().sub(origin);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    part(
      new THREE.CylinderGeometry(tipWidth, rootWidth, origin.distanceTo(tip), 5, 1, true)
        .applyQuaternion(rotation)
        .translate(...origin.lerp(tip, 0.5).toArray()),
      tint,
    );
  }

  // A head carried low and forward of the shoulder line, with one shoulder dragging down.
  const skullSections = [
    section([-0.031, 1.337, -0.203], 0.063, 0.067),
    section([-0.023, 1.391, -0.186], 0.091, 0.098),
    section([-0.024, 1.456, -0.156], 0.131, 0.142),
    section([-0.023, 1.526, -0.142], 0.141, 0.148),
    section([-0.033, 1.606, -0.127], 0.123, 0.122),
    section([-0.046, 1.644, -0.125], 0.073, 0.071),
  ];
  for (const ring of skullSections) {
    const widen = (ring[6][0] - ring[5][0]) * 0.37;
    ring[5][0] -= widen;
    ring[6][0] += widen;
  }
  const eyeBand = 2,
    face = 5;
  part(hull(skullSections, { ring: eyeBand, side: face }));
  const lower = skullSections[eyeBand],
    upper = skullSections[eyeBand + 1];
  const facePoint = (x: number, y: number): Point => [
    THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(lower[5][0], lower[6][0], x),
      THREE.MathUtils.lerp(upper[5][0], upper[6][0], x),
      y,
    ),
    THREE.MathUtils.lerp(lower[5][1], upper[5][1], y),
    THREE.MathUtils.lerp(lower[5][2], upper[5][2], y),
  ];
  const cavity = 0x302921;
  const lining = [0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 6, 5, 2, 3, 6, 3, 7, 6, 3, 0, 7, 0, 4, 7];
  for (const left of [0, 0.5]) {
    const outer = [facePoint(left, 1), facePoint(left + 0.5, 1), facePoint(left + 0.5, 0), facePoint(left, 0)];
    const orbit = [
      facePoint(left + 0.067, left === 0 ? 0.86 : 0.73),
      facePoint(left + 0.435, left === 0 ? 0.72 : 0.89),
      facePoint(left + 0.379, 0.21),
      facePoint(left + 0.105, 0.28),
    ];
    const recess = orbit.map(([x, y, z], i): Point => [x + (i === 0 || i === 3 ? 0.009 : -0.009), y, z + 0.025]);
    part(surface([...outer, ...orbit], lining));
    part(surface([...orbit, ...recess], lining), 0x5d5040);
    part(surface(recess, [0, 1, 2, 0, 2, 3]), cavity);
  }
  part(
    surface(
      [
        [-0.019, 1.484, -0.286],
        [-0.002, 1.439, -0.293],
        [-0.039, 1.444, -0.289],
      ],
      [0, 1, 2],
    ),
    cavity,
  );
  part(
    surface(
      [
        [-0.077, 1.403, -0.264],
        [-0.025, 1.406, -0.289],
        [0.027, 1.405, -0.278],
        [0.012, 1.376, -0.278],
        [-0.05, 1.378, -0.281],
      ],
      [0, 1, 4, 1, 2, 3, 1, 3, 4],
    ),
    cavity,
  );
  part(
    surface(
      [
        [-0.052, 1.404, -0.282],
        [-0.008, 1.404, -0.291],
        [-0.013, 1.39, -0.288],
        [-0.03, 1.395, -0.29],
        [-0.047, 1.39, -0.281],
      ],
      [0, 1, 3, 1, 2, 3, 0, 3, 4],
    ),
    0xc1ae8d,
  );
  segment([0.005, 0.91, 0.052], [-0.025, 1.47, -0.105], 0.063, 0.044);
  for (let i = 0; i < 3; i++) {
    const y = 1.055 + 0.105 * i,
      halfWidth = 0.152 + 0.023 * i,
      chest = -0.141 - 0.016 * i;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-halfWidth, y + 0.037, -0.013),
      new THREE.Vector3(-halfWidth * 0.74, y + 0.012, chest + 0.026),
      new THREE.Vector3(-0.01, y - 0.024, chest),
      new THREE.Vector3(halfWidth * 0.72, y + 0.004, chest + 0.022),
      new THREE.Vector3(halfWidth, y + 0.027, -0.029),
    ]);
    part(new THREE.TubeGeometry(curve, 5, 0.022, 3));
  }
  segment([-0.016, 1.079, -0.139], [-0.01, 1.333, -0.162], 0.026, 0.031);
  part(hull([section([0, 0.765, 0.006], 0.095, 0.083), section([0, 0.861, 0.002], 0.156, 0.123)]), 0x514c40);
  segment([-0.105, 0.82, 0.028], [-0.159, 0.42, -0.09], 0.065, 0.048);
  segment([-0.159, 0.44, -0.09], [-0.18, 0.07, -0.02], 0.05, 0.034);
  segment([0.107, 0.82, 0.02], [0.171, 0.44, 0.015], 0.069, 0.047);
  segment([0.17, 0.46, 0.015], [0.196, 0.07, 0.057], 0.052, 0.034);
  for (const [x, z] of [
    [-0.18, -0.02],
    [0.196, 0.057],
  ]) {
    part(
      hull([section([x, 0.005, z - 0.064], 0.065, 0.128, 6), section([x, 0.096, z - 0.021], 0.044, 0.077, 6)]),
      0x827461,
    );
  }
  segment([-0.2, 1.355, -0.041], [-0.27, 1.04, -0.036], 0.067, 0.043);
  segment([-0.272, 1.058, -0.037], [-0.31, 0.86, -0.206], 0.045, 0.031);
  segment([0.181, 1.316, -0.073], [0.267, 1.007, -0.024], 0.067, 0.043);
  segment([0.267, 1.024, -0.025], [0.246, 0.79, -0.135], 0.045, 0.031);
  // Hunched shoulders, torn shroud and a rusted cleaver give the mass a readable outline from the game camera.
  segment([-0.203, 1.36, -0.052], [0.187, 1.322, -0.062], 0.055, 0.054);
  part(new THREE.SphereGeometry(1, 5, 3).scale(0.073, 0.057, 0.066).translate(-0.208, 1.343, -0.046));
  part(new THREE.SphereGeometry(1, 5, 3).scale(0.068, 0.054, 0.062).translate(0.186, 1.314, -0.064));
  part(
    rag([
      [
        [-0.27, 1.34, -0.08],
        [-0.19, 1.415, -0.034],
        [-0.092, 1.46, -0.01],
        [0.004, 1.44, 0.04],
        [0.109, 1.4, -0.014],
        [0.211, 1.37, -0.071],
      ],
      [
        [-0.176, 1.087, 0.005],
        [-0.135, 1.076, 0.119],
        [-0.027, 1.076, 0.081],
        [0.054, 1.043, 0.158],
        [0.148, 1.071, 0.109],
        [0.178, 1.055, 0.007],
      ],
      [
        [-0.153, 0.87, 0.042],
        [-0.113, 0.685, 0.156],
        [-0.065, 0.836, 0.113],
        [0.025, 0.772, 0.195],
        [0.143, 0.619, 0.173],
        [0.195, 0.895, 0.048],
      ],
    ]),
    SHROUD,
  );
  part(
    rag([
      [
        [-0.127, 0.869, -0.09],
        [-0.095, 0.881, -0.125],
        [-0.002, 0.874, -0.106],
        [0.056, 0.864, -0.139],
        [0.112, 0.858, -0.077],
      ],
      [
        [-0.14, 0.715, -0.07],
        [-0.097, 0.541, -0.12],
        [-0.025, 0.709, -0.095],
        [0.087, 0.632, -0.154],
        [0.132, 0.774, -0.04],
      ],
    ]),
    LINEN,
  );
  part(
    rag([
      [
        [-0.254, 1.375, -0.096],
        [-0.191, 1.415, -0.104],
        [-0.139, 1.398, -0.169],
      ],
      [
        [-0.205, 1.263, -0.114],
        [-0.147, 1.279, -0.188],
        [-0.103, 1.269, -0.197],
      ],
      [
        [-0.157, 1.104, -0.144],
        [-0.114, 1.127, -0.171],
        [-0.065, 1.185, -0.209],
      ],
    ]),
    LINEN,
  );
  part(hull([section([-0.321, 0.794, -0.247], 0.037, 0.027, 5), section([-0.309, 0.863, -0.209], 0.032, 0.035, 5)]));
  part(hull([section([0.249, 0.735, -0.137], 0.039, 0.03, 5), section([0.246, 0.802, -0.131], 0.037, 0.04, 5)]));
  part(
    surface(
      [
        [-0.352, 0.811, -0.259],
        [-0.288, 0.803, -0.274],
        [-0.299, 0.742, -0.288],
        [-0.32, 0.779, -0.282],
        [-0.345, 0.752, -0.275],
      ],
      [0, 1, 3, 1, 2, 3, 0, 3, 4],
    ),
    0xb0a083,
  );
  segment([0.244, 0.667, -0.138], [0.247, 0.825, -0.144], 0.02, 0.018, 0x3d2a20);
  const blade: Point[] = [
    [0.219, 0.717, -0.157],
    [0.3, 0.711, -0.156],
    [0.371, 0.656, -0.169],
    [0.354, 0.408, -0.169],
    [0.265, 0.354, -0.168],
    [0.227, 0.409, -0.162],
  ];
  part(hull([blade, blade.map(([x, y, z]) => [x, y, z + 0.023])]), 0x73564a);
  part(
    surface(
      [
        [0.371, 0.656, -0.171],
        [0.354, 0.408, -0.171],
        [0.265, 0.354, -0.17],
        [0.327, 0.427, -0.169],
        [0.35, 0.641, -0.171],
      ],
      [0, 1, 4, 1, 3, 4, 1, 2, 3],
    ),
    0x8c7c68,
  );
  const bodyGeometry = mergeGeometries(parts)!;
  parts.forEach(p => p.dispose());
  return bodyGeometry;
}

/** Shared low-detail bodies and warnings: three draw calls for the weak horde. */
export function createHordeView(parent: THREE.Group) {
  const bodyGeometry = createThrallGeometry();
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95 });
  const warningMaterial = new THREE.MeshBasicMaterial({
    color: 0xf09160,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const spawnMaterial = new THREE.MeshBasicMaterial({
    color: 0xd3bd83,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const sector = new THREE.RingGeometry(0.2, 1.5, 16, 1, Math.PI / 2 - Math.PI / 4, Math.PI / 2);
  sector.rotateX(-Math.PI / 2);
  const ring = new THREE.RingGeometry(0.48, 0.57, 20);
  ring.rotateX(-Math.PI / 2);
  const bodies = new THREE.InstancedMesh(bodyGeometry, material, CAMPAIGN.maxEnemies);
  const warnings = new THREE.InstancedMesh(sector, warningMaterial, CAMPAIGN.maxEnemies);
  const spawns = new THREE.InstancedMesh(ring, spawnMaterial, CAMPAIGN.maxEnemies);
  bodies.name = 'Despojos · cuerpos instanciados';
  warnings.name = 'Despojos · ataques';
  spawns.name = 'Despojos · apariciones';
  for (const mesh of [bodies, warnings, spawns]) {
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    parent.add(mesh);
  }
  bodies.receiveShadow = true;
  warnings.renderOrder = 12;
  spawns.renderOrder = 11;
  const transform = new THREE.Object3D(),
    color = new THREE.Color();
  return {
    update(enemies: readonly Enemy[], alpha: number, time: number) {
      let count = 0,
        attacking = 0,
        appearing = 0;
      for (const e of enemies) {
        if (e.kind !== 'thrall' || e.dead || count >= CAMPAIGN.maxEnemies) continue;
        transform.position.set(
          THREE.MathUtils.lerp(e.previous.x, e.x, alpha),
          e.spawnRemaining > 0
            ? (-0.8 * e.spawnRemaining) / CAMPAIGN.spawnWarning
            : Math.sin(time * 9 + e.id) * 0.025 * Math.min(1, e.speed),
          THREE.MathUtils.lerp(e.previous.z, e.z, alpha),
        );
        transform.rotation.set(0, e.attack?.yaw ?? e.yaw, 0);
        transform.scale.setScalar(0.93 + ((e.id * 37) % 15) / 100);
        transform.updateMatrix();
        bodies.setMatrixAt(count, transform.matrix);
        color.setHex(e.burn ? 0xe18a55 : e.wetRemaining > 0 ? 0x86b9c4 : e.hp < e.maxHp ? 0xc0ac90 : 0xffffff);
        bodies.setColorAt(count++, color);
        transform.position.y = 0.055;
        transform.scale.setScalar(1);
        transform.updateMatrix();
        if (e.spawnRemaining > 0) spawns.setMatrixAt(appearing++, transform.matrix);
        else if (e.attack && e.attack.age <= ENEMIES.thrall.windup + ENEMIES.thrall.active)
          warnings.setMatrixAt(attacking++, transform.matrix);
      }
      bodies.count = count;
      warnings.count = attacking;
      spawns.count = appearing;
      for (const mesh of [bodies, warnings, spawns]) mesh.instanceMatrix.needsUpdate = true;
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    },
    reset() {
      bodies.count = warnings.count = spawns.count = 0;
    },
    dispose() {
      for (const mesh of [bodies, warnings, spawns]) {
        parent.remove(mesh);
        mesh.dispose();
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    },
  };
}
