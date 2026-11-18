#!/usr/bin/env node
/**
 * Points the built site at a different canonical origin.
 *
 * The source keeps https://joshua-nwachinemere.pages.dev as the default so local
 * builds and tests stay stable. Set SITE_ORIGIN (locally or in the Cloudflare
 * Pages project) to publish the same build under a custom domain, e.g.
 *
 *   SITE_ORIGIN=https://joshuanwachinemere.dev npm run build
 *
 * Every canonical, og:url, og:image, twitter:image, sitemap, robots and
 * assistant citation base is rewritten to that origin.
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const DEFAULT_ORIGIN = 'https://joshua-nwachinemere.pages.dev';
const RAW_ORIGIN = process.env.SITE_ORIGIN?.trim() || '';
const outputDirectory = resolve(process.env.PAGES_OUTPUT_DIR || 'dist');
const REWRITABLE = new Set(['.html', '.xml', '.txt', '.json', '.webmanifest', '.js', '.css', '.svg']);

if (!RAW_ORIGIN) {
  console.log(`[site-origin] SITE_ORIGIN not set; keeping ${DEFAULT_ORIGIN}`);
  process.exit(0);
}

const origin = RAW_ORIGIN.replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d+)?$/i.test(origin)) {
  console.error(`[site-origin] SITE_ORIGIN must be an https origin without a path, got: ${RAW_ORIGIN}`);
  process.exit(1);
}
if (origin === DEFAULT_ORIGIN) {
  console.log(`[site-origin] SITE_ORIGIN already matches ${DEFAULT_ORIGIN}`);
  process.exit(0);
}

async function collect(directory) {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries) {
    const full = join(directory, entry);
    const info = await stat(full);
    if (info.isDirectory()) files.push(...await collect(full));
    else if (REWRITABLE.has(extname(entry).toLowerCase())) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of await collect(outputDirectory)) {
  const original = await readFile(file, 'utf8');
  if (!original.includes(DEFAULT_ORIGIN)) continue;
  const updated = original.split(DEFAULT_ORIGIN).join(origin);
  await writeFile(file, updated);
  changed += 1;
}

const remaining = (await Promise.all(
  (await collect(outputDirectory)).map(async (file) => {
    const text = await readFile(file, 'utf8');
    return { file, hits: text.split(DEFAULT_ORIGIN).length - 1 };
  }),
)).filter(({ hits }) => hits > 0);

console.log(`[site-origin] rewrote ${changed} file(s) to ${origin}`);
if (remaining.length) {
  console.log(`[site-origin] still referencing ${DEFAULT_ORIGIN}: ${remaining.map(({ file }) => file).join(', ')}`);
}
