import assert from 'node:assert/strict';
import test from 'node:test';
import { armLane, createGame, makeScenario, score, seedFromText, tick, utcDayKey } from '../public/engine.mjs';
import { resolveTheme, seasonalTheme } from '../public/themes.mjs';

test('daily seeds and waves are stable across clients', () => {
  assert.equal(utcDayKey(new Date('2026-10-29T23:59:00-07:00')), '2026-10-30');
  const seed = seedFromText('circuit-siege-v1:2026-10-29');
  assert.deepEqual(makeScenario(seed), makeScenario(seed));
  assert.notDeepEqual(makeScenario(seed), makeScenario(seed + 1));
  assert.equal(makeScenario(seed).length, 19);
});

test('devices use energy and can be taken back before firing', () => {
  const game = createGame(10);
  assert.deepEqual(armLane(game, 1, 'capacitor'), { ok: true, action: 'armed' });
  assert.equal(game.energy, 2);
  assert.deepEqual(armLane(game, 1, 'coil'), { ok: true, action: 'removed' });
  assert.equal(game.energy, 5);
  assert.equal(armLane(game, 5, 'coil').ok, false);
  game.energy = 0;
  assert.equal(armLane(game, 1, 'coil').reason, 'Need more energy');
});

test('a capacitor damages its lane and splashes adjacent lanes', () => {
  const game = createGame(2);
  game.wave = [];
  game.bots = [
    { id: 1, lane: 1, kind: 'brute', x: 0.25, hp: 2, maxHp: 2, speed: 0 },
    { id: 2, lane: 0, kind: 'drone', x: 0.26, hp: 1, maxHp: 1, speed: 0 },
    { id: 3, lane: 2, kind: 'drone', x: 0.60, hp: 1, maxHp: 1, speed: 0 },
  ];
  armLane(game, 1, 'capacitor');
  tick(game, 0.01);
  assert.equal(game.kills, 2);
  assert.equal(game.bots.length, 1);
  assert.equal(game.bots[0].id, 3);
});

test('breaches end a round and score rewards the shelter', () => {
  const game = createGame(3);
  game.wave = [];
  game.bots = [0, 1, 2].map((id) => ({ id, lane: id, kind: 'drone', x: 0.03, hp: 1, maxHp: 1, speed: 0 }));
  tick(game, 0.01);
  assert.equal(game.core, 0);
  assert.equal(game.status, 'finished');
  assert.equal(score(game), game.energy * 10);
});

test('themes change presentation without changing the daily wave', () => {
  assert.equal(seasonalTheme(new Date('2026-10-29T12:00:00Z')), 'halloween');
  assert.equal(seasonalTheme(new Date('2026-12-25T12:00:00Z')), 'winter');
  assert.equal(resolveTheme('auto', new Date('2026-03-10T12:00:00Z')), 'neon');
  assert.equal(resolveTheme('halloween', new Date('2026-03-10T12:00:00Z')), 'halloween');
});
