import type { Point } from '../domain/movement.ts';

// Spatial territories, not nearest-landmark Voronoi regions. Shared by labels and dressing.
export const SECTORS = [
  { id: 'F', name: 'Explanada y fortaleza', center: { x: 4, z: -5 }, minX: -138, maxX: 142, minZ: -20, maxZ: 18 },
  { id: 'A', name: 'Llegada y caravanas', center: { x: 20, z: 205 }, minX: -138, maxX: 142, minZ: 175, maxZ: 240 },
  {
    id: 'B',
    name: 'Campos del asedio y molinos',
    center: { x: -85, z: 145 },
    minX: -138,
    maxX: -60,
    minZ: 18,
    maxZ: 175,
  },
  { id: 'D', name: 'Bosque y atalaya', center: { x: 90, z: 100 }, minX: 38, maxX: 142, minZ: 18, maxZ: 175 },
  { id: 'C', name: 'Abadía y encrucijada', center: { x: -28, z: 110 }, minX: -60, maxX: 38, minZ: 85, maxZ: 175 },
  { id: 'E', name: 'Campamentos del cerco', center: { x: -35, z: 35 }, minX: -60, maxX: 38, minZ: 18, maxZ: 85 },
] as const;

export function sectorAt(point: Point) {
  return (
    SECTORS.find(s => point.x >= s.minX && point.x <= s.maxX && point.z >= s.minZ && point.z <= s.maxZ) ?? SECTORS[0]
  );
}

type Pair = readonly [number, number];
export type MapRoute = { id: string; name: string; kind: 'main' | 'side' | 'link'; width: number; points: Point[] };

// Round corners without overshooting the control polygon. Rendering and clearance use the same samples.
function rounded(coords: readonly Pair[]): Point[] {
  const points = coords.map(([x, z]) => ({ x, z })),
    result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1],
      b = points[i],
      c = points[i + 1];
    const before = Math.hypot(a.x - b.x, a.z - b.z),
      after = Math.hypot(c.x - b.x, c.z - b.z);
    const cut = Math.min(6, before / 3, after / 3);
    const start = { x: b.x + ((a.x - b.x) * cut) / before, z: b.z + ((a.z - b.z) * cut) / before };
    const end = { x: b.x + ((c.x - b.x) * cut) / after, z: b.z + ((c.z - b.z) * cut) / after };
    for (let j = 0; j <= 6; j++) {
      const t = j / 6,
        u = 1 - t;
      result.push({
        x: u * u * start.x + 2 * u * t * b.x + t * t * end.x,
        z: u * u * start.z + 2 * u * t * b.z + t * t * end.z,
      });
    }
  }
  result.push(points.at(-1)!);
  return result;
}
function route(id: string, name: string, kind: MapRoute['kind'], width: number, points: readonly Pair[]): MapRoute {
  return { id, name, kind, width, points: rounded(points) };
}
export const ROUTES: readonly MapRoute[] = [
  route('main', 'Camino de la fortaleza', 'main', 9, [
    [20, 205],
    [10, 175],
    [8, 130],
    [-4, 85],
    [4, 40],
    [4, -8],
  ]),
  route('west', 'Circuito del asedio', 'side', 8, [
    [10, 175],
    [-85, 160],
    [-78, 105],
    [-28, 110],
    [-35, 30],
    [4, 40],
  ]),
  route('east', 'Circuito de la atalaya', 'side', 8, [
    [10, 175],
    [90, 190],
    [90, 120],
    [100, 65],
    [50, 55],
    [4, 40],
  ]),
  route('pasture', 'Paso de poniente', 'link', 5, [
    [-78, 105],
    [-95, 65],
    [-35, 30],
  ]),
  route('crossing', 'Travesía de la abadía', 'link', 6, [
    [-28, 110],
    [8, 130],
    [90, 120],
  ]),
  route('ruins', 'Paso de las ruinas', 'link', 5, [
    [-30, 65],
    [-4, 85],
    [50, 55],
  ]),
  route('east-tower', 'Ronda de la muralla', 'link', 5, [
    [50, 55],
    [34, 24],
    [35, 2],
    [4, -8],
  ]),
];

export function segmentDistance(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    lengthSq = dx * dx + dz * dz;
  const t = lengthSq ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSq)) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.z - a.z - t * dz);
}
export function routeClearance(point: Point) {
  let distance = Infinity;
  for (const path of ROUTES)
    for (let i = 1; i < path.points.length; i++)
      distance = Math.min(distance, segmentDistance(point, path.points[i - 1], path.points[i]) - path.width / 2);
  return distance;
}
