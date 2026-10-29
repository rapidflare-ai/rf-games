import { HALLOWEEN_FACES } from './ghoul-faces.mjs';

// Flip this when a new theme is ready to launch. Upcoming themes stay visible but locked.
export const ACTIVE_THEME = 'halloween';

export const THEMES = {
  halloween: {
    label: 'Halloween',
    eyebrow: 'OCTOBER TRANSMISSION · 01',
    title: 'HAUNTED CIRCUIT SIEGE',
    subtitle: 'Frontier AI raised an army of ghouls. Flare is on our side.',
    story: 'Flare, a friendly AI, scans each craft for faults. Read the diagnostic, choose the component that solves it, and launch from the shelter to stop the ghouls.',
    intro: ['FLARE HAS A PLAN.', 'YOU HAVE THE PARTS.'],
    lanes: ['ROOFTOPS', 'MAIN ST.', 'SUBSTATION'],
    enemy: { drone: 'CHAT AL GHOUL', runner: 'DOPPELGHOUL', brute: 'CLOD', stagger: 'GROG' },
    icon: { drone: '🧛', runner: '🎃', brute: '🧟', stagger: '👻' },
    face: HALLOWEEN_FACES,
    accessory: { stagger: '💤' },
    blurb: {
      drone: 'Talks your ear off. Shares nothing. Keeps it all locked up.',
      runner: 'Comes as a pair and never agrees with itself.',
      brute: 'Big, slow and stompy. Takes two hits. CLOD SMASH.',
      stagger: 'Groggy. Dozes off mid-lane, then lurches awake.',
    },
    victory: 'The haunted network is down. The lights stay on.',
    defeat: 'The shelter went dark. Flare has another plan.',
    accent: '#ffad5b',
    accent2: '#b48cff',
    sky: '#141023',
  },
  winter: {
    label: 'Winter',
    eyebrow: 'WINTER TRANSMISSION · 01',
    title: 'WINTER CIRCUIT SIEGE',
    subtitle: 'A rogue frontier AI wants every gift. Flare is saving the day.',
    story: 'Flare scans each craft for faults. Find the right component, repair, and launch to keep the workshop safe.',
    intro: ['FLARE HAS A PLAN.', 'YOU HAVE THE PARTS.'],
    lanes: ['CHIMNEYS', 'WORKSHOP', 'POWER SHED'],
    enemy: { drone: 'FRONTIER TOY', runner: 'TOKEN SNATCHER', brute: 'GIFT MODEL', stagger: 'SLEIGH GLITCH' },
    icon: { drone: '🧸', runner: '☃️', brute: '🎁', stagger: '🦌' },
    accessory: {},
    blurb: {
      drone: 'A wind-up toy with big ideas.',
      runner: 'Fast hands, no manners.',
      brute: 'Heavy. Takes two hits.',
      stagger: 'Lost its sense of direction.',
    },
    victory: 'The gifts are safe. Flare calls that a holiday miracle.',
    defeat: 'The gift snatcher broke through. Rewire and retry.',
    accent: '#80e9d2',
    accent2: '#fb9ba8',
    sky: '#0b1e2b',
  },
  neon: {
    label: 'Neon',
    eyebrow: 'OPEN TRANSMISSION · 01',
    title: 'CIRCUIT SIEGE',
    subtitle: 'Frontier machines advance. A friendly AI helps us fight back.',
    story: 'Flare scans each craft for faults. Find the right component, repair, and launch to keep the shelter safe.',
    intro: ['FLARE HAS A PLAN.', 'YOU HAVE THE PARTS.'],
    lanes: ['SKYWAY', 'MAIN ST.', 'SUBSTATION'],
    enemy: { drone: 'FRONTIER BOT', runner: 'TOKEN RUNNER', brute: 'MEGA MODEL', stagger: 'GLITCH UNIT' },
    icon: { drone: '🤖', runner: '🦾', brute: '👾', stagger: '🛸' },
    accessory: {},
    blurb: {
      drone: 'Standard issue. Relentless.',
      runner: 'Quick and twitchy.',
      brute: 'Heavy. Takes two hits.',
      stagger: 'Its pathfinding is broken.',
    },
    victory: 'Signal restored. Humans win this round.',
    defeat: 'The machines got through. Time to rebuild.',
    accent: '#83e9ff',
    accent2: '#ff7cbd',
    sky: '#0b1525',
  },
};

// Paint a ghoul into a node holding .enemy-face and .ghoul-accessory: a drawn face when the theme
// has one, otherwise its emoji. data-icon feeds the CSS twin effect for emoji-only themes.
export function paintGhoul(node, themeKey, kind) {
  const theme = THEMES[themeKey];
  const face = node.querySelector('.enemy-face');
  if (theme.face?.[kind]) {
    face.innerHTML = theme.face[kind];
    face.dataset.icon = '';
    face.classList.add('drawn');
  } else {
    face.textContent = theme.icon[kind];
    face.dataset.icon = theme.icon[kind];
    face.classList.remove('drawn');
  }
  node.querySelector('.ghoul-accessory').textContent = theme.accessory?.[kind] ?? '';
}
