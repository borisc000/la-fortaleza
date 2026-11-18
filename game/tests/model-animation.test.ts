import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createWarriorAsset } from '../src/rendering/warrior-asset.ts';
import { createMageAsset } from '../src/rendering/mage-asset.ts';
import { createArcher } from '../src/rendering/archer.ts';
import { classDefinition } from '../src/content/classes.ts';
import { createModelAnimation, FRAME_STEP } from '../src/model-animation.ts';

for (const id of ['warrior', 'mage', 'archer'] as const) {
  test(`${id} laboratory can rewind real animation, pause and recover from fading`, async () => {
    const file = { warrior: 'warrior-veteran', mage: 'mage-slim', archer: 'archer-ranger' }[id];
    const bytes = await readFile(new URL(`../public/assets/models/${file}.glb`, import.meta.url));
    const asset = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    const definition = classDefinition(id);
    const view = id === 'warrior' ? createWarriorAsset(definition.basic, asset.scene)! :
      id === 'mage' ? createMageAsset(asset.scene)! : createArcher(asset.scene);
    const animation = createModelAnimation(view, definition);
    function matrices() {
      view.root.updateMatrixWorld(true);
      const result: number[] = [];
      // A hidden nocked arrow keeps its last transform until the next draw.
      view.root.traverseVisible(node => result.push(...node.matrixWorld.elements));
      assert.ok(result.every(Number.isFinite));
      return result;
    }
    function opacity(expected: number) {
      view.root.traverse(node => {
        if (node instanceof THREE.Mesh) {
          for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
            assert.equal(material.opacity, expected);
          }
        }
      });
    }
    animation.seek('walk', .4);
    const walk = matrices();
    animation.seek('walk', .4);
    assert.deepEqual(matrices(), walk, 'paused time must not change the model');
    animation.seek('walk', 2);
    animation.seek('walk', .4);
    assert.deepEqual(matrices(), walk, 'rewind must reproduce the same pose');
    animation.seek('walk', .4 + FRAME_STEP);
    assert.notDeepEqual(matrices(), walk, 'one frame should advance walking');
    assert.equal(animation.duration('attack'), definition.basic.duration + .5);
    animation.seek('attack', definition.basic.windup);
    const attack = matrices();
    animation.seek('attack', animation.duration('attack'));
    animation.seek('attack', definition.basic.windup);
    assert.deepEqual(matrices(), attack);
    animation.seek('fade', animation.duration('fade'));
    opacity(0);
    animation.seek('rest', 0);
    opacity(1);
    animation.seek('cast', 1);
    matrices();
    animation.seek('hit', .1);
    matrices();
    animation.seek('walk', .4);
    assert.deepEqual(matrices(), walk, 'switching modes must clear previous poses');
  });
}
