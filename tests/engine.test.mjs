import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, DIAGNOSTICS, installPart, launchCraft, makeScenario, neededPart, score, seedFromText, tick, useAssist, utcDayKey } from '../public/engine.mjs';
import { ACTIVE_THEME, THEMES } from '../public/themes.mjs';

test('daily seeds and waves are stable across clients', () => {
  assert.equal(utcDayKey(new Date('2026-10-29T23:59:00-07:00')), '2026-10-30');
  const seed = seedFromText('circuit-siege-v2:2026-10-29');
  assert.deepEqual(makeScenario(seed), makeScenario(seed));
  assert.notDeepEqual(makeScenario(seed), makeScenario(seed + 1));
  assert.equal(makeScenario(seed).length, 16);
});

test('a craft accepts its requested part and changes needs after launch', () => {
  const game = createGame(10);
  assert.equal(neededPart(game, 0), 'gps');
  assert.equal(DIAGNOSTICS[neededPart(game, 0)].label, 'POSITION UNKNOWN');
  const wrong = installPart(game, 0, 'jammer');
  assert.equal(wrong.ok, false);
  assert.doesNotMatch(wrong.reason, /gps|antenna/i);
  assert.equal(game.mistakes, 1);
  assert.equal(installPart(game, 0, 'gps').ready, true);
  assert.equal(launchCraft(game, 0).ok, true);
  assert.equal(game.launches, 1);
  assert.equal(game.shots[0].kind, 'drone');
  assert.equal(game.bays[0].cycle, 1);
  assert.ok(['gps', 'sensor', 'power'].includes(neededPart(game, 0)));
});

test('fighter needs a PCIe upgrade before its jammer', () => {
  const game = createGame(7);
  assert.equal(neededPart(game, 1), 'pcie');
  assert.equal(launchCraft(game, 1).ok, false);
  assert.deepEqual(installPart(game, 1, 'pcie'), { ok: true, ready: false, next: 'jammer' });
  assert.equal(neededPart(game, 1), 'jammer');
  assert.equal(installPart(game, 1, 'jammer').ready, true);
  assert.equal(launchCraft(game, 1).ok, true);
  assert.equal(game.shots[0].damage, 2);
});

test('Patch assist installs the needed component and has a limit', () => {
  const game = createGame(8);
  assert.equal(useAssist(game, 2).part, 'power');
  assert.equal(game.bays[2].ready, true);
  assert.equal(game.assists, 2);
  useAssist(game, 0);
  useAssist(game, 1);
  assert.equal(game.assists, 0);
  assert.equal(useAssist(game, 1).ok, false);
});

test('launched friendly craft fly right and stop frontier machines', () => {
  const game = createGame(2);
  game.wave = [];
  game.bots = [{ id: 20, lane: 0, kind: 'drone', x: 0.36, hp: 1, maxHp: 1, speed: 0 }];
  installPart(game, 0, 'gps');
  launchCraft(game, 0);
  for (let step = 0; step < 8; step += 1) tick(game, 0.12);
  assert.equal(game.kills, 1);
  assert.equal(game.bots.length, 0);
});

test('breaches end the round and score rewards keeping the shelter intact', () => {
  const game = createGame(3);
  game.wave = [];
  game.bots = [0, 1, 2].map((id) => ({ id, lane: id, kind: 'drone', x: 0.03, hp: 1, maxHp: 1, speed: 0 }));
  tick(game, 0.01);
  assert.equal(game.core, 0);
  assert.equal(game.status, 'finished');
  assert.equal(score(game), 0);
});

test('one theme is active in code and upcoming themes are available as data', () => {
  assert.equal(ACTIVE_THEME, 'halloween');
  assert.ok(THEMES[ACTIVE_THEME]);
  assert.ok(THEMES.winter);
  assert.ok(THEMES.neon);
});
