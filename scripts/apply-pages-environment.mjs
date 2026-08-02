#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve(process.env.PAGES_OUTPUT_DIR || 'dist');
const headersPath = resolve(outputDirectory, '_headers');
const branch = process.env.CF_PAGES_BRANCH?.trim() || '';
const productionBranch = process.env.CF_PAGES_PRODUCTION_BRANCH?.trim() || 'main';
const noindexDirective = '  X-Robots-Tag: noindex, nofollow';

const original = await readFile(headersPath, 'utf8');
let headers = original
  .replace(/^\s*X-Robots-Tag:\s*(?:noindex|nofollow)(?:[^\r\n]*)\r?\n/gim, '')
  .replace(/^\/\*\r?\n/, '/*\n');

const isPreview = Boolean(branch && branch !== productionBranch);
if (isPreview) {
  headers = headers.replace(/^\/\*\n/, `/*\n${noindexDirective}\n`);
}

if (headers !== original) await writeFile(headersPath, headers);
console.log(`[pages-environment] ${isPreview ? `preview branch ${branch}: noindex` : 'production/local build: indexable'}`);
