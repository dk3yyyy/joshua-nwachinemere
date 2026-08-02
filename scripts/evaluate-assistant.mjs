import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { answerQuestion } from '../src/assistant/core.js';

const manifestPath = new URL('../tests/fixtures/assistant-evaluation.json', import.meta.url);
const rawManifest = await readFile(manifestPath, 'utf8');
const manifest = JSON.parse(rawManifest);
const endpoint = process.env.ASSISTANT_EVAL_URL;
const outputPath = process.env.ASSISTANT_EVAL_OUTPUT || '/tmp/assistant-evaluation-report.json';
const delayMs = Number(process.env.ASSISTANT_EVAL_DELAY_MS || 75);

function sameSet(left = [], right = []) {
  return left.length === right.length && left.every((item) => right.includes(item));
}

async function query(question) {
  if (!endpoint) return { ...answerQuestion(question), mode: 'local-deterministic' };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'portfolio-assistant-evaluator/1.0' },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return result;
}

const rows = [];
for (const testCase of manifest.cases) {
  const started = performance.now();
  try {
    const result = await query(testCase.question);
    const actualIds = result.evidenceIds || [];
    const outcomePass = testCase.expectedOutcome === 'abstained'
      ? result.outcome === 'insufficient_evidence'
      : result.outcome === 'answered';
    const evidencePass = testCase.expectedOutcome === 'abstained'
      ? actualIds.length === 0
      : sameSet(actualIds, testCase.expectedEvidenceIds);
    const forbiddenPass = !(testCase.forbiddenEvidenceIds || []).some((id) => actualIds.includes(id));
    rows.push({
      ...testCase,
      actualOutcome: result.outcome,
      actualEvidenceIds: actualIds,
      mode: result.mode || 'local-deterministic',
      pass: outcomePass && evidencePass && forbiddenPass,
      failure: {
        outcome: !outcomePass,
        evidence: !evidencePass,
        forbiddenEvidence: !forbiddenPass,
      },
      latencyMs: Math.round((performance.now() - started) * 100) / 100,
    });
  } catch (error) {
    rows.push({ ...testCase, pass: false, error: error.message, latencyMs: Math.round((performance.now() - started) * 100) / 100 });
  }
}

const categoryMetrics = Object.fromEntries([...new Set(rows.map(({ category }) => category))].map((category) => {
  const selected = rows.filter((row) => row.category === category);
  const passed = selected.filter((row) => row.pass).length;
  return [category, { total: selected.length, passed, accuracy: passed / selected.length }];
}));
const passed = rows.filter((row) => row.pass).length;
const report = {
  schemaVersion: '1.0',
  evaluationSetId: manifest.evaluationSetId,
  manifestSha256: createHash('sha256').update(rawManifest).digest('hex'),
  endpoint: endpoint || 'local-deterministic',
  generatedAt: new Date().toISOString(),
  totals: { cases: rows.length, passed, failed: rows.length - passed, accuracy: passed / rows.length },
  categoryMetrics,
  failures: rows.filter((row) => !row.pass),
  rows,
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: report.totals, categoryMetrics, failureSample: report.failures.slice(0, 10).map(({ id, question, expectedEvidenceIds, actualEvidenceIds, actualOutcome, error }) => ({ id, question, expectedEvidenceIds, actualEvidenceIds, actualOutcome, error })) }, null, 2));
process.exitCode = report.totals.failed ? 1 : 0;
