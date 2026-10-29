import { seedFromText, utcDayKey } from '../engine.mjs';
import { CATEGORIES, PUZZLES } from './cases.mjs';

export { CATEGORIES, PUZZLES, seedFromText, utcDayKey };

export const MAX_STEPS = 10;
export const WRONG_GUESS_STEPS = 3;
export const PURSUERS = Object.freeze(['drone', 'runner', 'brute', 'stagger']);
// Walking the puzzle list in steps of 37 visits all 100 before any repeats, in a shuffled-looking order.
const DAILY_STRIDE = 37;

export function dayNumber(dayKey) {
  return Math.floor(Date.parse(`${dayKey}T00:00:00Z`) / 86400000);
}

export function dailyPuzzleIndex(dayKey) {
  const length = PUZZLES.length;
  return (((dayNumber(dayKey) * DAILY_STRIDE) % length) + length) % length;
}

export function createRound(puzzleIndex, mode = 'daily') {
  const index = ((puzzleIndex % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  const puzzle = PUZZLES[index];
  return {
    mode,
    puzzleIndex: index,
    caseKey: puzzle.category,
    answer: puzzle.answer,
    brief: puzzle.brief,
    pursuer: PURSUERS[seedFromText(`pursuer:${index}`) % PURSUERS.length],
    steps: 0,
    log: [],
    ruledOut: new Set(),
    status: 'running',
  };
}

export function answerFor(caseKey, part, questionId) {
  return CATEGORIES[caseKey].facts[part].includes(questionId);
}

export function stepsLeft(round) {
  return Math.max(0, MAX_STEPS - round.steps);
}

function advance(round, steps) {
  round.steps = Math.min(MAX_STEPS, round.steps + steps);
  if (round.steps >= MAX_STEPS && round.status === 'running') round.status = 'lost';
}

export function askQuestion(round, questionId) {
  if (round.status !== 'running') return { ok: false, reason: 'The night is over' };
  const question = CATEGORIES[round.caseKey].questions.find((item) => item.id === questionId);
  if (!question) return { ok: false, reason: 'Ask one of the listed questions' };
  if (round.log.some((entry) => entry.type === 'question' && entry.id === questionId)) return { ok: false, reason: 'You already asked that' };
  const yes = answerFor(round.caseKey, round.answer, questionId);
  round.log.push({ type: 'question', id: questionId, yes });
  advance(round, 1);
  return { ok: true, yes, reply: yes ? question.yes : question.no };
}

export function makeGuess(round, part) {
  if (round.status !== 'running') return { ok: false, reason: 'The night is over' };
  if (!CATEGORIES[round.caseKey].parts[part]) return { ok: false, reason: 'Pick one of the parts' };
  const correct = part === round.answer;
  round.log.push({ type: 'guess', id: part, correct });
  if (correct) round.status = 'won';
  else {
    round.ruledOut.add(part);
    advance(round, WRONG_GUESS_STEPS);
  }
  return { ok: true, correct };
}

export function toggleRuledOut(round, part) {
  if (round.ruledOut.has(part)) round.ruledOut.delete(part);
  else round.ruledOut.add(part);
  return round.ruledOut.has(part);
}

// Parts still consistent with every answer so far. The UI leaves ruling out to the player;
// this is for tests and for Flare's end-of-night recap.
export function consistentParts(round) {
  const asked = round.log.filter((entry) => entry.type === 'question');
  const wrong = new Set(round.log.filter((entry) => entry.type === 'guess' && !entry.correct).map((entry) => entry.id));
  return Object.keys(CATEGORIES[round.caseKey].parts).filter((part) => !wrong.has(part)
    && asked.every((entry) => answerFor(round.caseKey, part, entry.id) === entry.yes));
}

export function score(round) {
  return round.status === 'won' ? stepsLeft(round) : 0;
}
