import { CRAFTS, createGame, DIAGNOSTICS, installPart, launchCraft, LANE_COUNT, neededPart, PARTS, score, seedFromText, tick, urgentLane, useAssist, utcDayKey } from './engine.mjs';
import { sfx } from './audio.mjs';
import { focusIsOnControl, keyBelongsToControl, setupSite } from './site.mjs';
import { ACTIVE_THEME, paintGhoul, THEMES } from './themes.mjs';

const $ = (id) => document.getElementById(id);
const lanes = [...document.querySelectorAll('.lane')];
const parts = [...document.querySelectorAll('.part')];
const themeSelect = $('theme-select');
const overlay = $('screen-overlay');
const cards = { intro: $('intro-card'), result: $('result-card') };
const dayKey = utcDayKey();
const themeName = ACTIVE_THEME;
const STOMP_SECONDS = 0.9;
let selectedLane = 0;
let game = null;
let mode = 'daily';
let activeSeed = seedFromText(`circuit-siege-v3:${dayKey}`);
let frame = 0;
let lastFrame = 0;
let lastRender = 0;
let lastHint = 0;
let lastStomp = 0;
let paused = false;
let focusBeforePause = null;
let draggingPart = null;
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

// Show one overlay card (or none) and keep the controls behind it out of the tab order.
function showCard(name) {
  for (const [key, card] of Object.entries(cards)) card.classList.toggle('hidden', key !== name);
  overlay.classList.toggle('hidden', !name);
  document.querySelector('.lane-list').inert = Boolean(name);
  document.querySelector('.control-panel').inert = Boolean(name);
}

function fillGhoulFace(node, kind) {
  paintGhoul(node, themeName, kind);
  node.querySelector('.bot-label').textContent = THEMES[themeName].enemy[kind];
}

function renderGhoulList() {
  const theme = THEMES[themeName];
  $('splash-ghouls').replaceChildren(...['drone', 'runner', 'brute', 'stagger'].map((kind) => {
    const chip = document.createElement('span');
    chip.className = `ghoul-chip ${kind}`;
    chip.innerHTML = '<span class="enemy-face"></span><span class="ghoul-accessory"></span>';
    paintGhoul(chip, themeName, kind);
    return chip;
  }));
  $('ghoul-list').replaceChildren(...['drone', 'runner', 'brute', 'stagger'].map((kind) => {
    const item = document.createElement('li');
    item.innerHTML = `<span class="ghoul-chip ${kind}" aria-hidden="true"><span class="enemy-face"></span><span class="ghoul-accessory"></span></span><span><strong></strong><small></small></span>`;
    paintGhoul(item, themeName, kind);
    item.querySelector('strong').textContent = theme.enemy[kind];
    item.querySelector('small').textContent = theme.blurb[kind];
    return item;
  }));
}

function applyTheme() {
  const theme = THEMES[themeName];
  document.body.dataset.theme = themeName;
  document.querySelector('meta[name="theme-color"]').content = theme.sky;
  $('eyebrow').textContent = theme.eyebrow;
  const [lead, rest] = theme.title === 'CIRCUIT SIEGE' ? ['CIRCUIT', 'SIEGE'] : [theme.title.split(' ')[0], 'CIRCUIT SIEGE'];
  $('game-title').innerHTML = `${lead} <span>${rest}</span>`;
  $('splash-title').innerHTML = `${lead}<br><span>${rest}</span>`;
  $('splash-eyebrow').textContent = theme.eyebrow;
  $('subtitle').textContent = theme.subtitle;
  $('story').textContent = theme.story;
  $('intro-heading').innerHTML = `${theme.intro[0]}<br><em>${theme.intro[1]}</em>`;
  $('result-story').textContent = game?.core > 0 ? theme.victory : theme.defeat;
  document.title = `${theme.title} · Rapid Games`;
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    lanes[lane].querySelector('.lane-name b').textContent = theme.lanes[lane];
  }
  for (const node of botNodes.values()) fillGhoulFace(node, node.dataset.kind);
  renderGhoulList();
  updateHud();
}

function setHtml(node, html) {
  if (node.innerHTML !== html) node.innerHTML = html;
}

function setMessage(message) {
  $('flare-message').textContent = `FLARE: ${message}`;
}

function updateHud() {
  const core = game?.core ?? 3;
  const running = game?.status === 'running';
  $('core-value').textContent = `${'♥ '.repeat(core)}${'♡ '.repeat(3 - core)}`.trim();
  $('launches-value').textContent = String(game?.launches ?? 0);
  $('kills-value').textContent = `${game?.kills ?? 0}/${game?.wave.length ?? 16}`;
  $('cabinet-label').textContent = running && mode === 'practice' ? 'PRACTICE DEFENSE' : 'DAILY DEFENSE';
  $('day-label').textContent = running ? `${game.spawnIndex}/${game.wave.length} INCOMING` : prettyDay(dayKey);
  $('pause-button').disabled = !running;
  setHtml($('pause-button'), paused ? 'RESUME <kbd aria-hidden="true">Esc</kbd>' : 'PAUSE <kbd aria-hidden="true">Esc</kbd>');
  $('pause-button').setAttribute('aria-label', paused ? 'Resume the game' : 'Pause the game and plan your next move');
  $('pause-banner').hidden = !paused;

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const bay = game?.bays[lane];
    const requirement = lanes[lane].querySelector('.requirement');
    const card = lanes[lane].querySelector('.bay-card');
    const needed = bay ? neededPart(game, lane) : [['gps'], ['pcie'], ['power']][lane][0];
    const nearest = game?.bots.filter((bot) => bot.lane === lane).sort((a, b) => a.x - b.x)[0];
    const threat = nearest ? `. ${THEMES[themeName].enemy[nearest.kind]} ${nearest.x < 0.4 ? 'close to the shelter' : 'approaching'}` : '';
    const progress = bay?.installed && !bay.ready ? `${bay.installed}/${bay.queue.length} · ` : '';
    requirement.textContent = bay?.ready ? 'READY · TAP TO LAUNCH' : `${progress}${DIAGNOSTICS[needed].label}`;
    card.classList.toggle('ready', Boolean(bay?.ready));
    lanes[lane].classList.toggle('selected', selectedLane === lane);
    lanes[lane].setAttribute('aria-pressed', String(selectedLane === lane));
    lanes[lane].setAttribute('aria-label', bay?.ready
      ? `Lane ${lane + 1}, ${CRAFTS[lane].name} ready. Activate again to launch${threat}`
      : `Lane ${lane + 1}, ${CRAFTS[lane].name}. Diagnostic: ${DIAGNOSTICS[needed].label}${threat}`);
  }

  const selectedBay = game?.bays[selectedLane];
  const needed = selectedBay ? neededPart(game, selectedLane) : ['gps', 'pcie', 'power'][selectedLane];
  $('selected-bay').textContent = selectedBay?.ready
    ? `${CRAFTS[selectedLane].name.toUpperCase()} · READY TO LAUNCH`
    : `${CRAFTS[selectedLane].name.toUpperCase()} · ${selectedBay?.installed ? `${selectedBay.installed}/${selectedBay.queue.length} · ` : ''}${DIAGNOSTICS[needed].label}`;
  setHtml($('assist-button'), `FLARE AUTO-FIT ×${game?.assists ?? 3} <kbd aria-hidden="true">A</kbd>`);
  $('assist-button').setAttribute('aria-label', `Flare auto-fits one correct part in the selected bay. ${game?.assists ?? 3} uses left.`);
  $('assist-button').disabled = !running || game.assists === 0 || Boolean(selectedBay?.ready);
  $('launch-button').disabled = !running || !selectedBay?.ready;
  setHtml($('launch-button'), selectedBay?.ready
    ? `LAUNCH ${CRAFTS[selectedLane].name.toUpperCase()} <kbd aria-hidden="true">Space</kbd>`
    : 'REPAIR TO LAUNCH <span>→</span>');
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
      node.innerHTML = '<span class="bot-health"></span><span class="enemy-face"></span><span class="ghoul-accessory"></span><span class="ai-stamp">AI</span><span class="bot-label"></span>';
      fillGhoulFace(node, bot.kind);
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
  const enemy = THEMES[themeName].enemy;
  const breach = events.find((event) => event.type === 'breach');
  if (breach) {
    sfx.breach();
    setMessage(breach.kind === 'brute'
      ? `${enemy.brute} SMASH! The shelter took a hit in lane ${breach.lane + 1}.`
      : `The shelter took a hit in lane ${breach.lane + 1}. Launch into that lane!`);
  } else if (events.some((event) => event.type === 'kill')) {
    sfx.hit();
    setMessage('Direct hit. Humans and friendly AI make a good team.');
  } else if (events.some((event) => event.type === 'hit')) {
    sfx.hit();
    setMessage(`Hit! ${enemy.brute} shrugged it off. One more.`);
  } else if (events.some((event) => event.type === 'spawn')) {
    sfx.spawn();
    if (game.elapsed - lastHint > 3.5) {
      const spawned = events.filter((event) => event.type === 'spawn').at(-1);
      setMessage(`${enemy[spawned.kind]} incoming in lane ${spawned.lane + 1}. Most urgent: lane ${urgentLane(game) + 1}.`);
      lastHint = game.elapsed;
    }
  }
  if (game.status === 'finished') finishRound();
}

function loop(timestamp) {
  if (!game || game.status !== 'running' || paused) return;
  const seconds = Math.min((timestamp - lastFrame) / 1000 || 0, 0.12);
  lastFrame = timestamp;
  const events = tick(game, seconds);
  if (game.bots.some((bot) => bot.kind === 'brute') && game.elapsed - lastStomp >= STOMP_SECONDS) {
    sfx.stomp();
    lastStomp = game.elapsed;
  }
  if (timestamp - lastRender > 33 || events.length) {
    renderActors();
    updateHud();
    lastRender = timestamp;
  }
  if (events.length) handleEvents(events);
  if (game.status === 'running' && !paused) frame = requestAnimationFrame(loop);
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
  activeSeed = seed ?? (mode === 'daily' ? seedFromText(`circuit-siege-v3:${dayKey}`) : freshPracticeSeed());
  game = createGame(activeSeed, mode);
  selectedLane = 0;
  lastHint = 0;
  lastStomp = 0;
  paused = false;
  draggingPart = null;
  resetActors();
  showCard(null);
  setMessage(`${DIAGNOSTICS[neededPart(game, 0)].hint} Choose a part or drag it onto a bay. My Auto-Fit can solve one step, three times per wave.`);
  updateHud();
  sfx.select();
  lastFrame = performance.now();
  lastRender = 0;
  frame = requestAnimationFrame(loop);
  lanes[0].focus({ preventScroll: true });
  if (window.matchMedia('(max-width: 720px)').matches) {
    document.querySelector('.cabinet').scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }
}

function pauseRound() {
  if (!game || game.status !== 'running' || paused) return;
  paused = true;
  cancelAnimationFrame(frame);
  focusBeforePause = document.activeElement;
  updateHud();
  setMessage('Paused. Inspect the bays, then fit a part or launch to resume instantly.');
}

function resumeRound({ focus = true, announce = true } = {}) {
  if (!game || game.status !== 'running' || !paused) return;
  paused = false;
  updateHud();
  if (announce) setMessage('Back in action.');
  lastFrame = performance.now();
  frame = requestAnimationFrame(loop);
  if (focus) (focusBeforePause?.isConnected && !focusBeforePause.closest('.screen-overlay') ? focusBeforePause : lanes[selectedLane]).focus({ preventScroll: true });
}

function finishRound() {
  cancelAnimationFrame(frame);
  paused = false;
  renderActors();
  updateHud();
  const won = game.core > 0;
  const points = score(game);
  if (won) sfx.win(); else sfx.lose();
  $('result-kicker').textContent = won ? 'TRANSMISSION COMPLETE' : 'SIGNAL LOST';
  $('result-heading').textContent = won ? 'SHELTER SECURED' : 'SHELTER BREACHED';
  $('result-story').textContent = won ? THEMES[themeName].victory : THEMES[themeName].defeat;
  $('result-kills').textContent = `${game.kills}/${game.wave.length}`;
  $('result-core').textContent = `${'♥ '.repeat(game.core)}${'♡ '.repeat(3 - game.core)}`.trim();
  $('result-score').textContent = String(points).padStart(4, '0');
  let bestText = mode === 'daily' ? 'Daily wave · UTC' : 'Practice run';
  if (mode === 'daily') {
    const key = `rf-games-best-v3:${dayKey}`;
    const prior = Number(readStorage(key) || 0);
    if (points > prior) {
      writeStorage(key, String(points));
      bestText = prior ? `NEW DAILY BEST · ${points}` : `DAILY BEST · ${points}`;
    } else bestText = `YOUR DAILY BEST · ${prior}`;
  }
  $('best-line').textContent = bestText;
  showCard('result');
  $('share-button').focus();
}

function returnHome() {
  cancelAnimationFrame(frame);
  game = null;
  paused = false;
  draggingPart = null;
  selectedLane = 0;
  resetActors();
  showCard('intro');
  setMessage('Select a bay, solve its diagnostic, and launch. My Auto-Fit can solve one step, three times per wave.');
  updateHud();
  $('daily-start').focus();
}

function shareText() {
  const hearts = '♥'.repeat(game.core) + '♡'.repeat(3 - game.core);
  const title = mode === 'daily' ? `Circuit Siege · ${dayKey} UTC` : 'Circuit Siege · practice';
  const verdict = game.core > 0 ? 'Shelter secured' : 'Shelter breached';
  return `${title}\n${verdict} ${hearts}\n${game.kills}/${game.wave.length} ghouls stopped · ${game.launches} friendly craft launched · ${score(game)} points\nFlare and I held the line. Can you?`;
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
    setTimeout(() => { $('share-button').innerHTML = 'SHARE RESULT <kbd aria-hidden="true">S</kbd>'; }, 1800);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setMessage('Sharing is unavailable in this browser. Try copying the page link.');
  }
}

function selectLane(lane) {
  if (!game || game.status !== 'running') return;
  selectedLane = (lane + LANE_COUNT) % LANE_COUNT;
  sfx.click();
  updateHud();
  const needed = neededPart(game, selectedLane);
  setMessage(needed ? `Lane ${selectedLane + 1}, ${CRAFTS[selectedLane].name}: ${DIAGNOSTICS[needed].hint}` : `${CRAFTS[selectedLane].name} is ready. Launch it!`);
}

function installSelected(part) {
  if (!game || game.status !== 'running') return;
  if (paused) resumeRound({ focus: false, announce: false });
  const response = installPart(game, selectedLane, part);
  if (response.ok) {
    sfx.good();
    setMessage(response.ready
      ? `${CRAFTS[selectedLane].name} repaired. Press Space to launch!`
      : `${PARTS[part].name} fitted. Next fault in this bay: ${DIAGNOSTICS[response.next].hint}`);
  } else {
    sfx.bad();
    setMessage(`${response.reason}.`);
  }
  updateHud();
}

function launchSelected() {
  if (!game || game.status !== 'running') return;
  if (paused) resumeRound({ focus: false, announce: false });
  const response = launchCraft(game, selectedLane);
  if (response.ok) sfx.launch(); else sfx.bad();
  setMessage(response.ok ? `${CRAFTS[selectedLane].name} launched! New fault in this bay: ${DIAGNOSTICS[neededPart(game, selectedLane)].hint}` : `${response.reason}.`);
  updateHud();
  renderActors();
}

function assistSelected() {
  if (!game || game.status !== 'running') return;
  if (paused) resumeRound({ focus: false, announce: false });
  const response = useAssist(game, selectedLane);
  if (response.ok) sfx.good(); else sfx.bad();
  setMessage(response.ok
    ? response.ready ? `I auto-fitted the ${PARTS[response.part].name}. Craft ready to launch!` : `I auto-fitted the ${PARTS[response.part].name}. Next fault in this bay: ${DIAGNOSTICS[response.next].hint}`
    : `${response.reason}.`);
  updateHud();
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
function clearDrag() {
  draggingPart = null;
  for (const button of parts) button.classList.remove('dragging');
  for (const button of lanes) button.classList.remove('drop-target');
}
for (const button of parts) {
  button.addEventListener('dragstart', (event) => {
    if (!game || game.status !== 'running') { event.preventDefault(); return; }
    draggingPart = button.dataset.part;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggingPart);
    button.classList.add('dragging');
  });
  button.addEventListener('dragend', clearDrag);
}
for (const button of lanes) {
  button.addEventListener('dragover', (event) => {
    if (!draggingPart || !game || game.status !== 'running') return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    button.classList.add('drop-target');
  });
  button.addEventListener('dragleave', (event) => {
    if (!button.contains(event.relatedTarget)) button.classList.remove('drop-target');
  });
  button.addEventListener('drop', (event) => {
    if (!draggingPart || !game || game.status !== 'running') return;
    event.preventDefault();
    const part = draggingPart;
    clearDrag();
    selectLane(Number(button.dataset.lane));
    installSelected(part);
  });
}
$('assist-button').addEventListener('click', assistSelected);
$('launch-button').addEventListener('click', launchSelected);
$('pause-button').addEventListener('click', () => { if (paused) resumeRound(); else pauseRound(); });
$('resume-button').addEventListener('click', () => resumeRound());
$('quit-button').addEventListener('click', returnHome);

const PART_KEYS = { 1: 'gps', 2: 'sensor', 3: 'pcie', 4: 'jammer', 5: 'power' };
const LANE_KEYS = { q: 0, w: 1, e: 2 };
document.addEventListener('keydown', (event) => {
  if (keyBelongsToControl(event)) return;
  const key = event.key.toLowerCase();
  const visible = (name) => !cards[name].classList.contains('hidden') && !overlay.classList.contains('hidden');
  if (visible('intro')) {
    if (key === 'd') { event.preventDefault(); startRound('daily'); }
    if (key === 'r') { event.preventDefault(); startRound('practice'); }
    return;
  }
  if (visible('result')) {
    if (key === 'r') { event.preventDefault(); startRound(mode, activeSeed); }
    if (key === 's') { event.preventDefault(); shareResult(); }
    if (key === 'escape') { event.preventDefault(); returnHome(); }
    return;
  }
  if (!game || game.status !== 'running') return;
  if (key === 'escape') { event.preventDefault(); if (paused) resumeRound(); else pauseRound(); return; }
  if (LANE_KEYS[key] !== undefined) { event.preventDefault(); selectLane(LANE_KEYS[key]); }
  else if (key === 'arrowup' || key === 'arrowdown') {
    event.preventDefault();
    selectLane(selectedLane + (key === 'arrowup' ? -1 : 1));
    if (document.activeElement?.classList.contains('lane')) lanes[selectedLane].focus({ preventScroll: true });
  } else if (PART_KEYS[key]) { event.preventDefault(); installSelected(PART_KEYS[key]); }
  else if (key === 'a') { event.preventDefault(); assistSelected(); }
  else if (key === 'l') { event.preventDefault(); launchSelected(); }
  else if ((key === ' ' || key === 'enter') && !focusIsOnControl()) { event.preventDefault(); launchSelected(); }
  else if (key === ' ' && document.activeElement?.classList.contains('lane') && Number(document.activeElement.dataset.lane) === selectedLane) {
    // Space on the already selected lane launches, like a second tap.
    event.preventDefault();
    if (game.bays[selectedLane].ready) launchSelected();
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRound(); });
$('daily-start').addEventListener('click', () => startRound('daily'));
$('practice-start').addEventListener('click', () => startRound('practice'));
$('retry-button').addEventListener('click', () => startRound(mode, activeSeed));
$('home-button').addEventListener('click', returnHome);
$('share-button').addEventListener('click', shareResult);
setupSite('circuit-siege', {
  onAction: (action) => startRound(action === 'daily' ? 'daily' : 'practice'),
  onHelpOpen: pauseRound,
});
showCard('intro');
applyTheme();
