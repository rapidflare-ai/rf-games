import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { shareResultImage } from '../public/result-share.mjs';

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalClipboardItem = Object.getOwnPropertyDescriptor(globalThis, 'ClipboardItem');

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { configurable: true, value });
}

afterEach(() => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else delete globalThis.navigator;
  if (originalClipboardItem) Object.defineProperty(globalThis, 'ClipboardItem', originalClipboardItem);
  else delete globalThis.ClipboardItem;
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

test('copies the image and text together when there is no native share sheet', async () => {
  let copied;
  setGlobal('ClipboardItem', class { constructor(formats) { this.formats = formats; } });
  setGlobal('navigator', { clipboard: { write: async (items) => { copied = items; } } });
  assert.equal(await shareResultImage(payload), 'copy-image');
  assert.equal(copied[0].formats['image/png'].name, 'result.png');
  assert.equal(await copied[0].formats['text/plain'].text(), `${payload.text}\n${payload.url}`);
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
