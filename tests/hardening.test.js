import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path, encoding = 'utf8') => readFile(new URL(path, root), encoding);
const exists = async (path) => access(new URL(path, root)).then(() => true, () => false);

const html = await read('index.html');
const privacy = await read('public/privacy.html');
const robots = await read('public/robots.txt');
const sitemap = await read('public/sitemap.xml');
const css = await read('src/styles.css');

test('ships the purpose-built v9 social card and complete icon metadata', async () => {
  for (const path of [
    'public/og-card-v9.png',
    'public/favicon.ico',
    'public/apple-touch-icon.png',
    'public/icons/icon-192.png',
    'public/icons/icon-512.png',
    'public/site.webmanifest',
  ]) assert.equal(await exists(path), true, `Missing ${path}`);

  const card = await read('public/og-card-v9.png', null);
  assert.equal(card.subarray(1, 4).toString(), 'PNG');
  assert.equal(card.readUInt32BE(16), 1200);
  assert.equal(card.readUInt32BE(20), 630);
  assert.match(html, /og-card-v9\.png/);
  assert.doesNotMatch(html, /og-card-v[1-8]\.png/);
  assert.match(html, /rel="apple-touch-icon"[^>]+apple-touch-icon\.png/);
  assert.match(html, /rel="manifest"[^>]+site\.webmanifest/);
});

test('uses responsive project imagery and self-hosted licensed fonts', async () => {
  assert.ok((html.match(/<picture>/g) ?? []).length >= 3);
  assert.ok((html.match(/type="image\/webp"/g) ?? []).length >= 3);
  assert.ok((html.match(/srcset=/g) ?? []).length >= 3);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  for (const file of [
    'public/fonts/archivo-var.woff2',
    'public/fonts/azeret-mono-400.woff2',
    'public/fonts/licenses/OFL-Archivo.txt',
    'public/fonts/licenses/OFL-Azeret-Mono.txt',
  ]) assert.equal(await exists(file), true, `Missing ${file}`);
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

test('preserves the current thirteen-contribution chatbot surface', () => {
  assert.match(html, /data-assistant/);
  assert.match(html, /<h2 id="assistant-title">Ask Joshua<\/h2>/);
  assert.match(html, /Answers are assembled from reviewed portfolio evidence/);
  assert.equal((html.match(/class="contribution-row"/g) ?? []).length, 13);
  assert.match(html, /<b>13<\/b> upstream PRs/);
});


test('publishes a privacy page with per-page metadata, robots and sitemap coverage', () => {
  assert.match(privacy, /<title>Privacy · Joshua Nwachinemere<\/title>/);
  assert.match(privacy, /<meta name="description" content="How this portfolio handles data:/);
  assert.match(privacy, /<link rel="canonical" href="https:\/\/joshua-nwachinemere\.pages\.dev\/privacy"/);
  assert.match(privacy, /<meta name="robots" content="index, follow"/);
  assert.match(privacy, /No cookies, no analytics, no trackers/);
  assert.doesNotMatch(privacy, /<script[^>]+(?:googletagmanager|plausible|umami|analytics)/i);
  assert.match(robots, /Sitemap: https:\/\/joshua-nwachinemere\.pages\.dev\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(sitemap, /<loc>https:\/\/joshua-nwachinemere\.pages\.dev\/privacy<\/loc>/);
  assert.match(sitemap, /<lastmod>2026-11-09<\/lastmod>/);
  assert.match(html, /<a href="\/privacy">Privacy<\/a>/);
});
