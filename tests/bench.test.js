import test from 'node:test';
import assert from 'node:assert/strict';

import { buildIndex, evaluate, highlight, search, staleIndex, tokenize } from '../src/bench/bm25.js';
import { evalQueries, passages } from '../src/bench/corpus.js';

const index = buildIndex(passages);

test('tokenizer lowercases, splits punctuation and can keep stopwords', () => {
  assert.deepEqual(tokenize('Citation-Validation, and the INDEX!'), ['citation', 'validation', 'index']);
  assert.deepEqual(tokenize('Citation-Validation, and the INDEX!', { stopwords: false }), ['citation', 'validation', 'and', 'the', 'index']);
});

test('bm25 ranks the passage that answers a keyword query first', () => {
  for (const [query, expected] of [
    ['citation validation', 'review-cite'],
    ['bookmaker benchmark', 'football-eval'],
    ['sqlite queue', 'dl-what'],
    ['restart recovery', 'dl-queue'],
    ['prompt injection', 'bh-security'],
  ]) {
    const [top] = search(index, query);
    assert.equal(top?.passage.id, expected, `expected ${expected} to rank first for "${query}"`);
  }
});

test('bm25 returns nothing for a query with no vocabulary overlap', () => {
  assert.deepEqual(search(index, 'xylophone quasars'), []);
});

test('passages, hrefs and the evaluation set are internally consistent', () => {
  const ids = new Set(passages.map((passage) => passage.id));
  assert.equal(ids.size, passages.length, 'passage ids must be unique');
  for (const passage of passages) {
    assert.ok(passage.text.length > 40, `${passage.id} needs a usable body`);
    assert.match(passage.href, /^#[a-z-]+$/, `${passage.id} must cite a section on the page`);
  }
  for (const { query, expect: expected } of evalQueries) {
    assert.ok(ids.has(expected), `${query} expects an id that does not exist`);
  }
  assert.ok(evalQueries.length >= 20, 'the demo set should be big enough to be meaningful');
});

test('the labelled evaluation is honest about its ceiling', () => {
  const result = evaluate(index, evalQueries, { k: 5 });
  assert.equal(result.total, evalQueries.length);
  assert.ok(result.recall > 0.8 && result.recall <= 1, `unexpected recall ${result.recall}`);
  assert.ok(result.mrr > 0.6 && result.mrr <= 1, `unexpected MRR ${result.mrr}`);
  // At least one paraphrase should miss: if lexical search finds everything,
  // the demo is no longer showing what it claims to show.
  assert.ok(result.rows.some((row) => row.rank === null), 'expected at least one paraphrase to miss');
});

test('dropping the newest passages lowers recall', () => {
  const full = evaluate(index, evalQueries, { k: 5 });
  const stale = evaluate(buildIndex(staleIndex(passages, 6)), evalQueries, { k: 5 });
  assert.ok(stale.recall < full.recall, 'a stale index must cost recall');
  assert.ok(stale.total - stale.found >= 1);
});

test('highlight marks only the matched terms and keeps the text intact', () => {
  const parts = highlight('Citation validation keeps answers evidence-linked', ['citation', 'linked']);
  assert.equal(parts.map((part) => part.text).join(''), 'Citation validation keeps answers evidence-linked');
  assert.deepEqual(parts.filter((part) => part.match).map((part) => part.text.toLowerCase()), ['citation', 'linked']);
});
