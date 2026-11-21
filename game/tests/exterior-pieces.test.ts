import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildArrow,
  buildBarrel,
  buildCampfire,
  buildGate,
  buildLadder,
  buildRam,
  buildShield,
  buildStake,
  createKit,
  createPieceMaterials,
  GATE,
  pieceGroup,
} from '../src/rendering/exterior-pieces.ts';

const material = new THREE.MeshStandardMaterial();
const assets = {
  materials: {
    castle_wall_slates: material,
    cobblestone_floor_04: material,
    brown_mud_02: material,
    weathered_brown_planks: material,
  },
  failures: [],
  dispose() {},
};

function bounds(group: THREE.Object3D) {
  const box = new THREE.Box3();
  group.traverse(o => {
    if (o instanceof THREE.Mesh) {
      const position = o.geometry.getAttribute('position');
      for (let i = 0; i < position.array.length; i++) assert.ok(Number.isFinite(position.array[i]));
      o.geometry.computeBoundingBox();
      box.union(o.geometry.boundingBox!);
    }
  });
  return box.getSize(new THREE.Vector3());
}

test('E2.4 lab pieces: the gate builds alone at its world size, with the same collision as in the world', () => {
  const m = createPieceMaterials(assets, [new THREE.Vector4(), new THREE.Vector4()]);
  const size = bounds(pieceGroup(kit => buildGate(kit, m), m.stone));
  // Two towers 12 m apart with 3.55 m feet, plus fallen merlon stones; the flagpoles rise above 17 m.
  assert.ok(size.x > 12 + 2 * GATE.towerFoot && size.x < 21, `ancho ${size.x}`);
  assert.ok(size.y > 17 && size.y < 18.5, `alto ${size.y}`);
  let solids = 0;
  buildGate(createKit({ geometry() {}, solid: () => solids++ }, m.stone), m);
  // Gatehouse 3 + portcullis 1 + two towers of 12 strips.
  assert.equal(solids, 28);
});

test('E2.4 lab pieces: siege remains build in isolation and only the ram and barrel collide', () => {
  const m = createPieceMaterials(assets, [new THREE.Vector4(), new THREE.Vector4()]);
  let solids = 0,
    meshes = 0;
  const kit = createKit({ geometry: () => meshes++, solid: () => solids++ }, m.stone);
  let seed = 3;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  buildRam(kit, m, 0, 0, 0.3);
  buildBarrel(kit, m, 4, 0);
  buildLadder(kit, m, new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 6, 1), 2);
  buildArrow(kit, m, new THREE.Vector3(1, 0, 1), new THREE.Vector3(0, 1, 0));
  buildShield(kit, m, 2, 2, 0.2, 1);
  buildCampfire(kit, m, -3, 0, random);
  buildStake(kit, m, new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 0, 0));
  assert.equal(solids, 2);
  assert.ok(meshes > 60);
});
