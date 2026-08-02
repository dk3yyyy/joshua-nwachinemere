import assert from 'node:assert/strict';
import test from 'node:test';

import { runRetrievalCase } from '../scripts/qa-detailed-rag.mjs';

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
