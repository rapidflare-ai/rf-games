// Tiny synthesized sound effects. No audio files: every sound is built from oscillators and noise.
const STORAGE_KEY = 'rf-games-sound';
let context = null;
let muted = readMuted();
const listeners = new Set();

function readMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === 'off'; } catch { return false; }
}

function audio() {
  if (muted) return null;
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Context) return null;
  if (!context) context = new Context();
  if (context.state === 'suspended') context.resume();
  return context;
}

function tone({ freq, to = freq, type = 'square', duration = 0.12, gain = 0.06, delay = 0 }) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise({ duration = 0.2, gain = 0.08, frequency = 800, delay = 0 }) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start(start);
}

export const sfx = {
  click: () => tone({ freq: 880, duration: 0.04, gain: 0.03 }),
  select: () => tone({ freq: 520, to: 700, duration: 0.07, gain: 0.04 }),
  good: () => { tone({ freq: 660, duration: 0.08 }); tone({ freq: 990, duration: 0.12, delay: 0.08 }); },
  bad: () => tone({ freq: 220, to: 120, type: 'sawtooth', duration: 0.22, gain: 0.05 }),
  launch: () => { tone({ freq: 300, to: 1400, type: 'sawtooth', duration: 0.3, gain: 0.04 }); noise({ duration: 0.3, gain: 0.04, frequency: 2400 }); },
  hit: () => { noise({ duration: 0.18, gain: 0.09, frequency: 1600 }); tone({ freq: 180, to: 60, duration: 0.18, gain: 0.06 }); },
  breach: () => { noise({ duration: 0.45, gain: 0.14, frequency: 500 }); tone({ freq: 110, to: 40, type: 'sawtooth', duration: 0.45, gain: 0.07 }); },
  stomp: () => { tone({ freq: 90, to: 35, type: 'sine', duration: 0.28, gain: 0.22 }); noise({ duration: 0.16, gain: 0.07, frequency: 300 }); },
  spawn: () => tone({ freq: 140, to: 95, type: 'triangle', duration: 0.35, gain: 0.05 }),
  ask: () => tone({ freq: 600, to: 760, type: 'triangle', duration: 0.09, gain: 0.05 }),
  yes: () => { tone({ freq: 523, duration: 0.09, type: 'triangle' }); tone({ freq: 784, duration: 0.14, type: 'triangle', delay: 0.09 }); },
  no: () => { tone({ freq: 392, duration: 0.09, type: 'triangle' }); tone({ freq: 262, duration: 0.16, type: 'triangle', delay: 0.09 }); },
  cross: () => noise({ duration: 0.09, gain: 0.05, frequency: 3000 }),
  heartbeat: (beats = 2) => {
    for (let beat = 0; beat < beats; beat += 1) {
      tone({ freq: 70, to: 45, type: 'sine', duration: 0.12, gain: 0.2, delay: beat * 0.42 });
      tone({ freq: 60, to: 40, type: 'sine', duration: 0.1, gain: 0.14, delay: beat * 0.42 + 0.16 });
    }
  },
  win: () => [523, 659, 784, 1047].forEach((freq, index) => tone({ freq, duration: 0.16, type: 'triangle', gain: 0.06, delay: index * 0.11 })),
  lose: () => [392, 330, 262, 196].forEach((freq, index) => tone({ freq, duration: 0.22, type: 'sawtooth', gain: 0.045, delay: index * 0.16 })),
};

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = Boolean(value);
  try { localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on'); } catch { /* Private browsing may deny storage. */ }
  if (muted && context) context.suspend();
  for (const listener of listeners) listener(muted);
}

export function onMuteChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Browsers only allow audio after a gesture, so wake the context on the first one.
for (const type of ['pointerdown', 'keydown']) {
  globalThis.addEventListener?.(type, () => { if (!muted) audio(); }, { once: true, capture: true });
}
