import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { ThirdPersonCamera } from '../src/rendering/camera.ts';
import { Run } from '../src/domain/run.ts';
import { Navigation } from '../src/domain/navigation.ts';
import { stepMovement, overlaps } from '../src/domain/movement.ts';
import type { Point } from '../src/domain/movement.ts';
import type { ClassId } from '../src/content/class-definition.ts';
import { PLAY_AREA, SIMULATION_STEP } from '../src/content/config.ts';
import { EXPEDITION } from '../src/content/expedition.ts';
import { ROUTES, sectorAt } from '../src/content/terrain-layout.ts';

const classId = (process.argv[2] ?? 'warrior') as ClassId;
assert.ok(['warrior', 'mage', 'archer'].includes(classId));
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
const run = new Run(PLAY_AREA, world.movementSolids, 19, classId, 'fire');
// Test fixture: avoid dying before reaching distant sites; production stats remain intact.
run.combat.hp = run.combat.maxHp = 100000;
const body = { ...EXPEDITION.start },
  settings = run.definition.movement;
const nav = new Navigation(PLAY_AREA, world.movementSolids, settings.radius);
const camera = new ThirdPersonCamera();
camera.resize(1440, 900);
const itinerary =
  classId === 'warrior'
    ? ([
        ['main', false],
        ['west', true],
        ['pasture', false],
      ] as const)
    : classId === 'mage'
      ? ([
          ['main', false],
          ['east-tower', true],
          ['east', true],
        ] as const)
      : ([
          ['main', false],
          ['ruins', false],
          ['crossing', true],
        ] as const);
const legs = itinerary.map(([id, reverse]) => ({
  id,
  points: reverse ? [...ROUTES.find(r => r.id === id)!.points].reverse() : ROUTES.find(r => r.id === id)!.points,
}));
const samples: number[] = [],
  sectors = new Set<string>(),
  seen = new Set<number>();
let peak = 0,
  choices = 0,
  distance = 0,
  ticks = 0,
  minCamera = Infinity,
  retracted = 0;
const routes: Array<{ id: string; seconds: number; x: number; z: number }> = [];
function choose() {
  while (run.progression.pending) {
    const choice = run.progression.choice()!;
    const option =
      choice.kind === 'element'
        ? 'fire'
        : (choice.options.find(id => id.startsWith('ability:') && id.includes('/learn/')) ??
          choice.options.find(id => id.startsWith('ability:')) ??
          choice.options[0]);
    assert.ok(run.choose(choice.id, option));
    choices++;
  }
}
function go(target: Point) {
  nav.update(target);
  let stuck = 0,
    elapsed = 0;
  while (Math.hypot(body.x - target.x, body.z - target.z) > 0.18) {
    choose();
    assert.equal(run.combat.status, 'running');
    const waypoint = nav.waypoint(body, target);
    assert.ok(waypoint, `No path ${JSON.stringify({ body, target })}`);
    const yaw = Math.atan2(body.x - waypoint.x, body.z - waypoint.z),
      before = { ...body };
    const speed = stepMovement(
      body,
      { right: 0, forward: 1 },
      yaw,
      SIMULATION_STEP,
      { ...settings, speed: run.progression.speed },
      PLAY_AREA,
      world.movementSolids,
    );
    stuck = speed < 0.05 ? stuck + SIMULATION_STEP : 0;
    assert.ok(stuck < 3, `Stuck at ${body.x},${body.z}`);
    distance += Math.hypot(body.x - before.x, body.z - before.z);
    const start = performance.now();
    const events = run.step(SIMULATION_STEP, body);
    samples.push(performance.now() - start);
    for (const event of events)
      if (event.type === 'death') {
        assert.ok(!seen.has(event.target), 'Duplicate death');
        seen.add(event.target);
      }
    ticks++;
    elapsed += SIMULATION_STEP;
    assert.ok(elapsed < 90, `Timed out at ${JSON.stringify({ body, target })}`);
    if (ticks % 60 === 0) {
      sectors.add(sectorAt(body).id);
      const enemies = run.combat.enemies.filter(e => !e.dead);
      peak = Math.max(peak, enemies.length);
      assert.ok(enemies.length <= 100);
      assert.ok(!world.movementSolids.some(s => overlaps(body, settings.radius, s)));
      for (const e of enemies)
        assert.ok(!world.movementSolids.some(s => overlaps(e, e.radius, s)), `Enemy ${e.kind} inside wall`);
      for (const angle of [yaw, yaw + Math.PI / 2, yaw + Math.PI]) {
        camera.reset(angle);
        camera.update(new THREE.Vector3(body.x, 0, body.z), world.obstacles, SIMULATION_STEP);
        assert.ok(camera.distance > 0.5);
        minCamera = Math.min(minCamera, camera.distance);
        if (camera.obstructed) retracted++;
      }
    }
  }
}
try {
  for (const leg of legs) {
    const start = run.combat.time;
    for (const point of leg.points) go(point);
    routes.push({ id: leg.id, seconds: run.combat.time - start, x: body.x, z: body.z });
  }
  // Four perimeter probes per class, independent of the combat itinerary.
  let boundaries = 0;
  for (const corner of [
    { x: -137, z: 239 },
    { x: 141, z: 239 },
    { x: -137, z: 20 },
    { x: 141, z: 20 },
  ]) {
    const probe = { ...corner, yaw: 0 };
    for (let step = 0; step < 180; step++)
      stepMovement(
        probe,
        { right: corner.x < 0 ? -1 : 1, forward: corner.z > 200 ? -1 : 1 },
        0,
        SIMULATION_STEP,
        settings,
        PLAY_AREA,
        world.movementSolids,
      );
    assert.ok(probe.x >= PLAY_AREA.minX + settings.radius - 1e-6 && probe.x <= PLAY_AREA.maxX - settings.radius + 1e-6);
    assert.ok(probe.z >= PLAY_AREA.minZ + settings.radius - 1e-6 && probe.z <= PLAY_AREA.maxZ - settings.radius + 1e-6);
    assert.ok(!world.movementSolids.some(s => overlaps(probe, settings.radius, s)));
    boundaries++;
  }
  assert.ok(run.combat.kills > 0);
  assert.ok(peak >= 15);
  assert.equal(run.combat.kills, seen.size);
  samples.sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        classId,
        routes,
        seconds: run.combat.time,
        meters: distance,
        kills: run.combat.kills,
        level: run.progression.level,
        choices,
        peak,
        sectors: [...sectors],
        boundaries,
        minCamera,
        retracted,
        cpuStepMedianMs: samples[Math.floor(samples.length / 2)],
        cpuStepP95Ms: samples[Math.floor(samples.length * 0.95)],
        scope: 'actual domain and map; 60 Hz; boosted fixture HP; no renderer, no GPU or survival balance',
      },
      null,
      2,
    ),
  );
} finally {
  world.dispose();
  material.dispose();
}
