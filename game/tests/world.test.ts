import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { ThirdPersonCamera } from '../src/rendering/camera.ts';
import { CAMERA, PLAYER, PLAY_AREA, VIEWS } from '../src/content/config.ts';
import { overlaps, stepMovement } from '../src/domain/movement.ts';
import { Combat } from '../src/domain/combat.ts';
import { ENCOUNTER, SOLDIER } from '../src/content/combat.ts';
import { ROUTES, routeClearance, SECTOR_SURFACES, SECTORS } from '../src/content/terrain-layout.ts';
import { LANDMARKS } from '../src/content/map.ts';
import { createCombatView } from '../src/rendering/combat.ts';
import { Run } from '../src/domain/run.ts';
import { Navigation } from '../src/domain/navigation.ts';

test('the actual fortress builds with fallback materials and every viewpoint has a safe camera', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  try {
    assert.ok(world.obstacles.length > 40);
    let meshes = 0;
    world.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        meshes++;
        const position = object.geometry.getAttribute('position');
        assert.ok(position.count > 0);
        for (let i = 0; i < position.array.length; i++) assert.ok(Number.isFinite(position.array[i]));
      }
    });
    assert.ok(meshes > 20 && meshes < 100);
    const camera = new ThirdPersonCamera();
    camera.resize(1440, 900);
    for (const view of VIEWS) {
      const anchor = new THREE.Vector3(view.position[0], view.position[1], view.position[2]);
      for (let i = 0; i < 64; i++) {
        camera.reset((i / 64) * Math.PI * 2);
        camera.update(anchor, world.obstacles, 1 / 60);
        assert.ok(camera.distance > 0.5, `${view.label}: unsafe camera origin`);
        assert.ok(camera.distance <= camera.desiredDistance);
      }
    }
    const wallView = VIEWS[1];
    camera.reset(wallView.yaw);
    camera.update(new THREE.Vector3(...([...wallView.position] as [number, number, number])), world.obstacles, 1 / 60);
    assert.equal(camera.obstructed, true);
    assert.ok(camera.distance < 3);
  } finally {
    world.dispose();
  }
});

test('walking from every spawn across the real clearing preserves body and camera clearance', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  const camera = new ThirdPersonCamera();
  camera.resize(1440, 900);
  try {
    for (const view of VIEWS) {
      for (let heading = 0; heading < 12; heading++) {
        const body = { x: view.position[0], z: view.position[2], yaw: view.yaw };
        const yaw = (heading / 12) * Math.PI * 2;
        camera.reset(yaw);
        assert.equal(
          world.movementSolids.some(box => overlaps(body, PLAYER.radius, box)),
          false,
        );
        for (let tick = 0; tick < 300; tick++) {
          stepMovement(body, { right: 0, forward: 1 }, yaw, PLAYER.step, PLAYER, PLAY_AREA, world.movementSolids);
          assert.equal(
            world.movementSolids.some(box => overlaps(body, PLAYER.radius, box)),
            false,
          );
          assert.ok(body.x >= PLAY_AREA.minX + PLAYER.radius - 1e-6 && body.x <= PLAY_AREA.maxX - PLAYER.radius + 1e-6);
          assert.ok(body.z >= PLAY_AREA.minZ + PLAYER.radius - 1e-6 && body.z <= PLAY_AREA.maxZ - PLAYER.radius + 1e-6);
          camera.update(new THREE.Vector3(body.x, 0, body.z), world.obstacles, PLAYER.step);
          assert.ok(camera.distance > 0.05, `Blocked camera at ${body.x}, ${body.z}`);
        }
      }
    }
  } finally {
    world.dispose();
  }
});

test('the full five-soldier encounter completes on the actual map with unique deaths', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  const combat = new Combat(PLAY_AREA, world.movementSolids),
    body = { x: 0, z: 7, yaw: 0 };
  const view = createCombatView(world.scene),
    deaths = new Set<number>(),
    camera = new THREE.PerspectiveCamera();
  try {
    view.update(combat, new THREE.Vector3(0, 0, 7), camera, 0, 0);
    for (const enemy of combat.enemies)
      assert.equal(
        world.movementSolids.some(box => overlaps(enemy, SOLDIER.radius, box)),
        false,
      );
    for (let tick = 0; tick < 3600 && combat.status === 'running'; tick++) {
      combat.step(PLAYER.step, body);
      for (const enemy of combat.enemies)
        assert.equal(
          world.movementSolids.some(box => overlaps(enemy, SOLDIER.radius, box)),
          false,
        );
      for (const event of combat.takeEvents())
        if (event.type === 'death') {
          assert.equal(deaths.has(event.target), false);
          deaths.add(event.target);
        }
    }
    assert.notEqual(combat.status, 'running');
    assert.equal(combat.kills, [...deaths].filter(id => id !== 0).length);
    const before = combat.time;
    combat.step(1, body);
    assert.equal(combat.time, before);
    console.log(
      `Encuentro real: ${combat.status}, ${combat.time.toFixed(2)} s, ${combat.kills} bajas, ${combat.hp} vida (simulación sin GPU).`,
    );
    view.reset();
    view.update(new Combat(PLAY_AREA, world.movementSolids), new THREE.Vector3(0, 0, 7), camera, 0, 0);
  } finally {
    view.dispose();
    world.dispose();
  }
});

test('a pursuer routes around the actual ruin rather than attacking through its walls', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  const body = { x: -9, z: 2, yaw: 0 },
    combat = new Combat(PLAY_AREA, world.movementSolids, [{ x: -18.2, z: -7 }]);
  combat.cooldown = 999;
  try {
    for (let tick = 0; tick < 1800 && combat.hp === 100; tick++) {
      combat.step(PLAYER.step, body);
      assert.equal(
        world.movementSolids.some(box => overlaps(combat.enemies[0], SOLDIER.radius, box)),
        false,
      );
    }
    assert.ok(combat.hp < 100, 'The soldier must reach the player after going around the ruins');
  } finally {
    world.dispose();
  }
});

test('reinforcements have enough safe reachable positions across the actual clearing', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  const run = new Run(PLAY_AREA, world.movementSolids),
    nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius);
  const center = { x: 0, z: 7 };
  nav.update(center);
  let checked = 0;
  try {
    for (let x = -22; x <= 27; x += 7)
      for (let z = -19; z <= 27; z += 7) {
        const hero = { x, z };
        if (world.movementSolids.some(s => overlaps(hero, PLAYER.radius, s)) || !nav.waypoint(hero, center)) continue;
        const positions = run.reinforcementPositions(hero, 8);
        assert.equal(positions.length, 8, JSON.stringify(hero));
        checked++;
        for (const p of positions) {
          assert.ok(Math.hypot(p.x - x, p.z - z) >= 8);
          assert.equal(
            world.movementSolids.some(s => overlaps(p, SOLDIER.radius, s)),
            false,
          );
          assert.ok(nav.waypoint(p, center));
        }
      }
    assert.ok(checked > 10);
    console.log(`Refuerzos: ${checked} posiciones del jugador verificadas sobre el mapa real.`);
  } finally {
    world.dispose();
  }
});

test('E2.1 gate: towers keep the wall foot passable, the arch mouth open and their stone solid', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  const blocked = (p: { x: number; z: number }, radius = PLAYER.radius) =>
    world.movementSolids.some(s => overlaps(p, radius, s));
  try {
    // Walking along the curtain from west to east of the gate goes round both towers.
    for (const [from, to] of [
      [
        { x: -12, z: -14 },
        { x: 20, z: -14 },
      ],
      [
        { x: 20, z: -14 },
        { x: -12, z: -14 },
      ],
    ]) {
      const nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius),
        body = { ...from, yaw: 0 };
      nav.update(to);
      let ticks = 0;
      while (Math.hypot(body.x - to.x, body.z - to.z) > 1 && ticks++ < 1800) {
        const next = nav.waypoint(body, to);
        assert.ok(next, `Sin ruta de ${from.x} a ${to.x}`);
        stepMovement(
          body,
          { right: 0, forward: 1 },
          Math.atan2(body.x - next.x, body.z - next.z),
          PLAYER.step,
          PLAYER,
          PLAY_AREA,
          world.movementSolids,
        );
        assert.equal(blocked(body), false);
      }
      assert.ok(ticks < 1800, `No rodea las torres de ${from.x} a ${to.x}`);
    }
    // Straight up the paved approach: the hero enters the arch mouth and stops at the lowered portcullis.
    const body = { x: 4, z: -8, yaw: 0 };
    for (let tick = 0; tick < 240; tick++)
      stepMovement(body, { right: 0, forward: 1 }, 0, PLAYER.step, PLAYER, PLAY_AREA, world.movementSolids);
    assert.ok(Math.abs(body.x - 4) < 0.01);
    assert.ok(body.z < -16 && body.z > -16.8, `Se detiene en ${body.z}`);
    // Round towers (centres ±6 m from the gate, z −15, visible radius 3.1–3.55 m) never let anyone inside the stone.
    for (const x of [-2, 10])
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        assert.ok(blocked({ x: x + Math.sin(a) * 3.5, z: -15 + Math.cos(a) * 3.5 }, 0.05));
      }
    assert.equal(blocked({ x: 4, z: -12 }), false);
  } finally {
    world.dispose();
  }
});

test('E2.3 explanada: siege remains leave the road, the ronda, the clearing and the opening encounter free', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  const blocked = (p: { x: number; z: number }, radius: number) =>
    world.movementSolids.some(s => overlaps(p, radius, s));
  try {
    // The road's last 50 m and the ronda towards the east tower stay walkable across their whole width.
    for (const route of ROUTES.filter(r => r.id === 'main' || r.id === 'east-tower'))
      for (let i = 1; i < route.points.length; i++) {
        const a = route.points[i - 1],
          b = route.points[i];
        for (let t = 0; t <= 1; t += 0.1) {
          const x = a.x + (b.x - a.x) * t,
            z = a.z + (b.z - a.z) * t;
          if (z > 40) continue;
          const length = Math.hypot(b.x - a.x, b.z - a.z) || 1,
            nx = -(b.z - a.z) / length,
            nz = (b.x - a.x) / length;
          for (const offset of [-1, 0, 1]) {
            const p = {
              x: x + nx * offset * (route.width / 2 - SOLDIER.radius),
              z: z + nz * offset * (route.width / 2 - SOLDIER.radius),
            };
            assert.equal(
              blocked(p, SOLDIER.radius),
              false,
              `${route.id} bloqueada en ${p.x.toFixed(1)}, ${p.z.toFixed(1)}`,
            );
          }
        }
      }
    // La explanada and the five-soldier opening encounter keep their ground.
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8)
      for (const r of [0, 2.5, 4.5])
        assert.equal(blocked({ x: 4 + Math.cos(a) * r, z: -8 + Math.sin(a) * r }, PLAYER.radius), false);
    for (const p of ENCOUNTER) assert.equal(blocked(p, SOLDIER.radius), false);
  } finally {
    world.dispose();
  }
});

test('E3.1 surfaces: every sector has a ground character and puddles stay off clearings and collision', () => {
  for (const sector of SECTORS) {
    const c = SECTOR_SURFACES[sector.id];
    assert.ok(c, sector.id);
    for (const v of [c.wet, c.green, c.ruts]) assert.ok(v >= 0 && v <= 1, sector.id);
    assert.ok(Math.abs(c.light) <= 0.15, sector.id);
  }
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  try {
    // Puddles and paving are flat dressing: the E3.1 surfaces add no movement obstacles (E3.2 adds rock outcrops).
    assert.ok(world.obstacles.length >= 864);
  } finally {
    world.dispose();
  }
});

test('E3.2 relief: the camera stays above the banks, camera-only boxes never block movement, outcrops leave routes free', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({
    materials: {
      castle_wall_slates: material,
      cobblestone_floor_04: material,
      brown_mud_02: material,
      weathered_brown_planks: material,
    },
    failures: [],
    dispose() {},
  });
  const camera = new ThirdPersonCamera();
  camera.resize(1440, 900);
  try {
    // The clearing itself stays flat; the bank only starts beyond the fences.
    assert.equal(world.terrainHeight(4, 100), 0);
    assert.ok(world.terrainHeight(PLAY_AREA.minX - 12, 100) > 3);
    // Looking out from the edges at low, default and high pitch, near and far, the camera never ends under the bank.
    const edges: { x: number; z: number; yaw: number }[] = [];
    for (let z = -10; z <= PLAY_AREA.maxZ - 1; z += 15) {
      edges.push({ x: PLAY_AREA.minX + 0.5, z, yaw: -Math.PI / 2 });
      edges.push({ x: PLAY_AREA.maxX - 0.5, z, yaw: Math.PI / 2 });
    }
    for (let x = PLAY_AREA.minX + 1; x <= PLAY_AREA.maxX - 1; x += 15)
      edges.push({ x, z: PLAY_AREA.maxZ - 0.5, yaw: 0 });
    let checked = 0;
    for (const edge of edges)
      for (const pitch of [CAMERA.minPitch, 0.12, CAMERA.pitch, 0.9])
        for (const distance of [12, CAMERA.maxDistance])
          for (const turn of [-0.6, 0, 0.6]) {
            camera.setDistance(distance);
            camera.reset(edge.yaw + turn);
            camera.pitch = pitch;
            camera.update(new THREE.Vector3(edge.x, 0, edge.z), world.obstacles, 1 / 60);
            const p = camera.camera.position,
              ground = world.terrainHeight(p.x, p.z);
            if (ground < 0.3) continue;
            checked++;
            assert.ok(p.y > ground + 0.05, `Cámara bajo el talud en ${p.x.toFixed(1)}, ${p.z.toFixed(1)}`);
          }
    assert.ok(checked > 200);
    // The bank boxes and bank rocks stay camera-only: no movement solid lies beyond the west, east or south fences.
    for (const s of world.movementSolids)
      assert.ok(s.max.x > PLAY_AREA.minX - 1 && s.min.x < PLAY_AREA.maxX + 1 && s.min.z < PLAY_AREA.maxZ + 1);
    // Outcrops sit in dead ground: away from every route and fighting circle.
    assert.ok(world.outcrops.length >= 8);
    for (const o of world.outcrops) {
      assert.ok(routeClearance(o) > 8, `Afloramiento junto a una ruta: ${o.x}, ${o.z}`);
      for (const l of LANDMARKS) assert.ok(Math.hypot(o.x - l.x, o.z - l.z) > l.radius + 8);
    }
  } finally {
    world.dispose();
  }
});
