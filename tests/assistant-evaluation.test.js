import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { answerQuestion } from '../src/assistant/core.js';

const manifest = JSON.parse(
  await readFile(new URL('./fixtures/assistant-evaluation.json', import.meta.url), 'utf8'),
);

for (const evaluationCase of manifest.cases) {
  test(`evaluation ${evaluationCase.id}: ${evaluationCase.question}`, () => {
    const response = answerQuestion(evaluationCase.question);
    const actualIds = response.evidenceIds || [];

    if (evaluationCase.expectedOutcome === 'abstained') {
      assert.notEqual(
        response.outcome,
        'answered',
        `expected abstention, got evidence: ${actualIds.join(', ')}`,
      );
      assert.deepEqual(actualIds, []);
      return;
    }

    assert.equal(response.outcome, 'answered');
    assert.deepEqual(actualIds, evaluationCase.expectedEvidenceIds);
    for (const forbiddenId of evaluationCase.forbiddenEvidenceIds || []) {
      assert.ok(!actualIds.includes(forbiddenId), `selected forbidden evidence ${forbiddenId}`);
    }
  });
}
