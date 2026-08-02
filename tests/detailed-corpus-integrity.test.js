import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  canonicalizeJson,
  createDetailedCorpusIntegrityManifest,
} from '../scripts/detailed-corpus-integrity.mjs';

const corpusUrl = new URL('../knowledge/detailed-evidence.json', import.meta.url);
const manifestUrl = new URL('../knowledge/detailed-evidence.integrity.json', import.meta.url);

test('canonical corpus serialization is independent of object key insertion order', () => {
  const left = { z: 1, nested: { b: true, a: ['kept', 2] } };
  const right = { nested: { a: ['kept', 2], b: true }, z: 1 };

  assert.equal(canonicalizeJson(left), canonicalizeJson(right));
});

test('checked-in detailed corpus integrity manifest matches the reviewed corpus', async () => {
  const corpus = JSON.parse(await readFile(corpusUrl, 'utf8'));
  const checkedIn = JSON.parse(await readFile(manifestUrl, 'utf8'));
  const generated = createDetailedCorpusIntegrityManifest(corpus);
  const sortedIds = corpus.records.map(({ id }) => id).sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

  assert.deepEqual(checkedIn, generated);
  assert.equal(generated.digest.algorithm, 'sha256');
  assert.equal(generated.digest.canonicalization, 'sorted-json-v1');
  assert.match(generated.digest.value, /^[a-f0-9]{64}$/);
  assert.deepEqual(generated.recordIds, sortedIds);
});
