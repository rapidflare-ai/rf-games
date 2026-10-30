import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, DIAGNOSTICS, ENEMIES, installPart, launchCraft, makeScenario, neededPart, PARTS, score, seedFromText, tick, urgentLane, useAssist, utcDayKey, WRONG_FIT_LOCK_SECONDS, WRONG_FIT_SCORE_PENALTY } from '../public/engine.mjs';
import { ACTIVE_THEME, THEMES } from '../public/themes.mjs';

test('daily seeds and waves are stable across clients', () => {
  assert.equal(utcDayKey(new Date('2026-10-29T23:59:00-07:00')), '2026-10-30');
  const seed = seedFromText('circuit-siege-v3:2026-10-29');
  assert.deepEqual(makeScenario(seed), makeScenario(seed));
  assert.notDeepEqual(makeScenario(seed), makeScenario(seed + 1));
  assert.equal(makeScenario(seed).length, 16);
  assert.deepEqual(new Set(makeScenario(seed).map((entry) => entry.kind)), new Set(Object.keys(ENEMIES)));
});

test('a steady player making one move every 1.6 seconds holds the shelter all October', () => {
  for (let day = 1; day <= 31; day += 1) {
    const game = createGame(seedFromText(`circuit-siege-v3:2026-10-${String(day).padStart(2, '0')}`));
    let lane = 0;
    let wait = 1.6;
    while (game.status === 'running' && game.elapsed < 300) {
      tick(game, 0.05);
      wait -= 0.05;
      if (wait > 0) continue;
      wait = 1.6;
      const target = urgentLane(game);
      if (target !== lane) lane = target;
      else if (game.bays[lane].ready) launchCraft(game, lane);
      else installPart(game, lane, neededPart(game, lane));
    }
    assert.ok(game.core > 0, `October ${day} is survivable`);
  }
});

test('staggering ghouls lurch but still arrive', () => {
  const game = createGame(4);
  game.wave = [];
  game.bots = [{ id: 1, lane: 0, kind: 'stagger', x: 0.5, hp: 1, maxHp: 1, speed: ENEMIES.stagger.speed, stagger: ENEMIES.stagger.stagger }];
  const positions = [];
  for (let step = 0; step < 20; step += 1) { tick(game, 0.1); positions.push(game.bots[0].x); }
  const moves = positions.slice(1).map((x, index) => positions[index] - x);
  assert.ok(Math.max(...moves) > Math.min(...moves) * 1.5);
  assert.ok(moves.every((move) => move > 0));
});

test('a craft accepts its requested part and changes needs after launch', () => {
  const game = createGame(10);
  assert.equal(neededPart(game, 0), 'gps');
  assert.equal(DIAGNOSTICS[neededPart(game, 0)].label, 'POSITION UNKNOWN');
  const wrong = installPart(game, 0, 'jammer');
  assert.equal(wrong.ok, false);
  assert.doesNotMatch(wrong.reason, /gps|antenna/i);
  assert.equal(game.mistakes, 1);
  assert.equal(wrong.penalty, WRONG_FIT_SCORE_PENALTY);
  assert.equal(installPart(game, 0, 'gps').locked, true);
  for (let step = 0; step < 14; step += 1) tick(game, 0.12);
  assert.equal(installPart(game, 0, 'gps').ready, true);
  assert.equal(launchCraft(game, 0).ok, true);
  assert.equal(game.launches, 1);
  assert.equal(game.shots[0].kind, 'drone');
  assert.equal(game.bays[0].cycle, 1);
  assert.ok(['gps', 'sensor', 'thermal', 'radio'].includes(neededPart(game, 0)));
});

test('all eight distinct fault shapes can appear during daily play', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 12; seed += 1) {
    const game = createGame(seed);
    for (let lane = 0; lane < 3; lane += 1) {
      for (let cycle = 0; cycle < 16; cycle += 1) {
        while (!game.bays[lane].ready) {
          const part = neededPart(game, lane);
          seen.add(part);
          installPart(game, lane, part);
        }
        launchCraft(game, lane);
      }
    }
  }
  assert.deepEqual(seen, new Set(Object.keys(PARTS)));
  assert.deepEqual(new Set(Object.keys(DIAGNOSTICS)), seen);
});

test('wrong fits cost time and score, and rapid scanning cannot retry during recalibration', () => {
  const game = createGame(9);
  const baseline = score(game);
  const wrong = installPart(game, 0, 'sensor');
  assert.equal(wrong.lockSeconds, WRONG_FIT_LOCK_SECONDS);
  assert.equal(score(game), baseline - WRONG_FIT_SCORE_PENALTY);
  for (const part of Object.keys(PARTS)) assert.equal(installPart(game, 0, part).locked, true);
  assert.equal(useAssist(game, 0).ok, false);
  assert.equal(game.mistakes, 1);
  for (let step = 0; step < 14; step += 1) tick(game, 0.12);
  assert.equal(installPart(game, 0, 'gps').ready, true);
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

test('Flare auto-fit installs the needed component and has a limit', () => {
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

test('launching extra craft cannot inflate a perfect score', () => {
  const game = createGame(3);
  for (let launch = 0; launch < 20; launch += 1) {
    installPart(game, 0, neededPart(game, 0));
    assert.equal(launchCraft(game, 0).ok, true);
  }
  assert.equal(game.launches, 20);
  assert.equal(score(game), 750);
  game.kills = game.wave.length;
  assert.equal(score(game), 2350);
});

test('one theme is active in code and upcoming themes are available as data', () => {
  assert.equal(ACTIVE_THEME, 'halloween');
  assert.ok(THEMES[ACTIVE_THEME]);
  assert.ok(THEMES.winter);
  assert.ok(THEMES.neon);
});
