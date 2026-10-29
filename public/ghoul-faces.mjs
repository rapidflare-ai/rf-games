// Hand-drawn Halloween ghoul faces, each a play on the ghoul's name. Inline SVG, sized by font-size (1em).
const svg = (body) => `<svg viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false">${body}</svg>`;

// Chat al Ghoul: a speech-bubble specter that types "…" and keeps everything padlocked.
const chatAlGhoul = svg(`
  <path d="M7 8h34a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5H20l-9 8 2-8H7a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5z" fill="#dff8ec" stroke="#6fe3b0" stroke-width="2"/>
  <path d="M10 18q4-5 9 0M29 18q5-5 9 0" fill="none" stroke="#1a1325" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="15" cy="21" rx="2.6" ry="3.2" fill="#e8304a"/><ellipse cx="33" cy="21" rx="2.6" ry="3.2" fill="#e8304a"/>
  <circle cx="18" cy="29" r="1.9" fill="#1a1325"/><circle cx="24" cy="29" r="1.9" fill="#1a1325"/><circle cx="30" cy="29" r="1.9" fill="#1a1325"/>
  <path d="M37 33v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#f2c14e" stroke-width="2.2"/>
  <rect x="35" y="33" width="11" height="9" rx="1.8" fill="#f2c14e" stroke="#8a6414" stroke-width="1"/><circle cx="40.5" cy="37.5" r="1.3" fill="#8a6414"/>`);

// Doppelghoul: twin heads joined at the cheek, mirror-image sparkle eyes.
const sparkle = (x, y) => `<path transform="translate(${x} ${y})" d="M0-3.6L1-1 3.6 0 1 1 0 3.6-1 1-3.6 0-1-1z" fill="#fff6c9"/>`;
const doppelghoul = svg(`
  <path d="M5 46c1-9 6-13 19-13s18 4 19 13z" fill="#3b2b63"/>
  <circle cx="16" cy="21" r="13" fill="#6f8dff" stroke="#2d3b8f" stroke-width="2"/>
  <circle cx="32" cy="21" r="13" fill="#b07cff" stroke="#5a2f9a" stroke-width="2" opacity=".95"/>
  ${sparkle(11, 19)}${sparkle(19, 19)}${sparkle(29, 19)}${sparkle(37, 19)}
  <path d="M10 27l2 2.4 2-2.4 2 2.4 2-2.4M30 27l2 2.4 2-2.4 2 2.4 2-2.4" fill="none" stroke="#1a1325" stroke-width="1.8" stroke-linejoin="round"/>`);

// Clod: a lumpy terracotta clay golem with a stitched mouth and neck bolts.
const clod = svg(`
  <rect x="1" y="29" width="6" height="6" rx="1" fill="#a7adb5" stroke="#4d525a"/><rect x="41" y="29" width="6" height="6" rx="1" fill="#a7adb5" stroke="#4d525a"/>
  <path d="M9 12q2-8 9-7 3-3 8-1 3-2 8 0 7 1 7 9l2 21q-1 11-19 11T6 34z" fill="#d97757" stroke="#6e3420" stroke-width="2"/>
  <circle cx="14" cy="38" r="2.2" fill="#b85d40"/><circle cx="35" cy="12" r="2" fill="#b85d40"/><circle cx="36" cy="37" r="1.6" fill="#b85d40"/>
  <path d="M17 10h14M19 8v4M23 8v4M27 8v4" stroke="#6e3420" stroke-width="1.6"/>
  <path d="M11 19l10 3M37 19l-10 3" stroke="#3b1a0f" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="17" cy="25" r="2.6" fill="#ffd45e"/><circle cx="31" cy="25" r="2.6" fill="#ffd45e"/>
  <path d="M14 34h20M17 31.5v5M21 31.5v5M25 31.5v5M29 31.5v5M33 31.5v5" stroke="#3b1a0f" stroke-width="1.8" stroke-linecap="round"/>`);

// Grog: a groggy shadow ghost in a floppy nightcap, eyes drooping, mid-yawn.
const grog = svg(`
  <path d="M8 24a16 16 0 0 1 32 0v20l-4-3-4 3-4-3-4 3-4-3-4 3-4-3-4 3z" fill="#2c2b36" stroke="#e8e6f2" stroke-width="2"/>
  <path d="M9 17q5-15 22-12 9 2 14 13-8-5-20-4-9 1-16 3z" fill="#e8e6f2"/>
  <path d="M15 11l4 2M23 7l3 4M31 7l1 5" stroke="#6b6680" stroke-width="2"/>
  <circle cx="45" cy="19" r="3" fill="#e8e6f2"/>
  <path d="M13 24q4 3 8 0M27 24q4 3 8 0" fill="none" stroke="#e8e6f2" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M14 22h7M27 22h7" stroke="#8b86a0" stroke-width="1.4"/>
  <ellipse cx="24" cy="33" rx="3.4" ry="4.4" fill="#0d0c12" stroke="#e8e6f2" stroke-width="1.4"/>`);

export const HALLOWEEN_FACES = Object.freeze({
  drone: chatAlGhoul,
  runner: doppelghoul,
  brute: clod,
  stagger: grog,
});
