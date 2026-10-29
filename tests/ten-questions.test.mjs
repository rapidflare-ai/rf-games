import assert from 'node:assert/strict';
import test from 'node:test';
import { askQuestion, CATEGORIES, consistentParts, createRound, dailyPuzzleIndex, makeGuess, MAX_STEPS, PUZZLES, PURSUERS, score, stepsLeft, WRONG_GUESS_STEPS } from '../public/ten-questions/engine.mjs';
import { THEMES } from '../public/themes.mjs';

function roundFor(category, answer) {
  return createRound(PUZZLES.findIndex((puzzle) => puzzle.category === category && puzzle.answer === answer));
}

test('there are 100 puzzles, one per part, each with its own brief', () => {
  assert.equal(PUZZLES.length, 100);
  assert.equal(new Set(PUZZLES.map((puzzle) => puzzle.brief)).size, 100);
  for (const [category, item] of Object.entries(CATEGORIES)) {
    const answers = PUZZLES.filter((puzzle) => puzzle.category === category).map((puzzle) => puzzle.answer).sort();
    assert.deepEqual(answers, Object.keys(item.parts).sort(), `${category} has a puzzle for every part`);
  }
  for (const puzzle of PUZZLES) {
    const name = CATEGORIES[puzzle.category].parts[puzzle.answer].name.toLowerCase();
    assert.ok(!puzzle.brief.toLowerCase().includes(name), `${puzzle.category}.${puzzle.answer} brief does not name the answer`);
  }
});

test('every part in a category can be singled out by its answers', () => {
  for (const [category, item] of Object.entries(CATEGORIES)) {
    const ids = new Set(item.questions.map((question) => question.id));
    assert.equal(ids.size, item.questions.length, `${category} question ids are unique`);
    assert.ok(item.questions.length <= MAX_STEPS, `${category} fits the ten number-key shortcuts`);
    const signatures = new Set();
    for (const part of Object.keys(item.parts)) {
      assert.ok(Array.isArray(item.facts[part]), `${category}.${part} has facts`);
      for (const fact of item.facts[part]) assert.ok(ids.has(fact), `${category}.${part} fact ${fact} is a question`);
      signatures.add([...item.facts[part]].sort().join('|'));
    }
    assert.equal(signatures.size, Object.keys(item.parts).length, `${category} parts are distinguishable`);
    for (const question of item.questions) {
      assert.ok(question.yes && question.no, `${category}.${question.id} has both replies`);
    }
  }
});

test('the daily case walks all 100 puzzles before repeating', () => {
  const seen = new Set();
  for (let day = 0; day < 100; day += 1) {
    seen.add(dailyPuzzleIndex(new Date(Date.UTC(2026, 9, 29 + day)).toISOString().slice(0, 10)));
  }
  assert.equal(seen.size, 100);
  assert.equal(dailyPuzzleIndex('2026-10-29'), dailyPuzzleIndex('2026-10-29'));
});

test('every pursuer has a name in the live theme and puzzles use all four', () => {
  for (const kind of PURSUERS) assert.ok(THEMES.halloween.enemy[kind]);
  assert.equal(new Set(PUZZLES.map((_, index) => createRound(index).pursuer)).size, PURSUERS.length);
});

test('questions answer for the hidden part and cost one step each', () => {
  const round = roundFor('radio', 'lora');
  assert.equal(askQuestion(round, 'far').yes, true);
  assert.equal(askQuestion(round, 'video').yes, false);
  assert.equal(askQuestion(round, 'far').ok, false);
  assert.equal(stepsLeft(round), MAX_STEPS - 2);
  assert.deepEqual(consistentParts(round), ['lora', 'sat']);
  assert.equal(askQuestion(round, 'battery').yes, true);
  assert.deepEqual(consistentParts(round), ['lora']);
});

test('a wrong guess costs extra steps and a right one ends the night', () => {
  const round = roundFor('power', 'supercap');
  assert.equal(makeGuess(round, 'liion').correct, false);
  assert.equal(stepsLeft(round), MAX_STEPS - WRONG_GUESS_STEPS);
  assert.ok(round.ruledOut.has('liion'));
  askQuestion(round, 'seconds');
  assert.equal(makeGuess(round, 'supercap').correct, true);
  assert.equal(round.status, 'won');
  assert.equal(score(round), MAX_STEPS - WRONG_GUESS_STEPS - 1);
  assert.equal(askQuestion(round, 'store').ok, false);
});

test('running out of steps lets the ghoul in', () => {
  const round = roundFor('sensor', 'mic');
  makeGuess(round, 'pir');
  makeGuess(round, 'lidar');
  makeGuess(round, 'radar');
  assert.equal(round.status, 'running');
  askQuestion(round, 'sound');
  assert.equal(round.status, 'lost');
  assert.equal(score(round), 0);
  assert.equal(makeGuess(round, 'mic').ok, false);
});
