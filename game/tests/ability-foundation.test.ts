import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ABILITY_CATALOG } from '../src/content/ability-schema.ts';
import { AbilityBook } from '../src/domain/ability-book.ts';
import { AbilityClock } from '../src/domain/ability-clock.ts';
import { AbilityOffers } from '../src/domain/ability-offers.ts';
import type { OfferCandidate } from '../src/domain/ability-offers.ts';

test('each class has eight skills, one independent basic, immutable catalog and four slots', () => {
  assert.equal(new Set(ABILITY_CATALOG.map(d => d.id)).size, 27);
  for (const classId of ['warrior', 'mage', 'archer'] as const) {
    const book = new AbilityBook(classId);
    assert.equal(ABILITY_CATALOG.filter(d => d.classId === classId && d.kind === 'skill').length, 8);
    assert.equal(book.snapshot.length, 2); assert.equal(book.slotsUsed, 1);
    for (let i = 0; i < 3; i++) assert.ok(book.apply(book.revision, book.options().find(o => o.kind === 'learn')!));
    assert.equal(book.slotsUsed, 4); assert.equal(book.options().some(o => o.kind === 'learn'), false);
    assert.ok(Object.isFrozen(book.snapshot[0].branches));
    assert.equal(book.apply(book.revision, { id: 'armored:shield', kind: 'learn' }), false);
  }
});

test('all 27 attacks reach level ten through two distinct legal paths with seven branch points', () => {
  for (const definition of ABILITY_CATALOG) for (const alternative of [0, 1] as const) {
    const book = new AbilityBook(definition.classId);
    if (!definition.initial) assert.ok(book.apply(book.revision, { id: definition.id, kind: 'learn' }));
    for (let level = 1; level < 10; level++) {
      const options = book.options().filter(o => o.id === definition.id);
      if (level === 4 || level === 9) assert.equal(options.length, 2);
      const op = alternative ? options.at(-1)! : options[0];
      const before = book.snapshot.find(s => s.id === definition.id)!;
      assert.ok(book.apply(book.revision, op)); assert.equal(before.level, level);
    }
    const state = book.snapshot.find(s => s.id === definition.id)!;
    assert.equal(state.level, 10); assert.equal(state.mutation, alternative); assert.equal(state.finisher, alternative);
    assert.equal(Object.values(state.branches).reduce((a, b) => a + b), 7);
    assert.ok(Object.values(state.branches).every(n => n <= 3));
    assert.equal(book.options().some(o => o.id === definition.id), false);
  }
});

test('cross-class, skipped milestone, invalid rank and stale or repeated transactions cannot mutate state', () => {
  const b = new AbilityBook('warrior'), rev = b.revision, snapshot = b.snapshot;
  assert.equal(b.apply(rev, { id: 'mage:mirror', kind: 'learn' }), false);
  assert.equal(b.apply(rev, { id: 'warrior:whirlwind', kind: 'finisher', option: 0 }), false);
  assert.deepEqual(b.snapshot, snapshot);
  const op = b.options()[0]; assert.ok(b.apply(rev, op)); assert.equal(b.apply(rev, op), false);
  b.stop(); assert.equal(b.options().length, 0); b.reset(); assert.equal(b.apply(rev, op), false);
  assert.equal(b.slotsUsed, 1); assert.ok(b.snapshot.every(s => s.level === 1));
});

test('simultaneous actions have independent clocks and immutable launch snapshots', () => {
  const b = new AbilityBook('warrior'), clock = new AbilityClock();
  const first = clock.start(b.snapshot[0], true, 2, 5)!;
  const second = clock.start(b.snapshot[1], true, 1, 3)!;
  assert.equal(clock.active.length, 2);
  assert.ok(b.apply(b.revision, b.options()[0])); assert.equal(first.ability.level, 1);
  clock.step(1.5); assert.equal(clock.remaining(first.ability.id), .5); assert.equal(clock.remaining(second.ability.id), 2.5);
  clock.step(1); assert.equal(clock.remaining(first.ability.id), 4.5);
  assert.equal(clock.start(b.snapshot[0], true, 2, 5), undefined);
});

test('pause, missing targets, invalid time, death and reset do not leak actions or cooldowns', () => {
  const b = new AbilityBook('mage'), clock = new AbilityClock(), skill = b.snapshot[1];
  assert.equal(clock.start(skill, false, 2, 5), undefined); assert.equal(clock.remaining(skill.id), 0);
  assert.equal(clock.start(skill, true, NaN, 5), undefined);
  const action = clock.start(skill, true, 2, 5)!;
  clock.setPaused(true); clock.step(100); assert.equal(clock.remaining(skill.id), 2); assert.equal(clock.accepts(action), false);
  clock.setPaused(false); clock.step(NaN); assert.equal(clock.remaining(skill.id), 2);
  clock.stop(); assert.equal(clock.accepts(action), false); assert.equal(clock.active.length, 0);
  clock.reset(); assert.equal(clock.accepts(action), false); assert.ok(clock.start(skill, true, 0, 5));
  clock.step(5); assert.equal(clock.remaining(skill.id), 0);
});

const pool: OfferCandidate[] = [
  { key: 'vitality', category: 'stat' }, { key: 'speed', category: 'stat' },
  { key: 'whirl-radius', category: 'develop' }, { key: 'learn-wave', category: 'learn' }, { key: 'water', category: 'affinity' },
];
test('offers are deterministic, stable on reopen, unique and validate selection IDs/revisions', () => {
  const a = new AbilityOffers(12), b = new AbilityOffers(12);
  const offer = a.open(1, pool)!; assert.deepEqual(offer, b.open(1, pool));
  assert.equal(a.open(2, []), offer); assert.equal(new Set(offer.cards.map(c => c.key)).size, 3);
  assert.equal(a.canChoose(offer.id, offer.cards[0].key, 2), false);
  assert.equal(a.canChoose(offer.id, 'invented', 1), false);
  assert.ok(a.canChoose(offer.id, offer.cards[0].key, 1)); assert.ok(a.commit(offer.id)); assert.equal(a.commit(offer.id), false);
  a.reset(); const next = a.open(1, pool)!; assert.notEqual(next.id, offer.id);
});

test('learning and affinity opportunities cannot starve even when the player chooses stats', () => {
  for (let seed = 0; seed < 20; seed++) {
    const offers = new AbilityOffers(seed); let missedLearn = 0, missedAffinity = 0;
    for (let n = 0; n < 30; n++) {
      const offer = offers.open(n, pool)!;
      missedLearn = offer.cards.some(c => c.category === 'learn') ? 0 : missedLearn + 1;
      missedAffinity = offer.cards.some(c => c.category === 'affinity') ? 0 : missedAffinity + 1;
      assert.ok(missedLearn <= 2); assert.ok(missedAffinity <= 3); assert.ok(offers.commit(offer.id));
    }
  }
});

test('milestones show both exclusive alternatives and leave an unrelated choice; empty pools are safe', () => {
  const offers = new AbilityOffers(2);
  const candidates: OfferCandidate[] = [{ key: 'm0', category: 'develop', milestone: 'whirl:5' }, { key: 'm1', category: 'develop', milestone: 'whirl:5' }, { key: 'health', category: 'stat' }];
  const offer = offers.open(1, candidates)!; assert.deepEqual(offer.cards.map(c => c.key).sort(), ['health', 'm0', 'm1']);
  offers.commit(offer.id); assert.equal(offers.open(2, [])!.cards.length, 0);
  offers.stop(); assert.equal(offers.open(3, candidates), undefined);
});
