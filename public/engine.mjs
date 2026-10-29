export const LANE_COUNT = 3;
export const PARTS = Object.freeze({
  gps: { name: 'GPS antenna', icon: '⌁', purpose: 'finding a position' },
  sensor: { name: 'Optical sensor', icon: '◉', purpose: 'seeing a target' },
  pcie: { name: 'PCIe upgrade', icon: '▤', purpose: 'connecting an expansion card' },
  jammer: { name: 'Signal jammer', icon: '⌗', purpose: 'blocking a control signal' },
  power: { name: 'Power cell', icon: 'ϟ', purpose: 'restoring power' },
});

export const DIAGNOSTICS = Object.freeze({
  gps: { label: 'POSITION UNKNOWN', hint: 'It can fly, but cannot tell where it is.' },
  sensor: { label: 'VISION OFFLINE', hint: 'It cannot see the target ahead.' },
  pcie: { label: 'EXPANSION BUS MISSING', hint: 'The next upgrade needs a hardware connection first.' },
  jammer: { label: 'AI SIGNAL STILL LIVE', hint: 'The frontier AI can still steer it remotely.' },
  power: { label: 'POWER DEPLETED', hint: 'Its battery cannot power a launch.' },
});

export const CRAFTS = Object.freeze([
  { kind: 'drone', name: 'Scout drone', icon: '✦', damage: 1, speed: 0.58 },
  { kind: 'fighter', name: 'Fighter jet', icon: '➤', damage: 2, speed: 0.73 },
  { kind: 'rover', name: 'Rescue rover', icon: '▣', damage: 1, speed: 0.54 },
]);

// Speeds are lane widths per second. Staggering ghouls doze off, then lurch forward.
export const ENEMIES = Object.freeze({
  drone: { hp: 1, speed: 0.056 },
  runner: { hp: 1, speed: 0.076 },
  brute: { hp: 2, speed: 0.041 },
  stagger: { hp: 1, speed: 0.062, stagger: 1.2 },
});

export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function seedFromText(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeScenario(seed) {
  const random = randomFromSeed(seed);
  const wave = [];
  let at = 2.2;
  let previousLane = -1;
  let repeat = 0;
  for (let index = 0; index < 16; index += 1) {
    let lane = Math.floor(random() * LANE_COUNT);
    if (lane === previousLane && repeat >= 2) lane = (lane + 1 + Math.floor(random() * 2)) % LANE_COUNT;
    repeat = lane === previousLane ? repeat + 1 : 1;
    previousLane = lane;
    const kind = index >= 4 && index % 5 === 4 ? 'brute'
      : index >= 3 && index % 4 === 3 ? 'runner'
        : index >= 2 && index % 3 === 2 ? 'stagger' : 'drone';
    wave.push({ id: index, at: Number(at.toFixed(2)), lane, kind });
    at += 3.9 + random() * 1.0;
    if (index === 7) at += 1.6;
  }
  return wave;
}

function partQueue(seed, lane, cycle) {
  if (cycle === 0) return [['gps'], ['pcie', 'jammer'], ['power']][lane];
  const variant = seedFromText(`${seed}:${lane}:${cycle}`);
  if (lane === 0) return [["gps"], ["sensor"], ["power"]][variant % 3];
  if (lane === 1) return variant % 2 ? ['pcie', 'jammer'] : ['pcie', 'power'];
  return [['power'], ['sensor'], ['jammer']][variant % 3];
}

function makeBay(seed, lane, cycle) {
  return { lane, cycle, queue: partQueue(seed, lane, cycle), installed: 0, ready: false };
}

export function createGame(seed, mode = 'daily') {
  const wave = makeScenario(seed);
  return {
    mode, seed, wave, spawnIndex: 0,
    bots: [], shots: [], bays: Array.from({ length: LANE_COUNT }, (_, lane) => makeBay(seed, lane, 0)),
    core: 3, kills: 0, launches: 0, mistakes: 0, assists: 3,
    elapsed: 0, status: 'running', events: [], nextShotId: 0,
  };
}

export function neededPart(game, lane) {
  const bay = game.bays[lane];
  return bay?.ready ? null : bay?.queue[bay.installed] ?? null;
}

export function installPart(game, lane, part) {
  if (game.status !== 'running') return { ok: false, reason: 'Round is over' };
  if (!Number.isInteger(lane) || lane < 0 || lane >= LANE_COUNT) return { ok: false, reason: 'Choose a bay' };
  const bay = game.bays[lane];
  if (bay.ready) return { ok: false, reason: 'Craft ready to launch' };
  if (!PARTS[part]) return { ok: false, reason: 'Choose a component' };
  const needed = neededPart(game, lane);
  if (part !== needed) {
    game.mistakes += 1;
    game.events.push({ type: 'wrong', lane, needed, part });
    return { ok: false, reason: 'That part does not solve this diagnostic' };
  }
  bay.installed += 1;
  bay.ready = bay.installed === bay.queue.length;
  game.events.push({ type: bay.ready ? 'ready' : 'install', lane, part });
  return { ok: true, ready: bay.ready, next: neededPart(game, lane) };
}

export function useAssist(game, lane) {
  if (game.status !== 'running') return { ok: false, reason: 'Round is over' };
  if (!Number.isInteger(lane) || lane < 0 || lane >= LANE_COUNT) return { ok: false, reason: 'Choose a bay' };
  if (game.assists <= 0) return { ok: false, reason: 'Flare is recharging' };
  if (game.bays[lane].ready) return { ok: false, reason: 'Craft ready to launch' };
  const part = neededPart(game, lane);
  game.assists -= 1;
  const response = installPart(game, lane, part);
  game.events.push({ type: 'assist', lane, part });
  return { ...response, part };
}

export function launchCraft(game, lane) {
  if (game.status !== 'running') return { ok: false, reason: 'Round is over' };
  if (!Number.isInteger(lane) || lane < 0 || lane >= LANE_COUNT) return { ok: false, reason: 'Choose a bay' };
  const bay = game.bays[lane];
  if (!bay.ready) return { ok: false, reason: 'Solve the diagnostic before launch' };
  const craft = CRAFTS[lane];
  game.shots.push({ id: game.nextShotId++, lane, kind: craft.kind, x: 0.07, speed: craft.speed, damage: craft.damage });
  game.launches += 1;
  game.bays[lane] = makeBay(game.seed, lane, bay.cycle + 1);
  game.events.push({ type: 'launch', lane, kind: craft.kind });
  return { ok: true };
}

export function tick(game, seconds) {
  if (game.status !== 'running') return [];
  const dt = Math.max(0, Math.min(seconds, 0.12));
  game.events = [];
  game.elapsed += dt;

  while (game.spawnIndex < game.wave.length && game.wave[game.spawnIndex].at <= game.elapsed) {
    const entry = game.wave[game.spawnIndex];
    const stats = ENEMIES[entry.kind];
    game.bots.push({ ...entry, x: 1.04, hp: stats.hp, maxHp: stats.hp, speed: stats.speed, stagger: stats.stagger ?? 0 });
    game.events.push({ type: 'spawn', lane: entry.lane, kind: entry.kind });
    game.spawnIndex += 1;
  }

  for (const bot of game.bots) {
    const lurch = bot.stagger ? Math.max(0.08, 1 + bot.stagger * Math.sin(game.elapsed * 1.4 + bot.id)) : 1;
    bot.x -= bot.speed * lurch * dt;
  }
  for (const shot of game.shots) shot.x += shot.speed * dt;

  const spentShots = new Set();
  for (const shot of game.shots) {
    const target = game.bots
      .filter((bot) => bot.lane === shot.lane && bot.hp > 0 && shot.x >= bot.x)
      .sort((a, b) => a.x - b.x)[0];
    if (!target) continue;
    target.hp -= shot.damage;
    spentShots.add(shot.id);
    game.events.push({ type: 'hit', lane: shot.lane, kind: shot.kind });
  }
  game.shots = game.shots.filter((shot) => !spentShots.has(shot.id) && shot.x < 1.08);

  for (const bot of game.bots) {
    if (bot.hp <= 0) {
      game.kills += 1;
      game.events.push({ type: 'kill', lane: bot.lane, kind: bot.kind });
    } else if (bot.x <= 0.035) {
      game.core = Math.max(0, game.core - 1);
      game.events.push({ type: 'breach', lane: bot.lane, kind: bot.kind });
    }
  }
  game.bots = game.bots.filter((bot) => bot.hp > 0 && bot.x > 0.035);

  if (game.core === 0 || (game.spawnIndex === game.wave.length && game.bots.length === 0)) {
    game.status = 'finished';
    game.events.push({ type: 'finish' });
  }
  return game.events;
}

export function score(game) {
  return Math.max(0, game.kills * 100 + game.core * 250 + game.launches * 5 - game.mistakes * 15);
}

export function urgentLane(game) {
  const closest = [...game.bots].sort((a, b) => a.x - b.x)[0];
  return closest?.lane ?? game.wave[game.spawnIndex]?.lane ?? 1;
}
