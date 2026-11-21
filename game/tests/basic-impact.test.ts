import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera } from 'three';
import type { CombatEvent } from '../src/domain/combat.ts';
import { createBasicImpact } from '../src/rendering/basic-impact.ts';

test('only the first direct basic contact flashes, expires on combat time and can replay after reset', () => {
  const camera = new PerspectiveCamera();
  for (const [classId, source] of [
    ['warrior', 'basic'],
    ['mage', 'spell'],
    ['archer', 'arrow'],
  ] as const) {
    const view = createBasicImpact(classId);
    const hit: CombatEvent = { id: 1, type: 'hit', source, attackId: 9, target: 2, amount: 20, x: 1, z: 2 };
    for (const secondary of ['ability', 'ability-extra', 'burn'] as const) view.hit({ ...hit, source: secondary }, 1);
    view.update(camera, 1);
    assert.equal(view.mesh.visible, false);
    view.hit(hit, 1);
    view.hit({ ...hit, target: 3, x: 5 }, 1.1);
    view.update(camera, 1.1);
    assert.equal(view.mesh.visible, true);
    assert.equal(view.mesh.position.x, 1);
    view.update(camera, 1.2);
    assert.equal(view.mesh.visible, false);
    view.reset();
    view.hit({ ...hit, attackId: 1, x: 3 }, 0);
    view.update(camera, 0);
    assert.equal(view.mesh.position.x, 3);
    assert.equal(view.mesh.visible, true);
    view.dispose();
  }
});
