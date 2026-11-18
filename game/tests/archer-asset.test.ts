import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createArcher } from '../src/rendering/archer.ts';
import { ARCHER } from '../src/content/classes/archer.ts';

test('exported archer keeps its bow, string and hands together during draw, release and reset', async () => {
  const file = await readFile(new URL('../public/assets/models/archer-ranger.glb', import.meta.url));
  const asset = await new GLTFLoader().parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    '',
  );
  const view = createArcher(asset.scene),
    other = createArcher(asset.scene);
  const get = (name: string) => {
    const node = view.root.getObjectByName(name);
    assert.ok(node, name);
    return node;
  };
  const arrow = get('NockedArrow'),
    bow = get('Longbow'),
    left = get('GloveLeft'),
    right = get('GloveRight');
  const rest = bow.position.clone();
  const stringEnd = (name: string) => get(name).localToWorld(new THREE.Vector3(0, 1, 0));
  for (let i = 0; i <= 64; i++) {
    const age = (ARCHER.basic.duration * i) / 64;
    view.walk(0.005, 3);
    view.combatPose(age, 0.1);
    view.root.updateMatrixWorld(true);
    assert.ok(bow.position.distanceTo(left.position) < 0.001);
    assert.ok(stringEnd('CordTop').distanceTo(stringEnd('CordBottom')) < 0.001);
    for (const side of ['Left', 'Right']) {
      const sleeve = get('Sleeve' + side),
        bracer = get('Bracer' + side),
        glove = get('Glove' + side);
      assert.ok(Math.abs(sleeve.position.distanceTo(bracer.position) - 0.297) < 0.012, 'upper arm at ' + age);
      assert.ok(Math.abs(bracer.position.distanceTo(glove.position) - 0.281) < 0.012, 'forearm at ' + age);
    }
    if (arrow.visible) {
      assert.ok(arrow.position.distanceTo(stringEnd('CordTop')) < 0.001);
      assert.ok(arrow.position.distanceTo(right.position) < 0.001);
    }
    if (age >= ARCHER.basic.windup) assert.equal(arrow.visible, false);
  }
  view.combatPose(undefined, 0, true);
  assert.ok(arrow.visible);
  assert.ok(right.position.distanceTo(arrow.position) < 0.001);
  assert.ok(right.position.distanceTo(new THREE.Vector3(0.078, 1.656, -0.067)) < 0.001);
  assert.ok(bow.position.z < -0.62);
  assert.ok(other.root.getObjectByName('Longbow')!.position.equals(rest));
  view.fade(0.3);
  view.root.traverse(node => {
    if (node instanceof THREE.Mesh) assert.equal(node.material.opacity, 0.3);
  });
  view.resetPose();
  assert.equal(arrow.visible, false);
  assert.ok(bow.position.equals(rest));
});
