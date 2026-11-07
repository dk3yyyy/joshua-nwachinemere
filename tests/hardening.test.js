import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path, encoding = 'utf8') => readFile(new URL(path, root), encoding);
const exists = async (path) => access(new URL(path, root)).then(() => true, () => false);

const html = await read('index.html');
const css = await read('src/styles.css');

test('ships the purpose-built v6 social card and complete icon metadata', async () => {
  for (const path of [
    'public/og-card-v6.png',
    'public/favicon.ico',
    'public/apple-touch-icon.png',
    'public/icons/icon-192.png',
    'public/icons/icon-512.png',
    'public/site.webmanifest',
  ]) assert.equal(await exists(path), true, `Missing ${path}`);

  const card = await read('public/og-card-v6.png', null);
  assert.equal(card.subarray(1, 4).toString(), 'PNG');
  assert.equal(card.readUInt32BE(16), 1200);
  assert.equal(card.readUInt32BE(20), 630);
  assert.match(html, /og-card-v6\.png/);
  assert.doesNotMatch(html, /og-card-v[1-5]\.png/);
  assert.match(html, /rel="apple-touch-icon"[^>]+apple-touch-icon\.png/);
  assert.match(html, /rel="manifest"[^>]+site\.webmanifest/);
});

test('uses responsive project imagery and self-hosted Instrument fonts', async () => {
  assert.ok((html.match(/<picture>/g) ?? []).length >= 3);
  assert.ok((html.match(/type="image\/webp"/g) ?? []).length >= 3);
  assert.ok((html.match(/srcset=/g) ?? []).length >= 3);
  assert.doesNotMatch(html + css, /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/i);
  for (const file of [
    'public/fonts/instrument-sans-latin.woff2',
    'public/fonts/instrument-sans-latin-ext.woff2',
    'public/fonts/instrument-sans-italic-latin.woff2',
    'public/fonts/instrument-serif-latin.woff2',
    'public/fonts/instrument-serif-italic-latin.woff2',
  ]) assert.equal(await exists(file), true, `Missing ${file}`);
  // The legacy self-hosted families are still shipped with their licences even
  // though the editorial design only uses the Instrument pair at runtime.
  for (const file of [
    'public/fonts/manrope-variable.woff2',
    'public/fonts/dm-mono-400.woff2',
    'public/fonts/dm-mono-500.woff2',
    'public/fonts/newsreader-italic-500.woff2',
    'public/fonts/licenses/OFL-Manrope.txt',
    'public/fonts/licenses/OFL-DM-Mono.txt',
    'public/fonts/licenses/OFL-Newsreader.txt',
  ]) assert.equal(await exists(file), true, `Missing ${file}`);
  assert.match(css, /font-family:\s*'Instrument Sans'/);
  assert.match(css, /font-family:\s*'Instrument Serif'/);
  for (const face of css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)) {
    assert.match(face[1], /font-display:\s*swap/, 'Every self-hosted face must swap');
    assert.match(face[1], /src:\s*url\('\/fonts\//, 'Every self-hosted face must resolve locally');
  }
});

test('adds a static 404 and hardened same-origin headers without blocking production indexing', async () => {
  const [headers, notFound] = await Promise.all([read('public/_headers'), read('public/404.html')]);
  for (const directive of [
    'Content-Security-Policy:',
    "connect-src 'self'",
    "frame-ancestors 'none'",
    'Permissions-Policy:',
    'Strict-Transport-Security:',
    'Cross-Origin-Opener-Policy:',
    'Cache-Control: public, max-age=31536000, immutable',
  ]) assert.ok(headers.includes(directive), `Missing header directive: ${directive}`);
  assert.doesNotMatch(headers, /X-Robots-Tag:\s*(?:noindex|nofollow)/i);
  assert.doesNotMatch(headers, /unsafe-inline/);
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '';
  const hash = createHash('sha256').update(jsonLd).digest('base64');
  assert.ok(headers.includes(`sha256-${hash}`), 'CSP hash must match the JSON-LD block');
  assert.match(notFound, /<title>Page not found · Joshua Nwachinemere<\/title>/);
});

test('preserves the current nine-contribution chatbot surface', () => {
  assert.match(html, /data-assistant/);
  assert.match(html, /<h2 id="assistant-title">Ask Joshua<\/h2>/);
  assert.match(html, /Cloudflare Workers AI via a Cloudflare Pages Function/);
  assert.equal((html.match(/class="contribution-row"/g) ?? []).length, 9);
  assert.match(html, /Nine pull requests authored by Joshua, independently verified and merged into maintained open-source projects\./);
  assert.match(html, /<h2 id="up-h">Upstream<\/h2>/);
});
