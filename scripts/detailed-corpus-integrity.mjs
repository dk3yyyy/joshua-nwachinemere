#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const corpusUrl = new URL('../knowledge/detailed-evidence.json', import.meta.url);
const manifestUrl = new URL('../knowledge/detailed-evidence.integrity.json', import.meta.url);

function compareCodePoints(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function canonicalizeJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeJson).join(',')}]`;
  return `{${Object.keys(value)
    .sort(compareCodePoints)
    .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
    .join(',')}}`;
}

export function createDetailedCorpusIntegrityManifest(corpus) {
  if (!corpus || !Array.isArray(corpus.records)) {
    throw new TypeError('Detailed evidence corpus must contain records.');
  }
  const recordIds = corpus.records.map(({ id }) => id).sort(compareCodePoints);
  return {
    schemaVersion: 1,
    kbVersion: corpus.kbVersion,
    researchCutoff: corpus.researchCutoff,
    recordCount: corpus.records.length,
    digest: {
      algorithm: 'sha256',
      canonicalization: 'sorted-json-v1',
      value: createHash('sha256').update(canonicalizeJson(corpus)).digest('hex'),
    },
    recordIds,
  };
}

async function main() {
  const corpus = JSON.parse(await readFile(corpusUrl, 'utf8'));
  const serialized = `${JSON.stringify(createDetailedCorpusIntegrityManifest(corpus), null, 2)}\n`;
  if (process.argv.includes('--write')) {
    await writeFile(manifestUrl, serialized, 'utf8');
    console.log(`Wrote ${manifestUrl.pathname}`);
    return;
  }
  const checkedIn = await readFile(manifestUrl, 'utf8');
  if (checkedIn !== serialized) throw new Error('Detailed corpus integrity manifest is stale. Run with --write.');
  console.log(`Verified ${manifestUrl.pathname}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
