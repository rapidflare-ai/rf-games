// Flare, the friendly AI: a blue flame with a face, holding the tool its game needs.
const TOOLS = {
  // Circuit Siege is about repairs.
  wrench: `
    <path d="M51 51l7-11" stroke="#e8edf7" stroke-width="3.2" stroke-linecap="round"/>
    <g transform="rotate(32 59 35)"><path d="M54.5 35a4.5 4.5 0 0 1 9 0v-4.5h-2.6v3.2h-3.8v-3.2h-2.6z" fill="#e8edf7"/><rect x="57.6" y="35" width="2.8" height="4" fill="#e8edf7"/></g>`,
  // Ten Questions is about asking yes-or-no questions.
  question: `
    <path d="M51 51l4-10" stroke="#e8edf7" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="48" y="26" width="15" height="16" rx="3" fill="#e8edf7"/>
    <path d="M52.6 31.4a3 3 0 1 1 4.2 2.7c-.9.4-1.3 1-1.3 1.9" fill="none" stroke="#3d6be0" stroke-width="2" stroke-linecap="round"/>
    <circle cx="55.5" cy="38.6" r="1.2" fill="#3d6be0"/>`,
};

export function flareSvg(tool = 'wrench') {
  return `<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true" focusable="false">
    <defs><linearGradient id="flare-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db8ff"/><stop offset="1" stop-color="#4f7fe8"/></linearGradient></defs>
    <path d="M17 17c-6 8-9 16-9 25 0 13 10 21 24 21s24-8 24-21c0-9-3-17-10-25 1 8-1 14-5 18-2-10-7-17-11-31-5 9-9 18-8 30-5-3-7-9-5-17z" fill="url(#flare-body)"/>
    <path d="M30 4c2 10 11 17 11 30-3-3-5-7-7-10 1 8-1 13-4 17-5-5-8-11-8-17 0-7 3-14 8-20z" fill="#adcfff"/>
    <path d="M32 30c4 6 10 11 10 19 0 7-5 11-10 11s-10-4-10-11c0-7 6-12 10-19z" fill="#bcd6ff"/>
    <ellipse cx="28.5" cy="44" rx="1.7" ry="2.5" fill="#1b2340"/><ellipse cx="35.5" cy="44" rx="1.7" ry="2.5" fill="#1b2340"/>
    <path d="M29 49.5q3 2.6 6 0" fill="none" stroke="#1b2340" stroke-width="1.6" stroke-linecap="round"/>
    ${TOOLS[tool] ?? ''}
    <circle cx="50.5" cy="51.5" r="2.6" fill="#4f7fe8"/>
  </svg>`;
}

// Fill every element marked data-flare-tool with Flare holding that tool.
export function paintFlares(root = document) {
  for (const node of root.querySelectorAll('[data-flare-tool]')) node.innerHTML = flareSvg(node.dataset.flareTool);
}
