import { EXPEDITION } from '../src/content/expedition.ts';
import { CAMPAIGN } from '../src/content/campaign.ts';
import { test } from 'node:test';
import { classTechniques, isTechnique } from '../src/content/techniques.ts';
import { isRelic } from '../src/content/relics.ts';
import { secondaryElement } from '../src/domain/progression.ts';
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
import { createEssenceView } from '../src/rendering/essence.ts';

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

for (const [classId, optional] of [['warrior', false], ['warrior', true], ['mage', true], ['archer', true]] as const) for (const affinity of (optional ? ['fire', 'water', 'earth', 'air'] as const : ['fire', 'water'] as const)) test(`the full six-minute actual-map ${classId} run reaches ${affinity} ${optional ? 'four-skill build' : 'mastery'} and boss victory (${optional ? 'capture and shop' : 'combat route'})`, () => {
  const material = new THREE.MeshStandardMaterial();
  const world = createWorld({ materials: { castle_wall_slates: material, cobblestone_floor_04: material, brown_mud_02: material, weathered_brown_planks: material }, failures: [], dispose() {} });
  const run = new Run(PLAY_AREA, world.movementSolids, 19, classId, affinity), body = { ...EXPEDITION.start };
  const nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius);
  // Isolate full-cycle correctness from human balance; only the fixture has extra health.
  run.combat.maxHp = 100000; run.combat.hp = 100000;
  let peak = 0, choices = 0, bought = false; const deaths = new Set<number>(); const kinds = new Set<string>();
  const merchant = run.exploration.objects.find(o => o.kind === 'shop')!;
  const chests = run.exploration.objects.filter(o => o.kind === 'chest').slice(0, 2);
  const desiredSecondary = (['fire', 'water', 'earth', 'air'] as const)[(['fire', 'water', 'earth', 'air'].indexOf(affinity) + (classId === 'mage' ? 2 : 1)) % 4];
  const reserved = run.shop.offers.filter(o => o.relic).map(o => o.relic!);
  try {
    for (let frame = 0; frame < 36000 && run.combat.status === 'running'; frame++) {
      if (run.progression.pending) {
        const choice = run.progression.choice()!;
        const excluded = classTechniques(classId)[['fire', 'water', 'earth', 'air'].indexOf(affinity)];
        const offered = optional ? choice.options.filter(id => isTechnique(id) && id !== excluded) : [];
        const ability = run.progression.development ? choice.options.find(id => id.startsWith('ability:') && id.includes('/learn/')) ?? choice.options.find(id => id.startsWith('ability:')) : undefined;
        const technique = ability ?? offered.find(id => !run.progression.techniques[id as keyof typeof run.progression.techniques]) ?? offered[0];
        const relic = choice.options.find(id => isRelic(id) && id !== 'relic_solitude' && !reserved.includes(id));
        const secondary = optional ? choice.options.find(id => secondaryElement(id) === desiredSecondary) ?? (choice.options.includes('secondary-affinity') ? 'secondary-affinity' : undefined) : undefined;
        // This fixture fills its third technique before spending another level on support.
        // The other routes exercise the opposite investment order.
        const fillsSlotsFirst = (classId === 'mage' && affinity === 'air') || (classId !== 'mage' && affinity === 'water');
        const learnFirst = ability?.includes('/learn/') ? ability : fillsSlotsFirst && secondary === 'secondary-affinity' && technique && !run.progression.techniques[technique as keyof typeof run.progression.techniques] ? technique : undefined;
        const option = choice.kind === 'relic' ? relic ?? 'salvage' : choice.kind === 'element' ? affinity : choice.options.includes('affinity') ? 'affinity' : learnFirst ?? secondary ?? technique ?? (choice.options.includes('damage') ? 'damage' : choice.options.find(id => id !== excluded && !secondaryElement(id)));
        if (option) assert.ok(run.choose(choice.id, option)); else assert.ok(run.fallback(choice.id));
        choices++; continue;
      }
      const enemies = run.combat.enemies.filter(e => !e.dead && e.spawnRemaining <= 0);
      const nearest = <T extends { x: number; z: number }>(items: T[]) => [...items].sort((a, b) => Math.hypot(a.x - body.x, a.z - body.z) - Math.hypot(b.x - body.x, b.z - body.z))[0];
      const core = run.progression.drops.find(d => d.core);
      const nearbyLoot = nearest(run.progression.drops);
      const excursion = optional && !bought ? chests[0].status === 'available' ? chests[0] : run.capture.state !== 'completed' ? run.capture.point : chests[1].status === 'available' ? chests[1] : merchant : undefined;
      const target = excursion ?? core ?? (nearbyLoot && Math.hypot(nearbyLoot.x - body.x, nearbyLoot.z - body.z) < 6 ? nearbyLoot : run.elite ?? nearest(enemies) ?? nearbyLoot);
      if (target) {
        nav.update(target); const waypoint = nav.waypoint(body, target);
        if (waypoint && Math.hypot(body.x - waypoint.x, body.z - waypoint.z) > .2) {
          const yaw = Math.atan2(body.x - waypoint.x, body.z - waypoint.z);
          stepMovement(body, { right: 0, forward: 1 }, yaw, PLAYER.step, { ...PLAYER, speed: run.progression.speed }, PLAY_AREA, world.movementSolids);
        }
      }
      const events = run.step(PLAYER.step, body, undefined, excursion?.kind === 'shop' || excursion?.kind === 'chest' ? excursion.id : undefined);
      if (run.shop.isOpen) {
        assert.equal(run.capture.state, 'completed');
        const offer = run.shop.offers.find(o => o.relic && !run.shop.reason(o, run.exploration, run.progression, run.combat));
        assert.ok(offer, `No affordable eligible relic: ${run.exploration.coins} coins / ${run.progression.relics}`);
        assert.ok(run.shop.buy(offer.id, run.shop.revision, run.exploration, run.progression, run.combat));
        bought = true; run.shop.close();
      }
      for (const e of events) if (e.type === 'death') { assert.equal(deaths.has(e.target), false); deaths.add(e.target); if (e.enemyKind) kinds.add(e.enemyKind); }
      peak = Math.max(peak, run.combat.enemies.filter(e => !e.dead).length);
      if (frame % 60 === 0) for (const enemy of run.combat.enemies) if (!enemy.dead) assert.equal(world.movementSolids.some(s => overlaps(enemy, enemy.radius, s)), false);
    }
    console.log('End state', JSON.stringify({ classId, affinity, optional, level: run.progression.level, rank: run.progression.affinityRank, core: run.progression.core, mastery: run.progression.mastery, slots: run.progression.development?.book.slotsUsed, secondary: run.progression.secondaryElement }));
    assert.equal(run.combat.status, 'victory'); assert.ok(run.combat.time >= 366); if (optional) {
      // Four skills compete with affinity/support; acquiring all is not guaranteed in thirteen levels.
      assert.equal(run.progression.mastery, run.progression.affinityRank === 3);
      assert.ok(run.progression.mastery || run.progression.core, 'Elite core must be collected');
    } else assert.equal(run.progression.mastery, true);
    assert.deepEqual([...kinds].sort(), ['archer', 'boss', 'charger', 'elite', 'soldier', 'thrall']);
    assert.ok(peak <= CAMPAIGN.maxEnemies); assert.equal(run.progression.pending, 0); assert.equal(run.combat.projectiles.items.length, 0);
    assert.equal(run.combat.kills, deaths.size); assert.ok(run.boss?.dead);
    if (classId !== 'warrior') assert.equal(run.combat.heroKit.state.projectiles!.length, 0);
    if (optional) { assert.ok(bought); assert.equal(run.capture.state, 'completed'); assert.ok(run.shop.spent >= 22); assert.equal(run.progression.development!.book.slotsUsed, 4); assert.ok(Object.values(run.progression.techniques).every(rank => rank >= 1 && rank <= 3)); assert.equal(run.progression.relics.length, 4); if (run.progression.secondaryElement) { assert.equal(run.progression.secondaryElement, desiredSecondary); assert.ok(run.progression.secondaryRank >= 1); } assert.equal(run.exploration.chestsOpened, 2); }
    else assert.equal(run.shop.purchases, 0);
    console.log(`Campaña ${classId} ${affinity} ${optional ? 'con captura/tienda' : 'ruta de combate'}: ${run.combat.time.toFixed(2)} s, ${run.combat.kills} bajas, nivel ${run.progression.level}, ${choices} elecciones, pico ${peak} enemigos, saldo ${run.exploration.coins}, gasto ${run.shop.spent}, técnicas ${JSON.stringify(run.progression.techniques)}, apoyo ${run.progression.secondaryElement ?? 'ninguno'} ${run.progression.secondaryRank}, reliquias ${JSON.stringify(run.progression.relics)} (sin GPU; vida ampliada solo en test).`);
  } finally { world.dispose(); }
});
