export const THEMES = {
  halloween: {
    label: 'Halloween',
    eyebrow: 'OCTOBER TRANSMISSION · 01',
    title: 'HAUNTED CIRCUIT SIEGE',
    subtitle: 'The frontier AI woke the machines. Patch woke the neighborhood.',
    story: 'A haunted factory is sending possessed robots toward the last lit shelter. Arm the circuit before they arrive.',
    intro: ['THE MACHINES ARE', 'NOT FEELING FRIENDLY.'],
    lanes: ['ROOFTOPS', 'MAIN ST.', 'SUBSTATION'],
    enemy: { drone: 'GHOST BOT', runner: 'PHANTOM', brute: 'IRON GHOUL' },
    victory: 'The haunted network is down. The lights stay on.',
    defeat: 'The shelter went dark. Patch has another plan.',
    accent: '#ffad5b',
    accent2: '#b48cff',
    sky: '#141023',
  },
  winter: {
    label: 'Winter',
    eyebrow: 'WINTER TRANSMISSION · 01',
    title: 'WINTER CIRCUIT SIEGE',
    subtitle: 'A rogue machine wants every gift. Patch has other ideas.',
    story: 'The workshop robots have gone off-script. Keep the shelter and its gifts powered through the night.',
    intro: ['THE TOYS ARE', 'OFF THE NICE LIST.'],
    lanes: ['CHIMNEYS', 'WORKSHOP', 'POWER SHED'],
    enemy: { drone: 'TIN TOY', runner: 'SLEIGH BOT', brute: 'SNOW CRUSHER' },
    victory: 'The gifts are safe. Patch calls that a holiday miracle.',
    defeat: 'The gift snatcher broke through. Rewire and retry.',
    accent: '#80e9d2',
    accent2: '#fb9ba8',
    sky: '#0b1e2b',
  },
  neon: {
    label: 'Neon',
    eyebrow: 'OPEN TRANSMISSION · 01',
    title: 'CIRCUIT SIEGE',
    subtitle: 'Frontier machines advance. A helpful AI gives humanity a spark.',
    story: 'A rogue frontier AI controls the robots. Protect the people with a few clever components.',
    intro: ['THE FUTURE NEEDS', 'A BETTER CIRCUIT.'],
    lanes: ['SKYWAY', 'MAIN ST.', 'SUBSTATION'],
    enemy: { drone: 'DRONE', runner: 'RUNNER', brute: 'HEAVY UNIT' },
    victory: 'Signal restored. Humans win this round.',
    defeat: 'The machines got through. Time to rebuild.',
    accent: '#83e9ff',
    accent2: '#ff7cbd',
    sky: '#0b1525',
  },
};

export function seasonalTheme(date = new Date()) {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  if (month === 10 || (month === 11 && day <= 2)) return 'halloween';
  if (month === 12 || (month === 1 && day <= 5)) return 'winter';
  return 'neon';
}

export function resolveTheme(value, date = new Date()) {
  return value === 'auto' || !THEMES[value] ? seasonalTheme(date) : value;
}
