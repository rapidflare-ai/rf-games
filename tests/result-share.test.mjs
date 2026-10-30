import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { shareResultImage } from '../public/result-share.mjs';

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalClipboardItem = Object.getOwnPropertyDescriptor(globalThis, 'ClipboardItem');
const originalMatchMedia = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { configurable: true, value });
}

afterEach(() => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else delete globalThis.navigator;
  if (originalClipboardItem) Object.defineProperty(globalThis, 'ClipboardItem', originalClipboardItem);
  else delete globalThis.ClipboardItem;
  if (originalMatchMedia) Object.defineProperty(globalThis, 'matchMedia', originalMatchMedia);
  else delete globalThis.matchMedia;
});

const payload = { imagePromise: Promise.resolve({ name: 'result.png', type: 'image/png' }), title: 'Circuit Siege', text: '600 points', url: 'https://games.rapidflare.ai/' };

test('shares the personal PNG, text, and game link together when file sharing works', async () => {
  let shared;
  setGlobal('navigator', { canShare: ({ files }) => files[0].name === 'result.png', share: async (data) => { shared = data; } });
  assert.equal(await shareResultImage(payload), 'native-image');
  assert.equal(shared.files[0].name, 'result.png');
  assert.equal(shared.text, payload.text);
  assert.equal(shared.url, payload.url);
});

test('copies a PNG directly when there is no native share sheet', async () => {
  let copied;
  setGlobal('ClipboardItem', class { constructor(formats) { this.formats = formats; } });
  setGlobal('navigator', { clipboard: { write: async (items) => { copied = items; } } });
  assert.equal(await shareResultImage(payload), 'copy-image');
  assert.equal(copied[0].formats['image/png'].name, 'result.png');
  assert.deepEqual(Object.keys(copied[0].formats), ['image/png']);
});

test('uses the PNG clipboard on desktop even when a native share sheet exists', async () => {
  let copied;
  let shared = false;
  setGlobal('matchMedia', () => ({ matches: true }));
  setGlobal('ClipboardItem', class { constructor(formats) { this.formats = formats; } });
  setGlobal('navigator', {
    canShare: () => true,
    share: async () => { shared = true; },
    clipboard: { write: async (items) => { copied = items; } },
  });
  assert.equal(await shareResultImage(payload), 'copy-image');
  assert.deepEqual(Object.keys(copied[0].formats), ['image/png']);
  assert.equal(shared, false);
});

test('falls back to a link share or plain text when image transfer is unsupported', async () => {
  let shared;
  setGlobal('navigator', { canShare: () => false, share: async (data) => { shared = data; } });
  assert.equal(await shareResultImage(payload), 'native-link');
  assert.equal(shared.files, undefined);
  assert.equal(shared.url, payload.url);

  let copied;
  setGlobal('ClipboardItem', class { constructor(formats) { this.formats = formats; } });
  setGlobal('navigator', { clipboard: { write: async () => { throw new Error('PNG blocked'); }, writeText: async (text) => { copied = text; } } });
  assert.equal(await shareResultImage(payload), 'copy-text');
  assert.equal(copied, `${payload.text}\n${payload.url}`);
});
