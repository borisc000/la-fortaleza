import { test } from 'node:test';
import assert from 'node:assert/strict';
import { worldDirection, moveCircle, overlaps, stepMovement } from '../src/domain/movement.ts';
import { ControlState } from '../src/input/state.ts';
import { PLAYER } from '../src/content/config.ts';

const bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
const wall = { min: { x: 2, y: 0, z: -10 }, max: { x: 2.1, y: 5, z: 10 } };
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);

test('W follows camera heading; D remains perpendicular and diagonal speed is capped', () => {
  const north = worldDirection({ right: 0, forward: 1 }, 0); close(north.x, 0); close(north.z, -1);
  const west = worldDirection({ right: 0, forward: 1 }, Math.PI / 2); close(west.x, -1); close(west.z, 0);
  const right = worldDirection({ right: 1, forward: 0 }, Math.PI / 2); close(right.x, 0); close(right.z, -1);
  const diagonal = worldDirection({ right: 1, forward: 1 }, .72); close(Math.hypot(diagonal.x, diagonal.z), 1);
  close(Math.hypot(...Object.values(worldDirection({ right: .3, forward: .4 }, 0))), .5);
});
test('one second of walking covers 5 metres and stops immediately after release', () => {
  const body = { x: 0, z: 0, yaw: 0 };
  for (let i = 0; i < 60; i++) stepMovement(body, { right: 0, forward: 1 }, 0, PLAYER.step, PLAYER, bounds, []);
  close(body.z, -5);
  const speed = stepMovement(body, { right: 0, forward: 0 }, 0, PLAYER.step, PLAYER, bounds, []);
  close(body.z, -5); close(speed, 0);
});
test('thin wall stops a large displacement without tunnelling', () => {
  const result = moveCircle({ x: 0, z: 0 }, { x: 15, z: 0 }, .4, bounds, [wall]);
  assert.ok(result.x <= 1.600001 && result.x > 1.59); assert.equal(overlaps(result, .4, wall), false);
});
test('diagonal contact slides along the wall rather than stopping the tangent', () => {
  const result = moveCircle({ x: 1.6, z: 0 }, { x: 2, z: -3 }, .4, bounds, [wall]);
  close(result.x, 1.6); close(result.z, -3);
});
test('a circular body can round an exposed corner without penetrating', () => {
  const box = { min: { x: 1, y: 0, z: 1 }, max: { x: 3, y: 3, z: 3 } };
  let position = { x: .6, z: 2 };
  for (let i = 0; i < 80; i++) {
    position = moveCircle(position, { x: .05, z: -.075 }, .4, bounds, [box]);
    assert.equal(overlaps(position, .4, box), false);
  }
  assert.ok(position.x > 1.5 && position.z < .5);
});
test('concave wall junction and map limits cannot trap the body inside solids', () => {
  const horizontal = { min: { x: -10, y: 0, z: 2 }, max: { x: 10, y: 4, z: 2.1 } };
  const result = moveCircle({ x: 0, z: 0 }, { x: 8, z: 8 }, .4, bounds, [wall, horizontal]);
  assert.ok(result.x <= 1.600001 && result.z <= 1.600001);
  for (const solid of [wall, horizontal]) assert.equal(overlaps(result, .4, solid), false);
  const edge = moveCircle({ x: 19, z: 19 }, { x: 10, z: 10 }, .4, bounds, []);
  close(edge.x, 19.6); close(edge.z, 19.6);
});
test('rotation takes the short path across ±PI and camera angle is independent', () => {
  const body = { x: 0, z: 0, yaw: Math.PI - .02 }, yaw = -Math.PI + .02;
  stepMovement(body, { right: 0, forward: 1 }, yaw, PLAYER.step, PLAYER, bounds, []);
  assert.ok(body.yaw > Math.PI - .02 && body.yaw < Math.PI + .02); close(yaw, -Math.PI + .02);
});
test('two fingers remain independent when either is released or cancelled', () => {
  const input = new ControlState();
  assert.equal(input.begin(10, true, 100, 100), true); assert.equal(input.begin(20, false, 600, 100), true);
  input.drag(10, 100, 56); close(input.movement().forward, 1);
  assert.deepEqual(input.drag(20, 615, 105), { dx: 15, dy: 5 });
  input.release(20); close(input.movement().forward, 1);
  input.begin(21, false, 600, 100); input.release(10);
  close(input.movement().forward, 0); assert.deepEqual(input.drag(21, 610, 100), { dx: 10, dy: 0 });
});
test('a third finger cannot steal movement and crossing screen halves keeps ownership', () => {
  const input = new ControlState(); input.begin(1, true, 50, 50); input.begin(2, false, 600, 50);
  assert.equal(input.begin(3, true, 100, 100), false);
  assert.equal(input.drag(1, 700, 50), undefined); close(input.movement().right, 1);
  assert.deepEqual(input.drag(2, 50, 50), { dx: -550, dy: 0 });
});
test('joystick deadzone prevents drift; clearing removes keys and both pointers', () => {
  const input = new ControlState(); input.begin(1, true, 100, 100); input.begin(2, false, 500, 100);
  input.drag(1, 102, 99); assert.deepEqual(input.movement(), { right: 0, forward: 0 });
  input.keys.add('KeyW'); input.keys.add('KeyA'); input.clear();
  assert.deepEqual(input.movement(), { right: 0, forward: 0 }); assert.equal(input.movePointer, undefined); assert.equal(input.lookPointer, undefined);
});
