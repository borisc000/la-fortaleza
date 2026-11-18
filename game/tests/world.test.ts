import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { ThirdPersonCamera } from '../src/rendering/camera.ts';
import { PLAYER, PLAY_AREA, VIEWS } from '../src/content/config.ts';
import { overlaps, stepMovement } from '../src/domain/movement.ts';
import { Combat } from '../src/domain/combat.ts';
import { SOLDIER } from '../src/content/combat.ts';
import { createCombatView } from '../src/rendering/combat.ts';
import { Run } from '../src/domain/run.ts';
import { Navigation } from '../src/domain/navigation.ts';

test('the actual fortress builds with fallback materials and every viewpoint has a safe camera', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({ materials: { castle_wall_slates: material, cobblestone_floor_04: material, brown_mud_02: material, weathered_brown_planks: material }, failures: [], dispose() {} });
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
    const camera = new ThirdPersonCamera(); camera.resize(1440, 900);
    for (const view of VIEWS) {
      const anchor = new THREE.Vector3(view.position[0], view.position[1], view.position[2]);
      for (let i = 0; i < 64; i++) {
        camera.reset(i / 64 * Math.PI * 2); camera.update(anchor, world.obstacles, 1 / 60);
        assert.ok(camera.distance > .5, `${view.label}: unsafe camera origin`);
        assert.ok(camera.distance <= camera.desiredDistance);
      }
    }
    const wallView = VIEWS[1]; camera.reset(wallView.yaw);
    camera.update(new THREE.Vector3(...[...wallView.position] as [number, number, number]), world.obstacles, 1 / 60);
    assert.equal(camera.obstructed, true); assert.ok(camera.distance < 3);
  } finally { world.dispose(); }
});

test('walking from every spawn across the real clearing preserves body and camera clearance', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({ materials: { castle_wall_slates: material, cobblestone_floor_04: material, brown_mud_02: material, weathered_brown_planks: material }, failures: [], dispose() {} });
  const camera = new ThirdPersonCamera(); camera.resize(1440, 900);
  try {
    for (const view of VIEWS) {
      for (let heading = 0; heading < 12; heading++) {
        const body = { x: view.position[0], z: view.position[2], yaw: view.yaw };
        const yaw = heading / 12 * Math.PI * 2; camera.reset(yaw);
        assert.equal(world.movementSolids.some(box => overlaps(body, PLAYER.radius, box)), false);
        for (let tick = 0; tick < 300; tick++) {
          stepMovement(body, { right: 0, forward: 1 }, yaw, PLAYER.step, PLAYER, PLAY_AREA, world.movementSolids);
          assert.equal(world.movementSolids.some(box => overlaps(body, PLAYER.radius, box)), false);
          assert.ok(body.x >= PLAY_AREA.minX + PLAYER.radius - 1e-6 && body.x <= PLAY_AREA.maxX - PLAYER.radius + 1e-6);
          assert.ok(body.z >= PLAY_AREA.minZ + PLAYER.radius - 1e-6 && body.z <= PLAY_AREA.maxZ - PLAYER.radius + 1e-6);
          camera.update(new THREE.Vector3(body.x, 0, body.z), world.obstacles, PLAYER.step);
          assert.ok(camera.distance > .05, `Blocked camera at ${body.x}, ${body.z}`);
        }
      }
    }
  } finally { world.dispose(); }
});

test('the full five-soldier encounter completes on the actual map with unique deaths', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({ materials: { castle_wall_slates: material, cobblestone_floor_04: material, brown_mud_02: material, weathered_brown_planks: material }, failures: [], dispose() {} });
  const combat = new Combat(PLAY_AREA, world.movementSolids), body = { x: 0, z: 7, yaw: 0 };
  const view = createCombatView(world.scene), deaths = new Set<number>(), camera = new THREE.PerspectiveCamera();
  try {
    view.update(combat, new THREE.Vector3(0, 0, 7), camera, 0, 0);
    for (const enemy of combat.enemies) assert.equal(world.movementSolids.some(box => overlaps(enemy, SOLDIER.radius, box)), false);
    for (let tick = 0; tick < 3600 && combat.status === 'running'; tick++) {
      combat.step(PLAYER.step, body);
      for (const enemy of combat.enemies) assert.equal(world.movementSolids.some(box => overlaps(enemy, SOLDIER.radius, box)), false);
      for (const event of combat.takeEvents()) if (event.type === 'death') { assert.equal(deaths.has(event.target), false); deaths.add(event.target); }
    }
    assert.notEqual(combat.status, 'running');
    assert.equal(combat.kills, [...deaths].filter(id => id !== 0).length);
    const before = combat.time; combat.step(1, body); assert.equal(combat.time, before);
    console.log(`Encuentro real: ${combat.status}, ${combat.time.toFixed(2)} s, ${combat.kills} bajas, ${combat.hp} vida (simulación sin GPU).`);
    view.reset(); view.update(new Combat(PLAY_AREA, world.movementSolids), new THREE.Vector3(0, 0, 7), camera, 0, 0);
  } finally { view.dispose(); world.dispose(); }
});

test('a pursuer routes around the actual ruin rather than attacking through its walls', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({ materials: { castle_wall_slates: material, cobblestone_floor_04: material, brown_mud_02: material, weathered_brown_planks: material }, failures: [], dispose() {} });
  const body = { x: -9, z: 2, yaw: 0 }, combat = new Combat(PLAY_AREA, world.movementSolids, [{ x: -18.2, z: -7 }]);
  combat.cooldown = 999;
  try {
    for (let tick = 0; tick < 1800 && combat.hp === 100; tick++) {
      combat.step(PLAYER.step, body);
      assert.equal(world.movementSolids.some(box => overlaps(combat.enemies[0], SOLDIER.radius, box)), false);
    }
    assert.ok(combat.hp < 100, 'The soldier must reach the player after going around the ruins');
  } finally { world.dispose(); }
});

test('reinforcements have enough safe reachable positions across the actual clearing', () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({ materials: { castle_wall_slates: material, cobblestone_floor_04: material, brown_mud_02: material, weathered_brown_planks: material }, failures: [], dispose() {} });
  const run = new Run(PLAY_AREA, world.movementSolids), nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius);
  const center = { x: 0, z: 7 }; nav.update(center); let checked = 0;
  try {
    for (let x = -22; x <= 27; x += 7) for (let z = -19; z <= 27; z += 7) {
      const hero = { x, z };
      if (world.movementSolids.some(s => overlaps(hero, PLAYER.radius, s)) || !nav.waypoint(hero, center)) continue;
      const positions = run.reinforcementPositions(hero, 8); assert.equal(positions.length, 8, JSON.stringify(hero)); checked++;
      for (const p of positions) {
        assert.ok(Math.hypot(p.x - x, p.z - z) >= 8);
        assert.equal(world.movementSolids.some(s => overlaps(p, SOLDIER.radius, s)), false);
        assert.ok(nav.waypoint(p, center));
      }
    }
    assert.ok(checked > 10); console.log(`Refuerzos: ${checked} posiciones del jugador verificadas sobre el mapa real.`);
  } finally { world.dispose(); }
});
