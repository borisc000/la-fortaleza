import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio, AudioFeedback } from '../src/audio/game-audio.ts';
import type { Cue } from '../src/audio/game-audio.ts';
import { HudCadence, incomingProjectile } from '../src/app/guidance.ts';
import { Run } from '../src/domain/run.ts';
import { PLAY_AREA, PLAYER } from '../src/content/config.ts';

function audioFixture() {
  const nodes: any[] = [];
  let factories = 0;
  const parameter = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime(value: number) {
      this.value = value;
    },
  });
  const context = {
    state: 'running',
    currentTime: 0,
    destination: {},
    closed: false,
    createGain() {
      return { gain: parameter(), connect() {}, disconnect() {} };
    },
    createOscillator() {
      const node = {
        frequency: parameter(),
        type: '',
        onended: null,
        stopped: false,
        disconnected: false,
        connect() {},
        disconnect() {
          this.disconnected = true;
        },
        start() {},
        stop(time?: number) {
          if (time === undefined) this.stopped = true;
        },
      };
      nodes.push(node);
      return node;
    },
    async resume() {
      this.state = 'running';
    },
    async close() {
      this.closed = true;
      this.state = 'closed';
    },
  };
  const audio = new GameAudio(() => {
    factories++;
    return context as unknown as AudioContext;
  });
  return { audio, nodes, context, factories: () => factories };
}

test('audio activates only on gesture, pause cancels voices and world sounds cannot queue in menus', async () => {
  const f = audioFixture();
  f.audio.setPlaying(true);
  f.audio.cue('hit');
  assert.equal(f.factories(), 0);
  await f.audio.unlock();
  f.audio.cue('hit');
  assert.equal(f.nodes.length, 1);
  f.audio.setPlaying(false);
  assert.ok(f.nodes[0].stopped && f.nodes[0].disconnected);
  f.context.currentTime += 1;
  f.audio.cue('hurt');
  assert.equal(f.nodes.length, 1);
  f.audio.cue('purchase', true);
  assert.equal(f.nodes.length, 2);
  f.audio.silence();
  f.audio.setPlaying(true);
  assert.equal(f.nodes.length, 2, 'Resume cannot replay discarded sounds');
  f.audio.dispose();
  assert.ok(f.context.closed);
  await f.audio.unlock();
  assert.equal(f.factories(), 1);
});

test('audio throttles mass hits, caps voices and handles mute, volume and unavailable audio', async () => {
  const f = audioFixture();
  await f.audio.unlock();
  f.audio.setPlaying(true);
  for (let i = 0; i < 100; i++) f.audio.cue('hit');
  assert.equal(f.nodes.length, 1);
  for (const cue of ['hurt', 'coin', 'heal', 'warning', 'whirlwind', 'capture', 'low', 'secured'] as const)
    f.audio.cue(cue);
  assert.equal(f.nodes.length, 8);
  f.audio.setEnabled(false);
  assert.ok(f.nodes.every(n => n.stopped));
  f.audio.cue('victory', true);
  assert.equal(f.nodes.length, 8);
  f.audio.setEnabled(true);
  f.audio.setVolume(0);
  f.audio.cue('victory', true);
  assert.equal(f.nodes.length, 8);
  f.audio.setVolume(200);
  assert.equal(f.audio.volume, 1);
  f.audio.setVolume(NaN);
  assert.equal(f.audio.volume, 0.25);
  f.audio.reset();
  f.audio.cue('hit');
  assert.equal(f.nodes.length, 9);
  f.audio.dispose();
  const unavailable = new GameAudio(() => {
    throw new Error('Audio unavailable');
  });
  await unavailable.unlock();
  unavailable.setPlaying(true);
  unavailable.cue('hit');
  unavailable.dispose();
});

test('audio feedback signals unique capture and danger changes without repeating every frame', () => {
  const run = new Run(PLAY_AREA, [], 19),
    feedback = new AudioFeedback(),
    cues: Cue[] = [];
  const play = (cue: Cue) => cues.push(cue);
  feedback.update(run, [], play);
  assert.deepEqual(cues, []);
  run.combat.hp = 25;
  run.capture.state = 'warning';
  feedback.update(run, [], play);
  assert.deepEqual(cues, ['low', 'capture']);
  cues.length = 0;
  feedback.update(run, [], play);
  assert.deepEqual(cues, []);
  run.capture.state = 'completed';
  run.exploration.coins = 25;
  run.eliteSpawned = true;
  feedback.update(run, [], play);
  assert.deepEqual(cues, ['secured', 'warning']);
  cues.length = 0;
  feedback.update(run, [], play);
  assert.deepEqual(cues, []);
  run.combat.hp = 60;
  feedback.update(run, [], play);
  assert.deepEqual(cues, ['heal']);
});

test('projectile guidance rejects distant, receding, missing and wall-blocked trajectories', () => {
  const hero = { x: 0, z: 0 },
    shot = { x: 0, z: 6, vx: 0, vz: -10 };
  assert.equal(incomingProjectile(shot, hero, []), true);
  assert.equal(incomingProjectile({ ...shot, z: 20 }, hero, []), false);
  assert.equal(incomingProjectile({ ...shot, vz: 10 }, hero, []), false);
  assert.equal(incomingProjectile({ ...shot, x: 3 }, hero, []), false);
  assert.equal(incomingProjectile({ ...shot, vz: 0 }, hero, []), false);
  assert.equal(incomingProjectile(shot, hero, [{ min: { x: -2, y: 0, z: 3 }, max: { x: 2, y: 3, z: 3.2 } }]), false);
});

test('HUD refresh is bounded while explicit paused renders remain immediate', () => {
  const cadence = new HudCadence();
  let calls = 0;
  for (let frame = 0; frame < 600; frame++) if (cadence.due(1 / 60)) calls++;
  assert.ok(calls >= 99 && calls <= 101, String(calls));
  assert.equal(cadence.due(0), true);
  assert.equal(cadence.due(0), true);
});

test('late capture never replaces a scheduled large wave with its smaller reinforcement request', () => {
  const run = new Run(PLAY_AREA, [], 19),
    hero = { ...run.capture.point!, yaw: 0 };
  run.combat.retireNormals();
  run.eliteSpawned = true;
  run.combat.time = 245;
  run.capture.state = 'active';
  const before = run.totalSpawned;
  run.step(PLAYER.step, hero);
  assert.equal(run.totalSpawned - before, run.stage.count);
  assert.equal(run.stage.count, 15);
  for (let i = 0; i < 120; i++) run.step(PLAYER.step, hero);
  assert.equal(run.totalSpawned - before, run.stage.count, 'No second horde or instant refill');
});

test('opening the merchant at 6:00 cannot delay the final transition or retain normal hordes', () => {
  const run = new Run(PLAY_AREA, [], 19),
    merchant = run.exploration.objects.find(o => o.kind === 'shop')!;
  run.combat.time = 360 - PLAYER.step / 2;
  run.step(PLAYER.step, { ...merchant, yaw: 0 }, undefined, merchant.id);
  assert.equal(run.shop.isOpen, true);
  assert.equal(run.phase, 'elite-gate');
  assert.equal(run.capture.state, 'closed');
  assert.ok(run.combat.enemies.filter(e => !e.dead).every(e => e.kind === 'elite'));
  const time = run.combat.time;
  run.step(1, { ...merchant, yaw: 0 });
  assert.equal(run.combat.time, time);
});

test('edge markers sit on the screen border towards the bearing and damage labels are toned by source', async () => {
  const { edgeAnchor } = await import('../src/app/guidance.ts');
  const { damageTone, damageScale } = await import('../src/rendering/damage-labels.ts');
  const ahead = edgeAnchor(0),
    left = edgeAnchor(Math.PI / 2),
    behind = edgeAnchor(Math.PI),
    right = edgeAnchor(-Math.PI / 2);
  assert.ok(Math.abs(ahead.x) < 1e-9 && Math.abs(ahead.y - 0.62) < 1e-9);
  assert.ok(Math.abs(left.x + 0.9) < 1e-9 && Math.abs(left.y) < 1e-9);
  assert.ok(Math.abs(right.x - 0.9) < 1e-9);
  assert.ok(Math.abs(behind.y + 0.62) < 1e-9);
  for (let a = -3; a <= 3; a += 0.37) {
    const p = edgeAnchor(a);
    assert.ok(Math.abs(p.x) <= 0.9 + 1e-9 && Math.abs(p.y) <= 0.62 + 1e-9);
    assert.ok(Math.abs(Math.abs(p.x) - 0.9) < 1e-9 || Math.abs(Math.abs(p.y) - 0.62) < 1e-9);
  }
  assert.equal(damageTone({ target: 0, source: 'enemy' }), 'hurt');
  assert.equal(damageTone({ target: 3, source: 'burn' }), 'fire');
  assert.equal(damageTone({ target: 3, source: 'splash' }), 'water');
  assert.equal(damageTone({ target: 3, source: 'basic' }), 'plain');
  assert.ok(damageScale(0.4) === 1 && damageScale(10) > 1 && damageScale(1e6) <= 1.6);
});

test('every ability, relic and general stat has an interface icon and options are classified by id', async () => {
  const { iconPath, upgradeKind } = await import('../src/app/icons.ts');
  const { WARRIOR_ABILITIES, GENERAL_STATS } = await import('../src/content/warrior-abilities.ts');
  const { RANGED_ABILITIES } = await import('../src/content/ranged-abilities.ts');
  const { RELIC_IDS } = await import('../src/content/relics.ts');
  for (const id of [...Object.keys(WARRIOR_ABILITIES).map(key => `warrior:${key}`), ...Object.keys(RANGED_ABILITIES)]) {
    assert.ok(iconPath(id), id);
    assert.ok(iconPath(`ability:${id}/learn/`), id);
  }
  for (const id of RELIC_IDS) assert.ok(iconPath(id), id);
  for (const stat of Object.keys(GENERAL_STATS)) assert.ok(iconPath(`stat:${stat}`), stat);
  for (const id of ['fire', 'secondary_water', 'salvage', 'mastery']) assert.ok(iconPath(id), id);
  assert.ok(iconPath('affinity', 'earth'));
  assert.equal(iconPath('affinity'), undefined);
  assert.equal(iconPath('sweep'), undefined);
  assert.equal(upgradeKind('ability:warrior:sword/learn/').kind, 'learn');
  assert.equal(upgradeKind('ability:mage:orb/branch/power').kind, 'improve');
  assert.equal(upgradeKind('ability:mage:orb/finisher/0').kind, 'exclusive');
  assert.equal(upgradeKind('stat:reach').kind, 'stat');
  assert.equal(upgradeKind('damage').kind, 'stat');
  assert.equal(upgradeKind('relic_edge').kind, 'relic');
  assert.equal(upgradeKind('salvage').kind, 'coins');
  assert.equal(upgradeKind('air').kind, 'affinity');
  assert.equal(upgradeKind('secondary-affinity').kind, 'affinity');
  assert.equal(upgradeKind('mastery').kind, 'mastery');
  assert.equal(upgradeKind('sweep').kind, 'technique');
});

test('radar keeps bearings, scales by range and pins far targets to the rim', async () => {
  const { radarPoint } = await import('../src/app/guidance.ts');
  const ahead = radarPoint(0, 20, 40),
    left = radarPoint(Math.PI / 2, 40, 40),
    far = radarPoint(Math.PI, 500, 40),
    here = radarPoint(1, 0, 40);
  assert.ok(Math.abs(ahead.x) < 1e-9 && Math.abs(ahead.y + 0.5) < 1e-9 && !ahead.pinned);
  assert.ok(Math.abs(left.x + 1) < 1e-9 && Math.abs(left.y) < 1e-9 && !left.pinned);
  assert.ok(Math.abs(far.y - 1) < 1e-9 && far.pinned);
  assert.ok(Math.hypot(here.x, here.y) < 1e-9);
});

test('damage tally sums dealt damage by source, merges labels and keeps damage taken apart', async () => {
  const { DamageTally } = await import('../src/app/damage-tally.ts');
  const tally = new DamageTally(),
    hit = (target: number, amount: number, source: string) =>
      ({ id: 0, type: 'hit', target, amount, x: 0, z: 0, source }) as any;
  tally.add([
    hit(1, 30, 'basic'),
    hit(2, 10, 'burn'),
    hit(0, 7, 'enemy'),
    hit(3, 20, 'spell'),
    { ...hit(4, 99, 'basic'), type: 'death' },
    hit(5, 0, 'burn'),
  ]);
  assert.equal(tally.dealt, 60);
  assert.equal(tally.taken, 7);
  const rows = tally.rows(source => (source === 'spell' ? 'basic' : source));
  assert.deepEqual(
    rows.map(row => [row.name, row.amount]),
    [
      ['basic', 50],
      ['burn', 10],
    ],
  );
  assert.ok(Math.abs(rows[0].share - 50 / 60) < 1e-9);
  assert.deepEqual(new DamageTally().rows(), []);
});

test('interface cues play in menus, stay quiet and never crowd out world sounds', async () => {
  const f = audioFixture();
  await f.audio.unlock();
  f.audio.cue('tick');
  assert.equal(f.nodes.length, 0, 'Interface cues outside play need the menu flag');
  f.audio.cue('tick', true);
  f.audio.cue('tick', true);
  assert.equal(f.nodes.length, 1, 'Hover ticks are throttled');
  f.audio.cue('select', true);
  f.audio.cue('menu', true);
  assert.equal(f.nodes.length, 3);
  f.audio.dispose();
});
