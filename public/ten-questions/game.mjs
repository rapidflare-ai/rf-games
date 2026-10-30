import { askQuestion, CATEGORIES, consistentParts, createRound, dailyPuzzleIndex, makeGuess, MAX_STEPS, PUZZLES, PURSUERS, score, stepsLeft, toggleRuledOut, utcDayKey } from './engine.mjs';
import { sfx } from '../audio.mjs';
import { focusIsOnControl, keyBelongsToControl, setupSite } from '../site.mjs';
import { ACTIVE_THEME, paintGhoul, THEMES } from '../themes.mjs';
import { track } from '../analytics.mjs';
import { prepareResultImage, shareResultImage } from '../result-share.mjs';

const $ = (id) => document.getElementById(id);
const overlay = $('screen-overlay');
const cards = { intro: $('intro-card'), result: $('result-card') };
const theme = THEMES[ACTIVE_THEME];
const dayKey = utcDayKey();
const QUESTION_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const PART_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
let round = null;
let mode = 'daily';
let selectedPart = null;
let shareImagePromise = null;

function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Private browsing may deny storage. */ }
}

function prettyDay(key) {
  const [year, month, day] = key.split('-');
  return `${month}.${day}.${year}`;
}

function setMessage(message) {
  $('flare-message').textContent = message;
}

// Show one overlay card (or none) and keep the controls behind it out of the tab order.
function showCard(name) {
  for (const [key, card] of Object.entries(cards)) card.classList.toggle('hidden', key !== name);
  overlay.classList.toggle('hidden', !name);
  document.querySelector('.control-panel').inert = Boolean(name);
}

function randomPuzzleIndex() {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % PUZZLES.length;
  }
  return Math.floor(Math.random() * PUZZLES.length);
}

function ghoulName() {
  return theme.enemy[round?.pursuer ?? 'drone'];
}

function buildTrack() {
  $('track-ticks').replaceChildren(...Array.from({ length: MAX_STEPS + 1 }, (_, index) => {
    const tick = document.createElement('i');
    tick.style.left = `${(index / MAX_STEPS) * 100}%`;
    return tick;
  }));
}

function renderGhoulList() {
  $('splash-ghouls').replaceChildren(...PURSUERS.map((kind) => {
    const chip = document.createElement('span');
    chip.className = `ghoul-chip ${kind}`;
    chip.innerHTML = '<span class="enemy-face"></span><span class="ghoul-accessory"></span>';
    paintGhoul(chip, ACTIVE_THEME, kind);
    return chip;
  }));
  $('ghoul-list').replaceChildren(...PURSUERS.map((kind) => {
    const item = document.createElement('li');
    item.innerHTML = `<span class="ghoul-chip ${kind}" aria-hidden="true"><span class="enemy-face"></span><span class="ghoul-accessory"></span></span><span><strong></strong><small></small></span>`;
    paintGhoul(item, ACTIVE_THEME, kind);
    item.querySelector('strong').textContent = theme.enemy[kind];
    item.querySelector('small').textContent = theme.blurb[kind];
    return item;
  }));
}

function renderBoard() {
  const left = round ? stepsLeft(round) : MAX_STEPS;
  const kind = round?.pursuer ?? 'drone';
  const body = $('pursuer-body');
  if (body.dataset.kind !== kind) {
    body.className = `ghoul-body ${kind}`;
    body.dataset.kind = kind;
    paintGhoul(body, ACTIVE_THEME, kind);
  }
  $('pursuer-name').textContent = theme.enemy[kind];
  $('pursuer').style.left = `${(left / MAX_STEPS) * 100}%`;
  $('night-board').classList.toggle('dawn', round?.status === 'won');
  $('night-board').classList.toggle('breached', round?.status === 'lost');
  $('night-board').setAttribute('aria-label', round?.status === 'won'
    ? `Dawn. Flare drove ${theme.enemy[kind]} away from the shelter`
    : `${theme.enemy[kind]} is ${left} ${left === 1 ? 'step' : 'steps'} from the shelter`);
}

function renderHud() {
  const asked = round?.log.filter((entry) => entry.type === 'question').length ?? 0;
  const misses = round?.log.filter((entry) => entry.type === 'guess' && !entry.correct).length ?? 0;
  $('asked-value').textContent = String(asked);
  $('misses-value').textContent = String(misses);
  $('steps-value').textContent = String(round ? stepsLeft(round) : MAX_STEPS);
  $('cabinet-label').textContent = mode === 'practice' && round ? 'PRACTICE CASE' : 'DAILY CASE';
  $('day-label').textContent = prettyDay(dayKey);
}

function renderQuestions() {
  const list = $('question-list');
  if (!round) { list.replaceChildren(); return; }
  const answers = new Map(round.log.filter((entry) => entry.type === 'question').map((entry) => [entry.id, entry.yes]));
  const focusedId = document.activeElement?.dataset?.question;
  list.replaceChildren(...CATEGORIES[round.caseKey].questions.map((question, index) => {
    const button = document.createElement('button');
    const asked = answers.has(question.id);
    const answer = answers.get(question.id);
    button.type = 'button';
    button.className = 'question';
    button.dataset.question = question.id;
    button.setAttribute('aria-keyshortcuts', QUESTION_KEYS[index]);
    // Asked questions stay focusable (aria-disabled) so keyboard users can review the answers.
    button.setAttribute('aria-disabled', String(asked || round.status !== 'running'));
    if (asked) button.classList.add(answer ? 'yes' : 'no');
    button.innerHTML = `<kbd aria-hidden="true">${QUESTION_KEYS[index]}</kbd><span class="question-text"></span><b class="question-answer">${asked ? (answer ? 'YES' : 'NO') : '?'}</b>`;
    button.querySelector('.question-text').textContent = question.text;
    button.setAttribute('aria-label', asked ? `${question.text} Flare said ${answer ? 'yes' : 'no'}.` : `Ask: ${question.text}`);
    button.addEventListener('click', () => ask(question.id));
    return button;
  }));
  if (focusedId) list.querySelector(`[data-question="${focusedId}"]`)?.focus();
}

function renderSuspects() {
  const list = $('suspect-list');
  if (!round) { list.replaceChildren(); return; }
  const focused = document.activeElement;
  const focusedKey = focused?.closest?.('.suspect')?.dataset.part;
  const focusedCross = focused?.classList?.contains('cross-button');
  const running = round.status === 'running';
  list.replaceChildren(...Object.entries(CATEGORIES[round.caseKey].parts).map(([key, part], index) => {
    const crossed = round.ruledOut.has(key);
    const card = document.createElement('div');
    card.className = 'suspect';
    card.dataset.part = key;
    card.classList.toggle('selected', selectedPart === key);
    card.classList.toggle('crossed', crossed);
    card.classList.toggle('answer', !running && key === round.answer);
    card.innerHTML = '<button type="button" class="suspect-pick"><kbd aria-hidden="true"></kbd><span class="part-icon" aria-hidden="true"></span><span class="suspect-copy"><strong></strong><small></small></span></button><button type="button" class="cross-button"><span aria-hidden="true">✕</span></button>';
    card.querySelector('kbd').textContent = PART_KEYS[index].toUpperCase();
    card.querySelector('.part-icon').textContent = part.icon;
    card.querySelector('strong').textContent = part.name;
    card.querySelector('small').textContent = part.spec;
    const pick = card.querySelector('.suspect-pick');
    const cross = card.querySelector('.cross-button');
    pick.setAttribute('aria-keyshortcuts', PART_KEYS[index].toUpperCase());
    pick.setAttribute('aria-pressed', String(selectedPart === key));
    pick.setAttribute('aria-disabled', String(!running));
    pick.setAttribute('aria-label', `${PART_KEYS[index].toUpperCase()}: ${part.name}. ${part.spec}${crossed ? '. Crossed out' : ''}${!running && key === round.answer ? '. The answer' : ''}`);
    cross.setAttribute('aria-disabled', String(!running));
    cross.setAttribute('aria-label', crossed ? `Bring back ${part.name}` : `Cross out ${part.name}`);
    pick.addEventListener('click', () => select(key));
    cross.addEventListener('click', () => crossOut(key));
    return card;
  }));
  if (focusedKey) list.querySelector(`[data-part="${focusedKey}"] ${focusedCross ? '.cross-button' : '.suspect-pick'}`)?.focus();
}

function renderGuessButton() {
  const button = $('guess-button');
  const part = selectedPart && round ? CATEGORIES[round.caseKey].parts[selectedPart] : null;
  button.disabled = !part || round.status !== 'running';
  button.innerHTML = part ? `NAME ${part.name.toUpperCase()} <kbd aria-hidden="true">N</kbd>` : 'SELECT A PART <span>→</span>';
}

function render() {
  renderHud();
  renderBoard();
  renderQuestions();
  renderSuspects();
  renderGuessButton();
}

function ghoulWarning() {
  const left = stepsLeft(round);
  if (left <= 2) return ` ${ghoulName()} is ${left} ${left === 1 ? 'step' : 'steps'} away!`;
  if (left <= 4) return ` I can hear ${ghoulName()} at the gate.`;
  return '';
}

function ghoulMoves() {
  if (round.pursuer === 'brute') setTimeout(sfx.stomp, 180);
  const left = stepsLeft(round);
  if (round.status === 'running' && left <= 4) setTimeout(() => sfx.heartbeat(left <= 2 ? 3 : 2), 420);
}

function ask(questionId) {
  if (!round || round.status !== 'running') return;
  const response = askQuestion(round, questionId);
  if (!response.ok) { sfx.bad(); setMessage(`${response.reason}.`); return; }
  sfx.ask();
  setTimeout(response.yes ? sfx.yes : sfx.no, 120);
  ghoulMoves();
  setMessage(`${response.reply}${round.status === 'running' ? ghoulWarning() : ''}`);
  render();
  if (round.status !== 'running') finishRound();
}

function select(part) {
  if (!round || round.status !== 'running') return;
  selectedPart = selectedPart === part ? null : part;
  sfx.select();
  render();
}

function crossOut(part) {
  if (!round || round.status !== 'running' || !part) return;
  const crossed = toggleRuledOut(round, part);
  if (crossed && selectedPart === part) selectedPart = null;
  sfx.cross();
  setMessage(`${CATEGORIES[round.caseKey].parts[part].name} ${crossed ? 'crossed out' : 'is back on the list'}.`);
  render();
}

function guess() {
  if (!round || round.status !== 'running' || !selectedPart) return;
  const name = CATEGORIES[round.caseKey].parts[selectedPart].name;
  const response = makeGuess(round, selectedPart);
  selectedPart = null;
  if (response.ok && !response.correct) {
    sfx.bad();
    ghoulMoves();
    if (round.status === 'running') setMessage(`Not the ${name}. ${ghoulName()} lunged three steps closer.${ghoulWarning()}`);
  }
  render();
  if (round.status !== 'running') finishRound();
  else $('question-list').querySelector('.question[aria-disabled="false"]')?.focus();
}

function trail() {
  return round.log.map((entry) => (entry.type === 'question' ? '❓' : entry.correct ? '✅' : '❌')).join('');
}

function finishRound() {
  const won = round.status === 'won';
  const answer = CATEGORIES[round.caseKey].parts[round.answer];
  const asked = round.log.filter((entry) => entry.type === 'question').length;
  const misses = round.log.filter((entry) => entry.type === 'guess' && !entry.correct).length;
  const points = score(round);
  track('Game Finished', { game: 'ten-questions', mode, won, moves_left: points, questions_asked: asked, wrong_guesses: misses });
  if (won) sfx.win(); else { sfx.breach(); setTimeout(sfx.lose, 300); }
  cards.result.classList.toggle('won', won);
  cards.result.classList.toggle('lost', !won);
  $('result-kicker').textContent = won ? 'ROGUE AI OUTSMARTED' : 'THE ROGUE AI BROKE THROUGH';
  $('result-heading').textContent = won ? 'WE OUTTHOUGHT IT' : 'THE SHELTER FELL';
  $('result-story').textContent = won
    ? `We found the ${answer.name}, and Flare sent ${ghoulName()} running at first light.`
    : `${ghoulName()} slipped past us. The missing part was ${answer.name}.${consistentParts(round).length === 1 ? ' Your answers had already narrowed it down.' : ' One more question might have cracked it.'}`;
  $('result-asked').textContent = String(asked);
  $('result-misses').textContent = String(misses);
  $('result-score').textContent = String(points);
  $('result-trail').textContent = trail();
  $('result-trail').setAttribute('aria-label', `${asked} questions, ${misses} wrong ${misses === 1 ? 'guess' : 'guesses'}, ${won ? 'then the right answer' : 'and no right answer'}`);
  let bestText = mode === 'daily' ? 'Daily case · UTC' : 'Practice case';
  if (mode === 'daily') {
    const key = `rf-games-ten-questions-best-v2:${dayKey}`;
    const stored = readStorage(key);
    const prior = stored === null ? null : Number(stored);
    if (prior === null || points > prior) {
      writeStorage(key, String(points));
      bestText = prior === null ? `DAILY BEST · ${points} MOVES LEFT` : `NEW DAILY BEST · ${points} MOVES LEFT`;
    } else bestText = `YOUR DAILY BEST · ${prior} MOVES LEFT`;
  }
  $('best-line').textContent = bestText;
  shareImagePromise = prepareResultImage({
    game: 'Ten Questions Till Dawn', number: '002', won, mode, day: dayKey,
    headline: won ? ['WE OUTTHOUGHT', 'IT'] : ['THE SHELTER', 'FELL'],
    stats: [
      { label: 'Asked', value: asked },
      { label: 'Misses', value: misses },
      { label: 'Moves left', value: points },
    ],
    url: `${location.origin}${location.pathname}`,
  }).catch(() => null);
  setMessage(won ? 'We beat the rogue AI. The sun is coming up.' : 'The rogue AI broke through. I have another case ready.');
  render();
  // Let the sunrise or the breach play before the result card covers the board.
  const reveal = () => {
    showCard('result');
    cards.result.scrollIntoView({ block: 'start', behavior: 'auto' });
    $('share-button').focus({ preventScroll: true });
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) reveal();
  else setTimeout(reveal, 1600);
}

function startRound(requestedMode) {
  mode = requestedMode;
  shareImagePromise = null;
  round = createRound(mode === 'daily' ? dailyPuzzleIndex(dayKey) : randomPuzzleIndex(), mode);
  track('Game Started', { game: 'ten-questions', mode });
  selectedPart = null;
  cards.result.classList.remove('won', 'lost');
  const category = CATEGORIES[round.caseKey];
  document.querySelector('.target-kicker').textContent = 'WHAT ARE WE FINDING?';
  $('case-label').textContent = category.label;
  $('case-brief').textContent = round.brief;
  showCard(null);
  setMessage('Ask a question to narrow the parts.');
  sfx.select();
  render();
  $('question-list').querySelector('.question')?.focus({ preventScroll: true });
  if (window.matchMedia('(max-width: 720px)').matches) {
    document.querySelector('.cabinet').scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }
}

function returnHome() {
  round = null;
  shareImagePromise = null;
  selectedPart = null;
  $('case-label').textContent = "TONIGHT'S CASE";
  document.querySelector('.target-kicker').textContent = "TONIGHT'S TARGET";
  $('case-brief').textContent = "Start a case to hear Flare's brief.";
  showCard('intro');
  setMessage('Ask me about the part. I can only say yes or no.');
  render();
  $('daily-start').focus();
}

function shareText() {
  const title = mode === 'daily' ? `Ten Questions Till Dawn · ${dayKey} UTC` : 'Ten Questions Till Dawn · practice';
  const verdict = round.status === 'won' ? `Shelter safe with ${score(round)} moves to spare` : `${ghoulName()} got in`;
  return `${title}\n${trail()}\n${verdict}. Can you beat it?`;
}

async function shareResult() {
  if (!round || round.status === 'running') return;
  const text = shareText();
  const url = `${location.origin}${location.pathname}`;
  try {
    const method = await shareResultImage({ imagePromise: shareImagePromise, title: 'Ten Questions Till Dawn', text, url });
    track('Game Result Shared', { game: 'ten-questions', mode, method });
    if (method.startsWith('copy')) {
      $('share-button').innerHTML = method === 'copy-image' ? 'CARD COPIED! <span>✓</span>' : 'TEXT COPIED! <span>✓</span>';
      setMessage(method === 'copy-image' ? 'Paste the image into your post, then use Copy Post Text for the caption and link.' : 'Paste your result and link into a post.');
      setTimeout(() => { $('share-button').innerHTML = 'SHARE RESULT <kbd aria-hidden="true">S</kbd>'; }, 1800);
    }
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setMessage('Sharing is unavailable in this browser. Try copying the page link.');
  }
}

async function copyPostText() {
  if (!round || round.status === 'running') return;
  try {
    await navigator.clipboard.writeText(`${shareText()}\n${location.origin}${location.pathname}`);
    track('Game Result Shared', { game: 'ten-questions', mode, method: 'copy-post-text' });
    $('copy-post-button').innerHTML = 'POST TEXT COPIED! <span>✓</span>';
    setMessage('Paste this as the caption for your result image.');
    setTimeout(() => { $('copy-post-button').innerHTML = 'COPY POST TEXT <kbd aria-hidden="true">C</kbd>'; }, 1800);
  } catch {
    setMessage('Could not copy the post text. Try again or copy the page link.');
  }
}

document.addEventListener('keydown', (event) => {
  if (keyBelongsToControl(event)) return;
  const key = event.key.toLowerCase();
  const visible = (name) => !overlay.classList.contains('hidden') && !cards[name].classList.contains('hidden');
  if (visible('intro')) {
    if (key === 'd') { event.preventDefault(); startRound('daily'); }
    if (key === 'r') { event.preventDefault(); startRound('practice'); }
    return;
  }
  if (visible('result')) {
    if (key === 'r') { event.preventDefault(); startRound('practice'); }
    if (key === 's') { event.preventDefault(); shareResult(); }
    if (key === 'c') { event.preventDefault(); copyPostText(); }
    if (key === 'escape') { event.preventDefault(); returnHome(); }
    return;
  }
  if (!round || round.status !== 'running') return;
  const questions = CATEGORIES[round.caseKey].questions;
  const parts = Object.keys(CATEGORIES[round.caseKey].parts);
  const questionIndex = QUESTION_KEYS.indexOf(key);
  const partIndex = PART_KEYS.indexOf(key);
  if (questionIndex >= 0 && questions[questionIndex]) { event.preventDefault(); ask(questions[questionIndex].id); }
  else if (partIndex >= 0 && parts[partIndex]) { event.preventDefault(); select(parts[partIndex]); }
  else if (key === 'x') { event.preventDefault(); crossOut(selectedPart ?? document.activeElement?.closest?.('.suspect')?.dataset.part); }
  else if (key === 'n' || (key === 'enter' && !focusIsOnControl())) { event.preventDefault(); guess(); }
  else if (key === 'escape' && selectedPart) { event.preventDefault(); selectedPart = null; render(); setMessage('Selection cleared.'); }
});

$('guess-button').addEventListener('click', guess);
$('daily-start').addEventListener('click', () => startRound('daily'));
$('practice-start').addEventListener('click', () => startRound('practice'));
$('retry-button').addEventListener('click', () => startRound('practice'));
$('home-button').addEventListener('click', returnHome);
$('share-button').addEventListener('click', shareResult);
$('copy-post-button').addEventListener('click', copyPostText);
setupSite('ten-questions', { onAction: (action) => startRound(action === 'daily' ? 'daily' : 'practice') });
buildTrack();
renderGhoulList();
showCard('intro');
render();
