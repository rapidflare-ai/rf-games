import { CRAFTS, createGame, DIAGNOSTICS, installPart, launchCraft, LANE_COUNT, neededPart, PARTS, score, seedFromText, tick, urgentLane, useAssist, utcDayKey } from './engine.mjs';
import { ACTIVE_THEME, THEMES } from './themes.mjs';

const $ = (id) => document.getElementById(id);
const lanes = [...document.querySelectorAll('.lane')];
const parts = [...document.querySelectorAll('.part')];
const themeSelect = $('theme-select');
const overlay = $('screen-overlay');
const intro = $('intro-card');
const result = $('result-card');
const dayKey = utcDayKey();
const themeName = ACTIVE_THEME;
let selectedLane = 0;
let game = null;
let mode = 'daily';
let activeSeed = seedFromText(`circuit-siege-v2:${dayKey}`);
let frame = 0;
let lastFrame = 0;
let lastRender = 0;
let lastHint = 0;
const botNodes = new Map();
const shotNodes = new Map();

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

function applyTheme() {
  const theme = THEMES[themeName];
  document.body.dataset.theme = themeName;
  document.querySelector('meta[name="theme-color"]').content = theme.sky;
  $('eyebrow').textContent = theme.eyebrow;
  $('game-title').innerHTML = theme.title === 'CIRCUIT SIEGE'
    ? 'CIRCUIT<br><span>SIEGE</span>'
    : `${theme.title.split(' ')[0]}<br><span>CIRCUIT SIEGE</span>`;
  $('subtitle').textContent = theme.subtitle;
  $('story').textContent = theme.story;
  $('intro-heading').innerHTML = `${theme.intro[0]}<br><em>${theme.intro[1]}</em>`;
  $('result-story').textContent = game?.core > 0 ? theme.victory : theme.defeat;
  document.title = `${theme.title} · Rapid Games`;
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    lanes[lane].querySelector('.lane-name b').textContent = theme.lanes[lane];
  }
  for (const node of botNodes.values()) {
    const kind = node.dataset.kind;
    node.querySelector('.enemy-face').textContent = theme.icon[kind];
    node.querySelector('.bot-label').textContent = theme.enemy[kind];
  }
  updateHud();
}

function setMessage(message) {
  $('patch-message').textContent = `PATCH: ${message}`;
}

function updateHud() {
  const core = game?.core ?? 3;
  $('core-value').textContent = `${'♥ '.repeat(core)}${'♡ '.repeat(3 - core)}`.trim();
  $('launches-value').textContent = String(game?.launches ?? 0);
  $('kills-value').textContent = `${game?.kills ?? 0}/${game?.wave.length ?? 16}`;
  $('cabinet-label').textContent = game?.status === 'running' && mode === 'practice' ? 'PRACTICE DEFENSE' : 'DAILY DEFENSE';
  $('day-label').textContent = game?.status === 'running' ? `${game.spawnIndex}/${game.wave.length} INCOMING` : prettyDay(dayKey);

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const bay = game?.bays[lane];
    const requirement = lanes[lane].querySelector('.requirement');
    const card = lanes[lane].querySelector('.bay-card');
    const needed = bay ? neededPart(game, lane) : [['gps'], ['pcie'], ['power']][lane][0];
    requirement.textContent = bay?.ready ? 'READY · TAP TO LAUNCH' : DIAGNOSTICS[needed].label;
    card.classList.toggle('ready', Boolean(bay?.ready));
    lanes[lane].classList.toggle('selected', selectedLane === lane);
    lanes[lane].setAttribute('aria-label', bay?.ready
      ? `${CRAFTS[lane].name} ready in lane ${lane + 1}. Tap to launch`
      : `Select ${CRAFTS[lane].name} bay in lane ${lane + 1}. Diagnostic: ${DIAGNOSTICS[needed].label}`);
  }

  const selectedBay = game?.bays[selectedLane];
  const needed = selectedBay ? neededPart(game, selectedLane) : ['gps', 'pcie', 'power'][selectedLane];
  $('selected-bay').textContent = selectedBay?.ready
    ? `${CRAFTS[selectedLane].name.toUpperCase()} · READY TO LAUNCH`
    : `${CRAFTS[selectedLane].name.toUpperCase()} · ${DIAGNOSTICS[needed].label}`;
  $('assist-button').textContent = `PATCH ASSIST ×${game?.assists ?? 3}`;
  $('assist-button').disabled = !game || game.status !== 'running' || game.assists === 0 || Boolean(selectedBay?.ready);
  $('launch-button').disabled = !game || game.status !== 'running' || !selectedBay?.ready;
  $('launch-button').innerHTML = selectedBay?.ready ? `LAUNCH ${CRAFTS[selectedLane].name.toUpperCase()} <span>→</span>` : 'REPAIR TO LAUNCH <span>→</span>';
}

function renderActors() {
  if (!game) return;
  const presentBots = new Set();
  for (const bot of game.bots) {
    presentBots.add(bot.id);
    let node = botNodes.get(bot.id);
    if (!node) {
      node = document.createElement('span');
      node.className = `bot ${bot.kind}`;
      node.dataset.kind = bot.kind;
      node.setAttribute('aria-hidden', 'true');
      node.innerHTML = '<span class="bot-health"></span><span class="enemy-face"></span><span class="ai-stamp">AI</span><span class="bot-label"></span>';
      node.querySelector('.enemy-face').textContent = THEMES[themeName].icon[bot.kind];
      node.querySelector('.bot-label').textContent = THEMES[themeName].enemy[bot.kind];
      lanes[bot.lane].querySelector('.bot-layer').append(node);
      botNodes.set(bot.id, node);
    }
    node.style.left = `${bot.x * 100}%`;
    node.querySelector('.bot-health').textContent = bot.hp > 1 ? '◆ ◆' : '';
  }
  for (const [id, node] of botNodes) {
    if (!presentBots.has(id)) { node.remove(); botNodes.delete(id); }
  }

  const presentShots = new Set();
  for (const shot of game.shots) {
    presentShots.add(shot.id);
    let node = shotNodes.get(shot.id);
    if (!node) {
      node = document.createElement('span');
      node.className = `shot ${shot.kind}`;
      node.textContent = CRAFTS[shot.lane].icon;
      node.setAttribute('aria-hidden', 'true');
      lanes[shot.lane].querySelector('.shot-layer').append(node);
      shotNodes.set(shot.id, node);
    }
    node.style.left = `${shot.x * 100}%`;
  }
  for (const [id, node] of shotNodes) {
    if (!presentShots.has(id)) { node.remove(); shotNodes.delete(id); }
  }
}

function handleEvents(events) {
  if (events.some((event) => event.type === 'breach')) {
    setMessage('The shelter took a hit. Launch into that lane!');
  } else if (events.some((event) => event.type === 'kill')) {
    setMessage('Direct hit. Humans and friendly AI make a good team.');
  } else if (events.some((event) => event.type === 'spawn') && game.elapsed - lastHint > 3.5) {
    setMessage(`Frontier AI ${THEMES[themeName].enemy[game.bots.at(-1)?.kind] || 'forces'} incoming. Check lane ${urgentLane(game) + 1}.`);
    lastHint = game.elapsed;
  }
  if (game.status === 'finished') finishRound();
}

function loop(timestamp) {
  if (!game || game.status !== 'running') return;
  const seconds = Math.min((timestamp - lastFrame) / 1000 || 0, 0.12);
  lastFrame = timestamp;
  const events = tick(game, seconds);
  if (timestamp - lastRender > 33 || events.length) {
    renderActors();
    updateHud();
    lastRender = timestamp;
  }
  if (events.length) handleEvents(events);
  if (game.status === 'running') frame = requestAnimationFrame(loop);
}

function freshPracticeSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0];
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function resetActors() {
  for (const node of [...botNodes.values(), ...shotNodes.values()]) node.remove();
  botNodes.clear();
  shotNodes.clear();
}

function startRound(requestedMode, seed) {
  cancelAnimationFrame(frame);
  mode = requestedMode;
  activeSeed = seed ?? (mode === 'daily' ? seedFromText(`circuit-siege-v2:${dayKey}`) : freshPracticeSeed());
  game = createGame(activeSeed, mode);
  selectedLane = 0;
  lastHint = 0;
  resetActors();
  overlay.classList.add('hidden');
  intro.classList.add('hidden');
  result.classList.add('hidden');
  setMessage(`${DIAGNOSTICS[neededPart(game, 0)].hint} Pick a component that solves it. I can help three times.`);
  updateHud();
  lastFrame = performance.now();
  lastRender = 0;
  frame = requestAnimationFrame(loop);
  if (window.matchMedia('(max-width: 720px)').matches) {
    document.querySelector('.cabinet').scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }
}

function finishRound() {
  cancelAnimationFrame(frame);
  renderActors();
  updateHud();
  const won = game.core > 0;
  const points = score(game);
  $('result-kicker').textContent = won ? 'TRANSMISSION COMPLETE' : 'SIGNAL LOST';
  $('result-heading').textContent = won ? 'SHELTER SECURED' : 'SHELTER BREACHED';
  $('result-story').textContent = won ? THEMES[themeName].victory : THEMES[themeName].defeat;
  $('result-kills').textContent = `${game.kills}/${game.wave.length}`;
  $('result-core').textContent = `${'♥ '.repeat(game.core)}${'♡ '.repeat(3 - game.core)}`.trim();
  $('result-score').textContent = String(points).padStart(4, '0');
  let bestText = mode === 'daily' ? 'Daily wave · UTC' : 'Practice run';
  if (mode === 'daily') {
    const key = `rf-games-best-v2:${dayKey}`;
    const prior = Number(readStorage(key) || 0);
    if (points > prior) {
      writeStorage(key, String(points));
      bestText = prior ? `NEW DAILY BEST · ${points}` : `DAILY BEST · ${points}`;
    } else bestText = `YOUR DAILY BEST · ${prior}`;
  }
  $('best-line').textContent = bestText;
  intro.classList.add('hidden');
  result.classList.remove('hidden');
  overlay.classList.remove('hidden');
  $('share-button').focus();
}

function returnHome() {
  cancelAnimationFrame(frame);
  game = null;
  selectedLane = 0;
  resetActors();
  intro.classList.remove('hidden');
  result.classList.add('hidden');
  overlay.classList.remove('hidden');
  setMessage('Select a bay, read its diagnostic, fit the right part, then launch. I can help three times.');
  updateHud();
}

function shareText() {
  const hearts = '♥'.repeat(game.core) + '♡'.repeat(3 - game.core);
  const title = mode === 'daily' ? `Circuit Siege · ${dayKey} UTC` : 'Circuit Siege · practice';
  const verdict = game.core > 0 ? 'Shelter secured' : 'Shelter breached';
  return `${title}\n${verdict} ${hearts}\n${game.kills}/${game.wave.length} ghouls stopped · ${game.launches} friendly craft launched · ${score(game)} points\nPatch and I held the line. Can you?`;
}

async function shareResult() {
  if (!game || game.status !== 'finished') return;
  const text = shareText();
  const url = `${location.origin}${location.pathname}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Circuit Siege', text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    $('share-button').innerHTML = 'COPIED! <span>✓</span>';
    setTimeout(() => { $('share-button').innerHTML = 'SHARE RESULT <span>↗</span>'; }, 1800);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setMessage('Sharing is unavailable in this browser. Try copying the page link.');
  }
}

function selectLane(lane) {
  selectedLane = lane;
  updateHud();
  const needed = neededPart(game, lane);
  setMessage(needed ? `${CRAFTS[lane].name}: ${DIAGNOSTICS[needed].hint}` : `${CRAFTS[lane].name} is ready. Launch it!`);
}

function installSelected(part) {
  if (!game || game.status !== 'running') return;
  const response = installPart(game, selectedLane, part);
  if (response.ok) {
    setMessage(response.ready
      ? `${CRAFTS[selectedLane].name} repaired. Hit LAUNCH!`
      : `Good fit. New diagnostic: ${DIAGNOSTICS[response.next].hint}`);
  } else setMessage(`${response.reason}.`);
  updateHud();
}

function launchSelected() {
  if (!game || game.status !== 'running') return;
  const response = launchCraft(game, selectedLane);
  setMessage(response.ok ? `${CRAFTS[selectedLane].name} launched from the shelter!` : `${response.reason}.`);
  updateHud();
  renderActors();
}

for (const [key, theme] of Object.entries(THEMES)) {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = `${theme.label.toUpperCase()} · ${key === ACTIVE_THEME ? 'LIVE' : 'COMING SOON'}`;
  option.disabled = key !== ACTIVE_THEME;
  themeSelect.append(option);
}
themeSelect.value = ACTIVE_THEME;
for (const button of lanes) button.addEventListener('click', () => {
  if (!game || game.status !== 'running') return;
  const lane = Number(button.dataset.lane);
  if (selectedLane === lane && game.bays[lane].ready) launchSelected();
  else selectLane(lane);
});
for (const button of parts) button.addEventListener('click', () => installSelected(button.dataset.part));
$('assist-button').addEventListener('click', () => {
  if (!game || game.status !== 'running') return;
  const response = useAssist(game, selectedLane);
  setMessage(response.ok
    ? response.ready ? `I fitted ${PARTS[response.part].name}. Craft ready to launch!` : `I fitted ${PARTS[response.part].name}. Next diagnostic: ${DIAGNOSTICS[response.next].hint}`
    : `${response.reason}.`);
  updateHud();
});
$('launch-button').addEventListener('click', launchSelected);
document.addEventListener('keydown', (event) => {
  if (event.target === themeSelect || event.altKey || event.metaKey || event.ctrlKey || !game || game.status !== 'running') return;
  const key = event.key.toLowerCase();
  if (/^[1-3]$/.test(key)) selectLane(Number(key) - 1);
  const shortcuts = { g: 'gps', o: 'sensor', p: 'pcie', j: 'jammer', b: 'power' };
  if (shortcuts[key]) installSelected(shortcuts[key]);
  if (key === 'enter' && document.activeElement?.tagName !== 'BUTTON') launchSelected();
});
$('daily-start').addEventListener('click', () => startRound('daily'));
$('practice-start').addEventListener('click', () => startRound('practice'));
$('retry-button').addEventListener('click', () => startRound(mode, activeSeed));
$('home-button').addEventListener('click', returnHome);
$('share-button').addEventListener('click', shareResult);
applyTheme();
