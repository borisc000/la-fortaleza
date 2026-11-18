import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createWarriorAsset } from '../src/rendering/warrior-asset.ts';
import { WARRIOR } from '../src/content/classes/warrior.ts';

test('warrior GLB keeps sword attached, poses finite and clones independent', async () => {
  const bytes = await readFile(new URL('../public/assets/models/warrior-veteran.glb', import.meta.url));
  const asset = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const a = createWarriorAsset(WARRIOR.basic, asset.scene)!;
  const b = createWarriorAsset(WARRIOR.basic, asset.scene)!;
  const sword = a.root.getObjectByName('Sword')!;
  const hand = a.root.getObjectByName('HandRight')!;
  assert.equal(sword.parent, hand);
  const offset = sword.position.clone();
  const gripRotation = sword.quaternion.clone();
  const rest = a.root.getObjectByName('UpperRight')!.quaternion.clone();
  for (let frame = 0; frame < 120; frame++) {
    a.walk(1 / 60, 4);
    a.combatPose(frame / 120 * WARRIOR.basic.duration, .2, frame > 90, 4);
    a.root.updateMatrixWorld(true);
    assert.ok(sword.position.equals(offset));
    assert.ok(sword.quaternion.angleTo(gripRotation) < .00001, 'the sword must rotate with the gripping hand');
    assert.ok(sword.getWorldPosition(new THREE.Vector3()).distanceTo(hand.getWorldPosition(new THREE.Vector3())) < .05);
    a.root.traverse(node => assert.ok(node.matrixWorld.elements.every(Number.isFinite)));
  }
  assert.ok(b.root.getObjectByName('UpperRight')!.quaternion.equals(rest));
  assert.ok(!a.root.getObjectByName('UpperRight')!.quaternion.equals(rest));
  a.fade(.3);
  a.root.traverse(node => {
    if (node instanceof THREE.Mesh) {
      const material = node.material as THREE.Material;
      assert.equal(material.opacity, .3);
      const other = b.root.getObjectByName(node.name);
      assert.ok(other instanceof THREE.Mesh);
      assert.notEqual(node.geometry, other.geometry);
    }
  });
  a.resetPose();
  assert.ok(a.root.getObjectByName('UpperRight')!.quaternion.equals(rest));
  a.combatPose(WARRIOR.basic.duration, 0);
  assert.ok(a.root.getObjectByName('UpperRight')!.quaternion.angleTo(rest) < .00001);
});
