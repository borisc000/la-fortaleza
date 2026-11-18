import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeCameraDistance, recoverDistance, cameraRadius } from '../src/rendering/collision.ts';
import { PreviewState } from '../src/app/state.ts';

const origin = { x: 0, y: 1.3, z: 0 },
  direction = { x: 0, y: 0, z: 1 };
test('camera stops before a wall, including its volume and safety gap', () => {
  assert.equal(
    safeCameraDistance(origin, direction, 6, 0.25, [{ min: { x: -3, y: 0, z: 3 }, max: { x: 3, y: 5, z: 4 } }]),
    2.7,
  );
});
test('volume catches a corner missed by an unpadded centre ray', () => {
  const wall = { min: { x: 0.1, y: 0, z: 3 }, max: { x: 3, y: 5, z: 4 } };
  assert.equal(safeCameraDistance(origin, direction, 6, 0, [wall]), 6);
  assert.equal(safeCameraDistance(origin, direction, 6, 0.25, [wall]), 2.7);
});
test('parallel rays outside a wall and walls behind the player do not obstruct', () => {
  assert.equal(
    safeCameraDistance(origin, direction, 6, 0.25, [
      { min: { x: 2, y: 0, z: 1 }, max: { x: 3, y: 4, z: 5 } },
      { min: { x: -3, y: 0, z: -4 }, max: { x: 3, y: 5, z: -3 } },
    ]),
    6,
  );
});
test('starting inside an expanded obstacle cannot place camera beyond it', () => {
  assert.equal(
    safeCameraDistance(origin, direction, 6, 0.25, [{ min: { x: -3, y: 0, z: -0.1 }, max: { x: 3, y: 5, z: 4 } }]),
    0,
  );
});
test('lowest camera position leaves space above the terrain', () => {
  const d = { x: 0, y: -0.5, z: Math.sqrt(0.75) };
  assert.equal(safeCameraDistance(origin, d, 6, 0.25, []), 2);
});
test('snap in immediately; recover independently of render framerate', () => {
  assert.equal(recoverDistance(6, 2, 0.016), 2);
  const a = recoverDistance(2, 6, 0.1);
  let b = 2;
  for (let i = 0; i < 10; i++) b = recoverDistance(b, 6, 0.01);
  assert.ok(Math.abs(a - b) < 1e-10);
  assert.ok(a > 2 && a < 6);
});
test('wide screens increase camera collision volume to protect near-plane corners', () => {
  assert.ok(cameraRadius(65, 4, 0.1) > cameraRadius(65, 1, 0.1));
});
test('loading and pause require explicit entry; fatal state cannot resume', () => {
  const state = new PreviewState();
  state.resume();
  assert.equal(state.active, false);
  state.loaded();
  assert.equal(state.phase, 'ready');
  state.resume();
  assert.equal(state.active, true);
  state.pause();
  state.loaded();
  assert.equal(state.phase, 'paused');
  state.resume();
  assert.equal(state.active, true);
  state.fail();
  state.resume();
  assert.equal(state.phase, 'error');
});
