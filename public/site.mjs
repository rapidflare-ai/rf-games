import { isMuted, onMuteChange, setMuted, sfx } from './audio.mjs';

export const GAMES = Object.freeze([
  { id: 'circuit-siege', name: 'Haunted Circuit Siege', href: '/' },
  { id: 'ten-questions', name: 'Ten Questions Till Dawn', href: '/ten-questions/' },
]);

// True when a key press belongs to a control (menu, select, text field) rather than to the game.
export function keyBelongsToControl(event) {
  const target = event.target;
  return Boolean(event.altKey || event.metaKey || event.ctrlKey
    || target?.closest?.('select, input, textarea, .game-picker'));
}

export function focusIsOnControl() {
  return Boolean(document.activeElement?.closest?.('button, a, select, input, textarea'));
}

function setupGamePicker(currentId) {
  const button = document.getElementById('game-menu-button');
  const menu = document.getElementById('game-menu');
  if (!button || !menu) return;
  const current = GAMES.find((game) => game.id === currentId);
  if (current) button.querySelector('.menu-current').textContent = current.name.toUpperCase();
  menu.replaceChildren(...GAMES.map((game) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = game.href;
    link.textContent = game.name;
    if (game.id === currentId) link.setAttribute('aria-current', 'page');
    item.append(link);
    return item;
  }));
  const links = () => [...menu.querySelectorAll('a')];
  const open = (focusIndex = 0) => {
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    links()[focusIndex]?.focus();
  };
  const close = (returnFocus = true) => {
    if (menu.hidden) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (returnFocus) button.focus();
  };
  button.addEventListener('click', () => (menu.hidden ? open(Math.max(0, links().findIndex((link) => link.hasAttribute('aria-current')))) : close()));
  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); open(0); }
    if (event.key === 'ArrowUp') { event.preventDefault(); open(links().length - 1); }
  });
  menu.addEventListener('keydown', (event) => {
    const items = links();
    const index = items.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); items[(index + 1) % items.length].focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); items[(index - 1 + items.length) % items.length].focus(); }
    if (event.key === 'Home') { event.preventDefault(); items[0].focus(); }
    if (event.key === 'End') { event.preventDefault(); items.at(-1).focus(); }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.game-picker')) close(false);
  });
  menu.addEventListener('focusout', (event) => {
    if (!event.relatedTarget?.closest?.('.game-picker')) close(false);
  });
}

function setupSoundToggle() {
  const button = document.getElementById('sound-toggle');
  if (!button) return;
  const render = (off) => {
    button.setAttribute('aria-pressed', String(!off));
    button.querySelector('.sound-label').textContent = off ? 'SOUND OFF' : 'SOUND ON';
    button.querySelector('.sound-icon').textContent = off ? '🔇' : '🔊';
  };
  render(isMuted());
  onMuteChange(render);
  button.addEventListener('click', () => {
    setMuted(!isMuted());
    if (!isMuted()) sfx.select();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'm' || keyBelongsToControl(event)) return;
    setMuted(!isMuted());
    if (!isMuted()) sfx.select();
  });
}

export function setupSite(currentId) {
  setupGamePicker(currentId);
  setupSoundToggle();
}
