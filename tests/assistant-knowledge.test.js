import test from 'node:test';
import assert from 'node:assert/strict';

import { evidence } from '../src/assistant/core.js';
import { buildKnowledgeHints } from '../src/assistant/knowledge.js';

const evidenceIds = new Set(evidence.map((item) => item.id));

test('knowledge hints map retrieved README chunks only to reviewed evidence records', () => {
  const result = buildKnowledgeHints('How does Noughtline handle multiplayer rooms and reconnects?', 4);

  assert.deepEqual(result.evidenceIds, ['noughtline']);
  assert.ok(result.hints.length > 0);
  assert.ok(result.hints.length <= 4);
  assert.ok(result.hints.every((hint) => hint.sourceId === 'project-noughtline'));
  assert.ok(result.hints.every((hint) => hint.text.length <= 900));
  assert.ok(result.evidenceIds.every((id) => evidenceIds.has(id)));
});

test('knowledge hints do not leak contact details or invent an evidence mapping', () => {
  const result = buildKnowledgeHints('What is Joshua’s private home address and favourite food?', 4);
  const serialized = JSON.stringify(result);

  assert.deepEqual(result.evidenceIds, []);
  assert.deepEqual(result.hints, []);
  assert.doesNotMatch(serialized, /[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i);
});

test('organization retrieval maps VolyxAI source material to the reviewed company record', () => {
  const result = buildKnowledgeHints('How does VolyxAI approach workflow discovery and human approval?', 3);

  assert.deepEqual(result.evidenceIds, ['volyxai-company']);
  assert.ok(result.hints.length > 0);
  assert.ok(result.hints.every((hint) => hint.sourceId === 'volyxai-site'));
});

test('every registered project source has a live reviewed evidence mapping', () => {
  const localReview = buildKnowledgeHints('Which project uses BM25 Chroma Ollama and Recall@5?', 4);
  assert.deepEqual(localReview.evidenceIds, ['local-review-intelligence']);

  const telegram = buildKnowledgeHints('Which Telegram downloader uses bounded concurrency and durable queues?', 4);
  assert.deepEqual(telegram.evidenceIds, ['backend-projects']);
});
