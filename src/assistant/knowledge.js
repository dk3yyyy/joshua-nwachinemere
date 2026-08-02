import corpus from './corpus.generated.json' with { type: 'json' };

import { retrieveSourceChunks } from './corpus.js';

const SOURCE_TO_EVIDENCE = Object.freeze({
  'volyxai-site': Object.freeze(['volyxai-company']),
  'github-profile': Object.freeze(['profile']),
  'portfolio-readme': Object.freeze(['profile']),
  'project-volyx-lens': Object.freeze(['volyx-lens']),
  'project-local-review-intelligence': Object.freeze(['local-review-intelligence']),
  'project-football-forecasting': Object.freeze(['football-forecasting']),
  'project-telegram-video': Object.freeze(['backend-projects']),
  'project-wallet-analyzer': Object.freeze(['backend-projects']),
  'project-noughtline': Object.freeze(['noughtline']),
  'project-user-count': Object.freeze(['user-count']),
});

const PRIVATE_QUERY = /\b(?:private|home address|phone number|password|secret|api key|token|favourite food|favorite food|salary|bank|date of birth)\b/i;

export function buildKnowledgeHints(question, limit = 4) {
  const normalizedQuestion = String(question || '').trim();
  if (!normalizedQuestion || PRIVATE_QUERY.test(normalizedQuestion)) {
    return { evidenceIds: [], hints: [] };
  }

  const candidates = retrieveSourceChunks(normalizedQuestion, corpus.chunks, Math.max(limit * 4, 16))
    .filter((chunk) => SOURCE_TO_EVIDENCE[chunk.sourceId]);
  const bestSourceScore = candidates.reduce((best, chunk) => Math.max(best, chunk.score), 0);
  const bestSourceIds = new Set(
    candidates
      .filter((chunk) => chunk.score === bestSourceScore)
      .map((chunk) => chunk.sourceId),
  );
  const retrieved = candidates
    .filter((chunk) => bestSourceIds.has(chunk.sourceId))
    .slice(0, limit);

  const evidenceIds = [];
  const seen = new Set();
  for (const chunk of retrieved) {
    for (const evidenceId of SOURCE_TO_EVIDENCE[chunk.sourceId]) {
      if (!seen.has(evidenceId)) {
        seen.add(evidenceId);
        evidenceIds.push(evidenceId);
      }
    }
  }

  return {
    evidenceIds,
    hints: retrieved.map(({ id, sourceId, text, score }) => ({
      id,
      sourceId,
      text,
      score,
    })),
  };
}
