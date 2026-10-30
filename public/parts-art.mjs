// The same silhouette appears on a fault and on the part that repairs it.
// Text labels remain beside the art for players who prefer to read them.
const shapes = {
  gps: '<path d="M16 25V18m-7 9h14M16 18l-8-9a13 13 0 0 0 16 0z"/><circle cx="16" cy="7" r="2" fill="currentColor" stroke="none"/>',
  sensor: '<rect x="4" y="9" width="24" height="16" rx="4"/><circle cx="16" cy="17" r="6"/><circle cx="16" cy="17" r="2" fill="currentColor" stroke="none"/>',
  pcie: '<path d="M5 6h22v16H5zM9 22v4h3v-4m3 0v4h3v-4m3 0v4h3v-4M9 11h14M9 15h7"/>',
  jammer: '<path d="M6 25h20M12 25l4-15 4 15M11 17l10 4M5 10l4 2M27 10l-4 2M3 5l5 2m21-2-5 2"/><circle cx="16" cy="7" r="2"/>',
  power: '<rect x="4" y="8" width="22" height="17" rx="3"/><path d="M26 13h3v7h-3M17 11l-5 7h4l-1 4 6-8h-4z"/>',
  radio: '<path d="M7 25h18V15H7zM12 15l9-9M10 19h5M10 22h5"/><circle cx="21" cy="20" r="2"/><path d="M22 4c3 1 5 3 6 6M21 8c2 1 3 2 4 4"/>',
  thermal: '<path d="M13 17V7a3 3 0 0 1 6 0v10a7 7 0 1 1-6 0z"/><path d="M16 9v12"/><circle cx="16" cy="23" r="2" fill="currentColor" stroke="none"/>',
  regulator: '<rect x="8" y="7" width="16" height="18" rx="2"/><path d="M5 11h3m-3 5h3m-3 5h3m16-10h3m-3 5h3m-3 5h3M11 17h3l2-5 2 9 2-5h2"/>',
};

export function partArt(part) {
  return `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes[part] ?? ''}</svg>`;
}
