import { isMuted, onMuteChange, setMuted, sfx } from './audio.mjs';
import { paintFlares } from './flare.mjs';
import { setupAnalytics, track } from './analytics.mjs';

export const GAMES = Object.freeze([
  { id: 'circuit-siege', name: 'Haunted Circuit Siege', href: '/' },
  { id: 'ten-questions', name: 'Ten Questions Till Dawn', href: '/ten-questions/' },
]);

function keyIsForAField(event) {
  return Boolean(event.altKey || event.metaKey || event.ctrlKey
    || event.target?.closest?.('select, input, textarea, .game-picker'));
}

// True when a key press belongs to a control (menu, select, text field, open dialog) rather than to the game.
export function keyBelongsToControl(event) {
  return keyIsForAField(event) || Boolean(document.querySelector('dialog[open]'));
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
    if (event.key.toLowerCase() !== 'm' || keyIsForAField(event)) return;
    setMuted(!isMuted());
    if (!isMuted()) sfx.select();
  });
}

// Fade a dialog out, then close it. Without motion (or support) it closes at once.
function closeDialog(dialog, then) {
  if (!dialog.open || dialog.classList.contains('leaving')) return;
  const finish = () => { dialog.classList.remove('leaving'); dialog.close(); then?.(); };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
  dialog.classList.add('leaving');
  setTimeout(finish, 220);
}

// The welcome splash shows once per game on first visit; the help panel opens on demand.
// Buttons inside either dialog can carry data-action (handed to onAction) and data-shortcut (a key).
function setupDialogs(currentId, { onAction, onHelpOpen } = {}) {
  const splash = document.getElementById('splash');
  const help = document.getElementById('help-panel');
  const seenKey = `rf-games-splash-seen:${currentId}`;
  const openHelp = () => {
    if (!help || help.open) return;
    track('Game Help Opened', { game: currentId });
    if (splash?.open) splash.close();
    onHelpOpen?.();
    help.showModal();
  };
  for (const dialog of [splash, help].filter(Boolean)) {
    dialog.addEventListener('click', (event) => {
      const control = event.target.closest('[data-action]');
      if (event.target === dialog && dialog === help) { closeDialog(dialog); return; }
      if (!control) return;
      const action = control.dataset.action;
      closeDialog(dialog, () => {
        if (action === 'help') openHelp();
        else if (action === 'splash') splash?.showModal();
        else if (action !== 'close') onAction?.(action);
      });
    });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('keydown', (event) => {
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      const control = dialog.querySelector(`[data-shortcut="${CSS.escape(event.key.toLowerCase())}"]`);
      if (control) { event.preventDefault(); control.click(); }
    });
  }
  splash?.addEventListener('close', () => {
    try { localStorage.setItem(seenKey, 'yes'); } catch { /* Private browsing may deny storage. */ }
  });
  document.getElementById('help-button')?.addEventListener('click', openHelp);
  document.querySelector('.quick-help')?.addEventListener('click', openHelp);
  document.addEventListener('keydown', (event) => {
    const question = event.key === '?' || (event.key === '/' && event.shiftKey);
    if (!question || keyIsForAField(event) || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    openHelp();
  });
  let seen = false;
  try { seen = localStorage.getItem(seenKey) === 'yes'; } catch { /* Treat as a first visit. */ }
  if (splash && !seen) splash.showModal();
}

export function setupSite(currentId, options) {
  paintFlares();
  setupAnalytics();
  setupGamePicker(currentId);
  setupSoundToggle();
  setupDialogs(currentId, options);
}
