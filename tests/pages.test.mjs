import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const PAGES = ['public/index.html', 'public/ten-questions/index.html', 'public/updates.html', 'public/about.html'];
const GAME_PAGES = { 'public/index.html': 'circuit-siege', 'public/ten-questions/index.html': 'ten-questions' };

test('every page is indexable, names Rapidflare, and carries the parody disclaimer', () => {
  for (const page of PAGES) {
    const html = readFileSync(page, 'utf8');
    assert.doesNotMatch(html, /noindex/, `${page} is indexable`);
    assert.match(html, /<link rel="canonical" href="https:\/\/games\.rapidflare\.ai\//, `${page} has a canonical URL`);
    assert.match(html, /Rapidflare/, `${page} names the maker`);
    assert.match(html, /not affiliated with any AI company/, `${page} has the disclaimer`);
  }
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const header = vercel.headers?.flatMap((rule) => rule.headers).find((item) => item.key === 'X-Robots-Tag');
  assert.notEqual(header?.value, 'noindex');
  assert.match(readFileSync('public/robots.txt', 'utf8'), /Sitemap: https:\/\/games\.rapidflare\.ai\/sitemap\.xml/);
  const sitemap = readFileSync('public/sitemap.xml', 'utf8');
  for (const url of ['/', '/ten-questions/', '/updates', '/about']) {
    assert.ok(sitemap.includes(`<loc>https://games.rapidflare.ai${url}</loc>`));
  }
});

test('game pages have share cards that point at real images', () => {
  for (const [page, game] of Object.entries(GAME_PAGES)) {
    const html = readFileSync(page, 'utf8');
    assert.match(html, /<meta property="og:site_name" content="Rapid Games">/, `${page} names the site`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, `${page} has a large card`);
    assert.match(html, new RegExp(`og:image" content="https://[^"]+/og/${game}\\.png"`), `${page} has a share image`);
    assert.ok(existsSync(`public/og/${game}.png`), `${game} share image exists`);
    assert.doesNotMatch(html, /OpenAI|ChatGPT|Gemini|Grok|Claude|Anthropic/i, `${page} names no real AI product`);
  }
});
