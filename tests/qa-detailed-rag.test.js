import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildReport,
  hashNamedSources,
  runRetrievalCase,
  validateSemanticDocument,
  validateSuiteCorpusBinding,
} from '../scripts/qa-detailed-rag.mjs';

const records = [
  {
    id: 'alpha-project',
    type: 'project',
    subject: 'Shared portfolio project',
    title: 'Shared project evidence',
    aliases: [],
    keywords: ['portfolio', 'project'],
    text: 'Reviewed portfolio project evidence.',
  },
  {
    id: 'zeta-project',
    type: 'project',
    subject: 'Shared portfolio project',
    title: 'Shared project evidence',
    aliases: [],
    keywords: ['portfolio', 'project'],
    text: 'Reviewed portfolio project evidence.',
  },
];

const testCase = {
  id: 'semantic-ranking-case',
  question: 'Which portfolio project has reviewed evidence?',
  limit: 1,
  split: 'development',
  strategy: 'semantic-fixture',
  category: 'project',
  expect: { all: ['zeta-project'] },
};

test('retrieval evaluation passes per-case semantic scores into retrieval', async () => {
  const semanticDocument = {
    scoresByCase: {
      'semantic-ranking-case': {
        'zeta-project': 1,
      },
    },
  };

  const result = await runRetrievalCase(testCase, records, semanticDocument);

  assert.equal(result.passed, true, result.reasons.join(', '));
  assert.deepEqual(result.evidenceIds, ['zeta-project']);
});

test('retrieval evaluation remains lexical when no semantic document is supplied', async () => {
  const lexicalCase = {
    ...testCase,
    expect: { all: ['alpha-project'] },
  };

  const result = await runRetrievalCase(lexicalCase, records);

  assert.equal(result.passed, true, result.reasons.join(', '));
  assert.deepEqual(result.evidenceIds, ['alpha-project']);
});

test('suite knowledge-base version and exact corpus digest are bound to the reviewed corpus manifest', () => {
  const digest = 'a'.repeat(64);
  const integrity = { kbVersion: 'kb-v1', digest: { algorithm: 'sha256', value: digest } };
  const suite = { kbVersion: 'kb-v1', corpusDigest: digest };
  assert.doesNotThrow(() => validateSuiteCorpusBinding(suite, integrity, integrity));
  assert.throws(
    () => validateSuiteCorpusBinding({ ...suite, corpusDigest: 'b'.repeat(64) }, integrity, integrity),
    /suite corpus digest/i,
  );
  assert.throws(
    () => validateSuiteCorpusBinding(
      suite,
      { kbVersion: 'kb-v2', digest: { algorithm: 'sha256', value: digest } },
    ),
    /knowledge-base version/i,
  );
  assert.throws(
    () => validateSuiteCorpusBinding(
      suite,
      { kbVersion: 'kb-v1', digest: { algorithm: 'md5', value: 'bad' } },
    ),
    /SHA-256 digest/i,
  );
  assert.throws(
    () => validateSuiteCorpusBinding(
      suite,
      integrity,
      { ...integrity, digest: { ...integrity.digest, value: 'b'.repeat(64) } },
    ),
    /manifest is stale/i,
  );
});

test('implementation provenance hashes every evaluated source deterministically', () => {
  const first = hashNamedSources([
    { source: 'b.js', content: 'beta' },
    { source: 'a.js', content: 'alpha' },
  ]);
  const reordered = hashNamedSources([
    { source: 'a.js', content: 'alpha' },
    { source: 'b.js', content: 'beta' },
  ]);
  const changed = hashNamedSources([
    { source: 'a.js', content: 'changed' },
    { source: 'b.js', content: 'beta' },
  ]);

  assert.deepEqual(first, reordered);
  assert.match(first.sha256, /^[a-f0-9]{64}$/);
  assert.equal(first.files.length, 2);
  assert.notEqual(first.sha256, changed.sha256);
});

test('opened holdout status is reported and endpoint mode cannot pass release gates without attestation', () => {
  const suite = {
    suiteVersion: 'suite-v2',
    kbVersion: 'kb-v1',
    leakagePolicy: {
      developmentCanTuneAliasesAndEvidence: true,
      holdoutStatus: 'opened-regression-only',
      independentPerformanceClaimAllowed: false,
    },
    gates: {},
  };
  const report = buildReport(suite, 'endpoint', [], '2026-08-02T00:00:00.000Z', 0, {
    endpoint: { attested: false },
  });

  assert.deepEqual(report.leakagePolicy, suite.leakagePolicy);
  assert.equal(report.gates.passed, false);
  assert.ok(report.gates.failures.includes('endpoint-build-unattested'));
});

test('semantic evaluator artifacts are bound to the exact suite and reviewed corpus', () => {
  const expected = {
    suiteVersion: 'suite-v1',
    suiteDigest: 'c'.repeat(64),
    kbVersion: 'kb-v1',
    corpusDigest: 'a'.repeat(64),
    caseIds: ['case-001'],
    recordIds: ['record-a'],
  };
  const semanticDocument = {
    ...expected,
    scoresByCase: { 'case-001': { 'record-a': 0.9 } },
  };

  assert.doesNotThrow(() => validateSemanticDocument(semanticDocument, expected));
  assert.throws(
    () => validateSemanticDocument({ ...semanticDocument, corpusDigest: 'b'.repeat(64) }, expected),
    /corpus digest/i,
  );
  assert.throws(
    () => validateSemanticDocument({ ...semanticDocument, suiteVersion: 'suite-v2' }, expected),
    /suite version/i,
  );
  assert.throws(
    () => validateSemanticDocument({ ...semanticDocument, suiteDigest: 'd'.repeat(64) }, expected),
    /suite digest/i,
  );
  assert.throws(
    () => validateSemanticDocument({ ...semanticDocument, scoresByCase: {} }, expected),
    /case coverage/i,
  );
  assert.throws(
    () => validateSemanticDocument({ ...semanticDocument, scoresByCase: { 'case-001': { 'record-b': 0.9 } } }, expected),
    /unknown evidence id/i,
  );
  assert.throws(
    () => validateSemanticDocument({ ...semanticDocument, scoresByCase: { 'case-001': { 'record-a': Number.NaN } } }, expected),
    /invalid score/i,
  );
});
