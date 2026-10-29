import { armLane, createGame, DEVICES, LANE_COUNT, MAX_ENERGY, score, seedFromText, tick, urgentLane, utcDayKey } from './engine.mjs';
import { resolveTheme, seasonalTheme, THEMES } from './themes.mjs';

const $ = (id) => document.getElementById(id);
const lanes = [...document.querySelectorAll('.lane')];
const tools = [...document.querySelectorAll('.tool')];
const themeSelect = $('theme-select');
const overlay = $('screen-overlay');
const intro = $('intro-card');
const result = $('result-card');
const dayKey = utcDayKey();
const storedTheme = readStorage('rf-games-theme') || 'auto';
let themeChoice = storedTheme === 'auto' || THEMES[storedTheme] ? storedTheme : 'auto';
let themeName = resolveTheme(themeChoice);
let selectedDevice = 'coil';
let game = null;
let mode = 'daily';
let activeSeed = seedFromText(`circuit-siege-v1:${dayKey}`);
let frame = 0;
let lastFrame = 0;
let lastRender = 0;
let lastHint = 0;
const botNodes = new Map();

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
  themeName = resolveTheme(themeChoice);
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
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    lanes[lane].querySelector('.lane-name b').textContent = theme.lanes[lane];
  }
  $('result-story').textContent = game?.core > 0 ? theme.victory : theme.defeat;
  document.title = `${theme.title} · Rapid Games`;
  for (const node of botNodes.values()) {
    node.querySelector('.bot-label').textContent = theme.enemy[node.dataset.kind];
  }
  updateHud();
}

function setMessage(message) {
  $('patch-message').textContent = `PATCH: ${message}`;
}

function selectDevice(device) {
  selectedDevice = device;
  for (const button of tools) {
    const selected = button.dataset.device === device;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  if (game?.status === 'running') setMessage(`${DEVICES[device].name} ready. Tap a lane to arm it.`);
}

function updateHud() {
  const core = game?.core ?? 3;
  const energy = game?.energy ?? 5;
  $('core-value').textContent = `${'♥ '.repeat(core)}${'♡ '.repeat(3 - core)}`.trim();
  $('energy-value').textContent = `${energy}/${MAX_ENERGY}`;
  $('kills-value').textContent = `${game?.kills ?? 0}/${game?.wave.length ?? 19}`;
  $('energy-bar').style.width = `${energy / MAX_ENERGY * 100}%`;
  $('cabinet-label').textContent = game?.status === 'running' ? (mode === 'daily' ? 'DAILY DEFENSE' : 'PRACTICE DEFENSE') : 'DAILY DEFENSE';
  $('day-label').textContent = game?.status === 'running'
    ? `${game.spawnIndex}/${game.wave.length} INCOMING`
    : prettyDay(dayKey);
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const trap = game?.traps[lane];
    const socket = lanes[lane].querySelector('.socket');
    socket.classList.toggle('armed', Boolean(trap));
    socket.dataset.device = trap?.device || '';
    socket.firstElementChild.textContent = trap?.device === 'capacitor' ? '◈' : trap ? 'ϟ' : '+';
    lanes[lane].setAttribute('aria-label', trap
      ? `Remove ${trap.device} from ${lanes[lane].querySelector('.lane-name b').textContent} lane and refund energy`
      : `Arm ${lanes[lane].querySelector('.lane-name b').textContent} lane with ${selectedDevice}`);
  }
}

function renderBots() {
  if (!game) return;
  const present = new Set();
  for (const bot of game.bots) {
    present.add(bot.id);
    let node = botNodes.get(bot.id);
    if (!node) {
      node = document.createElement('span');
      node.className = `bot ${bot.kind}`;
      node.dataset.kind = bot.kind;
      node.setAttribute('aria-hidden', 'true');
      node.innerHTML = '<span class="bot-health"></span><span class="bot-label"></span>';
      node.querySelector('.bot-label').textContent = THEMES[themeName].enemy[bot.kind];
      lanes[bot.lane].querySelector('.bot-layer').append(node);
      botNodes.set(bot.id, node);
    }
    node.style.left = `${bot.x * 100}%`;
    node.querySelector('.bot-health').textContent = bot.hp > 1 ? '◆ ◆' : '';
  }
  for (const [id, node] of botNodes) {
    if (!present.has(id)) {
      node.remove();
      botNodes.delete(id);
    }
  }
}

function handleEvents(events) {
  for (const event of events) {
    if (event.type === 'fire') {
      const socket = lanes[event.lane].querySelector('.socket');
      socket.classList.remove('firing');
      void socket.offsetWidth;
      socket.classList.add('firing');
    }
  }
  if (events.some((event) => event.type === 'breach')) {
    setMessage('The shelter took a hit. Hold the next lane!');
  } else if (events.some((event) => event.type === 'kill')) {
    setMessage('Nice work. That machine is spare parts now.');
  } else if (events.some((event) => event.type === 'spawn') && game.elapsed - lastHint > 3.5) {
    const lane = urgentLane(game) + 1;
    setMessage(`Incoming machine. Check lane ${lane}.`);
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
    renderBots();
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

function startRound(requestedMode, seed) {
  cancelAnimationFrame(frame);
  mode = requestedMode;
  activeSeed = seed ?? (mode === 'daily' ? seedFromText(`circuit-siege-v1:${dayKey}`) : freshPracticeSeed());
  game = createGame(activeSeed, mode);
  lastHint = 0;
  for (const node of botNodes.values()) node.remove();
  botNodes.clear();
  overlay.classList.add('hidden');
  intro.classList.add('hidden');
  result.classList.add('hidden');
  $('mode-label').textContent = mode === 'daily' ? 'DAILY WAVE · CHOOSE A DEVICE, THEN TAP A LANE' : 'PRACTICE WAVE · CHOOSE A DEVICE, THEN TAP A LANE';
  setMessage('Start with a coil. Save capacitors for heavy machines or clusters.');
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
  renderBots();
  updateHud();
  const total = game.wave.length;
  const won = game.core > 0;
  const points = score(game);
  $('result-kicker').textContent = won ? 'TRANSMISSION COMPLETE' : 'SIGNAL LOST';
  $('result-heading').textContent = won ? 'SHELTER SECURED' : 'SHELTER BREACHED';
  $('result-story').textContent = won ? THEMES[themeName].victory : THEMES[themeName].defeat;
  $('result-kills').textContent = `${game.kills}/${total}`;
  $('result-core').textContent = `${'♥ '.repeat(game.core)}${'♡ '.repeat(3 - game.core)}`.trim();
  $('result-score').textContent = String(points).padStart(4, '0');
  let bestText = mode === 'daily' ? 'Daily wave · UTC' : 'Practice run';
  if (mode === 'daily') {
    const key = `rf-games-best-v1:${dayKey}`;
    const prior = Number(readStorage(key) || 0);
    if (points > prior) {
      writeStorage(key, String(points));
      bestText = prior ? `NEW DAILY BEST · ${points}` : `DAILY BEST · ${points}`;
    } else {
      bestText = `YOUR DAILY BEST · ${prior}`;
    }
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
  for (const node of botNodes.values()) node.remove();
  botNodes.clear();
  intro.classList.remove('hidden');
  result.classList.add('hidden');
  overlay.classList.remove('hidden');
  setMessage('Tap a device, then a lane. Tap an armed lane to take it back.');
  updateHud();
}

function shareText() {
  const hearts = '♥'.repeat(game.core) + '♡'.repeat(3 - game.core);
  const title = mode === 'daily' ? `Circuit Siege · ${dayKey} UTC` : 'Circuit Siege · practice';
  const verdict = game.core > 0 ? 'Shelter secured' : 'Shelter breached';
  return `${title}\n${verdict} ${hearts}\n${game.kills}/${game.wave.length} machines stopped · ${score(game)} points\nCan you keep the lights on?`;
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

themeSelect.value = themeChoice;
themeSelect.addEventListener('change', () => {
  themeChoice = themeSelect.value;
  writeStorage('rf-games-theme', themeChoice);
  applyTheme();
});
for (const button of tools) button.addEventListener('click', () => selectDevice(button.dataset.device));
for (const button of lanes) button.addEventListener('click', () => {
  if (!game || game.status !== 'running') return;
  const lane = Number(button.dataset.lane);
  const response = armLane(game, lane, selectedDevice);
  if (response.ok) {
    setMessage(response.action === 'removed' ? 'Device recovered. Energy refunded.' : `${DEVICES[selectedDevice].name} armed in lane ${lane + 1}.`);
    updateHud();
  } else {
    setMessage(`${response.reason}.`);
  }
});
document.addEventListener('keydown', (event) => {
  if (event.target === themeSelect || event.altKey || event.metaKey || event.ctrlKey) return;
  const key = event.key.toLowerCase();
  if (key === 'q') selectDevice('coil');
  if (key === 'w') selectDevice('capacitor');
  if (game?.status === 'running' && /^[1-3]$/.test(key)) lanes[Number(key) - 1].click();
});
$('daily-start').addEventListener('click', () => startRound('daily'));
$('practice-start').addEventListener('click', () => startRound('practice'));
$('retry-button').addEventListener('click', () => startRound(mode, activeSeed));
$('home-button').addEventListener('click', returnHome);
$('share-button').addEventListener('click', shareResult);
applyTheme();
updateHud();
