export const LANE_COUNT = 3;
export const MAX_ENERGY = 7;
export const START_ENERGY = 5;
export const RECHARGE_SECONDS = 1.65;
export const SOCKET_X = 0.25;

export const DEVICES = Object.freeze({
  coil: { name: 'Coil', cost: 1, damage: 1 },
  capacitor: { name: 'Capacitor', cost: 3, damage: 2 },
});

const ENEMIES = Object.freeze({
  drone: { hp: 1, speed: 0.112, points: 100 },
  runner: { hp: 1, speed: 0.157, points: 130 },
  brute: { hp: 2, speed: 0.084, points: 200 },
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
  let time = 1.5;
  let previousLane = -1;
  let sameLaneCount = 0;

  for (let index = 0; index < 19; index += 1) {
    let lane = Math.floor(random() * LANE_COUNT);
    if (lane === previousLane && sameLaneCount >= 2) {
      lane = (lane + 1 + Math.floor(random() * (LANE_COUNT - 1))) % LANE_COUNT;
    }
    sameLaneCount = lane === previousLane ? sameLaneCount + 1 : 1;
    previousLane = lane;

    const kind = index >= 4 && index % 5 === 4
      ? 'brute'
      : index >= 3 && index % 4 === 3
        ? 'runner'
        : 'drone';

    wave.push({ id: index, at: Number(time.toFixed(2)), lane, kind });
    time += 1.55 + random() * 0.55;
    if (index === 8 || index === 14) time += 1.5;
  }

  return wave;
}

export function createGame(seed, mode = 'daily') {
  const wave = makeScenario(seed);
  return {
    mode,
    seed,
    wave,
    spawnIndex: 0,
    bots: [],
    traps: Array(LANE_COUNT).fill(null),
    energy: START_ENERGY,
    recharge: 0,
    core: 3,
    kills: 0,
    elapsed: 0,
    status: 'running',
    events: [],
    lastSpawnAt: wave.at(-1).at,
  };
}

export function armLane(game, lane, device) {
  if (game.status !== 'running') return { ok: false, reason: 'Round is over' };
  if (!Number.isInteger(lane) || lane < 0 || lane >= LANE_COUNT) {
    return { ok: false, reason: 'Choose a lane' };
  }
  if (game.traps[lane]) {
    const refund = DEVICES[game.traps[lane].device].cost;
    game.energy = Math.min(MAX_ENERGY, game.energy + refund);
    game.traps[lane] = null;
    game.events.push({ type: 'remove', lane });
    return { ok: true, action: 'removed' };
  }
  if (!DEVICES[device]) return { ok: false, reason: 'Choose a device' };
  if (game.energy < DEVICES[device].cost) {
    return { ok: false, reason: 'Need more energy' };
  }
  game.energy -= DEVICES[device].cost;
  game.traps[lane] = { device };
  game.events.push({ type: 'arm', lane, device });
  return { ok: true, action: 'armed' };
}

export function tick(game, seconds) {
  if (game.status !== 'running') return [];
  const dt = Math.max(0, Math.min(seconds, 0.12));
  game.events = [];
  game.elapsed += dt;

  game.recharge += dt;
  while (game.recharge >= RECHARGE_SECONDS) {
    game.recharge -= RECHARGE_SECONDS;
    game.energy = Math.min(MAX_ENERGY, game.energy + 1);
  }

  while (game.spawnIndex < game.wave.length && game.wave[game.spawnIndex].at <= game.elapsed) {
    const entry = game.wave[game.spawnIndex];
    const stats = ENEMIES[entry.kind];
    game.bots.push({ ...entry, x: 1.035, hp: stats.hp, maxHp: stats.hp, speed: stats.speed });
    game.events.push({ type: 'spawn', lane: entry.lane, kind: entry.kind });
    game.spawnIndex += 1;
  }

  for (const bot of game.bots) bot.x -= bot.speed * dt;

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const trap = game.traps[lane];
    if (!trap) continue;
    const target = game.bots
      .filter((bot) => bot.lane === lane && bot.hp > 0 && bot.x <= SOCKET_X)
      .sort((a, b) => a.x - b.x)[0];
    if (!target) continue;

    target.hp -= DEVICES[trap.device].damage;
    game.events.push({ type: 'fire', lane, device: trap.device });

    if (trap.device === 'capacitor') {
      for (const bot of game.bots) {
        if (bot === target || bot.hp <= 0) continue;
        if (Math.abs(bot.lane - lane) === 1 && Math.abs(bot.x - target.x) <= 0.17) {
          bot.hp -= 1;
          game.events.push({ type: 'splash', lane: bot.lane });
        }
      }
    }
    game.traps[lane] = null;
  }

  for (const bot of game.bots) {
    if (bot.hp <= 0) {
      game.kills += 1;
      game.events.push({ type: 'kill', lane: bot.lane, kind: bot.kind });
    } else if (bot.x <= 0.035) {
      game.core = Math.max(0, game.core - 1);
      game.events.push({ type: 'breach', lane: bot.lane });
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
  return game.kills * 100 + game.core * 250 + game.energy * 10;
}

export function urgentLane(game) {
  const closest = [...game.bots].sort((a, b) => a.x - b.x)[0];
  if (closest) return closest.lane;
  return game.wave[game.spawnIndex]?.lane ?? 1;
}
